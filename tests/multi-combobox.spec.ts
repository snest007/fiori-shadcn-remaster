import { expect, test, type Page } from "@playwright/test"

const input = (page: Page) => page.locator("#multi-combobox-countries")
const field = (page: Page) => page.locator('[data-slot="multi-combobox"]').filter({ has: input(page) })
const token = (page: Page, text: string) => field(page).locator('[role="option"]', { hasText: text })
// Only one MultiComboBox list is open at a time.
const list = (page: Page) => page.locator('[data-slot="multi-combobox-list"]')
/** Opens the list from the field and waits until focus has moved into it (it moves asynchronously, as in UI5). */
async function openList(page: Page, key: "F4" | "Alt+ArrowDown") {
  await page.keyboard.press(key)
  await expect.poll(() => list(page).evaluate((l) => l.contains(document.activeElement)).catch(() => false)).toBe(true)
}
const option = (page: Page, text: string) => list(page).getByRole("option", { name: new RegExp(`^${text}`) })
const selected = (page: Page) => page.getByTestId("multi-combobox-selected")

test.describe("MultiComboBox (Fiori model)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/index.html`)
    await page.waitForSelector("html[data-ready=true]")
  })

  test("ARIA: combobox controlling a multiselectable listbox; tokens for the selection", async ({ page }) => {
    await expect(input(page)).toHaveAttribute("role", "combobox")
    await expect(input(page)).toHaveAttribute("aria-expanded", "false")
    await expect(field(page).getByRole("listbox")).toHaveCount(1)
    await expect(field(page).locator('[role="option"]')).toHaveCount(2)
    await input(page).focus()
    await page.keyboard.press("F4")
    await expect(input(page)).toHaveAttribute("aria-expanded", "true")
    const listId = await input(page).getAttribute("aria-controls")
    await expect(page.locator(`[id="${listId}"]`)).toHaveAttribute("role", "listbox")
    await expect(page.locator(`[id="${listId}"]`)).toHaveAttribute("aria-multiselectable", "true")
    await expect(option(page, "Germany")).toHaveAttribute("aria-selected", "true")
    await expect(option(page, "Canada")).toHaveAttribute("aria-selected", "false")
  })

  test("typing filters and autocompletes; Enter selects the match and clears the text", async ({ page }) => {
    await input(page).click()
    await page.keyboard.type("au")
    await expect(input(page)).toHaveValue("Australia")
    await expect(list(page).getByRole("option")).toHaveCount(2)
    await page.keyboard.press("Enter")
    await expect(selected(page)).toHaveText("AU, FR, DE")
    await expect(input(page)).toHaveValue("")
    await expect(list(page)).toHaveCount(0)
  })

  test("Enter on an already selected item flags it", async ({ page }) => {
    await input(page).click()
    await page.keyboard.type("Germany")
    await page.keyboard.press("Enter")
    await expect(field(page)).toHaveAttribute("data-value-state", "negative")
    await expect(field(page).getByText("This value is already selected.")).toBeAttached()
    await expect(selected(page)).toHaveText("DE, FR") // unchanged
  })

  test("text matching nothing is flagged and cleared on blur", async ({ page }) => {
    await input(page).click()
    await page.keyboard.type("xyz")
    await expect(field(page)).toHaveAttribute("data-value-state", "negative")
    await expect(input(page)).toHaveAttribute("aria-invalid", "true")
    await page.keyboard.press("Tab")
    await expect(input(page)).toHaveValue("")
    await expect(field(page)).not.toHaveAttribute("data-value-state", "negative")
  })

  test("F4 opens and focuses the first selected item; Space toggles and keeps it open", async ({ page }) => {
    await input(page).click()
    await page.keyboard.press("F4")
    await expect(list(page)).toBeVisible()
    await expect(option(page, "France")).toBeFocused()
    await page.keyboard.press("Space")
    await expect(selected(page)).toHaveText("DE")
    await expect(list(page)).toBeVisible()
    await page.keyboard.press("ArrowDown")
    await expect(option(page, "Germany")).toBeFocused()
    await page.keyboard.press("Shift+ArrowDown") // extends Germany's (selected) state to India
    await expect(option(page, "India")).toBeFocused()
    await expect(selected(page)).toHaveText("DE, IN")
    await page.keyboard.press("F4")
    await expect(list(page)).toHaveCount(0)
    await expect(input(page)).toBeFocused()
  })

  test("Enter on an item toggles it and closes; Escape closes and returns focus", async ({ page }) => {
    await input(page).click()
    await openList(page, "Alt+ArrowDown")
    await page.keyboard.press("ArrowDown")
    await expect(option(page, "Germany")).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(selected(page)).toHaveText("FR")
    await expect(list(page)).toHaveCount(0)
    await expect(input(page)).toBeFocused()
    await openList(page, "F4")
    await page.keyboard.press("Escape")
    await expect(list(page)).toHaveCount(0)
    await expect(input(page)).toBeFocused()
  })

  test("↓ from the open field goes to Select All, then the items; ↑ goes back", async ({ page }) => {
    await input(page).click()
    await page.keyboard.type("b")
    await expect(list(page).getByRole("option")).toHaveText([/Belgium/, /Brazil/, /Bulgaria/])
    await page.keyboard.press("ArrowDown")
    const selectAll = page.locator('[data-slot="multi-combobox-select-all"]')
    await expect(selectAll).toBeFocused()
    await expect(selectAll).toHaveText("Select All (2 of 13)")
    await page.keyboard.press("ArrowDown")
    await expect(option(page, "Belgium")).toBeFocused()
    await page.keyboard.press("ArrowUp")
    await expect(selectAll).toBeFocused()
    await page.keyboard.press("Space") // selects all filtered items
    await expect(selected(page)).toHaveText("BE, BR, BG, FR, DE")
    await page.keyboard.press("ArrowUp")
    await expect(input(page)).toBeFocused()
  })

  test("Ctrl+A in the list toggles all items", async ({ page }) => {
    await input(page).click()
    await openList(page, "F4")
    await page.keyboard.press("ControlOrMeta+a")
    await expect(list(page).locator('[aria-selected="true"]')).toHaveCount(13)
    await page.keyboard.press("ControlOrMeta+a")
    await expect(selected(page)).toHaveText("—")
  })

  test("clicking the check box toggles and keeps the list open; clicking the row toggles and closes", async ({ page }) => {
    await field(page).locator('[data-slot="multi-combobox-arrow"]').click()
    await expect(list(page)).toBeVisible()
    await option(page, "Canada").locator('[data-slot="checkbox"]').click()
    await expect(selected(page)).toHaveText("CA, FR, DE")
    await expect(list(page)).toBeVisible()
    await option(page, "Japan").click()
    await expect(selected(page)).toHaveText("CA, FR, DE, JP")
    await expect(list(page)).toHaveCount(0)
    await expect(input(page)).toBeFocused()
  })

  test("↑/↓ while closed walk the unselected items in the field", async ({ page }) => {
    await input(page).click()
    await page.keyboard.press("ArrowDown")
    await expect(input(page)).toHaveValue("Argentina")
    await page.keyboard.press("ArrowDown")
    await expect(input(page)).toHaveValue("Australia")
    await page.keyboard.press("ArrowUp")
    await expect(input(page)).toHaveValue("Argentina")
    await expect(list(page)).toHaveCount(0)
  })

  test("Backspace in the empty field focuses the last token; again deletes it", async ({ page }) => {
    await input(page).click()
    await page.keyboard.press("Backspace")
    await expect(token(page, "Germany")).toBeFocused()
    await page.keyboard.press("Backspace")
    await expect(selected(page)).toHaveText("FR")
    await expect(token(page, "France")).toBeFocused()
    await page.keyboard.press("ArrowRight")
    await expect(input(page)).toBeFocused()
  })

  test("Ctrl+I in the field toggles the list", async ({ page }) => {
    await input(page).click()
    await page.keyboard.press("ControlOrMeta+i")
    await expect(list(page)).toBeVisible()
    await expect(list(page).getByRole("option")).toHaveCount(13)
    await page.keyboard.press("ControlOrMeta+i")
    await expect(list(page)).toHaveCount(0)
  })

  test("'n more' opens the list with only the selected items", async ({ page }) => {
    await input(page).click()
    await openList(page, "F4")
    for (const c of ["Argentina", "Australia", "Austria", "Belgium"]) await option(page, c).locator('[data-slot="checkbox"]').click()
    await page.keyboard.press("Escape")
    await page.locator("body").click({ position: { x: 5, y: 5 } })
    const more = field(page).locator(".fiori-tokenizer__more")
    await expect(more).toBeVisible()
    await more.click()
    await expect(list(page)).toBeVisible()
    await expect(list(page).getByRole("option")).toHaveCount(6)
    await expect(list(page).locator('[aria-selected="false"]')).toHaveCount(0)
  })

  test("token delete icon deselects the item", async ({ page }) => {
    await token(page, "France").locator(".fiori-token__icon").click()
    await expect(selected(page)).toHaveText("DE")
  })
})

