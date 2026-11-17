import * as React from "react"

// UI5 2.28 Calendar fastNavigation metadata; UI5Element.onEnterDOM marks this root unless overridden.

import {
  addDays,
  clampDay,
  dayKey,
  formatLongDate,
  formatYear,
  getDayNames,
  getMonthNames,
  getWeekInfo,
  isSameDay,
  modifyDateBy,
  startOfDay,
  weekNumber,
} from "@/lib/fiori-dates"
import { slimArrowLeft, slimArrowRight } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"

// Mirrors ui5-calendar (Horizon): a header (previous / month / year / next) over one of four pickers.
// Day picker: 6 weeks with week numbers, today marker, weekends, other-month days, selection
// (single, multiple, range), special days. Month, year (20) and year-range (8 x 20) pickers.
// Keyboard (UI5 DayPicker/Calendar): arrows move by day/week, PageUp/PageDown by month, Shift+PageUp/Down
// (or Alt) by year, Ctrl+Shift+PageUp/Down by 10 years, Home/End to the start/end of the week row,
// Ctrl+Home/End to the first/last day of the month, Enter/Space select (Shift: range in multiple mode,
// Shift+Space selects the week), F4 shows the month picker, Shift+F4 the year (then year range) picker.
// One tab stop per grid (roving focus); the grid uses role=grid/row/gridcell. Gregorian calendar only.

type CalendarSelectionMode = "single" | "multiple" | "range"
type CalendarPicker = "day" | "month" | "year" | "yearrange"
type CalendarDayType = "NonWorking" | "Working" | `Type${"0" | "1"}${number}` | "Type20"

type SpecialDate = {
  date: Date
  /** "NonWorking" / "Working" change the day's background; "Type01" ... "Type20" draw a legend-colored bar. */
  type: CalendarDayType
  /** Shown as the day's tooltip (defaults to the legend item's text for the type). */
  tooltip?: string
}

type CalendarLabels = {
  previousMonth: string
  nextMonth: string
  previousYear: string
  nextYear: string
  previousYearRange: string
  nextYearRange: string
  monthButton: (month: string) => string
  yearButton: (year: string) => string
  yearRangeButton: (from: string, to: string) => string
  weekNumber: string
  calendarWeek: (week: number) => string
  today: string
  nonWorkingDay: string
  rangeStart: (date: string) => string
  rangeEnd: (date: string) => string
  rangeBetween: (date: string) => string
  monthPicker: string
  yearPicker: string
  yearRangePicker: string
}

const defaultLabels: CalendarLabels = {
  previousMonth: "Previous Month",
  nextMonth: "Next Month",
  previousYear: "Previous Year",
  nextYear: "Next Year",
  previousYearRange: "Previous Year Range",
  nextYearRange: "Next Year Range",
  monthButton: (m) => `Month ${m}`,
  yearButton: (y) => `Year ${y}`,
  yearRangeButton: (from, to) => `Year range from ${from} to ${to}`,
  weekNumber: "Week Number",
  calendarWeek: (w) => `Calendar Week ${w}`,
  today: "Today",
  nonWorkingDay: "Non-Working Day",
  rangeStart: (d) => `${d} First date of range`,
  rangeEnd: (d) => `${d} Last date of range`,
  rangeBetween: (d) => `${d} in a selected range`,
  monthPicker: "Month Picker",
  yearPicker: "Year Picker",
  yearRangePicker: "Year Range Picker",
}

/**
 * @accessibility Native aria-label / aria-labelledby / aria-describedby reach the calendar root. labels names header buttons, picker grids, week numbers and range/day descriptions; generated gridcells retain aria-selected and aria-disabled.
 * @accessibility Tab visits the header and one roving gridcell. Arrows move by day/week; Home/End move within the row; PageUp/Down changes month; Shift+PageUp/Down changes year. Enter/Space selects; F4 opens months and Shift+F4 opens years/year ranges. The current day-picker horizontal keys still use LTR order in RTL.
 */
type CalendarProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  components?: Partial<CalendarComponents>
  classNames?: Partial<Record<CalendarPartName, string>>
  renderDay?: (day: CalendarDayInfo) => React.ReactNode
  renderMonth?: (item: CalendarItemInfo) => React.ReactNode
  renderYear?: (item: CalendarItemInfo) => React.ReactNode
  getDayLabel?: (day: CalendarDayInfo) => string
  getDayProps?: (day: CalendarDayInfo) => React.HTMLAttributes<HTMLDivElement>
  getWeekNumber?: (week: CalendarWeekInfo) => number
  getPage?: (date: Date, dir: -1 | 1, picker: CalendarPicker) => Date | null
  itemPicker?: CalendarItemPicker
  picker?: CalendarPicker
  onPickerChange?: (picker: CalendarPicker) => void
  texts?: Partial<CalendarLabels>
  selectionMode?: CalendarSelectionMode
  /** Selected days. In "range" mode: [start] while choosing, then [start, end]. */
  selectedDates?: Date[]
  defaultSelectedDates?: Date[]
  onSelectedDatesChange?: (dates: Date[], detail: CalendarSelectionDetail) => void
  /** The day that has (or gets) focus; it decides which month/year is shown. Defaults to the first selected day, else today. */
  focusedDate?: Date
  defaultFocusedDate?: Date
  onFocusedDateChange?: (date: Date) => void
  /** Days before / after can't be focused or selected; the header arrows stop there. */
  minDate?: Date
  maxDate?: Date
  /** Extra days that can't be selected (rendered dimmed). */
  isDateDisabled?: (date: Date) => boolean
  hideWeekNumbers?: boolean
  /** BCP 47 locale for names, first day of week and weekend. Default "en-US". */
  locale?: string
  /** 0 = Sunday ... 6 = Saturday; defaults to the locale's. */
  firstDayOfWeek?: number
  specialDates?: SpecialDate[]
  /** A <CalendarLegend>, rendered below the calendar. Focusing a legend item highlights only its special days. */
  legend?: React.ReactNode
  /** Which picker is shown first. */
  initialPicker?: CalendarPicker
  /**
   * What a selection picks (UI5 derives this from the date pattern): "day" (default); "month" makes the
   * month picker select (years lead to months); "year" makes the year picker select.
   */
  selectionLevel?: "day" | "month" | "year"
  /** Move focus into the calendar when it mounts (used by the date pickers' popovers). */
  autoFocus?: boolean
  /** Override header-button, picker, week-number and selected-range names on their owning buttons/grids/cells. */
  labels?: Partial<CalendarLabels>
}

const MIN_DATE = (() => {
  const d = new Date(2000, 0, 1)
  d.setFullYear(1)
  return d
})()
const MAX_DATE = new Date(9999, 11, 31)
const YEAR_PAGE = 20
const YEAR_ROW = 4
const RANGE_PAGE = 8
const RANGE_ROW = 2

const LegendContext = React.createContext<{ setType: (type: string | null) => void; labels: CalendarLabels } | null>(null)

/** Moves the year to `year`, keeping month and day (clamped to the month's length). */
function withYear(d: Date, year: number) {
  return modifyDateBy(d, year - d.getFullYear(), "year")
}

