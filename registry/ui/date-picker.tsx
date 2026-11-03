import * as React from "react"

import {
  dayKey,
  formatDate,
  getWeekInfo,
  modifyDateBy,
  parseDate,
  patternFields,
  resolvePattern,
  startOfDay,
} from "@/lib/fiori-dates"
import { appointment2 } from "@/lib/fiori-icons"
import { Calendar, type CalendarLabels, type SpecialDate } from "@/components/ui/calendar"
import type { ValueState } from "@/components/ui/input"
import { examplePlaceholder, PickerField } from "@/components/ui/picker-field"

// Mirrors ui5-date-picker (Horizon, desktop): a text field with a calendar value help.
// The value is a string in `formatPattern` (default: the locale's medium date, "MMM d, y" in en-US).
// Typed text is parsed leniently (the pattern, the locale's short/medium/long styles, ISO yyyy-MM-dd),
// normalized to the pattern on commit; text that isn't a date in [minDate, maxDate] turns the value state
// negative (and back to none once valid), like UI5. Keyboard in the field: F4 / Alt+↓ / Alt+↑ open the
// calendar, PageUp/PageDown change the day by one, Shift+PageUp/Down the month, Ctrl+Shift+PageUp/Down the
// year. In the calendar the Calendar keyboard applies; Enter/Space/click select and close; Escape closes.
// Gregorian calendar only.

type DatePickerProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "size" | "min" | "max"> & {
  /** The value as text in `formatPattern`. */
  value?: string
  defaultValue?: string
  /** Fires on commit (Enter, blur, PageUp/Down, picking a day) with the formatted value and the date (null if empty or invalid). */
  onValueChange?: (value: string, date: Date | null) => void
  /** Fires on every keystroke. */
  onInput?: (value: string) => void
  /** LDML pattern ("dd.MM.yyyy") or "short" | "medium" | "long" (locale styles). Default "medium". */
  formatPattern?: string
  /** BCP 47 locale for names, patterns and the first day of the week. Default "en-US". */
  locale?: string
  minDate?: Date
  maxDate?: Date
  hideWeekNumbers?: boolean
  firstDayOfWeek?: number
  specialDates?: SpecialDate[]
  /** Set from outside, or leave it to the picker: it switches to "negative" for invalid text and back. */
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
  /** Accessible name of the popover. */
  pickerLabel?: string
}

/** Shared state for the date-like pickers: value (controlled or not), auto value state, open state. */
function usePickerState<T>({
  value: valueProp,
  defaultValue,
  valueState: valueStateProp,
  onValueStateChange,
  open: openProp,
  defaultOpen,
  onOpenChange,
  validate,
}: {
  value?: string
  defaultValue?: string
  valueState?: ValueState
  onValueStateChange?: (state: ValueState, valid: boolean) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  validate: (text: string) => T | null | undefined
}) {
  const [inner, setInner] = React.useState(defaultValue ?? "")
  const value = valueProp ?? inner
  const [text, setText] = React.useState(value)
  const [editing, setEditing] = React.useState(false)
  React.useEffect(() => {
    if (!editing) setText(value)
  }, [value, editing])
  const [autoState, setAutoState] = React.useState<ValueState>(() => (value && validate(value) === null ? "negative" : "none"))
  // UI5 only flips the state between negative and none; any other state passed in stays.
  const valueState = autoState === "negative" ? "negative" : (valueStateProp ?? "none")
  const [openInner, setOpenInner] = React.useState(!!defaultOpen)
  const open = openProp ?? openInner
  const setOpen = (o: boolean) => {
    if (openProp === undefined) setOpenInner(o)
    onOpenChange?.(o)
  }
  const updateState = (valid: boolean) => {
    const next: ValueState = valid ? "none" : "negative"
    if (next !== autoState) {
      setAutoState(next)
      onValueStateChange?.(valid ? (valueStateProp ?? "none") : "negative", valid)
    }
  }
  const setValue = (v: string) => {
    if (valueProp === undefined) setInner(v)
    setText(v)
  }
  return { value, text, setText, editing, setEditing, valueState, open, setOpen, updateState, setValue }
}

