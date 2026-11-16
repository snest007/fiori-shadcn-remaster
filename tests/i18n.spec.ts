import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { expect, test, type Page } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { formatNumber, formatPercent, parseNumber } from "../registry/lib/fiori-numbers"
import { collatorIncludes, formatSapText } from "../registry/lib/fiori-locale"
import AxeBuilder from "@axe-core/playwright"
import { formatPickerDate } from "../registry/ui/date-picker"
import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { FioriLocaleProvider, useFioriTexts } from "../registry/lib/fiori-locale"
import { Card, CardContent } from "../registry/ui/card"

const de = JSON.parse(readFileSync("registry/i18n/de.json", "utf8"))
const locales = ["de-DE", "zh-CN", "ar-EG"]
const components = ["calendar", "date-picker", "date-time-picker", "time-picker", "step-input", "slider"]

test("provider texts reach real controls and component overrides win", async ({ page }) => {
  await page.goto("/?locale=de-DE#/i18n")
  const demo = page.locator("#i18n-demo")
  await expect(demo.locator("#i18n-step input")).toHaveValue("1,5")
  await expect(demo.locator("#i18n-step [data-dir=inc]")).toHaveAttribute("title", de.NUMBERINPUT_INC_ICON_TITLE)
  await expect(demo.locator("#i18n-override [data-dir=inc]")).toHaveAttribute("title", "Component increase")
  await expect(demo.locator("#i18n-calendar").getByRole("button").first()).toHaveAttribute("title", `${de.CALENDAR_HEADER_MONTH_PREVIOUS_BUTTON_TITLE} (${de.CALENDAR_HEADER_MONTH_PREVIOUS_BUTTON_SHORTCUT})`)
  await expect(demo.locator("#i18n-table")).toContainText(de.TABLE_NO_DATA)
  await expect(demo.locator("#i18n-message button")).toHaveAttribute("aria-label", de.MESSAGE_STRIP_CLOSE_BUTTON_INFORMATION)
  await demo.locator("#i18n-combobox input").press("F4")
  await expect(page.locator("[data-slot=combobox-no-data]")).toHaveText(de.LIST_NO_DATA)
  await demo.locator("#i18n-combobox input").press("Escape")
  await demo.locator("#i18n-select button").click()
  await expect(page.locator("[data-slot=select-no-data]")).toHaveText(de.LIST_NO_DATA)
  await page.keyboard.press("Escape")
  await demo.locator("#i18n-dialog button").click()
  await expect(page.getByRole("dialog").getByRole("button", { name: de.MSGBOX_CLOSE, exact: true })).toBeVisible()
})

test("localized numeric input commits a decimal and formats display values", async ({ page }) => {
  await page.goto("/?locale=de-DE#/i18n")
  const demo = page.locator("#i18n-demo")
  const input = demo.locator("#i18n-step input")
  await input.fill("2,25")
  await input.press("Enter")
  await expect(demo.getByTestId("i18n-value")).toHaveText("2.25")
  await expect(demo.locator("#i18n-slider .fiori-slider__tooltip input")).toHaveValue("0,5")
  await expect(demo.locator("#i18n-progress")).toContainText(formatPercent(0.5, "de-DE"))
  await expect(demo.locator("#i18n-number")).toContainText(formatNumber(1234.5, "de-DE"))
})

test("number parser preserves SAP grouping ambiguity and locale spacing rules", () => {
  expect(parseNumber("2,25", "de-DE")).toBe(2.25)
  expect(parseNumber("1.234,5", "de-DE")).toBe(1234.5)
  expect(parseNumber("1.23", "de-DE")).toBeNaN()
  expect(parseNumber("0.123", "de-DE")).toBeNaN()
  expect(parseNumber("1\u202f234,5", "fr-FR")).toBe(1234.5)
  expect(parseNumber("0 123", "fr-FR")).toBe(123)
  expect(formatNumber(1234.5, "fr-FR")).toBe(new Intl.NumberFormat("fr-FR").format(1234.5))
  expect(parseNumber("١٬٢٣٤٫٥", "ar-EG")).toBe(1234.5)
})

test("SAP text formatting preserves argument order and literal apostrophes", () => {
  expect(formatSapText("You''ve selected {1}, then {0}.", ["A", "B"])).toBe("You've selected B, then A.")
  expect(formatSapText("'{0}' and {0}", ["A"])).toBe("{0} and A")
})

test("function fallback announcements preserve user labels without a second substitution", () => {
  const defaults = { view: (name: string) => `View ${name}` }
  const keys = { view: "VIEW_NAME" } as const
  function Announcement() { const texts = useFioriTexts(defaults, keys); return React.createElement("output", null, texts.view("{0}x")) }
  expect(renderToStaticMarkup(React.createElement(Announcement))).toBe("<output>View {0}x</output>")
  expect(renderToStaticMarkup(React.createElement(FioriLocaleProvider, { texts: { VIEW_NAME: "Ansicht {0}" } }, React.createElement(Announcement)))).toBe("<output>Ansicht {0}x</output>")
})

