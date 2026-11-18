import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

import { periodByNumber, periodOf, parseDay, shiftPeriod, toIsoDay, fiscalWeek } from "../fiscal-calendar/fiscal-adapter"
import { variants } from "../fiscal-calendar/fiscal-variants"

// Expected values are copied from the literal period tables in fiscal-variants.ts (the "S/4 answer key"),
// never computed with the adapter under test.

test.describe("adapter vs. period table", () => {
  const cases: [variant: string, date: string, fy: number, period: number, start: string, end: string][] = [
    ["K4", "2025-03-10", 2025, 3, "2025-03-01", "2025-03-31"],
    ["K4", "2025-12-31", 2025, 12, "2025-12-01", "2025-12-31"],
    // V3: January–March belong to the fiscal year that started the previous April.
    ["V3", "2026-02-10", 2025, 11, "2026-02-01", "2026-02-28"],
    ["V3", "2026-04-01", 2026, 1, "2026-04-01", "2026-04-30"],
    // Z445: periods start mid-month and cross calendar years.
    ["Z445", "2024-12-31", 2025, 1, "2024-12-30", "2025-01-26"],
    ["Z445", "2026-03-31", 2026, 4, "2026-03-30", "2026-04-26"],
    ["Z445", "2027-01-02", 2026, 12, "2026-11-23", "2027-01-03"], // 53-week year: P12 has 6 weeks
  ]
  for (const [v, date, fy, period, start, end] of cases) {
    test(`${v} ${date} → ${fy}/${period}`, () => {
      const p = periodOf(variants[v], parseDay(date))!
      expect([p.fiscalYear, p.period, toIsoDay(p.start), toIsoDay(p.end), p.special]).toEqual([fy, period, start, end, false])
    })
  }
  test("special periods are chosen by number and carry the last regular period's dates", () => {
    const p = periodByNumber(variants.V3, 2025, 14)!
    expect([p.period, p.special, toIsoDay(p.start), toIsoDay(p.end)]).toEqual([14, true, "2026-03-01", "2026-03-31"])
    expect(periodByNumber(variants.V3, 2025, 17)).toBeNull()
  })
  test("next period crosses the fiscal year", () => {
    const p = shiftPeriod(variants.Z445, periodOf(variants.Z445, parseDay("2025-12-28"))!, 1)!
    expect([p.fiscalYear, p.period, toIsoDay(p.start)]).toEqual([2026, 1, "2025-12-29"])
  })
  test("fiscal week ≠ calendar week in a 4-4-5 variant", () => {
    // 2026-01-01 is ISO week 1, but fiscal week 1 of FY2026 started on 2025-12-29 — same week here;
    // 2026-12-31 is ISO week 53 but fiscal week 53 of the 53-week FY2026.
    expect(fiscalWeek(variants.Z445, parseDay("2026-01-01"))).toBe(1)
    expect(fiscalWeek(variants.Z445, parseDay("2027-01-03"))).toBe(53)
    expect(fiscalWeek(variants.K4, parseDay("2026-01-01"))).toBeNull()
  })
})

