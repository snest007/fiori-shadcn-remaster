// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { normalizeLocaleDigits } from "@/lib/fiori-numbers"
import { useFioriTexts, useFioriLocale } from "@/lib/fiori-locale"
import { useIsPhone } from "@/lib/use-is-phone"

import { getDayPeriods, patternFields, resolvePattern } from "@/lib/fiori-dates"
import { timeEntryRequest } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { formatPickerDate, parsePickerDate, usePickerState } from "@/components/ui/date-picker"
import { Input, useValueStateTexts, type ValueState } from "@/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { examplePlaceholder, PickerField, PickerPopoverBody } from "@/components/ui/picker-field"
import { SegmentedButton, SegmentedButtonItem } from "@/components/ui/segmented-button"

// Mirrors ui5-time-picker (Horizon, desktop) and its popover content ui5-time-selection-clocks
// (UI5 2.x's clock-dial model): a row of toggle "spin" buttons (hours : minutes : seconds, AM/PM) above
// one round clock dial for the active component. Click or drag on the dial to pick; on release the next
// clock becomes active. Keyboard in the popover (TimeSelectionClocks): ↑/↓ change the active clock,
// PageUp/PageDown the hours, Shift+PageUp/Down the minutes, Ctrl+Shift+PageUp/Down the seconds, Space or
// ":" go to the next clock, typing digits enters a value (and moves on when it can't grow), A / P pick AM / PM,
// Enter submits (OK), Escape cancels. In the field: F4 / Alt+↓ / Alt+↑ toggle the popover,
// PageUp/PageDown ±1 hour, Shift ±1 minute, Ctrl+Shift ±1 second.

type ClockEntity = "hours" | "minutes" | "seconds"

type TimeSelectionLabels = { hours: string; minutes: string; seconds: string; clockDial: string }
const defaultTimeLabels: TimeSelectionLabels = { hours: "Hours", minutes: "Minutes", seconds: "Seconds", clockDial: "Clock Dial" }

type Entity = {
  entity: ClockEntity
  label: string
  itemMin: number
  itemMax: number
  value: number
  stringValue: string
  displayStep: number
  lastItemReplacement: number
  hideFractions: boolean
  min: number
  max: number
}

/* ---------------------------------------------------------------- clock dial */

type TimePickerClockProps = {
  entity: Entity
  active: boolean
  /** Hide (fade out) while the next clock is being activated. */
  transitioning: boolean
  skipAnimation: boolean
  disabled?: boolean
  onValue: (value: number, final: boolean) => void
  onTransitionEnd: () => void
}

