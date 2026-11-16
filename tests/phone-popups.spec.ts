import { expect, test, type Page, type Locator } from "@playwright/test"
const initialDate = "Nov 13, 2026"
const initialTime = "10:15:30 AM"
const initialDateTime = `${initialDate}, ${initialTime}`
async function visit(page: Page, kind: string, native: boolean, suffix = "") {
  await page.goto(`/${native ? "ui5" : "index"}.html?fixtures-phone&interactive&only=${kind}-phone${suffix}`)
  await page.waitForSelector("html[data-ready=true]")
  return page.locator(`#${kind}-phone-demo`)
}
async function settled(holder: Locator, native: boolean) { if (native) await holder.evaluate(async (node: any) => node.phoneRenderFinished()) }
const dialogs = (page: Page, native: boolean) => native ? page.locator("ui5-dialog[open]") : page.locator('[role="dialog"].fiori-responsive-popover')
const surface = (page: Page, holder: Locator, native: boolean) => native ? holder : dialogs(page, false).last()
const field = (holder: Locator, native: boolean) => native ? holder.locator('input').first() : holder.locator('[data-slot="picker-field"] input')
const day = (holder: Locator, page: Page, native: boolean, number: number) => native ? holder.locator(`[role="gridcell"][data-sap-timestamp="${Date.UTC(2026, 10, number) / 1000}"]`) : dialogs(page, false).locator(`[role="gridcell"][data-date="${20261100 + number}"]`)
async function openPicker(page: Page, holder: Locator, native: boolean) {
  await (native ? holder.locator('ui5-icon.inputIcon') : holder.locator('[data-slot="picker-field-icon"]')).click()
  await expect(dialogs(page, native)).toBeVisible()
  await settled(holder, native); await page.evaluate(() => document.fonts.ready)
  await expect(dialogs(page, native)).toHaveCSS("width", "375px")
  await expect(dialogs(page, native)).toHaveCSS("height", "667px")
}
async function expectDeepFocus(locator: Locator) {
  await expect.poll(() => locator.evaluate((element) => { let active = document.activeElement; while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement; return active === element })).toBe(true)
}
const menuRow = (page: Page, holder: Locator, native: boolean, name: string) => native ? holder.locator(`ui5-menu-item[text="${name}"]`).locator('[role="menuitem"]').first() : surface(page, holder, false).getByRole('menuitem', { name, exact: true })
async function openMenuDepth(page: Page, holder: Locator, native: boolean, depth: number) {
  await holder.getByRole('button', { name: 'Open Menu', exact: true }).click(); await settled(holder, native)
  await expect(dialogs(page, native)).toHaveCount(1)
  for (const name of ['More', 'Advanced'].slice(0, depth - 1)) { await menuRow(page, holder, native, name).click(); await settled(holder, native) }
  await expect(dialogs(page, native)).toHaveCount(depth)
  if (native) await expect(dialogs(page, native).last()).toHaveCSS('opacity', '1')
  await expectDeepFocus(menuRow(page, holder, native, depth === 1 ? 'New' : depth === 2 ? 'Copy' : 'Archive'))
}
async function openNumeric(page: Page, holder: Locator, native: boolean) {
  await field(holder, native).click(); await settled(holder, native)
  const numeric = native ? holder.locator('ui5-time-selection-inputs input') : page.locator('[data-slot="time-selection-inputs"] input')
  await expect(numeric).toHaveCount(3); await expect(numeric.first()).toBeVisible()
  if (native) await expect(holder.locator('ui5-popover[open]')).toHaveCSS('opacity', '1')
  await expectDeepFocus(numeric.first())
  return numeric
}
async function submitNumeric(page: Page, holder: Locator, native: boolean, numeric: Locator, submit: string, expected: string) {
  if (submit === 'Enter') await numeric.first().press('Enter')
  else await (native ? holder : page.locator('[data-slot="time-picker-inputs-popover"]')).getByRole('button', { name: 'OK', exact: true }).click()
  await expect(numeric.first()).not.toBeVisible(); await settled(holder, native)
  const formatted = native ? expected : expected.replace(' AM', '\u202fAM').replace(' PM', '\u202fPM')
  // TimePicker closes before its value/input echo settles. Assert the public
  // canonical value and genuine value-changed event, then the outer input.
  if (native) await expect.poll(() => holder.locator('ui5-time-picker').evaluate((node: any) => node.value)).toBe(formatted)
  await expect(holder.locator('[data-slot="phone-events"]')).toHaveText(JSON.stringify([`value:${formatted}`]))
  await expect(field(holder, native)).toHaveValue(formatted)
}
test.describe("D1b phone native contracts", () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, timezoneId: "UTC", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1" })
  test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(new Date("2026-11-13T09:20:45Z")) })
  for (const native of [false, true]) {
    const label = native ? "UI5" : "React"
    for (const [kind, title] of [["date-picker", "Enter date"], ["time-picker", "All Items"]]) test(`${label} ${kind} uses its native default phone title without a field label`, async ({ page }) => {
      const holder = await visit(page, kind, native, "-default-title")
      await openPicker(page, holder, native)
      await expect(surface(page, holder, native).getByText(title, { exact: true }).last()).toBeVisible()
    })
    for (const kind of ["date-picker", "date-range-picker", "date-time-picker", "time-picker"]) test(`${label} ${kind} consumer can reject a phone proposal and reopening uses its accepted value`, async ({ page }) => {
      const holder = await visit(page, kind, native, "&consumer=reject")
      const initial = kind === "date-picker" ? initialDate : kind === "date-range-picker" ? "Nov 13, 2026 - Nov 17, 2026" : kind === "date-time-picker" ? initialDateTime : initialTime
      await openPicker(page, holder, native)
      if (kind === "time-picker") {
        const hours = surface(page, holder, native).getByRole("spinbutton", { name: "Hours", exact: true })
        await hours.focus(); await expectDeepFocus(hours); await page.keyboard.press("ArrowUp"); await expect(hours).toHaveAttribute("aria-valuenow", "11")
      } else {
        await day(holder, page, native, kind === "date-range-picker" ? 18 : 16).click(); await settled(holder, native)
        if (kind === "date-range-picker") { await day(holder, page, native, 20).click(); await settled(holder, native) }
      }
      if (kind !== "date-picker") await surface(page, holder, native).getByRole("button", { name: "OK", exact: true }).click()
      await expect(dialogs(page, native)).toHaveCount(0); await expect(field(holder, native)).toHaveValue(initial)
      await expect(holder.locator('[data-slot="phone-events"]')).toContainText(kind === "time-picker" ? "value:11:15:30" : kind === "date-range-picker" ? "value:Nov 18, 2026 - Nov 20, 2026" : "value:Nov 16, 2026")
      await openPicker(page, holder, native)
      if (kind === "time-picker") await expect(surface(page, holder, native).getByRole("spinbutton", { name: "Hours", exact: true })).toHaveAttribute("aria-valuenow", "10")
      else await expect(day(holder, page, native, 13)).toHaveAttribute("aria-selected", "true")
      await surface(page, holder, native).getByRole("button", { name: "Cancel", exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0)
      await expect(field(holder, native)).toHaveValue(initial)
    })
    test(`${label} DatePicker icon opens a title, calendar and Cancel; pick commits and close blurs`, async ({ page }) => {
      const holder = await visit(page, "date-picker", native)
      await field(holder, native).click(); await expect(dialogs(page, native)).toHaveCount(0); await openPicker(page, holder, native)
      await expect(surface(page, holder, native).getByText("Appointment", { exact: true }).last()).toBeVisible()
      await expect(surface(page, holder, native).getByRole("button", { name: "Cancel", exact: true })).toBeVisible()
      await day(holder, page, native, 16).click(); await expect(dialogs(page, native)).toHaveCount(0)
      await expect(field(holder, native)).toHaveValue("Nov 16, 2026")
      await expect(field(holder, native)).not.toBeFocused()
      await openPicker(page, holder, native)
      await surface(page, holder, native).getByRole("button", { name: "Cancel", exact: true }).click()
      await expect(dialogs(page, native)).toHaveCount(0); await expect(field(holder, native)).toHaveValue("Nov 16, 2026")
    })
    test(`${label} DateRangePicker keeps a first date temporary, updates a completed range before OK, and Cancel preserves it`, async ({ page }) => {
      const holder = await visit(page, "date-range-picker", native)
      await openPicker(page, holder, native)
      await day(holder, page, native, 18).click(); await settled(holder, native)
      await surface(page, holder, native).getByRole("button", { name: "Cancel", exact: true }).click()
      await expect(dialogs(page, native)).toHaveCount(0); await expect(field(holder, native)).toHaveValue("Nov 13, 2026 - Nov 17, 2026")
      await openPicker(page, holder, native)
      await day(holder, page, native, 18).click(); await settled(holder, native)
      await day(holder, page, native, 20).click(); await settled(holder, native)
      await expect(dialogs(page, native)).toBeVisible(); await expect(field(holder, native)).toHaveValue("Nov 18, 2026 - Nov 20, 2026")
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText('["value:Nov 18, 2026 - Nov 20, 2026"]')
      await surface(page, holder, native).getByRole("button", { name: "Cancel", exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0)
      await expect(field(holder, native)).toHaveValue("Nov 18, 2026 - Nov 20, 2026")
      await openPicker(page, holder, native); await surface(page, holder, native).getByRole("button", { name: "OK", exact: true }).click()
      await expect(dialogs(page, native)).toHaveCount(0)
      await expect(holder.locator('[data-slot="phone-events"]')).toContainText('change:Nov 18, 2026 - Nov 20, 2026')
    })
    test(`${label} DateTimePicker date selection switches to Time; Cancel rolls back; OK commits`, async ({ page }) => {
      const holder = await visit(page, "date-time-picker", native)
      await openPicker(page, holder, native)
      await day(holder, page, native, 16).click(); await settled(holder, native)
      const clock = surface(page, holder, native).getByRole('spinbutton', { name: 'Hours', exact: true })
      await expect(clock).toBeVisible(); await expectDeepFocus(clock)
      await expect(field(holder, native)).toHaveValue(initialDateTime)
      await surface(page, holder, native).getByRole("button", { name: "Cancel", exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0)
      await expect(field(holder, native)).toHaveValue(initialDateTime)
      await openPicker(page, holder, native); await expect(day(holder, page, native, 13)).toBeVisible()
      await day(holder, page, native, 16).click(); await settled(holder, native)
      await surface(page, holder, native).getByRole("button", { name: "OK", exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0)
      await expect(field(holder, native)).toHaveValue(native ? "Nov 16, 2026, 9:20:45 AM" : "Nov 16, 2026, 9:20:45\u202fAM")
    })
    test(`${label} DateTimePicker preserves a committed input time after switching dates`, async ({ page }) => {
      const holder = await visit(page, "date-time-picker", native)
      await field(holder, native).fill("Nov 14, 2026, 10:15:30 AM")
      await openPicker(page, holder, native)
      await day(holder, page, native, 16).click(); await settled(holder, native)
      await surface(page, holder, native).getByRole("button", { name: "OK", exact: true }).click()
      await expect(dialogs(page, native)).toHaveCount(0)
      await expect(field(holder, native)).toHaveValue(native ? "Nov 16, 2026, 10:15:30 AM" : "Nov 16, 2026, 10:15:30\u202fAM")
    })
    for (const [policy, canonical, hours, minutes, seconds] of [
      ['reject', initialDateTime, 10, 15, 30],
      ['echo', 'Nov 16, 2026, 9:20:45 AM', 9, 20, 45],
      ['replace', 'Nov 14, 2026, 11:35:50 AM', 11, 35, 50],
      ['reset', '', 9, 20, 45],
    ] as const) test(`${label} DateTimePicker caches the canonical ${policy} consumer result after the callback`, async ({ page }) => {
      const holder = await visit(page, 'date-time-picker', native, `&consumer=${policy}`)
      await expect(holder).toHaveAttribute('data-consumer', policy)
      await openPicker(page, holder, native); await day(holder, page, native, 16).click(); await settled(holder, native)
      await surface(page, holder, native).getByRole('button', { name: 'OK', exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0); await settled(holder, native)
      await expect(field(holder, native)).toHaveValue(!native && policy === 'echo' ? canonical.replace(' AM', '\u202fAM') : canonical)
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText(JSON.stringify([`value:Nov 16, 2026, 9:20:45${native ? ' ' : '\u202f'}AM`]))
      await openPicker(page, holder, native); await day(holder, page, native, 18).click(); await settled(holder, native)
      for (const [name, number] of [['Hours', hours], ['Minutes', minutes], ['Seconds', seconds]] as const) await expect(surface(page, holder, native).getByRole('spinbutton', { name, exact: true })).toHaveAttribute('aria-valuenow', String(number))
      await surface(page, holder, native).getByRole('button', { name: 'OK', exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0); await settled(holder, native)
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText(JSON.stringify([`value:Nov 16, 2026, 9:20:45${native ? ' ' : '\u202f'}AM`, `value:Nov 18, 2026, ${hours}:${minutes}:${seconds}${native ? ' ' : '\u202f'}AM`]))
    })
    test(`${label} DateTimePicker keeps its last valid canonical time when the next consumer result is empty`, async ({ page }) => {
      const holder = await visit(page, 'date-time-picker', native, '&consumer=replace-reset')
      for (const number of [16, 18]) {
        await openPicker(page, holder, native); await day(holder, page, native, number).click(); await settled(holder, native)
        await surface(page, holder, native).getByRole('button', { name: 'OK', exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0); await settled(holder, native)
      }
      await expect(field(holder, native)).toHaveValue('')
      await openPicker(page, holder, native); await day(holder, page, native, 19).click(); await settled(holder, native)
      for (const [name, number] of [['Hours', 11], ['Minutes', 35], ['Seconds', 50]] as const) await expect(surface(page, holder, native).getByRole('spinbutton', { name, exact: true })).toHaveAttribute('aria-valuenow', String(number))
      await surface(page, holder, native).getByRole('button', { name: 'OK', exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0)
      await expect(field(holder, native)).toHaveValue(`Nov 19, 2026, 11:35:50${native ? ' ' : '\u202f'}AM`)
    })
    test(`${label} DateTimePicker unchanged initial OK leaves the native time cache empty`, async ({ page }) => {
      const holder = await visit(page, 'date-time-picker', native)
      await openPicker(page, holder, native); await surface(page, holder, native).getByRole('button', { name: 'OK', exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0)
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText('[]')
      await openPicker(page, holder, native); await day(holder, page, native, 16).click(); await settled(holder, native)
      await expect(surface(page, holder, native).getByRole('spinbutton', { name: 'Hours', exact: true })).toHaveAttribute('aria-valuenow', '9')
      await surface(page, holder, native).getByRole('button', { name: 'Cancel', exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0)
    })
    for (const cached of [false, true]) test(`${label} DateTimePicker external setter ${cached ? 'does not replace' : 'does not seed'} its event-path time cache`, async ({ page }) => {
      const holder = await visit(page, 'date-time-picker', native, '&external-reset')
      if (cached) {
        await openPicker(page, holder, native); await day(holder, page, native, 16).click(); await settled(holder, native)
        await surface(page, holder, native).getByRole('button', { name: 'OK', exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0); await settled(holder, native)
      }
      await holder.getByRole('button', { name: 'Replace external value', exact: true }).click(); await settled(holder, native)
      await expect(field(holder, native)).toHaveValue('Nov 15, 2026, 6:45:10 AM')
      await openPicker(page, holder, native); await day(holder, page, native, 18).click(); await settled(holder, native)
      for (const [name, number] of [['Hours', 9], ['Minutes', 20], ['Seconds', 45]] as const) await expect(surface(page, holder, native).getByRole('spinbutton', { name, exact: true })).toHaveAttribute('aria-valuenow', String(number))
      await surface(page, holder, native).getByRole('button', { name: 'Cancel', exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0)
      await expect(field(holder, native)).toHaveValue('Nov 15, 2026, 6:45:10 AM')
    })
    test(`${label} DateTimePicker unchanged formatted minute value does not cache hidden seconds`, async ({ page }) => {
      const holder = await visit(page, 'date-time-picker', native, '&datetime-minutes')
      await openPicker(page, holder, native); await day(holder, page, native, 13).click(); await settled(holder, native)
      await surface(page, holder, native).getByRole('button', { name: 'OK', exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0)
      await expect(field(holder, native)).toHaveValue('Nov 13, 2026, 9:20 AM')
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText('[]')
      await page.clock.setFixedTime(new Date('2026-11-13T10:30:15Z'))
      await openPicker(page, holder, native); await day(holder, page, native, 16).click(); await settled(holder, native)
      for (const [name, number] of [['Hours', 10], ['Minutes', 30]] as const) await expect(surface(page, holder, native).getByRole('spinbutton', { name, exact: true })).toHaveAttribute('aria-valuenow', String(number))
      await surface(page, holder, native).getByRole('button', { name: 'Cancel', exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0)
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText('[]')
    })
    for (const kind of ["date-picker", "date-range-picker", "date-time-picker", "time-picker"]) test(`${label} ${kind} phone toggle keys retain native modifier guards`, async ({ page }) => {
      const holder = await visit(page, kind, native)
      const input = field(holder, native)
      await input.focus()
      for (const key of ["Shift+F4", "Control+F4", "Meta+F4", "Control+Alt+ArrowDown", "Shift+Alt+ArrowDown"]) {
        await input.press(key); await settled(holder, native); await expect(dialogs(page, native)).toHaveCount(0)
      }
      await input.press("F4"); await settled(holder, native); await expect(dialogs(page, native)).toBeVisible()
      const cancel = surface(page, holder, native).getByRole("button", { name: "Cancel", exact: true })
      await cancel.focus(); await expectDeepFocus(cancel)
      await page.keyboard.press("Shift+Escape"); await settled(holder, native); await expect(dialogs(page, native)).toBeVisible()
      await page.keyboard.press("Escape"); await expect(dialogs(page, native)).toHaveCount(0)
    })
    test(`${label} TimePicker icon opens full clocks; Cancel rolls back and OK commits`, async ({ page }) => {
      const holder = await visit(page, "time-picker", native)
      await openPicker(page, holder, native)
      const hours = surface(page, holder, native).getByRole('spinbutton', { name: 'Hours', exact: true })
      await hours.focus(); await expectDeepFocus(hours); await page.keyboard.press('ArrowUp'); await settled(holder, native)
      await expect(hours).toHaveAttribute('aria-valuenow', '11')
      await surface(page, holder, native).getByRole("button", { name: "Cancel", exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0)
      await expect(field(holder, native)).toHaveValue(initialTime)
      await openPicker(page, holder, native); const nextHours = surface(page, holder, native).getByRole('spinbutton', { name: 'Hours', exact: true })
      await nextHours.focus(); await expectDeepFocus(nextHours); await page.keyboard.press('ArrowUp'); await settled(holder, native)
      await surface(page, holder, native).getByRole("button", { name: "OK", exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0)
      await expect(field(holder, native)).toHaveValue(native ? "11:15:30 AM" : "11:15:30\u202fAM")
    })
    test(`${label} TimePicker input opens numeric popover, edits with auto-advance and submits`, async ({ page }) => {
      const holder = await visit(page, "time-picker", native)
      await field(holder, native).click(); await settled(holder, native)
      const numeric = native ? holder.locator('ui5-time-selection-inputs input') : page.locator('[data-slot="time-selection-inputs"] input')
      await expect(numeric).toHaveCount(3); await expect(numeric.first()).toHaveAttribute('inputmode', 'numeric')
      for (const [index, entity] of ['hours', 'minutes', 'seconds'].entries()) await expect(numeric.nth(index)).toHaveAccessibleName(`Please enter ${entity}`)
      await expect(dialogs(page, native)).toHaveCount(0)
      await numeric.first().focus(); await expectDeepFocus(numeric.first()); await page.keyboard.type('11'); await expectDeepFocus(numeric.nth(1))
      await expect(field(holder, native)).toHaveValue(initialTime)
      await (native ? holder : page.locator('[data-slot="time-picker-inputs-popover"]')).getByRole('button', { name: 'OK', exact: true }).click()
      await expect(numeric.first()).not.toBeVisible(); await expect(field(holder, native)).toHaveValue(native ? '11:15:30 AM' : '11:15:30\u202fAM')
    })
    // TimeSelectionInputs.js/_oninput only edits (and seeds the keyboard buffer) when the parsed value changes:
    // pasting "010" over 10 is a no-op, so the next digits start a fresh buffer ("1" then "2" → 12).
    for (const [pasted, expected] of [["010", "12:15:30 AM"], ["10", "12:15:30 AM"]] as const) test(`${label} TimePicker numeric input ignores an equivalent pasted value ("${pasted}")`, async ({ page }) => {
      const holder = await visit(page, "time-picker", native)
      const numeric = await openNumeric(page, holder, native)
      await numeric.first().fill(pasted); await settled(holder, native)
      await page.keyboard.type('1'); await settled(holder, native)
      await page.keyboard.type('2'); await settled(holder, native)
      await expectDeepFocus(numeric.nth(1))
      await submitNumeric(page, holder, native, numeric, 'OK', expected)
    })
    test(`${label} TimePicker numeric inputs preserve an empty draft, Cancel resets it, and manual focus keeps the native number buffer`, async ({ page }) => {
      const holder = await visit(page, "time-picker", native)
      await field(holder, native).click(); await settled(holder, native)
      const numeric = native ? holder.locator('ui5-time-selection-inputs input') : page.locator('[data-slot="time-selection-inputs"] input')
      const buttons = native ? holder : page.locator('[data-slot="time-picker-inputs-popover"]')
      await numeric.first().fill(''); await settled(holder, native); await expect(numeric.first()).toHaveValue('')
      await buttons.getByRole('button', { name: 'Cancel', exact: true }).click(); await expect(numeric.first()).not.toBeVisible(); await expect(field(holder, native)).toHaveValue(initialTime)
      await expectDeepFocus(field(holder, native))
      await field(holder, native).click(); await settled(holder, native); await expect(numeric.first()).not.toBeVisible()
      await page.mouse.click(370, 650); await expect(field(holder, native)).not.toBeFocused()
      await field(holder, native).click(); await settled(holder, native); await expect(numeric.first()).toHaveValue('10')
      await expect(numeric.first()).toBeVisible()
      if (native) await expect(holder.locator('ui5-popover[open]')).toHaveCSS('opacity', '1')
      await numeric.first().focus(); await expectDeepFocus(numeric.first()); await page.keyboard.type('1'); await settled(holder, native)
      await numeric.nth(1).focus(); await expectDeepFocus(numeric.nth(1)); await page.keyboard.type('2'); await settled(holder, native)
      await expect(numeric.nth(1)).toHaveValue('12'); await expectDeepFocus(numeric.nth(2))
      await expect(field(holder, native)).toHaveValue(initialTime)
      await buttons.getByRole('button', { name: 'OK', exact: true }).click(); await expect(numeric.first()).not.toBeVisible()
      await expect(field(holder, native)).toHaveValue(native ? '1:12:30 AM' : '1:12:30\u202fAM')
    })
    for (const mode of ['AM', 'PM', '24']) for (const submit of ['Enter', 'OK']) test(`${label} TimePicker numeric ${mode} pasted hour boundaries settle through ${submit}`, async ({ page }) => {
      const expected = mode === 'AM' ? ['12:15:30 AM', '12:15:30 AM', '1:15:30 PM', '2:15:30 PM', '12:15:30 AM'] : mode === 'PM' ? ['12:15:30 PM', '12:15:30 PM', '1:15:30 AM', '2:15:30 AM', '12:15:30 PM'] : ['00:15:30', '12:15:30', '13:15:30', '14:15:30', '00:15:30']
      for (const [index, hour] of [0, 12, 13, 14, 24].entries()) {
        const holder = await visit(page, 'time-picker', native, mode === '24' ? '&numeric=24' : `&period=${mode}`)
        await expect(holder).toHaveAttribute('data-numeric', mode === '24' ? '24' : '12')
        await expect(holder.locator('[data-slot="phone-query"]')).toContainText(mode === '24' ? 'numeric=24' : `period=${mode}`)
        const numeric = await openNumeric(page, holder, native)
        await numeric.first().fill(String(hour)); await settled(holder, native); await expect(numeric.first()).toHaveValue(String(hour))
        await submitNumeric(page, holder, native, numeric, submit, expected[index])
      }
    })
    for (const mode of ['AM', 'PM', '24']) test(`${label} TimePicker numeric ${mode} minute and second paste overflow uses native Date arithmetic`, async ({ page }) => {
      for (const [index, expected] of [[1, mode === '24' ? '11:00:30' : `11:00:30 ${mode}`], [2, mode === '24' ? '10:16:00' : `10:16:00 ${mode}`]] as const) {
        const holder = await visit(page, 'time-picker', native, mode === '24' ? '&numeric=24' : `&period=${mode}`)
        const numeric = await openNumeric(page, holder, native)
        await numeric.nth(index).fill('60'); await settled(holder, native); await expect(numeric.nth(index)).toHaveValue('60')
        await submitNumeric(page, holder, native, numeric, 'OK', expected)
      }
    })
    for (const mode of ['AM', 'PM', '24']) test(`${label} TimePicker numeric ${mode} paste then overflow digit composes both native buffer updates`, async ({ page }) => {
      const holder = await visit(page, 'time-picker', native, mode === '24' ? '&numeric=24' : `&period=${mode}`)
      const numeric = await openNumeric(page, holder, native)
      await numeric.first().fill('13'); await settled(holder, native); await expect(numeric.first()).toHaveValue('13')
      await numeric.first().press('5'); await settled(holder, native); await expectDeepFocus(numeric.nth(1)); await expect(numeric.nth(1)).toHaveValue('15')
      await expect(numeric.first()).toHaveValue(mode === '24' ? '05' : '5')
      await submitNumeric(page, holder, native, numeric, 'OK', mode === '24' ? '05:15:30' : `5:15:30 ${mode}`)
    })
    for (const depth of [1, 2, 3]) for (const target of ['row', 'footer']) test(`${label} Menu phone depth ${depth} ${target} Escape closes its whole tree exactly once`, async ({ page }) => {
      const holder = await visit(page, 'menu', native, '&deep&close-events')
      await openMenuDepth(page, holder, native, depth)
      const focused = target === 'footer' ? surface(page, holder, native).getByRole('button', { name: 'Cancel', exact: true }).last() : menuRow(page, holder, native, depth === 1 ? 'New' : depth === 2 ? 'Copy' : 'Archive')
      await focused.focus(); await expectDeepFocus(focused)
      for (const key of ['Shift+Escape', 'Control+Escape', 'Alt+Escape', 'Meta+Escape']) { await page.keyboard.press(key); await settled(holder, native); await expect(dialogs(page, native)).toHaveCount(depth); await expect(holder.locator('[data-slot="phone-events"]')).toHaveText('[]') }
      await page.keyboard.press('Escape'); await expect(dialogs(page, native)).toHaveCount(0); await settled(holder, native)
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText('["closed"]')
      await expectDeepFocus(holder.getByRole('button', { name: 'Open Menu', exact: true }))
      await openMenuDepth(page, holder, native, 1); await surface(page, holder, native).getByRole('button', { name: 'Cancel', exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0)
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText('["closed","closed"]')
    })
    for (const depth of [1, 2, 3]) for (const target of ['row', 'footer']) test(`${label} Menu phone depth ${depth} ${target} Escape respects the public cancellation callback`, async ({ page }) => {
      const holder = await visit(page, 'menu', native, '&deep&close-events&prevent-escape')
      await openMenuDepth(page, holder, native, depth)
      const focused = target === 'footer' ? surface(page, holder, native).getByRole('button', { name: 'Cancel', exact: true }).last() : menuRow(page, holder, native, depth === 1 ? 'New' : depth === 2 ? 'Copy' : 'Archive')
      await focused.focus(); await expectDeepFocus(focused)
      await page.keyboard.press('Shift+Escape'); await settled(holder, native); await expect(holder.locator('[data-slot="phone-events"]')).toHaveText('[]')
      // ResponsivePopover.js/_beforeDialogClose does not forward prevention to
      // the inner native Dialog. Native closes that one surface, but MenuItem's
      // prevented callback suppresses close-menu. Preserve React's pre-existing
      // cancelable onEscapeKeyDown API; don't rewrite native handlers to fake it.
      await page.keyboard.press('Escape'); await settled(holder, native); await expect(dialogs(page, native)).toHaveCount(native ? depth - 1 : depth)
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText(native && depth === 1 ? '["escape-prevented","closed"]' : '["escape-prevented"]')
      if (!native) await expectDeepFocus(focused)
      if (!native || depth > 1) await surface(page, holder, native).getByRole('button', { name: 'Cancel', exact: true }).last().click()
      await expect(dialogs(page, native)).toHaveCount(0)
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText('["escape-prevented","closed"]')
    })
    test(`${label} Menu phone deep Back closes one level and Escape closes only its independent tree`, async ({ page }) => {
      const holder = await visit(page, 'menu', native, '&deep&close-events&two-trees')
      await openMenuDepth(page, holder, native, 3)
      await surface(page, holder, native).getByRole('button', { name: 'Navigate Back', exact: true }).last().click(); await settled(holder, native); await expect(dialogs(page, native)).toHaveCount(2)
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText('[]')
      await expect(menuRow(page, holder, native, 'Advanced')).toBeVisible()
      await surface(page, holder, native).getByRole('button', { name: 'Cancel', exact: true }).last().click(); await expect(dialogs(page, native)).toHaveCount(0)
      await expectDeepFocus(holder.getByRole('button', { name: 'Open Menu', exact: true }))
      await holder.getByRole('button', { name: 'Open Second Menu', exact: true }).press('Enter'); await settled(holder, native); await expect(dialogs(page, native)).toHaveCount(1)
      // Invoke the genuine existing consumer opener while the independent dialog
      // covers it; never call either implementation's internal close handler.
      await holder.locator('#menu-phone-open-first-consumer').evaluate((node: HTMLElement) => node.click()); await settled(holder, native); await expect(dialogs(page, native)).toHaveCount(2)
      await menuRow(page, holder, native, 'More').click(); await settled(holder, native); await expect(dialogs(page, native)).toHaveCount(3)
      const copy = menuRow(page, holder, native, 'Copy'); await copy.focus(); await expectDeepFocus(copy)
      await page.keyboard.press('Escape'); await settled(holder, native); await expect(dialogs(page, native)).toHaveCount(1)
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText('["closed","closed"]')
      const second = native ? holder.locator('#menu-phone-second-demo') : dialogs(page, false)
      await expect(native ? second.locator('ui5-menu-item[text="Other"] [role="menuitem"]') : second.getByRole('menuitem', { name: 'Other', exact: true })).toBeVisible()
      await second.getByRole('button', { name: 'Cancel', exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0)
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText('["closed","closed","second-closed"]')
    })
    test(`${label} Menu phone lower opener completes clicks before painting rows and preserves modified clicks and toggling`, async ({ page }) => {
      const holder = await visit(page, 'menu', native, '&two-trees&toggle-opener')
      const opener = holder.getByRole('button', { name: 'Open Second Menu', exact: true, includeHidden: true })
      for (const [index, modifiers] of ([[], ['Shift'], ['Alt'], ['Meta']] as const).entries()) {
        await opener.click({ modifiers: [...modifiers] }); await settled(holder, native); await expect(dialogs(page, native)).toHaveCount(1)
        const other = native ? holder.locator('#menu-phone-second-demo ui5-menu-item[text="Other"] [role="menuitem"]') : dialogs(page, false).getByRole('menuitem', { name: 'Other', exact: true })
        await expect(other).toBeVisible(); await expectDeepFocus(other)
        await expect(holder.locator('[data-slot="phone-events"]')).toHaveText(JSON.stringify(Array.from({ length: index }, () => 'second-closed')))
        // This genuine consumer fixture toggles its native public open property;
        // React MenuTrigger preserves its existing toggle API for scripted clicks.
        await opener.evaluate((node: HTMLElement) => node.click()); await settled(holder, native); await expect(dialogs(page, native)).toHaveCount(0)
        await expectDeepFocus(opener)
        await expect(holder.locator('[data-slot="phone-events"]')).toHaveText(JSON.stringify(Array.from({ length: index + 1 }, () => 'second-closed')))
      }
      await opener.click(); await settled(holder, native); await expect(dialogs(page, native)).toHaveCount(1)
      await surface(page, holder, native).getByRole('button', { name: 'Cancel', exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0)
      await expectDeepFocus(opener)
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText(JSON.stringify(Array.from({ length: 5 }, () => 'second-closed')))
    })
    test(`${label} Menu phone Control click follows the platform's native button event`, async ({ page }) => {
      const holder = await visit(page, 'menu', native, '&two-trees')
      const opener = holder.getByRole('button', { name: 'Open Second Menu', exact: true })
      await opener.evaluate((node: HTMLElement) => {
        node.dataset.gestureEvents = '[]'
        for (const type of ['click', 'contextmenu']) node.addEventListener(type, (event) => {
          if (event instanceof MouseEvent) node.dataset.gestureEvents = JSON.stringify([...JSON.parse(node.dataset.gestureEvents!), event.type])
        }, { capture: true })
      })
      await opener.click({ modifiers: ['Control'] }); await settled(holder, native)
      // Chromium on macOS turns physical Control+left into contextmenu with no
      // click. Genuine UI5 Button consequently does not open the menu either.
      const contextMenu = process.platform === 'darwin'
      await expect(opener).toHaveAttribute('data-gesture-events', JSON.stringify([contextMenu ? 'contextmenu' : 'click']))
      await expect(dialogs(page, native)).toHaveCount(contextMenu ? 0 : 1)
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText('[]')
      if (!contextMenu) { await surface(page, holder, native).getByRole('button', { name: 'Cancel', exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0) }
    })
    test(`${label} Menu phone lower opener caller can prevent its completed click`, async ({ page }) => {
      const holder = await visit(page, 'menu', native, '&two-trees&prevent-opener')
      await holder.getByRole('button', { name: 'Open Second Menu', exact: true }).click(); await settled(holder, native)
      await expect(dialogs(page, native)).toHaveCount(0)
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText('["opener-prevented"]')
    })
    test(`${label} Menu phone has Cancel, nested Back returns, nested Cancel closes every level`, async ({ page }) => {
      const holder = await visit(page, 'menu', native)
      await holder.getByRole('button', { name: 'Open Menu', exact: true }).click(); await settled(holder, native)
      await expect(dialogs(page, native)).toHaveCSS('width', '375px')
      await (native ? holder.locator('ui5-menu-item[text="More"]').locator('[role="menuitem"]').first() : surface(page, holder, false).getByRole('menuitem', { name: 'More', exact: true })).click(); await settled(holder, native)
      await expect(dialogs(page, native)).toHaveCount(2)
      const back = surface(page, holder, native).getByRole('button', { name: 'Navigate Back', exact: true })
      await expect(back).toBeVisible(); await back.click(); await settled(holder, native); await expect(dialogs(page, native)).toHaveCount(1)
      await (native ? holder.locator('ui5-menu-item[text="More"]').locator('[role="menuitem"]').first() : surface(page, holder, false).getByRole('menuitem', { name: 'More', exact: true })).click(); await settled(holder, native)
      await surface(page, holder, native).getByRole('button', { name: 'Cancel', exact: true }).last().click(); await expect(dialogs(page, native)).toHaveCount(0)
      await holder.getByRole('button', { name: 'Open Menu', exact: true }).click(); await settled(holder, native)
      await (native ? holder.locator('ui5-menu-item[text="New"]').locator('[role="menuitem"]').first() : surface(page, holder, false).getByRole('menuitem', { name: 'New', exact: true })).click(); await expect(dialogs(page, native)).toHaveCount(0)
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText('["New"]')
    })
    test(`${label} Menu scroll keeps the phone Cancel footer visible`, async ({ page }) => {
      const holder = await visit(page, "menu", native, "-long")
      await holder.getByRole("button", { name: "Open Menu", exact: true }).click(); await settled(holder, native)
      const last = native ? holder.locator('ui5-menu-item[text="Action 30"]').locator('[role="menuitem"]').first() : surface(page, holder, false).getByRole("menuitem", { name: "Action 30", exact: true })
      await last.scrollIntoViewIfNeeded(); await expect(last).toBeVisible()
      await expect(surface(page, holder, native).getByRole("button", { name: "Cancel", exact: true })).toBeVisible()
      const box = await surface(page, holder, native).getByRole("button", { name: "Cancel", exact: true }).boundingBox()
      expect(box!.y + box!.height).toBeLessThanOrEqual(667)
    })
    for (const kind of ['search', 'shellbar-search']) test(`${label} ${kind} phone header edits, Cancel restores and Enter submits`, async ({ page }) => {
      const holder = await visit(page, kind, native)
      await (kind === 'search' ? holder.locator('input').first() : holder.getByRole('button', { name: 'Open Search', exact: true })).click(); await settled(holder, native)
      await expect(dialogs(page, native)).toHaveCSS('width', '375px')
      const mobile = native ? holder.locator(kind === 'search' ? 'ui5-responsive-popover ui5-input input' : 'ui5-responsive-popover input') : dialogs(page, false).locator('input')
      await expectDeepFocus(mobile); await mobile.fill('Other'); await settled(holder, native)
      await surface(page, holder, native).getByRole('button', { name: 'Cancel', exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0)
      await (kind === 'search' ? holder.locator('input').first() : holder.getByRole('button', { name: 'Open Search', exact: true })).click(); await settled(holder, native)
      await expect(mobile).toHaveValue('Notebook'); await mobile.fill('Other'); await settled(holder, native)
      await mobile.press('Enter'); await expect(dialogs(page, native)).toHaveCount(0)
      await expect(holder.locator('[data-slot="phone-events"]')).toContainText('search:Other')
    })
    for (const kind of ['search', 'shellbar-search']) test(`${label} ${kind} ignores modified Enter/Escape and plain Escape keeps the edited value`, async ({ page }) => {
      const holder = await visit(page, kind, native)
      const open = async () => { await (kind === 'search' ? holder.locator('input').first() : holder.getByRole('button', { name: 'Open Search', exact: true })).click(); await settled(holder, native); await expect(dialogs(page, native)).toBeVisible() }
      await open()
      const mobile = native ? holder.locator(kind === 'search' ? 'ui5-responsive-popover ui5-input input' : 'ui5-responsive-popover input') : dialogs(page, false).locator('input')
      await mobile.fill('Other'); await settled(holder, native)
      for (const key of ['Shift+Enter', 'Control+Enter', 'Alt+Enter', 'Meta+Enter', 'Shift+Escape', 'Control+Escape', 'Alt+Escape', 'Meta+Escape']) {
        await mobile.press(key); await settled(holder, native); await expect(dialogs(page, native)).toBeVisible()
      }
      await expect(holder.locator('[data-slot="phone-events"]')).not.toContainText('search:')
      await mobile.press('Escape'); await expect(dialogs(page, native)).toHaveCount(0)
      await open(); await expect(mobile).toHaveValue('Other')
      await surface(page, holder, native).getByRole('button', { name: 'Cancel', exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0)
    })
    for (const kind of ['search', 'shellbar-search']) test(`${label} ${kind} first suggestion ArrowUp uses its owning native input without closing or firing callbacks`, async ({ page }) => {
      const holder = await visit(page, kind, native)
      await (kind === 'search' ? holder.locator('input').first() : holder.getByRole('button', { name: 'Open Search', exact: true })).click(); await settled(holder, native)
      await expect(dialogs(page, native)).toBeVisible()
      if (native) await expect(dialogs(page, native)).toHaveCSS('opacity', '1')
      const headerInput = native ? holder.locator(kind === 'search' ? 'ui5-responsive-popover ui5-input input' : 'ui5-responsive-popover input') : dialogs(page, false).locator('input')
      await expectDeepFocus(headerInput)
      const first = native ? holder.locator('ui5-search-item [role="option"]').first() : dialogs(page, false).locator('[data-slot="search-item"]').first()
      await first.focus(); await expectDeepFocus(first); await page.keyboard.press('ArrowUp'); await settled(holder, native)
      const target = kind === 'search' ? holder.locator('input').first() : native ? holder.locator('ui5-responsive-popover input') : dialogs(page, false).locator('input')
      await expectDeepFocus(target); await expect(dialogs(page, native)).toBeVisible()
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText('[]')
      await target.press('Shift+Escape'); await settled(holder, native); await expect(dialogs(page, native)).toBeVisible()
      await target.press('Escape'); await expect(dialogs(page, native)).toHaveCount(0)
      await expectDeepFocus(kind === 'search' ? target : holder.getByRole('button', { name: 'Open Search', exact: true }))
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText('[]')
    })
    test(`${label} ordinary phone Search closes when Tab leaves its outer input after ArrowUp`, async ({ page }) => {
      const holder = await visit(page, 'search', native)
      await holder.locator('input').first().click(); await settled(holder, native); await expect(dialogs(page, native)).toBeVisible()
      const mobile = native ? holder.locator('ui5-responsive-popover ui5-input input') : dialogs(page, false).locator('input')
      await expectDeepFocus(mobile)
      const first = native ? holder.locator('ui5-search-item [role="option"]').first() : dialogs(page, false).locator('[data-slot="search-item"]').first()
      await first.focus(); await expectDeepFocus(first); await page.keyboard.press('ArrowUp'); await expectDeepFocus(holder.locator('input').first())
      await page.keyboard.press('Tab'); await expect(dialogs(page, native)).toHaveCount(0)
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText('[]')
    })
    for (const kind of ['search', 'shellbar-search']) test(`${label} ${kind} phone Tab boundaries and native list forwarding areas retain their focus`, async ({ page }) => {
      const holder = await visit(page, kind, native)
      const open = async () => { await (kind === 'search' ? holder.locator('input').first() : holder.getByRole('button', { name: 'Open Search', exact: true })).click(); await settled(holder, native); await expect(dialogs(page, native)).toBeVisible(); if (native) await expect(dialogs(page, native)).toHaveCSS('opacity', '1') }
      await open()
      const mobile = native ? holder.locator(kind === 'search' ? 'ui5-responsive-popover ui5-input input' : 'ui5-responsive-popover input') : dialogs(page, false).locator('input')
      const first = native ? holder.locator('ui5-search-item [role="option"]').first() : dialogs(page, false).locator('[data-slot="search-item"]').first()
      const before = native ? holder.locator('ui5-list.ui5-search-list .ui5-list-focusarea').first() : dialogs(page, false).locator('[data-slot="search-list-before"]')
      const after = native ? holder.locator('ui5-list.ui5-search-list .ui5-list-focusarea').last() : dialogs(page, false).locator('[data-slot="search-list-after"]')
      await expectDeepFocus(mobile); await page.keyboard.press('Shift+Tab'); await expectDeepFocus(first)
      await page.keyboard.press('Tab'); await expectDeepFocus(after)
      for (const key of ['Tab', 'Shift+Tab']) { await page.keyboard.press(key); await settled(holder, native); await expectDeepFocus(after); await expect(dialogs(page, native)).toBeVisible() }
      await page.keyboard.press('Escape'); await expect(dialogs(page, native)).toHaveCount(0)
      await open(); await expectDeepFocus(mobile)
      await page.keyboard.press('Tab'); await expectDeepFocus(surface(page, holder, native).getByRole('button', { name: 'Cancel', exact: true }))
      await page.keyboard.press('Tab'); await expectDeepFocus(first)
      await page.keyboard.press('Shift+Tab'); await expectDeepFocus(before)
      for (const key of ['Tab', 'Shift+Tab']) { await page.keyboard.press(key); await settled(holder, native); await expectDeepFocus(before); await expect(dialogs(page, native)).toBeVisible() }
      await page.keyboard.press('Escape'); await expect(dialogs(page, native)).toHaveCount(0)
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText('[]')
    })
    test(`${label} ordinary phone Search locks real tall-page wheel/touch scrolling, restores it after close, and unmount releases only its own blocker`, async ({ page }) => {
      const holder = await visit(page, 'search', native, '&lifecycle')
      await page.evaluate(() => { const tail = document.createElement('div'); tail.style.height = '2000px'; document.body.append(tail) })
      const html = page.locator('html')
      const originalOverflow = await html.evaluate((node) => getComputedStyle(node).overflow)
      const wheel = async () => {
        const handled = page.evaluate(() => new Promise<void>((resolve) => document.addEventListener('wheel', () => requestAnimationFrame(() => requestAnimationFrame(() => resolve())), { once: true, capture: true })))
        await page.evaluate(() => 0); await page.mouse.move(300, 600); await page.mouse.wheel(0, 250); await handled
      }
      await wheel(); await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
      await page.evaluate(() => window.scrollTo(0, 0)); await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
      const open = async () => { await holder.locator('input').first().click(); await settled(holder, native); await expect(dialogs(page, native)).toBeVisible(); await expect(html).toHaveCSS('overflow', 'hidden') }
      await open(); await wheel(); expect(await page.evaluate(() => window.scrollY)).toBe(0)
      const touch = await page.context().newCDPSession(page)
      await touch.send('Input.synthesizeScrollGesture', { x: 300, y: 600, yDistance: -250, gestureSourceType: 'touch' }); await touch.detach()
      expect(await page.evaluate(() => window.scrollY)).toBe(0)
      await page.mouse.click(374, 666); await settled(holder, native); await expect(dialogs(page, native)).toBeVisible()
      await expect(holder.locator('[data-slot="phone-events"]')).toHaveText('[]')
      await surface(page, holder, native).getByRole('button', { name: 'Cancel', exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0); await expect(html).toHaveCSS('overflow', originalOverflow)
      await wheel(); await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
      await page.evaluate(() => window.scrollTo(0, 0)); await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
      await open()
      await holder.locator('#search-phone-open-second').evaluate((node: HTMLElement) => node.click()); await settled(holder, native); await expect(dialogs(page, native)).toHaveCount(2)
      await holder.locator('#search-phone-unmount').evaluate((node: HTMLElement) => node.click()); await settled(holder, native); await expect(dialogs(page, native)).toHaveCount(1); await expect(html).toHaveCSS('overflow', 'hidden')
      await wheel(); expect(await page.evaluate(() => window.scrollY)).toBe(0)
      await (native ? holder.locator('#search-phone-second-demo') : dialogs(page, false)).getByRole('button', { name: 'Cancel', exact: true }).click(); await expect(dialogs(page, native)).toHaveCount(0); await expect(html).toHaveCSS('overflow', originalOverflow)
      await wheel(); await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
    })
    for (const kind of ['search', 'shellbar-search']) test(`${label} ${kind} phone scopes start unselected, navigate and select, and close only the nested surface`, async ({ page }) => {
      const holder = await visit(page, kind, native, "-scopes")
      if (kind === "shellbar-search") {
        await holder.getByRole("button", { name: "Open Search", exact: true }).click(); await settled(holder, native)
        if (native) await expect(dialogs(page, native)).toHaveCSS("opacity", "1")
      }
      const scopeButton = (native || kind === "search" ? holder : dialogs(page, false)).getByRole("button", { name: "Select Scope", exact: true })
      await scopeButton.click(); await settled(holder, native)
      const scopeList = native ? holder.locator('ui5-responsive-popover[id$="-scope-popover"]') : dialogs(page, false).last()
      const rows = native ? scopeList.locator("ui5-li") : scopeList.locator('[data-slot="list-item"]')
      await expect(rows).toHaveCount(2)
      await expect(native ? scopeList.locator("ui5-li[selected]") : scopeList.locator('[data-slot="list-item"][data-selected]')).toHaveCount(0)
      const first = native ? rows.first().getByRole("listitem") : rows.first()
      const second = native ? rows.nth(1).getByRole("listitem") : rows.nth(1)
      await first.focus(); await expectDeepFocus(first); await page.keyboard.press("ArrowDown"); await expectDeepFocus(second)
      await page.keyboard.press("Enter"); await settled(holder, native)
      await expect(dialogs(page, native)).toHaveCount(kind === "shellbar-search" ? 1 : 0)
      await expect(holder.locator('[data-slot="phone-events"]')).toContainText("scope:products")
      const selectedScopeButton = (native || kind === "search" ? holder : dialogs(page, false)).getByRole("button", { name: "Select Scope, Products", exact: true })
      await selectedScopeButton.click(); await settled(holder, native)
      const selected = native ? scopeList.locator('ui5-li[selected]') : scopeList.locator('[data-slot="list-item"][data-selected]')
      await expect(selected).toHaveAttribute(native ? "data-scope-value" : "data-nav-key", "products")
      // Native text is assigned through a slot; its shadow subtree also contains
      // the accessibility helper "Is Active". Check the actual option text node.
      await expect(native ? selected : selected.locator(".fiori-li__title")).toHaveJSProperty("textContent", "Products")
      await scopeList.getByRole("button", { name: "Decline", exact: true }).click(); await settled(holder, native)
      await expect(dialogs(page, native)).toHaveCount(kind === "shellbar-search" ? 1 : 0)
      if (kind === "shellbar-search") await surface(page, holder, native).getByRole("button", { name: "Cancel", exact: true }).click()
      await expect(dialogs(page, native)).toHaveCount(0)
    })
  }
  test('ValueHelpDialog stretches, scrolls and keeps OK/Cancel visible; cancel restores selection', async ({ page }) => {
    await page.goto('/index.html#/value-help-dialog'); await page.waitForSelector('html[data-ready=true]')
    await page.evaluate(() => { document.documentElement.dataset.fioriDevice = 'phone' })
    await page.locator('#value-help-dialog-demo-open').click()
    const dialog = page.getByRole('dialog', { name: 'Product', exact: true })
    await expect(dialog).toHaveCSS('width', '375px'); await expect(dialog).toHaveCSS('height', '667px')
    await dialog.locator('tbody tr[data-row]').first().click()
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click(); await expect(dialog).toHaveCount(0)
    await page.locator('#value-help-dialog-demo-open').click(); await expect(dialog.locator('[data-slot="value-help-token"]')).toHaveCount(0)
    await expect(dialog.getByRole('button', { name: 'OK', exact: true })).toBeVisible(); await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible()
  })
})
