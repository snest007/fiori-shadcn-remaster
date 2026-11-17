// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by shadcn-fiori: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

import { information, statusCritical, statusNegative, statusPositive } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import { valueStateDefaultText, type ValueState } from "@/components/ui/input"

const stateIcons = { negative: statusNegative, critical: statusCritical, positive: statusPositive, information }

type ProgressIndicatorProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Progress in percent, clamped to 0–100. */
  value?: number
  /** Text shown instead of "<value>%". */
  displayValue?: string
  /** Hide the value text. */
  hideValue?: boolean
  /** Colors the bar and shows the state icon. */
  valueState?: ValueState
  /** State text appended to aria-valuetext; defaults to SAP's standard text. */
  valueStateText?: string
}

// Mirrors ui5-progress-indicator (Horizon): a thin track with a value bar; the value text sits above the
// bar (in the filled part above 50%, otherwise in the remaining part), with a state icon after it.
// role="progressbar" with aria-valuenow 0–100 and aria-valuetext "<n>% <state text>".
function ProgressIndicator({
  value = 0,
  displayValue,
  hideValue,
  valueState = "none",
  valueStateText,
  className,
  "aria-label": ariaLabel,
  ...props
}: ProgressIndicatorProps) {
  const v = Math.min(Math.max(value, 0), 100)
  const hasState = valueState !== "none"
  const stateText = hasState ? (valueStateText ?? valueStateDefaultText[valueState]) : undefined
  const label = (
    <>
      {hasState && <Icon icon={stateIcons[valueState]} className="fiori-progress-indicator__icon" />}
      {!hideValue && <span className="fiori-progress-indicator__value"> {displayValue || `${v}%`}</span>}
    </>
  )
  const inRemaining = value <= 50
  return (
    <div
      data-slot="progress-indicator"
      data-value-state={hasState ? valueState : undefined}
      data-hide-value={hideValue ? "" : undefined}
      className={cn("fiori-progress-indicator", className)}
      {...props}
    >
      <div
        className="fiori-progress-indicator__root"
        data-min={v === 0 ? "" : undefined}
        data-max={v === 100 ? "" : undefined}
        role="progressbar"
        aria-valuemin={0}
        aria-valuenow={v}
        aria-valuemax={100}
        aria-valuetext={stateText ? `${v}% ${stateText}` : `${v}%`}
        aria-label={ariaLabel}
      >
        <div className="fiori-progress-indicator__bar" style={{ width: `${v}%` }}>
          {!inRemaining && label}
        </div>
        <div className="fiori-progress-indicator__remaining">{inRemaining && label}</div>
      </div>
    </div>
  )
}

export { ProgressIndicator, type ProgressIndicatorProps }
