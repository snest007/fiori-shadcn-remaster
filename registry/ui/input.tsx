// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

// UI5 InputPopoverTemplate/Popup.onEnterDOM: the standalone value-state message is a Popup scope.

import { alert, error, information, sysEnter2 } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"

// Record input origin before a pointer-opened popup mounts its Input. UI5 Input.css.js
// paints pointer focus too; document modality enforces AGENTS rule 5, including autofocus.
const inputFocusModality = new WeakMap<Document, { keyboard: boolean }>()
function getInputFocusModality(owner: Document) {
  let state = inputFocusModality.get(owner)
  if (!state) {
    state = { keyboard: true }
    const current = state
    owner.addEventListener("keydown", () => { current.keyboard = true }, true)
    owner.addEventListener("pointerdown", () => { current.keyboard = false }, true)
    inputFocusModality.set(owner, current)
  }
  return state
}
if (typeof document !== "undefined") getInputFocusModality(document)

type ValueState = "none" | "negative" | "critical" | "positive" | "information"

const valueStateIcons = { negative: error, critical: alert, positive: sysEnter2, information: information }
const valueStateDefaultText: Record<Exclude<ValueState, "none">, string> = {
  negative: "Invalid entry",
  critical: "Warning issued",
  positive: "Entry successfully validated",
  information: "Informative entry",
}

/**
 * @accessibility Tab reaches the inner native input. Connect Label.htmlFor to Input.id, or pass aria-label / aria-labelledby; these native ARIA props land on the input, not its visual wrapper.
 * @accessibility aria-description passes to the inner native input (UI5 accessibleDescription); aria-labelledby / aria-describedby pass reference channels to that same input.
 * @accessibility aria-describedby on the input is merged with the focused value-state message id. Negative sets aria-invalid; valueStateMessage is the overridable role=status message. Read-only and disabled fields hide that message.
 */
type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  valueState?: ValueState
  /**
   * Text shown below the field while it has focus (Fiori's value state message).
   * Defaults to SAP's standard text for the state; pass `null` to hide it.
   */
  valueStateMessage?: React.ReactNode | null
  /** Trailing content inside the field, e.g. a value-help <InputIcon>. */
  icon?: React.ReactNode
  wrapperClassName?: string
}

// Mirrors ui5-input (Horizon): bottom-border field, inner focus ring, value states with a
// message popover that appears while the field is focused.
function Input({
  className,
  wrapperClassName,
  valueState = "none",
  valueStateMessage,
  icon,
  disabled,
  readOnly,
  id,
  "aria-describedby": ariaDescribedBy,
  ...props
}: InputProps) {
  const autoId = React.useId()
  const messageId = `${id ?? autoId}-vsm`
  const hasState = valueState !== "none"
  const message = valueStateMessage === undefined && hasState ? valueStateDefaultText[valueState] : valueStateMessage
  const showMessage = hasState && message != null && !readOnly && !disabled

  return (
    <div
      onPointerDownCapture={(event) => event.currentTarget.setAttribute("data-pointer-focus", "")}
      onFocusCapture={(event) => {
        if (getInputFocusModality(event.currentTarget.ownerDocument).keyboard) event.currentTarget.removeAttribute("data-pointer-focus")
        else event.currentTarget.setAttribute("data-pointer-focus", "")
      }}
      onKeyDownCapture={(event) => event.currentTarget.removeAttribute("data-pointer-focus")}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.removeAttribute("data-pointer-focus") }}
      data-slot="input"
      data-value-state={hasState ? valueState : undefined}
      data-disabled={disabled ? "" : undefined}
      data-readonly={readOnly ? "" : undefined}
      data-icons={icon ? "" : undefined}
      style={{ "--fiori-field-icons": icon ? 1 : 0 } as React.CSSProperties}
      className={cn("fiori-field group/field my-(--fiori-input-margin-top-bottom)", wrapperClassName)}
    >
      <input
        id={id}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={valueState === "negative" || undefined}
        aria-describedby={cn(ariaDescribedBy, showMessage && messageId) || undefined}
        className={cn("fiori-field__input", className)}
        {...props}
      />
      {icon}
      {showMessage && (
        <div
          id={messageId}
          role="status"
          data-popover=""
          data-sap-ui-fastnavgroup-container="true"
          data-value-state={valueState}
          className={cn(
            "fiori-value-state-message absolute start-0 top-full z-50 mt-1 hidden max-w-[22rem]",
            "group-focus-within/field:block"
          )}
        >
          <Icon icon={valueStateIcons[valueState]} />
          {message}
        </div>
      )}
    </div>
  )
}

type InputIconProps = React.ComponentProps<"span">

/** Container for a trailing icon inside <Input icon={...}>. Wrap a <button> for value help. */
function InputIcon({ className, ...props }: InputIconProps) {
  return <span data-slot="input-icon" className={cn("fiori-field__icon", className)} {...props} />
}

export { Input, InputIcon, valueStateIcons, valueStateDefaultText, type InputProps, type ValueState }
