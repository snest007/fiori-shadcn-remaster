// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

import { bell, da, grid, overflow as overflowIcon, slimArrowDown, search as searchIcon, type FioriIconData } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { List, ListItemStandard } from "@/components/ui/list"
import { Menu, MenuContent, MenuTrigger } from "@/components/ui/menu"
import { Popover, PopoverAnchor, PopoverBody, PopoverContent } from "@/components/ui/popover"
import { ShellBarSearchContext } from "@/components/ui/search"

// Mirrors ui5-shellbar (Horizon, the current 2.28 slot API: startButton, branding, content, searchField,
// assistant, items, profile). Width breakpoints set the side padding and, at S, hide the branding title.
// Items that don't fit move to an overflow popover in UI5's order: custom items, assistant and notifications
// first, then content (last-placed first), then the search button. Keyboard: ←/→/Home/End move among the
// bar's tabbables (an input keeps the arrows until its caret is at the edge). ShellBar marks its
// fastNavigation group (UI5 metadata); F6 is handled only when the application installs it.
// The bar has no popovers of its own besides overflow: on*Click callers open theirs against `targetRef`.

const shellButton =
  "w-9 min-w-(--fiori-button-base-min-width) text-(--sapShell_TextColor) hover:bg-(--sapShell_Hover_Background) hover:border-(--sapButton_Lite_Hover_BorderColor) hover:text-(--sapShell_InteractiveTextColor) active:text-(--fiori-shellbar-button-active-color)"

// ---------------------------------------------------------------------------------------------
// Local keyboard targets; application F6 navigation is explicitly installed from @/lib/fiori-f6.

const FOCUSABLE = 'a[href], a[tabindex], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
const isShown = (el: HTMLElement) => el.offsetWidth > 0 && el.offsetHeight > 0 && getComputedStyle(el).visibility !== "hidden"

// ---------------------------------------------------------------------------------------------
// Parts

type BadgeProps = { text?: string; dot?: boolean; className?: string }

/** ui5-button-badge (design OverlayText / AttentionDot). */
function ShellBarBadge({ text, dot, className }: BadgeProps) {
  return (
    <span data-slot="shell-bar-badge" data-dot={dot ? "" : undefined} className={cn("fiori-shellbar-badge", className)}>
      {text}
    </span>
  )
}

type ShellBarBrandingProps = Omit<React.ComponentProps<"a">, "children"> & {
  /** An <img> or <svg>. */
  logo?: React.ReactNode
  /** The title; hidden when the bar is at its S breakpoint. */
  children?: React.ReactNode
  /** Accessible name; defaults to the title when it is a string. */
  accessibleName?: string
}

/** ui5-shellbar-branding: logo and title, a link with `href` and a button without. */
function ShellBarBranding({ logo, children, accessibleName, href, className, onKeyDown, onKeyUp, ...props }: ShellBarBrandingProps) {
  return (
    <a
      data-slot="shell-bar-branding"
      role={href ? "link" : "button"}
      href={href}
      tabIndex={0}
      aria-label={accessibleName ?? (typeof children === "string" ? children : undefined)}
      className={cn("fiori-shellbar-branding", className)}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented) return
        if (e.key === "Enter" && !href) {
          e.preventDefault()
          e.currentTarget.click()
        } else if (e.key === " ") {
          e.preventDefault()
        }
      }}
      onKeyUp={(e) => {
        onKeyUp?.(e)
        if (!e.defaultPrevented && e.key === " ") e.currentTarget.click()
      }}
      {...props}
    >
      {logo && <span className="fiori-shellbar-branding__logo">{logo}</span>}
      {children != null && <bdi className="fiori-shellbar-branding__title">{children}</bdi>}
    </a>
  )
}

type ShellBarMenuButtonProps = Omit<React.ComponentProps<"button">, "children"> & {
  logo?: React.ReactNode
  /** The primary title. */
  children?: React.ReactNode
  /** Shown after the button; hidden at the S breakpoint. */
  secondaryTitle?: React.ReactNode
  /** <MenuItem>s of the app switch menu. */
  menu: React.ReactNode
  /** Accessible name of the button; defaults to the title when it is a string. */
  accessibleName?: string
}

