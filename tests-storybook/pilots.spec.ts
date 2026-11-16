import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { axeViolations, waitForStoryFinished } from "./accessibility"
import { attachKnown, classifyViolations } from "./known-issues"

interface Entry { id: string; type: string; title: string; name: string }
const entries = Object.values(JSON.parse(readFileSync(new URL("../storybook-static/index.json", import.meta.url), "utf8")).entries) as Entry[]
const pilots = ["button", "input", "select", "calendar", "data-table", "dialog"]
const playground = (name: string) => entries.find((entry) => entry.type === "story" && entry.name === "Playground" && entry.id.endsWith(`-${name}--playground`))!
const docsId = (name: string) => playground(name).id.replace(/--playground$/, "--docs")
const appearance = (node: Element) => {
  const owner = node.closest(".fiori-field") ?? node
  const normal = getComputedStyle(owner), after = getComputedStyle(owner, "::after")
  const outline = normal.outlineStyle !== "none" && Number.parseFloat(normal.outlineWidth) > 0
  const pseudo = !["none", "normal"].includes(after.content) && after.display !== "none" && after.visibility !== "hidden"
    && after.borderTopStyle !== "none" && Number.parseFloat(after.borderTopWidth) > 0
  return { painted: outline || pseudo, focusVisible: node.matches(":focus-visible"), html: node.outerHTML, ownerHtml: owner.outerHTML,
    outline: { style: normal.outlineStyle, width: normal.outlineWidth },
    after: { content: after.content, display: after.display, style: after.borderTopStyle, width: after.borderTopWidth, color: after.borderTopColor } }
}

