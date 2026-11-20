import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/segmented-button`)
  await page.waitForSelector("html[data-ready=true]")
})

test("segmented button: listbox of options with aria-selected", async ({ page }) => {
  const lb = page.getByRole("listbox", { name: "View" })
  await expect(lb).toHaveAttribute("aria-multiselectable", "false")
  await expect(lb).toHaveAttribute("aria-orientation", "horizontal")
  await expect(lb.getByRole("option")).toHaveCount(4)
  await expect(lb.getByRole("option", { name: "Week" })).toHaveAttribute("aria-selected", "true")
  await expect(lb.getByRole("option", { name: "Day" })).toHaveAttribute("aria-selected", "false")
  await expect(lb.getByRole("option", { name: "Week" })).not.toHaveAttribute("aria-pressed", /.*/)
  await expect(page.getByRole("listbox", { name: "Text style" })).toHaveAttribute("aria-multiselectable", "true")
})

test("segmented button: Tab lands on the selected item; arrows move focus only", async ({ page }) => {
  const lb = page.getByRole("listbox", { name: "View" })
  const o = (name: string) => lb.getByRole("option", { name })
  await o("Week").focus()
  await page.keyboard.press("Shift+Tab")
  await page.keyboard.press("Tab")
  await expect(o("Week")).toBeFocused()
  await page.keyboard.press("ArrowRight")
  await expect(o("Month")).toBeFocused()
  await expect(o("Week")).toHaveAttribute("aria-selected", "true") // focus moved, selection didn't
  await page.keyboard.press("ArrowRight") // "Year" is disabled and there is no wrap
  await expect(o("Month")).toBeFocused()
  await page.keyboard.press("Home")
  await expect(o("Day")).toBeFocused()
  await page.keyboard.press("ArrowLeft") // no wrap at the start either
  await expect(o("Day")).toBeFocused()
  await page.keyboard.press("End")
  await expect(o("Month")).toBeFocused()
})

test("segmented button: Space and Enter select; single mode never deselects", async ({ page }) => {
  const lb = page.getByRole("listbox", { name: "View" })
  const o = (name: string) => lb.getByRole("option", { name })
  await o("Week").focus()
  await page.keyboard.press("ArrowLeft")
  await page.keyboard.press("Space")
  await expect(o("Day")).toHaveAttribute("aria-selected", "true")
  await expect(o("Week")).toHaveAttribute("aria-selected", "false")
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("Enter")
  await expect(o("Week")).toHaveAttribute("aria-selected", "true")
  await page.keyboard.press("Enter") // activating the selected item keeps it selected
  await expect(o("Week")).toHaveAttribute("aria-selected", "true")
  await o("Week").click()
  await expect(o("Week")).toHaveAttribute("aria-selected", "true")
})

test("segmented button: multiple mode toggles items independently", async ({ page }) => {
  const lb = page.getByRole("listbox", { name: "Text style" })
  const o = (name: string) => lb.getByRole("option", { name })
  await o("Bold").focus()
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("Space")
  await expect(o("Italic")).toHaveAttribute("aria-selected", "true")
  await expect(o("Bold")).toHaveAttribute("aria-selected", "true")
  await page.keyboard.press("ArrowLeft")
  await page.keyboard.press("Enter")
  await expect(o("Bold")).toHaveAttribute("aria-selected", "false")
})


test("segmented-button: RTL mirrors horizontal keyboard navigation", async ({ page }) => {
  await page.goto("/index.html?dir=rtl#/segmented-button")
  await page.waitForSelector("html[data-ready=true]")
  const root = page.locator("#view")
  const first = root.getByRole("option", { name: "Week", exact: true }), next = root.getByRole("option", { name: "Month", exact: true })
  await first.focus()
  await expect(first).toBeFocused()
  await page.keyboard.press("ArrowLeft")
  await expect(next).toBeFocused()
  await expect(first).toHaveAttribute("aria-selected", "true")
  await page.keyboard.press("ArrowRight")
  await expect(first).toBeFocused()
})

for (const item of [false, true]) for (const channel of ["name", "name-ref", "description", "description-ref"]) test(`segmented-button: ${item ? "item" : "root"} ${channel} reaches the UI5 owning element`, async ({ page, browser }) => {
  const id = `segmented-button-a11y-${item ? "item" : "root"}-${channel}`
  await page.goto("/index.html?fixtures")
  await page.waitForSelector("html[data-ready=true]")
  const native = await browser.newPage()
  try {
    await native.goto("/ui5.html")
    await native.waitForSelector("html[data-ready=true]")
    const oursCell = page.locator(`[data-fixture="${id}"]`), nativeCell = native.locator(`[data-fixture="${id}"]`)
    const role = item ? "option" : "listbox"
    if (channel.startsWith("name")) {
      await expect(oursCell.getByRole(role, { name: "Cartography", exact: true })).toHaveCount(1)
      await expect(nativeCell.getByRole(role, { name: "Cartography", exact: true })).toHaveCount(1)
    } else {
      const ours = oursCell.getByRole(role).first(), ui5 = nativeCell.getByRole(role).first()
      const expected = `Choose a map layer${item ? " Press SPACE or ENTER to select an item" : ""}`
      await expect(ours).toHaveAccessibleDescription(expected)
      await expect(ui5).toHaveAccessibleDescription(expected)
    }
  } finally { await native.close() }
})

test("segmented-button: custom hosts retain role, selected, positions, descriptions and roving tabindex", async ({ page }) => {
  await page.goto("/index.html?fixtures")
  await page.waitForSelector("html[data-ready=true]")
  const root = page.locator('[data-fixture="segmented-button-custom"]')
  const first = root.getByRole("option", { name: "Map" }), second = root.getByRole("option", { name: "Satellite" })
  await expect(first).toHaveAttribute("aria-selected", "true")
  await expect(first).toHaveAttribute("aria-posinset", "1")
  await expect(first).toHaveAttribute("aria-setsize", "2")
  await expect(first).toHaveAttribute("id", /.+/)
  await expect(first).toHaveAccessibleDescription("Press SPACE or ENTER to select an item")
  await first.focus()
  await expect(first).toHaveAttribute("tabindex", "0")
  await page.keyboard.press("ArrowRight")
  await expect(second).toBeFocused()
  await expect(second).toHaveAttribute("tabindex", "0")
  await expect(first).toHaveAttribute("tabindex", "-1")
  await page.keyboard.press("Space")
  await expect(second).toHaveAttribute("aria-selected", "true")
})

test("segmented-button: selection announces assertively and deselection does not announce", async ({ page }) => {
  const root = page.locator("#view").locator("..").getByRole("listbox", { name: "Text style" })
  const italic = root.getByRole("option", { name: "Italic" })
  const live = page.locator('[data-slot="segmented-button-announcement"][data-owner="Text style"]')
  await expect(live).toHaveAttribute("aria-live", "assertive")
  await expect(live).toHaveAttribute("aria-atomic", "true")
  await italic.click()
  await expect(italic).toHaveAttribute("aria-selected", "true")
  await expect(live).toHaveText("Selected")
  const selectedKey = await live.locator("span").evaluate((element) => { (window as any).__selectionAnnouncement = element; return element.textContent })
  expect(selectedKey).toBe("Selected")
  await italic.click()
  await expect(italic).toHaveAttribute("aria-selected", "false")
  expect(await live.locator("span").evaluate((element) => element === (window as any).__selectionAnnouncement)).toBe(true)
})


test("segmented-button: the root has no extra internal focus target and keyboard reentry remains on the last item", async ({ page }) => {
  const root = page.locator("#view")
  await expect(root).not.toHaveAttribute("tabindex", /.+/)
  const week = root.getByRole("option", { name: "Week" }), month = root.getByRole("option", { name: "Month" })
  await week.focus()
  await page.keyboard.press("ArrowRight")
  await expect(month).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(month).not.toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(month).toBeFocused()
})

for (const [id, initial, next] of [
  ["segmented-button-middle", "Week", "Month"],
  ["segmented-button-disabled-item", "One", "Three"],
  ["segmented-button-custom", "Map", "Satellite"],
  ["segmented-button-fragment", "Map", "Satellite"],
  ["segmented-button-wrapper", "Map", "Satellite"],
  ["segmented-button-default", "Map", "Satellite"],
] as const) for (const direction of ["ltr", "rtl"]) test(`segmented-button: ${id} enters with Tab and remembers the enabled focused item (${direction})`, async ({ page, browser }) => {
  const reference = await browser.newPage()
  try {
    for (const [current, native] of [[page, false], [reference, true]] as const) {
      await current.goto(`/${native ? "ui5" : "index"}.html?${native ? "" : "fixtures&"}only=${id}&dir=${direction}`)
      await current.waitForSelector("html[data-ready=true]")
      const cell = current.locator(`[data-fixture="${id}"]`)
      await cell.evaluate((element) => {
        const before = document.createElement("button"), after = document.createElement("button")
        before.textContent = "Before segmented control"; after.textContent = "After segmented control"
        element.prepend(before); element.append(after); before.focus()
      })
      await current.keyboard.press("Tab")
      await expect(cell.getByRole("option", { name: initial, exact: true })).toBeFocused()
      await current.keyboard.press(direction === "rtl" ? "ArrowLeft" : "ArrowRight")
      const last = cell.getByRole("option", { name: next, exact: true })
      await expect(last).toBeFocused()
      await expect(last).toHaveAttribute("tabindex", "0")
      await current.keyboard.press("Tab")
      await expect(cell.getByRole("button", { name: "After segmented control" })).toBeFocused()
      await current.keyboard.press("Shift+Tab")
      await expect(last).toBeFocused()
      await expect(cell.getByRole("option", { name: initial, exact: true })).toHaveAttribute("aria-selected", "true")
    }
  } finally { await reference.close() }
})

test("segmented-button: hidden items have no position and visible positions use actual hosts", async ({ page, browser }) => {
  const reference = await browser.newPage()
  try {
    for (const [current, native] of [[page, false], [reference, true]] as const) {
      await current.goto(`/${native ? "ui5" : "index"}.html?${native ? "" : "fixtures&"}only=segmented-button-hidden`)
      await current.waitForSelector("html[data-ready=true]")
      const cell = current.locator('[data-fixture="segmented-button-hidden"]')
      for (const [name, position] of [["Map", "1"], ["Satellite", "2"]]) {
        const item = cell.getByRole("option", { name, exact: true })
        await expect(item).toHaveAttribute("aria-posinset", position)
        await expect(item).toHaveAttribute("aria-setsize", "2")
      }
      const hidden = native ? cell.locator('ui5-segmented-button-item[hidden]').locator('[role="option"]') : cell.locator('[data-slot="segmented-button-item"][hidden]')
      await expect(hidden).not.toHaveAttribute("aria-posinset")
      await expect(hidden).not.toHaveAttribute("aria-setsize")
      await expect(cell.getByRole("option", { name: "Map", exact: true })).toHaveAttribute("aria-selected", "true")
    }
  } finally { await reference.close() }
})

for (const direction of ["ltr", "rtl"]) test(`segmented-button: hidden navigation position follows native focus limits and activation restores it (${direction})`, async ({ page, browser }) => {
  const reference = await browser.newPage()
  try {
    for (const [current, native] of [[page, false], [reference, true]] as const) {
      await current.goto(`/${native ? "ui5" : "index"}.html?${native ? "" : "fixtures&"}only=segmented-button-hidden&dir=${direction}`)
      await current.waitForSelector("html[data-ready=true]")
      const cell = current.locator('[data-fixture="segmented-button-hidden"]')
      const map = cell.getByRole("option", { name: "Map", exact: true })
      const hidden = native ? cell.locator('ui5-segmented-button-item[hidden]').locator('[role="option"]') : cell.locator('[data-slot="segmented-button-item"][hidden]')
      await map.focus(); await expect(map).toBeFocused()
      await current.keyboard.press(direction === "rtl" ? "ArrowLeft" : "ArrowRight")
      await expect(hidden).toHaveAttribute("tabindex", "0")
      await expect(map).toBeFocused()
      await current.keyboard.press("End")
      await expect(map).toBeFocused()
      await expect(hidden).toHaveAttribute("tabindex", "0")
      await current.keyboard.press("Enter")
      await expect(map).toHaveAttribute("tabindex", "0")
      await current.keyboard.press("End")
      await expect(cell.getByRole("option", { name: "Satellite", exact: true })).toBeFocused()
      await expect(map).toHaveAttribute("aria-selected", "true")
    }
  } finally { await reference.close() }
})
