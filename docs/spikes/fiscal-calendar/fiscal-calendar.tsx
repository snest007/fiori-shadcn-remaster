// SPIKE (not a registry item): a fiscal-period calendar built ONLY on Calendar's public API, without
// touching registry/ui/calendar.tsx. Each "GAP" comment marks something the consumer wanted but could not
// do through today's props — the input for card H6 (and for a separate FiscalPeriodPicker card).
import * as React from "react"

import { Calendar, CalendarLegend, CalendarLegendItem, type SpecialDate } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { SegmentedButton, SegmentedButtonItem } from "@/components/ui/segmented-button"

import {
  coverage,
  fiscalWeek,
  periodByNumber,
  periodOf,
  periodStartsBetween,
  shiftPeriod,
  toIsoDay,
  type FiscalPeriod,
} from "./fiscal-adapter"
import { variants } from "./fiscal-variants"

export type FiscalCalendarTexts = {
  variant: string
  fiscalYear: string
  period: (fiscalYear: string, period: string) => string
  specialPeriod: string
  periodStart: string
  previousPeriod: string
  nextPeriod: string
  noPeriod: string
  selection: string
  fiscalWeek: (week: number) => string
}

const defaultTexts: FiscalCalendarTexts = {
  variant: "Fiscal year variant",
  fiscalYear: "Fiscal year",
  period: (fy, p) => `${fy} / ${p}`,
  specialPeriod: "Special period",
  periodStart: "Start of period",
  previousPeriod: "Previous period",
  nextPeriod: "Next period",
  noPeriod: "No period selected",
  selection: "Selected period",
  fiscalWeek: (w) => `Fiscal week ${w}`,
}

const pad3 = (n: number) => String(n).padStart(3, "0")

export type FiscalCalendarProps = {
  id?: string
  locale?: string
  defaultVariant?: keyof typeof variants
  /** Initial focused day; defaults to the first day of the table. */
  defaultDate?: Date
  texts?: Partial<FiscalCalendarTexts>
  onPeriodChange?: (period: FiscalPeriod | null) => void
}

