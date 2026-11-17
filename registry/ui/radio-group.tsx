// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { valueStateDefaultText, type ValueState } from "@/components/ui/input"

// UI5 getEffectiveDir/ItemNavigation follows the nearest DOM direction. Radix otherwise
// writes dir=ltr even when its owner is RTL; observe ancestors to retain live inheritance.
function useInheritedDirection(owner: React.RefObject<HTMLElement | null>, explicit?: "ltr" | "rtl") {
  const [direction, setDirection] = React.useState<"ltr" | "rtl">("ltr")
  React.useLayoutEffect(() => {
    const node = owner.current?.parentElement
    if (!node) return
    const update = () => setDirection(getComputedStyle(node).direction === "rtl" ? "rtl" : "ltr")
    update()
    const observer = new MutationObserver(update)
    for (let ancestor: HTMLElement | null = node; ancestor; ancestor = ancestor.parentElement) {
      observer.observe(ancestor, { attributes: true, attributeFilter: ["dir", "style", "class"] })
    }
    return () => observer.disconnect()
  }, [owner])
  return explicit ?? direction
}

type GroupContextValue = { readOnly?: boolean; valueState: ValueState }
const RadioGroupContext = React.createContext<GroupContextValue>({ valueState: "none" })

/**
 * @accessibility Name the radiogroup with aria-label or aria-labelledby; each RadioGroupItem is named by text or its native aria-label.
 * @accessibility Tab enters the selected radio. Arrows move and select, with horizontal arrows mirrored in RTL. readOnly allows focus movement without selection. Item valueStateText overrides its hidden validation description.
 */
type RadioGroupProps = React.ComponentProps<typeof RadioGroupPrimitive.Root> & {
  /** Every item is focusable (arrow keys still move focus) but the value can't be changed. */
  readOnly?: boolean
  /** Default value state for every item; an item's own `valueState` wins. */
  valueState?: ValueState
}

// Mirrors a group of ui5-radio-button sharing a `name`: one tab stop (the checked item, or the first),
// arrow keys move focus AND selection (wrapping, skipping disabled items), Space/Enter select.
function RadioGroup({ className, readOnly, valueState = "none", orientation, dir, ref, ...props }: RadioGroupProps) {
  const owner = React.useRef<HTMLDivElement>(null)
  React.useImperativeHandle(ref, () => owner.current!, [])
  const direction = useInheritedDirection(owner, dir)
  const ctx = React.useMemo(() => ({ readOnly, valueState }), [readOnly, valueState])
  return (
    <RadioGroupContext.Provider value={ctx}>
      <RadioGroupPrimitive.Root
        ref={owner}
        dir={direction}
        data-slot="radio-group"
        data-orientation={orientation ?? "vertical"}
        // Fiori navigates with both arrow axes regardless of layout, so no `orientation` for Radix.
        aria-orientation={orientation}
        aria-readonly={readOnly || undefined}
        className={cn("fiori-radio-group", className)}
        {...props}
      />
    </RadioGroupContext.Provider>
  )
}

type RadioGroupItemProps = Omit<React.ComponentProps<typeof RadioGroupPrimitive.Item>, "children"> & {
  /** Label text rendered inside the control (ui5-radio-button `text`). */
  text?: React.ReactNode
  valueState?: ValueState
  /** Screen-reader text for the value state; defaults to SAP's standard text. */
  valueStateText?: string
  /** Focusable, but can't be selected (the group's `readOnly` sets it for every item). */
  readOnly?: boolean
}

function RadioGroupItem({
  className,
  text,
  valueState: itemState,
  valueStateText,
  readOnly: itemReadOnly,
  disabled,
  onClick,
  onKeyDown,
  "aria-describedby": ariaDescribedBy,
  ...props
}: RadioGroupItemProps) {
  const group = React.useContext(RadioGroupContext)
  const readOnly = itemReadOnly ?? group.readOnly
  const valueState = itemState ?? group.valueState
  const hasState = valueState !== "none"
  const descId = React.useId()
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      data-text={text ? "" : undefined}
      data-value-state={hasState ? valueState : undefined}
      data-readonly={readOnly ? "" : undefined}
      disabled={disabled}
      aria-invalid={valueState === "negative" || undefined}
      aria-describedby={cn(ariaDescribedBy, hasState && descId) || undefined}
      className={cn("fiori-radio", className)}
      onClick={(e) => {
        onClick?.(e)
        if (readOnly) e.preventDefault() // focus may land here, selection may not
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented) return
        // Fiori: Enter selects too (Radix only reacts to Space).
        if (e.key === "Enter" && !readOnly && !disabled) {
          e.preventDefault()
          e.currentTarget.click()
          return
        }
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
        // ui5-radio-button moves focus AND selection on every arrow press, wrapping and skipping
        // disabled items (read-only ones get focus only). Radix only selects while the key is held,
        // so we take over arrows (preventDefault also stops Radix's roving focus handler).
        const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
        const step = { ArrowDown: 1, ArrowUp: -1, ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key]
        if (step === undefined) {
          if (["Home", "End", "PageUp", "PageDown"].includes(e.key)) e.preventDefault() // not used by ui5
          return
        }
        e.preventDefault()
        const group = e.currentTarget.closest('[data-slot="radio-group"]')
        const items = [...(group?.querySelectorAll<HTMLButtonElement>('[data-slot="radio-group-item"]') ?? [])].filter(
          (i) => !i.disabled && i.closest('[data-slot="radio-group"]') === group
        )
        const next = items[(items.indexOf(e.currentTarget) + step + items.length) % items.length]
        if (!next || next === e.currentTarget) return
        next.focus()
        if (!next.hasAttribute("data-readonly")) next.click()
      }}
      {...props}
    >
      <span className="fiori-radio__inner">
        <svg className="fiori-radio__svg" focusable="false" aria-hidden="true">
          <circle className="fiori-radio__outer" cx="50%" cy="50%" r="50%" />
          <circle className="fiori-radio__dot" cx="50%" cy="50%" />
        </svg>
      </span>
      {text && (
        <span className="fiori-radio__label">
          <span className="fiori-radio__label-text">{text}</span>
        </span>
      )}
      {/* hidden: referenced by aria-describedby, kept out of the accessible name */}
      {hasState && (
        <span id={descId} hidden>
          {valueStateText ?? valueStateDefaultText[valueState as Exclude<ValueState, "none">]}
        </span>
      )}
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem, type RadioGroupProps, type RadioGroupItemProps }
