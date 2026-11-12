import { expect, test, type Page } from "@playwright/test"

const root = (page: Page) => page.locator("#search-demo")
const input = (page: Page) => root(page).getByRole("searchbox")
const options = (page: Page) => page.locator(".fiori-search__popover").getByRole("option")
const last = (page: Page) => page.locator("#search-demo-last")

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/search`)
  await page.waitForSelector("html[data-ready=true]")
  await input(page).focus()
})

test("search: typing opens the list, completes the first match and bolds what was typed", async ({ page }) => {
  await page.keyboard.type("Lap")
  await expect(options(page)).toHaveCount(3)
  await expect(input(page)).toHaveValue("Laptop")
  expect(await input(page).evaluate((el: HTMLInputElement) => el.value.slice(el.selectionStart!, el.selectionEnd!))).toBe("top")
  await expect(options(page).first().locator("b")).toHaveText("Lap")
  await expect(options(page).first()).toHaveAttribute("aria-selected", "true")
  // Width follows the field.
  expect((await page.locator(".fiori-search__popover").boundingBox())!.width).toBe((await root(page).boundingBox())!.width)
  // Deleting doesn't complete again.
  await page.keyboard.press("Backspace")
  await expect(input(page)).toHaveValue("Lap")
})

test("search: Enter searches and closes the list", async ({ page }) => {
  await page.keyboard.type("Lap")
  await page.keyboard.press("Enter")
  await expect(last(page)).toHaveText("Last search: Laptop (Laptop)")
  await expect(options(page)).toHaveCount(0)
  await expect(input(page)).toBeFocused()
})

test("search: ↓ enters the list showing the item's text; ↑ from the first returns and restores what was typed", async ({ page }) => {
  await page.keyboard.type("Lap")
  await page.keyboard.press("ArrowDown")
  await expect(options(page).first()).toBeFocused()
  await expect(input(page)).toHaveValue("Laptop")
  await page.keyboard.press("ArrowDown")
  await expect(options(page).nth(1)).toBeFocused()
  await expect(input(page)).toHaveValue("Lap desk")
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("ArrowUp")
  await expect(input(page)).toBeFocused()
  await expect(input(page)).toHaveValue("Lap")
})

test("search: Escape closes the list and restores the typed value, from the field and from the list", async ({ page }) => {
  await page.keyboard.type("Lap")
  await page.keyboard.press("Escape")
  await expect(options(page)).toHaveCount(0)
  await expect(input(page)).toHaveValue("Lap")
  await page.keyboard.type("t")
  await expect(options(page)).toHaveCount(3)
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Escape")
  await expect(options(page)).toHaveCount(0)
  await expect(input(page)).toBeFocused()
  await expect(input(page)).toHaveValue("Lapt")
})

test("search: picking a suggestion searches with it, fills the field and keeps focus there", async ({ page }) => {
  await page.keyboard.type("Lap")
  await options(page).nth(1).click()
  await expect(last(page)).toHaveText("Last search: Lap desk (Lap desk)")
  await expect(input(page)).toHaveValue("Lap desk")
  await expect(input(page)).toBeFocused()
  await expect(options(page)).toHaveCount(0)
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.type("Mon")
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Enter")
  await expect(last(page)).toHaveText("Last search: Laptop (Laptop)")
})

test("search: the clear icon empties the field; the icon searches; focus leaving closes the list", async ({ page }) => {
  await page.keyboard.type("xyz")
  await root(page).getByRole("button", { name: "Search", exact: true }).click()
  await expect(last(page)).toHaveText("Last search: xyz")
  await root(page).getByRole("button", { name: "Clear Search" }).click()
  await expect(input(page)).toHaveValue("")
  await expect(input(page)).toBeFocused()
  await page.keyboard.type("Mon")
  await expect(options(page)).toHaveCount(3)
  await page.keyboard.press("Tab")
  await expect(options(page)).toHaveCount(0)
})

test("search: a scope select drives the placeholder", async ({ page }) => {
  const scoped = page.locator("#search-demo-scoped")
  await expect(scoped.getByRole("searchbox")).toHaveAttribute("placeholder", "Search in: All")
  await scoped.getByRole("combobox", { name: "Select Scope" }).focus()
  await page.keyboard.press("ArrowDown")
  await expect(scoped.getByRole("searchbox")).toHaveAttribute("placeholder", "Search in: Apps")
})
