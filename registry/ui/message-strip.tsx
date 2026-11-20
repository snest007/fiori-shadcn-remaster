// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { useFioriLocale, useFioriTexts } from "@/lib/fiori-locale"

// UI5 2.28 MessageStrip fastNavigation metadata; UI5Element.onEnterDOM marks this root unless overridden.

import { alert, decline, error, information, sysEnter2 } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"

type MessageStripDesign = "information" | "positive" | "negative" | "critical" | "color-set-1" | "color-set-2"
type ColorScheme = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

const designIcons = { information, positive: sysEnter2, negative: error, critical: alert }

const defaultDesignText: Record<MessageStripDesign, string> = {
  information: "Information Message Strip",
  positive: "Success Message Strip",
  negative: "Error Message Strip",
  critical: "Warning Message Strip",
  "color-set-1": "Custom Message Strip",
  "color-set-2": "Custom Message Strip",
}
const defaultCloseText: Record<MessageStripDesign, string> = {
  information: "Close information message strip",
  positive: "Close positive message strip",
  negative: "Close negative message strip",
  critical: "Close critical message strip",
  "color-set-1": "Close custom message strip",
  "color-set-2": "Close custom message strip",
}

/** @accessibility The strip announces its design, content and closability through a note. closeButtonText names the close button; designText and closableText override hidden announcements. onClose requests dismissal; the caller removes the strip and must leave a reachable next action. */
type MessageStripProps = React.ComponentProps<"div"> & {
  design?: MessageStripDesign
  /** For the color-set designs: which of SAP's 10 indication colours. Default 1. */
  colorScheme?: ColorScheme
  hideIcon?: boolean
  hideCloseButton?: boolean
  /** Custom icon (an <Icon>). Color-set designs show no icon unless one is given. */
  icon?: React.ReactNode
  /** Fired by the close button. The strip does not remove itself; the caller decides. */
  onClose?: () => void
  /** Accessible name and tooltip of the close button. */
  closeButtonText?: string
  /** Hidden text announcing the strip type (default e.g. "Error Message Strip"). */
  designText?: string
  /** Hidden text appended when the strip is closable (default "Closable"). */
  closableText?: string
}

// Mirrors ui5-message-strip (Horizon): role="note", state icon, transparent close button.
function MessageStrip({
  design = "information",
  colorScheme = 1,
  hideIcon,
  hideCloseButton,
  icon,
  onClose,
  closeButtonText,
  designText,
  closableText: closableTextProp,
  className,
  style,
  children,
  ...props
}: MessageStripProps) {
  const defaultDesignTextLocalized = useFioriTexts(defaultDesignText, defaultDesignTextKeys)

  const defaultCloseTextLocalized = useFioriTexts(defaultCloseText, defaultCloseTextKeys)

  const { t } = useFioriLocale()
  const closableText = closableTextProp ?? t("MESSAGE_STRIP_CLOSABLE", "Closable") // UI5 MESSAGE_STRIP_CLOSABLE

  const id = React.useId()
  const isColorSet = design === "color-set-1" || design === "color-set-2"
  const shouldHideIcon = hideIcon || (isColorSet && !icon)
  const closeText = closeButtonText ?? defaultCloseTextLocalized[design]
  const schemeVars = isColorSet
    ? design === "color-set-1"
      ? { "--fiori-ms-bg": `var(--sapIndicationColor_${colorScheme}_Background)`, "--fiori-ms-border": `var(--sapIndicationColor_${colorScheme}_BorderColor)` }
      : {
          "--fiori-ms-bg": `var(--fiori-message-strip-scheme-${colorScheme}-set-2-background)`,
          "--fiori-ms-border": `var(--fiori-message-strip-scheme-${colorScheme}-set-2-border-color)`,
        }
    : undefined
  return (
    <div
      data-slot="message-strip" data-sap-ui-fastnavgroup="true"
      data-design={design}
      data-hide-icon={shouldHideIcon ? "" : undefined}
      data-hide-close={hideCloseButton ? "" : undefined}
      role="note"
      aria-labelledby={`${id}-hidden ${id}-text`}
      className={cn("fiori-message-strip", className)}
      style={{ ...schemeVars, ...style } as React.CSSProperties}
      {...props}
    >
      {!shouldHideIcon && (
        <div className="fiori-message-strip__icon" aria-hidden>
          {icon ?? <Icon icon={designIcons[design as keyof typeof designIcons]} />}
        </div>
      )}
      <span id={`${id}-hidden`} className="sr-only">
        {`${designText ?? defaultDesignTextLocalized[design]} ${hideCloseButton ? "" : closableText}`}
      </span>
      <span id={`${id}-text`} className="fiori-message-strip__text">
        {children}
      </span>
      {!hideCloseButton && (
        <Button variant="transparent" size="icon" className={cn(
            // Utilities (not component CSS) so they win over the Button's own utilities.
            "fiori-message-strip__close absolute h-[1.625rem] min-h-[1.625rem]",
            "top-(--fiori-message-strip-close-button-top) end-(--fiori-message-strip-close-button-right)",
            design === "color-set-1" && [
              "text-(--fiori-message-strip-close-button-color-set-1-color) hover:text-(--fiori-message-strip-close-button-color-set-1-color)",
              "hover:bg-(--fiori-message-strip-close-button-color-set-1-background) hover:border-(--sapContent_ContrastIconColor) hover:[text-shadow:var(--sapContent_ContrastTextShadow)]",
              "active:bg-transparent active:border-(--sapContent_ContrastIconColor)",
              "focus-visible:after:border-(--sapContent_ContrastFocusColor)",
            ],
            design === "color-set-2" && [
              "text-(--sapContent_IconColor) hover:text-(--sapContent_IconColor)",
              "hover:bg-(--fiori-message-strip-close-button-color-set-2-background) hover:border-(--sapContent_IconColor)",
              "active:bg-transparent active:border-(--sapContent_IconColor)",
            ]
          )} title={closeText} aria-label={closeText} onClick={onClose}>
          <Icon icon={decline} />
        </Button>
      )}
    </div>
  )
}

export { MessageStrip, type MessageStripProps, type MessageStripDesign }

const defaultDesignTextKeys = {
  "information": "MESSAGE_STRIP_INFORMATION",
  "positive": "MESSAGE_STRIP_SUCCESS",
  "negative": "MESSAGE_STRIP_ERROR",
  "critical": "MESSAGE_STRIP_WARNING",
  "color-set-1": "MESSAGE_STRIP_CUSTOM",
  "color-set-2": "MESSAGE_STRIP_CUSTOM"
} as const

const defaultCloseTextKeys = {
  "information": "MESSAGE_STRIP_CLOSE_BUTTON_INFORMATION",
  "positive": "MESSAGE_STRIP_CLOSE_BUTTON_POSITIVE",
  "negative": "MESSAGE_STRIP_CLOSE_BUTTON_NEGATIVE",
  "critical": "MESSAGE_STRIP_CLOSE_BUTTON_CRITICAL",
  "color-set-1": "MESSAGE_STRIP_CLOSE_BUTTON_CUSTOM",
  "color-set-2": "MESSAGE_STRIP_CLOSE_BUTTON_CUSTOM"
} as const