for (const name of pilots) {
  test(`${name} docs explains Accessibility and current Localization defaults`, async ({ page }) => {
    await page.goto(`/iframe.html?viewMode=docs&id=${docsId(name)}`)
    const accessibility = page.getByRole("region", { name: "Accessibility", exact: true })
    await expect(accessibility.getByRole("heading", { name: "Accessibility", exact: true })).toBeVisible()
    expect(await accessibility.getByRole("listitem").count()).toBeGreaterThan(0)
    await expect(page.getByRole("region", { name: "Localization", exact: true })).toBeVisible()
    if (name !== "button") {
      await expect(page.getByRole("region", { name: "Localization", exact: true }).getByRole("table")).toBeVisible()
      await expect(page.getByRole("region", { name: "Localization", exact: true })).toContainText("UI5 key")
    }
    if (name === "calendar") {
      const rangeText = page.getByRole("region", { name: "Localization", exact: true }).getByRole("row").filter({ hasText: "labels.yearRangeButton" })
      await expect(rangeText).toContainText("CALENDAR_HEADER_YEAR_RANGE_BUTTON")
      await expect(rangeText).toContainText("Year range from {0} to {1}")
    }
  })

  test(`${name} every select and radio Control choice keeps the Playground accessible`, async ({ page }, testInfo) => {
    test.setTimeout(120_000)
    await page.goto(`/iframe.html?viewMode=docs&id=${docsId(name)}`)
    const canvas = page.locator(`[data-fiori-primary] [data-fiori-story="${playground(name).id}"]`)
    await expect(canvas).toBeVisible()
    const rows = page.locator("[data-fiori-controls] tbody tr")
    await expect(rows.first()).toBeVisible()
    const matrix: { prop: string; choice: unknown; violations: Awaited<ReturnType<typeof axeViolations>> }[] = []
    const known: { prop: string; choice: unknown; violations: Awaited<ReturnType<typeof axeViolations>> }[] = []
    const unexpected: typeof known = []
    const auditChoice = async (prop: string, choice: unknown) => {
      const audit = await classifyViolations(page, await axeViolations(page, "sap_horizon", "[data-fiori-primary]"), {
        story: playground(name).id, theme: "sap_horizon", primary: true, control: { prop, choice },
      })
      matrix.push({ prop, choice: choice ?? "unset", violations: audit.raw })
      if (audit.known.length) known.push({ prop, choice, violations: audit.known })
      if (audit.unexpected.length) unexpected.push({ prop, choice, violations: audit.unexpected })
    }
    const readArg = (prop: string) => canvas.getAttribute("data-fiori-args").then((value) => JSON.parse(value ?? "{}")[prop])
    for (let index = 0; index < await rows.count(); index++) {
      const row = rows.nth(index)
      const prop = (await row.locator("td").first().innerText()).replace(/\*/g, "").trim()
      for (const select of await row.locator("select").all()) {
        const options = await select.locator("option").evaluateAll((options) => options.map((option) => ({ value: (option as HTMLOptionElement).value, label: option.textContent?.trim(), disabled: (option as HTMLOptionElement).disabled })))
        for (const option of options.filter((option) => !option.disabled)) {
          await select.selectOption(option.value)
          let expected: unknown = option.value
          try { expected = JSON.parse(option.value) } catch { /* Storybook also uses plain string option values. */ }
          if (option.label === "-" || option.label === "Choose option..." || ["undefined", "__storybook_unset__"].includes(option.value)) expected = undefined
          await expect.poll(() => readArg(prop)).toEqual(expected)
          await auditChoice(prop, expected)
        }
      }
      for (const radio of await row.getByRole("radio").all()) {
        const raw = await radio.getAttribute("value")
        let expected: unknown = raw
        try { expected = JSON.parse(raw ?? "null") } catch { /* Plain string radio values are also valid. */ }
        await radio.check()
        await expect(radio).toBeChecked()
        await expect.poll(() => readArg(prop)).toEqual(expected)
        await auditChoice(prop, expected)
      }
    }
    expect(matrix.length, "Controls must expose the pilot's union props").toBeGreaterThan(0)
    await testInfo.attach("controls-accessibility-matrix.json", { body: JSON.stringify(matrix, null, 2), contentType: "application/json" })
    if (known.length) await attachKnown(testInfo, "controls-accessibility-matrix", { story: playground(name).id, theme: "sap_horizon", entries: known })
    expect(unexpected).toEqual([])
  })

  test(`${name} Tab reaches the Playground and focus is visible only in keyboard modality`, async ({ page }, testInfo) => {
    await page.goto(`/iframe.html?viewMode=story&id=${playground(name).id}`)
    const target = name === "input" ? page.getByRole("textbox", { name: "Company", exact: true })
      : name === "select" ? page.getByRole("combobox", { name: "Country" })
      : name === "data-table" ? page.getByRole("row").filter({ hasText: "Notebook Basic 15" })
      : name === "calendar" ? page.getByRole("gridcell", { selected: true })
      : page.getByRole("button").first()
    await expect(target).toBeVisible()
    // Inspect real pointerdown before mouseup activates overlay triggers. Some
    // controls intentionally defer focus to click; text inputs may match Chrome's
    // :focus-visible heuristic on pointer focus, so inspect the painted owning CSS.
    await target.hover()
    await page.mouse.down()
    if (["button", "input", "dialog"].includes(name)) await expect(target).toBeFocused()
    const pointer = await target.evaluate(appearance)
    const knownFocus: unknown[] = []
    if (name === "input" && pointer.painted) {
      // component defect, fixed by E4 — see docs/plan/handoff/S0-a11y-candidates
      await expect(target).toBeFocused()
      await expect(target).toHaveAccessibleName("Company")
      expect(await target.evaluate((node) => node instanceof HTMLInputElement
        && node.closest('[data-fiori-story="forms-input--playground"]') !== null
        && node.closest('[data-slot="input"]') === document.querySelector('#storybook-root [data-slot="input"].fiori-field'))).toBe(true)
      knownFocus.push({ story: "forms-input--playground", phase: "pointer", target: "Company native input", appearance: pointer })
    } else expect.soft(pointer.painted, "Pointer focus must not paint the keyboard indicator").toBe(false)
    await page.mouse.up()
    if (name === "dialog" || name === "select") {
      await expect(page.locator(name === "dialog" ? '[data-slot="dialog-content"]' : '[data-slot="select-content"]')).toBeVisible()
      await page.keyboard.press("Escape")
      await expect(page.locator('[data-slot="dialog-content"], [data-slot="select-content"]')).toHaveCount(0)
      // Radix FocusScope defers AUTOFOCUS_ON_UNMOUNT; Storybook's args
      // rerender can also outlive the portal. Await both before this test
      // starts its independent keyboard-modality phase (INTEGRATION cause 4).
      await waitForStoryFinished(page)
      await expect(target).toHaveAttribute("aria-expanded", "false")
      await expect(target).toBeFocused()
    }
    await page.evaluate(() => {
      const before = document.createElement("button")
      before.textContent = "Before the example"
      before.id = "storybook-before-example"
      document.querySelector("#storybook-root")!.prepend(before)
      before.focus()
    })
    await expect(page.locator("#storybook-before-example")).toBeFocused()
    await page.keyboard.press("Tab")
    await expect.poll(() => page.evaluate(() => Boolean(document.activeElement?.closest(".fiori-story-canvas")))).toBe(true)
    const keyboard = await page.locator("*:focus").evaluate(appearance)
    expect.soft(keyboard.focusVisible).toBe(true)
    if (name === "data-table" && !keyboard.painted) {
      // component defect, fixed by E4 — see docs/plan/handoff/S0-a11y-candidates
      await expect(target).toBeFocused()
      await expect(target).toHaveAttribute("aria-rowindex", "2")
      await expect(target).toHaveAttribute("data-pointer-focus", "")
      expect(await target.evaluate((node) => node === document.querySelector('[data-fiori-story="data-data-table--playground"] [data-slot="table-row"]')
        && node.getAttribute("role") === "row" && node.textContent?.includes("Notebook Basic 15"))).toBe(true)
      knownFocus.push({ story: "data-data-table--playground", phase: "keyboard-reentry", target: "Notebook Basic 15 row, aria-rowindex=2", appearance: keyboard })
    } else expect.soft(keyboard.painted, "Tab must paint the keyboard indicator").toBe(true)
    await testInfo.attach("focus-modality.json", { body: JSON.stringify({ pointer, keyboard }, null, 2), contentType: "application/json" })
    if (knownFocus.length) await attachKnown(testInfo, "focus-modality", knownFocus)
  })
}

