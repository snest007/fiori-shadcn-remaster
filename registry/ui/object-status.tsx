import * as React from "react"
import { useFioriTexts } from "@/lib/fiori-locale"

import type { FioriIconData } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"

// ObjectStatus after SAPUI5's sap.m.ObjectStatus (Horizon) and the Fiori guideline "Object Status". There is no
// UI5 Web Component for it: styles follow sap.m's compiled sap_horizon CSS, values are --sap* theme tokens.
// - Plain: optional label ("Title:") in the label color, then icon + text in the semantic color.
// - Inverted: icon + text in a filled badge (bold, small font) with the semantic button colors.
// - Large: 1.5rem light text (header facets / KPIs).
// - Active: the status becomes a button (underlined text; Enter / Space press it).
// States use the shared names (none | negative | critical | positive | information) plus SAP's indication
// colors 1–10 (indication1 … indication10). The state is announced through a visually hidden text.
type ObjectStatusState =
  | "none"
  | "negative"
  | "critical"
  | "positive"
  | "information"
  | `indication${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}`

type ObjectStatusProps = Omit<React.ComponentProps<"span">, "title"> & {
  /** Label before the text, rendered with a colon ("Status:"). */
  title?: React.ReactNode
  text?: React.ReactNode
  icon?: FioriIconData
  state?: ObjectStatusState
  /** Filled badge look. */
  inverted?: boolean
  /** Large text (header KPIs). */
  large?: boolean
  /** Renders the status as a button with link styling. */
  active?: boolean
  /** Hidden text announcing the state; default "Error" / "Warning" / "Success" / "Information"; `null` turns it off. */
  stateAnnouncementText?: string | null
  /** SAP-keyed state announcements; stateAnnouncementText keeps precedence. */
  texts?: Partial<typeof defaultStateText>
  /** Accessible name for an icon-only status. */
  iconLabel?: string
}

const defaultStateText: Partial<Record<ObjectStatusState, string>> = {
  negative: "Error",
  critical: "Warning",
  positive: "Success",
  information: "Information",
}

function ObjectStatus({
  title,
  text,
  icon,
  state = "none",
  inverted,
  large,
  active,
  stateAnnouncementText,
  texts,
  iconLabel,
  className,
  onClick,
  onKeyDown,
  onKeyUp,
  ...props
}: ObjectStatusProps) {
  const defaultStateTextLocalized = useFioriTexts(defaultStateText, defaultStateTextKeys, texts)

  const hasText = text != null && text !== ""
  const announcement = stateAnnouncementText === undefined ? defaultStateTextLocalized[state] : stateAnnouncementText
  const content = (
    <span className="fiori-object-status__wrapper">
      {icon && (
        <span className={cn("fiori-object-status__icon", !hasText && "fiori-object-status__icon--only")}>
          <Icon icon={icon} label={!hasText ? iconLabel : undefined} />
        </span>
      )}
      {hasText && <span className="fiori-object-status__text">{text}</span>}
    </span>
  )
  return (
    <span
      data-slot="object-status"
      data-state={state}
      data-inverted={inverted ? "" : undefined}
      data-large={large ? "" : undefined}
      data-active={active ? "" : undefined}
      className={cn("fiori-object-status", className)}
      {...props}
    >
      {title != null && title !== "" && <span className="fiori-object-status__title">
          {title}
          <span className="fiori-object-status__colon">:</span>
        </span>}
      {active ? (
        <span
          role="button"
          tabIndex={0}
          className="fiori-object-status__link"
          onClick={onClick as React.MouseEventHandler<HTMLSpanElement>}
          onKeyDown={(e) => {
            onKeyDown?.(e)
            if (e.key === "Enter") {
              e.preventDefault()
              e.currentTarget.click()
            } else if (e.key === " ") e.preventDefault()
          }}
          onKeyUp={(e) => {
            onKeyUp?.(e)
            if (e.key === " ") e.currentTarget.click()
          }}
        >
          {content}
        </span>
      ) : (
        content
      )}
      {announcement && <span className="sr-only">{announcement}</span>}
    </span>
  )
}

export { ObjectStatus, type ObjectStatusProps, type ObjectStatusState }

const defaultStateTextKeys = {
  "negative": "VALUE_STATE_ERROR",
  "critical": "VALUE_STATE_WARNING",
  "positive": "VALUE_STATE_SUCCESS",
  "information": "VALUE_STATE_INFORMATION"
} as const
