import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
})

test("link without href is focusable and activates with Enter and Space", async ({ page }) => {
  const link = page.locator("#link-action")
  const count = page.locator("#link-clicks")
  await expect(link).toHaveAttribute("tabindex", "0")
  await link.focus()
  await page.keyboard.press("Enter")
  await expect(count).toHaveText("Activated 1 times")
  await page.keyboard.press("Space")
  await expect(count).toHaveText("Activated 2 times")
  await link.click()
  await expect(count).toHaveText("Activated 3 times")
})

test("Space does not scroll the page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 300 })
  const link = page.locator("#link-action")
  await link.scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => scrollY)
  await link.focus()
  await page.keyboard.press("Space")
  expect(await page.evaluate(() => scrollY)).toBe(before)
})

test("focus style only for keyboard focus; designs announce their type", async ({ page }) => {
  const link = page.getByRole("link", { name: "Subtle Subtle", exact: true })
  await expect(link).toHaveAccessibleName("Subtle Subtle")
  const bg = () => link.evaluate((el) => getComputedStyle(el).backgroundColor)
  await link.click()
  const clickedBg = await bg()
  await page.keyboard.press("Shift+Tab")
  await page.keyboard.press("Tab")
  await expect(link).toBeFocused()
  expect(await bg()).not.toBe(clickedBg)
})
