import * as React from "react"
import { useFioriLocale } from "@/lib/fiori-locale"

import { cn } from "@/lib/utils"

type BusyIndicatorProps = React.ComponentProps<"div"> & {
  /** Shows the indicator (after `delay`). Content passed as children is dimmed and made inert. */
  active?: boolean
  /** Milliseconds before the indicator appears once active. Default 1000, as in UI5. */
  delay?: number
  size?: "S" | "M" | "L"
  /** Text shown with the indicator; also its accessible name. */
  text?: string
  textPlacement?: "top" | "bottom"
  /** Tooltip / accessible title of the busy area (default "Please wait"). */
  title?: string
}

// Mirrors ui5-busy-indicator (Horizon): three pulsing dots, role="progressbar", shown after a delay.
// While busy over content, the content is inert (UI5 swallows its keyboard events) and the busy
// area takes the focus stop instead.
function BusyIndicator({
  active = false,
  delay = 1000,
  size = "M",
  text,
  textPlacement = "bottom",
  title: titleProp,
  className,
  children,
  ...props
}: BusyIndicatorProps) {
  const { t } = useFioriLocale()
  const title = titleProp ?? t("BUSY_INDICATOR_TITLE", "Please wait") // UI5 BUSY_INDICATOR_TITLE

  const [busy, setBusy] = React.useState(false)
  React.useEffect(() => {
    if (!active) {
      setBusy(false)
      return
    }
    const t = setTimeout(() => setBusy(true), Math.max(0, delay))
    return () => clearTimeout(t)
  }, [active, delay])
  const labelId = React.useId()
  const hasContent = React.Children.count(children) > 0
  const label = text ? (
    // UI5 renders the text with ui5-label, whose text wrapper has 0.075rem end padding.
    <span id={labelId} className="fiori-busy-indicator__text">
      <span className="pe-[0.075rem]">{text}</span>
    </span>
  ) : null

  return (
    <div
      data-slot="busy-indicator"
      data-size={size}
      data-active={active ? "" : undefined}
      data-busy={busy ? "" : undefined}
      data-has-text={text ? "" : undefined}
      data-text-placement={textPlacement}
      aria-busy={busy || undefined}
      className={cn("fiori-busy-indicator", className)}
      {...props}
    >
      <div className="fiori-busy-indicator__root">
        {busy && (
          <div
            className="fiori-busy-indicator__area"
            data-over-content={hasContent ? "" : undefined}
            title={title}
            tabIndex={0}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext="Busy"
            aria-labelledby={text ? labelId : undefined}
            aria-label={text ? undefined : title}
          >
            {textPlacement === "top" && label}
            <div className="fiori-busy-indicator__circles">
              <div className="fiori-busy-indicator__circle" />
              <div className="fiori-busy-indicator__circle" />
              <div className="fiori-busy-indicator__circle" />
            </div>
            {textPlacement === "bottom" && label}
          </div>
        )}
        {hasContent && (
          <div className="fiori-busy-indicator__content contents" inert={busy || undefined}>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

export { BusyIndicator, type BusyIndicatorProps }