/**
 * The app switching button of ui5-shellbar's legacy API (primary-title, secondary-title, menuItems), which
 * 2.28 still renders. Goes in the `branding` prop. At S the logo moves into the button and replaces the title.
 */
function ShellBarMenuButton({ logo, children, secondaryTitle, menu, accessibleName, className, ...props }: ShellBarMenuButtonProps) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      {logo && <span className="fiori-shellbar-menu-logo">{logo}</span>}
      <Menu open={open} onOpenChange={setOpen} modal={false}>
        <MenuTrigger asChild>
          <button
            type="button"
            data-slot="shell-bar-menu-button"
            aria-label={accessibleName ?? (typeof children === "string" ? children : undefined)}
            className={cn("fiori-shellbar-menu-button", className)}
            {...props}
          >
            {logo && <span className="fiori-shellbar-menu-button__logo">{logo}</span>}
            {children != null && <span className="fiori-shellbar-menu-button__title">{children}</span>}
            <Icon icon={slimArrowDown} className="fiori-shellbar-menu-button__arrow" />
          </button>
        </MenuTrigger>
        <MenuContent className="w-60">{menu}</MenuContent>
      </Menu>
      {secondaryTitle != null && <div className="fiori-shellbar-secondary-title">{secondaryTitle}</div>}
    </>
  )
}

/** ui5-shellbar-spacer: in `content`, pushes what follows to the end of the content area. */
function ShellBarSpacer() {
  return null
}

type ShellBarItemProps = Omit<React.ComponentProps<"button">, "children"> & {
  icon: FioriIconData
  /** Accessible name in the bar (with the count appended); the visible text in the overflow popover. */
  text: string
  /** Badge text. */
  count?: string
}

/** ui5-shellbar-item: a custom action, a direct child of ShellBar. Its onClick also fires from the overflow popover. */
function ShellBarItem({ icon, text, count, className, ...props }: ShellBarItemProps) {
  return (
    <Button
      data-slot="shell-bar-item"
      variant="transparent"
      size="icon"
      aria-label={count ? `${text} ${count}` : text}
      className={cn(shellButton, className)}
      {...props}
    >
      <Icon icon={icon} />
      {count && <ShellBarBadge text={count} />}
    </Button>
  )
}

// ---------------------------------------------------------------------------------------------
// ShellBar

type ShellBarTexts = {
  /** aria-label of the bar (default "Shell Bar"). */
  label: string
  /** Tooltip of the notifications button (default "{count} Notifications"). */
  notifications: (count: string) => string
  /** Notifications entry of the overflow popover (default "Notifications"). */
  notificationsNoCount: string
  /** Tooltip of the profile button (default "User Menu"). */
  profile: string
  /** Tooltip of the product switch button (default "Products"). */
  products: string
  /** Tooltip of the overflow button (default "More"). */
  overflow: string
  /** Assistant entry of the overflow popover (default "Assistant"). */
  assistant: string
  /** Search entry of the overflow popover (default "Search"). */
  search: string
  /** Cancel button of the full-width search (default "Cancel"). */
  cancel: string
  /** Name of the content area when it holds several items (default "Additional Info"). */
  additionalInfo: string
}

const defaultTexts: ShellBarTexts = {
  label: "Shell Bar",
  notifications: (n) => `${n} Notifications`,
  notificationsNoCount: "Notifications",
  profile: "User Menu",
  products: "Products",
  overflow: "More",
  assistant: "Assistant",
  search: "Search",
  cancel: "Cancel",
  additionalInfo: "Additional Info",
}

type PopupAttributes = { expanded?: boolean; hasPopup?: "dialog" | "grid" | "listbox" | "menu" | "tree" }

/** Fired by the bar's buttons. preventDefault keeps the overflow popover open (when fired from it). */
type ShellBarClickEvent = { targetRef: HTMLElement; preventDefault: () => void }
type ShellBarSearchButtonEvent = ShellBarClickEvent & { searchFieldVisible: boolean }
type ShellBarBreakpoint = "S" | "M" | "L" | "XL" | "XXL"

