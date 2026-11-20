// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { useFioriTexts } from "@/lib/fiori-locale"

import { alert, error, information, sysEnter2, sysHelp2 } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"

type TagDesign = "neutral" | "positive" | "negative" | "critical" | "information" | "set1" | "set2"
type ColorScheme = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

const stateIcons = { neutral: sysHelp2, positive: sysEnter2, negative: error, critical: alert, information }
type TagTexts = { tag: string; roleDescription: string; positive: string; negative: string; critical: string; information: string }
const defaultTagTexts: TagTexts = {
  tag: "Tag", // UI5 TAG_DESCRIPTION_TAG
  roleDescription: "Tag button", // UI5 TAG_ROLE_DESCRIPTION
  positive: "Success", // UI5 TAG_SUCCESS
  negative: "Error", // UI5 TAG_ERROR
  critical: "Warning", // UI5 TAG_WARNING
  information: "Information", // UI5 TAG_INFORMATION
}

/** @accessibility tagText describes a non-interactive tag. Interactive tags are buttons named by children, with roleDescription as aria-roledescription; Enter/Space activate. Icon-only interactive tags need aria-label. */
type TagProps = Omit<React.ComponentProps<"div">, "children"> & {
  design?: TagDesign
  /** For set1 / set2: which of SAP's 10 indication colours. Default 1. */
  colorScheme?: ColorScheme
  /** Hide the state icon the semantic designs show by default. */
  hideStateIcon?: boolean
  /** Custom icon (an <Icon>), replaces the state icon. */
  icon?: React.ReactNode
  size?: "S" | "L"
  wrappingType?: "normal" | "none"
  /** Renders a <button>; fires onClick. */
  interactive?: boolean
  onClick?: React.MouseEventHandler<HTMLElement>
  children?: React.ReactNode
  /** Hidden description for non-interactive tags (default "Tag" + state, e.g. "Tag Error"). */
  tagText?: string
  /** aria-roledescription of interactive tags (default "Tag button"). */
  roleDescription?: string
  /** Native hidden description, interactive role description and semantic state texts. */
  texts?: Partial<TagTexts>
}

// Mirrors ui5-tag (Horizon).
function Tag({
  design = "neutral",
  colorScheme = 1,
  hideStateIcon,
  icon,
  size = "S",
  wrappingType = "normal",
  interactive,
  tagText,
  roleDescription: roleDescriptionProp,
  texts,
  className,
  children,
  ...props
}: TagProps) {
  const resolvedTexts = useFioriTexts(defaultTagTexts, defaultTagTextsKeys, texts)
  const roleDescription = roleDescriptionProp ?? resolvedTexts.roleDescription

  const stateIcon = !hideStateIcon && !icon && design in stateIcons ? stateIcons[design as keyof typeof stateIcons] : undefined
  const hasText = children != null && children !== false && children !== ""
  const hasIcon = !!icon || !!stateIcon
  const state = ["positive", "negative", "critical", "information"].includes(design) ? resolvedTexts[design as "positive" | "negative" | "critical" | "information"] : undefined
  // Tag.js/tagDescription composes TAG_DESCRIPTION_TAG with the semantic state.
  // The existing tagText prop overrides the complete hidden description.
  const description = tagText ?? [resolvedTexts.tag, state].filter(Boolean).join(" ")
  const common = {
    "data-slot": "tag",
    "data-design": design,
    "data-color-scheme": design === "set1" || design === "set2" ? colorScheme : undefined,
    "data-size": size,
    "data-wrapping": wrappingType,
    "data-has-icon": hasIcon ? "" : undefined,
    "data-icon-only": !!icon && !hasText ? "" : undefined,
    className: cn(
      "fiori-tag",
      // Icon sizing as child utilities so it overrides <Icon>'s own size-4 (also for custom icons).
      "[&>svg]:pointer-events-none [&>svg]:self-start [&>svg]:text-inherit",
      size === "L"
        ? "[&>svg]:h-(--fiori-x-tag-icon-height-size-l) [&>svg]:min-h-(--fiori-x-tag-icon-min-height-size-l) [&>svg]:w-(--fiori-x-tag-icon-width) [&>svg]:min-w-(--fiori-x-tag-icon-min-width-size-l)"
        : "[&>svg]:h-4 [&>svg]:w-(--fiori-x-tag-icon-width) [&>svg]:min-w-(--fiori-x-tag-icon-width)",
      className
    ),
  }
  const content = (
    <>
      {icon}
      {stateIcon && <Icon icon={stateIcon} />}
      {!interactive && <span className="sr-only">{description}</span>}
      {hasText && <span className="fiori-tag__text">{children}</span>}
    </>
  )
  if (interactive) {
    return (
      <button
        type="button"
        aria-roledescription={roleDescription}
        aria-description={state}
        {...common}
        {...(props as React.ComponentProps<"button">)}
      >
        {content}
      </button>
    )
  }
  return (
    <div {...common} {...props}>
      {content}
    </div>
  )
}

export { Tag, type TagProps, type TagDesign, type TagTexts }

const defaultTagTextsKeys = {
  "tag": "TAG_DESCRIPTION_TAG",
  "roleDescription": "TAG_ROLE_DESCRIPTION",
  "negative": "TAG_ERROR",
  "critical": "TAG_WARNING",
  "positive": "TAG_SUCCESS",
  "information": "TAG_INFORMATION"
} as const
