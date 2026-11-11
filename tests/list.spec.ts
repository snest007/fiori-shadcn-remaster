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

test("list: dragTo accepts Before and the application reorders its items", async ({ page }) => {
  const list = page.locator("#list-demo #list-movable")
  const source = list.locator('[data-nav-key="Apples"]')
  await source.dragTo(list.locator('[data-nav-key="Cherries"]'), { targetPosition: { x: 40, y: 2 } })
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("Apples Before Cherries")
  await expect(list.getByRole("listitem").first()).toHaveText("Bananas")
  await expect(source).toBeFocused()
  await expect(source).not.toHaveAttribute("data-moving")
})

test("list: On is tried before its nearest edge and can be accepted without reordering", async ({ page }) => {
  const list = page.locator("#list-demo #list-movable")
  await page.locator("#list-demo #list-move-on").click()
  await list.locator('[data-nav-key="Apples"]').dragTo(list.locator('[data-nav-key="Bananas"]'))
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("Apples On Bananas")
  await expect(list.getByRole("listitem").first()).toHaveText("Apples")
})

test("list: rejected drops and fixed items never emit move", async ({ page }) => {
  const list = page.locator("#list-demo #list-movable")
  await page.locator("#list-demo #list-move-allow").click()
  await list.locator('[data-nav-key="Apples"]').dragTo(list.locator('[data-nav-key="Bananas"]'))
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("")
  await page.locator("#list-demo #list-move-allow").click()
  const fixed = list.locator('[data-nav-key="Dates"]')
  await expect(fixed).toHaveAttribute("draggable", "false")
  await fixed.dragTo(list.locator('[data-nav-key="Bananas"]'))
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("")
  await fixed.focus()
  await page.keyboard.press("Control+ArrowUp")
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("")
})

test("list: Ctrl and Cmd arrows reorder the focused item while retaining focus", async ({ page }) => {
  const list = page.locator("#list-demo #list-movable")
  const source = list.locator('[data-nav-key="Bananas"]')
  await source.focus()
  await page.keyboard.press("Control+ArrowUp")
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("Bananas Before Apples")
  await expect(source).toBeFocused()
  await expect(list.getByRole("listitem").first()).toHaveText("Bananas")
  await page.keyboard.press("Meta+ArrowDown")
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("Bananas After Apples")
  await expect(source).toBeFocused()
  await expect(list.getByRole("listitem").nth(1)).toHaveText("Bananas")
})

test("list: Ctrl Home/End try farthest accepted destinations, including rejected-target fallback", async ({ page }) => {
  const list = page.locator("#list-demo #list-movable")
  const source = list.locator('[data-nav-key="Cherries"]')
  await page.locator("#list-demo #list-move-reject-apples").click()
  await source.focus()
  await page.keyboard.press("Control+Home")
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("Cherries Before Bananas")
  await expect(source).toBeFocused()
  await page.keyboard.press("Control+End")
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("Cherries After Dates")
  await expect(source).toBeFocused()
  await expect(list.getByRole("listitem").last()).toHaveText("Cherries")
})

test("list: accepted keyboard moves require caller data updates; boundary and rejected requests do nothing", async ({ page }) => {
  const list = page.locator("#list-demo #list-movable")
  const source = list.locator('[data-nav-key="Apples"]')
  await page.locator("#list-demo #list-move-reorder").click()
  await source.focus()
  await page.keyboard.press("Control+ArrowUp")
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("")
  await page.keyboard.press("Control+ArrowDown")
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("Apples After Bananas")
  await expect(list.getByRole("listitem").first()).toHaveText("Apples")
  await page.locator("#list-demo #list-move-allow").click()
  await source.focus()
  await page.keyboard.press("Control+End")
  await expect(source).toBeFocused()
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("Apples After Bananas")
})

test("list: an accepted drag paints the On indicator and drag leave removes it", async ({ page }) => {
  const list = page.locator("#list-demo #list-movable")
  await page.locator("#list-demo #list-move-on").click()
  const source = list.locator('[data-nav-key="Apples"]')
  const target = list.locator('[data-nav-key="Bananas"]')
  await source.evaluate((element) => element.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() })))
  await expect(source).toHaveAttribute("data-moving", "")
  await target.evaluate((element) => {
    const box = element.getBoundingClientRect()
    element.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, clientY: box.top + box.height / 2 }))
  })
  const indicator = list.locator('[data-slot="drop-indicator"]')
  await expect(indicator).toHaveAttribute("data-placement", "On")
  await expect(indicator.locator(".fiori-drop-indicator__rect")).toBeVisible()
  await target.dispatchEvent("dragleave", { relatedTarget: null })
  await expect(indicator).toHaveCount(0)
  await source.dispatchEvent("dragend")
  await expect(source).not.toHaveAttribute("data-moving")
})

test("list: native originalEvent identity survives pointer and keyboard move callbacks", async ({ page }) => {
  const list = page.locator("#list-demo #list-movable")
  const source = list.locator('[data-nav-key="Bananas"]')
  await source.focus()
  await page.keyboard.press("Control+ArrowUp")
  const log = page.locator("#list-demo #list-move-log")
  await expect(log).toHaveAttribute("data-native-over", "true")
  await expect(log).toHaveAttribute("data-native-move", "true")
  await source.dragTo(list.locator('[data-nav-key="Cherries"]'), { targetPosition: { x: 40, y: 2 } })
  await expect(log).toHaveText("Bananas Before Cherries")
  await expect(log).toHaveAttribute("data-native-over", "true")
  await expect(log).toHaveAttribute("data-native-move", "true")
})

test("list: draggable child content is not registered as a movable list item", async ({ page }) => {
  const list = page.locator("#list-demo #list-movable")
  await list.locator("#list-movable-nested-source").dragTo(list.locator('[data-nav-key="Bananas"]'))
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("")
})

test("list: an accepted Table source drop focuses the previously unfocused native row", async ({ page }) => {
  const source = page.locator('#table-demo #table-movable [data-row-key="P0002"]')
  const list = page.locator("#list-demo #list-movable")
  const target = list.locator('[data-nav-key="Bananas"]')
  await expect(source).not.toHaveAttribute("tabindex", /.*/)
  await expect(source).not.toBeFocused()
  await source.evaluate((element) => element.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() })))
  await target.evaluate((element) => {
    const box = element.getBoundingClientRect()
    element.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, clientY: box.top + 2 }))
  })
  await target.dispatchEvent("drop")
  const log = page.locator("#list-demo #list-move-log")
  await expect(log).toHaveText("P0002 Before Bananas")
  await expect(log).toHaveAttribute("data-native-over", "true")
  await expect(log).toHaveAttribute("data-native-move", "true")
  await expect(source).toHaveAttribute("tabindex", "-1")
  await expect(source).toBeFocused()
  await expect(list.locator('[data-slot="list-item"]')).toHaveCount(4)
  await source.dispatchEvent("dragend")
})
