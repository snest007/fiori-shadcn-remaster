// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

import { drillDown, process as processIcon, slimArrowDown, slimArrowLeft, slimArrowRight, slimArrowUp, type FioriIconData } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { BusyIndicator } from "@/components/ui/busy-indicator"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Link } from "@/components/ui/link"
import { ToggleButton } from "@/components/ui/toggle-button"

// Mirrors ui5-timeline / ui5-timeline-item / ui5-timeline-group-item (Horizon, @ui5/webcomponents-fiori).
// Keyboard (as ui5-timeline): the items form one Tab stop. Vertical: ↑/↓, horizontal: ←/→ (mirrored in
// RTL) move between items and group toggles; Home/PageUp go to the first, End/PageDown to the last
// (UI5's ItemNavigation without a skip size); no wrap-around.
// From the last item ↓/→ reaches the "Load More" button and ↑/← returns. F2 moves into the focused
// item's first focusable element and back. In horizontal layout the vertical wheel scrolls sideways.
// TimelineItem and TimelineGroupItem must be direct children (fragments are fine), because the lines
// depend on each item's neighbours.

type TimelineLayout = "Vertical" | "Horizontal"
type TimelineItemState = "None" | "Information" | "Positive" | "Negative" | "Critical"
type TimelineGrowing = "None" | "Button" | "Scroll"
type LineWidth = "short" | "large" | undefined

type SharedContext = { layout: TimelineLayout; itemRole: "listitem" | "treeitem"; sync: () => void }
const TimelineContext = React.createContext<SharedContext>({ layout: "Vertical", itemRole: "listitem", sync: () => {} })

// What UI5 computes in Timeline/TimelineGroupItem.onBeforeRendering and CSS gets from :first-child/:last-child.
type Position = {
  firstChild: boolean
  lastChild: boolean
  firstItem: boolean
  lastItem: boolean
  nextGroup: boolean
  lineWidth: LineWidth
  positionInGroup?: number
  hidden?: boolean
}
const PositionContext = React.createContext<Position | null>(null)

const flatten = (children: React.ReactNode): React.ReactElement<any>[] =>
  React.Children.toArray(children).flatMap((c) => {
    if (!React.isValidElement<{ children?: React.ReactNode }>(c)) return []
    return c.type === React.Fragment ? flatten(c.props.children) : [c]
  })

const lineWidth = (item: React.ReactElement<any>, next?: React.ReactElement<any>): LineWidth => {
  if (next?.props.icon) return "short"
  return item.props.icon && next ? "large" : undefined
}

// UI5 getEffectiveDir/ItemNavigation follows the nearest DOM direction. CSS optimizers may
// lower :dir(rtl) to language selectors; data-dir preserves actual DOM direction.
function useHostDirection(owner: React.RefObject<HTMLElement | null>, explicit?: "ltr" | "rtl") {
  const [direction, setDirection] = React.useState<"ltr" | "rtl">("ltr")
  React.useLayoutEffect(() => {
    const node = owner.current
    if (!node) return
    const update = () => setDirection(getComputedStyle(node).direction === "rtl" ? "rtl" : "ltr")
    update()
    const observer = new MutationObserver(update)
    for (let ancestor: HTMLElement | null = node; ancestor; ancestor = ancestor.parentElement) {
      observer.observe(ancestor, { attributes: true, attributeFilter: ["dir", "style", "class"] })
    }
    return () => observer.disconnect()
  }, [owner])
  return explicit ?? direction
}

type TimelineItemProps = Omit<React.ComponentProps<"div">, "title"> & {
  icon?: FioriIconData
  /** Accessible text for the icon, also its tooltip. */
  iconTooltip?: string
  /** Person or object name, shown before the title. */
  name?: string
  /** Renders `name` as a link; fires onNameClick. */
  nameClickable?: boolean
  onNameClick?: React.MouseEventHandler<HTMLAnchorElement>
  titleText?: string
  /** Secondary text, usually the time stamp. */
  subtitleText?: string
  /** Colors the icon. */
  state?: TimelineItemState
  /** Text announced for the state (default "<State> State"). */
  stateText?: string
}

