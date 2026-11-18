// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { createPortal } from "react-dom"

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

type CalendarTexts = {
  selected: string
  previousButtonShortcut: string
  nextButtonShortcut: string
}

const defaultTexts: CalendarTexts = {
  selected: "Selected", // UI5 LIST_ITEM_SELECTED
  previousButtonShortcut: "Pagedown", // UI5 CALENDAR_HEADER_MONTH_PREVIOUS_BUTTON_SHORTCUT (pinned English bundle)
  nextButtonShortcut: "Pageup", // UI5 CALENDAR_HEADER_MONTH_NEXT_BUTTON_SHORTCUT (pinned English bundle)
}

/**
 * @accessibility Native aria-label / aria-labelledby / aria-describedby reach the calendar root. labels names header buttons, picker grids, week numbers and range/day descriptions; generated gridcells retain aria-selected and aria-disabled.
 * @accessibility Tab visits the header and one roving gridcell. Arrows move by day/week; Home/End move within the row; PageUp/Down changes month; Shift+PageUp/Down changes year. Enter/Space selects; F4 opens months and Shift+F4 opens years/year ranges. The current day-picker horizontal keys still use LTR order in RTL.
 */
type CalendarProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  selectionMode?: CalendarSelectionMode
  /** Selected days. In "range" mode: [start] while choosing, then [start, end]. */
  selectedDates?: Date[]
  defaultSelectedDates?: Date[]
  onSelectedDatesChange?: (dates: Date[]) => void
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
  /** Override the localized shortcuts on the owning previous/next buttons and their tooltips. */
  texts?: Partial<CalendarTexts>
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
  texts: textsProp,
  className,
  onKeyDown,
  ...props
}: CalendarProps) {
  const labels = { ...defaultLabels, ...labelsProp }
  const texts = { ...defaultTexts, ...textsProp }
  const [selectedInner, setSelectedInner] = React.useState<Date[]>(defaultSelectedDates ?? [])
  const selected = selectedProp ?? selectedInner
  const today = startOfDay(new Date())
  const [focusedInner, setFocusedInner] = React.useState<Date>(() => startOfDay(defaultFocusedDate ?? selected[0] ?? today))
  const focused = clampDay(startOfDay(focusedProp ?? focusedInner), minDate, maxDate)
  const [picker, setPicker] = React.useState<CalendarPicker>(initialPicker)
  /** Range mode with one day chosen: the hovered / focused day that previews the range end. */
  const [secondDate, setSecondDate] = React.useState<Date | null>(null)
  const [legendType, setLegendType] = React.useState<string | null>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [announcement, setAnnouncement] = React.useState({ text: "", sequence: 0 })
  const [announcementTarget, setAnnouncementTarget] = React.useState<HTMLElement | null>(null)
  React.useEffect(() => setAnnouncementTarget(rootRef.current?.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]') ?? document.body), [])
  React.useEffect(() => {
    if (!announcement.text) return
    // InvisibleMessage.js clears the message after 3000 ms; repeat selection
    // replaces the text node so the same text is announced again.
    const timer = setTimeout(() => setAnnouncement((old) => old.sequence === announcement.sequence ? { ...old, text: "" } : old), 3000)
    return () => clearTimeout(timer)
  }, [announcement])
  const announceSelected = () => setAnnouncement((old) => ({ text: texts.selected, sequence: old.sequence + 1 }))
  const [legendTexts, setLegendTexts] = React.useState<Record<string, string>>({})
  React.useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const update = () => {
      // Calendar.js:_specialCalendarDates finds each real legend item's type
      // and propagates its text to DayPicker's tooltip and accessible name.
      const next: Record<string, string> = {}
      for (const item of root.querySelectorAll<HTMLElement>('[data-slot="calendar-legend-item"]')) {
        const type = item.dataset.type
        if (type && next[type] === undefined) next[type] = item.querySelector('.fiori-calendar-legend-item-text')?.textContent ?? ""
      }
      setLegendTexts((previous) => JSON.stringify(previous) === JSON.stringify(next) ? previous : next)
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["data-type"] })
    return () => observer.disconnect()
  }, [legend])
  const yearRangeLabelId = React.useId()
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
    onSelectedDatesChange?.(dates)
  }
  const showPicker = (p: CalendarPicker) => {
    focusPending.current = true
    setPicker(p)
  }

  React.useEffect(() => {
    if (!focusPending.current) return
    focusPending.current = false
    rootRef.current?.querySelector<HTMLElement>(`[data-picker="${picker}"] [data-focus-ref]`)?.focus()
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
          else if (!inSel && !isDisabled(d)) {
            next.push(d)
            // DayPicker.js:_multipleSelection uses _toggleTimestampInSelection
            // inside the selected span: every newly toggled-on day announces.
            // Extending outside that span uses _addTimestampToSelection silently.
            if (toggle) announceSelected()
          }
        }
        setSelected(next)
      } else {
        // DayPicker.js:_toggleTimestampInSelection announces only additions.
        // _selectWeek deliberately does not announce.
        if (!has(day)) announceSelected()
        setSelected(has(day) ? selected.filter((s) => !isSameDay(s, day)) : [...selected, day])
      }
      return
    }
    // DayPicker.js:_updateSelectedDates announces every Single/Range activation,
    // including a repeated selection and either endpoint, assertively.
    announceSelected()
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

  const arrow = (dir: 1 | -1) => {
    const disabled = dir < 0 ? !hasPrev : !hasNext
    const label = dir < 0 ? prevLabel : nextLabel
    const shortcut = dir < 0 ? texts.previousButtonShortcut : texts.nextButtonShortcut
    return (
      <div
        data-slot={dir < 0 ? "calendar-previous" : "calendar-next"}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        // CalendarHeaderTemplate.js:previousButton/nextButton and Calendar.js:accInfo
        // expose the same label as description and the i18n shortcut for every picker.
        aria-description={label}
        aria-keyshortcuts={shortcut}
        aria-disabled={disabled || undefined}
        title={`${label} (${shortcut})`}
        className={cn("fiori-calheader-arrowbtn", disabled && "fiori-calheader-arrowbtn-disabled")}
        onMouseDown={(e) => {
          e.preventDefault()
          if (e.button === 0) page(dir)
        }}
        {...headerButton(() => page(dir))}
      >
        <Icon icon={dir < 0 ? slimArrowLeft : slimArrowRight} className="fiori-calheader-arrowicon" />
      </div>
    )
  }

  /* ---------------------------------------------------------------- pickers */
  const handleRootKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || e.key !== "F4" || e.ctrlKey || e.altKey || e.metaKey) return
    e.preventDefault()
    if (!e.shiftKey) {
      if (picker !== "month" && selectionLevel !== "year") showPicker("month")
    } else showPicker(picker !== "year" ? "year" : "yearrange")
  }

  return (
    <LegendContext.Provider value={{ setType: setLegendType, labels }}>
      <div ref={rootRef} data-slot="calendar" data-sap-ui-fastnavgroup="true" className={cn("fiori-calendar", className)} onKeyDown={handleRootKeyDown} {...props}>
        <div className="fiori-cal-root">
          <div className="fiori-calheader">
            <div className="fiori-calheader-root">
              {arrow(-1)}
              <div className="fiori-calheader-midcontainer">
                <div
                  data-slot="calendar-month-button"
                  role="button"
                  tabIndex={0}
                  hidden={picker !== "day" || selectionLevel !== "day"}
                  aria-label={labels.monthButton(monthText)}
                  // UI5 CalendarHeaderTemplate.js gives the purpose as both name and description.
                  aria-description={labels.monthButton(monthText)}
                  title={`${labels.monthButton(monthText)} (F4)`}
                  aria-keyshortcuts="F4"
                  className="fiori-calheader-arrowbtn fiori-calheader-middlebtn"
                  onClick={() => showPicker("month")}
                  {...headerButton(() => showPicker("month"))}
                >
                  <span>{monthText}</span>
                </div>
                <div
                  data-slot="calendar-year-button"
                  role="button"
                  tabIndex={0}
                  hidden={(picker !== "day" && picker !== "month") || selectionLevel === "year"}
                  aria-label={labels.yearButton(yearText)}
                  aria-description={labels.yearButton(yearText)}
                  title={`${labels.yearButton(yearText)} (Shift + F4)`}
                  aria-keyshortcuts="Shift+F4"
                  className="fiori-calheader-arrowbtn fiori-calheader-middlebtn"
                  onClick={() => showPicker("year")}
                  {...headerButton(() => showPicker("year"))}
                >
                  <span>{yearText}</span>
                </div>
                <div
                  data-slot="calendar-year-range-button"
                  role="button"
                  tabIndex={0}
                  hidden={picker !== "year"}
                  aria-label={labels.yearRangeButton(...rangeText)}
                  aria-description={labels.yearRangeButton(...rangeText)}
                  // UI5 CalendarHeaderTemplate.js / CALENDAR_HEADER_YEAR_RANGE_BUTTON: retain the purpose text while including the visible range in the name.
                  aria-labelledby={`${yearRangeLabelId}-value ${yearRangeLabelId}-purpose`}
                  title={`${labels.yearRangeButton(...rangeText)} (Shift + F4)`}
                  aria-keyshortcuts="Shift+F4"
                  className="fiori-calheader-arrowbtn fiori-calheader-middlebtn"
                  onClick={() => showPicker("yearrange")}
                  {...headerButton(() => showPicker("yearrange"))}
                >
                  <span id={`${yearRangeLabelId}-value`}>{`${rangeText[0]} - ${rangeText[1]}`}</span>
                  <span id={`${yearRangeLabelId}-purpose`} className="sr-only">{labels.yearRangeButton(...rangeText)}</span>
                </div>
              </div>
              {arrow(1)}
            </div>
          </div>
          <div className="fiori-cal-content">
            {picker === "day" && (
              <DayPicker
                focused={focused}
                today={today}
                selected={selected}
                secondDate={secondDate}
                selectionMode={selectionMode}
                locale={locale}
                firstDayOfWeek={firstDayOfWeek}
                hideWeekNumbers={hideWeekNumbers}
                specialDates={specialDates?.map((special) => ({ ...special, tooltip: special.tooltip ?? legendTexts[special.type] }))}
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
            {picker === "month" && (
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
            {picker === "year" && (
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
            {picker === "yearrange" && (
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
      {announcementTarget && createPortal(<span data-slot="calendar-announcement" data-owner={props.id} className="sr-only" role="alert" aria-live="assertive" aria-atomic="true"><span key={announcement.sequence}>{announcement.text}</span></span>, announcementTarget)}
    </LegendContext.Provider>
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
      if (plain) setFocused(modifyDateBy(focused, dir, "month"))
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

  return (
    <div
      data-picker="day"
      className="fiori-dp-root"
      data-hide-week-numbers={hideWeekNumbers ? "" : undefined}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onMouseDown={(e) => {
        const d = cellDate(e.target)
        if (d && !isDisabled(d)) setFocused(d, false)
      }}
      onClick={(e) => {
        const d = cellDate(e.target)
        if (d) selectDay(d, e.shiftKey)
      }}
      onMouseOver={(e) => {
        if (selectionMode !== "range" || selected.length !== 1) return
        const d = cellDate(e.target)
        if (d && !isSameDay(d, secondDate)) setSecondDate(d)
      }}
    >
      {/* DayPickerTemplate.js exposes selection on each cell, with no
          aria-multiselectable on the grid even for Multiple/Range. */}
      <div role="grid" aria-roledescription="Gregorian calendar" className="fiori-dp-content">
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
          const wn = weekNumber(week[6], firstDay, firstDayOfWeek === undefined ? weekInfo.minimalDays : 1)
          return (
            <div key={dayKey(week[0])} role="row" className="fiori-dp-weeks-row">
              {!hideWeekNumbers && (
                <div role="rowheader" aria-label={labels.calendarWeek(wn)} className="fiori-dp-weekname-container">
                  <span className="fiori-dp-weekname">{wn}</span>
                </div>
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
                return (
                  <div
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
                    <span className="fiori-dp-daytext">{d.getDate()}</span>
                    {special && <div className="fiori-dp-specialday" data-type={special.type} />}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
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
  const prefix = kind === "month" ? "mp" : kind === "year" ? "yp" : "yrp"
  const rows = Array.from({ length: Math.ceil(items.length / rowSize) }, (_, r) => items.slice(r * rowSize, r * rowSize + rowSize))
  const current = items.findIndex((i) => i.focused)
  const itemFor = (t: EventTarget) => {
    const key = (t as HTMLElement).closest<HTMLElement>("[data-key]")?.dataset.key
    return items.find((i) => String(i.key) === key)
  }
  const select = (t: EventTarget) => {
    const item = itemFor(t)
    if (item && !item.disabled) onSelect(item.date)
  }
  return (
    <div
      data-picker={kind}
      role="grid"
      aria-roledescription={label}
      aria-readonly="false"
      aria-multiselectable="false"
      className={`fiori-${prefix}-root`}
      onKeyDown={(e) => {
        const ctrl = e.ctrlKey || e.metaKey
        const plain = !ctrl && !e.altKey && !e.shiftKey
        let handled = true
        if (e.key === "Enter" && plain) select(e.target)
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
      onKeyUp={(e) => {
        if (e.key === " " && !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
          e.preventDefault()
          select(e.target)
        }
      }}
      onClick={(e) => select(e.target)}
    >
      {rows.map((row, r) => (
        <div key={r} role="row" className={kind === "month" ? "fiori-mp-quarter" : `fiori-${prefix}-interval-container`}>
          {row.map((item) => (
            <div
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
              <span className={kind === "month" ? "fiori-dp-monthtext" : "fiori-dp-yeartext"}>{item.text}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
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
    <div
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
    </div>
  )
}

type CalendarLegendItemProps = Omit<React.ComponentProps<"div">, "children"> & {
  type: CalendarLegendItemType
  text: string
}

function CalendarLegendItem({ type, text, className, ...props }: CalendarLegendItemProps) {
  // The inline wrapper stands for UI5's (inline) custom-element host: it decides how the legend's
  // columns balance, so it is kept.
  return (
    <span className="fiori-calendar-legend-item-host">
      <div data-slot="calendar-legend-item" data-type={type} role="listitem" tabIndex={-1} className={cn("fiori-calendar-legend-item", className)} {...props}>
        <div className="fiori-calendar-legend-item-box" />
        <div className="fiori-calendar-legend-item-text">{text}</div>
      </div>
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
  type CalendarTexts,
  type SpecialDate,
}
