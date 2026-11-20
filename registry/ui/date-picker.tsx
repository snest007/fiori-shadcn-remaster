// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { normalizeLocaleDigits } from "@/lib/fiori-numbers"
import { useFioriTexts, useFioriLocale } from "@/lib/fiori-locale"

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
import { useIsPhone } from "@/lib/use-is-phone"
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

/**
 * @accessibility Native aria-label / aria-labelledby / aria-describedby land on the input; id connects a Label. pickerLabel names the popup, calendarLabels names calendar navigation and dates, and valueStateMessage describes focused input.
 * @accessibility F4 or Alt+Down/Up opens the calendar; Escape or Alt+Down/Up closes and returns focus to the input. PageUp/Down changes day, Shift adds month, Ctrl/Cmd+Shift adds year; calendar arrows and Enter/Space select.
 */
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
  phoneHeaderText?: string
  cancelLabel?: string
  /** SAP-keyed accessible and native form-validation messages; component overrides win over the provider. */
  texts?: Partial<DatePickerTexts>
}

/** UI5 DateFormat uses the complete CLDR month name (for example zh-CN MMM is "3月"). */
function formatPickerDate(date: Date, pattern: string, locale: string) {
  const contextual = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).formatToParts(date).find(part => part.type === "month")?.value
  const standalone = new Intl.DateTimeFormat(locale, { month: "short" }).format(date)
  // Intl can put a month suffix in a separate literal when a day is present. The
  // existing LDML helper reads only the month part; using L retains that suffix.
  const completePattern = contextual && /^\d+$/.test(contextual) && standalone !== contextual
    ? pattern.replace(/'(?:''|[^'])*'|M{3,5}/g, token => token.startsWith("'") ? token : "L".repeat(token.length)) : pattern
  return formatDate(date, completePattern, locale)
}

/** Parse the complete CLDR short month before the generic helper's shorter contextual candidate. */
function parsePickerDate(text: string, pattern: string, locale: string, kind: "date" | "time" | "datetime" = "date") {
  const sample = new Date(2024, 2, 1)
  const contextual = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).formatToParts(sample).find(part => part.type === "month")?.value
  const standalone = new Intl.DateTimeFormat(locale, { month: "short" }).format(sample)
  // UI5 DateFormat.parse uses complete CLDR month names. The shared parser tries a
  // numeric contextual name first, so represent its missing suffix as an LDML literal.
  const suffix = contextual && /^\d+$/.test(contextual) && standalone.startsWith(contextual) ? standalone.slice(contextual.length) : ""
  const completePattern = suffix ? pattern.replace(/'(?:''|[^'])*'|M+/g, token => token === "MMM" ? `M'${suffix.replaceAll("'", "''")}'` : token) : pattern
  return parseDate(text, completePattern, locale, kind) ?? parseDate(text, pattern, locale, kind)
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
  controlledValueWins = false,
}: {
  value?: string
  defaultValue?: string
  valueState?: ValueState
  onValueStateChange?: (state: ValueState, valid: boolean) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  validate: (text: string) => T | null | undefined
  /** Phone callers retain authority over the public value after committing a draft. */
  controlledValueWins?: boolean
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
    setText(controlledValueWins && valueProp !== undefined ? valueProp : v)
  }
  return { value, text, setText, editing, setEditing, valueState, open, setOpen, updateState, setValue }
}

