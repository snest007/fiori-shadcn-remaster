import * as React from "react"
import { useFioriLocale, useFioriTexts } from "@/lib/fiori-locale"

// UI5 InputPopoverTemplate/Popup.onEnterDOM: the standalone value-state message is a Popup scope.

import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import { useValueStateTexts, valueStateIcons, type ValueState } from "@/components/ui/input"

type CounterMode = "none" | "always" | "auto"

/**
 * @accessibility Native aria-label, aria-labelledby and aria-describedby reach the textarea. Its value-state message and character counter are linked descriptions.
 * @accessibility Typing edits the field; Escape restores the value from focus. counterText and valueStateMessage override the counter and validation descriptions.
 */
type TextAreaProps = Omit<React.ComponentProps<"textarea">, "rows"> & {
  valueState?: ValueState
  /**
   * Text shown below the field while it has focus. Defaults to SAP's standard text for
   * negative / critical / information (UI5 shows none for positive); pass `null` to hide it.
   */
  valueStateMessage?: React.ReactNode | null
  /** Visible rows (minimum rows when `growing`). Defaults to 2, like UI5. */
  rows?: number
  /** Grow with the content instead of scrolling. */
  growing?: boolean
  /** Maximum rows a growing textarea expands to; 0 = unlimited. */
  growingMaxRows?: number
  /**
   * Character counter below the field (needs `maxLength`). `"none"`: `maxLength` is a hard cap;
   * `"always"`: counter always shown and the limit may be exceeded; `"auto"`: like always, but the
   * counter is only visible while focused, over the limit, or in a negative/critical state.
   */
  counterMode?: CounterMode
  /** Counter text; defaults to "N characters left" / "N characters over limit". */
  counterText?: (remaining: number) => string
  /** Overrides the native textarea validationMessage and character counter. */
  texts?: Partial<TextAreaTexts>
  locale?: string
  wrapperClassName?: string
}

const defaultCounterText = (n: number) => (n >= 0 ? `${n} characters left` : `${-n} characters over limit`)
type TextAreaTexts = { valueMissing: string; tooLong: (count: number) => string; counter: (remaining: number) => string }
const defaultTexts: TextAreaTexts = {
  valueMissing: "Please fill in this field.", // UI5 FORM_TEXTFIELD_REQUIRED
  tooLong: count => `Value too long by ${count} characters.`, // UI5 TEXTAREA_EXCEEDS_MAXLENGTH
  counter: defaultCounterText, // UI5 TEXTAREA_CHARACTERS_LEFT / TEXTAREA_CHARACTERS_EXCEEDED
}
const defaultTextsKeys = { valueMissing: "FORM_TEXTFIELD_REQUIRED", tooLong: "TEXTAREA_EXCEEDS_MAXLENGTH" } as const

/** Sets a textarea's value the way a user edit would, so React's onChange fires (controlled or not). */
function setNativeValue(el: HTMLTextAreaElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(el, value)
  el.dispatchEvent(new Event("input", { bubbles: true }))
}

