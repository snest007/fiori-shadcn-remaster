import { expect, test, type Page } from "@playwright/test"

const popover = (page: Page) => page.locator("[data-slot=picker-popover]")
const button = (page: Page, name: string) => popover(page).locator(`[data-clock-button="${name}"]`)
const NNBSP = " "

test.describe("TimePicker (Fiori model)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/index.html")
    await page.waitForSelector("html[data-ready=true]")
    await page.locator("#time-picker-main").focus()
  })

  test("F4 opens the clocks with the hours button focused; ARIA spinbuttons", async ({ page }) => {
    await expect(page.locator("#time-picker-main")).toHaveAttribute("aria-roledescription", "Time Input")
    await page.keyboard.press("F4")
    await expect(popover(page)).toBeVisible()
    await expect(button(page, "hours")).toBeFocused()
    await expect(button(page, "hours")).toHaveAttribute("role", "spinbutton")
    await expect(button(page, "hours")).toHaveAttribute("aria-valuenow", "9")
    await expect(button(page, "minutes")).toHaveText("30")
    await expect(popover(page).locator('[data-clock="hours"] .fiori-tp-clock-active')).toBeVisible()
    await page.keyboard.press("F4")
    await expect(popover(page)).toHaveCount(0)
  })

  test("arrows change the active clock, Space moves on, digits type, P switches to PM, Enter submits", async ({ page }) => {
    const input = page.locator("#time-picker-main")
    await page.keyboard.press("F4")
    await page.keyboard.press("ArrowUp")
    await expect(button(page, "hours")).toHaveText("10")
    await page.keyboard.press("Space")
    await expect(button(page, "minutes")).toBeFocused()
    await page.keyboard.press("4")
    await page.keyboard.press("5")
    await expect(button(page, "minutes")).toHaveText("45")
    await expect(button(page, "seconds")).toBeFocused()
    await page.keyboard.press("p")
    await page.keyboard.press("Enter")
    await expect(popover(page)).toHaveCount(0)
    await expect(input).toHaveValue(`10:45:00${NNBSP}PM`)
    await expect(input).toBeFocused()
  })

  test("Escape and Cancel discard changes", async ({ page }) => {
    const input = page.locator("#time-picker-main")
    await page.keyboard.press("F4")
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Escape")
    await expect(popover(page)).toHaveCount(0)
    await expect(input).toHaveValue(`9:30:00${NNBSP}AM`)
    await page.keyboard.press("F4")
    await page.keyboard.press("ArrowDown")
    await popover(page).getByRole("button", { name: "Cancel" }).click()
    await expect(input).toHaveValue(`9:30:00${NNBSP}AM`)
  })

  test("clicking the dial picks a value and activates the next clock", async ({ page }) => {
    await page.keyboard.press("F4")
    const cover = popover(page).locator('[data-clock="hours"] .fiori-tp-clock-cover')
    const box = (await cover.boundingBox())!
    // 3 o'clock: the right edge of the dial, inside the numbers ring.
    await page.mouse.click(box.x + box.width - 30, box.y + box.height / 2)
    await expect(button(page, "hours")).toHaveText("3")
    await expect(button(page, "minutes")).toBeFocused()
    await popover(page).getByRole("button", { name: "OK" }).click()
    await expect(page.locator("#time-picker-main")).toHaveValue(`3:30:00${NNBSP}AM`)
  })

  test("PageUp/PageDown in the field change hours, Shift minutes, Ctrl+Shift seconds", async ({ page }) => {
    const input = page.locator("#time-picker-main")
    await page.keyboard.press("PageUp")
    await expect(input).toHaveValue(`10:30:00${NNBSP}AM`)
    await page.keyboard.press("Shift+PageDown")
    await expect(input).toHaveValue(`10:29:00${NNBSP}AM`)
    await page.keyboard.press("Control+Shift+PageUp")
    await expect(input).toHaveValue(`10:29:01${NNBSP}AM`)
    await expect(page.getByTestId("time-picker-value")).toHaveText(`10:29:01${NNBSP}AM`)
  })

  test("24-hour pattern has no AM/PM and lenient typing", async ({ page }) => {
    const input = page.locator("#time-picker-24h")
    await input.fill("7:5")
    await page.keyboard.press("Enter")
    await expect(input).toHaveValue("07:05")
    await page.keyboard.press("F4")
    await expect(popover(page).locator("[data-slot=segmented-button]")).toHaveCount(0)
    await expect(button(page, "seconds")).toHaveCount(0)
    await input.press("Escape")
    await input.fill("25:00")
    await page.keyboard.press("Enter")
    await expect(page.locator("#time-picker-demo [data-slot=picker-field]").nth(1)).toHaveAttribute("data-value-state", "negative")
  })
})

test.describe("DateTimePicker", () => {
  test("pick a day and a time, then OK", async ({ page }) => {
    await page.goto("/index.html")
    await page.waitForSelector("html[data-ready=true]")
    const input = page.locator("#date-time-picker-main")
    await expect(input).toHaveAttribute("aria-roledescription", "Date Time Input")
    await input.focus()
    await page.keyboard.press("F4")
    await expect(popover(page).locator("[data-slot=calendar]")).toBeVisible()
    await expect(popover(page).locator("[data-slot=time-selection-clocks]")).toBeVisible()
    const ok = popover(page).getByRole("button", { name: "OK" })
    await expect(ok).toBeDisabled()
    // Day: today + nothing selected yet. Select the focused day, then set the hours to 11.
    await page.keyboard.press("Enter")
    await expect(popover(page)).toBeVisible()
    await expect(ok).toBeEnabled()
    await button(page, "hours").click()
    await page.keyboard.press("1")
    await page.keyboard.press("1")
    await ok.click()
    await expect(popover(page)).toHaveCount(0)
    const t = new Date()
    const month = t.toLocaleString("en-US", { month: "short" })
    await expect(input).toHaveValue(new RegExp(`^${month} ${t.getDate()}, ${t.getFullYear()}, 11:`))
  })
})
