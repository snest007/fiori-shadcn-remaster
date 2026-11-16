import { test, expect } from "@playwright/test"
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const builder = join(root, "scripts/build-registry-json.mjs")
const skillBuilder = join(root, "scripts/build-skill.mjs")
const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"))
const tableItem = readJson(join(root, "registry/items/table.json"))
const listReport = readJson(join(root, "registry/block-items/list-report.json"))
const run = (script: string, cwd: string, args: string[] = []) => spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8" })
const write = (root: string, path: string, content: string) => {
  mkdirSync(dirname(join(root, path)), { recursive: true })
  writeFileSync(join(root, path), content)
}

test("usage docs show pilot guidance above props and navigate to an alternative", async ({ page }) => {
  await page.goto("/#/table")
  const main = page.locator('main[data-docs-route="table"]')
  await expect(main.getByRole("heading", { name: "When to use", exact: true })).toBeVisible()
  const guidance = main.locator("[data-usage-guidance]")
  for (const bullet of tableItem.usage.useWhen) await expect(guidance.getByText(bullet, { exact: true })).toBeVisible()
  for (const bullet of tableItem.usage.avoidWhen) await expect(guidance.getByText(bullet.when, { exact: false })).toBeVisible()
  expect(await main.evaluate((node) => {
    const usage = node.querySelector("[data-usage-guidance]")!
    const props = node.querySelector("caption")!
    return !!(usage.compareDocumentPosition(props) & Node.DOCUMENT_POSITION_FOLLOWING)
  })).toBe(true)
  await guidance.getByRole("link", { name: "DataTable", exact: true }).click()
  await expect(page.locator('main[data-docs-route="data-table"]')).toBeVisible()
  await expect(page).toHaveURL(/#\/data-table$/)
})

test("items without usage do not render an empty guidance section", async ({ page }) => {
  await page.goto("/#/button")
  const main = page.locator('main[data-docs-route="button"]')
  await expect(main.getByText("Main props", { exact: true })).toBeVisible()
  await expect(main.getByRole("heading", { name: "When to use", exact: true })).toHaveCount(0)
  await expect(main.locator("[data-usage-guidance]")).toHaveCount(0)
})

test("floorplans show the list-report layout, use case and variations", async ({ page }) => {
  await page.goto("/#/floorplans")
  const report = page.locator('main section').filter({ has: page.getByRole("heading", { name: "List Report", exact: true }) })
  await expect(report.locator("[data-usage-guidance] pre code")).toHaveText(listReport.usage.layout.join("\n"))
  await expect(report.getByText(listReport.usage.summary, { exact: true })).toBeVisible()
  for (const variation of listReport.usage.variations) await expect(report.getByText(variation, { exact: true })).toBeVisible()
  await report.locator('[data-usage-guidance] a[href="#/object-page-floorplan"]').click()
  await expect(page.locator('main[data-docs-route="object-page-floorplan"]')).toBeVisible()
  await expect(page).toHaveURL(/#\/object-page-floorplan$/)
  await expect(page.locator('main[data-docs-route="object-page-floorplan"] a').filter({ hasText: "Open Object Page" })).toBeVisible()
})

test("shadcn build preserves usage in both the registry payload and markdown docs", async () => {
  const item = readJson(join(root, "public/r/table.json"))
  expect(item.meta.usage).toEqual(tableItem.usage)
  for (const bullet of tableItem.usage.useWhen) expect(item.docs).toContain(bullet)
  expect(item.docs).toContain("[data-table](#/data-table)")
})

test("skill generation converges, removes stale files and parses compound demos and exports", async () => {
  const temp = mkdtempSync(join(tmpdir(), "fiori-skill-"))
  try {
    for (const folder of ["registry/items", "registry/block-items", "registry/ui", "registry/blocks", "registry/lib", "docs/src/demos", "scripts/skill"]) {
      cpSync(join(root, folder), join(temp, folder), { recursive: true })
    }
    expect(run(skillBuilder, temp).status).toBe(0)
    // Compare the generated baseline with committed outputs, including filenames, before staging a
    // temporary Git index. This tests source/output drift as well as repeated-run determinism.
    const tree = (folder: string): Record<string, string> => Object.fromEntries(readdirSync(folder, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile()).map((entry) => {
        const path = join(entry.parentPath, entry.name)
        return [path.slice(folder.length + 1), readFileSync(path, "utf8")]
      }))
    expect(tree(join(temp, "skills/shadcn-fiori"))).toEqual(tree(join(root, "skills/shadcn-fiori")))
    expect(spawnSync("git", ["init", "--quiet"], { cwd: temp }).status).toBe(0)
    expect(spawnSync("git", ["add", "skills/"], { cwd: temp }).status).toBe(0)
    write(temp, "skills/shadcn-fiori/references/stale.md", "obsolete\n")
    write(temp, "skills/shadcn-fiori/old-category/obsolete.md", "obsolete\n")
    for (let pass = 0; pass < 2; pass++) {
      expect(run(skillBuilder, temp).status).toBe(0)
      const diff = spawnSync("git", ["diff", "--exit-code", "skills/"], { cwd: temp, encoding: "utf8" })
      expect(diff.stdout).toBe("")
      expect(diff.status).toBe(0)
      expect(tree(join(temp, "skills/shadcn-fiori"))).toEqual(tree(join(root, "skills/shadcn-fiori")))
    }
    const data = readFileSync(join(temp, "skills/shadcn-fiori/references/data.md"), "utf8")
    expect(data).toContain("## table")
    expect(data).toContain("## data-table")
    expect(data).toContain("`createDataTableColumnHelper`")
    expect(data).not.toContain("`DataTableProps`")
    // Exercise the parser with a new compound demo and an aliased runtime export, without maintaining
    // a parallel category/export list in the generator.
    write(temp, "docs/src/demos/usage-probe.tsx", 'export default defineDemo({ category: "Data", docs: [{ name: "usage-probe" }], Demo() {} })\n')
    write(temp, "registry/items/usage-probe.json", JSON.stringify({ title: "Probe" }))
    write(temp, "registry/ui/usage-probe.tsx", 'const Probe = () => null; type ProbeProps = {}; export { Probe as UsageProbe, type ProbeProps }; export function useUsageProbe() {}\n')
    expect(run(skillBuilder, temp).status).toBe(0)
    const updated = readFileSync(join(temp, "skills/shadcn-fiori/references/data.md"), "utf8")
    expect(updated).toContain("## usage-probe")
    expect(updated).toContain("Main exports: `UsageProbe`, `useUsageProbe`.")
    expect(updated).not.toContain("`ProbeProps`")
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
})

test("usage validation rejects invalid alternatives, counts, layouts and required coverage", async () => {
  const temp = mkdtempSync(join(tmpdir(), "fiori-usage-"))
  const usage = { summary: "Show records.", useWhen: ["Compare records.", "Select records."], avoidWhen: [{ when: "Choose a field value.", use: ["select"] }], source: "sap-fiori-guidelines" }
  try {
    write(temp, "registry/styles/shadcn-vars.json", "{}")
    write(temp, "registry/lib/fiori-illustrations/registry-items.json", "[]")
    write(temp, "registry/items/table.json", JSON.stringify({ title: "Table", usage }))
    write(temp, "registry/items/select.json", JSON.stringify({ title: "Select" }))
    write(temp, "registry/items/helper.json", JSON.stringify({ title: "Helper", type: "registry:lib" }))
    write(temp, "registry/ui/table.tsx", "function Table() {} export { Table }")
    write(temp, "registry/ui/select.tsx", "function Select() {} export { Select }")
    mkdirSync(join(temp, "registry/block-items"), { recursive: true })
    expect(run(builder, temp).status).toBe(0)
    for (const [invalid, message] of [
      [{ ...usage, avoidWhen: [{ when: "Unknown.", use: ["does-not-exist"] }] }, 'unknown usage alternative "does-not-exist"'],
      [{ ...usage, useWhen: ["Only one."] }, "usage.useWhen"],
      [{ ...usage, useWhen: Array(6).fill("Too many.") }, "usage.useWhen"],
      [{ ...usage, avoidWhen: [] }, "usage.avoidWhen"],
      [{ ...usage, avoidWhen: Array(6).fill({ when: "Too many." }) }, "usage.avoidWhen"],
      [null, "usage must be an object"],
    ] as const) {
      write(temp, "registry/items/table.json", JSON.stringify({ title: "Table", usage: invalid }))
      const result = run(builder, temp)
      expect(result.status).not.toBe(0)
      expect(result.stderr).toContain(message)
    }
    write(temp, "registry/items/table.json", JSON.stringify({ title: "Table", usage }))
    for (const [layout, dependencies, message] of [
      [["UnknownControl"], ["@fiori/table"], 'unknown layout export "UnknownControl"'],
      [["Select"], ["@fiori/table"], 'layout export "Select" needs a direct registryDependency'],
    ] as const) {
      write(temp, "registry/block-items/report.json", JSON.stringify({ title: "Report", registryDependencies: dependencies, usage: { ...usage, layout } }))
      const result = run(builder, temp)
      expect(result.status).not.toBe(0)
      expect(result.stderr).toContain(message)
    }
    write(temp, "registry/block-items/report.json", JSON.stringify({ title: "Report", registryDependencies: ["@fiori/table"], usage: { ...usage, layout: ["Table"] } }))
    expect(run(builder, temp).status).toBe(0)
    const required = run(builder, temp, ["--require-usage"])
    expect(required.status).not.toBe(0)
    expect(required.stderr).toContain("select: missing usage (--require-usage)")
    write(temp, "registry/items/select.json", JSON.stringify({ title: "Select", usage }))
    expect(run(builder, temp, ["--require-usage"]).status).toBe(0) // registry:lib helper remains exempt
    write(temp, "registry/block-items/report.json", JSON.stringify({ title: "Report" }))
    const missingBlock = run(builder, temp, ["--require-usage"])
    expect(missingBlock.status).not.toBe(0)
    expect(missingBlock.stderr).toContain("report: missing usage (--require-usage)")
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
})
