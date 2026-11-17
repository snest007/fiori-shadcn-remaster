// Pixel comparison against UI5 Web Components (SAP's official implementation).
// Every fixture is rendered by both pages; we screenshot each cell and count differing pixels.
import { mkdirSync, writeFileSync } from "node:fs"
import { expect, test, type Page } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"


const THEMES = ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]
const DENSITIES = ["cozy", "compact"] as const

// Case list and tolerances come from the built docs page itself (window.__fixtures), so this file
// never needs to import the fixture modules (which reference browser-only UI5 code).
type CaseInfo = { id: string; tolerance: number }

// One full-page screenshot per page, then each [data-fixture] cell is cropped out of it. Shooting
// cells one by one costs ~100ms each, which doesn't scale to hundreds of fixtures.
async function shoot(page: Page, url: string, ids?: string[]) {
  await page.goto(url)
  // The UI5 reference page needs ~10s of main-thread work on an idle machine (ui5-main.ts
  // waits for every fixture's own readiness). With three workers on a 4-vCPU CI runner it
  // reached 30s; allow 60s like tests/visual-sapui5.spec.ts. This only bounds the wait.
  await page.waitForSelector("html[data-ready=true]", { timeout: 60_000 })
  await page.mouse.move(0, 0)
  // Chromium captures an RTL document from its negative scroll origin when any fixture
  // overflows horizontally. Cells have their own dir attribute, so normalize only the
  // document scroll axis for cropping; every component keeps its requested direction.
  if (new URL(url, "http://fixtures").searchParams.get("dir") === "rtl") {
    await page.evaluate(() => { document.documentElement.style.direction = "ltr" })
    await expect(page.locator("[data-fixture]").first()).toHaveCSS("direction", "rtl")
  }
  const boxes: { id: string; x: number; y: number; w: number; h: number }[] = await page.locator("[data-fixture]").evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect()
      return { id: (e as HTMLElement).dataset.fixture!, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }
    })
  )
  const full = PNG.sync.read(await page.screenshot({ fullPage: true, animations: "disabled", caret: "hide" }))
  const wanted = ids ? new Set(ids) : undefined
  const shots = new Map<string, PNG>()
  for (const b of boxes) {
    if (wanted && !wanted.has(b.id)) continue
    // Same rounding Playwright uses for element screenshots.
    const x = Math.floor(b.x), y = Math.floor(b.y)
    const w = Math.ceil(b.x + b.w) - x, h = Math.ceil(b.y + b.h) - y
    const cell = new PNG({ width: w, height: h })
    PNG.bitblt(full, cell, x, y, Math.min(w, full.width - x), Math.min(h, full.height - y), 0, 0)
    shots.set(b.id, cell)
  }
  return shots
}

const report: Record<string, { ratio: number; size: string }> = {}

const passes = THEMES.flatMap((theme) => DENSITIES.map((density) => ({ theme, density, direction: "ltr" })))
passes.push({ theme: "sap_horizon", density: "cozy", direction: "rtl" })

for (const { theme, density, direction } of passes) {
    test(`${theme} ${density}${direction === "rtl" ? " RTL" : ""} matches UI5`, async ({ browser }) => {
      test.setTimeout(120_000)
      const q = `?theme=${theme}&density=${density}&dir=${direction}`
      const ui5Page = await browser.newPage()
      const ref = await shoot(ui5Page, `/ui5.html${q}`)
      const oursPage = await browser.newPage()
      const ours = await shoot(oursPage, `/index.html${q}&fixtures`, [...ref.keys()])
      const cases: CaseInfo[] = await oursPage.evaluate(() => (window as any).__fixtures)
      const dir = `test-results/visual/${theme}-${density}${direction === "rtl" ? "-rtl" : ""}`
      mkdirSync(dir, { recursive: true })
      const failures: string[] = []
      expect(ref.size, "UI5 page rendered no fixtures").toBeGreaterThan(0)
      for (const f of cases.filter((c) => ref.has(c.id))) {
        const a = ours.get(f.id)
        const b = ref.get(f.id)!
        if (!a) {
          failures.push(`${f.id}: missing on our page`)
          continue
        }
        const key = `${theme}/${density}/${direction}/${f.id}`
        if (a.width !== b.width || a.height !== b.height) {
          report[key] = { ratio: 1, size: `${a.width}x${a.height} vs ui5 ${b.width}x${b.height}` }
          failures.push(`${f.id}: size ${a.width}x${a.height} vs UI5 ${b.width}x${b.height}`)
          writeFileSync(`${dir}/${f.id}-ours.png`, PNG.sync.write(a))
          writeFileSync(`${dir}/${f.id}-ui5.png`, PNG.sync.write(b))
          continue
        }
        const diff = new PNG({ width: a.width, height: a.height })
        const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 })
        const ratio = n / (a.width * a.height)
        report[key] = { ratio, size: `${a.width}x${a.height}` }
        if (ratio > f.tolerance) {
          failures.push(`${f.id}: ${(ratio * 100).toFixed(1)}% pixels differ`)
          writeFileSync(`${dir}/${f.id}-ours.png`, PNG.sync.write(a))
          writeFileSync(`${dir}/${f.id}-ui5.png`, PNG.sync.write(b))
          writeFileSync(`${dir}/${f.id}-diff.png`, PNG.sync.write(diff))
        }
      }
      writeFileSync(`${dir}/report.json`, JSON.stringify(report, null, 2))
      expect(failures, failures.join("\n")).toEqual([])
    })
}
