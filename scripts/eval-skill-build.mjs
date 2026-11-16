#!/usr/bin/env node
// Recorded outputs are hand-authored evidence, not snapshots to keep green by editing.
// Re-record them in fresh skill-and-installed-source-only context when guidance changes materially.
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import ts from "typescript"
import { createConsumerHarness, step } from "./smoke-install.mjs"
import { evaluateSkill } from "./eval-skill.mjs"

/** Enforce consumer imports before installing, using syntax rather than text matches/comments. */
export function outputImports(source, file, registry) {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const imports = new Set()
  const modules = new Set()
  let hasDefault = false
  const inspect = (node) => {
    if ((ts.isExportAssignment(node) && !node.isExportEquals) || node.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) hasDefault = true
    let specifier
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) specifier = node.moduleSpecifier
    else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require"))) {
      specifier = node.arguments[0]
      if (!specifier || !ts.isStringLiteralLike(specifier)) throw new Error(`${file}: dynamic imports must use literal modules`)
    }
    if (specifier && ts.isStringLiteralLike(specifier)) {
      const name = specifier.text
      // Installed registry libs are supporting imports. Components and blocks must use their
      // actual consumer aliases; relative/vendor imports cannot bypass expected/blocked checks.
      const match = name.match(/^@\/components\/(ui\/)?([a-z0-9-]+)$/)
      if (match) {
        const item = registry.get(match[2])
        if (!item) throw new Error(`${file}: unknown imported registry item ${match[2]}`)
        if (match[1] ? item.type !== "registry:ui" : item.type !== "registry:block") throw new Error(`${file}: wrong consumer import path ${name}`)
        modules.add(match[2])
        let hasValue = true
        if (ts.isImportDeclaration(node)) {
          const clause = node.importClause
          hasValue = !clause || (!clause.isTypeOnly && (!!clause.name || (clause.namedBindings &&
            (ts.isNamespaceImport(clause.namedBindings) || clause.namedBindings.elements.some((element) => !element.isTypeOnly)))))
        } else if (ts.isExportDeclaration(node)) {
          // TypeScript erases both `export type ...` and individual `type` specifiers.
          // Value/star/namespace re-exports still load the module; mixed named exports count
          // only when at least one value remains. Keep modules above even for erased exports.
          hasValue = !node.isTypeOnly && (!node.exportClause || ts.isNamespaceExport(node.exportClause)
            || node.exportClause.elements.some((element) => !element.isTypeOnly))
        }
        if (hasValue) imports.add(match[2])
      } else if (name !== "react" && name !== "react/jsx-runtime" && !/^@\/lib\/[a-z0-9-/]+$/.test(name)) {
        throw new Error(`${file}: unsupported consumer import ${name}`)
      }
    }
    ts.forEachChild(node, inspect)
  }
  inspect(ast)
  if (!hasDefault) throw new Error(`${file}: output must default-export a React component`)
  return { runtime: [...imports].sort(), modules: [...modules].sort() }
}

export function validateOutputs(root, cases, outputRoot = join(root, "skills/shadcn-fiori/evals/outputs")) {
  const manifest = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"))
  // Icon is shipped by the library item "icons" but imported through components/ui/icon.
  const registry = new Map(manifest.items.map((item) => [item.name, item]))
  registry.set("icon", { type: "registry:ui" })
  const pages = cases.filter((entry) => entry.output).map((entry) => {
    if (!/^[a-z0-9-]+\.tsx$/.test(entry.output) || entry.output !== `${entry.id}.tsx`) throw new Error(`${entry.id}: invalid output filename`)
    const path = join(outputRoot, entry.output)
    if (!existsSync(path)) throw new Error(`${entry.id}: missing recorded output ${path}`)
    const parsed = outputImports(readFileSync(path, "utf8"), entry.output, registry)
    const imports = parsed.runtime
    const expected = [...(entry.expect.components ?? []), ...(entry.expect.block ? [entry.expect.block] : [])]
    for (const name of expected) if (!imports.includes(name)) throw new Error(`${entry.id}: missing expected import ${name}`)
    for (const name of entry.expect.notComponents ?? []) if (parsed.modules.includes(name)) throw new Error(`${entry.id}: blocked import ${name}`)
    return { ...entry, path, imports }
  })
  if (pages.length !== 6 || pages.filter((page) => page.expect.block).length < 3 || pages.filter((page) => page.expect.components?.length && !page.expect.block).length < 3) throw new Error("Record exactly six outputs: at least three floorplans and three component-choice pages")
  return pages
}