/** Mirrors ui5-time-picker-clock. */
function TimePickerClock({ entity, active, transitioning, skipAnimation, disabled, onValue, onTransitionEnd }: TimePickerClockProps) {
  const { itemMin, itemMax, displayStep, lastItemReplacement, hideFractions, label, value } = entity
  const itemsCount = itemMax - itemMin + 1
  const angleStep = hideFractions ? 360 / itemsCount : 6
  const visualCount = 360 / angleStep
  const multiplier = visualCount / itemsCount
  const values = Array.from({ length: itemsCount }, (_, i) => String(itemMin + i))
  if (lastItemReplacement !== -1) values[values.length - 1] = String(lastItemReplacement)
  const items = Array.from({ length: visualCount }, (_, k) => {
    const i = k + 1
    return { angle: i * angleStep, item: i % (displayStep * multiplier) !== 0 ? undefined : values[i / multiplier - 1] }
  })

  const fix = (v: number) => {
    let r = v === 0 ? itemMax : v
    if (r === itemMax && lastItemReplacement !== -1) r = lastItemReplacement
    return r
  }
  const marker = (v: number) => {
    if (v === -1) return null
    const ok = (v >= itemMin && v <= itemMax) || v === lastItemReplacement
    if (!ok) return null
    return { angle: (v * (360 / itemsCount)) % 360, item: String(v) }
  }
  const [hovered, setHovered] = React.useState(-1)
  const selected = marker(fix(value))
  const hover = marker(fix(hovered))
  const down = React.useRef(false)
  const movValue = React.useRef(-1)
  /** The clock root (UI5's getDomRef()): dimensions and the number size come from it. */
  const ref = React.useRef<HTMLDivElement>(null)

  const position = (e: React.PointerEvent) => {
    const el = ref.current!
    const rect = el.getBoundingClientRect()
    const radius = Math.round(el.offsetHeight / 2)
    const numberEl = el.querySelector<HTMLElement>(".fiori-tp-clock-number")
    const numberHeight = numberEl ? numberEl.offsetHeight + parseInt(getComputedStyle(numberEl).marginTop) + parseInt(getComputedStyle(numberEl).marginBottom) : 0
    const dX = e.clientX - rect.left + 1 - radius
    const dY = e.clientY - rect.top + 1 - radius
    const mod = dX >= 0 ? 0 : 180
    const angle = (Math.atan(dY / dX) * 180) / Math.PI + 90 + mod
    const step = 360 / itemMax
    const r = Math.sqrt(dX * dX + dY * dY)
    const inZone = r <= radius && r > radius - numberHeight * 1.5 - 1
    let finalAngle = Math.round((angle === 0 ? 360 : angle) / step) * step
    if (finalAngle === 0) finalAngle = 360
    let v = inZone ? finalAngle / step : -1
    setHovered(v)
    if (v === itemMax && lastItemReplacement !== -1) v = lastItemReplacement
    return v
  }

  return (
    <div
      data-clock={entity.entity}
      aria-hidden="true"
      className={cn("fiori-tp-clock-host", !active && "hidden")}
      data-skip-animation={skipAnimation ? "" : undefined}
    >
      <div ref={ref} className={cn("fiori-tp-clock", active && "fiori-tp-clock-active", transitioning && "fiori-tp-clock-transition")}>
        <div data-label={label} className="fiori-tp-clock-dial" />
        <div className="fiori-tp-clock-items">
          {items.map((it, i) => (
            <div key={i} className="fiori-tp-clock-item" style={{ transform: `translate(-50%) rotate(${it.angle}deg)` }}>
              {it.item ? (
                <>
                  <span className="fiori-tp-clock-dot" />
                  <span
                    className="fiori-tp-clock-number"
                    style={{ transform: `rotate(-${it.angle}deg)` }}
                    onAnimationEnd={i === displayStep * multiplier - 1 && transitioning ? onTransitionEnd : undefined}
                  >
                    {it.item}
                  </span>
                </>
              ) : (
                <span className="fiori-tp-clock-mid-dot" />
              )}
            </div>
          ))}
        </div>
        <div className="fiori-tp-clock-markers">
          {selected && (
            <div className="fiori-tp-clock-item" style={{ transform: `translate(-50%) rotate(${selected.angle}deg)` }}>
              <div className="fiori-tp-clock-select-marker" />
              <div className="fiori-tp-clock-number fiori-tp-clock-selected" style={{ transform: `rotate(-${selected.angle}deg)` }}>
                {selected.item}
              </div>
            </div>
          )}
          {hover && (
            <div className="fiori-tp-clock-item" style={{ transform: `translate(-50%) rotate(${hover.angle}deg)` }}>
              <div className="fiori-tp-clock-hover-marker" />
              <div className="fiori-tp-clock-number fiori-tp-clock-hovered" style={{ transform: `rotate(-${hover.angle}deg)` }}>
                {hover.item}
              </div>
            </div>
          )}
        </div>
        <div
          className={cn("fiori-tp-clock-cover", hover && "fiori-tp-clock-pointer")}
          onPointerDown={(e) => {
            if (disabled || e.button !== 0) return
            e.preventDefault()
            e.currentTarget.setPointerCapture(e.pointerId)
            down.current = true
            movValue.current = value
            position(e)
          }}
          onPointerMove={(e) => {
            const v = position(e)
            if (down.current && !disabled && v !== -1 && v !== movValue.current) {
              onValue(fix(v), false)
              movValue.current = v
            }
          }}
          onPointerUp={(e) => {
            if (!down.current) return
            down.current = false
            const v = position(e)
            if (!disabled && v !== -1) onValue(fix(v), true)
          }}
          onPointerLeave={() => !down.current && setHovered(-1)}
          onWheel={(e) => {
            if (down.current) return
            const step = e.deltaY > 0 || e.deltaX > 0
            onValue(modify(entity, step), false)
          }}
        />
      </div>
    </div>
  )
}

/** UI5 TimePickerClock._modifyValue: one step up/down, wrapping. */
function modify(entity: Entity, increase: boolean) {
  let v = entity.value
  if (v === entity.lastItemReplacement) v = entity.itemMax
  if (increase) {
    v += 1
    if (v > entity.itemMax) v -= entity.itemMax
  } else {
    v -= 1
    if (v < entity.itemMin) v = entity.itemMax
  }
  return v === entity.itemMax && entity.lastItemReplacement !== -1 ? entity.lastItemReplacement : v
}

/* ----------------------------------------------------------- selection clocks */

type TimeSelectionClocksProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  /** The time shown (only hours, minutes, seconds are used). */
  value: Date
  onValueChange: (date: Date) => void
  /** LDML time pattern; decides which clocks exist and 12 / 24 hours. */
  formatPattern: string
  locale?: string
  /** Enter pressed: accept the time. */
  onSubmit?: () => void
  /** Focus the first clock button on mount. */
  autoFocus?: boolean
  /** Turn off the clock switch animation (UI5 skips it when the popover opens). */
  skipAnimation?: boolean
  labels?: Partial<TimeSelectionLabels>
}

