import * as React from "react"

import { cn } from "@/lib/utils"

// Mirrors ui5-hero-banner (Horizon, @ui5/webcomponents-fiori 2.28): a colored page header with an overline,
// a heading, actions, and start/end content in one or two columns (one column under a 600px container).
// Static; has no keyboard model of its own.

type HeroBannerProps = React.ComponentProps<"div"> & {
  headerText?: string
  /** Small text above the heading. */
  overlineText?: string
  /** Column widths when endContent is present. */
  columnsRatio?: "Equal" | "FirstWider"
  /** Second column (UI5 `endContent` slot). `children` is the first column. */
  endContent?: React.ReactNode
  /** Buttons (UI5 `actions` slot). Transparent buttons pick up the banner's text color. */
  actions?: React.ReactNode
  actionsPlacement?: "TopEnd" | "BottomStart"
  /** "Bottom" moves the heading down; needs endContent and no children. */
  headerBlockPlacement?: "Top" | "Bottom"
  /** ARIA role of the banner. Default "banner", as UI5; use "region" (with a label on it) inside <main>. */
  landmarkRole?: React.AriaRole
  landmarkLabel?: string
}

function HeroBanner({
  headerText,
  overlineText,
  columnsRatio = "FirstWider",
  endContent,
  actions,
  actionsPlacement = "TopEnd",
  headerBlockPlacement = "Top",
  landmarkRole = "banner",
  landmarkLabel,
  className,
  children,
  ...props
}: HeroBannerProps) {
  const hasStart = React.Children.toArray(children).length > 0
  const hasEnd = React.Children.toArray(endContent).length > 0
  const hasActions = React.Children.toArray(actions).length > 0
  const bottomStart = actionsPlacement === "BottomStart"
  const headerAtBottom = headerBlockPlacement === "Bottom" && !hasStart && hasEnd
  const actionsAsGridItem = hasActions && !bottomStart && headerAtBottom
  return (
    <div
      data-slot="hero-banner"
      data-actions-placement={actionsPlacement}
      data-header-block-placement={headerBlockPlacement}
      className={cn("fiori-hero-banner", className)}
      {...props}
    >
      <div className="fiori-hero-banner__root" role={landmarkRole} aria-label={landmarkLabel}>
        <div
          className={cn(
            "fiori-hero-banner__content",
            columnsRatio === "Equal" && hasEnd && "fiori-hero-banner__columns-equal",
            columnsRatio === "FirstWider" && hasEnd && "fiori-hero-banner__columns-first-wider"
          )}
        >
          <div className="fiori-hero-banner__header">
            <div className="fiori-hero-banner__header-text">
              {overlineText && <div className="fiori-hero-banner__overline">{overlineText}</div>}
              {headerText && <h2 className="fiori-hero-banner__heading">{headerText}</h2>}
              {bottomStart && hasActions && <div className="fiori-hero-banner__actions fiori-hero-banner__actions-bottom-start">{actions}</div>}
            </div>
            {!bottomStart && !actionsAsGridItem && hasActions && <div className="fiori-hero-banner__actions">{actions}</div>}
          </div>
          {hasStart && <div className="fiori-hero-banner__block fiori-hero-banner__block-start">{children}</div>}
          {hasEnd && <div className="fiori-hero-banner__block fiori-hero-banner__block-end">{endContent}</div>}
          {actionsAsGridItem && <div className="fiori-hero-banner__actions fiori-hero-banner__actions-grid-item">{actions}</div>}
        </div>
      </div>
    </div>
  )
}

export { HeroBanner, type HeroBannerProps }