function Calendar({
  components, classNames, renderDay, renderMonth, renderYear, getDayLabel, getDayProps, getWeekNumber, getPage, itemPicker,
  picker: pickerProp, onPickerChange, texts,
  selectionMode = "single",
  selectedDates: selectedProp,
  defaultSelectedDates,
  onSelectedDatesChange,
  focusedDate: focusedProp,
  defaultFocusedDate,
  onFocusedDateChange,
  minDate = MIN_DATE,
  maxDate = MAX_DATE,
  isDateDisabled,
  hideWeekNumbers,
  locale = "en-US",
  firstDayOfWeek,
  specialDates,
  legend,
  selectionLevel = "day",
  initialPicker = selectionLevel === "day" ? "day" : selectionLevel,
  autoFocus,
  labels: labelsProp,
  className,
  onKeyDown,
  ...props
}: CalendarProps) {
  const labels = { ...defaultLabels, ...texts, ...labelsProp }
  const [selectedInner, setSelectedInner] = React.useState<Date[]>(defaultSelectedDates ?? [])
  const selected = selectedProp ?? selectedInner
  const today = startOfDay(new Date())
  const [focusedInner, setFocusedInner] = React.useState<Date>(() => startOfDay(defaultFocusedDate ?? selected[0] ?? today))
  const focused = clampDay(startOfDay(focusedProp ?? focusedInner), minDate, maxDate)
  const [pickerInner, setPicker] = React.useState<CalendarPicker>(initialPicker)
  const picker = pickerProp ?? pickerInner
  const activation = React.useRef<CalendarSelectionDetail>({ date: focused, picker, source: "pointer" })
  /** Range mode with one day chosen: the hovered / focused day that previews the range end. */
  const [secondDate, setSecondDate] = React.useState<Date | null>(null)
  const [legendType, setLegendType] = React.useState<string | null>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const focusPending = React.useRef(!!autoFocus)

  // Year picker page start: the focused year is 10th on first show; paging keeps 20-year steps (UI5 _currentYearRange).
  const rangeStart = React.useRef<number | null>(null)
  if (rangeStart.current === null) rangeStart.current = focused.getFullYear() - 9
  rangeStart.current += Math.floor((focused.getFullYear() - rangeStart.current) / YEAR_PAGE) * YEAR_PAGE
  if (focused.getFullYear() - YEAR_PAGE < minDate.getFullYear()) rangeStart.current = minDate.getFullYear()
  if (focused.getFullYear() + YEAR_PAGE > MAX_DATE.getFullYear()) rangeStart.current = MAX_DATE.getFullYear() - YEAR_PAGE + 1
  const yearRange = { start: rangeStart.current, end: rangeStart.current + YEAR_PAGE - 1 }
  // Year-range picker grid start: the current range is 3rd on first show, paging keeps 160-year steps.
  const gridStart = React.useRef<number | null>(null)
  if (picker === "yearrange") {
    const span = YEAR_PAGE * RANGE_PAGE
    if (gridStart.current === null) gridStart.current = yearRange.start - 2 * YEAR_PAGE
    gridStart.current += Math.floor((yearRange.start - gridStart.current) / span) * span
    if (yearRange.start - YEAR_PAGE < minDate.getFullYear()) gridStart.current = minDate.getFullYear()
    if (yearRange.start + span > MAX_DATE.getFullYear()) gridStart.current = MAX_DATE.getFullYear() - span + 1
  } else gridStart.current = null

  const setFocused = (d: Date, focus = true) => {
    const next = clampDay(startOfDay(d), minDate, maxDate)
    if (focus) focusPending.current = true
    if (focusedProp === undefined) setFocusedInner(next)
    if (!isSameDay(next, focused)) onFocusedDateChange?.(next)
    if (selectionMode === "range" && selected.length >= 1) setSecondDate(next)
    return next
  }
  const setSelected = (dates: Date[]) => {
    if (selectedProp === undefined) setSelectedInner(dates)
    // UI5 Calendar.js:_fireEventAndUpdateSelectedDates includes the activated timestamp.
    onSelectedDatesChange?.(dates, activation.current)
  }
  const showPicker = (p: CalendarPicker) => {
    focusPending.current = true
    if (pickerProp === undefined) setPicker(p)
    onPickerChange?.(p)
  }

  React.useEffect(() => {
    if (!focusPending.current) return
    focusPending.current = false
    rootRef.current?.querySelector<HTMLElement>(`[data-picker="${itemPicker ? "item" : picker}"] [data-focus-ref]`)?.focus()
  })

  const isDisabled = (d: Date) => dayKey(d) < dayKey(minDate) || dayKey(d) > dayKey(maxDate) || !!isDateDisabled?.(d)

  /* ---------------------------------------------------------------- selection */
  const selectDay = (day: Date, shift: boolean) => {
    if (isDisabled(day)) return
    if (selectionMode === "multiple") {
      const has = (d: Date) => selected.some((s) => isSameDay(s, d))
      if (selected.length && shift) {
        // UI5 _multipleSelection: extend to the clicked day, or toggle from it to the nearer end when inside.
        const keys = selected.map(dayKey)
        const min = selected[keys.indexOf(Math.min(...keys))]
        const max = selected[keys.indexOf(Math.max(...keys))]
        let from: Date, to: Date, toggle = false
        if (dayKey(day) < dayKey(min)) [from, to] = [day, min]
        else if (dayKey(day) > dayKey(max)) [from, to] = [max, day]
        else {
          toggle = true
          ;[from, to] = day.getTime() - min.getTime() < max.getTime() - day.getTime() ? [day, max] : [min, day]
        }
        let next = [...selected]
        for (let d = startOfDay(from); dayKey(d) <= dayKey(to); d = addDays(d, 1)) {
          const inSel = next.some((s) => isSameDay(s, d))
          if (toggle && inSel) next = next.filter((s) => !isSameDay(s, d))
          else if (!inSel && !isDisabled(d)) next.push(d)
        }
        setSelected(next)
      } else setSelected(has(day) ? selected.filter((s) => !isSameDay(s, day)) : [...selected, day])
      return
    }
    if (selectionMode === "range" && selected.length === 1) {
      const [a, b] = [selected[0], day].sort((x, y) => dayKey(x) - dayKey(y))
      setSecondDate(null)
      setSelected([a, b])
      return
    }
    setSelected([day])
  }

  /* ---------------------------------------------------------------- header */
  const minY = minDate.getFullYear()
  const maxY = maxDate.getFullYear()
  const fy = focused.getFullYear()
  const fm = focused.getMonth()
  const [hasPrev, hasNext] =
    picker === "day"
      ? [!(fm === minDate.getMonth() && fy === minY), !(fm === maxDate.getMonth() && fy === maxY)]
      : picker === "month"
        ? [fy !== minY, fy !== maxY]
        : picker === "year"
          ? [yearRange.start > minY, yearRange.end < maxY]
          : [gridStart.current! > minY, gridStart.current! + YEAR_PAGE * RANGE_PAGE - 1 < maxY]
  const page = (dir: 1 | -1) => {
    if (getPage) {
      const next = getPage(focused, dir, picker)
      if (next) setFocused(next)
      return
    }
    if (dir < 0 ? !hasPrev : !hasNext) return
    if (picker === "day") setFocused(modifyDateBy(focused, dir, "month", false))
    else if (picker === "month") setFocused(modifyDateBy(focused, 12 * dir, "month"))
    else if (picker === "year") setFocused(modifyDateBy(focused, YEAR_PAGE * dir, "year"))
    else {
      gridStart.current! += YEAR_PAGE * RANGE_PAGE * dir
      setFocused(modifyDateBy(focused, YEAR_PAGE * RANGE_PAGE * dir, "year"))
    }
  }
  const [prevLabel, nextLabel] =
    picker === "day"
      ? [labels.previousMonth, labels.nextMonth]
      : picker === "month"
        ? [labels.previousYear, labels.nextYear]
        : [labels.previousYearRange, labels.nextYearRange]
  const monthNames = getMonthNames(locale, "long")
  const monthText = monthNames[fm]
  const yearText = formatYear(fy, locale)
  const rangeText = [formatYear(yearRange.start, locale), formatYear(yearRange.end, locale)] as const

  const headerButton = (action: () => void) => ({
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === " ") e.preventDefault()
      if (e.key === "Enter") {
        e.preventDefault()
        action()
      }
    },
    onKeyUp: (e: React.KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault()
        action()
      }
    },
  })

  const navElement = (dir: 1 | -1) => {
    const disabled = getPage ? getPage(focused, dir, picker) === null : dir < 0 ? !hasPrev : !hasNext
    const label = dir < 0 ? prevLabel : nextLabel
    return (
      <CalendarPart partName="NavButton" direction={dir}
        data-slot={dir < 0 ? "calendar-previous" : "calendar-next"}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-disabled={disabled || undefined}
        title={label}
        className={cn("fiori-calheader-arrowbtn", disabled && "fiori-calheader-arrowbtn-disabled")}
        onMouseDown={(e) => {
          e.preventDefault()
          if (e.button === 0) page(dir)
        }}
        {...headerButton(() => page(dir))}
      >
        <Icon icon={dir < 0 ? slimArrowLeft : slimArrowRight} className="fiori-calheader-arrowicon" />
      </CalendarPart>
    )
  }

  const arrow = (dir: 1 | -1) => <CalendarNavButton direction={dir} />

  /* ---------------------------------------------------------------- pickers */
  const handleRootKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (itemPicker || e.defaultPrevented || e.key !== "F4" || e.ctrlKey || e.altKey || e.metaKey) return
    e.preventDefault()
    if (!e.shiftKey) {
      if (picker !== "month" && selectionLevel !== "year") showPicker("month")
    } else showPicker(picker !== "year" ? "year" : "yearrange")
  }

  const context: InternalCalendarContext = {
    focusedDate: focused, selectedDates: selected, picker, labels, locale,
    weekConfig: { ...getWeekInfo(locale), firstDay: firstDayOfWeek ?? getWeekInfo(locale).firstDay },
    components: components ?? {}, classNames: classNames ?? {}, renderDay, renderMonth, renderYear,
    getDayLabel, extraDayProps: getDayProps, getWeekNumber, getPage,
    focus: setFocused, showPicker, page,
    select: (date, detail) => { activation.current = { ...detail, date, picker }; selectDay(date, detail.shiftKey ?? false) },
    activate: (date, source) => { activation.current = { date, picker, source } },
    navElement,
    getGridProps: emptyGetter, getRowProps: emptyGetter, getRowHeaderProps: emptyGetter, getCellProps: emptyGetter,
    getHeaderButtonProps: (kind, extra) => {
      if (typeof kind === "number") {
        const { partName: _partName, direction: _direction, children: _children, ...owned } = navElement(kind).props as ExtraProps & { partName: string; direction: number }
        return mergeOwnedProps(owned, extra)
      }
      const label = kind === "month" ? labels.monthButton(monthText) : kind === "year" ? labels.yearButton(yearText) : labels.yearRangeButton(...rangeText)
      const action = () => showPicker(kind === "month" ? "month" : kind === "year" ? "year" : "yearrange")
      return mergeOwnedProps({ role: "button", tabIndex: 0, "data-slot": `calendar-${kind}-button`,
        hidden: !!itemPicker || (kind === "month" ? picker !== "day" || selectionLevel !== "day" : kind === "year" ? (picker !== "day" && picker !== "month") || selectionLevel === "year" : picker !== "year"),
        "aria-label": label, "aria-keyshortcuts": kind === "month" ? "F4" : "Shift+F4", title: `${label} (${kind === "month" ? "F4" : "Shift + F4"})`,
        className: "fiori-calheader-arrowbtn fiori-calheader-middlebtn", onClick: action, ...headerButton(action),
      } as ExtraProps, extra)
    },
  }
  return (
    <CalendarContext.Provider value={context}>
    <LegendContext.Provider value={{ setType: setLegendType, labels }}>
      <div ref={rootRef} data-slot="calendar" data-sap-ui-fastnavgroup="true" className={cn("fiori-calendar", className)} onKeyDown={handleRootKeyDown} {...props}>
        <div className="fiori-cal-root">
          <div className="fiori-calheader">
            <CalendarPart partName="Header"  className="fiori-calheader-root">
              {arrow(-1)}
              <div className="fiori-calheader-midcontainer">
                {itemPicker && <span>{itemPicker.label}</span>}
                <CalendarPart partName="HeaderButton" buttonKind="month"
                  data-slot="calendar-month-button"
                  role="button"
                  tabIndex={0}
                  hidden={!!itemPicker || picker !== "day" || selectionLevel !== "day"}
                  aria-label={labels.monthButton(monthText)}
                  title={`${labels.monthButton(monthText)} (F4)`}
                  aria-keyshortcuts="F4"
                  className="fiori-calheader-arrowbtn fiori-calheader-middlebtn"
                  onClick={() => showPicker("month")}
                  {...headerButton(() => showPicker("month"))}
                >
                  <span>{monthText}</span>
                </CalendarPart>
                <CalendarPart partName="HeaderButton" buttonKind="year"
                  data-slot="calendar-year-button"
                  role="button"
                  tabIndex={0}
                  hidden={!!itemPicker || (picker !== "day" && picker !== "month") || selectionLevel === "year"}
                  aria-label={labels.yearButton(yearText)}
                  title={`${labels.yearButton(yearText)} (Shift + F4)`}
                  aria-keyshortcuts="Shift+F4"
                  className="fiori-calheader-arrowbtn fiori-calheader-middlebtn"
                  onClick={() => showPicker("year")}
                  {...headerButton(() => showPicker("year"))}
                >
                  <span>{yearText}</span>
                </CalendarPart>
                <CalendarPart partName="HeaderButton" buttonKind="year-range"
                  data-slot="calendar-year-range-button"
                  role="button"
                  tabIndex={0}
                  hidden={!!itemPicker || picker !== "year"}
                  aria-label={labels.yearRangeButton(...rangeText)}
                  title={`${labels.yearRangeButton(...rangeText)} (Shift + F4)`}
                  aria-keyshortcuts="Shift+F4"
                  className="fiori-calheader-arrowbtn fiori-calheader-middlebtn"
                  onClick={() => showPicker("yearrange")}
                  {...headerButton(() => showPicker("yearrange"))}
                >
                  <span>{`${rangeText[0]} - ${rangeText[1]}`}</span>
                </CalendarPart>
              </div>
              {arrow(1)}
            </CalendarPart>
          </div>
          <div className="fiori-cal-content">
            {itemPicker ? <ItemPicker model={itemPicker} /> : picker === "day" && (
              <DayPicker
                focused={focused}
                today={today}
                selected={selected}
                secondDate={secondDate}
                selectionMode={selectionMode}
                locale={locale}
                firstDayOfWeek={firstDayOfWeek}
                hideWeekNumbers={hideWeekNumbers}
                specialDates={specialDates}
                legendType={legendType}
                isDisabled={isDisabled}
                labels={labels}
                minDate={minDate}
                maxDate={maxDate}
                setFocused={setFocused}
                setSecondDate={setSecondDate}
                selectDay={selectDay}
                setSelected={setSelected}
              />
            )}
            {!itemPicker && picker === "month" && (
              <GridPicker
                kind="month"
                label={labels.monthPicker}
                rowSize={3}
                items={monthNames.map((name, m) => {
                  const date = new Date(fy, m, Math.min(focused.getDate(), new Date(fy, m + 1, 0).getDate()))
                  const outOfRange = fy * 12 + m < minY * 12 + minDate.getMonth() || fy * 12 + m > maxY * 12 + maxDate.getMonth()
                  return {
                    key: m,
                    date,
                    text: name,
                    focused: m === fm,
                    selected: selected.some((s) => s.getFullYear() === fy && s.getMonth() === m),
                    disabled: outOfRange,
                  }
                })}
                onMove={(n) => setFocused(modifyDateBy(focused, n, "month"))}
                onFocusItem={(d) => setFocused(d)}
                pageSize={12}
                onSelect={(d) => {
                  setFocused(d)
                  if (selectionLevel === "month") setSelected([d])
                  else showPicker("day")
                }}
              />
            )}
            {!itemPicker && picker === "year" && (
              <GridPicker
                kind="year"
                label={labels.yearPicker}
                rowSize={YEAR_ROW}
                items={Array.from({ length: YEAR_PAGE }, (_, i) => {
                  const y = yearRange.start + i
                  return {
                    key: y,
                    date: withYear(focused, y),
                    text: formatYear(y, locale),
                    focused: y === fy,
                    selected: selected.some((s) => s.getFullYear() === y),
                    disabled: y < minY || y > maxY,
                  }
                })}
                onMove={(n) => setFocused(modifyDateBy(focused, n, "year"))}
                onFocusItem={(d) => setFocused(d)}
                pageSize={YEAR_PAGE}
                onSelect={(d) => {
                  setFocused(d)
                  if (selectionLevel === "year") setSelected([d])
                  else showPicker(selectionLevel === "month" ? "month" : "day")
                }}
              />
            )}
            {!itemPicker && picker === "yearrange" && (
              <GridPicker
                kind="yearrange"
                label={labels.yearRangePicker}
                rowSize={RANGE_ROW}
                items={Array.from({ length: RANGE_PAGE }, (_, i) => {
                  const start = gridStart.current! + i * YEAR_PAGE
                  const end = start + YEAR_PAGE - 1
                  return {
                    key: start,
                    date: withYear(focused, start),
                    text: `${formatYear(start, locale)} - ${formatYear(end, locale)}`,
                    focused: fy >= start && fy <= end,
                    selected: selected.some((s) => s.getFullYear() >= start && s.getFullYear() <= end),
                    disabled: !((start >= minY && start <= maxY) || (end >= minY && end <= maxY)),
                  }
                })}
                onMove={(n) => setFocused(modifyDateBy(focused, n * YEAR_PAGE, "year"))}
                onFocusItem={(d) => setFocused(d)}
                pageSize={RANGE_PAGE}
                onSelect={(d) => {
                  // The chosen range opens in the year picker with its 10th year focused (UI5 centers it).
                  setFocused(modifyDateBy(d, 9, "year"))
                  rangeStart.current = d.getFullYear()
                  showPicker("year")
                }}
              />
            )}
          </div>
        </div>
        {legend}
      </div>
    </LegendContext.Provider>
    </CalendarContext.Provider>
  )
}

