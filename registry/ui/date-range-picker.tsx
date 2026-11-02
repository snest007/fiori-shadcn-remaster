import * as React from "react"

import { dayKey, formatDate, getWeekInfo, modifyDateBy, parseDate, resolvePattern, startOfDay } from "@/lib/fiori-dates"
import { appointment2 } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Calendar, type CalendarLabels, type SpecialDate } from "@/components/ui/calendar"
import { usePickerState } from "@/components/ui/date-picker"
import type { ValueState } from "@/components/ui/input"
import { examplePlaceholder, PickerField } from "@/components/ui/picker-field"

// Mirrors ui5-daterange-picker (Horizon, desktop): a DatePicker whose calendar selects a range.
// The value is "<start> <delimiter> <end>" in `formatPattern` (default the locale's medium date and "-").
// The first click marks the start (hovering previews the range), the second picks the end, commits and
// closes; reversed picks are ordered. Typed text is parsed leniently per part; one date alone is valid.
// In the field, PageUp/PageDown (Shift: month, Ctrl+Shift: year) change the date the caret is in.
// Gregorian calendar only.

type DateRangePickerProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "size" | "min" | "max"> & {
  /** The value as text: "<start> <delimiter> <end>". */
  value?: string
  defaultValue?: string
  /** Fires on commit with the formatted value and the dates (start, end; null when empty / invalid). */
  onValueChange?: (value: string, start: Date | null, end: Date | null) => void
  onInput?: (value: string) => void
  /** LDML pattern or "short" | "medium" | "long". Default "medium". */
  formatPattern?: string
  /** Separates the two dates. Default "-". */
  delimiter?: string
  locale?: string
  minDate?: Date
  maxDate?: Date
  hideWeekNumbers?: boolean
  firstDayOfWeek?: number
  specialDates?: SpecialDate[]
  valueState?: ValueState
  onValueStateChange?: (state: ValueState, valid: boolean) => void
  valueStateMessage?: React.ReactNode | null
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  wrapperClassName?: string
  calendarLabels?: Partial<CalendarLabels>
  openIconLabel?: string
  closeIconLabel?: string
  pickerLabel?: string
}

function DateRangePicker({
  value: valueProp,
  defaultValue,
  onValueChange,
  onInput,
  formatPattern,
  delimiter = "-",
  locale = "en-US",
  minDate,
  maxDate,
  hideWeekNumbers,
  firstDayOfWeek,
  specialDates,
  valueState: valueStateProp,
  onValueStateChange,
  valueStateMessage,
  open: openProp,
  defaultOpen,
  onOpenChange,
  placeholder,
  calendarLabels,
  openIconLabel,
  closeIconLabel,
  pickerLabel,
  wrapperClassName,
  ...props
}: DateRangePickerProps) {
  const pattern = resolvePattern(formatPattern, locale, "date")
  const inRange = (d: Date) => !(minDate && dayKey(d) < dayKey(minDate)) && !(maxDate && dayKey(d) > dayKey(maxDate))
  const parseOne = (t: string) => {
    const d = parseDate(t, pattern, locale, "date")
    return d && inRange(d) ? startOfDay(d) : null
  }
  /** Splits on the delimiter like UI5: a whole-text date is one date, otherwise the parts are halved. */
  const split = (text: string): string[] => {
    const t = text.trim()
    if (!t) return []
    if (parseOne(t)) return [t]
    const parts = t.split(delimiter)
    const half = parts.length / 2
    return [parts.slice(0, Math.ceil(half)).join(delimiter), parts.slice(Math.ceil(half)).join(delimiter)].map((p) => p.trim()).filter(Boolean)
  }
  /** undefined: empty; null: invalid; else the ordered dates. */
  const validate = (text: string) => {
    const parts = split(text)
    if (!parts.length) return undefined
    const dates = parts.map(parseOne)
    if (dates.some((d) => !d)) return null
    return (dates as Date[]).sort((a, b) => dayKey(a) - dayKey(b))
  }
  const s = usePickerState({ value: valueProp, defaultValue, valueState: valueStateProp, onValueStateChange, open: openProp, defaultOpen, onOpenChange, validate })
  const dates = validate(s.text) ?? []
  const build = (ds: Date[]) => ds.map((d) => formatDate(d, pattern, locale)).join(` ${delimiter} `)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const commit = (text: string) => {
    const ds = validate(text)
    const next = ds ? build(ds) : text
    s.updateState(ds !== null)
    s.setEditing(false)
    s.setValue(next)
    if (next !== s.value) onValueChange?.(next, ds?.[0] ?? null, ds?.[1] ?? ds?.[0] ?? null)
  }

  const year = new Date().getFullYear()
  const example = build([new Date(year, 11, 24), new Date(year, 11, 31)])

  return (
    <PickerField
      data-slot="date-range-picker"
      inputRef={inputRef}
      value={s.text}
      onTextChange={(t) => {
        s.setEditing(true)
        s.setText(t)
        onInput?.(t)
      }}
      onCommit={commit}
      open={s.open}
      onOpenChange={s.setOpen}
      valueState={s.valueState}
      valueStateMessage={valueStateMessage}
      icon={appointment2}
      openIconLabel={openIconLabel}
      closeIconLabel={closeIconLabel}
      roleDescription="Date Range Input"
      pickerLabel={pickerLabel ?? "Choose Date Range"}
      placeholder={placeholder ?? examplePlaceholder(example)}
      onPickerKeyDown={(e, inPopover) => {
        if (inPopover || s.open || (e.key !== "PageUp" && e.key !== "PageDown")) return
        const ctrl = e.ctrlKey || e.metaKey
        if (e.altKey || (ctrl && !e.shiftKey)) return
        e.preventDefault()
        const ds = validate(s.text)
        if (!ds) return
        const dir = e.key === "PageUp" ? 1 : -1
        const unit = ctrl && e.shiftKey ? "year" : e.shiftKey ? "month" : "day"
        const caret = inputRef.current?.selectionStart ?? 0
        // The date the caret is in changes (UI5: up to the delimiter = the start date).
        const i = ds.length === 2 && caret > s.text.indexOf(delimiter) ? 1 : 0
        const next = [...ds]
        next[i] = modifyDateBy(ds[i], dir, unit, true, minDate, maxDate)
        commit(build(next))
        requestAnimationFrame(() => inputRef.current?.setSelectionRange(caret, caret))
      }}
      // ui5-daterange-picker has a 15rem min-width.
      wrapperClassName={cn("min-w-60", wrapperClassName)}
      {...props}
    >
      {s.open && (
        <Calendar
          autoFocus
          selectionMode="range"
          locale={locale}
          minDate={minDate}
          maxDate={maxDate}
          hideWeekNumbers={hideWeekNumbers}
          firstDayOfWeek={firstDayOfWeek ?? getWeekInfo(locale).firstDay}
          specialDates={specialDates}
          labels={calendarLabels}
          defaultSelectedDates={dates}
          defaultFocusedDate={dates[0]}
          onSelectedDatesChange={(ds) => {
            if (ds.length < 2) return // the start alone isn't committed
            commit(build(ds))
            s.setOpen(false)
          }}
        />
      )}
    </PickerField>
  )
}

export { DateRangePicker, type DateRangePickerProps }
