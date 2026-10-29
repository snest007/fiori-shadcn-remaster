import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
})

test("switch: role and name from its label; Space and Enter toggle", async ({ page }) => {
  const sw = page.getByRole("switch", { name: "Sync" })
  await expect(sw).toHaveAttribute("aria-checked", "false")
  await sw.focus()
  await page.keyboard.press("Space")
  await expect(sw).toHaveAttribute("aria-checked", "true")
  await page.keyboard.press("Enter")
  await expect(sw).toHaveAttribute("aria-checked", "false")
  await page.getByText("Wi-Fi", { exact: false }).first().click()
  await expect(page.getByRole("switch", { name: "Wi-Fi" })).toHaveAttribute("aria-checked", "false")
})

test("switch: track texts are not part of the accessible name", async ({ page }) => {
  await expect(page.getByRole("switch", { name: "Sync" })).toHaveAccessibleName("Sync")
})

test("switch: read-only can't toggle and says so", async ({ page }) => {
  const sw = page.getByRole("switch", { name: "Locked" })
  await expect(sw).toHaveAttribute("aria-readonly", "true")
  await expect(sw).toHaveAccessibleDescription("Read Only")
  await sw.focus()
  await page.keyboard.press("Space")
  await page.keyboard.press("Enter")
  await sw.click()
  await expect(sw).toHaveAttribute("aria-checked", "true")
})

test("switch: disabled", async ({ page }) => {
  await expect(page.getByRole("switch", { name: "Disabled" })).toBeDisabled()
})
