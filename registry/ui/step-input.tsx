// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { useFioriLocale, useFioriTexts } from "@/lib/fiori-locale"
import { formatNumber, numberSymbols, parseNumber } from "@/lib/fiori-numbers"

// UI5 InputPopoverTemplate/Popup.onEnterDOM: the standalone value-state message is a Popup scope.

import { add, less } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import { useValueStateTexts, valueStateIcons, type ValueState } from "@/components/ui/input"

// UI5 NumericInputTemplate.js / generated/themes/NumericInput.css.js paints pointer focus too.
// AGENTS rule 5 requires keyboard origin, including focus in a newly mounted popup.
const stepinputFocusModality = new WeakMap<Document, { keyboard: boolean }>()
function getStepInputFocusModality(owner: Document) {
  let state = stepinputFocusModality.get(owner)
  if (!state) {
    state = { keyboard: true }
    const current = state
    owner.addEventListener("keydown", () => { current.keyboard = true }, true)
    owner.addEventListener("pointerdown", () => { current.keyboard = false }, true)
    stepinputFocusModality.set(owner, current)
  }
  return state
}
if (typeof document !== "undefined") getStepInputFocusModality(document)

/**
 * @accessibility Native aria-label, aria-labelledby and aria-describedby reach the spinbutton input. decrementLabel and incrementLabel name the internal buttons; valueStateMessage supplies a linked validation description.
 * @accessibility Up/Down step. Shift+PageUp/PageDown or Ctrl+Shift+Up/Down jump to bounds; Enter or blur commit and Escape restores the focus value. Internal buttons do not add tab stops.
 */
type StepInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "min" | "max" | "step" | "type" | "size"
> & {
  value?: number
  defaultValue?: number
  /** Fires when the value is committed: a step, Enter, blur, or a button press (UI5's `change`). */
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  /** Amount added by ↑/↓, the buttons and the mouse wheel. Default 1. */
  step?: number
  /** Decimal places shown and expected. Default 0. */
  valuePrecision?: number
  /**
   * Value state. A typed value outside min/max or with the wrong number of decimals
   * turns the field negative on commit, as in UI5.
   */
  valueState?: ValueState
  /** Shown below the field while focused; defaults to SAP's standard text. `null` hides it. */
  valueStateMessage?: React.ReactNode | null
  /** Fires when the field's own range/precision validation changes the effective state. */
  onValidityChange?: (valid: boolean) => void
  decrementLabel?: string
  incrementLabel?: string
  locale?: string
  texts?: Partial<StepInputTexts>
  wrapperClassName?: string
}

type StepInputTexts = {
  decrement: string
  increment: string
  invalidFormat: (precision: number) => string
  belowMinimum: (minimum: number) => string
  aboveMaximum: (maximum: number) => string
}

const INITIAL_WAIT = 500
const ACCELERATION = 0.8
const MIN_WAIT = 50
const INITIAL_SPEED = 120

const NUMBER = /^-?(\d+\.?\d*|\.\d+)$/

