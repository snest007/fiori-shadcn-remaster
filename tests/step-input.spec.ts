import { expect, test } from "@playwright/test"

test.describe("StepInput (Fiori model)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/index.html#/step-input`)
    await page.waitForSelector("html[data-ready=true]")
    await page.locator("#si-qty").focus()
  })

  test("role spinbutton with value and range", async ({ page }) => {
    const input = page.locator("#si-qty")
    await expect(input).toHaveAttribute("role", "spinbutton")
    await expect(input).toHaveAttribute("aria-valuenow", "3")
    await expect(input).toHaveAttribute("aria-valuemin", "0")
    await expect(input).toHaveAttribute("aria-valuemax", "10")
  })

  test("arrow keys step and clamp; buttons disable at the bounds", async ({ page }) => {
    const input = page.locator("#si-qty")
    const dec = page.getByRole("button", { name: "Decrease" }).first()
    const inc = page.getByRole("button", { name: "Increase" }).first()
    await page.keyboard.press("ArrowUp")
    await expect(input).toHaveValue("4")
    await expect(page.getByTestId("si-qty-value")).toHaveText("4")
    for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowDown")
    await expect(input).toHaveValue("0")
    await page.keyboard.press("ArrowDown")
    await expect(input).toHaveValue("0")
    await expect(dec).toHaveAttribute("aria-disabled", "true")
    await expect(inc).not.toHaveAttribute("aria-disabled")
  })

  test("Shift+PageUp / Shift+PageDown and Ctrl+Shift+arrows jump to the bounds", async ({ page }) => {
    const input = page.locator("#si-qty")
    await page.keyboard.press("Shift+PageUp")
    await expect(input).toHaveValue("10")
    await expect(page.getByRole("button", { name: "Increase" }).first()).toHaveAttribute("aria-disabled", "true")
    await page.keyboard.press("Shift+PageDown")
    await expect(input).toHaveValue("0")
    await page.keyboard.press("Control+Shift+ArrowUp")
    await expect(input).toHaveValue("10")
    await page.keyboard.press("Control+Shift+ArrowDown")
    await expect(input).toHaveValue("0")
    // Plain PageUp does nothing (UI5 has no unmodified PageUp step).
    await page.keyboard.press("PageUp")
    await expect(input).toHaveValue("0")
  })

  test("Escape restores the value from focus", async ({ page }) => {
    const input = page.locator("#si-qty")
    await page.keyboard.press("ArrowUp")
    await page.keyboard.press("ArrowUp")
    await expect(input).toHaveValue("5")
    await page.keyboard.press("Escape")
    await expect(input).toHaveValue("3")
  })

  test("buttons step the value and keep focus in the field", async ({ page }) => {
    const input = page.locator("#si-qty")
    await page.getByRole("button", { name: "Increase" }).first().click()
    await expect(input).toHaveValue("4")
    await expect(input).toBeFocused()
    await page.getByRole("button", { name: "Decrease" }).first().click()
    await expect(input).toHaveValue("3")
  })

  test("typed values commit on Enter; out of range turns negative", async ({ page }) => {
    const input = page.locator("#si-qty")
    await input.fill("7")
    await page.keyboard.press("Enter")
    await expect(page.getByTestId("si-qty-value")).toHaveText("7")
    await expect(input).not.toHaveAttribute("aria-invalid")
    await input.fill("12")
    await page.keyboard.press("Enter")
    await expect(input).toHaveAttribute("aria-invalid", "true")
    await page.keyboard.press("ArrowDown") // stepping clamps back into range and clears the error
    await expect(input).toHaveValue("10")
    await expect(input).not.toHaveAttribute("aria-invalid")
  })

  test("letters are rejected while typing", async ({ page }) => {
    const input = page.locator("#si-qty")
    await page.keyboard.press("End")
    await page.keyboard.type("a")
    await expect(input).toHaveValue("3")
  })

  test("value precision formats steps", async ({ page }) => {
    const price = page.locator("#si-price")
    await expect(price).toHaveValue("9.99")
    await price.focus()
    await page.keyboard.press("ArrowUp")
    await expect(price).toHaveValue("10.49")
    await price.fill("1.5")
    await page.keyboard.press("Enter")
    await expect(price).toHaveAttribute("aria-invalid", "true") // wrong number of decimals
  })

  test("read-only has no buttons and ignores keys", async ({ page }) => {
    const ro = page.locator("#si-ro")
    await ro.focus()
    await page.keyboard.press("ArrowUp")
    await expect(ro).toHaveValue("42")
    await expect(page.locator("[data-slot=step-input]:has(#si-ro) button")).toHaveCount(0)
  })
})