type ShellBarProps = Omit<React.ComponentProps<"div">, "content"> & {
  /** A button before the branding (e.g. the side navigation toggle). */
  startButton?: React.ReactNode
  /** <ShellBarBranding> (or <ShellBarMenuButton>). */
  branding?: React.ReactNode
  /** Items between branding and search. A <ShellBarSpacer> splits them; `data-hide-order` tunes which hide first. */
  content?: React.ReactNode
  /** <ShellBarSearch>. */
  search?: React.ReactNode
  /** Whether the search field is expanded (controlled). */
  searchExpanded?: boolean
  defaultSearchExpanded?: boolean
  onSearchExpandedChange?: (expanded: boolean) => void
  /** Leaves the search as it is when the bar's width changes. */
  disableSearchCollapse?: boolean
  /** Assistant toggle (a <ToggleButton variant="transparent" size="icon">). */
  assistant?: React.ReactNode
  showNotifications?: boolean
  /** Badge text of the notifications button. */
  notificationsCount?: string
  /** An <Avatar>, shown in the profile button. */
  profile?: React.ReactNode
  showProductSwitch?: boolean
  /** <ShellBarItem>s (direct children, or inside fragments). */
  children?: React.ReactNode
  onNotificationsClick?: (e: ShellBarClickEvent) => void
  onProfileClick?: (e: ShellBarClickEvent) => void
  onProductSwitchClick?: (e: ShellBarClickEvent) => void
  /** The search button or icon was used; preventDefault stops the field expanding / collapsing. */
  onSearchButtonClick?: (e: ShellBarSearchButtonEvent) => void
  /** Cancel in the full-width search; preventDefault keeps the field's value. */
  onSearchFieldClear?: (e: ShellBarClickEvent) => void
  /** The `key`s of the `content` items currently hidden. */
  onContentItemVisibilityChange?: (hiddenKeys: string[]) => void
  onBreakpointChange?: (breakpoint: ShellBarBreakpoint) => void
  accessibilityAttributes?: {
    notifications?: PopupAttributes
    profile?: PopupAttributes & { name?: string }
    product?: PopupAttributes
    search?: { hasPopup?: PopupAttributes["hasPopup"] }
    overflow?: PopupAttributes
  }
  texts?: Partial<ShellBarTexts>
}

// Keys get their fragment's key as a prefix: two fragments may both hold an unkeyed first child.
const flatten = (children: React.ReactNode, prefix = ""): React.ReactElement<any>[] =>
  React.Children.toArray(children).flatMap((c) => {
    if (!React.isValidElement<{ children?: React.ReactNode }>(c)) return []
    if (c.type === React.Fragment) return flatten(c.props.children, `${prefix}${c.key}/`)
    return [prefix ? React.cloneElement(c, { key: `${prefix}${c.key}` }) : c]
  })

const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i])

const breakpointOf = (w: number): ShellBarBreakpoint => (w <= 599 ? "S" : w <= 1023 ? "M" : w <= 1439 ? "L" : w <= 1919 ? "XL" : "XXL")

// UI5 ShellBarOverflow hide priorities.
const CLOSED = { actions: 0, content: 1000, search: 2000, lastContent: 3000 }
const OPEN = { actions: 1000, content: 0, search: 2000, lastContent: 0 }