// Mirrors ui5-step-input (Horizon): decrement / increment buttons inside the field, ↑/↓ step,
// Shift+PageUp / Ctrl+Shift+↑ jump to max, Shift+PageDown / Ctrl+Shift+↓ jump to min,
// Escape restores the value the field had on focus, hold a button to spin.
function StepInput({
  className,
  wrapperClassName,
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  min,
  max,
  step = 1,
  valuePrecision = 0,
  valueState = "none",
  valueStateMessage,
  onValidityChange,
  decrementLabel: decrementLabelProp,
  incrementLabel: incrementLabelProp,
  locale: localeProp,
  texts,
  disabled,
  readOnly,
  id,
  onKeyDown,
  onFocus,
  onBlur,
  "aria-describedby": ariaDescribedBy,
  ...props
}: StepInputProps) {
  const valueStateTexts = useValueStateTexts()

  const { locale, localized, hasProvider } = useFioriLocale(localeProp)
  const resolvedTexts = useFioriTexts(defaultStepInputTexts, defaultStepInputTextsKeys, texts, localeProp)
  const decrementLabel = decrementLabelProp ?? resolvedTexts.decrement
  const incrementLabel = incrementLabelProp ?? resolvedTexts.increment

  // UI5 2.28.1 NumericInput.formatter/_formatNumber uses locale NumberFormat with decimals=valuePrecision.
  // Retain the registry's pre-E5 toFixed display when no locale was opted into (E5 compatibility).
  const format = React.useCallback((n: number) => localized ? formatNumber(n, locale, { minFractionDigits: valuePrecision, maxFractionDigits: valuePrecision }) : n.toFixed(valuePrecision), [valuePrecision, locale, localized])
  const parseValue = React.useCallback((s: string) => localized ? parseNumber(s, locale) : parse(s), [locale, localized])
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const value = valueProp ?? uncontrolled
  const [text, setText] = React.useState(() => format(value))
  const [invalid, setInvalid] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const focusValue = React.useRef<number | undefined>(undefined)
  const lastCommitted = React.useRef(value)

  // Re-format when the value changes from outside (controlled updates, precision changes).
  const shown = React.useRef(value)
  const previousFormat = React.useRef(format)
  React.useEffect(() => {
    if (shown.current !== value || parseValue(text) !== value || previousFormat.current !== format) {
      shown.current = value
      setText(format(value))
    }
    previousFormat.current = format
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, format])

  const setValue = (v: number, display = format(v)) => {
    shown.current = v
    setText(display)
    if (valueProp === undefined) setUncontrolled(v)
    if (v !== lastCommitted.current) {
      lastCommitted.current = v
      onValueChange?.(v)
    }
  }
  const validate = (v: number, display: string) => {
    const inRange = (min === undefined || v >= min) && (max === undefined || v <= max)
    const decimal = localized ? numberSymbols(locale).decimal : "."
    const decimals = display.includes(decimal) ? display.split(decimal)[1].length : 0
    const precisionOk = (valuePrecision === 0 && !display.includes(decimal)) || decimals === valuePrecision
    const ok = inRange && precisionOk
    if (ok === invalid) onValidityChange?.(ok)
    setInvalid(!ok)
  }

  const decDisabled = min !== undefined && value <= min
  const incDisabled = max !== undefined && value >= max
  const interactive = !disabled && !readOnly

  const modify = (delta: number) => {
    if (min !== undefined && max !== undefined && min > max) return
    let next = value + delta
    if (min !== undefined && next < min) next = min
    if (max !== undefined && next > max) next = max
    const pow = 10 ** valuePrecision
    next = Math.round(next * pow) / pow
    if (next !== value) {
      setValue(next)
      validate(next, format(next))
    }
  }
  const modifyRef = React.useRef(modify)
  modifyRef.current = modify

  const commit = () => {
    const raw = inputRef.current?.value ?? text
    const parsed = raw === "" ? (min ?? 0) : parseValue(raw)
    const next = Number.isNaN(parsed) ? (min ?? 0) : parsed
    const display = raw === "" || Number.isNaN(parsed) ? format(next) : raw
    // Like UI5, a value with the wrong precision is kept as typed (and flagged), not reformatted.
    setValue(next, display)
    validate(next, display)
  }

  // Press-and-hold spinning, with UI5's timing (500ms, then accelerating to 50ms).
  const spin = React.useRef<{ timer?: number; wait: number; speed: number; started: boolean }>({ wait: INITIAL_WAIT, speed: INITIAL_SPEED, started: false })
  const stopSpin = () => {
    window.clearTimeout(spin.current.timer)
    spin.current.timer = undefined
  }
  const startSpin = (dir: 1 | -1) => {
    stopSpin()
    spin.current = { wait: INITIAL_WAIT, speed: INITIAL_SPEED, started: false }
    const tick = () => {
      spin.current.speed *= ACCELERATION
      spin.current.wait = Math.max(MIN_WAIT, spin.current.wait - spin.current.speed)
      spin.current.timer = window.setTimeout(() => {
        spin.current.started = true
        modifyRef.current(dir * step)
        tick()
      }, spin.current.wait)
    }
    tick()
  }
  React.useEffect(() => stopSpin, [])

  // Mouse wheel steps while focused (needs a non-passive listener to prevent page scroll).
  React.useEffect(() => {
    const el = inputRef.current?.closest<HTMLElement>(".fiori-step-input")
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!interactive || document.activeElement !== inputRef.current) return
      e.preventDefault()
      modifyRef.current(e.deltaY < 0 ? step : -step)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [interactive, step])

  const effectiveState: ValueState = invalid ? "negative" : valueState
  const autoId = React.useId()
  const messageId = `${id ?? autoId}-vsm`
  const hasState = effectiveState !== "none"
  const decimal = localized ? numberSymbols(locale).decimal : "."
  const decimalLength = text.includes(decimal) ? text.split(decimal)[1].length : 0
  // NumericInput.formValidityMessage/_isValueWithCorrectPrecision checks precision before bounds, except zero.
  const validationText = value !== 0 && decimalLength !== valuePrecision ? resolvedTexts.invalidFormat(valuePrecision)
    : min !== undefined && value < min ? resolvedTexts.belowMinimum(min)
      : max !== undefined && value > max ? resolvedTexts.aboveMaximum(max) : ""
  React.useLayoutEffect(() => { inputRef.current?.setCustomValidity(localized || hasProvider || texts ? validationText : "") }, [validationText, localized, hasProvider, texts])
  // Native NumericInput constraint messages are independent of its standard value-state popup text.
  const message = valueStateMessage === undefined && hasState ? valueStateTexts[effectiveState] : valueStateMessage
  const showMessage = hasState && message != null && !readOnly && !disabled

  const button = (dir: -1 | 1) => {
    const off = dir < 0 ? decDisabled : incDisabled
    return (
      <span className="fiori-step-input__button" data-dir={dir < 0 ? "dec" : "inc"} title={dir < 0 ? decrementLabel : incrementLabel}>
        <button
          type="button"
          tabIndex={-1}
          aria-label={dir < 0 ? decrementLabel : incrementLabel}
          aria-controls={id}
          aria-disabled={off || undefined}
          data-clickable={off ? undefined : ""}
          disabled={disabled}
          className="fiori-step-input__icon"
          onPointerDown={(e) => {
            if (e.button !== 0) return
            e.preventDefault()
            inputRef.current?.focus()
            if (!off) startSpin(dir)
          }}
          onPointerUp={stopSpin}
          onPointerLeave={stopSpin}
          onClick={() => {
            const spun = spin.current.started
            spin.current.started = false
            if (!off && !spun) modify(dir * step)
          }}
        >
          <Icon icon={dir < 0 ? less : add} />
        </button>
      </span>
    )
  }

  return (
    <div data-slot="step-input" className={cn("fiori-step-input-host group/field", wrapperClassName)}>
      <div
        data-value-state={hasState ? effectiveState : undefined}
        data-disabled={disabled ? "" : undefined}
        data-readonly={readOnly ? "" : undefined}
        className="fiori-step-input"
      >
      {!readOnly && button(-1)}
      <div
        data-value-state={hasState ? effectiveState : undefined}
        data-disabled={disabled ? "" : undefined}
        data-readonly={readOnly ? "" : undefined}
        data-open=""
        onPointerDownCapture={(event) => {
          event.currentTarget.setAttribute("data-pointer-focus", "")
        }}
        onFocusCapture={(event) => {
          if (getStepInputFocusModality(event.currentTarget.ownerDocument).keyboard) event.currentTarget.removeAttribute("data-pointer-focus")
          else event.currentTarget.setAttribute("data-pointer-focus", "")
        }}
        onKeyDownCapture={(event) => {
          event.currentTarget.removeAttribute("data-pointer-focus")
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.removeAttribute("data-pointer-focus")
        }}
        className="fiori-field fiori-step-input__field"
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode={valuePrecision > 0 ? "decimal" : "numeric"}
          role="spinbutton"
          autoComplete="off"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-invalid={effectiveState === "negative" || undefined}
          aria-describedby={cn(ariaDescribedBy, showMessage && messageId) || undefined}
          disabled={disabled}
          readOnly={readOnly}
          value={text}
          className={cn("fiori-field__input", className)}
          onChange={(e) => setText(e.target.value)}
          onFocus={(e) => {
            focusValue.current = value
            onFocus?.(e)
          }}
          onBlur={(e) => {
            commit()
            focusValue.current = undefined
            onBlur?.(e)
          }}
          onKeyDown={(e) => {
            onKeyDown?.(e)
            if (e.defaultPrevented || !interactive) return
            const { key, shiftKey: shift, ctrlKey: ctrl, altKey: alt, metaKey: meta } = e
            const plain = !shift && !ctrl && !alt && !meta
            if (key === "Enter") return commit()
            let handled = true
            if (key === "ArrowUp" && plain) modify(step)
            else if (key === "ArrowDown" && plain) modify(-step)
            else if (key === "Escape" && plain) {
              const prev = focusValue.current ?? value
              setValue(prev)
              validate(prev, format(prev))
            } else if (max !== undefined && ((key === "PageUp" && shift && !ctrl) || (key === "ArrowUp" && shift && ctrl))) modify(max - value)
            else if (min !== undefined && ((key === "PageDown" && shift && !ctrl) || (key === "ArrowDown" && shift && ctrl))) modify(min - value)
            else if ((key === "ArrowUp" || key === "ArrowDown") && (ctrl || shift)) {
              // UI5 swallows these without acting.
            } else handled = false
            if (handled) return e.preventDefault()
            // Block characters that would not leave a number in the field.
            if (key.length === 1 && !ctrl && !meta) {
              const el = e.currentTarget
              const typed = el.value.slice(0, el.selectionStart ?? 0) + key + el.value.slice(el.selectionEnd ?? 0)
              if (!NUMBER.test(typed)) e.preventDefault()
            }
          }}
          {...props}
        />
      </div>
      {!readOnly && button(1)}
      </div>
      {showMessage && (
        <div
          id={messageId}
          role="status"
          data-popover=""
          data-sap-ui-fastnavgroup-container="true"
          data-value-state={effectiveState}
          className="fiori-value-state-message absolute start-0 top-full z-50 mt-1 hidden max-w-[22rem] group-focus-within/field:block"
        >
          <Icon icon={valueStateIcons[effectiveState]} />
          {message}
        </div>
      )}
    </div>
  )
}