/** Mirrors ui5-time-selection-clocks: spin buttons for each component plus the active clock dial. */
function TimeSelectionClocks({
  value,
  onValueChange,
  formatPattern,
  locale: localeProp,
  onSubmit,
  autoFocus,
  skipAnimation = true,
  labels: labelsProp,
  className,
  ...props
}: TimeSelectionClocksProps) {
  const { locale: resolvedLocale, localized } = useFioriLocale(localeProp)
  const locale = localized ? resolvedLocale : "en-US"

  const phone = useIsPhone()
  const labels = useFioriTexts(defaultTimeLabels, defaultTimeLabelsKeys, labelsProp, localeProp)
  const f = patternFields(formatPattern)
  const twelve = f.twelveHour
  const periods = getDayPeriods(new Intl.Locale(locale, { calendar: "gregory", numberingSystem: "latn" }).toString()).map((p) => p.toUpperCase())
  const h = value.getHours()
  const hours12 = h % 12 || 12
  const period = twelve ? (h >= 12 ? 1 : 0) : -1
  const pad2 = (n: number) => String(n).padStart(2, "0")

  const entities: Entity[] = []
  if (f.hours)
    entities.push({
      entity: "hours",
      label: labels.hours,
      itemMin: 1,
      itemMax: twelve ? 12 : 24,
      value: twelve ? hours12 : h,
      stringValue: f.hoursOneDigit ? String(twelve ? hours12 : h) : pad2(twelve ? hours12 : h),
      displayStep: twelve ? 1 : 2,
      lastItemReplacement: twelve ? -1 : 0,
      hideFractions: !twelve,
      min: twelve ? 1 : 0,
      max: twelve ? 12 : 23,
    })
  const sixty = (entity: ClockEntity, label: string, v: number): Entity => ({
    entity,
    label,
    itemMin: 1,
    itemMax: 60,
    value: v,
    stringValue: pad2(v),
    displayStep: 5,
    lastItemReplacement: 0,
    hideFractions: false,
    min: 0,
    max: 59,
  })
  if (f.minutes) entities.push(sixty("minutes", labels.minutes, value.getMinutes()))
  if (f.seconds) entities.push(sixty("seconds", labels.seconds, value.getSeconds()))

  const [active, setActive] = React.useState(0)
  const [transitionTo, setTransitionTo] = React.useState<number | null>(null)
  const [animate, setAnimate] = React.useState(!skipAnimation)
  const buffer = React.useRef("")
  const cooldown = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const focusButton = (i: number) => rootRef.current?.querySelector<HTMLElement>(`[data-clock-button="${entities[i]?.entity}"]`)?.focus()

  React.useEffect(() => {
    if (autoFocus) focusButton(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  React.useEffect(() => () => {
    if (cooldown.current) clearTimeout(cooldown.current)
  }, [])

  const activate = (i: number) => {
    setTransitionTo(null)
    setActive(i)
    focusButton(i)
  }
  const switchTo = (i: number, skip: boolean) => {
    if (i === active || i >= entities.length) return
    if (skip || !animate) {
      setAnimate(false)
      activate(i)
    } else {
      setTransitionTo(i)
    }
  }
  const next = (wrap: boolean, skip: boolean) => {
    let i = active + 1
    if (i >= entities.length) i = wrap ? 0 : entities.length - 1
    switchTo(i, skip)
  }

  const setEntity = (entity: ClockEntity, v: number) => {
    const d = new Date(value)
    if (entity === "hours") {
      let hours = v
      if (twelve) hours = period === 0 ? (v === 12 ? 0 : v) : v === 12 ? 12 : v + 12
      d.setHours(hours)
    } else if (entity === "minutes") d.setMinutes(v)
    else d.setSeconds(v)
    onValueChange(d)
  }
  const setPeriod = (p: number) => {
    const d = new Date(value)
    if (p === 0 && d.getHours() >= 12) d.setHours(d.getHours() - 12)
    if (p === 1 && d.getHours() < 12) d.setHours(d.getHours() + 12)
    onValueChange(d)
  }
  const startCooldown = () => {
    if (cooldown.current) clearTimeout(cooldown.current)
    cooldown.current = setTimeout(() => (buffer.current = ""), 1000)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // TimeSelectionClocks.js uses exact Keys predicates at each callsite.
    if (phone && ((["Enter", " ", "ArrowUp", "ArrowDown", "a", "A", "p", "P"].includes(e.key) || /^\d$/.test(e.key)) && (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)
      || e.key === ":" && (!e.shiftKey || e.altKey || e.ctrlKey || e.metaKey))) return
    const inAmPm = !!(e.target as HTMLElement).closest("[data-slot=segmented-button]")
    const ctrl = e.ctrlKey || e.metaKey
    const ent = entities[active]
    const byName = (n: ClockEntity) => entities.findIndex((x) => x.entity === n)
    const stepClock = (n: ClockEntity, up: boolean) => {
      const i = byName(n)
      if (i < 0) return
      switchTo(i, true)
      setEntity(n, modify(entities[i], up))
    }
    if (e.key === "Enter") {
      e.preventDefault()
      onSubmit?.()
    } else if (e.key === " " && !inAmPm) {
      e.preventDefault()
      if (e.repeat) return
      buffer.current = ""
      next(true, true)
    } else if ((e.key === "ArrowUp" || e.key === "ArrowDown") && !e.altKey) {
      e.preventDefault()
      if (!inAmPm && ent) setEntity(ent.entity, modify(ent, e.key === "ArrowUp"))
    } else if ((e.key === "PageUp" || e.key === "PageDown") && !e.altKey) {
      e.preventDefault()
      const up = e.key === "PageUp"
      if (!e.shiftKey && !ctrl) stepClock("hours", up)
      else if (e.shiftKey && !ctrl) stepClock("minutes", up)
      else if (e.shiftKey && ctrl) stepClock("seconds", up)
    } else if ((e.key === "a" || e.key === "A" || e.key === "p" || e.key === "P") && !ctrl && !e.altKey) {
      e.preventDefault()
      if (twelve) setPeriod(e.key.toLowerCase() === "a" ? 0 : 1)
    } else if (e.key === ":") {
      e.preventDefault()
      buffer.current = ""
      next(true, true)
    } else if (/^\d$/.test(e.key) && !ctrl && !e.altKey && ent) {
      e.preventDefault()
      startCooldown()
      const str = buffer.current + e.key
      const num = parseInt(str)
      if (num > ent.max) {
        // Doesn't fit: keep the old entry, move on and start the next clock with this digit.
        if (buffer.current) setEntity(ent.entity, parseInt(buffer.current))
        const ni = Math.min(active + 1, entities.length - 1)
        switchTo(ni, true)
        buffer.current = e.key
        setEntity(entities[ni].entity, parseInt(e.key))
      } else {
        buffer.current = str
        setEntity(ent.entity, num)
        if (str.length === 2 || parseInt(`${str}0`) > ent.max) {
          buffer.current = ""
          next(false, true)
        }
      }
    }
  }

  return (
    <div
      ref={rootRef}
      data-slot="time-selection-clocks"
      className={cn("fiori-time-selection-clocks", className)}
      {...props}
    >
      <div className="fiori-time-picker-tsc-container" tabIndex={-1} onKeyDown={onKeyDown}>
        <div className="fiori-time-picker-tsc-buttons">
          {entities.map((ent, i) => (
            <React.Fragment key={ent.entity}>
              {i > 0 && <span className="fiori-time-selection-separator">:</span>}
              <Button
                data-clock-button={ent.entity}
                role="spinbutton"
                aria-label={ent.label}
                aria-valuemin={ent.min}
                aria-valuemax={ent.max}
                aria-valuenow={ent.value}
                aria-valuetext={`${ent.value} ${ent.label}`}
                data-pressed={i === active ? "" : undefined}
                className={cn(
                  "fiori-time-picker-tsc-button",
                  // ui5-button's host is content-box: its 2.25rem min-width excludes the border.
                  "min-w-[calc(var(--fiori-button-base-min-width)_+_2_*_var(--sapButton_BorderWidth))]",
                  "data-pressed:bg-(--sapButton_Selected_Background) data-pressed:border-(--sapButton_Selected_BorderColor) data-pressed:text-(--sapButton_Selected_TextColor)",
                  "data-pressed:hover:bg-(--sapButton_Selected_Hover_Background) data-pressed:hover:border-(--sapButton_Selected_Hover_BorderColor)"
                )}
                onFocus={() => i !== active && switchTo(i, false)}
                onClick={() => i !== active && switchTo(i, false)}
              >
                {ent.stringValue}
              </Button>
            </React.Fragment>
          ))}
          {twelve && (
            <>
              <span className="fiori-time-selection-separator" />
              <SegmentedButton
                value={String(period)}
                onValueChange={(v) => setPeriod(Number(v))}
                aria-label="AM/PM"
                className="fiori-time-picker-tsc-ampm"
              >
                <SegmentedButtonItem value="0">{periods[0]}</SegmentedButtonItem>
                <SegmentedButtonItem value="1">{periods[1]}</SegmentedButtonItem>
              </SegmentedButton>
            </>
          )}
        </div>
        <div className="fiori-time-picker-tsc-clocks" role="img" aria-label={labels.clockDial}>
          {entities.map((ent, i) => (
            <TimePickerClock
              key={ent.entity}
              entity={ent}
              active={i === active}
              transitioning={transitionTo !== null && i === active}
              skipAnimation={!animate}
              onTransitionEnd={() => transitionTo !== null && activate(transitionTo)}
              onValue={(v, final) => {
                setEntity(ent.entity, v)
                if (final) {
                  if (i < entities.length - 1) {
                    setAnimate(true)
                    switchTo(i + 1, false)
                  } else focusButton(i)
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- TimePicker */

/**
 * @accessibility Native aria-label / aria-labelledby / aria-describedby land on the input. pickerLabel names the popup; clockLabels and numericLabels name time controls; submitLabel/cancelLabel name its actions.
 * @accessibility F4 or Alt+Down/Up toggles the popup; Escape discards the draft and returns focus. PageUp/Down changes hours, Shift minutes, Ctrl/Cmd+Shift seconds. In clocks, arrows and digits edit; colon/Space moves component, A/P picks period, Enter submits.
 */
type TimePickerProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "size"> & {
  /** The value as text in `formatPattern`. */
  value?: string
  defaultValue?: string
  /** Fires on commit (Enter, blur, OK in the popover, PageUp/Down) with the formatted value and the time (null if empty / invalid). */
  onValueChange?: (value: string, date: Date | null) => void
  onInput?: (value: string) => void
  /** LDML time pattern ("HH:mm", "hh:mm a") or "short" | "medium" | "long". Default "medium" ("h:mm:ss a" in en-US). */
  formatPattern?: string
  locale?: string
  valueState?: ValueState
  onValueStateChange?: (state: ValueState, valid: boolean) => void
  valueStateMessage?: React.ReactNode | null
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  wrapperClassName?: string
  submitLabel?: string
  cancelLabel?: string
  openIconLabel?: string
  closeIconLabel?: string
  pickerLabel?: string
  phoneHeaderText?: string
  numericLabels?: Partial<{ hours: string; minutes: string; seconds: string; period: string }>
  clockLabels?: Partial<TimeSelectionLabels>
  /** SAP-keyed accessible and native form-validation messages; component overrides win over the provider. */
  texts?: Partial<TimePickerTexts>
}

function TimePicker({
  value: valueProp,
  defaultValue,
  onValueChange,
  onInput,
  formatPattern,
  locale: localeProp,
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
  openIconLabel,
  closeIconLabel,
  pickerLabel,
  phoneHeaderText,
  numericLabels,
  clockLabels,
  ...props
}: TimePickerProps) {
  const valueStateTexts = useValueStateTexts()

  const { t, locale: resolvedLocale, localized, hasProvider } = useFioriLocale(localeProp)
  const locale = localized ? resolvedLocale : "en-US"
  // UI5 DateFormat formats Gregorian fields with Latin digits; translations retain the original locale.
  const dateLocale = new Intl.Locale(locale, { calendar: "gregory", numberingSystem: "latn" }).toString()
  const fieldTexts = useFioriTexts(defaultTimePickerTexts, defaultTimePickerTextsKeys, texts, localeProp)
  const submitLabel = submitLabelProp ?? t("TIMEPICKER_SUBMIT_BUTTON", "OK") // UI5 TIMEPICKER_SUBMIT_BUTTON
  const cancelLabel = cancelLabelProp ?? t("TIMEPICKER_CANCEL_BUTTON", "Cancel") // UI5 TIMEPICKER_CANCEL_BUTTON

  const phone = useIsPhone()
  const [inputsOpen, setInputsOpen] = React.useState(false)
  const pattern = resolvePattern(formatPattern, dateLocale, "time")
  const validate = (text: string) => (!text.trim() ? undefined : parsePickerDate(normalizeLocaleDigits(text, locale), pattern, dateLocale, "time"))
  const s = usePickerState({ value: valueProp, defaultValue, valueState: valueStateProp, onValueStateChange, open: openProp, defaultOpen, onOpenChange, validate, controlledValueWins: phone })
  // The popover edits a copy (UI5's tempValue); OK writes it back.
  const [temp, setTemp] = React.useState<Date>(() => new Date())

  const commit = (text: string) => {
    const d = validate(text)
    const next = d ? formatPickerDate(d, pattern, dateLocale) : text
    s.updateState(d !== null)
    s.setEditing(false)
    s.setValue(next)
    if (next !== s.value) onValueChange?.(next, d ?? null)
  }
  const setOpen = (o: boolean) => {
    if (o) { setInputsOpen(false); setTemp(validate(s.text) ?? new Date()) }
    s.setOpen(o)
  }
  const fieldRef = React.useRef<HTMLInputElement>(null)
  const parsedForValidity = parsePickerDate(normalizeLocaleDigits(s.text, locale), pattern, dateLocale, "time")
  const formValidityMessage = !s.text ? (props.required ? fieldTexts.valueMissing(pattern) : "") : !parsedForValidity ? fieldTexts.invalidFormat(pattern) : ""
  // UI5 TimePicker.js/formValidityMessage localizes constraint validation, independently of valueStateMessage.
  React.useLayoutEffect(() => { fieldRef.current?.setCustomValidity(localized || hasProvider || texts ? formValidityMessage : "") }, [formValidityMessage, localized, hasProvider, texts])
  const submit = () => {
    commit(formatPickerDate(temp, pattern, dateLocale))
    setOpen(false)
    if (!phone) fieldRef.current?.focus()
  }
  const virtualAnchor = React.useRef({ getBoundingClientRect: () => fieldRef.current?.closest('[data-slot="picker-field"]')?.getBoundingClientRect() ?? new DOMRect() })
  const inputsRef = React.useRef<HTMLDivElement>(null)
  const restoringInputsFocus = React.useRef(false)
  const openInputs = () => { if (!inputsOpen && !restoringInputsFocus.current) { setTemp(validate(s.text) ?? new Date()); setInputsOpen(true) } }
  const submitInputs = () => { commit(formatPickerDate(temp, pattern, dateLocale)); setInputsOpen(false) }
  const lastTime = new Date()
  lastTime.setHours(23, 59, 59, 999)

  return (
    <> <PickerField
      data-slot="time-picker"
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
      f4Closes
      valueState={s.valueState}
      valueStateMessage={valueStateMessage}
      icon={timeEntryRequest}
      openIconLabel={openIconLabel ?? t("TIMEPICKER_OPEN_ICON_TITLE", "Open Picker")}
      closeIconLabel={closeIconLabel ?? t("TIMEPICKER_OPEN_ICON_TITLE_OPENED", "Close Picker")}
      roleDescription={fieldTexts.roleDescription}
      pickerLabel={pickerLabel ?? fieldTexts.pickerLabel(props["aria-label"] ?? "")}
      phoneHeaderText={phoneHeaderText ?? (localized || hasProvider || texts ? props["aria-label"] ?? fieldTexts.phoneHeaderText : undefined)} phonePreventInitialFocus phoneInputFocus={openInputs}
      placeholder={placeholder ?? examplePlaceholder(formatPickerDate(lastTime, pattern, dateLocale), fieldTexts.placeholderPrefix)}
      popoverClassName="fiori-time-picker-popover"
      onPickerKeyDown={(e, inPopover) => {
        if (inPopover || s.open || (e.key !== "PageUp" && e.key !== "PageDown") || e.altKey) return
        e.preventDefault()
        const d = validate(s.text)
        if (!d) return
        const dir = e.key === "PageUp" ? 1 : -1
        const ctrl = e.ctrlKey || e.metaKey
        if (ctrl && e.shiftKey) d.setSeconds(d.getSeconds() + dir)
        else if (e.shiftKey && !ctrl) d.setMinutes(d.getMinutes() + dir)
        else if (!ctrl) d.setHours(d.getHours() + dir)
        else return
        commit(formatPickerDate(d, pattern, dateLocale))
      }}
      footer={<TimePickerFooter submitLabel={submitLabel} cancelLabel={cancelLabel} onSubmit={submit} onCancel={() => setOpen(false)} />}
      {...props}
    >
      {s.open && (
        <TimeSelectionClocks autoFocus={!phone} value={temp} onValueChange={setTemp} formatPattern={pattern} locale={locale} onSubmit={submit} labels={clockLabels} />
      )}
    </PickerField>
    {phone && <Popover open={inputsOpen} onOpenChange={setInputsOpen}><PopoverAnchor virtualRef={virtualAnchor} />
      <PopoverContent ref={inputsRef} data-slot="time-picker-inputs-popover" hideArrow side="bottom" align="start" sideOffset={0} className="fiori-picker-popover"
        // UI5 Popup.js/openPopup applies initial focus before firing open.
        // FocusScope has mounted the inputs here; deferring can overwrite a later user focus move.
        onOpenAutoFocus={(event) => { event.preventDefault(); inputsRef.current?.querySelector<HTMLInputElement>('[data-slot="time-selection-inputs"] input')?.focus() }}
        onCloseAutoFocus={(event) => {
          // TimePickerPopoverTemplate.js's ordinary Popover restores the input;
          // _handleInputClick returns on mobile, so tapping it again is a no-op
          // until a new focus-in. Suppress reopening during this restoration.
          event.preventDefault(); restoringInputsFocus.current = true
          fieldRef.current?.focus(); restoringInputsFocus.current = false
        }}
        onInteractOutside={(event) => { if (fieldRef.current?.parentElement?.contains(event.target as Node)) event.preventDefault() }}>
        <PickerPopoverBody valueState={s.valueState === "positive" ? "none" : s.valueState} message={valueStateMessage === undefined ? (s.valueState !== "none" ? valueStateTexts[s.valueState] : undefined) : valueStateMessage}
          footer={<TimePickerFooter submitLabel={submitLabel} cancelLabel={cancelLabel} onSubmit={submitInputs} onCancel={() => setInputsOpen(false)} />}>
          <div className="fiori-time-selection-inputs-padding"><TimeSelectionInputs value={temp} onValueChange={setTemp} pattern={pattern} locale={locale} labels={numericLabels} onSubmit={submitInputs} /></div>
        </PickerPopoverBody>
      </PopoverContent>
    </Popover>}
    </>
  )
}

/** TimeSelectionInputsTemplate.js/_onkeydown: numeric mobile entry, auto-advance,
 * Enter submits. Buffer expiration follows TimePickerInternals/_resetCooldown. */
function TimeSelectionInputs({ value, onValueChange, pattern, locale, onSubmit, labels: labelsProp }: { value: Date; onValueChange: (value: Date) => void; pattern: string; locale: string; onSubmit: () => void; labels?: Partial<{ hours: string; minutes: string; seconds: string; period: string }> }) {
  // generated/i18n/i18n-defaults.js: TIMEPICKER_INPUTS_ENTER_* defaults.
  const labels = useFioriTexts(defaultInputLabels, defaultInputLabelsKeys, labelsProp, locale)
  const fields = patternFields(pattern)
  const twelve = fields.twelveHour
  const root = React.useRef<HTMLDivElement>(null)
  const currentValue = React.useRef(value)
  currentValue.current = value
  const [draft, setDraft] = React.useState<{ entity: ClockEntity; value: string } | null>(null)
  const buffer = React.useRef("")
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const entities = (['hours', 'minutes', 'seconds'] as const).filter((entity) => fields[entity]).map((entity) => ({ entity, min: entity === 'hours' && twelve ? 1 : 0, max: entity === 'hours' ? twelve ? 12 : 23 : 59, value: entity === 'hours' ? twelve ? value.getHours() % 12 || 12 : value.getHours() : entity === 'minutes' ? value.getMinutes() : value.getSeconds() }))
  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  const setEntity = (entity: ClockEntity, number: number) => {
    const next = new Date(currentValue.current)
    // TimePickerInternals.js/_hoursChange/_shiftHours special-case exactly 12;
    // Date.setHours itself carries pasted overflow into the next day/period.
    if (entity === 'hours') next.setHours(twelve ? next.getHours() < 12 ? number === 12 ? 0 : number : number === 12 ? 12 : number + 12 : number)
    else if (entity === 'minutes') next.setMinutes(number)
    else next.setSeconds(number)
    currentValue.current = next
    onValueChange(next)
  }
  const nextInput = (index: number) => root.current?.querySelectorAll<HTMLInputElement>('input')[Math.min(index + 1, entities.length - 1)]?.focus()
  return <div ref={root} data-slot="time-selection-inputs" className="fiori-time-selection-inputs">{entities.map((item, index) => <React.Fragment key={item.entity}>{index > 0 && <span className="fiori-time-selection-separator">:</span>}<Input type="number" inputMode="numeric" autoComplete="off" pattern="[0-9]*" min={item.min} max={item.max} step={1} maxLength={2} aria-label={labels[item.entity]} wrapperClassName="fiori-time-selection-numeric-input" value={draft?.entity === item.entity ? draft.value : item.entity === 'hours' && fields.hoursOneDigit ? String(item.value) : String(item.value).padStart(2, '0')}
    // TimeSelectionInputs.js/_onfocusin leaves its keyboard buffer intact;
    // _oninput keeps the raw editing string until _onfocusout normalizes it.
    onFocus={(event) => { event.currentTarget.select(); setDraft(null) }}
    onBlur={() => setDraft(null)}
    // TimeSelectionInputs.js/_oninput: only a parsed value that differs from the entity's current value edits the
    // field and seeds the keyboard buffer ("" counts as 0); an equal value (e.g. pasting "010" over 10) changes nothing.
    onChange={(event) => { const text = event.currentTarget.value; const number = text === "" ? 0 : parseInt(text, 10); if (number === item.value) return; setDraft({ entity: item.entity, value: text }); buffer.current = text; setEntity(item.entity, number) }}
    onKeyDown={(event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (event.key === 'Enter') { event.preventDefault(); onSubmit(); return }
      if (!/^\d$/.test(event.key)) return
      event.preventDefault()
      setDraft(null)
      if (timer.current) clearTimeout(timer.current)
      const combined = buffer.current + event.key
      const number = Number(combined)
      if (number > item.max) {
        setEntity(item.entity, Number(buffer.current))
        nextInput(index)
        buffer.current = event.key
        // TimeSelectionInputs.js/_onkeydown calls _switchNextInput then
        // _inputChange synchronously. UI5Element.focus is asynchronous: the
        // second update still belongs to the original active entity.
        setEntity(item.entity, Number(event.key))
      }
      else { buffer.current = combined; setEntity(item.entity, number); if (combined.length === 2 || Number(`${combined}0`) > item.max) { buffer.current = ''; nextInput(index) } }
      timer.current = setTimeout(() => { buffer.current = '' }, 1000)
    }} /></React.Fragment>)}{twelve && <><span className="fiori-time-selection-separator" /><SegmentedButton value={value.getHours() >= 12 ? "1" : "0"} aria-label={labels.period} onValueChange={(period) => { const next = new Date(value); next.setHours(value.getHours() % 12 + Number(period) * 12); onValueChange(next) }}>{getDayPeriods(new Intl.Locale(locale, { calendar: "gregory", numberingSystem: "latn" }).toString()).map((period, index) => <SegmentedButtonItem key={period} value={String(index)}>{period.toUpperCase()}</SegmentedButtonItem>)}</SegmentedButton></>}</div>
}

type TimePickerFooterProps = { submitLabel?: string; cancelLabel?: string; onSubmit?: () => void; onCancel?: () => void }

/** The popover footer: OK (emphasized) and Cancel, each at least 20% wide (ui5-time-picker-footer). */
function TimePickerFooter({ submitLabel: submitLabelProp, cancelLabel: cancelLabelProp, onSubmit, onCancel }: TimePickerFooterProps) {
  const { t } = useFioriLocale()
  const submitLabel = submitLabelProp ?? t("TIMEPICKER_SUBMIT_BUTTON", "OK") // UI5 TIMEPICKER_SUBMIT_BUTTON
  const cancelLabel = cancelLabelProp ?? t("TIMEPICKER_CANCEL_BUTTON", "Cancel") // UI5 TIMEPICKER_CANCEL_BUTTON

  return (
    <div className="fiori-time-picker-footer">
      <Button variant="emphasized" className="m-[1%] min-w-[20%]" onClick={onSubmit}>
        {submitLabel}
      </Button>
      <Button variant="transparent" className="m-[1%] min-w-[20%]" onClick={onCancel}>
        {cancelLabel}
      </Button>
    </div>
  )
}

export { TimePicker, TimePickerFooter, TimePickerClock, TimeSelectionClocks, type TimePickerProps, type TimeSelectionClocksProps, type TimeSelectionLabels }

const defaultTimeLabelsKeys = { hours: "TIMEPICKER_HOURS_LABEL", minutes: "TIMEPICKER_MINUTES_LABEL", seconds: "TIMEPICKER_SECONDS_LABEL", clockDial: "TIMEPICKER_CLOCK_DIAL_LABEL" } as const
const defaultInputLabels = { hours: "Please enter hours", minutes: "Please enter minutes", seconds: "Please enter seconds", period: "AM/PM" }
const defaultInputLabelsKeys = { hours: "TIMEPICKER_INPUTS_ENTER_HOURS", minutes: "TIMEPICKER_INPUTS_ENTER_MINUTES", seconds: "TIMEPICKER_INPUTS_ENTER_SECONDS" } as const

type TimePickerTexts = { roleDescription: string; pickerLabel: (name: string) => string; phoneHeaderText: string; placeholderPrefix: string; invalidFormat: (pattern: string) => string; valueMissing: (pattern: string) => string }
const defaultTimePickerTexts: TimePickerTexts = {
  roleDescription: "Time Input", // UI5 TIMEPICKER_INPUT_DESCRIPTION
  pickerLabel: (_name) => "Choose Time", // UI5 TIMEPICKER_POPOVER_ACCESSIBLE_NAME; retain pre-E5 English default without a provider.
  phoneHeaderText: "All Items", // UI5 INPUT_SUGGESTIONS_TITLE; TimePicker.js/_headerTitleText
  placeholderPrefix: "e.g.", // UI5 DATETIME_COMPONENTS_PLACEHOLDER_PREFIX
  invalidFormat: (pattern) => "This format is not supported. Enter the time in the following format: {0}.".replaceAll("{0}", pattern), // UI5 TIMEPICKER_PATTERN_MISSMATCH
  valueMissing: (pattern) => "Enter the time in the following format: {0}.".replaceAll("{0}", pattern), // UI5 TIMEPICKER_VALUE_MISSING
}
const defaultTimePickerTextsKeys = { roleDescription: "TIMEPICKER_INPUT_DESCRIPTION", pickerLabel: "TIMEPICKER_POPOVER_ACCESSIBLE_NAME", phoneHeaderText: "INPUT_SUGGESTIONS_TITLE", placeholderPrefix: "DATETIME_COMPONENTS_PLACEHOLDER_PREFIX", invalidFormat: "TIMEPICKER_PATTERN_MISSMATCH", valueMissing: "TIMEPICKER_VALUE_MISSING" } as const
