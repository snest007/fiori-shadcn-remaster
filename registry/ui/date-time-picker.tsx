import * as React from "react"
import { normalizeLocaleDigits } from "@/lib/fiori-numbers"
import { useFioriTexts, useFioriLocale } from "@/lib/fiori-locale"

import { dayKey, getWeekInfo, modifyDateBy, parseDate, patternFields, resolvePattern, startOfDay } from "@/lib/fiori-dates"
import { useIsPhone } from "@/lib/use-is-phone"
import { SegmentedButton, SegmentedButtonItem } from "@/components/ui/segmented-button"
import { cn } from "@/lib/utils"
import { dateTime } from "@/lib/fiori-icons"
import { Button } from "@/components/ui/button"
import { Calendar, type CalendarLabels, type SpecialDate } from "@/components/ui/calendar"
import { formatPickerDate, parsePickerDate, usePickerState } from "@/components/ui/date-picker"
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
  phoneHeaderText?: string
  dateLabel?: string
  timeLabel?: string
  /** SAP-keyed accessible and native form-validation messages; component overrides win over the provider. */
  texts?: Partial<DateTimePickerTexts>
}

function DateTimePicker({
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
  submitLabel: submitLabelProp,
  cancelLabel: cancelLabelProp,
  calendarLabels,
  clockLabels,
  openIconLabel,
  closeIconLabel,
  pickerLabel,
  phoneHeaderText,
  dateLabel: dateLabelProp,
  timeLabel: timeLabelProp,
  wrapperClassName,
  ...props
}: DateTimePickerProps) {
  const { t, locale: resolvedLocale, localized, hasProvider } = useFioriLocale(localeProp)
  const locale = localized ? resolvedLocale : "en-US"
  // UI5 DateFormat formats Gregorian fields with Latin digits; translations retain the original locale.
  const dateLocale = new Intl.Locale(locale, { calendar: "gregory", numberingSystem: "latn" }).toString()
  const fieldTexts = useFioriTexts(defaultDateTimePickerTexts, defaultDateTimePickerTextsKeys, texts, localeProp)
  const submitLabel = submitLabelProp ?? t("TIMEPICKER_SUBMIT_BUTTON", "OK") // UI5 TIMEPICKER_SUBMIT_BUTTON
  const cancelLabel = cancelLabelProp ?? t("TIMEPICKER_CANCEL_BUTTON", "Cancel") // UI5 TIMEPICKER_CANCEL_BUTTON
  const dateLabel = dateLabelProp ?? t("DATETIME_PICKER_DATE_BUTTON", "Date") // UI5 DATETIME_PICKER_DATE_BUTTON
  const timeLabel = timeLabelProp ?? t("DATETIME_PICKER_TIME_BUTTON", "Time") // UI5 DATETIME_PICKER_TIME_BUTTON

  const phone = useIsPhone()
  const [phoneView, setPhoneView] = React.useState("date")
  // UI5 falls back to the locale's medium date-time pattern when the pattern has no hours.
  const resolved = resolvePattern(formatPattern, dateLocale, "datetime")
  const pattern = patternFields(resolved).hours ? resolved : resolvePattern("medium", dateLocale, "datetime")
  const inRange = (d: Date) => !(minDate && dayKey(d) < dayKey(minDate)) && !(maxDate && dayKey(d) > dayKey(maxDate))
  const validate = (text: string) => {
    if (!text.trim()) return undefined
    const d = parsePickerDate(normalizeLocaleDigits(text, locale), pattern, dateLocale, "datetime")
    return d && inRange(d) ? d : null
  }
  const s = usePickerState({ value: valueProp, defaultValue, valueState: valueStateProp, onValueStateChange, open: openProp, defaultOpen, onOpenChange, validate, controlledValueWins: phone })
  const lastValid = React.useRef<Date | null>(null)
  const pendingPhoneUpdate = React.useRef(false)
  const [, finishPhoneUpdate] = React.useReducer((version) => version + 1, 0)
  const cachePhoneCanonicalValue = () => {
    if (!phone) return
    pendingPhoneUpdate.current = true
    finishPhoneUpdate()
  }
  React.useLayoutEffect(() => {
    if (!pendingPhoneUpdate.current) return
    pendingPhoneUpdate.current = false
    // DateTimePicker.js/_updateValueAndFireEvents caches valid this.value AFTER
    // super fires consumer events. React batches those caller updates: read the
    // committed canonical prop here, only after an actual input/commit path.
    const canonical = s.value && parsePickerDate(normalizeLocaleDigits(s.value, locale), pattern, dateLocale, "datetime")
    if (canonical) lastValid.current = canonical
  })
  const current = validate(s.text)
  if (current && !phone) lastValid.current = current
  const [previewDay, setPreviewDay] = React.useState<Date | null>(null)
  const [previewTime, setPreviewTime] = React.useState<Date>(() => new Date())
  const fieldRef = React.useRef<HTMLInputElement>(null)
  const parsedForValidity = parsePickerDate(normalizeLocaleDigits(s.text, locale), pattern, dateLocale, "datetime")
  const formValidityMessage = !s.text ? (props.required ? fieldTexts.valueMissing(pattern) : "") : !parsedForValidity ? fieldTexts.invalidFormat(pattern) : minDate && dayKey(parsedForValidity) < dayKey(minDate) ? fieldTexts.rangeUnderflow(formatPickerDate(minDate, pattern, dateLocale)) : maxDate && dayKey(parsedForValidity) > dayKey(maxDate) ? fieldTexts.rangeOverflow(formatPickerDate(maxDate, pattern, dateLocale)) : ""
  // UI5 DateTimePicker.js/formValidityMessage localizes constraint validation, independently of valueStateMessage.
  React.useLayoutEffect(() => { fieldRef.current?.setCustomValidity(localized || hasProvider || texts ? formValidityMessage : "") }, [formValidityMessage, localized, hasProvider, texts])

  const commit = (text: string) => {
    const d = validate(text)
    const next = d ? formatPickerDate(d, pattern, dateLocale) : text
    s.updateState(d !== null)
    s.setEditing(false)
    s.setValue(next)
    if (d && !phone) lastValid.current = d
    if (next !== s.value) onValueChange?.(next, d ?? null)
    cachePhoneCanonicalValue()
  }
  const setOpen = (o: boolean) => {
    if (o) {
      setPhoneView("date")
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
    const next = formatPickerDate(d, pattern, dateLocale)
    // DatePicker.js/onBeforeRendering canonicalizes external values; native
    // DateTimePicker.js/_submitClick compares formatted strings, not timestamps
    // (seconds/milliseconds omitted by the format must not seed the cache).
    const accepted = s.value && parsePickerDate(normalizeLocaleDigits(s.value, locale), pattern, dateLocale, "datetime")
    const canonical = accepted ? formatPickerDate(accepted, pattern, dateLocale) : s.value
    if (!phone || canonical !== next) commit(next)
    setOpen(false)
    if (!phone) fieldRef.current?.focus()
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
        cachePhoneCanonicalValue()
      }}
      // The phone icon merely opens; external property echoes are not input changes.
      onCommit={(text) => { if (!phone || s.editing) commit(text) }}
      open={s.open}
      onOpenChange={setOpen}
      valueState={s.valueState}
      valueStateMessage={valueStateMessage}
      icon={dateTime}
      openIconLabel={openIconLabel ?? t("DATEPICKER_OPEN_ICON_TITLE", "Open Picker")}
      closeIconLabel={closeIconLabel ?? t("DATEPICKER_OPEN_ICON_TITLE_OPENED", "Close Picker")}
      roleDescription={fieldTexts.roleDescription}
      pickerLabel={pickerLabel ?? fieldTexts.pickerLabel(props["aria-label"] ?? "")}
      phoneHeaderText={phoneHeaderText ?? (localized || hasProvider || texts ? props["aria-label"] ?? fieldTexts.phoneHeaderText : undefined)}
      placeholder={placeholder ?? examplePlaceholder(formatPickerDate(new Date(year, 11, 31, 23, 59, 59), pattern, dateLocale), fieldTexts.placeholderPrefix)}
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
        commit(formatPickerDate(next, pattern, dateLocale))
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
          phone={phone} phoneView={phoneView} onPhoneViewChange={setPhoneView} dateLabel={dateLabel} timeLabel={timeLabel}
          locale={locale}
          pattern={pattern}
          day={previewDay}
          time={previewTime}
          onDayChange={(day) => {
            setPreviewDay(day)
            if (phone) {
              // DateTimePicker.js/onSelectedDatesChange: Date-only view has no clocks;
              // fall back to the last committed valid value, or the current time.
              if (phoneView === "date") setPreviewTime(lastValid.current ?? new Date())
              setPhoneView("time")
            }
          }}
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
  phone?: boolean
  phoneView?: string
  onPhoneViewChange?: (view: string) => void
  dateLabel?: string
  timeLabel?: string
}

