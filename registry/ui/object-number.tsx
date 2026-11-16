import * as React from "react"
import { useFioriLocale, useFioriTexts } from "@/lib/fiori-locale"

import { formatNumber } from "@/lib/fiori-numbers"
import { cn } from "@/lib/utils"

// ObjectNumber after SAPUI5's sap.m.ObjectNumber (Horizon) and the Fiori guideline "Object Number". No UI5 Web
// Component exists: styles follow sap.m's compiled sap_horizon CSS with --sap* tokens.
// A number (bold when emphasized, the default) followed by its unit in the light font; colored by state.
// `inverted` draws a filled badge, `large` the 1.5rem header/KPI size. `active` makes it a button.
type ObjectNumberState = "none" | "negative" | "critical" | "positive" | "information"

type ObjectNumberProps = React.ComponentProps<"span"> & {
  number: React.ReactNode
  locale?: string
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
  /** SAP-keyed state announcements; stateAnnouncementText keeps precedence. */
  texts?: Partial<typeof defaultStateText>
}

const defaultStateText: Partial<Record<ObjectNumberState, string>> = {
  negative: "Error",
  critical: "Warning",
  positive: "Success",
  information: "Information",
}

function ObjectNumber({
  number,
  locale: localeProp,
  unit,
  state = "none",
  emphasized = true,
  inverted,
  large,
  active,
  textAlign,
  stateAnnouncementText,
  texts,
  className,
  style,
  onKeyDown,
  onKeyUp,
  ...props
}: ObjectNumberProps) {
  const defaultStateTextLocalized = useFioriTexts(defaultStateText, defaultStateTextKeys, texts)

  const { locale, localized } = useFioriLocale(localeProp)
  const shownNumber = typeof number === "number" && localized ? formatNumber(number, locale) : number
  const announcement = stateAnnouncementText === undefined ? defaultStateTextLocalized[state] : stateAnnouncementText
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
        <span className="fiori-object-number__text">{shownNumber}</span>
        {unit != null && unit !== "" && <span className="fiori-object-number__unit">{unit}</span>}
      </span>
      {announcement && <span className="sr-only">{announcement}</span>}
    </span>
  )
}

export { ObjectNumber, type ObjectNumberProps, type ObjectNumberState }

const defaultStateTextKeys = {
  "negative": "OBJECTNUMBER_ARIA_VALUE_STATE_ERROR",
  "critical": "OBJECTNUMBER_ARIA_VALUE_STATE_WARNING",
  "positive": "OBJECTNUMBER_ARIA_VALUE_STATE_SUCCESS",
  "information": "OBJECTNUMBER_ARIA_VALUE_STATE_INFORMATION"
} as const
