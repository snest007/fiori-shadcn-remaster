// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by shadcn-fiori: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"

// UI5 2.28 Panel fastNavigation metadata; UI5Element.onEnterDOM marks this root unless overridden.

import { slimArrowRight } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"

type PanelProps = Omit<React.ComponentProps<"div">, "onToggle"> & {
  /** Header title text (the whole header is the toggle). */
  headerText?: React.ReactNode
  /** Custom header content. Then only the arrow button toggles, as in UI5. */
  header?: React.ReactNode
  /** No toggle; the content is always shown. */
  fixed?: boolean
  /** Controlled collapsed state. */
  collapsed?: boolean
  defaultCollapsed?: boolean
  onToggle?: (collapsed: boolean) => void
  /** Turns off the slide animation. (It is also off under prefers-reduced-motion.) */
  noAnimation?: boolean
  /** aria-level of the header heading. Default 2. */
  headerLevel?: 1 | 2 | 3 | 4 | 5 | 6
  stickyHeader?: boolean
  /** Root role (UI5 default "form"). */
  accessibleRole?: "form" | "region" | "complementary"
  accessibleName?: string
  /** Tooltip / accessible name of the arrow (default "Expand/Collapse"). */
  toggleButtonText?: string
  contentClassName?: string
}

// Mirrors ui5-panel (Horizon) on top of Radix Collapsible (aria-expanded / aria-controls, keyboard
// via a native button: Enter on keydown, Space on keyup, as in UI5).
function Panel({
  headerText,
  header,
  fixed,
  collapsed,
  defaultCollapsed = false,
  onToggle,
  noAnimation,
  headerLevel = 2,
  stickyHeader,
  accessibleRole = "form",
  accessibleName,
  toggleButtonText = "Expand/Collapse",
  className,
  contentClassName,
  children,
  ...props
}: PanelProps) {
  const id = React.useId()
  const titleId = `${id}-title`
  const hasCustomHeader = header != null
  const arrow = <Icon icon={slimArrowRight} className="fiori-panel__arrow" />

  return (
    <CollapsiblePrimitive.Root
      data-slot="panel" data-sap-ui-fastnavgroup="true"
      data-fixed={fixed ? "" : undefined}
      data-custom-header={hasCustomHeader ? "" : undefined}
      data-animated={noAnimation ? undefined : ""}
      open={fixed ? true : collapsed === undefined ? undefined : !collapsed}
      defaultOpen={!defaultCollapsed}
      onOpenChange={(open) => onToggle?.(!open)}
      disabled={fixed}
      role={accessibleRole}
      aria-label={accessibleName}
      // UI5 only names fixed panels by their title; we name every panel by it so the landmark is labelled.
      aria-labelledby={!accessibleName && headerText != null ? titleId : undefined}
      className={cn("fiori-panel", className)}
      {...props}
    >
      {(headerText != null || hasCustomHeader) && (
        <div
          className="fiori-panel__heading"
          data-sticky={stickyHeader ? "" : undefined}
          role={hasCustomHeader ? undefined : "heading"}
          aria-level={hasCustomHeader ? undefined : headerLevel}
        >
          {hasCustomHeader ? (
            <div className="fiori-panel__header">
              {!fixed && (
                <div className="fiori-panel__button-root">
                  <CollapsiblePrimitive.Trigger asChild>
                    <Button variant="transparent" size="icon" title={toggleButtonText} aria-label={accessibleName} className="size-full min-w-0">
                      {arrow}
                    </Button>
                  </CollapsiblePrimitive.Trigger>
                </div>
              )}
              {header}
            </div>
          ) : fixed ? (
            <div className="fiori-panel__header">
              <div id={titleId} className="fiori-panel__title">
                {headerText}
              </div>
            </div>
          ) : (
            <CollapsiblePrimitive.Trigger className="fiori-panel__header" aria-labelledby={titleId}>
              <span className="fiori-panel__button-root" title={toggleButtonText}>
                {arrow}
              </span>
              <span id={titleId} className="fiori-panel__title">
                {headerText}
              </span>
            </CollapsiblePrimitive.Trigger>
          )}
        </div>
      )}
      <CollapsiblePrimitive.Content className="fiori-panel__content">
        <div className={cn("fiori-panel__content-inner", contentClassName)} tabIndex={-1}>
          {children}
        </div>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  )
}

export { Panel, type PanelProps }
