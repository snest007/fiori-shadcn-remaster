#!/usr/bin/env node
// Simulates a FUTURE same-item upgrade in a throwaway installed consumer. Does not publish or edit registry source.
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "@playwright/test"
import { createConsumerHarness } from "../../../scripts/smoke-install.mjs"
const root = fileURLToPath(new URL("../../..", import.meta.url))
const spike = fileURLToPath(new URL(".", import.meta.url))
const dir = mkdtempSync(join(tmpdir(), "fiori-X0-consumer-"))
const harness = createConsumerHarness(root)
const registryPort = 4370, appPort = 4371
let browser
try {
  harness.run("pnpm registry:build", root, { REGISTRY_URL: `http://localhost:${registryPort}/r` })
  await harness.serve(`pnpm exec vite --port ${registryPort} --strictPort`, root, registryPort)
  harness.setupConsumer(dir)
  harness.initRegistry(dir, `http://localhost:${registryPort}/r`)
  harness.addItems(dir, ["calendar"])
  // Simulate replacing the installed calendar entry with the proposed upgrade; dependencies come from the real item.
  cpSync(join(spike, "calendar.tsx"), join(dir, "src/components/ui/calendar.tsx"))
  mkdirSync(join(dir, "src/fiscal-calendar"), { recursive: true })
  for (const name of ["fiscal-adapter.ts", "fiscal-variants.ts"]) cpSync(join(spike, "../fiscal-calendar", name), join(dir, "src/fiscal-calendar", name))
  const consumer = readFileSync(join(spike, "fiscal-consumers.tsx"), "utf8")
    .replace('from "./calendar"', 'from "@/components/ui/calendar"')
    .replaceAll('from "../fiscal-calendar/', 'from "./fiscal-calendar/')
  writeFileSync(join(dir, "src/fiscal-consumers.tsx"), consumer)
  writeFileSync(join(dir, "src/public-entry.ts"), `export { Calendar, CalendarLegend, CalendarLegendItem, CalendarNavButton, CalendarHeaderButton, CalendarGrid, CalendarRow, CalendarCell, useCalendar, type CalendarContextValue, type CalendarComponents, type CalendarPartProps, type CalendarDayInfo, type CalendarWeekInfo, type CalendarItemPicker } from "@/components/ui/calendar"\n`)
  writeFileSync(join(dir, "src/main.tsx"), `import { createRoot } from "react-dom/client"\nimport { FiscalConsumer } from "./fiscal-consumers"\nimport "./index.css"\ncreateRoot(document.getElementById("root")!).render(<FiscalConsumer mode={new URLSearchParams(location.search).get("mode") === "day" ? "day" : "period"} />)\n`)
  harness.run("pnpm build", dir)
  await harness.serve(`pnpm exec vite preview --port ${appPort} --strictPort`, dir, appPort)
  browser = await chromium.launch()
  const page = await browser.newPage()
  const errors = []
  page.on("pageerror", e => errors.push(e.message))
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()) })
  for (const mode of ["period", "day"]) {
    await page.goto(`http://localhost:${appPort}/?mode=${mode}`)
    await page.locator("#fiscal-calendar").waitFor()
    const count = await page.locator('#fiscal-calendar [role="gridcell"]').count()
    if (count !== (mode === "period" ? 16 : 42)) throw new Error(`Wrong ${mode} count: ${count}`)
  }
  if (errors.length) throw new Error(errors.join("\n"))
  console.log("✔ Calendar composition packaging OK: same installed item, public entry imports, strict build, fiscal period/day consumers rendered")
} finally {
  await browser?.close()
  harness.stopServers()
  harness.restoreRegistry()
  rmSync(resolve(dir), { recursive: true, force: true })
}