function TimelineItem({
  icon,
  iconTooltip,
  name,
  nameClickable,
  onNameClick,
  titleText,
  subtitleText,
  state = "None",
  stateText,
  className,
  children,
  ref,
  ...props
}: TimelineItemProps) {
  const owner = React.useRef<HTMLDivElement>(null)
  React.useImperativeHandle(ref, () => owner.current!, [])
  const direction = useHostDirection(owner)
  const { layout, itemRole } = React.useContext(TimelineContext)
  const pos = React.useContext(PositionContext)
  const stateDescription = state === "None" ? undefined : (stateText ?? `${state} State`)
  const label = [name, titleText, subtitleText, stateDescription, iconTooltip].filter(Boolean).join(", ")
  // UI5 labels both roles. A treeitem takes its name from its content, and a label that leaves out the
  // visible text (the item's slot) fails WCAG 2.5.3, so in a tree the extras go to the description.
  const isTree = itemRole === "treeitem"
  const description = isTree ? [stateDescription, iconTooltip].filter(Boolean).join(", ") || undefined : stateDescription
  return (
    <div
      ref={owner}
      data-slot="timeline-item"
      data-dir={direction}
      data-layout={layout}
      data-icon={icon ? "" : undefined}
      data-state={state}
      data-first-child={pos?.firstChild ? "" : undefined}
      data-last-child={pos?.lastChild ? "" : undefined}
      data-first-item={pos?.firstItem ? "" : undefined}
      data-last-item={pos?.lastItem ? "" : undefined}
      data-next-group={pos?.nextGroup ? "" : undefined}
      data-position-in-group={pos?.positionInGroup}
      hidden={pos?.hidden}
      className={cn("fiori-tli", className)}
      {...props}
    >
      <div className="fiori-tli__root">
        <div
          className={cn(
            "fiori-tli__indicator",
            pos?.lineWidth === "short" && "fiori-tli__indicator-short-line",
            pos?.lineWidth === "large" && "fiori-tli__indicator-large-line"
          )}
        >
          <div className="fiori-tli__icon-outer">
            {icon ? (
              <Icon icon={icon} className="fiori-tli__icon size-[1.375rem]" label={iconTooltip} />
            ) : (
              <div className="fiori-tli__dummy-icon-container" />
            )}
          </div>
        </div>
        <div data-timeline-nav="" className="fiori-tli__bubble" role={itemRole} tabIndex={-1} aria-label={isTree ? undefined : label} aria-description={description}>
          <div className="fiori-tli__title">
            {name &&
              (nameClickable ? (
                <Link className="fiori-tli__title-name-clickable" wrappingType={layout === "Horizontal" ? "none" : "normal"} onClick={onNameClick}>
                  {name}
                  {" "}
                </Link>
              ) : (
                <span className="fiori-tli__title-name">
                  {name}
                  {" "}
                </span>
              ))}
            <span>{titleText}</span>
          </div>
          <div className="fiori-tli__subtitle">{subtitleText}</div>
          <div className="fiori-tli__desc">{children}</div>
          <span className={cn("fiori-tli__bubble-arrow", layout === "Vertical" ? "fiori-tli__bubble-arrow--left" : "fiori-tli__bubble-arrow--top")} />
        </div>
      </div>
    </div>
  )
}

type TimelineGroupItemProps = Omit<React.ComponentProps<"div">, "onToggle"> & {
  groupName?: string
  /** Controlled collapsed state. */
  collapsed?: boolean
  defaultCollapsed?: boolean
  /** The group toggle was activated. */
  onToggle?: (collapsed: boolean) => void
  /** Announced with the group name (defaults "collapsed" / "expanded"). */
  collapsedText?: string
  expandedText?: string
}