/** The popover content: calendar | separator | clocks (ui5-dt-picker-content). */
function DateTimeSelection({
  locale: localeProp,
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
  phone, phoneView = "date", onPhoneViewChange, dateLabel: dateLabelProp, timeLabel: timeLabelProp,
}: DateTimeSelectionProps) {
  const { t, locale: resolvedLocale, localized } = useFioriLocale(localeProp)
  const locale = localized ? resolvedLocale : "en-US"
  // UI5 DateFormat formats Gregorian fields with Latin digits; translations retain the original locale.
  const dateLocale = new Intl.Locale(locale, { calendar: "gregory", numberingSystem: "latn" }).toString()
  const dateLabel = dateLabelProp ?? t("DATETIME_PICKER_DATE_BUTTON", "Date") // UI5 DATETIME_PICKER_DATE_BUTTON
  const timeLabel = timeLabelProp ?? t("DATETIME_PICKER_TIME_BUTTON", "Time") // UI5 DATETIME_PICKER_TIME_BUTTON

  const calendar = <Calendar
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
  return (
    <>{phone && <div data-slot="date-time-toggle" className="fiori-dt-picker-header"><SegmentedButton className="fiori-dt-picker-toggle-button" value={phoneView} onValueChange={onPhoneViewChange} aria-label={`${dateLabel} / ${timeLabel}`}><SegmentedButtonItem value="date">{dateLabel}</SegmentedButtonItem><SegmentedButtonItem data-phone-view="time" value="time">{timeLabel}</SegmentedButtonItem></SegmentedButton></div>}
    <div data-slot="date-time-selection" className={cn("fiori-dt-picker-content", phone && "fiori-dt-picker-content--phone")}>
      {phone ? <div hidden={phoneView === "time"}>{calendar}</div> : calendar}
      {!phone && <span className="fiori-dt-picker-separator" />}
      {(!phone || phoneView === "time") && <TimeSelectionClocks autoFocus={phone && phoneView === "time"} className="fiori-dt-time" value={time} onValueChange={onTimeChange} formatPattern={pattern} locale={locale} onSubmit={onSubmit} labels={clockLabels} />}
    </div></>
  )
}

