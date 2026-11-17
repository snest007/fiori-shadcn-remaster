// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

import { cn } from "@/lib/utils"

// ObjectNumber after SAPUI5's sap.m.ObjectNumber (Horizon) and the Fiori guideline "Object Number". No UI5 Web
// Component exists: styles follow sap.m's compiled sap_horizon CSS with --sap* tokens.
// A number (bold when emphasized, the default) followed by its unit in the light font; colored by state.
// `inverted` draws a filled badge, `large` the 1.5rem header/KPI size. `active` makes it a button.
type ObjectNumberState = "none" | "negative" | "critical" | "positive" | "information"

type ObjectNumberProps = React.ComponentProps<"span"> & {
  number: React.ReactNode
  unit?: React.ReactNode
  state?: ObjectNumberState
  /** Bold number (default true, as in SAPUI5). */
  emphasized?: boolean
  inverted?: boolean
  large?: boolean
  active?: boolean
  textAlign?: "start" | "end" | "center"
  /** Hidden text announcing the state; `null` turns it off. */
  stateAnnouncementText?: string | null
}

const defaultStateText: Partial<Record<ObjectNumberState, string>> = {
  negative: "Error",
  critical: "Warning",
  positive: "Success",
  information: "Information",
}

function ObjectNumber({
  number,
  unit,
  state = "none",
  emphasized = true,
  inverted,
  large,
  active,
  textAlign,
  stateAnnouncementText,
  className,
  style,
  onKeyDown,
  onKeyUp,
  ...props
}: ObjectNumberProps) {
  const announcement = stateAnnouncementText === undefined ? defaultStateText[state] : stateAnnouncementText
  return (
    <span
      data-slot="object-number"
      data-state={state}
      data-emphasized={emphasized ? "" : undefined}
      data-inverted={inverted ? "" : undefined}
      data-large={large ? "" : undefined}
      data-active={active ? "" : undefined}
      role={active ? "button" : undefined}
      tabIndex={active ? 0 : undefined}
      className={cn("fiori-object-number", className)}
      style={textAlign ? { textAlign, ...style } : style}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (!active) return
        if (e.key === "Enter") {
          e.preventDefault()
          e.currentTarget.click()
        } else if (e.key === " ") e.preventDefault()
      }}
      onKeyUp={(e) => {
        onKeyUp?.(e)
        if (active && e.key === " ") e.currentTarget.click()
      }}
      {...props}
    >
      <span className="fiori-object-number__inner">
        <span className="fiori-object-number__text">{number}</span>
        {unit != null && unit !== "" && <span className="fiori-object-number__unit">{unit}</span>}
      </span>
      {announcement && <span className="sr-only">{announcement}</span>}
    </span>
  )
}

export { ObjectNumber, type ObjectNumberProps, type ObjectNumberState }
