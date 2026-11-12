import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/view-settings-dialog`)
  await page.waitForSelector("html[data-ready=true]")
})

test("view-settings-dialog: opens on Sort; lists, segmented modes, Reset disabled initially", async ({ page }) => {
  await page.locator("#view-settings-dialog-demo-open").click()
  const dialog = page.getByRole("dialog", { name: "View Settings" })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole("listbox", { name: "Sort Order" }).getByRole("option")).toHaveText(["Ascending", "Descending"])
  await expect(dialog.getByRole("listbox", { name: "Sort By" }).getByRole("option", { selected: true })).toHaveText("Name")
  await expect(dialog.getByRole("option", { name: "Sort" })).toHaveAttribute("aria-selected", "true")
  await expect(dialog.getByRole("button", { name: "Reset" })).toBeDisabled()
  // Focus starts on the selected item of the first list.
  await expect(dialog.getByRole("option", { name: "Ascending" })).toBeFocused()
})

test("view-settings-dialog: keyboard selection, Reset, OK confirms", async ({ page }) => {
  await page.locator("#view-settings-dialog-demo-open").click()
  const dialog = page.getByRole("dialog", { name: "View Settings" })
  await expect(dialog.getByRole("option", { name: "Ascending" })).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(dialog.getByRole("option", { name: "Descending" })).toBeFocused()
  await page.keyboard.press("Space")
  await expect(dialog.getByRole("option", { name: "Descending" })).toHaveAttribute("aria-selected", "true")
  await expect(dialog.getByRole("button", { name: "Reset" })).toBeEnabled()
  await page.keyboard.press("Tab") // next list
  await expect(dialog.getByRole("option", { name: "Name" })).toBeFocused()
  await page.keyboard.press("End")
  await page.keyboard.press("Enter")
  await expect(dialog.getByRole("option", { name: "Company" })).toHaveAttribute("aria-selected", "true")
  await dialog.getByRole("button", { name: "OK" }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.locator("#view-settings-dialog-demo-result")).toContainText('"sortBy":"Company","sortDescending":true')
  await expect(page.locator("#view-settings-dialog-demo-open")).toBeFocused()
})

test("view-settings-dialog: two-level filter navigation with counters and back button", async ({ page }) => {
  await page.locator("#view-settings-dialog-demo-open").click()
  const dialog = page.getByRole("dialog", { name: "View Settings" })
  await dialog.getByRole("option", { name: "Filter" }).click()
  await dialog.getByRole("listitem").filter({ hasText: "Position" }).click()
  const step2 = page.getByRole("dialog", { name: "Filter By: Position" })
  await expect(step2).toBeVisible()
  await expect(step2.getByRole("option", { name: "CTO" })).toBeFocused()
  await page.keyboard.press("Space")
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Space")
  await expect(step2.getByRole("option", { selected: true })).toHaveText(["CTO", "CPO"])
  await step2.getByRole("button", { name: "Back" }).click()
  await expect(dialog.getByRole("listitem").filter({ hasText: "Position" })).toContainText("2")
  await dialog.getByRole("button", { name: "OK" }).click()
  await expect(page.locator("#view-settings-dialog-demo-result")).toContainText('"filters":{"Position":["CTO","CPO"]}')
})

test("view-settings-dialog: Escape and Cancel restore the confirmed settings", async ({ page }) => {
  await page.locator("#view-settings-dialog-demo-open").click()
  let dialog = page.getByRole("dialog", { name: "View Settings" })
  await dialog.getByRole("option", { name: "Descending" }).click()
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(page.locator("#view-settings-dialog-demo-open")).toBeFocused()
  await page.locator("#view-settings-dialog-demo-open").click()
  dialog = page.getByRole("dialog", { name: "View Settings" })
  await expect(dialog.getByRole("option", { name: "Ascending" })).toHaveAttribute("aria-selected", "true")
  await dialog.getByRole("option", { name: "Descending" }).click()
  await dialog.getByRole("button", { name: "Cancel" }).click()
  await page.locator("#view-settings-dialog-demo-open").click()
  await expect(page.getByRole("dialog", { name: "View Settings" }).getByRole("option", { name: "Ascending" })).toHaveAttribute("aria-selected", "true")
})

test("view-settings-dialog: focus is trapped", async ({ page }) => {
  await page.locator("#view-settings-dialog-demo-open").click()
  const dialog = page.getByRole("dialog", { name: "View Settings" })
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab")
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)
  }
})