export async function buildSkillOutputs({ root = resolve("."), evalPath, outputRoot, keep = false, registryPort = Number(process.env.EVAL_REGISTRY_PORT ?? 4342), appPort = Number(process.env.EVAL_APP_PORT ?? 4343) } = {}) {
  if (!Number.isInteger(registryPort) || !Number.isInteger(appPort) || registryPort === appPort || [registryPort, appPort].some((p) => p < 1024 || p > 65535)) throw new Error("Eval ports must be distinct valid nonprivileged ports")
  const evaluation = evaluateSkill(root, evalPath)
  if (!evaluation.ok) throw new Error("Routing evaluation failed; run node scripts/eval-skill.mjs")
  const harness = createConsumerHarness(root)
  const dir = mkdtempSync(join(tmpdir(), "fiori-usage-eval-"))
  let browser
  try {
    step("build registry and site for recorded usage outputs")
    const registry = `http://localhost:${registryPort}/r`
    harness.run("pnpm registry:build", root, { REGISTRY_URL: registry })
    // Validate after generation to catch stale registry metadata while preserving eval evidence.
    const pages = validateOutputs(root, evaluation.cases, outputRoot)
    harness.run("pnpm build", root)
    await harness.serve(`pnpm exec vite preview --port ${registryPort} --strictPort`, root, registryPort)
    await harness.waitFor(`${registry}/fiori.json`)
    step(`create eval consumer app in ${dir}`)
    harness.setupConsumer(dir)
    step("shadcn init")
    harness.initRegistry(dir, registry)
    const imported = [...new Set(pages.flatMap((page) => page.imports).map((name) => name === "icon" ? "icons" : name))].sort()
    step(`shadcn add ${imported.length} imported items`)
    harness.addItems(dir, imported)
    mkdirSync(join(dir, "src/evals"), { recursive: true })
    for (const page of pages) copyFileSync(page.path, join(dir, "src/evals", page.output))
    writeFileSync(join(dir, "src/main.tsx"), [
      'import { createRoot } from "react-dom/client"',
      ...pages.map((page, i) => `import Page${i} from "./evals/${page.id}"`),
      'import "./index.css"',
      `const pages = { ${pages.map((page, i) => `"${page.id}": Page${i}`).join(", ")} }`,
      `const Page = pages[(new URLSearchParams(location.search).get("p") ?? "${pages[0].id}") as keyof typeof pages]`,
      'createRoot(document.getElementById("root")!).render(<Page />)',
    ].join("\n") + "\n")
    step("typecheck the six recorded outputs")
    harness.run("pnpm exec tsc --noEmit", dir)
    step("build the six recorded outputs")
    harness.run("pnpm exec vite build", dir)
    step(`render six recorded outputs (ports ${registryPort}/${appPort})`)
    await harness.serve(`npx vite preview --port ${appPort} --strictPort`, dir, appPort)
    const { chromium } = await import(join(root, "node_modules/@playwright/test/index.mjs"))
    browser = await chromium.launch()
    const problems = []
    for (const output of pages) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
      const errors = []
      page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`))
      page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`) })
      try {
        await page.goto(`http://localhost:${appPort}/?p=${output.id}`)
        await page.waitForFunction(() => (document.querySelector("#root")?.textContent ?? "").trim().length > 0)
        await page.evaluate(async () => { await document.fonts.ready; await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))) })
        if (errors.length) problems.push(`${output.id}: ${errors.join(" | ")}`)
      } catch (error) { problems.push(`${output.id}: ${error.message}${errors.length ? ` | ${errors.join(" | ")}` : ""}`) }
      finally { await page.close() }
    }
    if (problems.length) throw new Error(`recorded outputs with errors:\n  ${problems.join("\n  ")}`)
    console.log("✔ skill output build OK: 6 pages imported expected items, typechecked, built and rendered without errors")
    return { dir, pages: pages.map((page) => page.id) }
  } finally {
    await browser?.close()
    harness.stopServers()
    harness.restoreRegistry()
    if (!keep) rmSync(dir, { recursive: true, force: true })
    else console.log(`kept ${dir}`)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const argument = (name) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3)
    await buildSkillOutputs({ keep: process.argv.includes("--keep"), evalPath: argument("evals") && resolve(argument("evals")), outputRoot: argument("outputs") && resolve(argument("outputs")) })
  } catch (error) { console.error(`✖ skill output build FAILED: ${error.message}`); process.exitCode = 1 }
}