test("custom DataTable price cells preserve owned gridcell roles and indices", async ({ page }) => {
  const entry = entries.find((entry) => entry.title === playground("data-table").title && entry.name === "Playground")!
  await page.goto(`/iframe.html?id=${entry.id}&viewMode=story`)
  const row = page.getByRole("row").filter({ hasText: "Notebook Basic 15" })
  const price = row.getByRole("gridcell").last()
  await expect(price).toHaveAttribute("aria-colindex", "3")
  await expect(row).toHaveAttribute("aria-rowindex", "2")
  const expected = await page.evaluate(() => new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" }).format(956))
  await expect(price).toHaveText(expected)
})

test("Calendar RTL keeps UI5 2.28 horizontal day navigation", async ({ page }) => {
  const entry = entries.find((entry) => entry.title === playground("calendar").title && entry.name === "RTL")!
  await page.goto(`/iframe.html?id=${entry.id}&viewMode=story`)
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
  const day = page.getByRole("gridcell", { selected: true })
  await day.focus()
  await expect(day).toBeFocused()
  await page.keyboard.press("ArrowRight")
  // UI5 2.28 DayPicker.js:_onkeydown calls _modifyTimestampBy(1, "day", false)
  // for ArrowRight even in RTL. Its day path does not use ItemNavigation's mirroring.
  // Settled live native comparison: March 12 → 13 in both Morning and HCB.
  await expect.poll(() => page.evaluate(() => document.activeElement?.textContent?.trim())).toBe("13")
})

test("DataTable RTL mirrors horizontal row and cell navigation", async ({ page }) => {
  const entry = entries.find((entry) => entry.title === playground("data-table").title && entry.name === "RTL")!
  await page.goto(`/iframe.html?id=${entry.id}&viewMode=story`)
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
  const row = page.getByRole("row").filter({ hasText: "Notebook Basic 15" })
  await expect(row).toBeVisible()
  // UI5 Table focus sentinels establish the first row's programmatic tabindex.
  await page.keyboard.press("Tab")
  await expect.poll(() => page.evaluate(() => document.activeElement?.closest('[data-table-grid]') !== null)).toBe(true)
  await expect(row).toBeFocused()
  await page.keyboard.press("ArrowLeft")
  await expect(row.getByRole("gridcell").nth(0)).toBeFocused()
  await page.keyboard.press("ArrowLeft")
  await expect(row.getByRole("gridcell").nth(1)).toBeFocused()
})

test("Select items keep their owned option roles and selected state", async ({ page }) => {
  const entry = entries.find((entry) => entry.title === playground("select").title && entry.name === "Open")!
  await page.goto(`/iframe.html?id=${entry.id}&viewMode=story`)
  const list = page.getByRole("listbox", { name: "Country choices" })
  await expect(list).toBeVisible()
  await expect(list.getByRole("option", { name: "Germany", exact: true })).toHaveAttribute("aria-selected", "true")
  await expect(list.getByRole("option", { name: "France", exact: true })).toHaveAttribute("aria-selected", "false")
})

test("Dialog asChild trigger keeps native button and popup semantics", async ({ page }) => {
  await page.goto(`/iframe.html?id=${playground("dialog").id}&viewMode=story`)
  const trigger = page.getByRole("button", { name: "Edit product" })
  await expect(trigger).toHaveAttribute("aria-haspopup", "dialog")
  await expect(trigger).toHaveAttribute("aria-expanded", "false")
  await trigger.click()
  await expect(page.getByRole("dialog", { name: "Edit product" })).toBeVisible()
  await expect(page.locator('[data-slot="dialog-trigger"]')).toHaveAttribute("aria-expanded", "true")
})
