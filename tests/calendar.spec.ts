import { expect, test, type Page } from "@playwright/test"

// Scoped to the Calendar demo (#calendar-demo); the date pickers' popovers render their own calendars.
const demo = (page: Page) => page.locator("#calendar-demo")
const cell = (page: Page) => demo(page).locator('[role=gridcell][tabindex="0"]')
const key = (d: Date) => String(d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate())
const shift = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days)
const today = () => {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}

test.describe("Calendar (Fiori model)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/index.html#/calendar")
    await page.waitForSelector("html[data-ready=true]")
    await demo(page).locator('[role=gridcell][tabindex="0"]').focus()
  })

  test("grid ARIA: one tab stop, today focused and labelled", async ({ page }) => {
    const grid = demo(page).getByRole("grid")
    await expect(grid).toHaveAttribute("aria-roledescription", "Gregorian calendar")
    await expect(demo(page).locator('[role=gridcell][tabindex="0"]')).toHaveCount(1)
    await expect(cell(page)).toHaveAttribute("data-date", key(today()))
    await expect(cell(page)).toHaveAttribute("aria-label", /Today/)
    await expect(cell(page)).toHaveClass(/fiori-dp-item--now/)
    await expect(demo(page).getByRole("columnheader")).toHaveCount(8)
    await expect(demo(page).getByRole("rowheader").first()).toHaveAttribute("aria-label", /Calendar Week \d+/)
  })

  test("arrows, PageUp/PageDown, Shift+PageUp/Down and Home/End move the focused day", async ({ page }) => {
    const t = today()
    await page.keyboard.press("ArrowRight")
    await expect(cell(page)).toHaveAttribute("data-date", key(shift(t, 1)))
    await expect(cell(page)).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(cell(page)).toHaveAttribute("data-date", key(shift(t, 8)))
    await page.keyboard.press("ArrowUp")
    await page.keyboard.press("ArrowLeft")
    await expect(cell(page)).toHaveAttribute("data-date", key(t))
    await page.keyboard.press("PageDown")
    const m = new Date(t.getFullYear(), t.getMonth() + 1, 1)
    const expected = new Date(m.getFullYear(), m.getMonth(), Math.min(t.getDate(), new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate()))
    await expect(cell(page)).toHaveAttribute("data-date", key(expected))
    await page.keyboard.press("PageUp")
    await page.keyboard.press("Shift+PageDown")
    await expect(cell(page)).toHaveAttribute("data-date", new RegExp(`^${t.getFullYear() + 1}`))
    await page.keyboard.press("Shift+PageUp")
    await page.keyboard.press("Home")
    const firstDay = await cell(page).getAttribute("data-date")
    await page.keyboard.press("End")
    const lastDay = await cell(page).getAttribute("data-date")
    expect(Number(lastDay) > Number(firstDay)).toBe(true)
    await expect(cell(page)).toBeFocused()
  })

  test("Enter and Space select; header shows the month", async ({ page }) => {
    await page.keyboard.press("Enter")
    await expect(cell(page)).toHaveAttribute("aria-selected", "true")
    await expect(page.getByTestId("calendar-selected")).toHaveText(today().toDateString())
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("Space")
    await expect(page.getByTestId("calendar-selected")).toHaveText(shift(today(), 1).toDateString())
  })

  test("F4 shows the month picker, Shift+F4 the year then year-range picker; choosing returns to days", async ({ page }) => {
    await page.keyboard.press("F4")
    const months = demo(page).locator('[data-picker="month"]')
    await expect(months).toBeVisible()
    await expect(months.getByRole("gridcell")).toHaveCount(12)
    await expect(months.locator('[tabindex="0"]')).toBeFocused()
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("Enter")
    await expect(demo(page).locator('[data-picker="day"]')).toBeVisible()
    await page.keyboard.press("Shift+F4")
    const years = demo(page).locator('[data-picker="year"]')
    await expect(years.getByRole("gridcell")).toHaveCount(20)
    await page.keyboard.press("Shift+F4")
    await expect(demo(page).locator('[data-picker="yearrange"]').getByRole("gridcell")).toHaveCount(8)
    await page.keyboard.press("Enter")
    await expect(years).toBeVisible()
    await page.keyboard.press("Enter")
    await expect(demo(page).locator('[data-picker="day"]')).toBeVisible()
  })

  test("header arrows page months; the month button opens the month picker", async ({ page }) => {
    const header = demo(page).locator("[data-slot=calendar-month-button]")
    const before = await header.textContent()
    await demo(page).locator("[data-slot=calendar-next]").click()
    await expect(header).not.toHaveText(before!)
    await demo(page).locator("[data-slot=calendar-previous]").click()
    await expect(header).toHaveText(before!)
    await header.click()
    await expect(demo(page).locator('[data-picker="month"]')).toBeVisible()
  })

  test("range mode: two clicks select a range, days between are marked", async ({ page }) => {
    await demo(page).locator("#calendar-mode").getByRole("option", { name: "Range" }).click()
    const t = today()
    const a = shift(t, -t.getDate() + 3)
    const b = shift(a, 5)
    await demo(page).locator(`[data-date="${key(a)}"]`).click()
    await demo(page).locator(`[data-date="${key(b)}"]`).click()
    await expect(demo(page).locator(".fiori-dp-item--selected-between")).toHaveCount(4)
    await expect(demo(page).locator(`[data-date="${key(b)}"]`)).toHaveAttribute("aria-label", /Last date of range/)
    await expect(page.getByTestId("calendar-selected")).toHaveText(`${a.toDateString()}, ${b.toDateString()}`)
  })

  test("multiple mode toggles days", async ({ page }) => {
    await demo(page).locator("#calendar-mode").getByRole("option", { name: "Multiple" }).click()
    const t = today()
    const a = shift(t, -t.getDate() + 3)
    await demo(page).locator(`[data-date="${key(a)}"]`).click()
    await demo(page).locator(`[data-date="${key(shift(a, 2))}"]`).click()
    await expect(demo(page).locator("[role=gridcell][aria-selected=true]")).toHaveCount(2)
    await demo(page).locator(`[data-date="${key(a)}"]`).click()
    await expect(demo(page).locator("[role=gridcell][aria-selected=true]")).toHaveCount(1)
  })
})