type DayPickerProps = {
  focused: Date
  today: Date
  selected: Date[]
  secondDate: Date | null
  selectionMode: CalendarSelectionMode
  locale: string
  firstDayOfWeek?: number
  hideWeekNumbers?: boolean
  specialDates?: SpecialDate[]
  legendType: string | null
  isDisabled: (d: Date) => boolean
  labels: CalendarLabels
  minDate: Date
  maxDate: Date
  setFocused: (d: Date, focus?: boolean) => Date
  setSecondDate: (d: Date | null) => void
  selectDay: (d: Date, shift: boolean) => void
  setSelected: (dates: Date[]) => void
}

function DayPicker({
  focused,
  today,
  selected,
  secondDate,
  selectionMode,
  locale,
  firstDayOfWeek,
  hideWeekNumbers,
  specialDates,
  legendType,
  isDisabled,
  labels,
  setFocused,
  setSecondDate,
  selectDay,
  setSelected,
}: DayPickerProps) {
  const extension = useCalendarInternal()
  const weekInfo = getWeekInfo(locale)
  const firstDay = firstDayOfWeek ?? weekInfo.firstDay
  const longNames = getDayNames(locale, "long")
  let shortNames = getDayNames(locale, "short")
  if (shortNames.some((n) => n.length > 4)) shortNames = getDayNames(locale, "narrow")

  // Special days, filtered by the focused legend item's type (Working / NonWorking always stay).
  const hasLegendType = !!legendType && !!specialDates?.some((s) => s.type === legendType)
  const specials = new Map<number, SpecialDate>()
  for (const s of specialDates ?? []) {
    if (hasLegendType && s.type !== legendType && s.type !== "Working" && s.type !== "NonWorking") continue
    if (!specials.has(dayKey(s.date))) specials.set(dayKey(s.date), s)
  }

  const first = new Date(focused.getFullYear(), focused.getMonth(), 1)
  const start = addDays(first, -((first.getDay() - firstDay + 7) % 7))
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i))
  const weeks = Array.from({ length: 6 }, (_, w) => days.slice(w * 7, w * 7 + 7))

  const keys = selected.map(dayKey)
  const isSelected = (d: Date) =>
    selectionMode === "range" ? keys.length > 0 && (dayKey(d) === keys[0] || dayKey(d) === keys[keys.length - 1]) : keys.includes(dayKey(d))
  const isBetween = (d: Date) => {
    if (selectionMode !== "range" || !keys.length) return false
    const other = keys.length === 1 ? (secondDate ? dayKey(secondDate) : null) : keys[keys.length - 1]
    if (other === null) return false
    const k = dayKey(d)
    return k > Math.min(keys[0], other) && k < Math.max(keys[0], other)
  }
  const isWeekendDay = (d: Date) => weekInfo.weekend.includes(d.getDay())

  const cellDate = (el: EventTarget) => {
    const key = (el as HTMLElement).closest<HTMLElement>("[data-date]")?.dataset.date
    return key ? days.find((d) => String(dayKey(d)) === key) : undefined
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const { key, shiftKey: shift, ctrlKey, metaKey, altKey: alt } = e
    const ctrl = ctrlKey || metaKey
    const plain = !shift && !ctrl && !alt
    let handled = true
    if (key === "Enter" && !ctrl && !alt) {
      const d = cellDate(e.target)
      if (d) {
        setFocused(d)
        extension.activate(d, "keyboard")
        selectDay(d, shift)
      }
    } else if (key === " " && !ctrl && !alt) {
      // Selection happens on keyup, like UI5.
    } else if (key === "ArrowLeft" && plain) setFocused(addDays(focused, -1))
    else if (key === "ArrowRight" && plain) setFocused(addDays(focused, 1))
    else if (key === "ArrowUp" && plain) setFocused(addDays(focused, -7))
    else if (key === "ArrowDown" && plain) setFocused(addDays(focused, 7))
    else if ((key === "PageUp" || key === "PageDown") && !(ctrl && !shift)) {
      const dir = key === "PageUp" ? -1 : 1
      if (plain && extension.getPage) extension.page(dir)
      else if (plain) setFocused(modifyDateBy(focused, dir, "month"))
      else if (ctrl && shift && !alt) setFocused(modifyDateBy(focused, 10 * dir, "year"))
      else if ((shift && !alt) || (alt && !shift)) setFocused(modifyDateBy(focused, dir, "year"))
      else handled = false
    } else if ((key === "Home" || key === "End") && plain) {
      const row = weeks.find((w) => w.some((d) => isSameDay(d, focused)))!
      setFocused(key === "Home" ? row[0] : row[6])
    } else if ((key === "Home" || key === "End") && ctrl && !shift && !alt) {
      setFocused(key === "Home" ? first : new Date(focused.getFullYear(), focused.getMonth() + 1, 0))
    } else handled = false
    if (handled) e.preventDefault()
  }
  const onKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== " " || e.ctrlKey || e.altKey || e.metaKey) return
    const d = cellDate(e.target)
    if (!d) return
    extension.activate(d, "keyboard")
    if (e.shiftKey && selectionMode === "multiple") {
      // Shift+Space toggles the whole week of the focused day.
      const row = weeks.find((w) => w.some((x) => isSameDay(x, d)))!.filter((x) => !isDisabled(x))
      const all = row.every((x) => selected.some((s) => isSameDay(s, x)))
      setSelected(all ? selected.filter((s) => !row.some((x) => isSameDay(x, s))) : [...selected, ...row.filter((x) => !selected.some((s) => isSameDay(s, x)))])
    } else {
      setFocused(d)
      selectDay(d, false)
    }
  }

  const tree = (
    <CalendarPart partName="DayGrid"
      data-picker="day"
      className="fiori-dp-root"
      data-hide-week-numbers={hideWeekNumbers ? "" : undefined}
      onKeyDownCapture={onKeyDown}
      onKeyUpCapture={onKeyUp}
      onMouseDown={(e) => {
        const d = cellDate(e.target)
        if (d && !isDisabled(d)) setFocused(d, false)
      }}
      onClick={(e) => {
        const d = cellDate(e.target)
        if (d) { extension.activate(d, "pointer"); selectDay(d, e.shiftKey) }
      }}
      onMouseOver={(e) => {
        if (selectionMode !== "range" || selected.length !== 1) return
        const d = cellDate(e.target)
        if (d && !isSameDay(d, secondDate)) setSecondDate(d)
      }}
    >
      <CalendarPart partName="Grid"  role="grid" aria-roledescription="Gregorian calendar" aria-multiselectable={selectionMode !== "single" || undefined} className="fiori-dp-content">
        <div role="row" className="fiori-dp-days-names-container">
          {!hideWeekNumbers && (
            <div role="columnheader" className="fiori-dp-dayname">
              <span className="fiori-hidden-text">{labels.weekNumber}</span>
            </div>
          )}
          {Array.from({ length: 7 }, (_, i) => {
            const wd = (firstDay + i) % 7
            return (
              <div key={wd} role="columnheader" aria-label={longNames[wd]} className="fiori-dp-dayname">
                {shortNames[wd]}
              </div>
            )
          })}
        </div>
        {weeks.map((week) => {
          const defaultNumber = weekNumber(week[6], firstDay, firstDayOfWeek === undefined ? weekInfo.minimalDays : 1)
          const weekInfoForRow = { days: week, weekStart: week[0], weekEnd: week[6], defaultNumber, locale }
          const wn = extension.getWeekNumber?.(weekInfoForRow) ?? defaultNumber
          // Preserve DayPickerTemplate.js's numeric default for exact copy parity; new consumer
          // week policies format their visible number with the resolved locale (rule 10).
          const weekText = extension.getWeekNumber ? new Intl.NumberFormat(locale, { useGrouping: false }).format(wn) : wn
          return (
            <CalendarPart partName="Row" rowKey={dayKey(week[0])} key={dayKey(week[0])} role="row" className="fiori-dp-weeks-row">
              {!hideWeekNumbers && (
                <CalendarPart partName="WeekNumber" week={weekInfoForRow} role="rowheader" aria-label={labels.calendarWeek(wn)} className="fiori-dp-weekname-container">
                  <span className="fiori-dp-weekname">{weekText}</span>
                </CalendarPart>
              )}
              {week.map((d) => {
                const special = specials.get(dayKey(d))
                const otherMonth = d.getMonth() !== focused.getMonth()
                const disabled = isDisabled(d)
                const now = isSameDay(d, today)
                const sel = isSelected(d)
                const between = isBetween(d)
                const nonWorking = (isWeekendDay(d) || special?.type === "NonWorking") && special?.type !== "Working"
                const typed = special && special.type !== "Working" && special.type !== "NonWorking"
                const tooltip = [now && labels.today, nonWorking && labels.nonWorkingDay, typed && special.tooltip].filter(Boolean).join(" ")
                let ariaLabel = formatLongDate(d, locale) + (tooltip ? ` ${tooltip}` : "")
                if (selectionMode === "range") {
                  if (sel && keys.length > 1 && dayKey(d) === keys[keys.length - 1]) ariaLabel = labels.rangeEnd(ariaLabel)
                  else if (sel && dayKey(d) === keys[0]) ariaLabel = labels.rangeStart(ariaLabel)
                  else if (between) ariaLabel = labels.rangeBetween(ariaLabel)
                }
                const isFocused = isSameDay(d, focused)
                const dayInfo: CalendarDayInfo = {
                  date: d, isToday: now, isSelected: sel, isRangeStart: sel && dayKey(d) === keys[0],
                  isRangeEnd: sel && keys.length > 1 && dayKey(d) === keys[keys.length - 1], isInRange: between,
                  isOtherMonth: otherMonth, isWeekend: nonWorking, isDisabled: disabled, isFocused,
                  specialDate: special, locale, defaultContent: <><span className="fiori-dp-daytext">{d.getDate()}</span>{special && <div className="fiori-dp-specialday" data-type={special.type} />}</>,
                }
                const addedLabel = extension.getDayLabel?.(dayInfo)
                if (addedLabel) ariaLabel += ` ${addedLabel}`
                return (
                  <CalendarPart partName="DayCell" day={dayInfo}
                    key={dayKey(d)}
                    role="gridcell"
                    data-date={dayKey(d)}
                    data-focus-ref={isFocused ? "" : undefined}
                    data-special-day={special ? special.type : undefined}
                    tabIndex={isFocused ? 0 : -1}
                    title={tooltip || undefined}
                    aria-selected={sel || between}
                    aria-label={ariaLabel}
                    aria-disabled={disabled || otherMonth || undefined}
                    className={cn(
                      "fiori-dp-item",
                      sel && "fiori-dp-item--selected",
                      between && "fiori-dp-item--selected-between",
                      now && "fiori-dp-item--now",
                      otherMonth && "fiori-dp-item--othermonth",
                      nonWorking && "fiori-dp-item--weekend",
                      disabled && "fiori-dp-item--disabled"
                    )}
                  >
                    {extension.renderDay ? extension.renderDay(dayInfo) : dayInfo.defaultContent}
                  </CalendarPart>
                )
              })}
            </CalendarPart>
          )
        })}
      </CalendarPart>
    </CalendarPart>
  )
  return <CalendarScope tree={tree}>{tree}</CalendarScope>
}

