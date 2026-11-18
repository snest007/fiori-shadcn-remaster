// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

import { cn } from "@/lib/utils"

// Mirrors ui5-page (UI5 2.28): a full-height container with a header (usually a <Bar design="header">),
// scrolling content and a footer (a <Bar design="floating-footer"> floating above the content, or with
// fixedFooter a <Bar design="footer"> docked at the bottom). Horizontal padding follows the page's own
// width (container queries: S < 600px, M/L, XL >= 1440px). Styles: registry/styles/components/page.css.

type PageBackgroundDesign = "solid" | "transparent" | "list"

/**
 * @accessibility contentProps forwards native section accessibility, including aria-label and tabIndex for scrolling content without interactive children. Header and footer actions must have names. Page adds no composite keyboard model; Tab follows their normal order.
 */
type PageProps = React.ComponentProps<"div"> & {
  /** Page background: "solid" (--sapBackgroundColor, default), "transparent" or "list" (group content background). */
  backgroundDesign?: PageBackgroundDesign
  /** Disables scrolling of the content. */
  noScrolling?: boolean
  /** Docks the footer below the content instead of floating it over the content. */
  fixedFooter?: boolean
  /** Hides the footer (a floating footer animates out). */
  hideFooter?: boolean
  header?: React.ReactNode
  footer?: React.ReactNode
  /** Props for the scrolling content <section>. */
  contentProps?: React.ComponentProps<"section">
}

function Page({
  backgroundDesign = "solid",
  noScrolling,
  fixedFooter,
  hideFooter,
  header,
  footer,
  contentProps,
  className,
  children,
  ...props
}: PageProps) {
  const hasFooter = footer != null && footer !== false
  return (
    <div
      data-slot="page"
      data-background-design={backgroundDesign}
      data-no-scrolling={noScrolling ? "" : undefined}
      data-fixed-footer={fixedFooter ? "" : undefined}
      data-hide-footer={hideFooter ? "" : undefined}
      className={cn("fiori-page", className)}
      {...props}
    >
      <div className="fiori-page__root">
        <header className="fiori-page__header">{header}</header>
        <section
          {...contentProps}
          data-has-footer={hasFooter ? "" : undefined}
          className={cn("fiori-page__content", contentProps?.className)}
        >
          {children}
        </section>
        {hasFooter && <footer className="fiori-page__footer">{footer}</footer>}
      </div>
    </div>
  )
}

export { Page, type PageProps, type PageBackgroundDesign }
