import * as React from "react"
// React-only business examples: UI5 has no fiscal period/item model, so there is no fiscal pixel oracle.
// Consumer imports ONLY the prototype's public entry. No copied implementation helpers.
import { Calendar, CalendarNavButton, CalendarRow, CalendarCell, useCalendar, type CalendarPartProps } from "./calendar"
import { variants, type FiscalVariant } from "../fiscal-calendar/fiscal-variants"
import { coverage, fiscalWeek, parseDay, periodByNumber, periodOf, shiftPeriod, toIsoDay, type FiscalPeriod } from "../fiscal-calendar/fiscal-adapter"

type FiscalTexts = {
  variant: string; dayCalendar: string;
  previousYear: string; nextYear: string; previousPeriod: string; nextPeriod: string;
  fiscalYear: (year: string) => string; period: (year: string, period: string, special: boolean) => string;
  fiscalWeek: (week: number, locale: string) => string; weekNumber: string; picker: string; special: string
}
// Consumer business text, deliberately not claimed to be UI5 i18n keys. All defaults overridable.
const defaults: FiscalTexts = {
  variant: "Variant", dayCalendar: "Fiscal day calendar",
  previousYear: "Previous Fiscal Year", nextYear: "Next Fiscal Year", previousPeriod: "Previous Fiscal Period", nextPeriod: "Next Fiscal Period",
  fiscalYear: year => `Fiscal year ${year}`, period: (year, period, special) => `FY${year} P${period}${special ? " Special period" : ""}`,
  fiscalWeek: (week, locale) => `Fiscal Week ${number(week, locale)}`, weekNumber: "Fiscal Week", picker: "Fiscal periods", special: "Special period",
}
const FiscalContext = React.createContext<{ variant: FiscalVariant; year: number; mode: "period" | "day"; texts: FiscalTexts } | null>(null)
function useFiscal() { const context = React.useContext(FiscalContext); if (!context) throw new Error("Fiscal provider required"); return context }
const number = (value: number, locale: string, digits = 1) => new Intl.NumberFormat(locale, { useGrouping: false, minimumIntegerDigits: digits }).format(value)
function FiscalHeader() {
  const calendar = useCalendar()
  const { year, variant, mode, texts } = useFiscal()
  const period = periodOf(variant, calendar.focusedDate)
  return <><CalendarNavButton direction={-1} /><div className="fiori-calheader-midcontainer"><span data-testid="fiscal-heading">{mode === "period" ? texts.fiscalYear(number(year, calendar.locale)) : texts.period(number(period?.fiscalYear ?? year, calendar.locale), number(period?.period ?? 1, calendar.locale, 2), false)}</span></div><CalendarNavButton direction={1} /></>
}
function PeriodGrid() {
  const calendar = useCalendar()
  const model = calendar.gridPicker
  if (!model) throw new Error("PeriodGrid requires a picker model")
  const items = model.items
  // Changing row content/layout still uses the protected public row/cell parts. The GridPicker
  // boundary owns the outer grid and its keyboard handlers; no nested interactive grid is created.
  return <>{Array.from({ length: Math.ceil(items.length / model.rowSize) }, (_, r) => <CalendarRow key={r} rowKey={r}>
    {items.slice(r * model.rowSize, (r + 1) * model.rowSize).map((item, i) => <CalendarCell key={item.key} item={item}><span className="fiori-dp-yeartext">P{number(r * model.rowSize + i + 1, calendar.locale, 2)}</span></CalendarCell>)}
  </CalendarRow>)}</>
}
function FiscalDay({ day, defaultContent }: CalendarPartProps) {
  const { variant } = useFiscal()
  if (!day) return defaultContent
  const period = periodOf(variant, day.date)
  return <>{defaultContent}{period && <> <span className="composition-period-label">P{number(period.period, day.locale, 2)}</span></>}</>
}
export function FiscalConsumer({ mode, initialVariant = "Z445", initialDate = parseDay("2026-03-10"), locale = "en-US", texts: overrides }: {
  mode: "period" | "day"; initialVariant?: string; initialDate?: Date; locale?: string; texts?: Partial<FiscalTexts>
}) {
  const [variantId, setVariantId] = React.useState(initialVariant)
  const variant = variants[variantId]
  const texts = { ...defaults, ...overrides }
  const [date, setDate] = React.useState(initialDate)
  const [period, setPeriod] = React.useState<FiscalPeriod | null>(() => periodOf(variant, initialDate))
  const [year, setYear] = React.useState(period?.fiscalYear ?? 2026)
  const [focusedKey, setFocusedKey] = React.useState<string | number>(`${year}-${period?.period ?? 1}`)
  const [event, setEvent] = React.useState("")
  const bounds = coverage(variant)
  const choose = (next: FiscalPeriod, source: string) => { setPeriod(next); setEvent(JSON.stringify({ period: next.period, fiscalYear: next.fiscalYear, source })) }
  const items = Array.from({ length: 16 }, (_, i) => ({
    key: `${year}-${i + 1}`, text: texts.period(number(year, locale), number(i + 1, locale, 2), i >= 12),
    disabled: !periodByNumber(variant, year, i + 1),
  }))
  const page = (from: Date, dir: -1 | 1) => {
    const current = periodOf(variant, from)
    if (!current) return null
    if (mode === "day") return shiftPeriod(variant, current, dir)?.start ?? null
    const next = periodByNumber(variant, current.fiscalYear + dir, Math.min(current.period, 12))
    return next?.start ?? null
  }
  const focusDate = (next: Date) => {
    setDate(next)
    const p = periodOf(variant, next)
    if (p && mode === "period") { setYear(p.fiscalYear); setFocusedKey(`${p.fiscalYear}-${String(focusedKey).split("-").at(-1)}`) }
  }
  return <section id="fiscal-consumer">
    <label htmlFor="fiscal-variant">{texts.variant}</label><select id="fiscal-variant" value={variantId} onChange={e => {
      const id = e.target.value; setVariantId(id)
      const p = periodOf(variants[id], date); setPeriod(p)
      if (p) { setYear(p.fiscalYear); setFocusedKey(`${p.fiscalYear}-${p.period}`) }
    }}>{Object.keys(variants).map(id => <option key={id} value={id}>{id}</option>)}</select>
    <FiscalContext.Provider value={{ variant, year, mode, texts }}>
      <Calendar id="fiscal-calendar" aria-label={mode === "period" ? texts.picker : texts.dayCalendar} locale={locale}
        selectionMode="range" selectedDates={period ? [period.start, period.end] : []} focusedDate={date} onFocusedDateChange={focusDate} minDate={bounds.min} maxDate={bounds.max}
        classNames={{ Row: "fiscal-row" }}
        components={{ Header: FiscalHeader, ...(mode === "period" ? { GridPicker: PeriodGrid } : { DayCell: FiscalDay }) }}
        labels={{ previousMonth: mode === "period" ? texts.previousYear : texts.previousPeriod, nextMonth: mode === "period" ? texts.nextYear : texts.nextPeriod, weekNumber: texts.weekNumber, calendarWeek: week => texts.fiscalWeek(week, locale) }}
        getPage={page}
        getDayLabel={day => { const p = periodOf(variant, day.date); return p ? `${number(day.date.getDate(), locale)} P${number(p.period, locale, 2)} ${texts.period(number(p.fiscalYear, locale), number(p.period, locale, 2), false)}` : "" }}
        getWeekNumber={week => fiscalWeek(variant, week.weekStart) ?? week.defaultNumber}
        onSelectedDatesChange={(_dates, detail) => { const p = periodOf(variant, detail.date); if (p) choose(p, detail.source) }}
        itemPicker={mode === "period" ? { items, rowSize: 4, label: texts.picker, focusedKey, onFocusedKeyChange: setFocusedKey,
          selectedKeys: period && period.fiscalYear === year ? [`${year}-${period.period}`] : [],
          onSelectedKeysChange: (_keys, detail) => { const n = Number(String(detail.item.key).split("-").at(-1)); const p = periodByNumber(variant, year, n); if (p) choose(p, detail.source) },
        } : undefined}
      />
    </FiscalContext.Provider>
    <p data-testid="fiscal-calendar-period">{period ? `${variant.id} · ${number(period.fiscalYear, locale)} / ${number(period.period, locale, 3)}${period.special ? ` (${texts.special})` : ""}` : ""}</p>
    <p data-testid="fiscal-calendar-range" data-start={period ? toIsoDay(period.start) : ""} data-end={period ? toIsoDay(period.end) : ""}>{period ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).formatRange(period.start, period.end) : ""}</p>
    <pre data-testid="fiscal-calendar-event">{event}</pre>
  </section>
}