test("Card content resolves a nested provider before defaults while explicit Card text props win", () => {
  const nested = (texts?: { content: string }) => renderToStaticMarkup(React.createElement(FioriLocaleProvider, { texts: { ARIA_LABEL_CARD_CONTENT: "Outer content" } }, React.createElement(Card, { texts }, React.createElement(FioriLocaleProvider, { texts: { ARIA_LABEL_CARD_CONTENT: "Nested content" } }, React.createElement(CardContent)))))
  expect(nested()).toContain('aria-label="Nested content"')
  expect(nested({ content: "Explicit parent content" })).toContain('aria-label="Explicit parent content"')
})

test("a text-only provider reaches picker and numeric native validity channels", async ({ page }) => {
  await page.goto("/#/i18n")
  const owner = page.locator("#i18n-text-only")
  for (const [id, message] of [["date", "Text-only date yyyy-MM-dd"], ["range", "Text-only range yyyy-MM-dd"], ["datetime", "Text-only date-time yyyy-MM-dd HH:mm:ss"], ["time", "Text-only time HH:mm:ss"]]) {
    await expect.poll(() => owner.locator(`#i18n-text-only-${id}`).evaluate((element: HTMLInputElement) => element.validationMessage)).toBe(message)
  }
  const number = owner.locator("#i18n-text-only-step")
  await number.fill("1.23")
  await number.press("Enter")
  await expect.poll(() => number.evaluate((element: HTMLInputElement) => element.validationMessage)).toBe("Text-only precision 1")
})

test("existing Wizard, Breadcrumbs, List and TextArea channels use SAP texts and preserve overrides", async ({ page }) => {
  await page.goto("/?locale=de-DE#/i18n")
  const wizard = page.locator("#i18n-wizard")
  await expect(wizard.locator('[role="listitem"]').first()).toHaveAttribute("aria-label", formatSapText(de.WIZARD_STEP_ARIA_LABEL, [`1 {0}x ${de.WIZARD_STEP_ACTIVE} ${de.WIZARD_OPTIONAL_STEP_ARIA_LABEL}`]))
  await expect(wizard.locator('[role="listitem"]').nth(1)).toHaveAttribute("aria-label", formatSapText(de.WIZARD_STEP_ARIA_LABEL, [`2 Second ${de.WIZARD_STEP_INACTIVE}`]))
  await expect(page.locator('#i18n-wizard-override [role="listitem"]')).toHaveAttribute("aria-label", "Stage 1: Shipping")
  await expect(page.locator("#i18n-breadcrumbs").getByRole("link", { name: `Home ${formatSapText(de.BREADCRUMB_ITEM_POS, [1, 2])}`, exact: true })).toBeVisible()
  await expect(page.locator("#i18n-breadcrumbs").getByRole("link", { name: "Custom home 1 among 2", exact: true })).toBeVisible()
  const list = page.locator("#i18n-list .fiori-list__ul").first()
  await expect(list).toHaveAccessibleName(de.ARIA_LABEL_LIST_MULTISELECTABLE)
  await expect(list).toHaveAttribute("aria-description", formatSapText(de.LIST_ROLE_LIST_GROUP_DESCRIPTION, [1, 2]))
  await expect(list.locator("[data-slot=list-item-group-header]")).toHaveAttribute("aria-roledescription", de.GROUP_HEADER_TEXT)
  await expect(page.locator("#i18n-list .fiori-list__ul").nth(1)).toHaveAccessibleName("Custom deletable mode")
  await expect(page.locator("#i18n-list").getByRole("button", { name: "Remove row", exact: true })).toBeVisible()
  const note = page.locator("#i18n-textarea").getByRole("textbox", { name: "Required short note", exact: true })
  await expect.poll(() => note.evaluate((element: HTMLTextAreaElement) => element.validationMessage)).toBe(de.FORM_TEXTFIELD_REQUIRED)
  await note.fill("ABCDE")
  await expect.poll(() => note.evaluate((element: HTMLTextAreaElement) => element.validationMessage)).toBe(formatSapText(de.TEXTAREA_EXCEEDS_MAXLENGTH, [2]))
  await note.fill("ABC")
  await expect.poll(() => note.evaluate((element: HTMLTextAreaElement) => element.validationMessage)).toBe("")
  await expect.poll(() => page.locator("#i18n-textarea").getByRole("textbox", { name: "Custom required note", exact: true }).evaluate((element: HTMLTextAreaElement) => element.validationMessage)).toBe("Please add a note")
})