export { DateTimePicker, DateTimeSelection, type DateTimePickerProps, type DateTimeSelectionProps }

type DateTimePickerTexts = { roleDescription: string; pickerLabel: (name: string) => string; phoneHeaderText: string; placeholderPrefix: string; invalidFormat: (pattern: string) => string; valueMissing: (pattern: string) => string; rangeUnderflow: (minimum: string) => string; rangeOverflow: (maximum: string) => string }
const defaultDateTimePickerTexts: DateTimePickerTexts = {
  roleDescription: "Date Time Input", // UI5 DATETIME_DESCRIPTION
  pickerLabel: (_name) => "Choose Date and Time", // UI5 DATETIMEPICKER_POPOVER_ACCESSIBLE_NAME; retain pre-E5 English default without a provider.
  phoneHeaderText: "Enter date", // UI5 DATEPICKER_MOBILE_HEADER_TITLE
  placeholderPrefix: "e.g.", // UI5 DATETIME_COMPONENTS_PLACEHOLDER_PREFIX
  invalidFormat: (pattern) => "This format is not supported. Enter the date and time in the following format: {0}.".replaceAll("{0}", pattern), // UI5 DATETIME_PATTERN_MISMATCH
  valueMissing: (pattern) => "Enter the date and time in the following format: {0}.".replaceAll("{0}", pattern), // UI5 DATETIME_VALUE_MISSING
  rangeUnderflow: (minimum) => "Enter a value higher than the minimum value of {0}.".replaceAll("{0}", minimum), // UI5 DATETIME_RANGEUNDERFLOW
  rangeOverflow: (maximum) => "Enter a value lower than the maximum value of {0}.".replaceAll("{0}", maximum), // UI5 DATETIME_RANGEOVERFLOW
}
const defaultDateTimePickerTextsKeys = { roleDescription: "DATETIME_DESCRIPTION", pickerLabel: "DATETIMEPICKER_POPOVER_ACCESSIBLE_NAME", phoneHeaderText: "DATEPICKER_MOBILE_HEADER_TITLE", placeholderPrefix: "DATETIME_COMPONENTS_PLACEHOLDER_PREFIX", invalidFormat: "DATETIME_PATTERN_MISMATCH", valueMissing: "DATETIME_VALUE_MISSING", rangeUnderflow: "DATETIME_RANGEUNDERFLOW", rangeOverflow: "DATETIME_RANGEOVERFLOW" } as const
