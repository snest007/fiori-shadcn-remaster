import { expect, test, type Page } from "@playwright/test"

const selection = (page: Page) =>
  page.locator("#cb-country").evaluate((el: HTMLInputElement) => el.value.slice(el.selectionStart!, el.selectionEnd!))

test.describe("ComboBox (Fiori model)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/index.html`)
    await page.waitForSelector("html[data-ready=true]")
    await page.locator("#cb-country").focus()
  })

  test("ARIA: combobox with expanded / controls / activedescendant", async ({ page }) => {
    const input = page.locator("#cb-country")
    await expect(input).toHaveAttribute("role", "combobox")
    await expect(input).toHaveAttribute("aria-expanded", "false")
    await expect(input).toHaveAttribute("aria-autocomplete", "both")
    await page.keyboard.press("F4")
    await expect(input).toHaveAttribute("aria-expanded", "true")
    const listId = await input.getAttribute("aria-controls")
    await expect(page.locator(`[id="${listId}"]`)).toHaveAttribute("role", "listbox")
    // Empty value + F4 focuses (and fills in) the first item.
    const active = await input.getAttribute("aria-activedescendant")
    await expect(page.locator(`[id="${active}"]`)).toHaveText(/Argentina/)
    await expect(input).toHaveValue("Argentina")
    await expect(input).toBeFocused()
  })

  test("typing filters the list and autocompletes the first match inline", async ({ page }) => {
    const input = page.locator("#cb-country")
    await page.keyboard.type("ger")
    await expect(input).toHaveValue("Germany")
    expect(await selection(page)).toBe("many")
    await expect(page.getByRole("listbox")).toBeVisible()
    await expect(page.getByRole("option")).toHaveCount(1)
    // Per-term filtering: "k" matches "United Kingdom" (a word starting with k), not autocompleted (not a prefix).
    await page.keyboard.press("ControlOrMeta+a")
    await page.keyboard.type("k")
    await expect(page.getByRole("option")).toHaveText([/United Kingdom/])
    await expect(input).toHaveValue("k")
    // Backspace removes the completion and does not autocomplete again (the typed part takes the item's casing).
    await page.keyboard.press("ControlOrMeta+a")
    await page.keyboard.type("au")
    await expect(input).toHaveValue("Australia")
    await page.keyboard.press("Backspace")
    await expect(input).toHaveValue("Au")
    await expect(page.getByRole("option")).toHaveCount(2)
  })

  test("no match closes the list and keeps the free text", async ({ page }) => {
    const input = page.locator("#cb-country")
    await page.keyboard.type("Atlantis")
    await expect(page.getByRole("listbox")).toHaveCount(0)
    await expect(input).toHaveAttribute("aria-expanded", "false")
    await page.keyboard.press("Tab")
    await expect(input).toHaveValue("Atlantis")
    await expect(page.getByTestId("cb-committed")).toHaveText("Atlantis")
  })

  test("arrow keys walk the items while closed", async ({ page }) => {
    const input = page.locator("#cb-country")
    await page.keyboard.press("ArrowDown")
    await expect(input).toHaveValue("Argentina")
    await page.keyboard.press("ArrowDown")
    await expect(input).toHaveValue("Australia")
    await page.keyboard.press("ArrowUp")
    await expect(input).toHaveValue("Argentina")
    await page.keyboard.press("ArrowUp") // first item: stays
    await expect(input).toHaveValue("Argentina")
    await page.keyboard.press("PageDown")
    await expect(input).toHaveValue("India")
    await page.keyboard.press("End") // value is set: Home/End move the caret, not the item
    await expect(input).toHaveValue("India")
    await expect(page.getByRole("listbox")).toHaveCount(0)
  })

  test("arrow keys walk the open list; Enter selects", async ({ page }) => {
    const input = page.locator("#cb-country")
    await page.keyboard.press("Alt+ArrowDown")
    await expect(page.getByRole("listbox")).toBeVisible()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    await expect(input).toHaveValue("Austria")
    const active = await input.getAttribute("aria-activedescendant")
    await expect(page.locator(`[id="${active}"]`)).toHaveText(/Austria/)
    await expect(page.locator(`[id="${active}"]`)).toHaveAttribute("aria-selected", "true")
    await page.keyboard.press("Enter")
    await expect(page.getByRole("listbox")).toHaveCount(0)
    await expect(input).toHaveValue("Austria")
    await expect(page.getByTestId("cb-committed")).toHaveText("Austria")
  })

  test("F4 and Alt+Up toggle the list", async ({ page }) => {
    await page.keyboard.press("F4")
    await expect(page.getByRole("listbox")).toBeVisible()
    await page.keyboard.press("F4")
    await expect(page.getByRole("listbox")).toHaveCount(0)
    await page.keyboard.press("Alt+ArrowUp")
    await expect(page.getByRole("listbox")).toBeVisible()
    await page.keyboard.press("Alt+ArrowUp")
    await expect(page.getByRole("listbox")).toHaveCount(0)
  })

  test("Escape closes the list, then restores the value from focus", async ({ page }) => {
    const input = page.locator("#cb-country")
    await page.keyboard.type("Fra")
    await page.keyboard.press("Enter")
    await expect(page.getByTestId("cb-committed")).toHaveText("France")
    await page.keyboard.press("ControlOrMeta+a")
    await page.keyboard.type("Spa")
    await expect(page.getByRole("listbox")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.getByRole("listbox")).toHaveCount(0)
    await expect(input).toHaveValue("Spain")
    await page.keyboard.press("Escape")
    await expect(input).toHaveValue("France")
    await expect(input).toBeFocused()
  })

  test("clicking an item selects it and keeps focus in the field", async ({ page }) => {
    const input = page.locator("#cb-country")
    await page.locator("#cb-country ~ [data-slot=combobox-arrow]").click()
    await expect(page.getByRole("listbox")).toBeVisible()
    await page.getByRole("option", { name: /Japan/ }).click()
    await expect(input).toHaveValue("Japan")
    await expect(input).toBeFocused()
    await expect(page.getByRole("listbox")).toHaveCount(0)
    await expect(page.getByTestId("cb-committed")).toHaveText("Japan")
  })
})