test("Tokenizer deletion announces singular, plural and component override texts", async ({ page }) => {
  await page.goto("/?locale=de-DE#/i18n")
  const owner = page.locator("#i18n-token-deletion")
  await expect(owner.getByRole("listbox")).toHaveAttribute("aria-description", de.TOKENIZER_ARIA_LABEL)
  const first = owner.getByRole("option").first()
  await first.focus()
  await expect(first).toBeFocused()
  await first.press("Delete")
  await expect(owner.getByRole("status")).toHaveText(de.TOKENIZER_TOKEN_DELETED_SINGULAR)
  await expect(owner.getByRole("option")).toHaveCount(2)
  const next = owner.getByRole("option").first()
  await next.focus()
  await expect(next).toBeFocused()
  await next.press("Control+a")
  await expect(owner.getByRole("option", { selected: true })).toHaveCount(2)
  await next.press("Delete")
  await expect(owner.getByRole("status")).toHaveText(formatSapText(de.TOKENIZER_TOKEN_DELETED_PLURAL, [2]))
  const custom = page.locator("#i18n-token-deletion-override")
  await expect(custom.getByRole("listbox")).toHaveAccessibleName("Custom tokenizer")
  await custom.getByRole("option").focus()
  await expect(custom.getByRole("option")).toBeFocused()
  await custom.getByRole("option").press("Delete")
  await expect(custom.getByRole("status")).toHaveText("Removed 1 selected tokens")
})