const groupInput = (page: Page) => page.locator("#multi-combobox-demo #multi-combobox-groups")
const groupList = (page: Page) => page.locator('[id="multi-combobox-groups-list"]')
const groupOption = (page: Page, name: string) => groupList(page).getByRole("option", { name })
const groupSelected = (page: Page) => page.locator('#multi-combobox-demo [data-testid="multi-combobox-groups-selected"]')
const groupField = (page: Page) => page.locator('#multi-combobox-demo [data-slot="multi-combobox"]').filter({ has: page.locator("#multi-combobox-groups") })
const groupSelectAll = (page: Page) => page.locator('[data-slot="multi-combobox-popover"]').filter({ has: groupList(page) }).locator('[data-slot="multi-combobox-select-all"]')

async function openGroupList(page: Page) {
  await groupInput(page).focus()
  await page.keyboard.press("F4")
  await expect(groupOption(page, "Argentina")).toBeFocused()
}

test.describe("MultiComboBox item groups", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/index.html")
    await page.waitForSelector("html[data-ready=true]")
  })

  test("ARIA groups and Select All count only selectable items", async ({ page }) => {
    await openGroupList(page)
    await expect(groupList(page)).toHaveAttribute("aria-multiselectable", "true")
    await expect(groupList(page).locator('[data-slot="multi-combobox-item-group"]')).toHaveCount(2)
    await expect(groupList(page).locator('[data-slot="multi-combobox-item-group"]').filter({ has: page.getByRole("group", { name: "Americas", exact: true }) }).getByRole("option")).toHaveCount(3)
    await expect(groupList(page).getByRole("option")).toHaveCount(7)
    await expect(groupSelectAll(page)).toHaveText("Select All (0 of 7)")
    await expect(groupList(page).getByRole("group", { name: "Empty" })).toHaveCount(0)
    for (const header of await groupList(page).locator('[data-slot="multi-combobox-group-header"]').all()) {
      await expect(header).toHaveAttribute("tabindex", /^(0|-1)$/)
      await expect(header).not.toHaveAttribute("aria-selected")
      await expect(header).toHaveAttribute("role", "group")
    }
    await groupSelectAll(page).click()
    await expect(groupSelectAll(page)).toHaveText("Select All (7 of 7)")
    await expect(groupSelected(page)).toHaveText("Argentina, Brazil, Canada, Denmark, Estonia, France, Japan")
    await expect(groupField(page).locator('[data-slot="token"]')).toHaveCount(7)
    await expect(groupList(page).getByRole("option", { selected: true })).toHaveCount(7)
  })

  test("filtering retains matching groups and never autocompletes a header", async ({ page }) => {
    await groupInput(page).focus()
    await page.keyboard.type("ca")
    await expect(groupInput(page)).toHaveValue("Canada")
    await expect(groupList(page).locator('[data-slot="multi-combobox-item-group"]')).toHaveCount(1)
    await expect(groupList(page).locator('[data-slot="multi-combobox-item-group"]').filter({ has: page.getByRole("group", { name: "Americas", exact: true }) }).getByRole("option")).toHaveText("Canada")
    await page.keyboard.press("Enter")
    await expect(groupSelected(page)).toHaveText("Canada")
    await expect(groupInput(page)).toHaveValue("")
    await page.keyboard.type("Europe")
    await expect(groupInput(page)).toHaveValue("Europe")
    await expect(groupList(page)).toHaveCount(0)
    await expect(groupField(page)).toHaveAttribute("data-value-state", "negative")
  })

  test("open navigation focuses nonselectable headers; item selection uses the event bridge", async ({ page }) => {
    await groupField(page).evaluate((el) => {
      el.addEventListener("fiori-control-selection-change", () => el.setAttribute("data-selections", String(Number(el.getAttribute("data-selections") ?? "0") + 1)))
    })
    await openGroupList(page)
    for (const name of ["Brazil", "Canada"]) {
      await page.keyboard.press("ArrowDown")
      await expect(groupOption(page, name)).toBeFocused()
    }
    await page.keyboard.press("ArrowDown")
    await expect(groupList(page).getByRole("group", { name: "Europe", exact: true })).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(groupList(page)).toBeVisible()
    await expect(groupSelected(page)).toHaveText("—")
    await page.keyboard.press("Space")
    await expect(groupSelected(page)).toHaveText("—")
    await page.keyboard.press("ArrowDown")
    await expect(groupOption(page, "Denmark")).toBeFocused()
    await page.keyboard.press("PageDown")
    await expect(groupOption(page, "Japan")).toBeFocused()
    await page.keyboard.press("PageUp")
    await expect(groupList(page).getByRole("group", { name: "Americas", exact: true })).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(groupOption(page, "Argentina")).toBeFocused()
    await page.keyboard.press("Space")
    await expect(groupSelected(page)).toHaveText("Argentina")
    await expect(groupField(page)).toHaveAttribute("data-selections", "1")
    await page.keyboard.press("Shift+ArrowDown")
    await expect(groupOption(page, "Brazil")).toBeFocused()
    await expect(groupSelected(page)).toHaveText("Argentina, Brazil")
  })

  test("Ctrl+A and filtered Select All toggle only items", async ({ page }) => {
    await openGroupList(page)
    await page.keyboard.press("ControlOrMeta+a")
    await expect(groupList(page).getByRole("option", { selected: true })).toHaveCount(7)
    await expect(groupSelectAll(page)).toHaveText("Select All (7 of 7)")
    await page.keyboard.press("ControlOrMeta+a")
    await expect(groupSelected(page)).toHaveText("—")
    await page.keyboard.press("Escape")
    await expect(groupInput(page)).toBeFocused()
    await page.keyboard.type("ca")
    await expect(groupList(page).getByRole("option")).toHaveCount(1)
    await page.keyboard.press("ArrowDown")
    await expect(groupSelectAll(page)).toBeFocused()
    await page.keyboard.press("Space")
    await expect(groupSelected(page)).toHaveText("Canada")
    await expect(groupSelectAll(page)).toHaveText("Select All (1 of 7)")
    await page.keyboard.press("ArrowDown")
    await expect(groupList(page).getByRole("group", { name: "Americas", exact: true })).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(groupOption(page, "Canada")).toBeFocused()
    await page.keyboard.press("ControlOrMeta+a")
    await expect(groupSelected(page)).toHaveText("—")
  })

  test("selected-items view keeps only groups containing selected items", async ({ page }) => {
    await openGroupList(page)
    for (const name of ["Argentina", "Brazil", "Canada"]) {
      await groupOption(page, name).locator('[data-slot="checkbox"]').click()
      await expect(groupOption(page, name)).toHaveAttribute("aria-selected", "true")
    }
    await page.keyboard.press("Escape")
    // Narrow this real field so three tokens overflow and expose the selected-items picker.
    await groupField(page).evaluate((el) => { el.style.width = "15rem" })
    await page.locator("body").click({ position: { x: 5, y: 5 } })
    await expect(groupField(page).locator(".fiori-tokenizer__more")).toBeVisible()
    await groupField(page).locator(".fiori-tokenizer__more").click()
    await expect(groupList(page).locator('[data-slot="multi-combobox-item-group"]')).toHaveCount(1)
    await expect(groupList(page).locator('[data-slot="multi-combobox-item-group"]').filter({ has: page.getByRole("group", { name: "Americas", exact: true }) }).getByRole("option")).toHaveCount(3)
    await expect(groupList(page).getByRole("option", { selected: false })).toHaveCount(0)
  })

  test("closed navigation skips headers and selected grouped items", async ({ page }) => {
    await groupInput(page).focus()
    for (const value of ["Argentina", "Brazil", "Canada", "Denmark"]) {
      await page.keyboard.press("ArrowDown")
      await expect(groupInput(page)).toHaveValue(value)
      await expect(groupList(page)).toHaveCount(0)
    }
    await page.keyboard.press("ArrowUp")
    await expect(groupInput(page)).toHaveValue("Canada")
    await page.keyboard.press("Enter")
    await expect(groupSelected(page)).toHaveText("Canada")
    await page.keyboard.press("ArrowDown")
    await expect(groupInput(page)).toHaveValue("Argentina")
  })

})