function ShellBar({
  startButton,
  branding,
  content,
  search,
  searchExpanded,
  defaultSearchExpanded = false,
  onSearchExpandedChange,
  disableSearchCollapse,
  assistant,
  showNotifications,
  notificationsCount,
  profile,
  showProductSwitch,
  children,
  onNotificationsClick,
  onProfileClick,
  onProductSwitchClick,
  onSearchButtonClick,
  onSearchFieldClear,
  onContentItemVisibilityChange,
  onBreakpointChange,
  accessibilityAttributes: a11y = {},
  texts: textsProp,
  className,
  style,
  onKeyDown,
  ...props
}: ShellBarProps) {
  const texts = { ...defaultTexts, ...textsProp }
  const hostRef = React.useRef<HTMLDivElement>(null)
  const outerRef = React.useRef<HTMLDivElement>(null)
  const innerRef = React.useRef<HTMLDivElement>(null)
  const searchAreaRef = React.useRef<HTMLDivElement>(null)
  const overflowBtnRef = React.useRef<HTMLButtonElement>(null)
  const bellRef = React.useRef<HTMLButtonElement>(null)
  const profileRef = React.useRef<HTMLButtonElement>(null)
  const productsRef = React.useRef<HTMLButtonElement>(null)
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  const [breakpoint, setBreakpoint] = React.useState<ShellBarBreakpoint>("XL")
  const [hiddenIds, setHiddenIds] = React.useState<string[]>([])
  const [showOverflow, setShowOverflow] = React.useState(false)
  const [overflowOpen, setOverflowOpen] = React.useState(false)
  const [fullWidth, setFullWidth] = React.useState(false)
  const [searchState, setSearchState] = React.useState(defaultSearchExpanded)
  const expanded = !!search && (searchExpanded ?? searchState)
  const focusSearch = React.useRef(false)
  const overflowSurfaceRef = React.useRef<HTMLDivElement>(null)
  // Decided as the popover closes: Radix's close-focus callback can run later, when an entry has moved focus on.
  const restoreOverflowFocus = React.useRef(false)
  React.useLayoutEffect(() => {
    if (overflowOpen) return
    const active = document.activeElement
    restoreOverflowFocus.current = active === document.body || !!overflowSurfaceRef.current?.contains(active)
  }, [overflowOpen])
  const initialResize = React.useRef(true)

  const setExpanded = React.useCallback(
    (next: boolean) => {
      if (searchExpanded === undefined) setSearchState(next)
      onSearchExpandedChange?.(next)
    },
    [searchExpanded, onSearchExpandedChange]
  )

  const items = flatten(children)
  const contentChildren = flatten(content)
  const spacerAt = contentChildren.findIndex((c) => c.type === ShellBarSpacer)
  const startContent = spacerAt === -1 ? contentChildren : contentChildren.slice(0, spacerAt)
  const endContent = spacerAt === -1 ? [] : contentChildren.slice(spacerAt + 1)
  const contentId = (c: React.ReactElement) => `content-${c.key}`
  const itemId = (c: React.ReactElement) => `item-${c.key}`
  const hideOrder = (c: React.ReactElement<any>, fallback = 0) => {
    const v = parseInt(c.props["data-hide-order"] ?? "", 10)
    return Number.isNaN(v) ? fallback : v
  }
  // Items on the right hide first, then by data-hide-order.
  const sortContent = (list: React.ReactElement<any>[]) => [...list].reverse().sort((x, y) => hideOrder(x) - hideOrder(y))
  const sorted = sortContent([...startContent, ...endContent])
  const hasAssistant = !!assistant

  // Everything measure() needs from the latest render.
  const latest = React.useRef({ sorted, items, hasAssistant, showNotifications, hasSearch: !!search, expanded, hiddenIds, contentChildren })
  latest.current = { sorted, items, hasAssistant, showNotifications, hasSearch: !!search, expanded, hiddenIds, contentChildren }
  const contentHiddenCb = React.useRef(onContentItemVisibilityChange)
  contentHiddenCb.current = onContentItemVisibilityChange

  // UI5 ShellBarOverflow.updateOverflow: show everything, then hide one by one until nothing overflows.
  // data-sb-hidden belongs to this function (React only ever writes it once, on the overflow button's mount).
  const measure = React.useCallback(() => {
    const host = hostRef.current
    const outer = outerRef.current
    const inner = innerRef.current
    if (!host || !outer || !inner) return [] as string[]
    const l = latest.current
    const byId = new Map([...host.querySelectorAll<HTMLElement>("[data-sb-id]")].map((el) => [el.dataset.sbId!, el]))
    const setVisible = (id: string, v: boolean) => byId.get(id)?.toggleAttribute("data-sb-hidden", !v)
    const prio = l.expanded ? OPEN : CLOSED
    let i = 0
    const list = [
      ...l.sorted.map((c, index) => ({
        id: contentId(c),
        order: (index === l.sorted.length - 1 ? prio.lastContent : prio.content) + hideOrder(c, index),
        inOverflow: false,
      })),
      ...l.items.map((c) => ({ id: itemId(c), order: prio.actions + i++, inOverflow: true })),
      ...(l.hasAssistant ? [{ id: "assistant", order: prio.actions + i++, inOverflow: true }] : []),
      ...(l.showNotifications ? [{ id: "notifications", order: prio.actions + i++, inOverflow: true }] : []),
      ...(l.hasSearch && !l.expanded ? [{ id: "search", order: prio.search + i++, inOverflow: true }] : []),
    ].sort((x, y) => {
      // What was hidden stays hidden first, so items don't flicker between measurements.
      const xKeep = !x.id.startsWith("content-") && l.hiddenIds.includes(x.id)
      const yKeep = !y.id.startsWith("content-") && l.hiddenIds.includes(y.id)
      if (xKeep !== yKeep) return xKeep ? -1 : 1
      return x.order - y.order
    })
    const overflowing = () => inner.offsetWidth > outer.offsetWidth
    setVisible("overflow", false)
    // Not in `list` while expanded, but it may have been hidden while collapsed.
    setVisible("search", true)
    list.forEach((it) => setVisible(it.id, true))
    const hidden: string[] = []
    let overflowBtn = false
    for (const it of list) {
      if (!overflowing()) break
      setVisible(it.id, false)
      hidden.push(it.id)
      if (it.inOverflow) {
        setVisible("overflow", true)
        overflowBtn = true
      }
    }
    if (!sameIds(hidden, l.hiddenIds)) {
      const contentHidden = (ids: string[]) => ids.filter((x) => x.startsWith("content-"))
      if (!sameIds(contentHidden(hidden), contentHidden(l.hiddenIds))) {
        contentHiddenCb.current?.(contentHidden(hidden).map((x) => x.split("/").pop()!.replace(/^(content-)?\.\$?/, "")))
      }
      setHiddenIds(hidden)
    }
    setShowOverflow(overflowBtn)
    setFullWidth(overflowing() && l.expanded)
    return hidden
  }, [])

  React.useLayoutEffect(() => {
    measure()
  })

  const bpCb = React.useRef(onBreakpointChange)
  bpCb.current = onBreakpointChange
  const manageSearch = React.useRef<(hiddenCount: number) => void>(() => {})
  manageSearch.current = (hiddenCount) => {
    // UI5 ShellBarSearch.autoManageSearchState.
    const area = searchAreaRef.current
    if (!search || disableSearchCollapse || !area) return
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
    const fieldWidth = parseFloat(getComputedStyle(area).getPropertyValue("--fiori-shellbar-search-field-width")) * rem || 400
    const input = area.querySelector("input")
    const hasFocus = area.contains(document.activeElement)
    const inFullScreen = !initialResize.current && expanded && !!outerRef.current && !!innerRef.current && innerRef.current.offsetWidth > outerRef.current.offsetWidth
    const spacerWidth = hostRef.current?.querySelector(".fiori-shellbar__spacer")?.getBoundingClientRect().width ?? 0
    const buttonSize = expanded ? 0 : (area.querySelector("[data-slot=search]")?.getBoundingClientRect().width ?? 0)
    if (hiddenCount > 0 && !(hasFocus || !!input?.value || inFullScreen)) {
      if (expanded) setExpanded(false)
    } else if (spacerWidth + buttonSize > fieldWidth && window.matchMedia("(hover: hover)").matches) {
      if (!expanded) setExpanded(true)
    }
    initialResize.current = false
  }

  React.useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return
    let lastWidth = -1
    const update = () => {
      const width = host.getBoundingClientRect().width
      if (width === lastWidth) return
      lastWidth = width
      const bp = breakpointOf(width)
      setBreakpoint((prev) => {
        if (prev !== bp) bpCb.current?.(bp)
        return bp
      })
      setOverflowOpen(false)
      // After the breakpoint's padding has applied.
      requestAnimationFrame(() => manageSearch.current(measure().length))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(host)
    return () => ro.disconnect()
  }, [measure])

  const isHidden = (id: string) => hiddenIds.includes(id)

  // Search: the bar's button logic (UI5 handleSearchButtonClick).
  const toggleSearch = React.useCallback(() => {
    const targetRef = (searchAreaRef.current?.querySelector("button, input") ?? searchAreaRef.current) as HTMLElement
    let prevented = false
    onSearchButtonClick?.({ targetRef, searchFieldVisible: expanded, preventDefault: () => (prevented = true) })
    if (prevented) return true
    if (!expanded) focusSearch.current = true
    setExpanded(!expanded)
    return false
  }, [expanded, onSearchButtonClick, setExpanded])

  React.useEffect(() => {
    if (expanded && focusSearch.current) searchAreaRef.current?.querySelector("input")?.focus()
    focusSearch.current = false
  }, [expanded, fullWidth, hiddenIds])

  const searchCtx = React.useMemo(() => ({ expanded, toggle: toggleSearch }), [expanded, toggleSearch])

  const fire = (cb: ((e: ShellBarClickEvent) => void) | undefined, ref: HTMLElement | null) => {
    let prevented = false
    if (ref) cb?.({ targetRef: ref, preventDefault: () => (prevented = true) })
    return prevented
  }
  const notificationsTarget = () => (isHidden("notifications") ? overflowBtnRef.current : bellRef.current)

  // Overflow popover.
  const overflowEntries = [
    ...(isHidden("search") ? [{ id: "search", icon: searchIcon, text: texts.search, count: undefined as string | undefined, order: 0 }] : []),
    ...(isHidden("notifications") ? [{ id: "notifications", icon: bell, text: texts.notificationsNoCount, count: notificationsCount, order: 1 }] : []),
    ...(isHidden("assistant") ? [{ id: "assistant", icon: da, text: texts.assistant, count: undefined as string | undefined, order: 2 }] : []),
    ...items.filter((c) => isHidden(itemId(c))).map((c, n) => ({ id: itemId(c), icon: c.props.icon as FioriIconData, text: c.props.text as string, count: c.props.count as string | undefined, order: 3 + n })),
  ].sort((x, y) => x.order - y.order)
  const counted = overflowEntries.filter((e) => e.count)
  const overflowBadge = counted.length === 1 ? <ShellBarBadge text={counted[0].count} /> : counted.length > 1 ? <ShellBarBadge dot /> : null

  const onOverflowItem = (id: string) => {
    let keepOpen = false
    if (id === "notifications") keepOpen = fire(onNotificationsClick, notificationsTarget())
    else if (id === "search") keepOpen = toggleSearch()
    // UI5's entry only closes the popover; here it also works the hidden assistant button.
    else if (id === "assistant") hostRef.current?.querySelector<HTMLElement>('[data-sb-id="assistant"] button')?.click()
    else {
      const item = items.find((c) => itemId(c) === id)
      let prevented = false
      item?.props.onClick?.({ currentTarget: overflowBtnRef.current, target: overflowBtnRef.current, preventDefault: () => (prevented = true) })
      keepOpen = prevented
    }
    if (!keepOpen) setOverflowOpen(false)
  }

  // Content area separators (none at S); the last one to go hides together with its item.
  const isS = breakpoint === "S"
  const showStartSep = !isS && startContent.some((c) => !isHidden(contentId(c)))
  const showEndSep = !isS && endContent.some((c) => !isHidden(contentId(c)))
  const packed = (c: React.ReactElement, group: React.ReactElement[]) => isHidden(contentId(c)) && sortContent(group).at(-1) === c
  const visibleContent = contentChildren.filter((c) => c.type !== ShellBarSpacer && !isHidden(contentId(c))).length

  return (
    <div
      ref={hostRef}
      data-slot="shell-bar"
      data-breakpoint={breakpoint}
      data-sap-ui-fastnavgroup="true"
      data-search-expanded={expanded ? "" : undefined}
      data-full-width-search={fullWidth ? "" : undefined}
      className={cn("fiori-shellbar", className)}
      style={style}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented) return
        moveFocus(e)
      }}
      {...props}
    >
      <header className="fiori-shellbar__root" aria-label={texts.label}>
        {startButton && <div className="fiori-shellbar__start fiori-shellbar__gap-end">{startButton}</div>}
        {branding && <div className="fiori-shellbar__branding">{branding}</div>}
        <div ref={outerRef} className="fiori-shellbar__overflow-outer">
          <div ref={innerRef} className="fiori-shellbar__overflow-inner">
            {contentChildren.length > 0 && (
              <div className="fiori-shellbar__content" role={visibleContent > 1 ? "group" : undefined} aria-label={visibleContent > 1 ? texts.additionalInfo : undefined}>
                {showStartSep && <div className="fiori-shellbar__separator" />}
                {startContent.map((c) => (
                  <div key={c.key} data-sb-id={contentId(c)} className="fiori-shellbar__content-item fiori-shellbar__gap-start">
                    {packed(c, startContent) && <div className="fiori-shellbar__separator" />}
                    {c}
                  </div>
                ))}
                <div className="fiori-shellbar__spacer" />
                {endContent.map((c) => (
                  <div key={c.key} data-sb-id={contentId(c)} className="fiori-shellbar__content-item fiori-shellbar__gap-start">
                    {c}
                    {packed(c, endContent) && <div className="fiori-shellbar__separator fiori-shellbar__gap-start" />}
                  </div>
                ))}
                {showEndSep && <div className="fiori-shellbar__separator fiori-shellbar__gap-start" />}
              </div>
            )}
            {search && (
              <div ref={searchAreaRef} data-sb-id="search" className="fiori-shellbar__search-area fiori-shellbar__gap-start">
                <div className="fiori-shellbar__search-frame">
                  <ShellBarSearchContext.Provider value={searchCtx}>{search}</ShellBarSearchContext.Provider>
                  {fullWidth && (
                    <Button
                      ref={cancelRef}
                      variant="transparent"
                      className="fiori-shellbar__gap-start"
                      onClick={() => {
                        const prevented = fire(onSearchFieldClear, cancelRef.current)
                        setExpanded(false)
                        if (!prevented) {
                          const input = searchAreaRef.current?.querySelector("input")
                          if (input) {
                            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, "")
                            input.dispatchEvent(new Event("input", { bubbles: true }))
                          }
                        }
                      }}
                    >
                      {texts.cancel}
                    </Button>
                  )}
                </div>
              </div>
            )}
            {assistant && (
              <div data-sb-id="assistant" className="fiori-shellbar__assistant fiori-shellbar__gap-start">
                {assistant}
              </div>
            )}
            {showNotifications && (
              <Button
                ref={bellRef}
                data-sb-id="notifications"
                variant="transparent"
                size="icon"
                title={texts.notifications(notificationsCount || "0")}
                aria-label={texts.notifications(notificationsCount || "0")}
                aria-expanded={a11y.notifications?.expanded}
                aria-haspopup={a11y.notifications?.hasPopup}
                data-has-badge={notificationsCount ? "" : undefined}
                className={cn(shellButton, "fiori-shellbar__gap-start fiori-shellbar__action")}
                onClick={() => fire(onNotificationsClick, bellRef.current)}
              >
                <Icon icon={bell} />
                {notificationsCount && <ShellBarBadge text={notificationsCount} />}
              </Button>
            )}
            {items.map((c) => (
              <div key={c.key} data-sb-id={itemId(c)} className="fiori-shellbar__custom-item fiori-shellbar__gap-start">
                {!isHidden(itemId(c)) && c}
              </div>
            ))}
            <Popover open={overflowOpen} onOpenChange={setOverflowOpen}>
              <PopoverAnchor asChild>
                <Button
                  ref={overflowBtnRef}
                  data-sb-id="overflow"
                  data-sb-hidden=""
                  variant="transparent"
                  size="icon"
                  title={texts.overflow}
                  aria-label={counted.length === 1 ? `${texts.overflow} ${counted[0].count}` : texts.overflow}
                  aria-haspopup={a11y.overflow?.hasPopup ?? "menu"}
                  aria-expanded={a11y.overflow?.expanded ?? overflowOpen}
                  data-has-badge={overflowBadge ? "" : undefined}
                  className={cn(shellButton, "fiori-shellbar__gap-start fiori-shellbar__action")}
                  onClick={() => setOverflowOpen((o) => !o)}
                >
                  <Icon icon={overflowIcon} />
                  {overflowBadge}
                </Button>
              </PopoverAnchor>
              <PopoverContent
                ref={overflowSurfaceRef}
                hideArrow
                side="bottom"
                align="end"
                aria-label={texts.overflow}
                className="fiori-shellbar-overflow leading-[normal]"
                onCloseAutoFocus={(e) => {
                  e.preventDefault()
                  // Not when the chosen entry moved the focus on (search field, the caller's popover).
                  if (showOverflow && restoreOverflowFocus.current && document.activeElement === document.body) overflowBtnRef.current?.focus()
                }}
              >
                <PopoverBody className="p-0">
                  <List separators="none" aria-label={texts.overflow} onItemClick={onOverflowItem}>
                    {overflowEntries.map((e) => (
                      <ListItemStandard key={e.id} value={e.id} icon={e.icon} text={e.text} additionalText={e.count} />
                    ))}
                  </List>
                </PopoverBody>
              </PopoverContent>
            </Popover>
            {profile && (
              <Button
                ref={profileRef}
                variant="transparent"
                size="icon"
                title={a11y.profile?.name ?? texts.profile}
                aria-label={a11y.profile?.name ?? texts.profile}
                aria-expanded={a11y.profile?.expanded}
                aria-haspopup={a11y.profile?.hasPopup}
                className={cn(shellButton, "fiori-shellbar__gap-start fiori-shellbar__profile min-w-0 rounded-(--fiori-shellbar-image-button-border-radius)")}
                onClick={() => fire(onProfileClick, profileRef.current)}
              >
                {profile}
              </Button>
            )}
            {showProductSwitch && (
              <Button
                ref={productsRef}
                variant="transparent"
                size="icon"
                title={texts.products}
                aria-label={texts.products}
                aria-expanded={a11y.product?.expanded}
                aria-haspopup={a11y.product?.hasPopup}
                className={cn(shellButton, "fiori-shellbar__gap-start")}
                onClick={() => fire(onProductSwitchClick, productsRef.current)}
              >
                <Icon icon={grid} />
              </Button>
            )}
          </div>
        </div>
      </header>
    </div>
  )
}

