#!/usr/bin/env node
// Offline routing evidence only: prompts are deliberately not interpreted. The separate blind
// manual read evaluates choices; eval-skill-build checks the recorded consumer pages.
import { readFileSync } from "node:fs"
import { resolve, join } from "node:path"
import { pathToFileURL } from "node:url"
import { componentOwners, iconsItem, itemMetadata, validateUsage } from "./skill/usage.mjs"

export function evaluateSkill(root = resolve("."), evalPath = join(root, "skills/shadcn-fiori/evals/evals.json")) {
  const components = itemMetadata(join(root, "registry/items")).map((item) => ({ ...item, type: item.type ?? "registry:ui" }))
  const blocks = itemMetadata(join(root, "registry/block-items")).map((item) => ({ ...item, type: "registry:block" }))
  const assets = JSON.parse(readFileSync(join(root, "registry/lib/fiori-illustrations/registry-items.json"), "utf8"))
  const items = [...components, ...blocks, ...assets, iconsItem, { name: "fiori" }, { name: "fiori-theme" }]
  validateUsage(items, componentOwners(root, [...components, ...blocks, iconsItem]), { requireUsage: true })
  const byName = new Map(items.map((item) => [item.name, item]))
  const skill = readFileSync(join(root, "skills/shadcn-fiori/SKILL.md"), "utf8")
  const input = JSON.parse(readFileSync(evalPath, "utf8"))
  const cases = Array.isArray(input) ? input : input.evals
  if (!Array.isArray(cases) || !cases.length) throw new Error("evals.json must contain nonempty evals")
  const ids = new Set()
  const rows = cases.map((entry, index) => {
    const id = entry.id ?? `case-${index + 1}`
    const errors = []
    if (!/^[a-z0-9-]+$/.test(id) || ids.has(id)) errors.push("invalid or duplicate case ID")
    ids.add(id)
    if (typeof entry.prompt !== "string" || !entry.prompt.trim()) errors.push("missing prompt")
    const expected = entry.expect
    if (!expected || typeof expected !== "object" || Array.isArray(expected)) errors.push("missing expect")
    const names = expected?.components ?? []
    const excluded = expected?.notComponents ?? []
    if (!Array.isArray(names) || !Array.isArray(excluded) || names.some((name) => typeof name !== "string") || excluded.some((name) => typeof name !== "string")) errors.push("components/notComponents must be string arrays")
    const targets = [...(Array.isArray(names) ? names : []), ...(expected?.block ? [expected.block] : [])]
    if (!targets.length) errors.push("no expected answer")
    for (const name of [...targets, ...(Array.isArray(excluded) ? excluded : [])]) if (!byName.has(name)) errors.push(`unknown registry item: ${name}`)
    for (const name of Array.isArray(names) ? names : []) if (byName.has(name) && byName.get(name).type !== "registry:ui") errors.push(`expected component is not registry:ui: ${name}`)
    if (expected?.block) {
      if (byName.has(expected.block) && byName.get(expected.block).type !== "registry:block") errors.push(`expected block is not registry:block: ${expected.block}`)
      // Require an actual picker row, not a name somewhere else in the skill.
      if (!skill.split("\n").some((line) => line.startsWith(`| [${expected.block}](references/floorplans.md#${expected.block}) |`))) errors.push(`missing floorplan picker row: ${expected.block}`)
    }
    for (const name of Array.isArray(excluded) ? excluded : []) {
      if (targets.includes(name)) errors.push(`both expected and excluded: ${name}`)
      const alternatives = byName.get(name)?.usage?.avoidWhen.flatMap((avoid) => avoid.use ?? []) ?? []
      if (byName.has(name) && !targets.some((target) => alternatives.includes(target))) errors.push(`no avoidance edge from ${name} to ${targets.join(", ")}`)
    }
    return { id, expected: targets.join(", "), excluded: Array.isArray(excluded) ? excluded.join(", ") : "invalid", status: errors.length ? "FAIL" : "PASS", errors: errors.join("; ") }
  })
  for (const block of blocks) if (!cases.some((entry) => entry.expect?.block === block.name)) rows.push({ id: "coverage", expected: block.name, status: "FAIL", errors: "block has no evaluation case" })
  return { cases, rows, ok: rows.every((row) => row.status === "PASS") }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const evalPath = process.argv.find((arg) => arg.startsWith("--evals="))?.slice(8)
    const result = evaluateSkill(resolve("."), evalPath && resolve(evalPath))
    console.table(result.rows)
    console.log(`${result.ok ? "✔" : "✖"} skill routing eval: ${result.rows.filter((row) => row.status === "PASS").length}/${result.rows.length} passed (offline, deterministic)`)
    process.exitCode = result.ok ? 0 : 1
  } catch (error) { console.error(`✖ skill routing eval FAILED: ${error.message}`); process.exitCode = 1 }
}
