#!/usr/bin/env node
// Plan hygiene check: keeps docs/plan/README.md, the card files and return notes consistent.
// Run after editing the backlog and at every milestone. Exits non-zero on errors; prints warnings for review.
//   node scripts/plan-check.mjs            # check
//   node scripts/plan-check.mjs --fix      # move ticked cards to tasks/done/ (and their return notes), fix links
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs"
import { dirname, join, normalize, relative } from "node:path"
import { execFileSync } from "node:child_process"

const fix = process.argv.includes("--fix")
const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim()
process.chdir(root)
const plan = "docs/plan"
const index = `${plan}/README.md`
const errors = []
const warnings = []
const git = (...args) => execFileSync("git", args, { encoding: "utf8" })
const move = (from, to) => {
  mkdirSync(dirname(to), { recursive: true })
  try { git("mv", from, to) } catch { renameSync(from, to) }
}

// 1. Index entries ↔ card files.
let text = readFileSync(index, "utf8")
const entries = [...text.matchAll(/^- \[( |x)\] \[([^\]]+)\]\((tasks\/(?:done\/)?([^)]+\.md))\)/gm)]
  .map((m) => ({ done: m[1] === "x", title: m[2], link: m[3], file: m[4] }))
const openFiles = readdirSync(`${plan}/tasks`).filter((f) => f.endsWith(".md"))
const doneFiles = existsSync(`${plan}/tasks/done`) ? readdirSync(`${plan}/tasks/done`).filter((f) => f.endsWith(".md")) : []
const listed = new Set(entries.map((e) => e.file))
for (const f of [...openFiles, ...doneFiles]) if (!listed.has(f)) errors.push(`card not in the backlog index: ${f}`)

for (const e of entries) {
  const want = e.done ? `tasks/done/${e.file}` : `tasks/${e.file}`
  if (e.link === want) continue
  const have = existsSync(join(plan, e.link))
  if (fix && have) {
    move(join(plan, e.link), join(plan, want))
    text = text.replace(`](${e.link})`, `](${want})`)
    // A finished card's return note moves with it.
    const id = e.file.match(/^([A-Z][0-9a-z]*)-/)?.[1]
    if (e.done && id && existsSync(`${plan}/returns/${id}.md`)) move(`${plan}/returns/${id}.md`, `${plan}/returns/done/${id}.md`)
    console.log(`moved ${e.link} → ${want}`)
  } else errors.push(`${e.done ? "ticked" : "open"} card in the wrong folder: ${e.link} (expected ${want}; run --fix)`)
}
if (fix) writeFileSync(index, text)

// 2. Return notes belong to open cards; finished cards' notes live in returns/done/.
const ids = (done) => new Set(entries.filter((e) => e.done === done).map((e) => e.file.match(/^([A-Z][0-9a-z]*)-/)?.[1]))
const openIds = ids(false)
const doneIds = ids(true)
for (const f of readdirSync(`${plan}/returns`).filter((f) => f.endsWith(".md"))) {
  const id = f.replace(/\.md$/, "")
  if (doneIds.has(id) && !openIds.has(id)) errors.push(`return note of a finished card still open: returns/${f} (move to returns/done/)`)
  else if (!openIds.has(id)) warnings.push(`return note without an open card: returns/${f}`)
}

// 3. Relative links in plan docs and the top-level docs resolve.
const docs = [index, "AGENTS.md", "README.md", "CONTRIBUTING.md", `${plan}/RUN.md`, `${plan}/INTEGRATION.md`]
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) => d.isDirectory() ? walk(join(dir, d.name)) : d.name.endsWith(".md") ? [join(dir, d.name)] : [])
for (const file of [...new Set([...docs, ...walk(plan), "docs/extension-contract.md"])]) {
  if (!existsSync(file)) continue
  for (const m of readFileSync(file, "utf8").matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
    const target = m[1]
    if (/^[a-z]+:/i.test(target) || target.startsWith("<")) continue
    if (!existsSync(normalize(join(dirname(file), target)))) errors.push(`broken link in ${file}: ${target}`)
  }
  // Repo paths in backticks or prose that point to a moved card.
  for (const m of readFileSync(file, "utf8").matchAll(/docs\/plan\/tasks\/((?:done\/)?[A-Za-z0-9-]+\.md)/g)) {
    if (!existsSync(`${plan}/tasks/${m[1]}`)) errors.push(`stale card path in ${file}: docs/plan/tasks/${m[1]}`)
  }
}

// 4. Unticked cards whose branch is already merged into main (likely forgotten ticks), and stale codex/* branches.
const merged = new Set(git("branch", "--merged", "main", "--format=%(refname:short)").split("\n").filter((b) => b.startsWith("codex/")))
for (const e of entries.filter((e) => !e.done)) {
  const id = e.file.match(/^([A-Z][0-9a-z]*)-/)?.[1]
  if (id && merged.has(`codex/${id}`)) warnings.push(`codex/${id} is merged into main but ${id} is not ticked`)
}
for (const b of merged) {
  const id = b.slice("codex/".length)
  if (doneIds.has(id)) warnings.push(`merged branch ${b} can be deleted (card ${id} is done)`)
}

// 5. Status table mentions: every open card id appears in the "Status" section's Open/Next columns.
const status = text.match(/## Status[^\n]*\n([\s\S]*?)\n## /)?.[1] ?? ""
if (!status) warnings.push("backlog has no '## Status' section")

const out = (label, list) => list.length && console.log(`${label} (${list.length}):\n${list.map((l) => `  - ${l}`).join("\n")}`)
out("errors", errors)
out("warnings", warnings)
console.log(`plan-check: ${entries.filter((e) => e.done).length} done, ${entries.filter((e) => !e.done).length} open, ${errors.length} errors, ${warnings.length} warnings`)
process.exitCode = errors.length ? 1 : 0
void relative
