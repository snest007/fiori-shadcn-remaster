import * as React from "react"
import { useFioriLocale } from "@/lib/fiori-locale"

import { cn } from "@/lib/utils"

// Mirrors ui5-dynamic-side-content (UI5 2.28): main content plus side content whose layout follows the
// control's own width — S <= 720px (side content hidden, or below the main content with "alwaysShow"),
// M <= 1024px (side 340px; falls below the main content under 960px by default), L <= 1440px (2/3 + 1/3),
// XL (3/4 + 1/4). A ResizeObserver tracks the breakpoint (onLayoutChange) and whether the side content
// fell below the main content; the widths themselves come from container queries, as in UI5.
// toggleContents() (via ref or the `toggled` prop) swaps main and side content where only one is shown.
// Styles: registry/styles/components/dynamic-side-content.css.

type DscBreakpoint = "S" | "M" | "L" | "XL"
type SideContentPosition = "end" | "start"
type SideContentVisibility = "alwaysShow" | "showAboveL" | "showAboveM" | "showAboveS" | "neverShow"
type SideContentFallDown = "belowXL" | "belowL" | "belowM" | "onMinimumWidth"

type DynamicSideContentHandle = {
  /** Shows the side content instead of the main content (or back) where only one of them fits. */
  toggleContents: () => void
  /** The current breakpoint. */
  breakpoint: DscBreakpoint
}

type LayoutChange = {
  currentBreakpoint: DscBreakpoint
  previousBreakpoint: DscBreakpoint | undefined
  mainContentVisible: boolean
  sideContentVisible: boolean
}

type AreaAttributes = { role?: React.AriaRole; ariaLabel?: string }

type DynamicSideContentProps = Omit<React.ComponentProps<"div">, "ref"> & {
  ref?: React.Ref<DynamicSideContentHandle>
  sideContent?: React.ReactNode
  hideMainContent?: boolean
  hideSideContent?: boolean
  sideContentPosition?: SideContentPosition
  sideContentVisibility?: SideContentVisibility
  sideContentFallDown?: SideContentFallDown
  /** Main and side content take 50% each (above S). */
  equalSplit?: boolean
  /** Controlled toggle state (see toggleContents). */
  toggled?: boolean
  onToggledChange?: (toggled: boolean) => void
  onLayoutChange?: (detail: LayoutChange) => void
  /** Roles / labels of the two areas (default role main / complementary, "Main Content" / "Side Content"). */
  accessibilityAttributes?: { mainContent?: AreaAttributes; sideContent?: AreaAttributes }
}

const S_M = 720
const M_L = 1024
const L_XL = 1440
const MIN_WIDTH = 960

const breakpointOf = (w: number): DscBreakpoint => (w <= S_M ? "S" : w <= M_L ? "M" : w <= L_XL ? "L" : "XL")

const kebab = (s: string) => s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()