type GridItem = { key: number; date: Date; text: string; focused: boolean; selected: boolean; disabled: boolean }

/** Month, year and year-range pickers share UI5's keyboard model: arrows by one / one row, PageUp/Down a page, Home/End the row, Ctrl+Home/End the page. */
function GridPicker({
  kind,
  label,
  items,
  rowSize,
  pageSize,
  onMove,
  onFocusItem,
  onSelect,
}: {
  kind: "month" | "year" | "yearrange"
  label: string
  items: GridItem[]
  rowSize: number
  pageSize: number
  onMove: (amount: number) => void
  onFocusItem: (date: Date) => void
  onSelect: (date: Date) => void
}) {
  const extension = useCalendarInternal()
  const prefix = kind === "month" ? "mp" : kind === "year" ? "yp" : "yrp"
  const infos = items.map(item => ({ ...item, locale: extension.locale,
    defaultContent: <span className={kind === "month" ? "fiori-dp-monthtext" : "fiori-dp-yeartext"}>{item.text}</span>,
  }))
  const rows = Array.from({ length: Math.ceil(items.length / rowSize) }, (_, r) => infos.slice(r * rowSize, r * rowSize + rowSize))
  const current = items.findIndex((i) => i.focused)
  const itemFor = (t: EventTarget) => {
    const key = (t as HTMLElement).closest<HTMLElement>("[data-key]")?.dataset.key
    return items.find((i) => String(i.key) === key)
  }
  const select = (t: EventTarget, source: "pointer" | "keyboard") => {
    const item = itemFor(t)
    if (item && !item.disabled) { extension.activate(item.date, source); onSelect(item.date) }
  }
  const tree = (
    <CalendarPart partName="GridPicker"
      data-picker={kind}
      role="grid"
      aria-roledescription={label}
      aria-readonly="false"
      aria-multiselectable="false"
      className={`fiori-${prefix}-root`}
      onKeyDownCapture={(e) => {
        const ctrl = e.ctrlKey || e.metaKey
        const plain = !ctrl && !e.altKey && !e.shiftKey
        let handled = true
        if (e.key === "Enter" && plain) select(e.target, "keyboard")
        else if (e.key === " " && plain) {
          // selected on keyup
        } else if (e.key === "ArrowLeft" && plain) onMove(-1)
        else if (e.key === "ArrowRight" && plain) onMove(1)
        else if (e.key === "ArrowUp" && plain) onMove(-rowSize)
        else if (e.key === "ArrowDown" && plain) onMove(rowSize)
        else if (e.key === "PageUp" && plain) onMove(-pageSize)
        else if (e.key === "PageDown" && plain) onMove(pageSize)
        else if ((e.key === "Home" || e.key === "End") && plain) {
          const row = Math.floor(current / rowSize)
          onFocusItem(items[e.key === "Home" ? row * rowSize : row * rowSize + rowSize - 1].date)
        } else if ((e.key === "Home" || e.key === "End") && ctrl && !e.altKey && !e.shiftKey)
          onFocusItem(items[e.key === "Home" ? 0 : items.length - 1].date)
        else handled = false
        if (handled) e.preventDefault()
      }}
      onKeyUpCapture={(e) => {
        if (e.key === " " && !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
          e.preventDefault()
          select(e.target, "keyboard")
        }
      }}
      onClick={(e) => select(e.target, "pointer")}
    >
      {rows.map((row, r) => (
        <CalendarPart partName="Row" rowKey={r} key={r} role="row" className={kind === "month" ? "fiori-mp-quarter" : `fiori-${prefix}-interval-container`}>
          {row.map((item) => (
            <CalendarPart partName="Cell" item={item}
              key={item.key}
              role="gridcell"
              data-key={item.key}
              data-focus-ref={item.focused ? "" : undefined}
              tabIndex={item.focused ? 0 : -1}
              aria-selected={item.selected}
              aria-disabled={item.disabled || undefined}
              className={cn(
                `fiori-${prefix}-item`,
                item.selected && `fiori-${prefix}-item--selected`,
                item.disabled && `fiori-${prefix}-item--disabled`
              )}
            >
              {(kind === "month" ? extension.renderMonth : extension.renderYear)?.(item) ?? item.defaultContent}
            </CalendarPart>
          ))}
        </CalendarPart>
      ))}
    </CalendarPart>
  )
  return <CalendarScope tree={tree} itemModel={{ kind, rowSize, items: infos,
    focusedKey: items.find(i => i.focused)?.key, selectedKeys: items.filter(i => i.selected).map(i => i.key),
    focusItem: key => { const item = items.find(i => String(i.key) === String(key)); if (item && !item.disabled) onFocusItem(item.date) },
    selectItem: (key, source) => { const item = items.find(i => String(i.key) === String(key)); if (item && !item.disabled) { extension.activate(item.date, source); onSelect(item.date) } },
  }}>{tree}</CalendarScope>
}