/** UI5 ShellBarItemNavigation: no wrap around; not mirrored in RTL, as in UI5. */
function moveFocus(e: React.KeyboardEvent<HTMLElement>) {
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return
  if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return
  const active = document.activeElement as HTMLElement | null
  if (!active) return
  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
    const caret = active.selectionStart ?? 0
    if (e.key === "ArrowLeft" && caret > 0) return
    if (e.key === "ArrowRight" && caret < active.value.length) return
    if (e.key === "Home" || e.key === "End") return
  }
  const items = [...e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => isShown(el) && el.tabIndex !== -1)
  const i = items.indexOf(active)
  if (i === -1) return
  e.preventDefault()
  if (e.key === "ArrowLeft") items[i - 1]?.focus()
  else if (e.key === "ArrowRight") items[i + 1]?.focus()
  else if (e.key === "Home") items[0]?.focus()
  else items.at(-1)?.focus()
}

export {
  ShellBar,
  ShellBarBadge,
  ShellBarBranding,
  ShellBarItem,
  ShellBarMenuButton,
  ShellBarSpacer,
  type ShellBarBreakpoint,
  type ShellBarBrandingProps,
  type ShellBarClickEvent,
  type ShellBarItemProps,
  type ShellBarMenuButtonProps,
  type ShellBarProps,
  type ShellBarSearchButtonEvent,
  type ShellBarTexts,
}
