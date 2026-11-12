import { expect, test, type Page } from "@playwright/test"

// The list this ComboBox controls (the docs page has other listboxes: Select, SegmentedButton...).
// Only one ComboBox list is open at a time, so its data-slot is enough.
const list = async (page: Page) => page.locator('[data-slot="combobox-list"]')

const selection = (page: Page) =>
  page.locator("#cb-country").evaluate((el: HTMLInputElement) => el.value.slice(el.selectionStart!, el.selectionEnd!))

test.describe("ComboBox (Fiori model)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/index.html#/combobox`)
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
    await expect(await list(page)).toBeVisible()
    await expect((await list(page)).getByRole("option")).toHaveCount(1)
    // Per-term filtering: "k" matches "United Kingdom" (a word starting with k), not autocompleted (not a prefix).
    await page.keyboard.press("ControlOrMeta+a")
    await page.keyboard.type("k")
    await expect((await list(page)).getByRole("option")).toHaveText([/United Kingdom/])
    await expect(input).toHaveValue("k")
    // Backspace removes the completion and does not autocomplete again (the typed part takes the item's casing).
    await page.keyboard.press("ControlOrMeta+a")
    await page.keyboard.type("au")
    await expect(input).toHaveValue("Australia")
    await page.keyboard.press("Backspace")
    await expect(input).toHaveValue("Au")
    await expect((await list(page)).getByRole("option")).toHaveCount(2)
  })

  test("no match closes the list and keeps the free text", async ({ page }) => {
    const input = page.locator("#cb-country")
    await page.keyboard.type("Atlantis")
    await expect(await list(page)).toHaveCount(0)
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
    await expect(await list(page)).toHaveCount(0)
  })

  test("arrow keys walk the open list; Enter selects", async ({ page }) => {
    const input = page.locator("#cb-country")
    await page.keyboard.press("Alt+ArrowDown")
    await expect(await list(page)).toBeVisible()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    await expect(input).toHaveValue("Austria")
    const active = await input.getAttribute("aria-activedescendant")
    await expect(page.locator(`[id="${active}"]`)).toHaveText(/Austria/)
    await expect(page.locator(`[id="${active}"]`)).toHaveAttribute("aria-selected", "true")
    await page.keyboard.press("Enter")
    await expect(await list(page)).toHaveCount(0)
    await expect(input).toHaveValue("Austria")
    await expect(page.getByTestId("cb-committed")).toHaveText("Austria")
  })

  test("F4 and Alt+Up toggle the list", async ({ page }) => {
    await page.keyboard.press("F4")
    await expect(await list(page)).toBeVisible()
    await page.keyboard.press("F4")
    await expect(await list(page)).toHaveCount(0)
    await page.keyboard.press("Alt+ArrowUp")
    await expect(await list(page)).toBeVisible()
    await page.keyboard.press("Alt+ArrowUp")
    await expect(await list(page)).toHaveCount(0)
  })

  test("Escape closes the list, then restores the value from focus", async ({ page }) => {
    const input = page.locator("#cb-country")
    await page.keyboard.type("Fra")
    await page.keyboard.press("Enter")
    await expect(page.getByTestId("cb-committed")).toHaveText("France")
    await page.keyboard.press("ControlOrMeta+a")
    await page.keyboard.type("Spa")
    await expect(await list(page)).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(await list(page)).toHaveCount(0)
    await expect(input).toHaveValue("Spain")
    await page.keyboard.press("Escape")
    await expect(input).toHaveValue("France")
    await expect(input).toBeFocused()
  })

  test("clicking an item selects it and keeps focus in the field", async ({ page }) => {
    const input = page.locator("#cb-country")
    await page.locator("#cb-country ~ [data-slot=combobox-arrow]").click()
    await expect(await list(page)).toBeVisible()
    await page.getByRole("option", { name: /Japan/ }).click()
    await expect(input).toHaveValue("Japan")
    await expect(input).toBeFocused()
    await expect(await list(page)).toHaveCount(0)
    await expect(page.getByTestId("cb-committed")).toHaveText("Japan")
  })
})

const groupInput = (page: Page) => page.locator("#combobox-demo #combobox-groups")
const groupList = (page: Page) => page.locator('[id="combobox-groups-list"]')
const groupSelection = (page: Page) => page.locator('#combobox-demo [data-testid="combobox-groups-selection"]')

