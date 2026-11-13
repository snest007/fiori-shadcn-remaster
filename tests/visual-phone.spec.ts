import { mkdirSync, writeFileSync } from "node:fs"
import { expect, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"

const THEMES = ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]
const DENSITIES = ["cozy", "compact"]
// A separate, isolated 375×667 page per fixture opens the genuine native phone
// Dialog. Device forcing never shares a page with the desktop oracle fixtures.
for (const theme of THEMES) for (const density of DENSITIES) {
  test(`phone ${theme} ${density} matches UI5`, async ({ browser }) => {
    test.setTimeout(120_000)
    const ours = await browser.newPage({ viewport: { width: 375, height: 667 }, hasTouch: true })
    const oracle = await browser.newPage({ viewport: { width: 375, height: 667 }, hasTouch: true })
    const query = `fixtures-phone&theme=${theme}&density=${density}`
    await ours.goto(`/index.html?${query}`)
    await ours.waitForSelector("html[data-ready=true]")
    const cases: { id: string; tolerance: number }[] = await ours.evaluate(() => (window as any).__fixtures)
    const directory = `test-results/visual-phone/${theme}-${density}`
    mkdirSync(directory, { recursive: true })
    const failures: string[] = []
    const report: Record<string, { ratio: number; size: string }> = {}
    for (const fixture of cases) {
      const shots = await Promise.all([ours, oracle].map(async (page, index) => {
        await page.goto(`/${index ? "ui5" : "index"}.html?${query}&only=${fixture.id}`)
        await page.waitForSelector("html[data-ready=true]")
        await expect(page.locator(`[data-fixture="${fixture.id}"]`)).toHaveCount(1)
        const dialog = index ? page.locator("ui5-dialog[open]") : page.locator('[role="dialog"]')
        await expect(dialog).toBeVisible()
        await expect(dialog).toHaveCSS("width", "375px")
        await expect(dialog).toHaveCSS("height", "667px")
        await page.mouse.move(0, 666)
        return PNG.sync.read(await page.screenshot({ animations: "disabled", caret: "hide" }))
      }))
      const [a, b] = shots
      expect([a.width, a.height]).toEqual([375, 667])
      expect([b.width, b.height]).toEqual([375, 667])
      const diff = new PNG({ width: a.width, height: a.height })
      const count = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 })
      const ratio = count / (a.width * a.height)
      report[fixture.id] = { ratio, size: `${a.width}x${a.height}` }
      if (ratio > fixture.tolerance) {
        failures.push(`${fixture.id}: ${(ratio * 100).toFixed(1)}% pixels differ`)
        writeFileSync(`${directory}/${fixture.id}-ours.png`, PNG.sync.write(a))
        writeFileSync(`${directory}/${fixture.id}-ui5.png`, PNG.sync.write(b))
        writeFileSync(`${directory}/${fixture.id}-diff.png`, PNG.sync.write(diff))
      }
    }
    writeFileSync(`${directory}/report.json`, JSON.stringify(report, null, 2))
    await ours.close(); await oracle.close()
    expect(failures, failures.join("\n")).toEqual([])
  })
}