// Mirrors ui5-textarea (Horizon): full-border field, rows / growing via a hidden mirror,
// optional character counter, Escape restores the value the field had when it got focus.
function TextArea({
  className,
  wrapperClassName,
  style,
  valueState = "none",
  valueStateMessage,
  rows = 0,
  growing = false,
  growingMaxRows = 0,
  counterMode = "none",
  counterText: counterTextProp,
  texts: textsProp,
  locale: localeProp,
  required,
  ref: externalRef,
  maxLength,
  disabled,
  readOnly,
  id,
  value: valueProp,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  "aria-describedby": ariaDescribedBy,
  ...props
}: TextAreaProps) {
  const { t, localized, hasProvider } = useFioriLocale(localeProp)
  const texts = useFioriTexts(defaultTexts, defaultTextsKeys, textsProp, localeProp)
  const counterText = counterTextProp ?? textsProp?.counter ?? ((n: number) => n >= 0 ? t("TEXTAREA_CHARACTERS_LEFT", () => defaultCounterText(n), n) : t("TEXTAREA_CHARACTERS_EXCEEDED", () => defaultCounterText(n), -n))
  const valueStateTexts = useValueStateTexts()

  const autoId = React.useId()
  const baseId = id ?? autoId
  const [uncontrolled, setUncontrolled] = React.useState(String(defaultValue ?? ""))
  const value = valueProp !== undefined ? String(valueProp) : uncontrolled
  const [focused, setFocused] = React.useState(false)
  const previousValue = React.useRef(value)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const hasCounter = counterMode !== "none" && maxLength != null
  const remaining = hasCounter ? maxLength - value.length : 0
  const counterVisible =
    counterMode === "always" || focused || remaining < 0 || valueState === "negative" || valueState === "critical"

  const hasMessageState = valueState === "negative" || valueState === "critical" || valueState === "information"
  const message = valueStateMessage === undefined && hasMessageState ? valueStateTexts[valueState] : valueStateMessage
  const showMessage = hasMessageState && message != null && !readOnly && !disabled
  const messageId = `${baseId}-vsm`
  const counterId = `${baseId}-counter`
  React.useLayoutEffect(() => {
    // TextArea.js/formValidityMessage belongs to the native form-validity channel;
    // it must not replace the independently configured value-state popup.
    const message = localized || hasProvider || textsProp ? required && !value ? texts.valueMissing : hasCounter && remaining < 0 ? texts.tooLong(-remaining) : "" : ""
    textareaRef.current?.setCustomValidity(message)
  }, [localized, hasProvider, textsProp, required, value, hasCounter, remaining, texts])

  return (
    <div
      data-slot="textarea"
      data-value-state={valueState !== "none" ? valueState : undefined}
      data-disabled={disabled ? "" : undefined}
      data-readonly={readOnly ? "" : undefined}
      data-growing={growing ? "" : undefined}
      data-growing-max-rows={growing && growingMaxRows > 0 ? "" : undefined}
      data-counter={hasCounter ? "" : undefined}
      style={
        {
          "--fiori-textarea-rows": rows || 2,
          "--fiori-textarea-growing-max-rows": growingMaxRows,
          ...style,
        } as React.CSSProperties
      }
      className={cn("fiori-textarea group/field", wrapperClassName)}
    >
      <div className="fiori-textarea__wrapper">
        {growing && (
          <div className="fiori-textarea__mirror" aria-hidden>
            {value.split("\n").map((line, i) => (
              <React.Fragment key={i}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </div>
        )}
        <textarea
          ref={node => { textareaRef.current = node; if (typeof externalRef === "function") externalRef(node); else if (externalRef) externalRef.current = node }}
          id={id}
          rows={rows === 1 ? 1 : undefined}
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          maxLength={hasCounter ? undefined : maxLength}
          aria-invalid={valueState === "negative" || undefined}
          aria-describedby={cn(ariaDescribedBy, showMessage && messageId, hasCounter && counterId) || undefined}
          className={cn("fiori-textarea__input", className)}
          onChange={(e) => {
            if (valueProp === undefined) setUncontrolled(e.target.value)
            onChange?.(e)
          }}
          onFocus={(e) => {
            setFocused(true)
            previousValue.current = e.target.value
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          onKeyDown={(e) => {
            onKeyDown?.(e)
            if (e.defaultPrevented || e.nativeEvent.isComposing) return
            if (e.key === "Escape" && !readOnly && e.currentTarget.value !== previousValue.current) {
              setNativeValue(e.currentTarget, previousValue.current)
            }
          }}
          {...props}
        />
      </div>
      {hasCounter && (
        <span id={counterId} className="fiori-textarea__counter" data-hidden={counterVisible ? undefined : ""}>
          {counterText(remaining)}
        </span>
      )}
      {showMessage && (
        <div
          id={messageId}
          role="status"
          data-popover=""
          data-sap-ui-fastnavgroup-container="true"
          data-value-state={valueState}
          className="fiori-value-state-message absolute start-0 top-full z-50 mt-1 hidden max-w-[22rem] group-focus-within/field:block"
        >
          <Icon icon={valueStateIcons[valueState]} />
          {message}
        </div>
      )}
    </div>
  )
}

export { TextArea, type TextAreaProps, type TextAreaTexts }