test("calendar: RTL retains UI5's chronological horizontal keys", async ({ page }) => {
  // DayPicker.js/MonthPicker.js _onkeydown deliberately use -1/+1 in both directions.
  for (const native of [false, true]) {
    await page.goto(native ? "/ui5.html?dir=rtl&only=calendar-single" : "/index.html?fixtures&dir=rtl&only=calendar-single")
    await page.waitForSelector("html[data-ready=true]")
    const root = page.locator('[data-fixture="calendar-single"]')
    const current = () => root.locator(native ? '.ui5-dp-item[tabindex="0"]' : '[data-picker="day"] [role=gridcell][tabindex="0"]')
    const value = Number(await current().getAttribute(native ? "data-sap-timestamp" : "data-date"))
    const unit = native ? 86400 : 1
    await current().focus()
    await expect(current()).toBeFocused()
    await page.keyboard.press("ArrowRight")
    await expect(current()).toHaveAttribute(native ? "data-sap-timestamp" : "data-date", String(value + unit))
    await expect(current()).toBeFocused()
    await page.keyboard.press("ArrowLeft")
    await expect(current()).toHaveAttribute(native ? "data-sap-timestamp" : "data-date", String(value))
    await page.keyboard.press("F4")
    const months = root.locator(native ? "ui5-monthpicker" : '[data-picker="month"]')
    const month = months.locator('[role=gridcell][tabindex="0"]')
    await expect(month).toBeFocused()
    const original = await month.textContent()
    await page.keyboard.press("ArrowRight")
    await expect(month).not.toHaveText(original!)
    await expect(month).toBeFocused()
    await page.keyboard.press("ArrowLeft")
    await expect(month).toHaveText(original!)
  }
})


test("Calendar year header keeps visible range and purpose through paging", async ({ page }) => {
  await page.goto("/index.html?fixtures&only=calendar-year-picker")
  await page.waitForSelector("html[data-ready=true]")
  const cell = page.locator('[data-fixture="calendar-year-picker"]')
  const range = cell.locator('[data-slot="calendar-year-range-button"]')
  for (let step = 0; step < 2; step++) {
    const visible = await range.locator('span').first().innerText()
    const purpose = await range.getAttribute("aria-label")
    await expect(range).toHaveAccessibleName(`${visible} ${purpose}`)
    await expect(range).toHaveAccessibleDescription(purpose!)
    const ids = (await range.getAttribute("aria-labelledby"))!.split(" ")
    expect(ids).toHaveLength(2)
    for (const id of ids) expect(await page.locator(`[id="${id}"]`).count()).toBe(1)
    if (!step) await cell.getByRole("button", { name: "Next Year Range", exact: true }).click()
  }
  await range.focus()
  await expect(range).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(cell.locator('[data-picker="yearrange"]')).toBeVisible()
})

test("Calendar header arrows preserve UI5 descriptions and localized shortcuts in every picker and direction", async ({ page }) => {
  for (const dir of ["ltr", "rtl"]) for (const picker of ["single", "month-picker", "year-picker", "yearrange-picker"]) for (const native of [false, true]) {
    const id = `calendar-${picker === "yearrange-picker" ? "year-picker" : picker}`
    await page.goto(native ? `/ui5.html?dir=${dir}&only=${id}` : `/index.html?fixtures&dir=${dir}&only=${id}`)
    await page.waitForSelector("html[data-ready=true]")
    const cell = page.locator(`[data-fixture="${id}"]`)
    if (picker === "yearrange-picker") await cell.locator(native ? '[data-ui5-cal-header-btn-year-range]' : '[data-slot="calendar-year-range-button"]').click()
    for (const [direction, shortcut] of [["previous", "Pagedown"], ["next", "Pageup"]]) {
      const button = cell.locator(native ? `[data-ui5-cal-header-btn-${direction === "previous" ? "prev" : "next"}]` : `[data-slot="calendar-${direction}"]`)
      const label = await button.getAttribute("aria-label")
      await expect(button).toHaveAccessibleDescription(label!)
      await expect(button).toHaveAttribute("aria-keyshortcuts", shortcut)
      await expect(button).toHaveAttribute("title", `${label} (${shortcut})`)
    }
  }
})
