import { expect, test, type Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/value-help-dialog`)
  await page.waitForSelector("html[data-ready=true]")
})

const openMulti = async (page: Page) => {
  await page.locator("#value-help-dialog-demo-open").click()
  const dialog = page.getByRole("dialog", { name: "Product" })
  await expect(dialog).toBeVisible()
  return dialog
}

test("value-help-dialog: guideline structure (tabs, search, Go, Show Filters, Items (n), tokens, OK/Cancel)", async ({ page }) => {
  const dialog = await openMulti(page)
  await expect(dialog.getByRole("tab")).toHaveText(["Search and Select (0)", "Define Conditions (0)"])
  await expect(dialog.getByRole("searchbox", { name: "Search" })).toBeVisible()
  await expect(dialog.getByRole("button", { name: "Go" })).toBeVisible()
  await expect(dialog.getByRole("button", { name: "Show Filters" })).toBeVisible()
  await expect(dialog.getByRole("grid", { name: "Items (7)" })).toBeVisible()
  await expect(dialog.getByRole("columnheader")).toHaveText(["", "Product ID", "Product Name", "Category", "Color"])
  await expect(dialog.getByText("Selected Items and Conditions (0)")).toBeVisible()
  await expect(dialog.locator("[data-slot=dialog-footer]").getByRole("button")).toHaveText(["OK", "Cancel"])
})

test("value-help-dialog: rows toggle with Space / click; tokens; Delete removes a token; OK returns the selection", async ({ page }) => {
  const dialog = await openMulti(page)
  const rows = dialog.locator("tbody tr[data-row]")
  await rows.first().focus()
  await page.keyboard.press("Space")
  await expect(rows.first()).toHaveAttribute("aria-selected", "true")
  await page.keyboard.press("ArrowDown")
  await expect(rows.nth(1)).toBeFocused()
  await page.keyboard.press("End")
  await expect(rows.last()).toBeFocused()
  await page.keyboard.press("Space")
  await rows.nth(3).click()
  const tokens = dialog.locator("[data-slot=value-help-token]")
  await expect(tokens).toHaveText(["Notebook Basic 15 (HT 1000)", "Speakers (PD-106)", "Keyboard (PD-101)"])
  await expect(dialog.getByRole("tab", { name: "Search and Select (3)" })).toBeVisible()
  await tokens.nth(1).getByRole("button").focus()
  await page.keyboard.press("Delete")
  await expect(tokens).toHaveText(["Notebook Basic 15 (HT 1000)", "Keyboard (PD-101)"])
  await expect(tokens.nth(1).getByRole("button")).toBeFocused()
  await dialog.getByRole("button", { name: "OK", exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.locator("#value-help-dialog-demo-multi")).toHaveValue("HT 1000, PD-101")
})

test("value-help-dialog: search and filters narrow the table on Go / Enter", async ({ page }) => {
  const dialog = await openMulti(page)
  await dialog.getByRole("searchbox").fill("note")
  await expect(dialog.locator("tbody tr[data-row]")).toHaveCount(7) // only on Go
  await dialog.getByRole("button", { name: "Go" }).click()
  await expect(dialog.locator("tbody tr[data-row]")).toHaveCount(3)
  await dialog.getByRole("searchbox").fill("")
  await dialog.getByRole("button", { name: "Show Filters" }).click()
  await expect(dialog.getByRole("button", { name: "Hide Filters" })).toBeVisible()
  await dialog.locator("[data-slot=value-help-filters]").getByLabel("Color").fill("black")
  await page.keyboard.press("Enter")
  await expect(dialog.getByRole("grid", { name: "Items (3)" })).toBeVisible()
  // Select all selects the visible rows.
  await dialog.getByRole("checkbox", { name: "Select All" }).click()
  await expect(dialog.getByText("Selected Items and Conditions (3)")).toBeVisible()
})

test("value-help-dialog: Define Conditions — operator select, value rows, add / remove; tokens", async ({ page }) => {
  const dialog = await openMulti(page)
  await dialog.getByRole("tab", { name: /Define Conditions/ }).click()
  const rows = dialog.locator("[data-slot=value-help-condition]")
  await expect(rows).toHaveCount(1)
  await rows.first().getByRole("combobox", { name: "Operator" }).click()
  await page.getByRole("option", { name: "starts with" }).click()
  await rows.first().getByRole("textbox", { name: "Value" }).fill("H")
  await dialog.getByRole("button", { name: "Add" }).click()
  await expect(rows).toHaveCount(2)
  await rows.nth(1).getByRole("combobox", { name: "Operator" }).focus()
  await page.keyboard.press("ArrowDown") // Select: arrows change the value while closed → "between"
  await rows.nth(1).getByRole("textbox", { name: "From" }).fill("1")
  await rows.nth(1).getByRole("textbox", { name: "To" }).fill("5")
  const tokens = dialog.locator("[data-slot=value-help-token]")
  await expect(tokens).toHaveText(["H*", "1...5"])
  await expect(dialog.getByRole("tab", { name: "Define Conditions (2)" })).toBeVisible()
  await rows.first().getByRole("button", { name: "Remove Condition" }).click()
  await expect(tokens).toHaveText(["1...5"])
  await dialog.getByRole("button", { name: "Remove All" }).click()
  await expect(tokens).toHaveCount(0)
})

test("value-help-dialog: Escape cancels and returns focus; focus is trapped", async ({ page }) => {
  const dialog = await openMulti(page)
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab")
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)
  }
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(page.locator("#value-help-dialog-demo-open")).toBeFocused()
})

test("value-help-dialog: single selection — no tabs/tokens/OK; Enter on a row confirms", async ({ page }) => {
  await page.locator("#value-help-dialog-demo-open-single").click()
  const dialog = page.getByRole("dialog", { name: "Select: Product" })
  await expect(dialog.getByRole("tab")).toHaveCount(0)
  await expect(dialog.getByRole("checkbox")).toHaveCount(0)
  await expect(dialog.locator("[data-slot=dialog-footer]").getByRole("button")).toHaveText(["Cancel"])
  const rows = dialog.locator("tbody tr[data-row]")
  await rows.first().focus()
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Enter")
  await expect(dialog).toHaveCount(0)
  await expect(page.locator("#value-help-dialog-demo-single")).toHaveValue("HT 1001")
})
