import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { accept, decline, less } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"

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
  "aria-describedby": ariaDescribedBy,
  ...props
}: SwitchProps) {
  const descId = React.useId()
  const graphical = design === "graphical"
  const kind = graphical ? "graphical" : textOn || textOff ? "textual" : "no-label"
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-design={kind}
      data-readonly={readOnly ? "" : undefined}
      aria-readonly={readOnly || undefined}
      aria-describedby={cn(ariaDescribedBy, readOnly && descId) || undefined}
      className={cn("fiori-switch", className)}
      onClick={(e) => {
        onClick?.(e)
        if (readOnly) e.preventDefault() // vetoes Radix's toggle
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