function parse(s: string) {
  return NUMBER.test(s.trim()) ? Number(s) : Number.NaN
}

export { StepInput, type StepInputProps, type StepInputTexts }

const defaultStepInputTexts: StepInputTexts = {
  decrement: "Decrease", // UI5 NUMBERINPUT_DEC_ICON_TITLE
  increment: "Increase", // UI5 NUMBERINPUT_INC_ICON_TITLE
  invalidFormat: precision => `This format is not supported. Enter a number with ${precision} decimal places.`, // UI5 NUMBERINPUT_PATTERN_MISSMATCH
  belowMinimum: minimum => `Enter a number higher than the minimum value of  ${minimum}.`, // UI5 NUMBERINPUT_RANGEUNDERFLOW
  aboveMaximum: maximum => `Enter a number lower than the maximum value of  ${maximum}.`, // UI5 NUMBERINPUT_RANGEOVERFLOW
}
const defaultStepInputTextsKeys = { decrement: "NUMBERINPUT_DEC_ICON_TITLE", increment: "NUMBERINPUT_INC_ICON_TITLE", invalidFormat: "NUMBERINPUT_PATTERN_MISSMATCH", belowMinimum: "NUMBERINPUT_RANGEUNDERFLOW", aboveMaximum: "NUMBERINPUT_RANGEOVERFLOW" } as const
