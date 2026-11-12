import { expect, test } from "@playwright/test"

test("hero banner shows a heading and its actions; the landmark role is configurable", async ({ page }) => {
  await page.goto(`/index.html#/hero-banner`)
  await page.waitForSelector("html[data-ready=true]")
  const root = page.locator("#hero-banner-demo")
  await expect(root.getByRole("region", { name: "Welcome" })).toBeVisible()
  await expect(root.getByRole("heading", { level: 2 })).toHaveText("Welcome back, Ann")
  await expect(root.getByRole("button", { name: "Customize" })).toBeVisible()
})

test("under 600px the columns stack", async ({ page }) => {
  await page.goto(`/index.html#/hero-banner`)
  await page.waitForSelector("html[data-ready=true]")
  const root = page.locator("#hero-banner-demo")
  const start = root.locator(".fiori-hero-banner__block-start")
  const end = root.locator(".fiori-hero-banner__block-end")
  expect((await start.boundingBox())!.y).toBe((await end.boundingBox())!.y)
  await root.evaluate((el) => ((el as HTMLElement).style.width = "400px"))
  await expect.poll(async () => (await end.boundingBox())!.y).toBeGreaterThan((await start.boundingBox())!.y)
})