function DynamicSideContent({
  ref,
  sideContent,
  hideMainContent = false,
  hideSideContent = false,
  sideContentPosition = "end",
  sideContentVisibility = "showAboveS",
  sideContentFallDown = "onMinimumWidth",
  equalSplit = false,
  toggled: toggledProp,
  onToggledChange,
  onLayoutChange,
  accessibilityAttributes,
  className,
  children,
  ...props
}: DynamicSideContentProps) {
  const { t } = useFioriLocale()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const mainRef = React.useRef<HTMLDivElement>(null)
  const sideRef = React.useRef<HTMLElement>(null)
  const [width, setWidth] = React.useState<number | null>(null)
  const [innerToggled, setInnerToggled] = React.useState(false)
  const toggled = toggledProp ?? innerToggled
  const prevBreakpoint = React.useRef<DscBreakpoint | undefined>(undefined)
  const onLayoutChangeRef = React.useRef(onLayoutChange)
  onLayoutChangeRef.current = onLayoutChange

  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    setWidth(el.clientWidth)
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const breakpoint = width == null ? undefined : breakpointOf(width)

  // Fire layout-change after the container queries have applied the new layout.
  React.useEffect(() => {
    if (!breakpoint || breakpoint === prevBreakpoint.current) return
    const visible = (el: HTMLElement | null) => !!el && getComputedStyle(el).display !== "none"
    onLayoutChangeRef.current?.({
      currentBreakpoint: breakpoint,
      previousBreakpoint: prevBreakpoint.current,
      mainContentVisible: visible(mainRef.current),
      sideContentVisible: visible(sideRef.current),
    })
    prevBreakpoint.current = breakpoint
  }, [breakpoint])

  const toggleEnabled = (() => {
    if (sideContentVisibility === "neverShow" || hideMainContent || hideSideContent || !breakpoint) return false
    if (breakpoint === "S") return sideContentVisibility !== "alwaysShow"
    if (breakpoint === "M") return sideContentVisibility === "showAboveM" || sideContentVisibility === "showAboveL"
    if (breakpoint === "L") return sideContentVisibility === "showAboveL"
    return false
  })()

  const toggleContents = () => {
    if (!toggleEnabled) return
    if (toggledProp === undefined) setInnerToggled(!toggled)
    onToggledChange?.(!toggled)
  }
  React.useImperativeHandle(ref, () => ({ toggleContents, breakpoint: breakpoint ?? "S" }))

  const below = (() => {
    if (sideContentVisibility === "neverShow" || !breakpoint || width == null) return false
    const bp = breakpoint
    return (
      (sideContentFallDown === "onMinimumWidth" && bp === "M" && width <= MIN_WIDTH) ||
      (sideContentFallDown === "belowM" && (bp === "M" || bp === "S")) ||
      (sideContentFallDown === "belowL" && (bp === "M" || bp === "S")) ||
      (sideContentFallDown === "belowXL" && bp !== "XL") ||
      (sideContentVisibility === "alwaysShow" && (bp === "S" || (bp === "M" && width <= MIN_WIDTH)))
    )
  })()

  const main = (
    <div
      ref={mainRef}
      role={accessibilityAttributes?.mainContent?.role ?? "main"}
      aria-label={accessibilityAttributes?.mainContent?.ariaLabel ?? t("DSC_MAIN_ARIA_LABEL", "Main Content")}
      className="fiori-dsc__main"
      style={{ height: below ? "auto" : "100%" }}
    >
      {children}
    </div>
  )
  const side = (
    <aside
      ref={sideRef}
      role={accessibilityAttributes?.sideContent?.role ?? "complementary"}
      aria-label={accessibilityAttributes?.sideContent?.ariaLabel ?? t("DSC_SIDE_ARIA_LABEL", "Side Content")}
      className="fiori-dsc__side"
      style={{ height: below ? "auto" : "100%" }}
    >
      {sideContent}
    </aside>
  )
  return (
    <div
      ref={rootRef}
      data-slot="dynamic-side-content"
      data-breakpoint={breakpoint}
      data-hide-main-content={hideMainContent ? "" : undefined}
      data-hide-side-content={hideSideContent ? "" : undefined}
      data-side-content-visibility={kebab(sideContentVisibility)}
      data-side-content-fall-down={kebab(sideContentFallDown)}
      data-equal-split={equalSplit ? "" : undefined}
      className={cn("fiori-dsc", className)}
      {...props}
    >
      <div className="fiori-dsc__root" data-toggled={toggled && toggleEnabled ? "" : undefined}>
        {sideContentPosition === "start" ? (
          <>
            {side}
            {main}
          </>
        ) : (
          <>
            {main}
            {side}
          </>
        )}
      </div>
    </div>
  )
}

export {
  DynamicSideContent,
  type DynamicSideContentProps,
  type DynamicSideContentHandle,
  type DscBreakpoint,
  type SideContentPosition,
  type SideContentVisibility,
  type SideContentFallDown,
}
