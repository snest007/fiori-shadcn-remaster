import * as React from "react"
import { useFioriLocale, useFioriTexts } from "@/lib/fiori-locale"

import { alert, error, information, sysEnter2, sysHelp2 } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"

type TagDesign = "neutral" | "positive" | "negative" | "critical" | "information" | "set1" | "set2"
type ColorScheme = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

const stateIcons = { neutral: sysHelp2, positive: sysEnter2, negative: error, critical: alert, information }
const defaultStateText: Partial<Record<TagDesign, string>> = {
  positive: "Success",
  negative: "Error",
  critical: "Warning",
  information: "Information",
}

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
  className,
  children,
  ...props
}: TagProps) {
  const defaultStateTextLocalized = useFioriTexts(defaultStateText, defaultStateTextKeys)

  const { t } = useFioriLocale()
  const roleDescription = roleDescriptionProp ?? t("TAG_ROLE_DESCRIPTION", "Tag button") // UI5 TAG_ROLE_DESCRIPTION

  const stateIcon = !hideStateIcon && !icon && design in stateIcons ? stateIcons[design as keyof typeof stateIcons] : undefined
  const hasText = children != null && children !== false && children !== ""
  const hasIcon = !!icon || !!stateIcon
  const state = defaultStateTextLocalized[design]
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
      {!interactive && <span className="sr-only">{tagText ?? (state ? `Tag ${state}` : "Tag")}</span>}
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

export { Tag, type TagProps, type TagDesign }

const defaultStateTextKeys = {
  "negative": "TAG_ERROR",
  "critical": "TAG_WARNING",
  "positive": "TAG_SUCCESS",
  "information": "TAG_INFORMATION"
} as const
