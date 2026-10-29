import { expect, test } from "@playwright/test"

test("bar has no role by default and keeps start / middle / end order", async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
  const bar = page.locator('[data-slot="bar"][data-design="header"]').first()
  expect(await bar.getAttribute("role")).toBeNull()
  const slots = await bar.locator("[data-slot^=bar-]").evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.slot))
  expect(slots).toEqual(["bar-start", "bar-middle", "bar-end"])
  const [start, middle, end] = await Promise.all(["bar-start", "bar-middle", "bar-end"].map((s) => bar.locator(`[data-slot=${s}]`).boundingBox()))
  expect(start!.x).toBeLessThan(middle!.x)
  expect(middle!.x + middle!.width).toBeLessThanOrEqual(end!.x + 1)
})