function TimelineGroupItem({
  groupName,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onToggle,
  collapsedText = "collapsed",
  expandedText = "expanded",
  className,
  children,
  ...props
}: TimelineGroupItemProps) {
  const { layout, sync } = React.useContext(TimelineContext)
  const pos = React.useContext(PositionContext)
  const [inner, setInner] = React.useState(defaultCollapsed)
  const collapsed = collapsedProp ?? inner
  const items = flatten(children)
  // Items that just appeared or disappeared change the Tab stop's candidates.
  React.useLayoutEffect(sync, [collapsed, sync])
  const groupIcon = layout === "Vertical" ? (collapsed ? slimArrowLeft : slimArrowDown) : collapsed ? slimArrowUp : slimArrowRight
  return (
    <div
      data-slot="timeline-group-item"
      data-layout={layout}
      data-collapsed={collapsed ? "" : undefined}
      data-first-child={pos?.firstChild ? "" : undefined}
      data-last-child={pos?.lastChild ? "" : undefined}
      data-first-item={pos?.firstItem ? "" : undefined}
      data-last-item={pos?.lastItem ? "" : undefined}
      data-next-group={pos?.nextGroup ? "" : undefined}
      className={cn("fiori-tlgi", className)}
      {...props}
    >
      <div className="fiori-tlgi__root" role="treeitem">
        <div className="fiori-tlgi__btn-root">
          <div className="fiori-tlgi__icon-placeholder">
            <div className="fiori-tlgi__icon-dot" />
          </div>
          <div className="fiori-tlgi__line-placeholder">
            <div className="fiori-tlgi__line" />
          </div>
          <ToggleButton
            data-timeline-nav=""
            className="fiori-tlgi__btn"
            tabIndex={-1}
            pressed={collapsed}
            aria-label={`${groupName || "Group"}, ${collapsed ? collapsedText : expandedText}`}
            onPressedChange={(next) => {
              setInner(next)
              onToggle?.(next)
            }}
          >
            <Icon icon={groupIcon} />
            {groupName}
          </ToggleButton>
        </div>
        <div className="fiori-tlgi__items" role="group" aria-label={`${groupName || "Group"} items`}>
          {items.map((item, i) => (
            <div key={item.key ?? i} className="fiori-tlgi__item">
              <PositionContext.Provider
                value={{
                  firstChild: i === 0,
                  lastChild: i === items.length - 1,
                  firstItem: i === 0 && !!pos?.firstItem,
                  lastItem: i === items.length - 1 && !collapsed && !!pos?.lastItem,
                  nextGroup: i === items.length - 1 && !!pos?.nextGroup,
                  lineWidth: lineWidth(item, items[i + 1]),
                  positionInGroup: i + 1,
                  hidden: collapsed,
                }}
              >
                {item}
              </PositionContext.Provider>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * @accessibility accessibleName names the region and list/tree, preceded by timelineText. TimelineItem owns listitem/treeitem focus; iconTooltip names its icon, stateText announces the state, and group collapsedText/expandedText describe expansion.
 * @accessibility Items form one Tab stop. Vertical Up/Down or horizontal Left/Right (mirrored in RTL) move events and groups; Home/PageUp and End/PageDown reach boundaries. F2 enters item controls and returns. The last forward key reaches Load More.
 */
type TimelineProps = React.ComponentProps<"div"> & {
  layout?: TimelineLayout
  /** Accessible name, announced after "Timeline". */
  accessibleName?: string
  /** Shows the busy indicator: over the list, or beside "Load More" when growing="Button". */
  loading?: boolean
  /** Milliseconds before the busy indicator appears (default 1000). */
  loadingDelay?: number
  /** "Button" renders a "Load More" button; "Scroll" fires onLoadMore when the end scrolls into view. */
  growing?: TimelineGrowing
  onLoadMore?: () => void
  /** Area above the list (UI5 `header` slot). */
  header?: React.ReactNode
  /** Area under the header (UI5 `infoBar` slot). */
  infoBar?: React.ReactNode
  /** Keeps header and info bar visible while the list scrolls. */
  stickyHeader?: boolean
  /** Region name (default "Timeline"). */
  timelineText?: string
  /** "Load More" button label. */
  loadMoreText?: string
}

const FOCUSABLE = 'a[href],a[tabindex="0"],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]'
const SCROLL_DEBOUNCE = 250

function Timeline({
  layout = "Vertical",
  accessibleName,
  loading = false,
  loadingDelay = 1000,
  growing = "None",
  onLoadMore,
  header,
  infoBar,
  stickyHeader,
  timelineText = "Timeline",
  loadMoreText = "Load More",
  className,
  children,
  ...props
}: TimelineProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const direction = useHostDirection(rootRef)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const growingBtn = React.useRef<HTMLButtonElement>(null)
  const endMarker = React.useRef<HTMLDivElement>(null)
  const current = React.useRef<HTMLElement | null>(null)
  const items = flatten(children)
  const isGroup = (el?: React.ReactElement<any>) => el?.type === TimelineGroupItem
  const hasGroups = items.some((i) => isGroup(i))
  const label = accessibleName ? `${timelineText} ${accessibleName}` : timelineText

  const navItems = React.useCallback(
    () => [...(rootRef.current?.querySelectorAll<HTMLElement>("[data-timeline-nav]") ?? [])].filter((el) => !el.closest("[hidden]")),
    []
  )
  // Roving tabindex: one Tab stop across all items and group toggles.
  const sync = React.useCallback(() => {
    const all = navItems()
    if (!current.current || !all.includes(current.current)) current.current = all[0] ?? null
    rootRef.current?.querySelectorAll<HTMLElement>("[data-timeline-nav]").forEach((el) => {
      el.tabIndex = el === current.current ? 0 : -1
    })
  }, [navItems])
  React.useLayoutEffect(sync)

  const moveTo = (el?: HTMLElement) => {
    if (!el) return
    current.current = el
    sync()
    el.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const onCurrent = target === current.current
    const onGrowing = target === growingBtn.current
    if (e.key === "F2") {
      const nav = target.closest<HTMLElement>("[data-timeline-nav]")
      if (!nav) return
      e.preventDefault()
      if (target === nav) nav.querySelector<HTMLElement>(FOCUSABLE)?.focus()
      else nav.focus()
      return
    }
    if (!onCurrent && !onGrowing) return
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
    const all = navItems()
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
    const horizontal = layout === "Horizontal"
    const nextKey = horizontal ? (rtl ? "ArrowLeft" : "ArrowRight") : "ArrowDown"
    const prevKey = horizontal ? (rtl ? "ArrowRight" : "ArrowLeft") : "ArrowUp"
    const i = all.indexOf(current.current!)
    if (onGrowing) {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault()
        moveTo(all[all.length - 1])
      }
      return
    }
    let to: number | undefined
    if (e.key === nextKey) to = i + 1
    else if (e.key === prevKey) to = i - 1
    else if (e.key === "Home" || e.key === "PageUp") to = 0
    else if (e.key === "End" || e.key === "PageDown") to = all.length - 1
    // From the last item either "forward" arrow reaches the Load More button (UI5's _handleDown).
    if ((e.key === "ArrowDown" || e.key === "ArrowRight") && i === all.length - 1 && growing === "Button") {
      e.preventDefault()
      growingBtn.current?.focus()
      return
    }
    if (to === undefined && !["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) return
    e.preventDefault()
    if (to !== undefined && to >= 0 && to < all.length) moveTo(all[to])
  }

  const onFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    const nav = (e.target as HTMLElement).closest<HTMLElement>("[data-timeline-nav]")
    if (nav && nav !== current.current) {
      current.current = nav
      sync()
    }
    if (layout === "Horizontal") (e.target as HTMLElement).closest(".fiori-timeline__list-item")?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }

  // Horizontal layout: the vertical wheel scrolls sideways. Needs a non-passive listener to preventDefault.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root || layout !== "Horizontal") return
    const onWheel = (e: WheelEvent) => {
      const c = scrollRef.current
      if (!c || !e.deltaY || e.deltaX || c.scrollWidth <= c.clientWidth) return
      c.scrollLeft += e.deltaY
      e.preventDefault()
    }
    root.addEventListener("wheel", onWheel, { passive: false })
    return () => root.removeEventListener("wheel", onWheel)
  }, [layout])

  // growing="Scroll": fire when the end marker enters the viewport (not for the initial observation).
  const loadMoreRef = React.useRef(onLoadMore)
  React.useEffect(() => {
    loadMoreRef.current = onLoadMore
  })
  React.useEffect(() => {
    if (growing !== "Scroll" || !endMarker.current) return
    let initial = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const io = new IntersectionObserver(
      (entries) => {
        if (initial) {
          initial = false
          return
        }
        if (entries.some((en) => en.isIntersecting)) {
          clearTimeout(timer)
          timer = setTimeout(() => loadMoreRef.current?.(), SCROLL_DEBOUNCE)
        }
      },
      { threshold: 1 }
    )
    io.observe(endMarker.current)
    return () => {
      clearTimeout(timer)
      io.disconnect()
    }
  }, [growing])

  const context = React.useMemo<SharedContext>(() => ({ layout, itemRole: hasGroups ? "treeitem" : "listitem", sync }), [layout, hasGroups, sync])

  return (
    <div
      data-slot="timeline"
      data-dir={direction}
      data-layout={layout}
      data-growing={growing}
      data-loading={loading ? "" : undefined}
      data-sticky-header={stickyHeader ? "" : undefined}
      className={cn("fiori-timeline", className)}
      {...props}
    >
      <div ref={rootRef} className="fiori-timeline__root" role="region" aria-label={label} onKeyDown={onKeyDown} onFocus={onFocus}>
        <BusyIndicator className="fiori-timeline__busy-indicator" active={loading && growing !== "Button"} delay={loadingDelay}>
          <div ref={scrollRef} className="fiori-timeline__scroll-container">
            {(header != null || infoBar != null) && (
              <div className="fiori-timeline__header-area">
                {header != null && <div className="fiori-timeline__header">{header}</div>}
                {infoBar != null && <div className="fiori-timeline__info-bar">{infoBar}</div>}
              </div>
            )}
            <div className="fiori-timeline__list" role={hasGroups ? "tree" : "list"} aria-live="polite" aria-label={label}>
              <TimelineContext.Provider value={context}>
                {items.map((item, i) => (
                  <div key={item.key ?? i} className="fiori-timeline__list-item">
                    <PositionContext.Provider
                      value={{
                        firstChild: i === 0,
                        lastChild: i === items.length - 1,
                        firstItem: i === 0,
                        lastItem: i === items.length - 1,
                        nextGroup: isGroup(items[i + 1]),
                        lineWidth: lineWidth(item, items[i + 1]),
                      }}
                    >
                      {item}
                    </PositionContext.Provider>
                  </div>
                ))}
              </TimelineContext.Provider>
              {growing === "Button" && (
                <div className="fiori-timeline__list-item fiori-timeline__list-growing" role={hasGroups ? "treeitem" : "listitem"} aria-label={hasGroups ? loadMoreText : undefined}>
                  <div>
                    <Button ref={growingBtn} size="icon" title={loadMoreText} aria-label={loadMoreText} onClick={onLoadMore}>
                      <Icon icon={layout === "Horizontal" ? processIcon : drillDown} />
                    </Button>
                  </div>
                  {loading && <BusyIndicator className="fiori-timeline__growing-button-busy-indicator" active delay={loadingDelay} />}
                </div>
              )}
              {growing === "Scroll" && <div ref={endMarker} aria-hidden="true" className="fiori-timeline__end-marker" />}
            </div>
          </div>
        </BusyIndicator>
      </div>
    </div>
  )
}

export { Timeline, TimelineItem, TimelineGroupItem, type TimelineProps, type TimelineItemProps, type TimelineGroupItemProps, type TimelineLayout, type TimelineItemState }
