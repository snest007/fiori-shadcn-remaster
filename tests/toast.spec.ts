import { expect, test, type Page } from "@playwright/test"

const show = async (page: Page, name = "Show toast") => {
  await page.getByRole("button", { name, exact: true }).click()
  const toast = page.getByRole("alert").filter({ hasText: "Product saved" })
  await expect(toast).toBeVisible()
  return toast
}

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
})

test("toast: bottom-center by default, role=alert", async ({ page }) => {
  const toast = await show(page)
  const box = (await toast.boundingBox())!
  const vp = page.viewportSize()!
  expect(Math.abs(box.x + box.width / 2 - vp.width / 2)).toBeLessThanOrEqual(1)
  // --fiori-toast-vertical-offset: 3rem
  expect(Math.round(vp.height - (box.y + box.height))).toBe(48)
})

test("toast: auto-dismisses after 3000ms, fading during the last second", async ({ page }) => {
  await page.mouse.move(5, 5)
  const toast = await show(page)
  const t0 = Date.now()
  await page.mouse.move(5, 5) // keep the pointer off the toast
  await page.waitForTimeout(1500)
  expect(Number(await toast.evaluate((t) => getComputedStyle(t).opacity))).toBe(1)
  await page.waitForTimeout(1000)
  const mid = Number(await toast.evaluate((t) => getComputedStyle(t).opacity))
  expect(mid).toBeGreaterThan(0)
  expect(mid).toBeLessThan(1)
  await expect(toast).toHaveCount(0, { timeout: 2000 })
  const elapsed = Date.now() - t0
  expect(elapsed).toBeGreaterThanOrEqual(2900)
  expect(elapsed).toBeLessThan(4000)
})

test("toast: hovering pauses it (opaque, stays open); leaving restarts the countdown", async ({ page }) => {
  const toast = await show(page)
  await toast.hover()
  await page.waitForTimeout(3500)
  await expect(toast).toBeVisible()
  expect(Number(await toast.evaluate((t) => getComputedStyle(t).opacity))).toBe(1)
  await page.mouse.move(5, 5)
  await page.waitForTimeout(1500)
  await expect(toast).toBeVisible()
  await expect(toast).toHaveCount(0, { timeout: 2500 })
})

test("toast: Ctrl/Cmd+Shift+M focuses it (pausing), Escape returns focus", async ({ page }) => {
  await page.mouse.move(5, 5)
  const button = page.getByRole("button", { name: "Show toast", exact: true })
  const toast = await show(page)
  await expect(button).toBeFocused()
  await page.keyboard.press("ControlOrMeta+Shift+KeyM")
  await expect(toast).toBeFocused()
  await page.waitForTimeout(3500)
  await expect(toast).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(button).toBeFocused()
  await expect(toast).toHaveCount(0, { timeout: 4000 })
})

test("toast: placement prop", async ({ page }) => {
  const vp = page.viewportSize()!
  let box = (await (await show(page, "Toast top end")).boundingBox())!
  expect(Math.round(box.y)).toBe(48) // 3rem
  expect(Math.round(vp.width - (box.x + box.width))).toBe(32) // 2rem
  box = (await (await show(page, "Toast middle center")).boundingBox())!
  expect(Math.abs(box.x + box.width / 2 - vp.width / 2)).toBeLessThanOrEqual(1)
  expect(Math.abs(box.y + box.height / 2 - vp.height / 2)).toBeLessThanOrEqual(1)
})
