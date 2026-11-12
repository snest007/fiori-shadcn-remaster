import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/popover`)
  await page.waitForSelector("html[data-ready=true]")
})

test("popover: opens next to its opener with an arrow; Escape closes and restores focus", async ({ page }) => {
  const opener = page.locator("#open-popover")
  await opener.focus()
  await page.keyboard.press("Enter")
  const popover = page.getByRole("dialog", { name: "Details" })
  await expect(popover).toBeVisible()
  // Focus moves into the popover (first focusable element).
  await expect(popover.getByRole("button", { name: "OK" })).toBeFocused()
  const arrow = popover.locator(".fiori-popover-arrow")
  await expect(arrow).toBeVisible()
  const o = (await opener.boundingBox())!
  const p = (await popover.boundingBox())!
  // Placed on one side of the opener, 8px away (the arrow's height), like UI5.
  const gap = Math.min(Math.abs(p.y - (o.y + o.height)), Math.abs(o.y - (p.y + p.height)))
  expect(Math.round(gap)).toBe(8)
  await page.keyboard.press("Escape")
  await expect(popover).toHaveCount(0)
  await expect(opener).toBeFocused()
})

test("popover: clicking outside closes it", async ({ page }) => {
  await page.locator("#open-popover").click()
  const popover = page.getByRole("dialog", { name: "Details" })
  await expect(popover.getByRole("button", { name: "OK" })).toBeFocused()
  // Radix attaches its outside-pointer listener on a timer after mounting.
  await page.evaluate(() => new Promise((r) => setTimeout(r, 50)))
  await page.mouse.click(5, 5)
  await expect(popover).toHaveCount(0)
})

test("popover: footer button closes it", async ({ page }) => {
  await page.locator("#open-popover").click()
  const popover = page.getByRole("dialog", { name: "Details" })
  await popover.getByRole("button", { name: "OK" }).click()
  await expect(popover).toHaveCount(0)
})