const open = async (page: Page, query: string) => {
  await page.goto(`/spikes/calendar-composition/index.html?${query}`)
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true")
}
const root = (page: Page) => page.locator("#fiscal-calendar")
const cell = (page: Page, d: string) => root(page).locator(`[data-date="${d.replaceAll("-", "")}"]`)
const item = (page: Page, key: string) => root(page).locator(`[data-key="${key}"]`)
const period = (page: Page) => page.getByTestId("fiscal-calendar-period")
const range = async (page: Page, start: string, end: string) => {
  await expect(page.getByTestId("fiscal-calendar-range")).toHaveAttribute("data-start", start)
  await expect(page.getByTestId("fiscal-calendar-range")).toHaveAttribute("data-end", end)
}
test("day click uses activated date, including before the existing range start", async ({ page }) => {
  await open(page, "variant=Z445&date=2026-03-10")
  await cell(page, "2026-03-31").click()
  await expect(period(page)).toHaveText("Z445 · 2026 / 004")
  await range(page, "2026-03-30", "2026-04-26")
  await cell(page, "2026-03-02").click()
  await expect(period(page)).toHaveText("Z445 · 2026 / 003")
  await range(page, "2026-02-23", "2026-03-29")
})
test("Enter and Space select whole periods with one roving cell", async ({ page }) => {
  await open(page, "variant=K4&date=2025-03-10")
  await cell(page, "2025-03-10").focus()
  for (const date of ["2025-03-17", "2025-03-24", "2025-03-31", "2025-04-07"]) {
    await page.keyboard.press("ArrowDown"); await expect(cell(page, date)).toBeFocused()
  }
  await page.keyboard.press("Enter")
  await expect(period(page)).toHaveText("K4 · 2025 / 004")
  await range(page, "2025-04-01", "2025-04-30")
  await page.keyboard.press("ArrowRight"); await expect(cell(page, "2025-04-08")).toBeFocused()
  await page.keyboard.press(" ")
  await expect(page.getByTestId("fiscal-calendar-event")).toContainText('"source":"keyboard"')
  await expect(root(page).locator('[role=gridcell][tabindex="0"]')).toHaveCount(1)
})
test("V3 fiscal labels, variant switching and localized range", async ({ page }) => {
  await open(page, "variant=V3&date=2026-02-10&locale=de-DE&dir=rtl")
  await expect(period(page)).toHaveText("V3 · 2025 / 011")
  await expect(cell(page, "2026-02-10")).toHaveAccessibleName(/10\. Februar 2026.*FY2025 P11/)
  await page.locator("#fiscal-variant").selectOption("Z445")
  await expect(period(page)).toHaveText("Z445 · 2026 / 002")
  await expect(page.getByTestId("fiscal-calendar-range")).toHaveText(new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).formatRange(new Date(2026, 0, 26), new Date(2026, 1, 22)))
})
test("day labels every cell, fiscal week visible and accessible", async ({ page }) => {
  await open(page, "variant=Z445&date=2026-03-10")
  await expect(cell(page, "2026-03-10")).toContainText("P03")
  await expect(cell(page, "2026-03-10")).toHaveAccessibleName(/FY2026 P03/)
  await expect(root(page).getByRole("rowheader", { name: "Fiscal Week 10", exact: true })).toHaveText("10")
})
test("fiscal day and week names use Arabic digits in ar-EG and retain copied day navigation", async ({ page }) => {
  await open(page, "variant=Z445&date=2026-03-10&locale=ar-EG&dir=rtl")
  await expect(cell(page, "2026-03-10")).toHaveAccessibleName(/١٠ P٠٣ FY٢٠٢٦ P٠٣/)
  await expect(root(page).getByRole("rowheader", { name: "Fiscal Week ١٠", exact: true })).toHaveText("١٠")
  await expect(period(page)).toHaveText("Z445 · ٢٠٢٦ / ٠٠٣")
  await cell(page, "2026-03-10").focus()
  await page.keyboard.press("ArrowRight")
  // The copied registry day picker advances on ArrowRight even in RTL. P2 owns that
  // existing parity gap; X0 preserves it. The new keyed item model mirrors keys separately.
  await expect(cell(page, "2026-03-11")).toBeFocused()
})
test("header and PageDown both page by fiscal period across years", async ({ page }) => {
  await open(page, "variant=Z445&date=2025-12-20")
  await root(page).getByRole("button", { name: "Next Fiscal Period" }).click()
  await expect(page.getByTestId("fiscal-heading")).toHaveText("FY2026 P01")
  await expect(cell(page, "2025-12-29")).toBeFocused()
  await page.keyboard.press("PageDown")
  await expect(cell(page, "2026-01-26")).toBeFocused()
  await expect(page.getByTestId("fiscal-heading")).toHaveText("FY2026 P02")
})
test("period grid special items keep distinct identity and accessible names", async ({ page }) => {
  await open(page, "mode=period&variant=V3&date=2026-03-15")
  await expect(root(page).getByRole("grid", { name: "Fiscal periods" })).toHaveCount(1)
  await expect(root(page).getByRole("gridcell")).toHaveCount(16)
  await expect(root(page).getByRole("row").first()).toHaveClass(/fiscal-row/)
  for (const n of [13, 14, 15, 16]) {
    await expect(item(page, `2025-${n}`)).toHaveAccessibleName(`FY2025 P${n} Special period`)
    await item(page, `2025-${n}`).click()
    await expect(period(page)).toHaveText(`V3 · 2025 / 0${n} (Special period)`)
    await expect(item(page, `2025-${n}`)).toHaveAttribute("aria-selected", "true")
    await expect(item(page, `2025-${n}`)).toHaveAttribute("tabindex", "0")
    await expect(item(page, `2025-${n}`)).toBeFocused()
    await range(page, "2026-03-01", "2026-03-31")
    await expect(page.getByTestId("fiscal-calendar-event")).toContainText(`"period":${n}`)
  }
})
test("period keyboard arrows, row/page edges, Enter, Space and announcement", async ({ page }) => {
  await open(page, "mode=period&variant=Z445&date=2026-03-10")
  await item(page, "2026-3").focus()
  for (const [key, id] of [["ArrowRight", "2026-4"], ["ArrowDown", "2026-8"], ["Home", "2026-5"], ["End", "2026-8"], ["Control+Home", "2026-1"], ["Control+End", "2026-16"]]) {
    await page.keyboard.press(key); await expect(item(page, id)).toBeFocused()
  }
  await page.keyboard.press("Enter")
  await expect(item(page, "2026-16")).toHaveAttribute("aria-selected", "true")
  await expect(root(page).getByRole("status")).toHaveText("FY2026 P16 Special period Selected")
  await page.keyboard.press("ArrowLeft"); await expect(item(page, "2026-15")).toBeFocused()
  await page.keyboard.press(" ")
  await expect(period(page)).toHaveText("Z445 · 2026 / 015 (Special period)")
  await expect(root(page).locator('[role=gridcell][tabindex="0"]')).toHaveCount(1)
})
test("period header and keyboard page by fiscal year, bounded by the table", async ({ page }) => {
  await open(page, "mode=period&variant=Z445&date=2025-03-10")
  await root(page).getByRole("button", { name: "Next Fiscal Year" }).click()
  await expect(page.getByTestId("fiscal-heading")).toHaveText("Fiscal year 2026")
  await expect(item(page, "2026-3")).toBeFocused()
  await page.keyboard.press("PageDown")
  await expect(page.getByTestId("fiscal-heading")).toHaveText("Fiscal year 2026")
  await expect(root(page).getByRole("button", { name: "Next Fiscal Year" })).toHaveAttribute("aria-disabled", "true")
  await page.keyboard.press("PageUp")
  await expect(item(page, "2025-3")).toBeFocused()
})
test("period RTL reverses horizontal movement; locale names remain intact", async ({ page }) => {
  await open(page, "mode=period&variant=Z445&date=2026-03-10&dir=rtl&locale=de-DE")
  await item(page, "2026-3").focus()
  await page.keyboard.press("ArrowRight"); await expect(item(page, "2026-2")).toBeFocused()
  await page.keyboard.press("ArrowLeft"); await expect(item(page, "2026-3")).toBeFocused()
  await expect(item(page, "2026-3")).toHaveAccessibleName("FY2026 P03")
})
for (const theme of ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]) for (const mode of ["day", "period"]) {
  test(`axe with no exclusions: ${mode}/${theme}`, async ({ page }) => {
    await open(page, `mode=${mode}&variant=Z445&date=2026-03-10&theme=${theme}`)
    expect((await new AxeBuilder({ page }).include("#fiscal-consumer").analyze()).violations).toEqual([])
  })
}
