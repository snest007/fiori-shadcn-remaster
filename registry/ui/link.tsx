// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

import type { FioriIconData } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"

type LinkDesign = "default" | "subtle" | "emphasized"

/** @accessibility children names the link; provide aria-label for icon-only content. Enter and Space activate it, including action links without href. disabled prevents activation. designText is hidden design guidance appended to the visible text. */
type LinkProps = React.ComponentProps<"a"> & {
  design?: LinkDesign
  /** "normal" wraps long text; "none" keeps one line and truncates. */
  wrappingType?: "normal" | "none"
  /** "large" enlarges the target to 24px line height (WCAG 2.2 target size). */
  interactiveAreaSize?: "normal" | "large"
  disabled?: boolean
  /** Icon before / after the text. */
  icon?: FioriIconData
  endIcon?: FioriIconData
  /**
   * Hidden text announcing the design, as UI5 does. Defaults to "Subtle" / "Emphasized";
   * pass your own translation, or null to omit.
   */
  designText?: string | null
}

const defaultDesignText: Partial<Record<LinkDesign, string>> = { subtle: "Subtle", emphasized: "Emphasized" }

// Mirrors ui5-link (Horizon). Always an <a>; without href it stays focusable (tabindex 0) and,
// like UI5, Enter and Space activate it. With href, Space also follows the link (UI5 behaviour).
function Link({
  design = "default",
  wrappingType = "normal",
  interactiveAreaSize = "normal",
  disabled,
  icon,
  endIcon,
  designText,
  className,
  children,
  href,
  tabIndex,
  onKeyDown,
  onKeyUp,
  onClick,
  ...props
}: LinkProps) {
  const hidden = designText === undefined ? defaultDesignText[design] : designText
  return (
    <a
      data-slot="link"
      data-design={design}
      data-wrapping={wrappingType}
      data-interactive-area={interactiveAreaSize}
      href={disabled ? undefined : href}
      tabIndex={disabled ? -1 : (tabIndex ?? 0)}
      aria-disabled={disabled || undefined}
      className={cn("fiori-link", className)}
      onClick={(e) => {
        if (disabled) return e.preventDefault()
        onClick?.(e)
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented || disabled) return
        if (e.key === "Enter" && !href) {
          e.preventDefault()
          e.currentTarget.click()
        } else if (e.key === " ") {
          e.preventDefault() // no page scroll; Space activates on keyup
        }
      }}
      onKeyUp={(e) => {
        onKeyUp?.(e)
        if (!e.defaultPrevented && !disabled && e.key === " ") e.currentTarget.click()
      }}
      {...props}
    >
      {icon && <Icon icon={icon} className="fiori-link__icon" />}
      <span className="fiori-link__text">{children}</span>
      {hidden && <span className="sr-only">{hidden}</span>}
      {endIcon && <Icon icon={endIcon} className="fiori-link__end-icon" />}
    </a>
  )
}

export { Link, type LinkProps, type LinkDesign }
