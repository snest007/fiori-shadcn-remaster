// Pixel comparison against UI5 Web Components (SAP's official implementation).
// Every fixture is rendered by both pages; we screenshot each cell and count differing pixels.
import { mkdirSync, writeFileSync } from "node:fs"
import { expect, test, type Page } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"

import { fixtures } from "../docs/src/fixtures"

const THEMES = ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]
const DENSITIES = ["cozy", "compact"] as const
// Anti-aliasing and sub-pixel text layout differ slightly between shadow DOM and light DOM;
// beyond this share of differing pixels a fixture fails.
const MAX_DIFF_RATIO = 0.02

async function shoot(page: Page, url: string) {
  await page.goto(url)
  await page.waitForSelector("html[data-ready=true]")
  await page.mouse.move(0, 0)
  const shots = new Map<string, PNG>()
  for (const f of fixtures) {
    const buf = await page.locator(`[data-fixture="${f.id}"]`).screenshot({ animations: "disabled", caret: "hide" })
    shots.set(f.id, PNG.sync.read(buf))
  }
  return shots
}

const report: Record<string, { ratio: number; size: string }> = {}

for (const theme of THEMES) {
  for (const density of DENSITIES) {
    test(`${theme} ${density} matches UI5`, async ({ browser }) => {
      const q = `?theme=${theme}&density=${density}`
      const [ours, ref] = await Promise.all([
        browser.newPage().then((p) => shoot(p, `/index.html${q}&fixtures`)),
        browser.newPage().then((p) => shoot(p, `/ui5.html${q}`)),
      ])
      const dir = `test-results/visual/${theme}-${density}`
      mkdirSync(dir, { recursive: true })
      const failures: string[] = []
      for (const f of fixtures) {
        const a = ours.get(f.id)!
        const b = ref.get(f.id)!
        const key = `${theme}/${density}/${f.id}`
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
        if (ratio > MAX_DIFF_RATIO) {
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
}