test.describe("ComboBox item groups", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/index.html#/combobox")
    await page.waitForSelector("html[data-ready=true]")
    await groupInput(page).focus()
  })

  test("ARIA groups label their items; headers and empty groups are not options", async ({ page }) => {
    await page.keyboard.press("F4")
    await expect(groupList(page)).toBeVisible()
    await expect(groupList(page).locator('[data-slot="combobox-item-group"]')).toHaveCount(2)
    await expect(groupList(page).locator('[data-slot="combobox-item-group"]').filter({ has: page.getByRole("group", { name: "Americas", exact: true }) }).getByRole("option")).toHaveCount(3)
    await expect(groupList(page).locator('[data-slot="combobox-item-group"]').filter({ has: page.getByRole("group", { name: "Europe", exact: true }) }).getByRole("option")).toHaveCount(3)
    await expect(groupList(page).getByRole("option")).toHaveCount(7)
    await expect(groupList(page).getByRole("group", { name: "Empty" })).toHaveCount(0)
    for (const header of await groupList(page).locator('[data-slot="combobox-group-header"]').all()) {
      await expect(header).not.toHaveAttribute("tabindex")
      await expect(header).not.toHaveAttribute("aria-selected")
      await expect(header).toHaveAttribute("role", "group")
    }
    await groupList(page).locator('[data-slot="combobox-group-header"]').first().click()
    await expect(groupInput(page)).toHaveValue("Argentina")
    await expect(groupInput(page)).toBeFocused()
  })

  test("filtering keeps only groups with item matches and ignores header text", async ({ page }) => {
    await page.keyboard.type("ca")
    await expect(groupInput(page)).toHaveValue("Canada")
    await expect(groupSelection(page)).toHaveText("Canada")
    await expect(groupList(page).locator('[data-slot="combobox-item-group"]')).toHaveCount(1)
    await expect(groupList(page).locator('[data-slot="combobox-item-group"]').filter({ has: page.getByRole("group", { name: "Americas", exact: true }) }).getByRole("option")).toHaveText("Canada")
    await expect.poll(() => groupInput(page).evaluate((el: HTMLInputElement) => el.value.slice(el.selectionStart!, el.selectionEnd!))).toBe("nada")
    await page.keyboard.press("ControlOrMeta+a")
    await page.keyboard.type("Europe")
    await expect(groupInput(page)).toHaveValue("Europe")
    await expect(groupList(page)).toHaveCount(0)
    await expect(groupSelection(page)).toHaveText("—")
  })

  test("open navigation focuses headers without selecting them; Enter keeps the picker open", async ({ page }) => {
    await page.keyboard.press("F4")
    await expect(groupInput(page)).toHaveValue("Argentina")
    for (const value of ["Brazil", "Canada"]) {
      await page.keyboard.press("ArrowDown")
      await expect(groupInput(page)).toHaveValue(value)
      const active = await groupInput(page).getAttribute("aria-activedescendant")
      await expect(groupList(page).locator(`[id="${active}"]`)).toHaveAttribute("role", "option")
    }
    await page.keyboard.press("ArrowDown")
    await expect(groupInput(page)).toHaveValue("")
    await expect(groupSelection(page)).toHaveText("—")
    const headerId = await groupInput(page).getAttribute("aria-activedescendant")
    await expect(groupList(page).locator(`[id="${headerId}"]`)).toHaveAttribute("aria-label", "Europe")
    await expect(groupList(page).locator(`[id="${headerId}"]`)).not.toHaveAttribute("aria-selected")
    await page.keyboard.press("Enter")
    await expect(groupList(page)).toBeVisible()
    await page.keyboard.press("ArrowDown")
    await expect(groupInput(page)).toHaveValue("Denmark")
    await page.keyboard.press("ArrowUp")
    await expect(groupInput(page)).toHaveValue("")
    await page.keyboard.press("PageDown")
    await expect(groupInput(page)).toHaveValue("Japan")
    await page.keyboard.press("PageUp")
    await expect(groupInput(page)).toHaveValue("")
    const firstHeader = await groupInput(page).getAttribute("aria-activedescendant")
    await expect(groupList(page).locator(`[id="${firstHeader}"]`)).toHaveAttribute("aria-label", "Americas")
    await page.keyboard.press("ArrowDown")
    await expect(groupInput(page)).toHaveValue("Argentina")
    await page.keyboard.press("Enter")
    await expect(groupList(page)).toHaveCount(0)
    await expect(page.locator('#combobox-demo [data-testid="combobox-groups-committed"]')).toHaveText("Argentina")
  })

  test("group item selection emits the existing committed event bridge", async ({ page }) => {
    await groupInput(page).evaluate((el) => {
      el.addEventListener("fiori-control-change", () => el.setAttribute("data-commits", String(Number(el.getAttribute("data-commits") ?? "0") + 1)))
    })
    await page.keyboard.press("F4")
    await expect(groupList(page)).toBeVisible()
    await groupList(page).getByRole("option", { name: "France" }).click()
    await expect(groupInput(page)).toHaveValue("France")
    await expect(groupInput(page)).toHaveAttribute("data-commits", "1")
    await expect(groupSelection(page)).toHaveText("France")
    await expect(page.locator('#combobox-demo [data-testid="combobox-groups-committed"]')).toHaveText("France")
    await expect(groupInput(page)).toBeFocused()
  })

  test("closed navigation skips group headers and autocompletes only items", async ({ page }) => {
    for (const value of ["Argentina", "Brazil", "Canada", "Denmark"]) {
      await page.keyboard.press("ArrowDown")
      await expect(groupInput(page)).toHaveValue(value)
      await expect(groupList(page)).toHaveCount(0)
    }
    await page.keyboard.press("ArrowUp")
    await expect(groupInput(page)).toHaveValue("Canada")
  })

  test("blank F4 follows native grouped-first ordering while closed arrows retain declaration order", async ({ page }) => {
    const input = page.locator("#combobox-demo #combobox-ordering")
    const list = page.locator('[id="combobox-ordering-list"]')
    await input.focus()
    await page.keyboard.press("ArrowDown")
    await expect(input).toHaveValue("Japan")
    await expect(list).toHaveCount(0)
    await page.keyboard.press("ControlOrMeta+a")
    await page.keyboard.press("Backspace")
    await expect(input).toHaveValue("")
    await page.keyboard.press("F4")
    await expect(input).toHaveValue("Argentina")
    await expect(list.getByRole("option")).toHaveText(["Argentina", "Japan"])
    const active = await input.getAttribute("aria-activedescendant")
    await expect(list.locator(`[id="${active}"]`)).toHaveText("Argentina")
    await expect(input).toBeFocused()
  })

})