function DatePicker({
  value: valueProp,
  defaultValue,
  onValueChange,
  onInput,
  formatPattern,
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
  cancelLabel,
  ref,
  ...props
}: DatePickerProps) {
  const { t, locale: resolvedLocale, localized, hasProvider } = useFioriLocale(localeProp)
  const locale = localized ? resolvedLocale : "en-US"
  // UI5 DateFormat formats Gregorian fields with Latin digits; translations retain the original locale.
  const dateLocale = new Intl.Locale(locale, { calendar: "gregory", numberingSystem: "latn" }).toString()
  const fieldTexts = useFioriTexts(defaultDatePickerTexts, defaultDatePickerTextsKeys, texts, localeProp)

  const phone = useIsPhone()
  const changeTarget = React.useRef<HTMLInputElement>(null)
  React.useImperativeHandle(ref, () => changeTarget.current!, [])
  const pattern = resolvePattern(formatPattern, dateLocale, "date")
  const parse = (text: string) => parsePickerDate(normalizeLocaleDigits(text, locale), pattern, dateLocale, "date")
  const inRange = (d: Date) => !(minDate && dayKey(d) < dayKey(minDate)) && !(maxDate && dayKey(d) > dayKey(maxDate))
  /** undefined: empty; null: invalid. */
  const validate = (text: string) => {
    if (!text.trim()) return undefined
    const d = parse(text)
    return d && inRange(d) ? startOfDay(d) : null
  }
  const s = usePickerState({ value: valueProp, defaultValue, valueState: valueStateProp, onValueStateChange, open: openProp, defaultOpen, onOpenChange, validate, controlledValueWins: phone })
  const date = validate(s.text) ?? null
  const parsedForValidity = parsePickerDate(normalizeLocaleDigits(s.text, locale), pattern, dateLocale, "date")
  const formValidityMessage = !s.text ? (props.required ? fieldTexts.valueMissing(pattern) : "") : !parsedForValidity ? fieldTexts.invalidFormat(pattern) : minDate && dayKey(parsedForValidity) < dayKey(minDate) ? fieldTexts.rangeUnderflow(formatPickerDate(minDate, pattern, dateLocale)) : maxDate && dayKey(parsedForValidity) > dayKey(maxDate) ? fieldTexts.rangeOverflow(formatPickerDate(maxDate, pattern, dateLocale)) : ""
  // UI5 DatePicker.js/formValidityMessage localizes constraint validation, independently of valueStateMessage.
  React.useLayoutEffect(() => { changeTarget.current?.setCustomValidity(localized || hasProvider || texts ? formValidityMessage : "") }, [formValidityMessage, localized, hasProvider, texts])
  const fields = patternFields(pattern)
  const selectionLevel = fields.day ? "day" : fields.month ? "month" : "year"

  const commit = (text: string) => {
    const d = validate(text)
    const next = d ? formatPickerDate(d, pattern, dateLocale) : text
    s.updateState(d !== null)
    s.setEditing(false)
    s.setValue(next)
    if (next !== s.value) {
      onValueChange?.(next, d ?? null)
    }
    // UI5 DatePicker.js/onSelectedDatesChange and _updateValueAndFireEvents emit
    // the committed change even for the same date, before closing the picker.
    changeTarget.current?.dispatchEvent(new Event("fiori-control-change", { bubbles: true }))
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
      openIconLabel={openIconLabel ?? t("DATEPICKER_OPEN_ICON_TITLE", "Open Picker")}
      closeIconLabel={closeIconLabel ?? t("DATEPICKER_OPEN_ICON_TITLE_OPENED", "Close Picker")}
      roleDescription={fieldTexts.roleDescription}
      pickerLabel={pickerLabel ?? fieldTexts.pickerLabel(props["aria-label"] ?? "")}
      phoneHeaderText={phoneHeaderText ?? (localized || hasProvider || texts ? props["aria-label"] ?? fieldTexts.phoneHeaderText : undefined)} cancelLabel={cancelLabel}
      placeholder={placeholder ?? examplePlaceholder(formatPickerDate(yearEnd, pattern, dateLocale), fieldTexts.placeholderPrefix)}
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
        commit(formatPickerDate(modifyDateBy(current, dir, unit, true, minDate, maxDate), pattern, dateLocale))
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
            commit(formatPickerDate(d, pattern, dateLocale))
            s.setOpen(false)
          }}
        />
      )}
    </PickerField>
  )
}

export { DatePicker, usePickerState, formatPickerDate, parsePickerDate, type DatePickerProps, type DatePickerTexts }

type DatePickerTexts = { roleDescription: string; pickerLabel: (name: string) => string; phoneHeaderText: string; placeholderPrefix: string; invalidFormat: (pattern: string) => string; valueMissing: (pattern: string) => string; rangeUnderflow: (minimum: string) => string; rangeOverflow: (maximum: string) => string }
const defaultDatePickerTexts: DatePickerTexts = {
  roleDescription: "Date Input", // UI5 DATEPICKER_DATE_DESCRIPTION
  pickerLabel: (_name) => "Choose Date", // UI5 DATEPICKER_POPOVER_ACCESSIBLE_NAME; retain pre-E5 English default without a provider.
  phoneHeaderText: "Enter date", // UI5 DATEPICKER_MOBILE_HEADER_TITLE
  placeholderPrefix: "e.g.", // UI5 DATETIME_COMPONENTS_PLACEHOLDER_PREFIX
  invalidFormat: (pattern) => "This format is not supported. Enter the date and time range in the following format: {0}.".replaceAll("{0}", pattern), // UI5 DATEPICKER_PATTERN_MISSMATCH
  valueMissing: (pattern) => "Enter the date in the following format: {0}.".replaceAll("{0}", pattern), // UI5 DATEPICKER_VALUE_MISSING
  rangeUnderflow: (minimum) => "Enter a date higher than the minimum value of {0}.".replaceAll("{0}", minimum), // UI5 DATEPICKER_RANGE_UNDERFLOW
  rangeOverflow: (maximum) => "Enter a date lower than the maximum value of {0}.".replaceAll("{0}", maximum), // UI5 DATEPICKER_RANGE_OVERFLOW
}
const defaultDatePickerTextsKeys = { roleDescription: "DATEPICKER_DATE_DESCRIPTION", pickerLabel: "DATEPICKER_POPOVER_ACCESSIBLE_NAME", phoneHeaderText: "DATEPICKER_MOBILE_HEADER_TITLE", placeholderPrefix: "DATETIME_COMPONENTS_PLACEHOLDER_PREFIX", invalidFormat: "DATEPICKER_PATTERN_MISSMATCH", valueMissing: "DATEPICKER_VALUE_MISSING", rangeUnderflow: "DATEPICKER_RANGE_UNDERFLOW", rangeOverflow: "DATEPICKER_RANGE_OVERFLOW" } as const
