import * as React from "react"

import { dayKey, formatDate, getWeekInfo, modifyDateBy, parseDate, patternFields, resolvePattern, startOfDay } from "@/lib/fiori-dates"
import { cn } from "@/lib/utils"
import { dateTime } from "@/lib/fiori-icons"
import { Button } from "@/components/ui/button"
import { Calendar, type CalendarLabels, type SpecialDate } from "@/components/ui/calendar"
import { usePickerState } from "@/components/ui/date-picker"
import type { ValueState } from "@/components/ui/input"
import { examplePlaceholder, PickerField } from "@/components/ui/picker-field"
import { TimeSelectionClocks, type TimeSelectionLabels } from "@/components/ui/time-picker"

// Mirrors ui5-datetime-picker (Horizon, desktop): the DatePicker field with a popover that shows the
// calendar and the time clocks side by side, and an OK / Cancel footer. Picking a day only previews it;
// OK commits date + time, Cancel or Escape discard. The value is text in `formatPattern` (default the
// locale's medium date + time, "MMM d, y, h:mm:ss a" in en-US). Field keys as DatePicker (PageUp/Down
// change the day / month / year and keep the time). Gregorian calendar only.

type DateTimePickerProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "size" | "min" | "max"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string, date: Date | null) => void
  onInput?: (value: string) => void
  /** LDML pattern with date and time fields, or "short" | "medium" | "long". Default "medium". */
  formatPattern?: string
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
  submitLabel?: string
  cancelLabel?: string
  calendarLabels?: Partial<CalendarLabels>
  clockLabels?: Partial<TimeSelectionLabels>
  openIconLabel?: string
  closeIconLabel?: string
  pickerLabel?: string
}

function DateTimePicker({
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
  submitLabel = "OK",
  cancelLabel = "Cancel",
  calendarLabels,
  clockLabels,
  openIconLabel,
  closeIconLabel,
  pickerLabel,
  wrapperClassName,
  ...props
}: DateTimePickerProps) {
  // UI5 falls back to the locale's medium date-time pattern when the pattern has no hours.
  const resolved = resolvePattern(formatPattern, locale, "datetime")
  const pattern = patternFields(resolved).hours ? resolved : resolvePattern("medium", locale, "datetime")
  const inRange = (d: Date) => !(minDate && dayKey(d) < dayKey(minDate)) && !(maxDate && dayKey(d) > dayKey(maxDate))
  const validate = (text: string) => {
    if (!text.trim()) return undefined
    const d = parseDate(text, pattern, locale, "datetime")
    return d && inRange(d) ? d : null
  }
  const s = usePickerState({ value: valueProp, defaultValue, valueState: valueStateProp, onValueStateChange, open: openProp, defaultOpen, onOpenChange, validate })
  const lastValid = React.useRef<Date | null>(null)
  const current = validate(s.text)
  if (current) lastValid.current = current
  const [previewDay, setPreviewDay] = React.useState<Date | null>(null)
  const [previewTime, setPreviewTime] = React.useState<Date>(() => new Date())
  const fieldRef = React.useRef<HTMLInputElement>(null)

  const commit = (text: string) => {
    const d = validate(text)
    const next = d ? formatDate(d, pattern, locale) : text
    s.updateState(d !== null)
    s.setEditing(false)
    s.setValue(next)
    if (next !== s.value) onValueChange?.(next, d ?? null)
  }
  const setOpen = (o: boolean) => {
    if (o) {
      const base = validate(s.text) ?? lastValid.current
      setPreviewDay(base ? startOfDay(base) : null)
      setPreviewTime(base ?? new Date())
    }
    s.setOpen(o)
  }
  const submit = () => {
    if (!previewDay) return
    const d = new Date(previewDay)
    d.setHours(previewTime.getHours(), previewTime.getMinutes(), previewTime.getSeconds())
    commit(formatDate(d, pattern, locale))
    setOpen(false)
    fieldRef.current?.focus()
  }
  const year = new Date().getFullYear()

  return (
    <PickerField
      data-slot="date-time-picker"
      inputRef={fieldRef}
      value={s.text}
      onTextChange={(t) => {
        s.setEditing(true)
        s.setText(t)
        onInput?.(t)
      }}
      onCommit={commit}
      open={s.open}
      onOpenChange={setOpen}
      valueState={s.valueState}
      valueStateMessage={valueStateMessage}
      icon={dateTime}
      openIconLabel={openIconLabel}
      closeIconLabel={closeIconLabel}
      roleDescription="Date Time Input"
      pickerLabel={pickerLabel ?? "Choose Date and Time"}
      placeholder={placeholder ?? examplePlaceholder(formatDate(new Date(year, 11, 31, 23, 59, 59), pattern, locale))}
      popoverClassName="fiori-date-time-picker-popover"
      onPickerKeyDown={(e, inPopover) => {
        if (inPopover || s.open || (e.key !== "PageUp" && e.key !== "PageDown")) return
        const ctrl = e.ctrlKey || e.metaKey
        if (e.altKey || (ctrl && !e.shiftKey)) return
        e.preventDefault()
        const d = validate(s.text)
        if (!d) return
        const dir = e.key === "PageUp" ? 1 : -1
        const unit = ctrl && e.shiftKey ? "year" : e.shiftKey ? "month" : "day"
        const next = modifyDateBy(d, dir, unit, true, minDate, maxDate)
        next.setHours(d.getHours(), d.getMinutes(), d.getSeconds())
        commit(formatDate(next, pattern, locale))
      }}
      footer={
        <div className="fiori-dt-picker-footer">
          <Button variant="emphasized" className="fiori-dt-picker-ok" disabled={!previewDay} onClick={submit}>
            {submitLabel}
          </Button>
          <Button variant="transparent" onClick={() => setOpen(false)}>
            {cancelLabel}
          </Button>
        </div>
      }
      // ui5-datetime-picker has a 15rem min-width.
      wrapperClassName={cn("min-w-60", wrapperClassName)}
      {...props}
    >
      {s.open && (
        <DateTimeSelection
          locale={locale}
          pattern={pattern}
          day={previewDay}
          time={previewTime}
          onDayChange={setPreviewDay}
          onTimeChange={setPreviewTime}
          minDate={minDate}
          maxDate={maxDate}
          hideWeekNumbers={hideWeekNumbers}
          firstDayOfWeek={firstDayOfWeek}
          specialDates={specialDates}
          calendarLabels={calendarLabels}
          clockLabels={clockLabels}
          autoFocus
        />
      )}
    </PickerField>
  )
}

