#!/usr/bin/env node
// Smoke test of the registry as a consumer sees it: builds public/r + the docs site, serves it,
// creates a fresh Vite + React 19 + Tailwind v4 app in a temp dir, runs `shadcn init <url>/r/fiori.json`,
// adds every block, renders each block in Chromium and fails on build errors, page errors or console errors.
//
//   node scripts/smoke-install.mjs [--keep] [--registry=http://host/r]
//
// --registry skips the local build/serve and tests a deployed registry instead.
import { spawn, spawnSync } from "node:child_process"
import { mkdtempSync, readdirSync, rmSync, writeFileSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

const root = resolve(".")
const keep = process.argv.includes("--keep")
const remote = process.argv.find((a) => a.startsWith("--registry="))?.split("=")[1]
const REG_PORT = 4312, APP_PORT = 4313
const SHADCN = "shadcn@4.23.0"

const run = (cmd, cwd = root, env = {}) => {
  const r = spawnSync(cmd, { cwd, shell: true, encoding: "utf8", maxBuffer: 1 << 28, env: { ...process.env, ...env } })
  const out = (r.stdout ?? "") + (r.stderr ?? "")
  if (r.status !== 0) throw new Error(`${cmd} (in ${cwd}) failed:\n${out.split("\n").slice(-30).join("\n")}`)
  return out
}
const step = (msg) => console.log(`• ${msg}`)
const servers = []
const serve = (cmd, cwd, port) => {
  const p = spawn(cmd, { cwd, shell: true, stdio: "ignore", detached: true })
  servers.push(p)
  return waitFor(`http://localhost:${port}/`)
}
async function waitFor(url, ms = 60_000) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    try {
      if ((await fetch(url)).ok) return
    } catch {}
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

const dir = mkdtempSync(join(tmpdir(), "fiori-smoke-"))
let failed = false
try {
  let registry = remote
  if (!registry) {
    step("build registry and site")
    // fiori.json bakes the @fiori namespace URL in (REGISTRY_URL); it must point at the server below.
    const env = { REGISTRY_URL: `http://localhost:${REG_PORT}/r` }
    run("pnpm registry:build", root, env)
    run("pnpm build", root, env)
    await serve(`pnpm exec vite preview --port ${REG_PORT} --strictPort`, root, REG_PORT)
    registry = `http://localhost:${REG_PORT}/r`
  }
  await waitFor(`${registry}/fiori.json`)

  step(`create consumer app in ${dir}`)
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "fiori-smoke", private: true, type: "module", scripts: { build: "tsc --noEmit && vite build" } }))
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022", lib: ["ES2022", "DOM", "DOM.Iterable"], module: "ESNext", moduleResolution: "bundler", jsx: "react-jsx", strict: true, noEmit: true, skipLibCheck: true, baseUrl: ".", paths: { "@/*": ["./src/*"] } }, include: ["src"] }))
  writeFileSync(join(dir, "vite.config.ts"), `import path from "node:path"\nimport react from "@vitejs/plugin-react"\nimport tailwindcss from "@tailwindcss/vite"\nimport { defineConfig } from "vite"\nexport default defineConfig({ plugins: [react(), tailwindcss()], resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } } })\n`)
  writeFileSync(join(dir, "index.html"), `<!doctype html><html lang="en"><head><meta charset="UTF-8" /></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n`)
  mkdirSync(join(dir, "src"))
  writeFileSync(join(dir, "src/index.css"), `@import "tailwindcss";\n`)
  run("pnpm add react@19 react-dom@19", dir)
  run("pnpm add -D vite@8 @vitejs/plugin-react@6 tailwindcss@4 @tailwindcss/vite@4 typescript@5.9 @types/react@19 @types/react-dom@19 @types/node@24", dir)

  step("shadcn init")
  run(`npx -y ${SHADCN} init ${registry}/fiori.json --yes`, dir)
  const blocks = readdirSync(join(root, "registry/block-items")).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""))
  step(`shadcn add ${blocks.length} blocks`)
  run(`npx -y ${SHADCN} add ${blocks.map((b) => `@fiori/${b}`).join(" ")} --yes --overwrite`, dir)
  const components = readdirSync(join(dir, "src/components/ui")).length

  const ident = (b) => b.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())
  writeFileSync(join(dir, "src/main.tsx"), [
    `import { createRoot } from "react-dom/client"`,
    ...blocks.map((b) => `import ${ident(b)} from "@/components/${b}"`),
    `import "./index.css"`,
    `const pages = { ${blocks.map((b) => `"${b}": ${ident(b)}`).join(", ")} }`,
    `const P = pages[(new URLSearchParams(location.search).get("p") ?? "${blocks[0]}") as keyof typeof pages]`,
    `createRoot(document.getElementById("root")!).render(<P />)`,
  ].join("\n") + "\n")

  step("typecheck + build the consumer app")
  run("pnpm build", dir)

  step("render every block")
  await serve(`npx vite preview --port ${APP_PORT} --strictPort`, dir, APP_PORT)
  const { chromium } = await import(join(root, "node_modules/@playwright/test/index.mjs"))
  const browser = await chromium.launch()
  const problems = []
  for (const b of blocks) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    const errs = []
    page.on("pageerror", (e) => errs.push(e.message))
    page.on("console", (m) => m.type() === "error" && errs.push(m.text()))
    await page.goto(`http://localhost:${APP_PORT}/?p=${b}`)
    await page.waitForTimeout(800)
    const text = (await page.locator("#root").innerText()).trim()
    if (!text) errs.push("rendered nothing")
    if (errs.length) problems.push(`${b}: ${errs.slice(0, 3).join(" | ")}`)
    await page.close()
  }
  await browser.close()
  if (problems.length) throw new Error(`blocks with errors:\n  ${problems.join("\n  ")}`)
  console.log(`✔ smoke install OK: ${components} components, ${blocks.length} blocks built and rendered without errors`)
} catch (e) {
  failed = true
  console.error(`✖ smoke install FAILED: ${e.message}`)
} finally {
  for (const p of servers) {
    try {
      process.kill(-p.pid)
    } catch {}
  }
  if (!keep) rmSync(dir, { recursive: true, force: true })
  // Leave public/r with the default namespace URL so the working tree stays as committed scripts produce it.
  if (!remote) spawnSync("pnpm registry:build", { cwd: root, shell: true, stdio: "ignore" })
  else console.log(`kept ${dir}`)
}
process.exit(failed ? 1 : 0)
