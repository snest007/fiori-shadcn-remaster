import { expect, test } from "@playwright/test"

test("Select opens on completed primary click and preserves keyboard opening", async ({ page }) => {
  await page.goto("/index.html?fixtures&only=select")
  await page.waitForSelector("html[data-ready=true]")
  const trigger = page.locator('[data-fixture="select"] [data-slot="select-trigger"]')
  await trigger.hover()
  try {
    await page.mouse.down()
    await expect(trigger).toHaveAttribute("aria-expanded", "false")
    await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0)
  } finally {
    await page.mouse.up()
  }
  await expect(trigger).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByRole("option", { name: "Germany", exact: true })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(trigger).toHaveAttribute("aria-expanded", "false")
  await expect(trigger).toBeFocused()
  await page.keyboard.press("Space")
  await expect(trigger).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByRole("option", { name: "Germany", exact: true })).toBeFocused()
})
