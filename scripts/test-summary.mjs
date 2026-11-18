#!/usr/bin/env node
// Keep both reporters' full output on disk; only the result crosses the agent's context.
import { spawn } from "node:child_process"
import { constants } from "node:os"
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, createWriteStream } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { once } from "node:events"

const stamp = `${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}`
// Playwright clears test-results at startup, so write elsewhere until it finishes.
const temporary = mkdtempSync(join(tmpdir(), "petalo-test-summary-"))
const fullLog = join(temporary, "playwright.log")
const reportFile = join(temporary, "results.json")
const savedLogs = existsSync("test-results") ? readdirSync("test-results").filter((name) => /^summary-.*\.log$/.test(name)) : []
for (const name of savedLogs) cpSync(join("test-results", name), join(temporary, name))
const log = createWriteStream(fullLog)
const started = Date.now()
const child = spawn("pnpm", ["exec", "playwright", "test", ...process.argv.slice(2), "--reporter=list,json"], {
  env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_FILE: reportFile },
  stdio: ["inherit", "pipe", "pipe"],
})
child.stdout.pipe(log, { end: false })
child.stderr.pipe(log, { end: false })
let spawnError
child.on("error", (error) => { spawnError = error; log.write(`${error.message}\n`) })
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal))
const [code, signal] = await once(child, "close")
log.end()
await once(log, "finish")
mkdirSync("test-results", { recursive: true })
for (const name of savedLogs) cpSync(join(temporary, name), join("test-results", name))
const logPath = `test-results/summary-${stamp}.log`
cpSync(fullLog, logPath)
const plain = (value) => String(value).replace(/\x1b\[[0-9;]*m/g, "")
const firstLine = (value) => plain(value).split(/\r?\n/).find((line) => line.trim())?.trim() ?? "Unknown error"
try {
  const report = JSON.parse(readFileSync(reportFile, "utf8"))
  const { expected = 0, unexpected = 0, flaky = 0, skipped = 0, duration = Date.now() - started } = report.stats
  console.log(`${expected} passed, ${unexpected} failed, ${flaky} flaky, ${skipped} skipped (${(duration / 1000).toFixed(1)}s) | Log: ${logPath}`)
  const failures = []
  function visit(suites, parents = []) {
    for (const suite of suites) {
      const titles = [...parents, suite.title].filter(Boolean)
      for (const spec of suite.specs ?? []) for (const test of spec.tests) {
        if (test.status !== "unexpected") continue
        const result = [...test.results].reverse().find((result) => result.error || result.errors?.length)
        const error = result?.error ?? result?.errors?.[0]
        failures.push(`${[...titles, spec.title, test.projectName].filter(Boolean).join(" › ")}: ${firstLine(error?.message ?? error?.value ?? "Test failed without an error message")}`)
      }
      visit(suite.suites ?? [], titles)
    }
  }
  visit(report.suites ?? [])
  for (const error of report.errors ?? []) failures.push(firstLine(error.message ?? error.value))
  failures.slice(0, 48).forEach((failure) => console.log(failure))
  if (failures.length > 48) console.log(`${failures.length - 48} more failures; see the full log.`)
} catch {
  console.log(`Playwright exited ${code ?? signal ?? 1} (${((Date.now() - started) / 1000).toFixed(1)}s) | Log: ${logPath}`)
  const lines = plain(readFileSync(fullLog, "utf8")).split(/\r?\n/)
  const error = spawnError?.message ?? lines.find((line) => /Error:|error:|ERR_/.test(line))
  if (error) console.log(firstLine(error))
}
rmSync(temporary, { recursive: true, force: true })
process.exitCode = code ?? (signal ? 128 + (constants.signals[signal] ?? 1) : 1)
