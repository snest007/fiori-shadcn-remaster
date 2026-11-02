import { expect, test, type Page } from "@playwright/test"

const tile = (page: Page, name: RegExp) => page.locator("#product-switch-demo").getByRole("button", { name })

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
  await page.locator("#product-switch-demo-open").click()
  await expect(page.locator("#product-switch-demo")).toBeVisible()
})

test("product-switch: grid of 4 columns with a single tab stop", async ({ page }) => {
  await expect(page.locator("#product-switch-demo")).toHaveAttribute("data-columns", "4")
  await expect(page.locator("#product-switch-demo")).toHaveRole("list")
  await expect(page.locator('#product-switch-demo [tabindex="0"]')).toHaveCount(1)
  await expect(tile(page, /^Home/)).toHaveAttribute("tabindex", "0")
})

test("product-switch: arrows move by item and by row, stopping at the edges", async ({ page }) => {
  await tile(page, /^Home/).focus()
  await page.keyboard.press("ArrowRight")
  await expect(tile(page, /^Customers/)).toBeFocused()
  await expect(tile(page, /^Customers/)).toHaveAttribute("tabindex", "0")
  await page.keyboard.press("ArrowDown")
  await expect(tile(page, /^Support/)).toBeFocused()
  await page.keyboard.press("ArrowDown") // no row below
  await expect(tile(page, /^Support/)).toBeFocused()
  await page.keyboard.press("ArrowUp")
  await expect(tile(page, /^Customers/)).toBeFocused()
  await page.keyboard.press("ArrowUp") // no row above
  await expect(tile(page, /^Customers/)).toBeFocused()
  await page.keyboard.press("End")
  await expect(tile(page, /^Travel/)).toBeFocused()
  await page.keyboard.press("Home")
  await expect(tile(page, /^Home/)).toBeFocused()
  await page.keyboard.press("ArrowLeft")
  await expect(tile(page, /^Home/)).toBeFocused()
})

test("product-switch: click, Enter and Space activate and move the selection", async ({ page }) => {
  const last = page.locator("#product-switch-demo-last")
  await tile(page, /^Customers/).click()
  await expect(last).toHaveText("Last product: Customers")
  await expect(tile(page, /^Customers/)).toHaveAttribute("aria-pressed", "true")
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("Enter")
  await expect(last).toHaveText("Last product: Products")
  await expect(tile(page, /^Customers/)).toHaveAttribute("aria-pressed", "false")
  await expect(tile(page, /^Products/)).toHaveAttribute("aria-pressed", "true")
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("Space")
  await expect(last).toHaveText("Last product: Travel & Expenses")
})