test("Card, FileUploader and ViewSettingsDialog translate their actual channels and retain text overrides", async ({ page }) => {
  await page.goto("/?locale=de-DE#/i18n")
  const cards = page.locator("#i18n-card")
  await expect(cards.getByRole("region", { name: `${de.ARIA_ROLEDESCRIPTION_CARD} {0}x`, exact: true })).toBeVisible()
  await expect(cards.getByRole("group", { name: de.ARIA_LABEL_CARD_CONTENT, exact: true })).toBeVisible()
  await expect(cards.locator("[data-slot=card-header]").first().locator('[role="group"]')).toHaveAttribute("aria-roledescription", de.ARIA_ROLEDESCRIPTION_CARD_HEADER)
  await expect(cards.getByRole("region", { name: "Panel Custom card", exact: true })).toBeVisible()
  await expect(cards.getByRole("group", { name: "Panel content", exact: true })).toBeVisible()
  const files = page.locator("#i18n-file")
  await expect(files.locator("input[placeholder]").nth(0)).toHaveAttribute("placeholder", de.FILEUPLOADER_DEFAULT_PLACEHOLDER)
  await expect(files.locator("input[placeholder]").nth(1)).toHaveAttribute("placeholder", de.FILEUPLOADER_DEFAULT_MULTIPLE_PLACEHOLDER)
  const input = files.locator('input[aria-label="Required attachment"]')
  await expect.poll(() => input.evaluate((element: HTMLInputElement) => element.validationMessage)).toBe(de.FILEUPLOAER_VALUE_MISSING)
  await input.setInputFiles({ name: "proof.txt", mimeType: "text/plain", buffer: Buffer.from("proof") })
  await expect.poll(() => input.evaluate((element: HTMLInputElement) => element.validationMessage)).toBe("")
  await expect.poll(() => files.locator('input[aria-label="Custom attachment"]').evaluate((element: HTMLInputElement) => element.validationMessage)).toBe("Please attach a document")
  const owner = page.locator("#i18n-vsd")
  await owner.getByRole("button", { name: "Open localized view settings", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: de.VSD_DIALOG_TITLE_SORT, exact: true })
  await expect(dialog.getByRole("listitem")).toHaveAttribute("aria-label", formatSapText(de.VSD_FILTER_ITEM_LABEL_TEXT, ["Shipping", 1]))
  await dialog.getByRole("button", { name: de.VSD_RESET_BUTTON, exact: true }).click()
  await expect(dialog.getByRole("status")).toHaveText(de.VSD_RESET_BUTTON_ACTION)
  await dialog.getByRole("button", { name: de.VSD_CANCEL_BUTTON, exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await owner.getByRole("button", { name: "Open custom view settings", exact: true }).click()
  await page.getByRole("dialog").getByRole("button", { name: de.VSD_RESET_BUTTON, exact: true }).click()
  await expect(page.getByRole("dialog").getByRole("status")).toHaveText("Filters restored")
})

test("editable RangeSlider open numeric tooltip matches its owning native fixture", async ({ browser }) => {
  const shots: Buffer[] = []
  const evidence = ".integration/E5-evidence/range-open"
  mkdirSync(evidence, { recursive: true })
  for (const native of [false, true]) {
    const page = await browser.newPage()
    await page.goto(native ? "/ui5.html?only=slider-editable-range" : "/index.html?fixtures&only=slider-editable-range")
    await page.waitForSelector("html[data-ready=true]")
    const owner = page.locator('[data-fixture="slider-editable-range"]')
    const handle = owner.locator(native ? "ui5-slider-handle[handle-type=Start]" : '[data-handle="start"]')
    await handle.focus()
    await expect(handle).toBeFocused()
    await handle.press("F2")
    const input = owner.locator(native ? "ui5-slider-tooltip[data-sap-ui-start-value] input" : '[data-handle-tooltip="start"] input')
    await expect(input).toBeFocused()
    await expect(input).toHaveValue("0.5")
    await expect(input).toHaveAttribute("type", "number")
    const shot = await owner.screenshot({ animations: "disabled", caret: "hide" })
    shots.push(shot)
    writeFileSync(`${evidence}/${native ? "ui5" : "react"}.png`, shot)
    await page.close()
  }
  const [ours, ui5] = shots.map(shot => PNG.sync.read(shot))
  expect([ours.width, ours.height]).toEqual([ui5.width, ui5.height])
  const diff = new PNG({ width: ours.width, height: ours.height })
  const ratio = pixelmatch(ours.data, ui5.data, diff.data, ours.width, ours.height, { threshold: 0.1 }) / (ours.width * ours.height)
  writeFileSync(`${evidence}/diff.png`, PNG.sync.write(diff))
  writeFileSync(`${evidence}/report.json`, JSON.stringify({ ratio, width: ours.width, height: ours.height }, null, 2))
  expect(ratio).toBeLessThanOrEqual(0.02)
})

test("editable tooltip number keys retain native spinbutton behavior in localized editing", async ({ browser }) => {
  const values: Record<string, number[]> = {}
  for (const mode of ["ui5", "react", "localized"]) {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(mode === "localized" ? "/?locale=de-DE#/i18n" : mode === "ui5" ? "/ui5.html?only=slider-editable-range" : "/?fixtures&only=slider-editable-range")
    const owner = page.locator(mode === "localized" ? "#i18n-range" : '[data-fixture="slider-editable-range"]')
    if (mode === "ui5") await page.waitForSelector("html[data-ready=true]")
    const handle = owner.locator(mode === "ui5" ? "ui5-slider-handle[handle-type=Start]" : '[data-handle="start"]')
    await handle.focus()
    await expect(handle).toBeFocused()
    await handle.press("F2")
    const input = owner.locator(mode === "ui5" ? "ui5-slider-tooltip[data-sap-ui-start-value] input" : '[data-handle-tooltip="start"] input')
    await expect(input).toBeFocused()
    const result: number[] = []
    for (const key of ["ArrowUp", "ArrowDown"]) {
      await input.press(key)
      if (mode !== "ui5") await expect.poll(async () => parseNumber(await input.inputValue(), mode === "localized" ? "de-DE" : "en-US")).toBe(values.ui5[result.length])
      result.push(parseNumber(await input.inputValue(), mode === "localized" ? "de-DE" : "en-US"))
    }
    values[mode] = result
    if (mode === "localized") {
      await input.fill("invalid")
      await input.press("Enter")
      await expect(input).toHaveAttribute("aria-invalid", "true")
      await expect(input).toHaveAttribute("aria-valuenow", "0.5")
      const axe = await new AxeBuilder({ page }).include("#i18n-range").analyze()
      expect(axe.violations).toEqual([])
    }
    await context.close()
  }
  expect(values.react).toEqual(values.ui5)
  expect(values.localized).toEqual(values.ui5)
  writeFileSync(".integration/E5-evidence/oracles/tooltip-number-keys.json", JSON.stringify(values, null, 2))
})

test("real Tokenizer text chooses locale plural categories", async ({ page }) => {
  for (const locale of ["en-US", "ru", "ar-EG"]) {
    await page.goto(`/?locale=${locale}&plurals#/i18n`)
    const owner = page.locator("#i18n-tokens")
    for (const count of [1, 2, 5]) {
      await owner.getByRole("combobox", { name: "Token count" }).selectOption(String(count))
      const category = new Intl.PluralRules(locale).select(count)
      await expect(owner.locator(".fiori-tokenizer__more")).toHaveText(`${count} ${category}`)
    }
  }
})

test("editable Slider commits locale decimals, retains focus and resets invalid values on F2", async ({ page }) => {
  await page.goto("/?locale=de-DE#/i18n")
  const owner = page.locator("#i18n-slider")
  const handle = owner.getByRole("slider")
  await handle.focus()
  await expect(handle).toBeFocused()
  await handle.press("F2")
  const input = owner.locator("input")
  await expect(input).toBeFocused()
  await input.fill("0,75")
  await input.press("Enter")
  await expect(owner.getByTestId("i18n-slider-value")).toHaveText("0.75")
  await expect(input).toBeFocused()
  await input.fill("3,5")
  await input.press("Enter")
  await expect(input).toHaveAttribute("aria-invalid", "true")
  await expect(owner.getByTestId("i18n-slider-value")).toHaveText("0.75")
  await input.press("F2")
  await expect(handle).toBeFocused()
  await expect(owner.locator("input")).not.toBeFocused()
  await handle.press("F2")
  await expect(owner.locator("input")).toHaveValue("0,75")
})

test("RTL slider keys follow the inherited DOM direction", async ({ page }) => {
  await page.goto("/?locale=ar-EG#/i18n")
  const handle = page.locator("#i18n-slider").getByRole("slider")
  await handle.focus()
  await expect(handle).toBeFocused()
  await handle.press("ArrowRight")
  await expect(handle).toHaveAttribute("aria-valuenow", "0.4")
  await handle.press("ArrowLeft")
  await expect(handle).toHaveAttribute("aria-valuenow", "0.5")
})

test("packs regenerate deterministically and contain only audited rendered keys", () => {
  test.setTimeout(30_000)
  const files = () => readdirSync("registry/i18n").sort().map(name => [name, readFileSync(`registry/i18n/${name}`, "utf8")])
  execFileSync(process.execPath, ["scripts/build-i18n-packs.mjs"])
  const before = files()
  execFileSync(process.execPath, ["scripts/build-i18n-packs.mjs"])
  expect(files()).toEqual(before)
  const audit = JSON.parse(readFileSync(".integration/E5-evidence/audit.json", "utf8"))
  const rendered = new Set(audit.audit.flatMap((group: any) => group.rows.filter((row: any) => row.status !== "gap").map((row: any) => row.key)))
  const packs = readdirSync("registry/i18n").filter(name => name.endsWith(".json") && name !== "registry-items.json")
  expect(packs).toHaveLength(48)
  for (const name of packs) for (const key of Object.keys(JSON.parse(readFileSync(`registry/i18n/${name}`, "utf8")))) expect(rendered.has(key), `${name}/${key}`).toBe(true)
})

test("collation follows German and Swedish accent ordering", async ({ page }) => {
  expect(collatorIncludes("Straße", "strasse", "de-DE", true)).toBe(true)
  expect(collatorIncludes("Äland", "a", "de-DE", true)).toBe(true)
  expect(collatorIncludes("Äland", "a", "sv-SE", true)).toBe(false)
  for (const locale of ["de-DE", "sv-SE"]) {
    await page.goto(`/?locale=${locale}#/i18n`)
    const rows = page.locator("#i18n-sort [data-slot=table-row] [data-slot=table-cell]:first-child")
    await expect(rows).toHaveText(locale === "de-DE" ? ["Äland", "Aland", "Zulu"] : ["Aland", "Zulu", "Äland"])
    const select = page.locator("#i18n-collation [data-slot=select-trigger]")
    await select.focus()
    await select.press("a")
    await expect(select).toContainText(locale === "de-DE" ? "Äland" : "Aland")
  }
})

for (const locale of locales) {
  test(`native number and Gregorian date oracle ${locale}`, async ({ page }) => {
    await page.goto(`/ui5.html?locale=${locale}&only=step-input-l10n-${locale}`)
    await page.waitForSelector("html[data-ready=true]")
    const oracle = await page.locator("ui5-step-input").evaluate((host: any) => { const element = host._innerNumberInput; return ({
      display: element.innerInput.value,
      formatted: element.formatter.format(1234.5),
      parsed: element.formatter.parse(element.formatter.format(1234.5)),
      decimal: element.delimiter,
      group: element.groupSeparator,
      typedArabic: ["٢٫٢٥", "١٬٢٣٤٫٥", "2.25", "1,234.5"].map(text => ({ text, value: element.formatter.parse(text) })),
    }) })
    mkdirSync(".integration/E5-evidence/oracles", { recursive: true })
    writeFileSync(`.integration/E5-evidence/oracles/${locale}-number.json`, JSON.stringify(oracle, null, 2))
    expect(oracle.parsed).toBe(1234.5)
    expect(oracle.display).toBe(formatNumber(1.5, locale, { minFractionDigits: 1, maxFractionDigits: 1 }))
    await page.goto(`/ui5.html?locale=${locale}&only=date-picker-empty`)
    await page.waitForSelector("html[data-ready=true]")
    const date = await page.locator("ui5-date-picker").evaluate((element: any) => element.formatValue(new Date(2024, 2, 12)))
    writeFileSync(`.integration/E5-evidence/oracles/${locale}-date.json`, JSON.stringify({ locale, formatPattern: "MMM d, y", date }, null, 2))
    const dateLocale = new Intl.Locale(locale, { calendar: "gregory", numberingSystem: "latn" }).toString()
    expect(date).toBe(formatPickerDate(new Date(2024, 2, 12), "MMM d, y", dateLocale))
  })
}

test("Calendar RTL arrows preserve the pinned native chronological day model", async ({ browser }) => {
  const results: Record<string, string[]> = {}
  for (const [label, url] of [["react", "/index.html?dir=rtl&only=calendar-rtl&fixtures"], ["ui5", "/ui5.html?dir=rtl&only=calendar-rtl"]]) {
    const page = await browser.newPage()
    await page.goto(url)
    await page.waitForSelector("html[data-ready=true]")
    const cell = page.locator('[data-fixture="calendar-rtl"] [role=gridcell][tabindex="0"]')
    await cell.focus()
    await expect(cell).toBeFocused()
    const values = [await cell.innerText()]
    await cell.press("ArrowLeft")
    await expect(cell).toHaveText("11")
    await expect(cell).toBeFocused()
    values.push(await cell.innerText())
    await cell.press("ArrowRight")
    await expect(cell).toHaveText("12")
    values.push(await cell.innerText())
    results[label] = values
    await page.close()
  }
  expect(results.react).toEqual(results.ui5)
  mkdirSync(".integration/E5-evidence/oracles", { recursive: true })
  writeFileSync(".integration/E5-evidence/oracles/calendar-rtl-keys.json", JSON.stringify(results, null, 2))
})

async function rtlShots(page: Page, url: string) {
  await page.goto(url)
  await page.waitForSelector("html[data-ready=true]", { timeout: 30_000 })
  await page.evaluate(() => { document.documentElement.style.direction = "ltr" })
  const cells = await page.locator('[data-fixture$="-rtl"]').evaluateAll(elements => elements.map(element => {
    const r = element.getBoundingClientRect()
    return { id: (element as HTMLElement).dataset.fixture!, x: Math.floor(r.left + scrollX), y: Math.floor(r.top + scrollY), w: Math.ceil(r.right + scrollX) - Math.floor(r.left + scrollX), h: Math.ceil(r.bottom + scrollY) - Math.floor(r.top + scrollY) }
  }))
  const full = PNG.sync.read(await page.screenshot({ fullPage: true, animations: "disabled", caret: "hide" }))
  return new Map(cells.map(cell => {
    const shot = new PNG({ width: cell.w, height: cell.h })
    PNG.bitblt(full, shot, cell.x, cell.y, cell.w, cell.h, 0, 0)
    return [cell.id, shot]
  }))
}

test("every explicit RTL component fixture matches its native UI5 cell", async ({ browser }) => {
  test.setTimeout(120_000)
  const a = await browser.newPage(), b = await browser.newPage()
  const ours = await rtlShots(a, "/index.html?dir=rtl&fixtures")
  const ui5 = await rtlShots(b, "/ui5.html?dir=rtl")
  const evidence = ".integration/E5-evidence/rtl"
  mkdirSync(evidence, { recursive: true })
  const failures: string[] = [], report: Record<string, string | number> = {}
  expect(ui5.size).toBeGreaterThan(60)
  for (const [id, ref] of ui5) {
    const shot = ours.get(id)
    if (!shot || shot.width !== ref.width || shot.height !== ref.height) { failures.push(`${id}: ${shot?.width}x${shot?.height} vs UI5 ${ref.width}x${ref.height}`); report[id] = failures.at(-1)!; continue }
    const diff = new PNG({ width: shot.width, height: shot.height })
    const ratio = pixelmatch(shot.data, ref.data, diff.data, shot.width, shot.height, { threshold: 0.1 }) / (shot.width * shot.height)
    report[id] = ratio
    if (ratio > 0.02) failures.push(`${id}: ${(ratio * 100).toFixed(2)}% pixels differ`)
    writeFileSync(`${evidence}/${id}-ours.png`, PNG.sync.write(shot))
    writeFileSync(`${evidence}/${id}-ui5.png`, PNG.sync.write(ref))
  }
  writeFileSync(`${evidence}/report.json`, JSON.stringify(report, null, 2))
  await Promise.all([a.close(), b.close()])
  expect(failures, failures.join("\n")).toEqual([])
})

for (const locale of locales) for (const theme of ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]) for (const density of ["cozy", "compact"]) {
  test(`localized fixtures ${locale} ${theme} ${density} match UI5`, async ({ browser }) => {
    test.setTimeout(120_000)
    const dir = locale === "ar-EG" ? "rtl" : "ltr"
    const a = await browser.newPage(), b = await browser.newPage()
    const failures: string[] = [], ratios: Record<string, number | string> = {}
    const evidence = `.integration/E5-evidence/localized/${locale}-${theme}-${density}`
    mkdirSync(evidence, { recursive: true })
    for (const component of components) {
      const id = `${component}-l10n-${locale}`
      const query = `?locale=${locale}&theme=${theme}&density=${density}&dir=${dir}&only=${id}`
      await Promise.all([a.goto(`/index.html${query}&fixtures`), b.goto(`/ui5.html${query}`)])
      await Promise.all([a.waitForSelector("html[data-ready=true]"), b.waitForSelector("html[data-ready=true]")])
      const [ours, ui5] = await Promise.all([a.locator(`[data-fixture="${id}"]`).screenshot({ animations: "disabled", caret: "hide" }), b.locator(`[data-fixture="${id}"]`).screenshot({ animations: "disabled", caret: "hide" })])
      writeFileSync(`${evidence}/${component}-ours.png`, ours)
      writeFileSync(`${evidence}/${component}-ui5.png`, ui5)
      const ap = PNG.sync.read(ours), bp = PNG.sync.read(ui5)
      if (ap.width !== bp.width || ap.height !== bp.height) {
        failures.push(`${component}: ${ap.width}x${ap.height} vs UI5 ${bp.width}x${bp.height}`)
        ratios[component] = failures.at(-1)!
        continue
      }
      const diff = new PNG({ width: ap.width, height: ap.height })
      const ratio = pixelmatch(ap.data, bp.data, diff.data, ap.width, ap.height, { threshold: 0.1 }) / (ap.width * ap.height)
      ratios[component] = ratio
      if (ratio > 0.02) failures.push(`${component}: ${(ratio * 100).toFixed(2)}% pixels differ`)
      writeFileSync(`${evidence}/${component}-diff.png`, PNG.sync.write(diff))
    }
    writeFileSync(`${evidence}/report.json`, JSON.stringify(ratios, null, 2))
    await Promise.all([a.close(), b.close()])
    expect(failures, failures.join("\n")).toEqual([])
  })
}

test("nested providers inherit texts and component locale/text props take precedence", async ({ page }) => {
  await page.goto("/?locale=de-DE#/i18n")
  const owner = page.locator("#i18n-precedence")
  await expect(owner.locator("#i18n-inherited")).toHaveValue("1.234,5")
  await expect(owner.locator("#i18n-nested")).toHaveValue("1\u202f234,5")
  await expect(owner.locator("#i18n-locale-prop")).toHaveValue("1,234.5")
  await expect(owner.locator("#i18n-nested").locator("xpath=../..").locator("[data-dir=inc]")).toHaveAttribute("title", "Inherited increase")
  await expect(owner.locator("#i18n-nested").locator("xpath=../..").locator("[data-dir=dec]")).toHaveAttribute("title", "Nested decrease")
  await expect(owner.locator("#i18n-locale-prop").locator("xpath=../..").locator("[data-dir=inc]")).toHaveAttribute("title", "Prop increase")
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr")
})

test("picker required, format and bounds texts reach native input validation without replacing value-state text", async ({ page }) => {
  await page.goto("/?locale=de-DE#/i18n")
  const owner = page.locator("#i18n-validation")
  for (const [id, missing, mismatch, under, over, pattern, value] of [
    ["date", "DATEPICKER_VALUE_MISSING", "DATEPICKER_PATTERN_MISSMATCH", "DATEPICKER_RANGE_UNDERFLOW", "DATEPICKER_RANGE_OVERFLOW", "yyyy-MM-dd", "2024-03-12"],
    ["range", "DATERANGE_VALUE_MISSING", "DATERANGE_PATTERN_MISMATCH", "DATERANGE_UNDERFLOW", "DATERANGE_OVERFLOW", "yyyy-MM-dd", "2024-03-12 - 2024-03-15"],
    ["datetime", "DATETIME_VALUE_MISSING", "DATETIME_PATTERN_MISMATCH", "DATETIME_RANGEUNDERFLOW", "DATETIME_RANGEOVERFLOW", "yyyy-MM-dd HH:mm:ss", "2024-03-12 15:25:40"],
    ["time", "TIMEPICKER_VALUE_MISSING", "TIMEPICKER_PATTERN_MISSMATCH", "", "", "HH:mm:ss", "15:25:40"],
  ]) {
    const input = owner.locator(`#i18n-${id}-validity`)
    await expect.poll(() => input.evaluate((element: HTMLInputElement) => element.validationMessage)).toBe(formatSapText(de[missing], [pattern]))
    await input.fill("invalid")
    await input.press("Enter")
    await expect.poll(() => input.evaluate((element: HTMLInputElement) => element.validationMessage)).toBe(formatSapText(de[mismatch], [pattern]))
    await expect(input.locator("xpath=../..").getByRole("status")).toContainText(de.VALUE_STATE_ERROR)
    if (under) {
      const suffix = id === "datetime" ? " 15:25:40" : ""
      await input.fill(`2024-03-01${suffix}`)
      await input.press("Enter")
      await expect.poll(() => input.evaluate((element: HTMLInputElement) => element.validationMessage)).toBe(formatSapText(de[under], [id === "datetime" ? "2024-03-08 00:00:00" : "2024-03-08"]))
      await input.fill(`2024-03-30${suffix}`)
      await input.press("Enter")
      await expect.poll(() => input.evaluate((element: HTMLInputElement) => element.validationMessage)).toBe(formatSapText(de[over], [id === "datetime" ? "2024-03-25 00:00:00" : "2024-03-25"]))
    }
    await input.fill(value)
    await input.press("Enter")
    await expect.poll(() => input.evaluate((element: HTMLInputElement) => element.validationMessage)).toBe("")
  }
  await expect.poll(() => owner.locator("#i18n-date-validity-override").evaluate((element: HTMLInputElement) => element.validationMessage)).toBe("Use yyyy-MM-dd")
})

for (const locale of ["zh-CN", "ar-EG"]) test(`real DatePicker commits complete month names and accepts locale digits ${locale}`, async ({ page }) => {
  await page.goto(`/?locale=${locale}#/i18n`)
  const input = page.locator("#i18n-date input")
  await input.fill(locale === "ar-EG" ? "٢٠٢٤-٠٣-١٢" : "2024-03-12")
  await input.press("Enter")
  const formatterLocale = new Intl.Locale(locale, { calendar: "gregory", numberingSystem: "latn" }).toString()
  await expect(input).toHaveValue(formatPickerDate(new Date(2024, 2, 12), "MMM d, y", formatterLocale))
  await input.press("Enter")
  await expect(input).not.toHaveAttribute("aria-invalid", "true")
})

test("editable RangeSlider swaps endpoints and input focus like native UI5, and retains valid fractions", async ({ browser }) => {
  const results: Record<string, unknown> = {}
  for (const native of [false, true]) {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(native ? "/ui5.html?only=slider-editable-range" : "/?locale=en-US#/i18n")
    const owner = page.locator(native ? '[data-fixture="slider-editable-range"]' : "#i18n-range")
    if (native) {
      await page.waitForSelector("html[data-ready=true]")
      // Owner fixture config sets showTooltip/editableTooltip before mounting and awaits Render.renderFinished.
      await expect(owner.locator("ui5-range-slider")).toHaveAttribute("editable-tooltip", "")
    }
    const start = owner.locator(native ? "ui5-slider-handle[handle-type=Start]" : '[data-handle="start"]')
    const end = owner.locator(native ? "ui5-slider-handle[handle-type=End]" : '[data-handle="end"]')
    await expect(start).toHaveAttribute("aria-valuenow", "0.5")
    await expect(end).toHaveAttribute("aria-valuenow", "1.5")
    await start.focus()
    await expect(start).toBeFocused()
    if (native) await expect(owner.locator("ui5-slider-tooltip[data-sap-ui-start-value]")).toBeVisible()
    await start.press("F2")
    const input = owner.locator(native ? "ui5-slider-tooltip[data-sap-ui-start-value] input" : '[data-handle-tooltip="start"] input')
    const opposite = owner.locator(native ? "ui5-slider-tooltip[data-sap-ui-end-value] input" : '[data-handle-tooltip="end"] input')
    await expect(input).toBeFocused()
    await input.fill("1.75")
    await input.press("Enter")
    await expect(start).toHaveAttribute("aria-valuenow", "1.5")
    await expect(end).toHaveAttribute("aria-valuenow", "1.75")
    await expect(opposite).toBeFocused()
    await expect(opposite).toHaveValue("1.75")
    await opposite.fill("3.5")
    await opposite.press("Enter")
    await expect(end).toHaveAttribute("aria-valuenow", "1.75")
    await expect(opposite).toHaveAttribute("aria-invalid", "true")
    await opposite.press("F2")
    await expect(end).toBeFocused()
    await end.press("F2")
    await expect(opposite).toBeFocused()
    await expect(opposite).toHaveValue("1.75")
    results[native ? "ui5" : "react"] = { start: await start.getAttribute("aria-valuenow"), end: await end.getAttribute("aria-valuenow"), focusedValue: await opposite.inputValue() }
    if (!native) {
      expect(await opposite.evaluate(element => element.closest('[role="slider"]'))).toBeNull()
      const axe = await new AxeBuilder({ page }).include("#i18n-range").analyze()
      expect(axe.violations).toEqual([])
    }
    await context.close()
  }
  expect(results.react).toEqual(results.ui5)
  writeFileSync(".integration/E5-evidence/oracles/range-tooltip.json", JSON.stringify(results, null, 2))
})
