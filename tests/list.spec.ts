import { expect, test, type Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
})

const demo = (page: Page) => page.locator("#list-demo-selection")
const item = (page: Page, name: string) => demo(page).getByRole("listitem").filter({ hasText: name })

test("list: roles, header label and selection announced on list items", async ({ page }) => {
  const list = demo(page).getByRole("list")
  await expect(list).toHaveAccessibleName(/Contains Multi-Selectable Items Fruits/)
  await expect(demo(page).getByRole("listitem")).toHaveCount(5)
  // role=listitem can't carry aria-selected; UI5 announces it through aria-describedby too.
  await expect(item(page, "Bananas")).toHaveAccessibleDescription("Selected")
  await expect(item(page, "Apples")).toHaveAccessibleDescription("Not Selected")
  await expect(item(page, "Bananas")).not.toHaveAttribute("aria-selected", /.*/)
})

test("list: one tab stop on the selected item; arrows, Home/End, PageUp/PageDown move focus without wrapping", async ({ page }) => {
  await page.getByRole("button", { name: "singleAuto" }).focus()
  await page.getByRole("button", { name: "multiple" }).focus()
  await page.keyboard.press("Tab")
  await expect(item(page, "Bananas")).toBeFocused()
  await page.keyboard.press("ArrowUp")
  await expect(item(page, "Apples")).toBeFocused()
  await page.keyboard.press("ArrowUp") // no wrap
  await expect(item(page, "Apples")).toBeFocused()
  await page.keyboard.press("End")
  await expect(item(page, "Elderberries")).toBeFocused()
  await page.keyboard.press("Home")
  await expect(item(page, "Apples")).toBeFocused()
  await page.keyboard.press("PageDown") // 10 items down, clamped to the last
  await expect(item(page, "Elderberries")).toBeFocused()
  await page.keyboard.press("PageUp")
  await expect(item(page, "Apples")).toBeFocused()
  await expect(demo(page).locator('[tabindex="0"][data-slot="list-item"]')).toHaveCount(1)
})

test("list: Tab leaves the list, Shift+Tab comes back to the last focused item", async ({ page }) => {
  await item(page, "Cherries").click()
  await page.keyboard.press("Tab") // growing mode: Tab from an item goes to the More button
  await expect(demo(page).getByRole("button", { name: "More" })).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(item(page, "Cherries")).toBeFocused()
  await page.keyboard.press("Shift+Tab") // leaves the list backwards
  await expect(page.locator(":focus")).not.toHaveAttribute("data-slot", "list-item")
  await expect(demo(page).locator(":focus")).toHaveCount(0)
})

test("list: multiple mode — Space, Enter, click and the check box toggle", async ({ page }) => {
  const apples = item(page, "Apples")
  await apples.click()
  await expect(apples).toHaveAccessibleDescription("Selected")
  await expect(page.locator("#list-demo-clicked")).toHaveText("Last clicked: Apples")
  await page.keyboard.press("Space")
  await expect(apples).toHaveAccessibleDescription("Not Selected")
  await page.keyboard.press("Enter")
  await expect(apples).toHaveAccessibleDescription("Selected")
  await item(page, "Cherries").locator(".fiori-checkbox").click()
  await expect(item(page, "Cherries")).toHaveAccessibleDescription("Selected")
  await expect(page.locator("#list-demo-clicked")).toHaveText("Last clicked: Apples") // the check box doesn't fire item-click
  await expect(demo(page).locator("footer")).toHaveText("Selected: Bananas, Apples, Cherries")
})

test("list: single modes select one item; SingleAuto selects on focus", async ({ page }) => {
  await page.getByRole("button", { name: "singleStart", exact: true }).click()
  await expect(demo(page).locator(".fiori-radio")).toHaveCount(5)
  await item(page, "Cherries").click()
  await expect(demo(page).locator("footer")).toHaveText("Selected: Cherries")
  await page.keyboard.press("Enter") // re-selecting keeps the selection
  await expect(demo(page).locator("footer")).toHaveText("Selected: Cherries")
  await page.getByRole("button", { name: "singleAuto" }).click()
  await item(page, "Cherries").focus()
  await page.keyboard.press("ArrowDown")
  await expect(demo(page).locator("footer")).toHaveText("Selected: Dates")
})

test("list: growing button — ↓ on the last item, Enter loads more, ↑ goes back", async ({ page }) => {
  await item(page, "Elderberries").click()
  await page.keyboard.press("ArrowDown")
  const more = demo(page).getByRole("button", { name: "More" })
  await expect(more).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(demo(page).getByRole("listitem")).toHaveCount(9)
  await page.keyboard.press("ArrowUp")
  await expect(item(page, "Kiwis")).toBeFocused()
  await more.click()
  await expect(demo(page).getByRole("listitem")).toHaveCount(13)
})

test("list: delete mode — Delete key and delete button remove items; no data text", async ({ page }) => {
  const list = page.locator("#list-demo-delete")
  await expect(list.getByRole("list")).toHaveAccessibleName(/Contains Deletable Items/)
  await list.getByRole("listitem").filter({ hasText: "Inbox" }).click()
  await page.keyboard.press("Delete")
  await expect(list.getByRole("listitem").filter({ hasText: "Inbox" })).toHaveCount(0)
  await list.getByRole("listitem").filter({ hasText: "Drafts" }).getByRole("button", { name: "Delete" }).click()
  for (const x of ["Sent", "Spam"]) await list.getByRole("listitem").filter({ hasText: x }).getByRole("button", { name: "Delete" }).click()
  await expect(list.getByRole("listitem")).toHaveText("No folders")
})

test("list: custom items — Tab into content, F2 toggles, ↓ moves between content of adjacent items", async ({ page }) => {
  const list = page.locator("#list-demo-custom")
  const first = list.getByRole("listitem").first()
  await first.click({ position: { x: 10, y: 10 } })
  await page.keyboard.press("Tab")
  await expect(page.locator("#list-demo-custom-btn-a")).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(page.locator("#list-demo-custom-btn-b")).toBeFocused()
  await page.keyboard.press("F2")
  await expect(list.getByRole("listitem").nth(1)).toBeFocused()
  await page.keyboard.press("F2")
  await expect(page.locator("#list-demo-custom-btn-b")).toBeFocused()
  await page.keyboard.press("Tab") // last content element: leaves the list
  await expect(list.locator(":focus")).toHaveCount(0)
})

test("list: group headers take part in arrow navigation; disabled items are skipped", async ({ page }) => {
  const list = page.locator("#list-demo-rich")
  const headers = list.locator('[data-slot="list-item-group-header"]')
  await expect(headers).toHaveCount(2)
  await headers.first().focus()
  await page.keyboard.press("ArrowDown")
  await expect(list.getByRole("listitem").filter({ hasText: "John Doe" })).toBeFocused()
  await page.keyboard.press("End") // "Settings" item is disabled
  await expect(list.getByRole("listitem").filter({ hasText: "Mail" })).toBeFocused()
  await expect(list.getByRole("listitem").filter({ hasText: "Settings" }).last()).toHaveAttribute("aria-disabled", "true")
})

test("list: item focus ring only for keyboard focus", async ({ page }) => {
  const apples = item(page, "Apples")
  await apples.click()
  expect(await apples.evaluate((el) => getComputedStyle(el, "::after").content)).toBe("none")
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("ArrowUp")
  expect(await apples.evaluate((el) => getComputedStyle(el, "::after").content)).not.toBe("none")
})
