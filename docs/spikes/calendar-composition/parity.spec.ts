import { expect, test } from "@playwright/test"
const themes = ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]
for (const theme of themes) for (const density of ["cozy", "compact"]) {
  test(`exact default tree and pixels: ${theme}/${density}`, async ({ page }) => {
    test.setTimeout(120_000) // Nine cases, two complete mounts/screenshots each; no retry or sleep.
    await page.clock.install({ time: new Date("2026-11-17T12:00:00+08:00") })
    const url = `/spikes/calendar-composition/index.html?parity&theme=${theme}&density=${density}`
    await page.goto(url)
    await expect(page.locator("html")).toHaveAttribute("data-ready", "true")
    const ids: string[] = JSON.parse(await page.locator("#fixture-manifest").textContent() ?? "[]")
    expect(ids.length).toBeGreaterThan(0)
    for (const id of ids) {
      await test.step(id, async () => {
        const target = page.locator("#parity-target")
        await page.goto(`${url}&source=registry&case=${id}`)
        await expect(page.locator("html")).toHaveAttribute("data-ready", "true")
        await expect(target.locator('[data-slot="calendar"]')).toHaveCount(1)
        const tree = await target.ariaSnapshot()
        const pixels = await target.locator('[data-slot="calendar"]').screenshot({ animations: "disabled" })
        await page.goto(`${url}&source=prototype&case=${id}`)
        await expect(page.locator("html")).toHaveAttribute("data-ready", "true")
        expect(await target.ariaSnapshot(), `${id}: tree`).toBe(tree)
        const actual = await target.locator('[data-slot="calendar"]').screenshot({ animations: "disabled" })
        if (!actual.equals(pixels)) {
          await test.info().attach(`${id}-registry`, { body: pixels, contentType: "image/png" })
          await test.info().attach(`${id}-prototype`, { body: actual, contentType: "image/png" })
        }
        expect(actual.equals(pixels), `${id}: PNG bytes must be identical`).toBe(true)
      })
    }
  })
}
