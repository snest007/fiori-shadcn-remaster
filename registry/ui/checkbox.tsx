// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { accept } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import { useValueStateTexts, type ValueState } from "@/components/ui/input"

/**
 * @accessibility text supplies the checkbox name; native aria-label, aria-labelledby and aria-describedby reach the checkbox button.
 * @accessibility Space or Enter toggle; an indeterminate checkbox becomes checked. readOnly remains focusable. valueStateText overrides the hidden validation description.
 */
type CheckboxProps = Omit<React.ComponentProps<typeof CheckboxPrimitive.Root>, "children"> & {
  /** Label text rendered inside the control (ui5-checkbox `text`); clicking it toggles the box. */
  text?: React.ReactNode
  valueState?: ValueState
  /** Screen-reader text for the value state; defaults to SAP's standard text. */
  valueStateText?: string
  /** Focusable and announced, but the value can't be changed. */
  readOnly?: boolean
  /** Truncate the label to one line instead of wrapping (ui5 `wrapping-type="None"`). */
  truncate?: boolean
}

// Mirrors ui5-checkbox (Horizon). Space and Enter toggle; an indeterminate box becomes checked.
// Styles live in registry/styles/components/checkbox.css (stateful selectors on data-* attributes).
function Checkbox({
  className,
  text,
  valueState = "none",
  valueStateText,
  readOnly,
  required,
  disabled,
  truncate,
  onClick,
  onKeyDown,
  "aria-describedby": ariaDescribedBy,
  ...props
}: CheckboxProps) {
  const valueStateTexts = useValueStateTexts()

  const descId = React.useId()
  const hasState = valueState !== "none"
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      data-text={text ? "" : undefined}
      data-value-state={hasState ? valueState : undefined}
      data-readonly={readOnly ? "" : undefined}
      data-truncate={truncate ? "" : undefined}
      disabled={disabled}
      required={required}
      aria-readonly={readOnly || undefined}
      aria-invalid={valueState === "negative" || undefined}
      aria-describedby={cn(ariaDescribedBy, hasState && descId) || undefined}
      className={cn("fiori-checkbox", className)}
      onClick={(e) => {
        onClick?.(e)
        if (readOnly) e.preventDefault() // vetoes Radix's toggle
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        // Fiori: Enter toggles too (Radix only reacts to Space).
        if (!e.defaultPrevented && e.key === "Enter" && !readOnly && !disabled) {
          e.preventDefault()
          e.currentTarget.click()
        }
      }}
      {...props}
    >
      <span className="fiori-checkbox__inner">
        <Icon icon={accept} className="fiori-checkbox__icon size-(--fiori-checkbox-icon-size)" />
      </span>
      {text && (
        <span className={cn("fiori-checkbox__label", truncate && "whitespace-nowrap")}>
          <span className={cn("fiori-checkbox__label-text", truncate && "min-w-0 overflow-hidden text-ellipsis")}>{text}</span>
          {required && <span aria-hidden className="fiori-checkbox__required" />}
        </span>
      )}
      {/* hidden: referenced by aria-describedby, kept out of the accessible name */}
      {hasState && (
        <span id={descId} hidden>
          {valueStateText ?? valueStateTexts[valueState]}
        </span>
      )}
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox, type CheckboxProps }
