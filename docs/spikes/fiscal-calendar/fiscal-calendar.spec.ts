import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

import { periodByNumber, periodOf, parseDay, shiftPeriod, toIsoDay, fiscalWeek } from "./fiscal-adapter"
import { variants } from "./fiscal-variants"

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
  await page.goto(`/spikes/fiscal-calendar/index.html?${query}`)
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true")
}
const root = (page: Page) => page.locator("#fiscal-calendar")
const cell = (page: Page, d: string) => root(page).locator(`[data-date="${d.replaceAll("-", "")}"]`)
const periodText = (page: Page) => page.getByTestId("fiscal-calendar-period")
const rangeText = (page: Page) => page.getByTestId("fiscal-calendar-range")
const expectRange = async (page: Page, start: string, end: string) => {
  await expect(rangeText(page)).toHaveAttribute("data-start", start)
  await expect(rangeText(page)).toHaveAttribute("data-end", end)
}
const selectedEnds = (page: Page) =>
  root(page).locator('[role=gridcell][aria-selected="true"]').evaluateAll((cells) => [cells[0]?.getAttribute("data-date"), cells.at(-1)?.getAttribute("data-date")])

test.describe("FiscalCalendar on Calendar's public API", () => {
  test("clicking a day selects its whole period (Z445, mid-month start)", async ({ page }) => {
    await open(page, "variant=Z445&date=2026-03-10")
    await expect(periodText(page)).toHaveText("Z445 · 2026 / 003")
    await cell(page, "2026-03-31").click()
    await expect(periodText(page)).toHaveText("Z445 · 2026 / 004")
    await expectRange(page, "2026-03-30", "2026-04-26")
    // Calendar renders the range ends it was given: start in this month, end beyond the visible grid.
    await expect(cell(page, "2026-03-30")).toHaveAttribute("aria-selected", "true")
    await expect(cell(page, "2026-03-29")).toHaveAttribute("aria-selected", "false")
  })

  test("Enter / Space on a focused day select its period; focus stays a single roving gridcell", async ({ page }) => {
    await open(page, "variant=K4&date=2025-03-10")
    await cell(page, "2025-03-10").focus()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    await expect(cell(page, "2025-03-31")).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(cell(page, "2025-04-07")).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(periodText(page)).toHaveText("K4 · 2025 / 004")
    await expect.poll(() => selectedEnds(page)).toEqual(["20250401", "20250430"])
    await expect(root(page).locator('[role=gridcell][tabindex="0"]')).toHaveCount(1)
    await page.keyboard.press("ArrowRight")
    await expect(cell(page, "2025-04-08")).toBeFocused()
    await page.keyboard.press(" ")
    await expect(periodText(page)).toHaveText("K4 · 2025 / 004")
  })

  test("V3 labels January–March with the previous fiscal year", async ({ page }) => {
    await open(page, "variant=V3&date=2026-02-10")
    await expect(periodText(page)).toHaveText("V3 · 2025 / 011")
    // Other-month cells are aria-disabled (UI5 parity), so page to March first.
    await root(page).getByRole("button", { name: "Next Month" }).click()
    await cell(page, "2026-03-02").click()
    await expect(periodText(page)).toHaveText("V3 · 2025 / 012")
  })

  test("period paging lives outside the calendar and crosses fiscal years", async ({ page }) => {
    await open(page, "variant=Z445&date=2025-12-20")
    await expect(periodText(page)).toHaveText("Z445 · 2025 / 012")
    await page.locator("#fiscal-calendar-next").click()
    await expect(periodText(page)).toHaveText("Z445 · 2026 / 001")
    await expectRange(page, "2025-12-29", "2026-01-25")
    // The calendar follows: it shows the month of the new period's first day.
    await expect(cell(page, "2025-12-29")).toHaveAttribute("aria-selected", "true")
  })

  test("special periods are explicit choices that keep their identity", async ({ page }) => {
    await open(page, "variant=V3&date=2026-03-15")
    await page.locator("#fiscal-calendar-special-14").click()
    await expect(periodText(page)).toHaveText("V3 · 2025 / 014 (Special period)")
    await expectRange(page, "2026-03-01", "2026-03-31")
    await expect(page.locator("#fiscal-calendar-special-14")).toHaveAttribute("aria-pressed", "true")
    await expect(page.getByTestId("fiscal-calendar-event")).toContainText('"period":14')
    // The calendar moves to the days the special period shares with P12, even from another month.
    await page.locator("#fiscal-calendar-prev").click()
    await expect(root(page).locator('[data-slot="calendar-month-button"]')).toHaveText("February")
    await page.locator("#fiscal-calendar-special-15").click()
    await expect(root(page).locator('[data-slot="calendar-month-button"]')).toHaveText("March")
    await expect(cell(page, "2026-03-01")).toHaveAttribute("aria-selected", "true")
  })

  test("switching variant re-derives the period of the focused day", async ({ page }) => {
    await open(page, "variant=K4&date=2026-02-10")
    await expect(periodText(page)).toHaveText("K4 · 2026 / 002")
    await page.getByRole("option", { name: /V3/ }).click()
    await expect(periodText(page)).toHaveText("V3 · 2025 / 011")
    await page.getByRole("option", { name: /Z445/ }).click()
    await expect(periodText(page)).toHaveText("Z445 · 2026 / 002")
    await expectRange(page, "2026-01-26", "2026-02-22")
  })

  test("screen reader name carries fiscal info only on boundary days (gap: no per-day label hook)", async ({ page }) => {
    await open(page, "variant=Z445&date=2026-03-10")
    await expect(cell(page, "2026-03-30")).toHaveAccessibleName(/Start of period 2026 \/ 004/)
    // GAP (H6 getDayLabel): an ordinary day says nothing about its period.
    await expect(cell(page, "2026-03-10")).not.toHaveAccessibleName(/2026 \/ 003/)
  })

  test("locale and RTL: Calendar localizes, the period logic is unchanged", async ({ page }) => {
    await open(page, "variant=Z445&date=2026-03-10&locale=de-DE&dir=rtl")
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
    await expect(root(page).locator('[data-slot="calendar-month-button"]')).toHaveText("März")
    await cell(page, "2026-03-31").click()
    await expect(periodText(page)).toHaveText("Z445 · 2026 / 004")
    await expect(cell(page, "2026-03-30")).toHaveAccessibleName(/30\. März 2026/)
    // Visible range goes through Intl (rule 10), so it reads correctly in RTL.
    await expect(rangeText(page)).toHaveText(new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).formatRange(new Date(2026, 2, 30), new Date(2026, 3, 26)))
  })

  for (const theme of ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]) {
    test(`axe clean (${theme})`, async ({ page }) => {
      await open(page, `variant=Z445&date=2026-03-10&theme=${theme}`)
      const result = await new AxeBuilder({ page }).include("#fiscal-calendar").disableRules(theme === "sap_horizon" ? [] : ["color-contrast"]).analyze()
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([])
    })
  }
})
