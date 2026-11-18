// Node 24 strips the helper's TypeScript types. This CLI and the running specs
// share the exact same identity/classification/ownership implementation.
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { baselineCounts, entryKey, groups, parseTreeBaseline, reportEntries } from "../tests/a11y-tree-baseline.ts"
import { requireCompleteCapture } from "../tests/a11y-tree-coverage.ts"
const args = process.argv.slice(2), file = "tests/a11y-tree-baseline.json"
const reportPath = args.includes("--report") ? args[args.indexOf("--report") + 1] : "test-results/a11y-tree-report.json"
const command = args.find((arg) => ["--write", "--list", "--prune"].includes(arg))
if (!command) throw new Error("Use --write (E4 initial creation only), --list <owner>, or --prune <owner>; optional --report <capture>")
const loadReport = (complete = false) => {
  const report = JSON.parse(readFileSync(reportPath, "utf8"))
  const matrices = new Set(Object.keys(report).map((key) => key.split("/").slice(0, 2).join("/")))
  for (const matrix of ["webcomponents/ltr", "webcomponents/rtl", "phone/ltr", "openui5/ltr"]) if (!matrices.has(matrix)) throw new Error(`Incomplete report: missing ${matrix}`)
  const captureCounts = complete ? requireCompleteCapture(report, reportPath) : undefined
  return { report, entries: reportEntries(report), captureCounts }
}
if (command === "--write") {
  if (existsSync(file)) throw new Error("Baseline already exists; use the owning card's --prune, never overwrite/grow it")
  const { entries, captureCounts } = loadReport(true)
  writeFileSync(file, JSON.stringify({ version: 1, entries }, null, 2) + "\n")
  console.log(JSON.stringify({ ...baselineCounts(entries), captureCounts }, null, 2))
} else {
  const owner = args[args.indexOf(command) + 1]
  if (!groups[owner]) throw new Error(`Unknown owner ${owner}`)
  const baseline = parseTreeBaseline(JSON.parse(readFileSync(file, "utf8")))
  if (command === "--list") console.log(JSON.stringify(baseline.entries.filter((entry) => entry.owner === owner), null, 2))
  else {
    const { report, entries } = loadReport(), actual = new Set(entries.map(entryKey))
    // An uncaptured/filtered case is not proof that its known defect was fixed.
    for (const entry of baseline.entries.filter((entry) => entry.owner === owner)) if (!report[`${entry.matrix}/${entry.caseId}`]) throw new Error(`Cannot prune uncaptured case ${entry.matrix}/${entry.caseId}`)
    const kept = baseline.entries.filter((entry) => entry.owner !== owner || actual.has(entryKey(entry)))
    writeFileSync(file, JSON.stringify({ ...baseline, entries: kept }, null, 2) + "\n")
    console.log(`Pruned ${baseline.entries.length - kept.length} stale ${owner} entries; other owners unchanged`)
    console.log(JSON.stringify(baselineCounts(kept), null, 2))
  }
}