/* --------------------------------------------------------------------- legend */

type CalendarLegendItemType = "Today" | "Selected" | "Working" | "NonWorking" | `Type${string}`

type CalendarLegendProps = React.ComponentProps<"div"> & {
  hideToday?: boolean
  hideSelectedDay?: boolean
  hideWorkingDay?: boolean
  hideNonWorkingDay?: boolean
  /** Text of the built-in items. */
  todayText?: string
  selectedDayText?: string
  workingDayText?: string
  nonWorkingDayText?: string
}

/** Mirrors ui5-calendar-legend: the built-in Today / Selected Day / Working Day / Non-Working Day entries, then yours. */
function CalendarLegend({
  hideToday,
  hideSelectedDay,
  hideWorkingDay,
  hideNonWorkingDay,
  todayText = "Today",
  selectedDayText = "Selected Day",
  workingDayText = "Working Day",
  nonWorkingDayText = "Non-Working Day",
  className,
  children,
  ...props
}: CalendarLegendProps) {
  const ctx = React.useContext(LegendContext)
  const [current, setCurrent] = React.useState(0)
  const ref = React.useRef<HTMLDivElement>(null)
  const items = () => [...(ref.current?.querySelectorAll<HTMLElement>("[data-slot=calendar-legend-item]") ?? [])]
  // Roving tab stop: the last focused item keeps tabindex 0.
  React.useLayoutEffect(() => {
    items().forEach((el, i) => (el.tabIndex = i === current ? 0 : -1))
  })
  return (
    <CalendarPart partName="Legend"
      ref={ref}
      data-slot="calendar-legend"
      role="list"
      aria-roledescription="Calendar Legend"
      className={cn("fiori-calendar-legend-root", className)}
      onFocus={(e) => {
        const i = items().indexOf(e.target as HTMLElement)
        if (i >= 0) setCurrent(i)
        ctx?.setType((e.target as HTMLElement).dataset.type ?? null)
      }}
      onBlur={() => ctx?.setType(null)}
      onKeyDown={(e) => {
        const all = items()
        const i = all.indexOf(e.target as HTMLElement)
        if (i < 0) return
        const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0
        if (!step) return
        e.preventDefault()
        all[Math.min(Math.max(i + step, 0), all.length - 1)]?.focus()
      }}
      {...props}
    >
      {!hideToday && <CalendarLegendItem type="Today" text={todayText} />}
      {!hideSelectedDay && <CalendarLegendItem type="Selected" text={selectedDayText} />}
      {!hideWorkingDay && <CalendarLegendItem type="Working" text={workingDayText} />}
      {!hideNonWorkingDay && <CalendarLegendItem type="NonWorking" text={nonWorkingDayText} />}
      {children}
    </CalendarPart>
  )
}

