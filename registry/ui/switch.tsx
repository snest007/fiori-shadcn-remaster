// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { accept, decline, less } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"

// UI5 getEffectiveDir/ItemNavigation follows the nearest DOM direction. CSS optimizers may
// lower :dir(rtl) to language selectors; data-dir preserves actual DOM direction.
function useHostDirection(owner: React.RefObject<HTMLElement | null>, explicit?: "ltr" | "rtl") {
  const [direction, setDirection] = React.useState<"ltr" | "rtl">("ltr")
  React.useLayoutEffect(() => {
    const node = owner.current
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

/**
 * @accessibility Native aria-label, aria-labelledby and aria-describedby reach the switch button. The component owns aria-checked; textOn and textOff are visual track text.
 * @accessibility Space and Enter toggle. readOnly keeps a keyboard stop and adds the overridable readOnlyText description.
 */
type SwitchProps = Omit<React.ComponentProps<typeof SwitchPrimitive.Root>, "children"> & {
  /**
   * "textual" (default): shows `textOn`/`textOff`, or check/minus icons when neither is given.
   * "graphical": semantic positive/negative colors with accept/decline icons.
   */
  design?: "textual" | "graphical"
  /** Short text shown on the track while on (Fiori recommends ≤ 3 characters). */
  textOn?: string
  /** Short text shown on the track while off. */
  textOff?: string
  /** Focusable but can't be toggled. */
  readOnly?: boolean
  /** Screen-reader description while read-only. */
  readOnlyText?: string
}

// Mirrors ui5-switch (Horizon). Space and Enter toggle (native <button>).
function Switch({
  className,
  design = "textual",
  textOn,
  textOff,
  readOnly,
  readOnlyText = "Read Only",
  onClick,
  onCheckedChange,
  ref,
  "aria-describedby": ariaDescribedBy,
  ...props
}: SwitchProps) {
  const changeTarget = React.useRef<HTMLButtonElement>(null)
  React.useImperativeHandle(ref, () => changeTarget.current!, [])
  const direction = useHostDirection(changeTarget)
  const descId = React.useId()
  const graphical = design === "graphical"
  const kind = graphical ? "graphical" : textOn || textOff ? "textual" : "no-label"
  return (
    <SwitchPrimitive.Root
      ref={changeTarget}
      data-slot="switch"
      data-dir={direction}
      data-design={kind}
      data-readonly={readOnly ? "" : undefined}
      aria-readonly={readOnly || undefined}
      aria-describedby={cn(ariaDescribedBy, readOnly && descId) || undefined}
      className={cn("fiori-switch", className)}
      onClick={(e) => {
        onClick?.(e)
        if (readOnly) e.preventDefault() // vetoes Radix's toggle
      }}
      onCheckedChange={(checked) => {
        onCheckedChange?.(checked)
        // UI5 Switch.js/toggle emits change only after the user toggles.
        changeTarget.current?.dispatchEvent(new Event("fiori-control-change", { bubbles: true }))
      }}
      {...props}
    >
      <span className="fiori-switch__inner">
        <span className="fiori-switch__track">
          <span className="fiori-switch__slider">
            <span aria-hidden className="fiori-switch__text fiori-switch__text--on">
              {kind === "textual" ? textOn : <Icon icon={accept} className="fiori-switch__icon" />}
            </span>
            <span aria-hidden className="fiori-switch__text fiori-switch__text--off">
              {kind === "textual" ? textOff : <Icon icon={graphical ? decline : less} className="fiori-switch__icon" />}
            </span>
            <SwitchPrimitive.Thumb className="fiori-switch__handle" />
          </span>
        </span>
      </span>
      {readOnly && (
        <span id={descId} className="sr-only">
          {readOnlyText}
        </span>
      )}
    </SwitchPrimitive.Root>
  )
}

export { Switch, type SwitchProps }