export function FiscalCalendar({ id = "fiscal-calendar", locale = "en-US", defaultVariant = "K4", defaultDate, texts: textsProp, onPeriodChange }: FiscalCalendarProps) {
  const texts = { ...defaultTexts, ...textsProp }
  const [variantId, setVariantId] = React.useState<string>(defaultVariant)
  const variant = variants[variantId]
  const { min, max } = coverage(variant)
  const [period, setPeriodState] = React.useState<FiscalPeriod | null>(() => periodOf(variant, defaultDate ?? min))
  const [focused, setFocused] = React.useState<Date>(defaultDate ?? period?.start ?? min)

  const setPeriod = (p: FiscalPeriod | null) => {
    setPeriodState(p)
    onPeriodChange?.(p)
  }

  // Selecting a day selects its whole regular period. Works today: range mode + controlled selectedDates.
  // Calendar shows [start, end] as a range and announces "First/Last date of range" on the ends.
  const selectFromDates = (dates: Date[]) => {
    // While a full period is selected ([start, end]), Calendar's range mode restarts with [clicked] on the
    // next click / Enter / Space, so the last entry is the day the user chose.
    // GAP: this leans on range-mode internals. There is no "day activated" callback and no way to tell
    // Calendar "a click selects this whole span" — a selection-expansion hook (or getDayProps onClick) would.
    const clicked = dates[dates.length - 1]
    const p = clicked ? periodOf(variant, clicked) : null
    setPeriod(p)
    if (clicked) setFocused(clicked)
  }

  // Period boundaries via specialDates: the only per-day visual hook today (a coloured bar under the day).
  // GAP: no way to put "P03" or a fiscal-week number in the cell — renderDay / week-number override needed.
  // GAP: special-day bar colours are legend Type01…Type20; a boundary *line* or tinted period band is not possible.
  const first = new Date(focused.getFullYear(), focused.getMonth() - 1, 1)
  const last = new Date(focused.getFullYear(), focused.getMonth() + 2, 0)
  const specialDates: SpecialDate[] = periodStartsBetween(variant, first, last).map((p) => ({
    date: p.start,
    type: "Type01",
    // tooltip is also appended to the cell's aria-label by Calendar — the one place we can inject text.
    tooltip: `${texts.periodStart} ${texts.period(String(p.fiscalYear), pad3(p.period))}`,
  }))

  const selectedDates = period ? [period.start, period.end] : []
  const step = (delta: number) => {
    const next = period ? shiftPeriod(variant, period, delta) : periodOf(variant, focused)
    if (!next) return
    setPeriod(next)
    setFocused(next.start)
  }
  const chooseSpecial = (n: number) => {
    const fy = period?.fiscalYear ?? periodOf(variant, focused)?.fiscalYear
    if (fy === undefined) return
    const p = periodByNumber(variant, fy, n)
    setPeriod(p)
    // A special period has no days of its own: show the last regular period it subdivides.
    if (p) setFocused(p.start)
  }
  const fw = fiscalWeek(variant, focused)
  const label = period ? texts.period(String(period.fiscalYear), pad3(period.period)) : texts.noPeriod

  return (
    <div id={id} data-slot="fiscal-calendar" data-variant={variantId} className="flex flex-wrap items-start gap-6">
      <div className="grid gap-3">
        <SegmentedButton
          id={`${id}-variant`}
          aria-label={texts.variant}
          value={variantId}
          onValueChange={(v) => {
            const next = variants[v]
            setVariantId(v)
            const p = periodOf(next, focused) ?? periodOf(next, coverage(next).min)
            setPeriod(p)
            if (p && !periodOf(next, focused)) setFocused(p.start)
          }}
        >
          {Object.values(variants).map((v) => (
            <SegmentedButtonItem key={v.id} value={v.id}>
              {v.name}
            </SegmentedButtonItem>
          ))}
        </SegmentedButton>
        <Calendar
          id={`${id}-calendar`}
          aria-label={texts.fiscalYear}
          locale={locale}
          selectionMode="range"
          selectedDates={selectedDates}
          onSelectedDatesChange={selectFromDates}
          focusedDate={focused}
          onFocusedDateChange={setFocused}
          minDate={min}
          maxDate={max}
          specialDates={specialDates}
          // GAP: the visible week column is ISO/locale calendar weeks; for Z445 it should show fiscal weeks
          // (1…53). We can only hide it, not replace it.
          hideWeekNumbers={variant.weekBased}
          legend={
            <CalendarLegend hideWorkingDay hideNonWorkingDay>
              <CalendarLegendItem type="Type01" text={texts.periodStart} />
            </CalendarLegend>
          }
        />
      </div>

      <div className="grid max-w-xs content-start gap-3 text-(length:--sapFontSize) text-(--sapTextColor)">
        <div role="status" aria-live="polite" id={`${id}-selection`}>
          <div className="text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">{texts.selection}</div>
          <div data-testid={`${id}-period`} className="font-(family-name:--sapFontBoldFamily)">
            {variantId} · {label}
            {period?.special && ` (${texts.specialPeriod})`}
          </div>
          {period && (
            <div data-testid={`${id}-range`} data-start={toIsoDay(period.start)} data-end={toIsoDay(period.end)}>
              {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).formatRange(period.start, period.end)}
            </div>
          )}
          {fw !== null && <div data-testid={`${id}-week`}>{texts.fiscalWeek(fw)}</div>}
        </div>

        <div className="flex gap-2">
          {/* GAP: Calendar's header arrows and PageUp/PageDown page by Gregorian month. Fiscal paging needs our
              own controls outside the calendar; 4-4-5 periods that start mid-month can't be paged from the header. */}
          <Button id={`${id}-prev`} onClick={() => step(-1)}>
            {texts.previousPeriod}
          </Button>
          <Button id={`${id}-next`} onClick={() => step(1)}>
            {texts.nextPeriod}
          </Button>
        </div>

        {/* Special periods have no days of their own (they subdivide the last regular period), so they can't
            live in a day grid at all. Out of scope for Calendar; a FiscalPeriodPicker would own them. */}
        <div role="group" aria-label={texts.specialPeriod} className="flex flex-wrap gap-2">
          {Array.from({ length: variant.specialPeriods }, (_, i) => variant.regularPeriods + 1 + i).map((n) => (
            <Button
              key={n}
              id={`${id}-special-${n}`}
              variant={period?.period === n ? "emphasized" : "default"}
              aria-pressed={period?.period === n}
              onClick={() => chooseSpecial(n)}
            >
              {pad3(n)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
