import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/message-strip`)
  await page.waitForSelector("html[data-ready=true]")
})

test("message strip is a note with hidden design text, and its close button fires onClose", async ({ page }) => {
  const strip = page.locator("#ms-negative")
  await expect(strip).toHaveAttribute("role", "note")
  await expect(strip).toHaveAccessibleName(/Error Message Strip Closable/)
  const close = strip.getByRole("button", { name: "Close negative message strip" })
  await close.click()
  await expect(strip).toHaveCount(0)
})

test("close button works from the keyboard", async ({ page }) => {
  const close = page.locator("#ms-critical").getByRole("button")
  await close.focus()
  await page.keyboard.press("Enter")
  await expect(page.locator("#ms-critical")).toHaveCount(0)
})

test("hideCloseButton removes the button and the 'Closable' text", async ({ page }) => {
  const strip = page.getByRole("note").filter({ hasText: "not closable" })
  await expect(strip.getByRole("button")).toHaveCount(0)
  await expect(strip).not.toHaveAccessibleName(/Closable/)
})