type DateTimeSelectionProps = {
  locale?: string
  /** Date-time pattern (decides the clocks). */
  pattern: string
  day: Date | null
  time: Date
  onDayChange: (d: Date) => void
  onTimeChange: (d: Date) => void
  minDate?: Date
  maxDate?: Date
  hideWeekNumbers?: boolean
  firstDayOfWeek?: number
  specialDates?: SpecialDate[]
  calendarLabels?: Partial<CalendarLabels>
  clockLabels?: Partial<TimeSelectionLabels>
  /** Enter in the clocks. */
  onSubmit?: () => void
  autoFocus?: boolean
}

/** The popover content: calendar | separator | clocks (ui5-dt-picker-content). */
function DateTimeSelection({
  locale = "en-US",
  pattern,
  day,
  time,
  onDayChange,
  onTimeChange,
  minDate,
  maxDate,
  hideWeekNumbers,
  firstDayOfWeek,
  specialDates,
  calendarLabels,
  clockLabels,
  onSubmit,
  autoFocus,
}: DateTimeSelectionProps) {
  return (
    <div data-slot="date-time-selection" className="fiori-dt-picker-content">
      <Calendar
        autoFocus={autoFocus}
        className="fiori-dt-cal"
        locale={locale}
        minDate={minDate}
        maxDate={maxDate}
        hideWeekNumbers={hideWeekNumbers}
        firstDayOfWeek={firstDayOfWeek ?? getWeekInfo(locale).firstDay}
        specialDates={specialDates}
        labels={calendarLabels}
        selectedDates={day ? [day] : []}
        defaultFocusedDate={day ?? undefined}
        onSelectedDatesChange={(ds) => ds.length && onDayChange(ds[ds.length - 1])}
      />
      <span className="fiori-dt-picker-separator" />
      <TimeSelectionClocks className="fiori-dt-time" value={time} onValueChange={onTimeChange} formatPattern={pattern} locale={locale} onSubmit={onSubmit} labels={clockLabels} />
    </div>
  )
}

export { DateTimePicker, DateTimeSelection, type DateTimePickerProps, type DateTimeSelectionProps }