function DatePicker({
  value: valueProp,
  defaultValue,
  onValueChange,
  onInput,
  formatPattern,
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
  ref,
  ...props
}: DatePickerProps) {
  const changeTarget = React.useRef<HTMLInputElement>(null)
  React.useImperativeHandle(ref, () => changeTarget.current!, [])
  const pattern = resolvePattern(formatPattern, locale, "date")
  const parse = (text: string) => parseDate(text, pattern, locale, "date")
  const inRange = (d: Date) => !(minDate && dayKey(d) < dayKey(minDate)) && !(maxDate && dayKey(d) > dayKey(maxDate))
  /** undefined: empty; null: invalid. */
  const validate = (text: string) => {
    if (!text.trim()) return undefined
    const d = parse(text)
    return d && inRange(d) ? startOfDay(d) : null
  }
  const s = usePickerState({ value: valueProp, defaultValue, valueState: valueStateProp, onValueStateChange, open: openProp, defaultOpen, onOpenChange, validate })
  const date = validate(s.text) ?? null
  const fields = patternFields(pattern)
  const selectionLevel = fields.day ? "day" : fields.month ? "month" : "year"

  const commit = (text: string) => {
    const d = validate(text)
    const next = d ? formatDate(d, pattern, locale) : text
    s.updateState(d !== null)
    s.setEditing(false)
    s.setValue(next)
    if (next !== s.value) {
      onValueChange?.(next, d ?? null)
      // UI5 DatePicker.js/_updateValueAndFireEvents emits the committed change.
      changeTarget.current?.dispatchEvent(new Event("fiori-control-change", { bubbles: true }))
    }
  }

  const yearEnd = new Date(new Date().getFullYear(), 11, 31)

  return (
    <PickerField
      data-slot="date-picker"
      inputRef={changeTarget}
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
      roleDescription="Date Input"
      pickerLabel={pickerLabel ?? "Choose Date"}
      placeholder={placeholder ?? examplePlaceholder(formatDate(yearEnd, pattern, locale))}
      onPickerKeyDown={(e, inPopover) => {
        if (inPopover || s.open || e.key !== "PageUp" && e.key !== "PageDown") return
        // UI5 DatePicker: PageUp/Down ±1 day, +Shift month, +Ctrl+Shift year (only with a valid value).
        const ctrl = e.ctrlKey || e.metaKey
        if (e.altKey || (ctrl && !e.shiftKey)) return
        e.preventDefault()
        const current = validate(s.text)
        if (!current) return
        const dir = e.key === "PageUp" ? 1 : -1
        const unit = ctrl && e.shiftKey ? "year" : e.shiftKey ? "month" : "day"
        commit(formatDate(modifyDateBy(current, dir, unit, true, minDate, maxDate), pattern, locale))
      }}
      {...props}
    >
      {s.open && (
        <Calendar
          autoFocus
          className="fiori-date-picker__calendar"
          locale={locale}
          minDate={minDate}
          maxDate={maxDate}
          hideWeekNumbers={hideWeekNumbers}
          firstDayOfWeek={firstDayOfWeek ?? getWeekInfo(locale).firstDay}
          specialDates={specialDates}
          selectionLevel={selectionLevel}
          labels={calendarLabels}
          selectedDates={date ? [date] : []}
          defaultFocusedDate={date ?? undefined}
          onSelectedDatesChange={(dates) => {
            const d = dates[dates.length - 1]
            if (!d) return
            commit(formatDate(d, pattern, locale))
            s.setOpen(false)
          }}
        />
      )}
    </PickerField>
  )
}

export { DatePicker, usePickerState, type DatePickerProps }