type CalendarLegendItemProps = React.ComponentProps<"div"> & {
  type: CalendarLegendItemType
  text: string
  marker?: React.ReactNode
}

function CalendarLegendItem({ type, text, children, marker, className, ...props }: CalendarLegendItemProps) {
  // The inline wrapper stands for UI5's (inline) custom-element host: it decides how the legend's
  // columns balance, so it is kept.
  return (
    <span className="fiori-calendar-legend-item-host">
      <CalendarPart partName="LegendItem" guardFocus={children !== undefined || marker !== undefined}  data-slot="calendar-legend-item" data-type={type} role="listitem" tabIndex={-1} className={cn("fiori-calendar-legend-item", className)} {...props}>
        <div className="fiori-calendar-legend-item-box">{marker}</div>
        <div className="fiori-calendar-legend-item-text">{children ?? text}</div>
      </CalendarPart>
    </span>
  )
}

export {
  Calendar,
  CalendarLegend,
  CalendarLegendItem,
  type CalendarDayType,
  type CalendarLabels,
  type CalendarLegendItemType,
  type CalendarPicker,
  type CalendarProps,
  type CalendarSelectionMode,
  type SpecialDate,
}

export { useCalendar, CalendarNavButton, CalendarHeaderButton, CalendarRow, CalendarCell, CalendarGrid, type CalendarContextValue, type CalendarComponents, type CalendarPartName, type CalendarPartProps, type CalendarDayInfo, type CalendarWeekInfo, type CalendarSelectionDetail, type CalendarGridItem, type CalendarItemInfo, type CalendarGridModel, type CalendarItemPicker }

