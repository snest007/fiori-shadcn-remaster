// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by shadcn-fiori: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

import { cn } from "@/lib/utils"
import { SideNavigationLayoutContext } from "@/components/ui/side-navigation"

// Mirrors ui5-navigation-layout (UI5 2.28): a header on top, a side navigation on the start side and the
// scrolling content next to it. mode="auto" collapses the side navigation on small screens (< 600px window
// width, where UI5 reports "small screen"); there the side navigation, when expanded, covers the content
// at full width and slides out when collapsed, and choosing an item collapses it again.
// The layout fills its positioned parent (UI5: position:absolute; inset:0), like an application shell.

type NavigationLayoutMode = "auto" | "collapsed" | "expanded"

const SMALL_SCREEN = 600

function useSmallScreen() {
  const query = `(max-width: ${SMALL_SCREEN - 0.02}px)`
  const subscribe = React.useCallback(
    (cb: () => void) => {
      const mq = window.matchMedia(query)
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    [query]
  )
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  )
}

type NavigationLayoutProps = React.ComponentProps<"div"> & {
  /** "auto" (default) collapses the side navigation on small screens; "collapsed" / "expanded" force a state. */
  mode?: NavigationLayoutMode
  /**
   * Fired when the layout changes the mode itself: on small screens, choosing a navigation item collapses
   * the side navigation (UI5 sets mode to "collapsed").
   */
  onModeChange?: (mode: NavigationLayoutMode) => void
  /** The header, usually a ShellBar with a menu button that toggles `mode`. */
  header?: React.ReactNode
  /** The side navigation (a <SideNavigation>; it takes its collapsed state from the layout). */
  sideContent?: React.ReactNode
}

function NavigationLayout({
  mode = "auto",
  onModeChange,
  header,
  sideContent,
  className,
  children,
  ...props
}: NavigationLayoutProps) {
  const small = useSmallScreen()
  const sideCollapsed = mode === "auto" ? small : mode === "collapsed"
  const bridge = React.useMemo(
    () => ({
      collapsed: sideCollapsed,
      onItemClick: () => {
        if (small && !sideCollapsed) onModeChange?.("collapsed")
      },
    }),
    [sideCollapsed, small, onModeChange]
  )
  return (
    <div
      data-slot="navigation-layout"
      data-side-collapsed={sideCollapsed ? "" : undefined}
      data-has-side-navigation={sideContent ? "" : undefined}
      className={cn("fiori-nl", className)}
      {...props}
    >
      <div className="fiori-nl__root">
        <header className="fiori-nl__header">{header}</header>
        <section className="fiori-nl__section">
          <SideNavigationLayoutContext.Provider value={bridge}>
            <aside className="fiori-nl__aside" inert={small && sideCollapsed ? true : undefined}>
              {sideContent}
            </aside>
          </SideNavigationLayoutContext.Provider>
          <div className="fiori-nl__content">{children}</div>
        </section>
      </div>
    </div>
  )
}

export { NavigationLayout, type NavigationLayoutProps, type NavigationLayoutMode }
