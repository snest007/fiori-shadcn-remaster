#!/usr/bin/env node
// Smoke test of the registry as a consumer sees it: builds public/r + the docs site, serves it,
// creates a fresh Vite + React 19 + Tailwind v4 app in a temp dir, runs `shadcn init <url>/r/petalo.json`,
// adds every block, renders each block in Chromium and fails on build errors, page errors or console errors.
//
//   node scripts/smoke-install.mjs [--keep] [--registry=http://host/r]
//
// --registry skips the local build/serve and tests a deployed registry instead.
import { spawn, spawnSync } from "node:child_process"
import { mkdtempSync, readdirSync, rmSync, writeFileSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

// Shared by the six recorded usage outputs. Importing this module performs no install or smoke run.
// Preserve smoke's commands, setup files, step labels and rendering behavior when extracting helpers.
export const SHADCN = "shadcn@4.23.0"
export const step = (msg) => console.log(`• ${msg}`)
export function createConsumerHarness(root = resolve(".")) {
  const run = (cmd, cwd = root, env = {}) => {
    const r = spawnSync(cmd, { cwd, shell: true, encoding: "utf8", maxBuffer: 1 << 28, env: { ...process.env, ...env } })
    const out = (r.stdout ?? "") + (r.stderr ?? "")
    if (r.status !== 0) throw new Error(`${cmd} (in ${cwd}) failed:\n${out.split("\n").slice(-30).join("\n")}`)
    return out
  }
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
        if ((await fetch(url, { signal: AbortSignal.timeout(Math.min(10_000, end - Date.now())) })).ok) return
      } catch {}
      await new Promise((r) => setTimeout(r, 300))
    }
    throw new Error(`Timed out waiting for ${url}`)
  }

  function setupConsumer(dir) {
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "fiori-smoke", private: true, type: "module", scripts: { build: "tsc --noEmit && vite build" } }))
    // The strict flags of Vite's react-ts template (create-vite tsconfig.app.json): consumers who start from it run
    // `tsc -b` before `vite build`, so installed registry code must compile under them (an unused parameter in
    // calendar.tsx once broke a fresh consumer's first build while our own, looser tsconfig passed).
    writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022", lib: ["ES2022", "DOM", "DOM.Iterable"], module: "ESNext", moduleResolution: "bundler", jsx: "react-jsx", strict: true, noEmit: true, skipLibCheck: true, noUnusedLocals: true, noUnusedParameters: true, noFallthroughCasesInSwitch: true, noUncheckedSideEffectImports: true, verbatimModuleSyntax: true, types: ["vite/client"], baseUrl: ".", paths: { "@/*": ["./src/*"] } }, include: ["src"] }))
    writeFileSync(join(dir, "vite.config.ts"), `import path from "node:path"\nimport react from "@vitejs/plugin-react"\nimport tailwindcss from "@tailwindcss/vite"\nimport { defineConfig } from "vite"\nexport default defineConfig({ plugins: [react(), tailwindcss()], resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } } })\n`)
    writeFileSync(join(dir, "index.html"), `<!doctype html><html lang="en"><head><meta charset="UTF-8" /></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n`)
    mkdirSync(join(dir, "src"))
    writeFileSync(join(dir, "src/index.css"), `@import "tailwindcss";\n`)
    run("pnpm add react@19 react-dom@19", dir)
    run("pnpm add -D vite@8 @vitejs/plugin-react@6 tailwindcss@4 @tailwindcss/vite@4 typescript@5.9 @types/react@19 @types/react-dom@19 @types/node@24", dir)
  }
  function initRegistry(dir, registry) { run(`npx -y ${SHADCN} init ${registry}/petalo.json --yes`, dir) }
  function addItems(dir, names) {
    if (names.some((name) => !/^[a-z0-9-]+$/.test(name))) throw new Error("Invalid registry item name")
    if (names.length) run(`npx -y ${SHADCN} add ${names.map((name) => `@petalo/${name}`).join(" ")} --yes --overwrite`, dir)
  }
  function stopServers() {
    for (const p of servers) { try { process.kill(-p.pid) } catch {} }
  }
  function restoreRegistry() { spawnSync("pnpm registry:build", { cwd: root, shell: true, stdio: "ignore" }) }
  return { run, serve, waitFor, setupConsumer, initRegistry, addItems, stopServers, restoreRegistry }
}

export async function runSmoke() {
  const root = resolve(".")
  const keep = process.argv.includes("--keep")
  const remote = process.argv.find((a) => a.startsWith("--registry="))?.split("=")[1]
  const REG_PORT = 4312, APP_PORT = 4313
  const { run, serve, waitFor, setupConsumer, initRegistry, addItems, stopServers, restoreRegistry } = createConsumerHarness(root)
  const dir = mkdtempSync(join(tmpdir(), "fiori-smoke-"))
  let failed = false
  try {
    let registry = remote
    if (!registry) {
      step("build registry and site")
      // petalo.json bakes the @petalo namespace URL in (REGISTRY_URL); it must point at the server below.
      const env = { REGISTRY_URL: `http://localhost:${REG_PORT}/r` }
      run("pnpm registry:build", root, env)
      run("pnpm build", root, env)
      await serve(`pnpm exec vite preview --port ${REG_PORT} --strictPort`, root, REG_PORT)
      registry = `http://localhost:${REG_PORT}/r`
    }
    // GitHub Pages may take up to two minutes to propagate a new deployment. Keep local
    // server startup's existing timeout; only the first remote registry fetch waits longer.
    await waitFor(`${registry}/petalo.json`, remote ? 120_000 : 60_000)

    step(`create consumer app in ${dir}`)
    setupConsumer(dir)

    step("shadcn init")
    initRegistry(dir, registry)
    const blocks = readdirSync(join(root, "registry/block-items")).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""))
    step(`shadcn add ${blocks.length} blocks`)
    addItems(dir, blocks)
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
    stopServers()
    if (!keep) rmSync(dir, { recursive: true, force: true })
    // Leave public/r with the default namespace URL so the working tree stays as committed scripts produce it.
    if (!remote) restoreRegistry()
    else console.log(`kept ${dir}`)
  }
  return failed ? 1 : 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = await runSmoke()
