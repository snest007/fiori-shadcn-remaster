import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
})

test("rating-indicator: role slider with value text", async ({ page }) => {
  const r = page.locator("#rating-indicator-demo")
  await expect(r).toHaveAttribute("role", "slider")
  await expect(r).toHaveAttribute("aria-valuenow", "3")
  await expect(r).toHaveAttribute("aria-valuemax", "5")
  await expect(r).toHaveAttribute("aria-valuetext", "3 of 5")
  await expect(r).toHaveAttribute("aria-roledescription", "Rating Indicator")
})

test("rating-indicator: keyboard model (UI5)", async ({ page }) => {
  const r = page.locator("#rating-indicator-demo")
  const v = page.locator("#rating-indicator-demo-value")
  await r.focus()
  await page.keyboard.press("ArrowRight")
  await expect(v).toHaveText("4")
  await page.keyboard.press("ArrowUp")
  await expect(v).toHaveText("5")
  await page.keyboard.press("ArrowUp") // capped at max
  await expect(v).toHaveText("5")
  await page.keyboard.press("Space") // past max wraps to 0
  await expect(v).toHaveText("0")
  await page.keyboard.press("Enter")
  await expect(v).toHaveText("1")
  await page.keyboard.press("ArrowLeft")
  await expect(v).toHaveText("0")
  await page.keyboard.press("ArrowDown") // floor 0
  await expect(v).toHaveText("0")
  await page.keyboard.press("End")
  await expect(v).toHaveText("5")
  await page.keyboard.press("Home")
  await expect(v).toHaveText("0")
  await page.keyboard.press("3")
  await expect(v).toHaveText("3")
  await page.keyboard.press("9") // capped at max
  await expect(v).toHaveText("5")
})

test("rating-indicator: click sets the value; clicking the current value clears it", async ({ page }) => {
  const stars = page.locator("#rating-indicator-demo li")
  await stars.nth(1).click()
  await expect(page.locator("#rating-indicator-demo-value")).toHaveText("2")
  await stars.nth(1).click()
  await expect(page.locator("#rating-indicator-demo-value")).toHaveText("0")
})

test("rating-indicator: read-only is focusable but ignores keys", async ({ page }) => {
  const ro = page.locator("#rating-indicator-demo-ro")
  await expect(ro).toHaveAttribute("aria-readonly", "true")
  await ro.focus()
  await expect(ro).toBeFocused()
  await page.keyboard.press("ArrowRight")
  await expect(ro).toHaveAttribute("aria-valuenow", "2.5")
  // 2.5 renders two full stars and a half star.
  await expect(ro.locator("li[data-selected]")).toHaveCount(2)
  await expect(ro.locator("li[data-half]")).toHaveCount(1)
})