// X0 prototype infrastructure. No dependency or registry changes. H6 should derive these getters
// directly from the state model; this spike collects the already-built React element model (not DOM).
type CalendarSelectionDetail = { date: Date; picker: CalendarPicker; source: "pointer" | "keyboard"; shiftKey?: boolean }
type CalendarDayInfo = {
  date: Date; isToday: boolean; isSelected: boolean; isRangeStart: boolean; isRangeEnd: boolean;
  isInRange: boolean; isOtherMonth: boolean; isWeekend: boolean; isDisabled: boolean; isFocused: boolean;
  specialDate?: SpecialDate; locale: string; defaultContent: React.ReactNode
}
type CalendarWeekInfo = { days: Date[]; weekStart: Date; weekEnd: Date; defaultNumber: number; locale: string }
type CalendarGridItem = { key: string | number; date?: Date; text: string; focused?: boolean; selected?: boolean; disabled?: boolean }
type CalendarItemInfo = Readonly<CalendarGridItem & {
  focused: boolean; selected: boolean; disabled: boolean; locale: string; defaultContent: React.ReactNode
}>
type CalendarPartName = "Header" | "NavButton" | "HeaderButton" | "DayGrid" | "WeekNumber" | "DayCell" | "GridPicker" | "Legend" | "LegendItem" | "Grid" | "Row" | "Cell"
type CalendarPartProps = { defaultContent: React.ReactNode; day?: CalendarDayInfo; week?: CalendarWeekInfo; item?: CalendarItemInfo; direction?: -1 | 1; buttonKind?: string }
type CalendarComponents = Record<CalendarPartName, React.ComponentType<CalendarPartProps>>
type ExtraProps = React.HTMLAttributes<HTMLDivElement>
type CalendarItemPicker = {
  items: CalendarGridItem[]; rowSize: number; label: string;
  focusedKey?: string | number; defaultFocusedKey?: string | number;
  onFocusedKeyChange?: (key: string | number) => void;
  selectedKeys?: (string | number)[]; defaultSelectedKeys?: (string | number)[];
  onSelectedKeysChange?: (keys: (string | number)[], detail: { item: CalendarGridItem; source: "pointer" | "keyboard" }) => void;
  texts?: { selected?: (label: string) => string }
}
type CalendarGridModel = {
  kind: "month" | "year" | "yearrange" | "item"; rowSize: number; items: readonly CalendarItemInfo[];
  focusedKey?: string | number; selectedKeys: readonly (string | number)[];
  focusItem: (key: string | number) => void;
  selectItem: (key: string | number, source: "pointer" | "keyboard") => void;
}
type KeyGetter = (key?: Date | CalendarGridItem | CalendarWeekInfo | string | number, extra?: ExtraProps) => ExtraProps
type InternalCalendarContext = {
  dayGrid?: { readonly days: readonly CalendarDayInfo[]; readonly rows: readonly { key: number; days: readonly CalendarDayInfo[] }[]; readonly weeks: readonly CalendarWeekInfo[] };
  gridPicker?: CalendarGridModel;
  focusedDate: Date; selectedDates: Date[]; picker: CalendarPicker; labels: CalendarLabels; locale: string;
  weekConfig: ReturnType<typeof getWeekInfo>;
  components: Partial<CalendarComponents>; classNames: Partial<Record<CalendarPartName, string>>;
  renderDay?: CalendarProps["renderDay"]; renderMonth?: CalendarProps["renderMonth"]; renderYear?: CalendarProps["renderYear"];
  getDayLabel?: CalendarProps["getDayLabel"]; extraDayProps?: CalendarProps["getDayProps"];
  getWeekNumber?: CalendarProps["getWeekNumber"]; getPage?: CalendarProps["getPage"];
  focus: (date: Date, focus?: boolean) => Date; select: (date: Date, detail: Omit<CalendarSelectionDetail, "date" | "picker">) => void;
  showPicker: (picker: CalendarPicker) => void; page: (dir: -1 | 1) => void;
  getGridProps: (extra?: ExtraProps) => ExtraProps; getRowProps: KeyGetter; getRowHeaderProps: KeyGetter; getCellProps: KeyGetter;
  getHeaderButtonProps: (kind: -1 | 1 | "month" | "year" | "year-range", extra?: ExtraProps) => ExtraProps;
  // Implementation-only members, intentionally excluded from the documented public surface.
  activate: (date: Date, source: "pointer" | "keyboard") => void;
  navElement: (direction: -1 | 1) => React.ReactElement<ExtraProps>;
}
const CalendarContext = React.createContext<InternalCalendarContext | null>(null)
function useCalendarInternal() {
  const context = React.useContext(CalendarContext)
  if (!context) throw new Error("useCalendar requires Calendar")
  return context
}
type CalendarContextValue = Readonly<Omit<InternalCalendarContext, "activate" | "navElement" | "extraDayProps" | "selectedDates">> & { readonly selectedDates: readonly Date[] }
function useCalendar(): CalendarContextValue {
  const { activate: _activate, navElement: _navElement, extraDayProps: _extraDayProps, ...facade } = useCalendarInternal()
  return facade
}
function emptyGetter(): ExtraProps { throw new Error("Grid getters require a grid structural part") }
function mergeOwnedProps(owned: ExtraProps, extra: ExtraProps = {}): ExtraProps {
  const result: Record<string, unknown> = { ...owned }
  for (const [key, value] of Object.entries(extra)) {
    if (key === "role" || key === "id" || key === "tabIndex" || key === "children" || key === "dangerouslySetInnerHTML" || key === "ref" || key.startsWith("aria-") || key.startsWith("data-")) {
      if (import.meta.env.DEV) console.warn(`Calendar: ignored owned prop ${key}`)
    } else if (key === "className") result[key] = cn(owned.className, value as string)
    else if (key === "style") result[key] = { ...owned.style, ...value as React.CSSProperties }
    else if (/^on[A-Z]/.test(key) && typeof value === "function") {
      const core = (owned as Record<string, unknown>)[key]
      result[key] = (...args: unknown[]) => { if (typeof core === "function") core(...args); value(...args) }
    } else result[key] = value
  }
  return result as ExtraProps
}
function CalendarPart({ guardFocus, partName: part, day, week, item, direction, buttonKind, rowKey: _rowKey, children, ...owned }: React.ComponentProps<"div"> & {
  guardFocus?: boolean; partName: CalendarPartName; day?: CalendarDayInfo; week?: CalendarWeekInfo; item?: CalendarItemInfo; direction?: -1 | 1; buttonKind?: string; rowKey?: number
}) {
  const context = React.useContext(CalendarContext)
  const Replacement = context?.components[part]
  const ref = React.useRef<HTMLDivElement>(null)
  const extra = day ? context?.extraDayProps?.(day) : undefined
  const props = mergeOwnedProps(owned, extra)
  if (day && (Replacement || extra || context?.renderDay || context?.getDayLabel)) {
    Object.assign(props, { "data-slot": "calendar-day", "data-today": day.isToday || undefined,
      "data-selected": day.isSelected || day.isInRange || undefined, "data-range-start": day.isRangeStart || undefined,
      "data-range-end": day.isRangeEnd || undefined, "data-in-range": day.isInRange || undefined,
      "data-other-month": day.isOtherMonth || undefined, "data-weekend": day.isWeekend || undefined,
      "data-disabled": day.isDisabled || undefined, "data-special-type": day.specialDate?.type })
  }
  const outerRef = owned.ref
  // Cell semantics are component-owned (DayPickerTemplate.js / MonthPickerTemplate.js).
  // No asChild boundary: a consumer cannot drop role/selected/tabindex by failing to spread props.
  React.useLayoutEffect(() => {
    if (!(guardFocus || Replacement || context?.renderDay || context?.renderMonth || context?.renderYear)) return
    if (!["DayCell", "Cell", "LegendItem", "NavButton", "HeaderButton"].includes(part)) return
    ref.current?.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex], [contenteditable]').forEach(el => { el.tabIndex = -1 })
  })
  return <div {...props} className={cn(props.className, context?.classNames[part])} ref={(element) => {
    ref.current = element
    if (typeof outerRef === "function") {
      const cleanup = outerRef(element)
      if (typeof cleanup === "function") return () => { ref.current = null; cleanup() }
    }
    else if (outerRef) outerRef.current = element
  }}>{Replacement ? <Replacement defaultContent={children} day={day} week={week} item={item} direction={direction} buttonKind={buttonKind} /> : children}</div>
}
function CalendarNavButton({ direction }: { direction: -1 | 1 }) { return useCalendarInternal().navElement(direction) }
function CalendarHeaderButton({ kind, children }: { kind: "month" | "year" | "year-range"; children?: React.ReactNode }) {
  const c = useCalendarInternal()
  return <CalendarPart partName="HeaderButton" buttonKind={kind} {...c.getHeaderButtonProps(kind)}>{children}</CalendarPart>
}
function CalendarGrid({ children, ...extra }: ExtraProps) { const c = useCalendarInternal(); return <CalendarPart partName="Grid" {...c.getGridProps(extra)}>{children}</CalendarPart> }
function CalendarRow({ rowKey, children, ...extra }: ExtraProps & { rowKey: number }) { const c = useCalendarInternal(); return <CalendarPart partName="Row" rowKey={rowKey} {...c.getRowProps(rowKey, extra)}>{children}</CalendarPart> }
function CalendarCell({ item, children, ...extra }: ExtraProps & { item: Date | CalendarGridItem }) {
  const c = useCalendarInternal()
  const day = item instanceof Date ? c.dayGrid?.days.find(d => isSameDay(d.date, item)) : undefined
  return <CalendarPart partName={item instanceof Date ? "DayCell" : "Cell"} day={day} item={item instanceof Date ? undefined : c.gridPicker?.items.find(i => String(i.key) === String(item.key))} {...c.getCellProps(item, extra)}>{children ?? day?.defaultContent}</CalendarPart>
}
function CalendarScope({ tree, itemModel, children }: { tree: React.ReactNode; itemModel?: CalendarGridModel; children: React.ReactNode }) {
  const context = useCalendarInternal()
  const dayInfos: CalendarDayInfo[] = []
  const weekInfos: CalendarWeekInfo[] = []
  const parts: { part: CalendarPartName; key?: string | number; props: ExtraProps }[] = []
  const walk = (node: React.ReactNode) => React.Children.forEach(node, child => {
    if (!React.isValidElement<Record<string, any>>(child)) return
    const { guardFocus: _guardFocus, partName: part, day, week, item, rowKey, children: content, ...props } = child.props
    if (day) dayInfos.push(day)
    if (week) weekInfos.push(week)
    if (part) parts.push({ part, key: day ? dayKey(day.date) : week ? dayKey(week.weekStart) : item?.key ?? rowKey, props })
    walk(content)
  })
  walk(tree)
  const find = (names: CalendarPartName[], key?: Parameters<KeyGetter>[0], extra?: ExtraProps) => {
    const id = key instanceof Date ? dayKey(key) : typeof key === "object" && key ? "weekStart" in key ? dayKey(key.weekStart) : key.key : key
    const entry = parts.find(p => names.includes(p.part) && (id === undefined || String(p.key) === String(id)))
    if (!entry) throw new Error(`Unknown Calendar part ${names.join("/")} ${id ?? ""}`)
    return mergeOwnedProps(entry.props, extra)
  }
  return <CalendarContext.Provider value={{ ...context,
    gridPicker: itemModel ?? context.gridPicker,
    dayGrid: dayInfos.length ? { days: dayInfos, weeks: weekInfos, rows: Array.from({ length: Math.ceil(dayInfos.length / 7) }, (_, i) => ({ key: dayKey(dayInfos[i * 7].date), days: dayInfos.slice(i * 7, (i + 1) * 7) })) } : context.dayGrid,
    getGridProps: extra => find(["Grid", "GridPicker"], undefined, extra),
    getRowProps: (key, extra) => find(["Row"], key, extra),
    getRowHeaderProps: (key, extra) => find(["WeekNumber"], key, extra),
    getCellProps: (key, extra) => find(["DayCell", "Cell"], key, extra),
  }}>{children}</CalendarContext.Provider>
}

