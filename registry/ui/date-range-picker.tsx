import * as React from "react"
import { normalizeLocaleDigits } from "@/lib/fiori-numbers"
import { useFioriTexts, useFioriLocale } from "@/lib/fiori-locale"

import { dayKey, getWeekInfo, modifyDateBy, parseDate, resolvePattern, startOfDay } from "@/lib/fiori-dates"
import { appointment2 } from "@/lib/fiori-icons"
import { useIsPhone } from "@/lib/use-is-phone"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Calendar, type CalendarLabels, type SpecialDate } from "@/components/ui/calendar"
import { formatPickerDate, parsePickerDate, usePickerState } from "@/components/ui/date-picker"
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
  phoneHeaderText?: string
  submitLabel?: string
  cancelLabel?: string
  /** Phone completed ranges update the value before OK; OK alone confirms the change. */
  onConfirm?: (value: string, start: Date, end: Date) => void
  /** SAP-keyed accessible and native form-validation messages; component overrides win over the provider. */
  texts?: Partial<DateRangePickerTexts>
}

function DateRangePicker({
  value: valueProp,
  defaultValue,
  onValueChange,
  onInput,
  formatPattern,
  delimiter = "-",
  locale: localeProp,
  minDate,
  maxDate,
  hideWeekNumbers,
  firstDayOfWeek,
  specialDates,
  valueState: valueStateProp,
  onValueStateChange,
  valueStateMessage,
  texts,
  open: openProp,
  defaultOpen,
  onOpenChange,
  placeholder,
  calendarLabels,
  openIconLabel,
  closeIconLabel,
  pickerLabel,
  phoneHeaderText,
  submitLabel: submitLabelProp,
  cancelLabel: cancelLabelProp,
  onConfirm,
  wrapperClassName,
  ...props
}: DateRangePickerProps) {
  const { t, locale: resolvedLocale, localized, hasProvider } = useFioriLocale(localeProp)
  const locale = localized ? resolvedLocale : "en-US"
  // UI5 DateFormat formats Gregorian fields with Latin digits; translations retain the original locale.
  const dateLocale = new Intl.Locale(locale, { calendar: "gregory", numberingSystem: "latn" }).toString()
  const fieldTexts = useFioriTexts(defaultDateRangePickerTexts, defaultDateRangePickerTextsKeys, texts, localeProp)
  const submitLabel = submitLabelProp ?? t("CALENDAR_FOOTER_OK_BUTTON", "OK") // UI5 CALENDAR_FOOTER_OK_BUTTON
  const cancelLabel = cancelLabelProp ?? t("CALENDAR_FOOTER_CANCEL_BUTTON", "Cancel") // UI5 CALENDAR_FOOTER_CANCEL_BUTTON

  const phone = useIsPhone()
  const pattern = resolvePattern(formatPattern, dateLocale, "date")
  const inRange = (d: Date) => !(minDate && dayKey(d) < dayKey(minDate)) && !(maxDate && dayKey(d) > dayKey(maxDate))
  const parseOne = (t: string) => {
    const d = parsePickerDate(normalizeLocaleDigits(t, locale), pattern, dateLocale, "date")
    return d && inRange(d) ? startOfDay(d) : null
  }
  /** Splits on the delimiter like UI5: a whole-text date is one date, otherwise the parts are halved. */
  const split = (text: string): string[] => {
    const t = text.trim()
    if (!t) return []
    if (parsePickerDate(normalizeLocaleDigits(t, locale), pattern, dateLocale, "date")) return [t]
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
  const s = usePickerState({ value: valueProp, defaultValue, valueState: valueStateProp, onValueStateChange, open: openProp, defaultOpen, onOpenChange, validate, controlledValueWins: phone })
  const dates = validate(s.text) ?? []
  const build = (ds: Date[]) => ds.map((d) => formatPickerDate(d, pattern, dateLocale)).join(` ${delimiter} `)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const validityDates = split(s.text).map(text => parsePickerDate(normalizeLocaleDigits(text, locale), pattern, dateLocale, "date"))
  const parsedForValidity = validityDates.length && validityDates.every(Boolean) ? validityDates as Date[] : null
  const formValidityMessage = !s.text ? (props.required ? fieldTexts.valueMissing(pattern) : "") : !parsedForValidity ? fieldTexts.invalidFormat(pattern) : minDate && parsedForValidity.some(date => dayKey(date) < dayKey(minDate)) ? fieldTexts.rangeUnderflow(formatPickerDate(minDate, pattern, dateLocale)) : maxDate && parsedForValidity.some(date => dayKey(date) > dayKey(maxDate)) ? fieldTexts.rangeOverflow(formatPickerDate(maxDate, pattern, dateLocale)) : ""
  // UI5 DateRangePicker.js/formValidityMessage localizes constraint validation, independently of valueStateMessage.
  React.useLayoutEffect(() => { inputRef.current?.setCustomValidity(localized || hasProvider || texts ? formValidityMessage : "") }, [formValidityMessage, localized, hasProvider, texts])

  const pendingCaret = React.useRef<number | null>(null)
  React.useLayoutEffect(() => {
    if (pendingCaret.current === null) return
    const c = pendingCaret.current
    pendingCaret.current = null
    inputRef.current?.setSelectionRange(c, c)
  })
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
      openIconLabel={openIconLabel ?? t("DATEPICKER_OPEN_ICON_TITLE", "Open Picker")}
      closeIconLabel={closeIconLabel ?? t("DATEPICKER_OPEN_ICON_TITLE_OPENED", "Close Picker")}
      roleDescription={fieldTexts.roleDescription}
      pickerLabel={pickerLabel ?? fieldTexts.pickerLabel(props["aria-label"] ?? "")}
      phoneHeaderText={phoneHeaderText ?? (localized || hasProvider || texts ? props["aria-label"] ?? fieldTexts.phoneHeaderText : undefined)}
      phoneFooter={phone ? <div className="fiori-dt-picker-footer"><Button variant="emphasized" className="fiori-dt-picker-ok" disabled={dates.length < 2} onClick={() => { if (dates.length > 1) onConfirm?.(s.value, dates[0], dates[1]); s.setOpen(false) }}>{submitLabel}</Button><Button variant="transparent" onClick={() => s.setOpen(false)}>{cancelLabel}</Button></div> : undefined}
      placeholder={placeholder ?? examplePlaceholder(example, fieldTexts.placeholderPrefix)}
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
        // Restore the caret right after React writes the new value (a later rAF could undo a caret move
        // the user made in between, so the next PageUp would change the wrong date).
        pendingCaret.current = caret
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
            // DateRangePicker.js/onSelectedDatesChange updates completed ranges on phone,
            // but waits for OK before emitting change; Cancel does not undo that public value.
            if (!phone) s.setOpen(false)
          }}
        />
      )}
    </PickerField>
  )
}