function ItemPicker({ model }: { model: CalendarItemPicker }) {
  const context = useCalendarInternal()
  const [innerFocus, setInnerFocus] = React.useState(model.defaultFocusedKey ?? model.items.find(i => !i.disabled)?.key)
  const [innerSelected, setInnerSelected] = React.useState<(string | number)[]>(model.defaultSelectedKeys ?? [])
  const requestedFocus = model.focusedKey ?? innerFocus
  const focused = (model.items.find(i => String(i.key) === String(requestedFocus) && !i.disabled) ?? model.items.find(i => !i.disabled))?.key
  const selected = model.selectedKeys ?? innerSelected
  const [announcement, setAnnouncement] = React.useState("")
  const count = model.items.length
  if (!Number.isInteger(model.rowSize) || model.rowSize < 1) throw new Error("rowSize must be a positive integer")
  if (new Set(model.items.map(i => String(i.key))).size !== count) throw new Error("Item keys must be unique")
  const index = Math.max(0, model.items.findIndex(i => String(i.key) === String(focused)))
  const root = React.useRef<HTMLDivElement>(null)
  const pending = React.useRef(false)
  const focus = (next: number) => {
    let candidate = Math.max(0, Math.min(count - 1, next))
    const step = next >= index ? 1 : -1
    while (candidate >= 0 && candidate < count && model.items[candidate].disabled) candidate += step
    if (candidate < 0 || candidate >= count) {
      candidate = Math.max(0, Math.min(count - 1, next))
      while (candidate >= 0 && candidate < count && model.items[candidate].disabled) candidate -= step
    }
    const item = model.items[candidate]
    if (!item) return
    pending.current = true
    if (model.focusedKey === undefined) setInnerFocus(item.key)
    model.onFocusedKeyChange?.(item.key)
  }
  React.useLayoutEffect(() => { if (pending.current) { pending.current = false; root.current?.querySelector<HTMLElement>("[data-focus-ref]")?.focus() } })
  const selectItem = (item: CalendarGridItem, source: "pointer" | "keyboard") => {
    if (item.disabled) return
    focus(model.items.findIndex(i => i.key === item.key))
    if (model.selectedKeys === undefined) setInnerSelected([item.key])
    model.onSelectedKeysChange?.([item.key], { item, source })
    // UI5 DayPicker.js uses LIST_ITEM_SELECTED; custom items include their label (overridable).
    setAnnouncement(model.texts?.selected?.(item.text) ?? `${item.text} Selected`)
  }
  const activate = (target: EventTarget, source: "pointer" | "keyboard") => {
    const key = (target as HTMLElement).closest<HTMLElement>("[data-key]")?.dataset.key
    const item = model.items.find(i => String(i.key) === key)
    if (item) selectItem(item, source)
  }
  const infos: CalendarItemInfo[] = model.items.map(item => ({ ...item, locale: context.locale,
    focused: String(item.key) === String(focused), selected: selected.includes(item.key), disabled: !!item.disabled,
    defaultContent: <span className="fiori-dp-yeartext">{item.text}</span>,
  }))
  const rows = Array.from({ length: Math.ceil(count / model.rowSize) }, (_, i) => infos.slice(i * model.rowSize, (i + 1) * model.rowSize))
  // UI5 MonthPicker.js:_onkeydown/_onkeyup: Enter on keydown, Space on keyup;
  // arrows move by item/row and Home/End by row. Custom item grids additionally mirror horizontal RTL keys.
  const tree = <CalendarPart partName="GridPicker" ref={root} data-picker="item" role="grid" aria-label={model.label} aria-readonly="false" aria-multiselectable="false" className="fiori-yp-root"
    onClick={e => activate(e.target, "pointer")}
    onKeyDownCapture={e => {
      const ctrl = e.ctrlKey || e.metaKey
      if (e.altKey || e.shiftKey) return
      const rtl = e.currentTarget.closest("[dir]")?.getAttribute("dir") === "rtl"
      let next: number | undefined
      if (e.key === "Enter" && !ctrl) activate(e.target, "keyboard")
      else if (e.key === " " && !ctrl) { /* selection on keyup */ }
      else if (e.key === "ArrowRight" && !ctrl) next = index + (rtl ? -1 : 1)
      else if (e.key === "ArrowLeft" && !ctrl) next = index + (rtl ? 1 : -1)
      else if (e.key === "ArrowUp" && !ctrl) next = index - model.rowSize
      else if (e.key === "ArrowDown" && !ctrl) next = index + model.rowSize
      else if (e.key === "Home") next = ctrl ? 0 : Math.floor(index / model.rowSize) * model.rowSize
      else if (e.key === "End") next = ctrl ? count - 1 : Math.min(count - 1, Math.floor(index / model.rowSize) * model.rowSize + model.rowSize - 1)
      else if ((e.key === "PageUp" || e.key === "PageDown") && !ctrl) context.page(e.key === "PageUp" ? -1 : 1)
      else return
      e.preventDefault()
      if (next !== undefined) focus(next)
    }} onKeyUpCapture={e => { if (e.key === " " && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) { e.preventDefault(); activate(e.target, "keyboard") } }}>
    {rows.map((row, r) => <CalendarPart partName="Row" rowKey={r} key={r} role="row" className="fiori-yp-interval-container">
      {row.map(item => <CalendarPart partName="Cell" item={item} key={item.key} role="gridcell" aria-label={item.text} aria-selected={selected.includes(item.key)} aria-disabled={item.disabled || undefined} tabIndex={String(item.key) === String(focused) ? 0 : -1} data-key={item.key} data-focus-ref={String(item.key) === String(focused) ? "" : undefined} style={{ width: `calc(100% / ${model.rowSize})` }} className={cn("fiori-yp-item", selected.includes(item.key) && "fiori-yp-item--selected", item.disabled && "fiori-yp-item--disabled")}>{item.defaultContent}</CalendarPart>)}
    </CalendarPart>)}
  </CalendarPart>
  return <><CalendarScope tree={tree} itemModel={{ kind: "item", rowSize: model.rowSize, items: infos, focusedKey: focused, selectedKeys: selected,
    focusItem: key => { const index = model.items.findIndex(i => String(i.key) === String(key)); if (index >= 0) focus(index) },
    selectItem: (key, source) => { const item = model.items.find(i => String(i.key) === String(key)); if (item) selectItem(item, source) },
  }}>{tree}</CalendarScope><span className="fiori-hidden-text" role="status" aria-live="polite">{announcement}</span></>
}