export { DateRangePicker, type DateRangePickerProps, type DateRangePickerTexts }

type DateRangePickerTexts = { roleDescription: string; pickerLabel: (name: string) => string; phoneHeaderText: string; placeholderPrefix: string; invalidFormat: (pattern: string) => string; valueMissing: (pattern: string) => string; rangeUnderflow: (minimum: string) => string; rangeOverflow: (maximum: string) => string }
const defaultDateRangePickerTexts: DateRangePickerTexts = {
  roleDescription: "Date Range Input", // UI5 DATERANGE_DESCRIPTION
  pickerLabel: (_name) => "Choose Date Range", // UI5 DATERANGEPICKER_POPOVER_ACCESSIBLE_NAME; retain pre-E5 English default without a provider.
  phoneHeaderText: "Enter date", // UI5 DATEPICKER_MOBILE_HEADER_TITLE
  placeholderPrefix: "e.g.", // UI5 DATETIME_COMPONENTS_PLACEHOLDER_PREFIX
  invalidFormat: (pattern) => "This format is not supported. Enter the date in the following format: {0} - {0}.".replaceAll("{0}", pattern), // UI5 DATERANGE_PATTERN_MISMATCH
  valueMissing: (pattern) => "Enter the date range in the following format: {0} - {0}.".replaceAll("{0}", pattern), // UI5 DATERANGE_VALUE_MISSING
  rangeUnderflow: (minimum) => "Enter a value higher than the minimum value of {0}.".replaceAll("{0}", minimum), // UI5 DATERANGE_UNDERFLOW
  rangeOverflow: (maximum) => "Enter a value lower than the maximum value of {0}.".replaceAll("{0}", maximum), // UI5 DATERANGE_OVERFLOW
}
const defaultDateRangePickerTextsKeys = { roleDescription: "DATERANGE_DESCRIPTION", pickerLabel: "DATERANGEPICKER_POPOVER_ACCESSIBLE_NAME", phoneHeaderText: "DATEPICKER_MOBILE_HEADER_TITLE", placeholderPrefix: "DATETIME_COMPONENTS_PLACEHOLDER_PREFIX", invalidFormat: "DATERANGE_PATTERN_MISMATCH", valueMissing: "DATERANGE_VALUE_MISSING", rangeUnderflow: "DATERANGE_UNDERFLOW", rangeOverflow: "DATERANGE_OVERFLOW" } as const
