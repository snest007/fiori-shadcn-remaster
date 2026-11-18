// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { useFioriTexts } from "@/lib/fiori-locale"
import { isF6NavigationKey } from "@/lib/fiori-f6"

// UI5 2.28 SideNavigation fastNavigation metadata; UI5Element.onEnterDOM marks this root unless overridden.

import { arrowRight, navigationDownArrow, navigationRightArrow, overflow, type FioriIconData } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { Menu, MenuContent, MenuGroup, MenuItem, MenuSub, MenuSubContent, MenuSubTrigger, MenuTrigger } from "@/components/ui/menu"

// Mirrors ui5-side-navigation / -group / -item / -sub-item (Horizon, UI5 2.28).
// Expanded: a tree (role="tree") of items, sub-items and groups; ↑/↓ (Home/End, PageUp/PageDown) move the
// roving focus, → / ← (+ / −) expand or collapse, Enter / Space select. Collapsed: a vertical menubar of
// icons; an item with sub-items opens a popover holding a small tree with the item and its sub-items.
// The flexible and the fixed (footer) list are separate tab stops, as in UI5.
// Styles: registry/styles/components/side-navigation.css (a port of the UI5 shadow CSS; the
// `.fiori-sn-host` elements stand in for the UI5 custom-element hosts).

type SideNavigationTexts = {
  /** aria-label of the main list (UI5 "Primary Navigation Menu"). */
  primaryListLabel: string
  /** aria-label of the fixed list (UI5 "Footer Navigation Menu"). */
  fixedListLabel: string
  /** aria-roledescription of the lists in expanded mode. */
  listRoleDescription: string
  /** aria-roledescription of the lists in collapsed mode. */
  collapsedListRoleDescription: string
  /** Tooltip of the expand arrow. */
  expandText: string
  collapseText: string
  /** Accessible name of the popover that shows sub-items in collapsed mode. */
  popoverLabel: string
  /** Text and accessible description of the collapsed overflow item. */
  overflowText: string
  overflowDescription: string
  overflowMenuLabel: string
  overflowParentDescription: string
  /** Description of a selectable parent item (it navigates; the arrow expands). */
  parentItemDescription: (text: string) => string
}

const defaultTexts: SideNavigationTexts = {
  primaryListLabel: "Primary Navigation Menu",
  fixedListLabel: "Footer Navigation Menu",
  listRoleDescription: "Navigation List Tree",
  collapsedListRoleDescription: "Navigation List Menu Bar",
  expandText: "Expand",
  collapseText: "Collapse",
  popoverLabel: "Navigation",
  overflowText: "More Items",
  overflowDescription: "Displays additional navigation items that are hidden due to limited screen space.",
  overflowMenuLabel: "Additional Navigation Items",
  overflowParentDescription: "This menu item opens a submenu and also links to a page. To go to the page, press Enter or the right arrow key to open the submenu, then select the first item in the submenu.",
  parentItemDescription: (text) => `To navigate to navigation item ${text}, press Spacebar or Enter.`,
}

type ItemDesign = "default" | "action"

type RootContextValue = {
  collapsed: boolean
  selected: string | undefined
  texts: SideNavigationTexts
  /** Selects (and fires the change); `false` when the change was refused. */
  select: (value: string) => void
  itemClick: (value: string | undefined, e: React.SyntheticEvent) => void
  /** Open popover (collapsed mode): the key of the item whose sub-items are shown. */
  popoverKey: string | null
  setPopoverKey: (key: string | null) => void
  toggle: (value: string | undefined, expanded: boolean) => void
  collapsedItems: React.RefObject<WeakMap<HTMLElement, SideNavigationItemProps>>
}

const RootContext = React.createContext<RootContextValue | null>(null)

/** Rendering context: collapsed menubar, expanded tree, or the tree inside the collapsed-mode popover. */
type Mode = { collapsed: boolean; inPopover: boolean; fixed: boolean; closePopover?: () => void }
const ModeContext = React.createContext<Mode>({ collapsed: false, inPopover: false, fixed: false })

/** Position of a top-level child (UI5 styles separators with :first-child / :last-child / belowGroup). */
type TopPosition = { first: boolean; last: boolean; belowGroup: boolean; top: boolean }
const TopPositionContext = React.createContext<TopPosition>({ first: false, last: false, belowGroup: false, top: false })

/** Disabled state inherited from a disabled group or parent item. */
const ParentDisabledContext = React.createContext(false)

/** Lets NavigationLayout drive `collapsed` and hear item clicks (to close the navigation on phones). */
type SideNavigationLayoutBridge = { collapsed?: boolean; onItemClick?: () => void }
const SideNavigationLayoutContext = React.createContext<SideNavigationLayoutBridge | null>(null)

function useRoot() {
  const ctx = React.useContext(RootContext)
  if (!ctx) throw new Error("SideNavigation items must be rendered inside <SideNavigation>")
  return ctx
}

/** A ui5-icon look-alike: an inline-block host with an svg root (some rules style the root as a ::part). */
function SnIcon({
  icon,
  className,
  label,
  onClick,
}: {
  icon: FioriIconData
  className: string
  label?: string
  onClick?: (e: React.MouseEvent) => void
}) {
  return (
    <span className={cn("fiori-sn-icon", className)} aria-hidden={label ? undefined : true} onClick={onClick}>
      <svg
        className={cn("fiori-sn-icon__root", !icon.ltr && "rtl:-scale-x-100")}
        viewBox={icon.viewBox}
        focusable="false"
        role={label ? "img" : undefined}
        aria-label={label}
      >
        {label && <title>{label}</title>}
        <path d={icon.path} />
      </svg>
    </span>
  )
}

// ---------------------------------------------------------------------------------------------
// Roving focus within one list (UI5 ItemNavigation, vertical, non-cyclic, PageUp/PageDown skip 10).

const NAV_SELECTOR = "[data-sn-nav]"
const PAGE_SIZE = 10

function listItems(list: HTMLElement) {
  // Only this list's own items (a popover is portalled, so it never sits inside).
  return [...list.querySelectorAll<HTMLElement>(NAV_SELECTOR)].filter((el) => el.closest("[data-sn-list]") === list && !el.closest("[data-sn-hidden]"))
}

function useRovingList() {
  const ref = React.useRef<HTMLElement | null>(null)
  const last = React.useRef<HTMLElement | null>(null)

  const sync = React.useCallback(() => {
    const list = ref.current
    if (!list) return
    const items = listItems(list).filter((el) => !el.hasAttribute("data-sn-unfocusable"))
    if (!items.length) return
    const active = document.activeElement as HTMLElement | null
    let current = active && list.contains(active) ? items.find((i) => i === active) : undefined
    // As UI5: while focus is outside, the selected item is the entry point.
    current ??= items.find((i) => i.hasAttribute("data-selected"))
    current ??= last.current && items.includes(last.current) ? last.current : items[0]
    for (const i of items) i.tabIndex = i === current ? 0 : -1
  }, [])

  React.useLayoutEffect(() => {
    sync()
    const list = ref.current
    if (!list) return
    const mo = new MutationObserver(sync)
    mo.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-selected", "data-sn-hidden"] })
    return () => mo.disconnect()
  }, [sync])

  const onFocus = (e: React.FocusEvent<HTMLElement>) => {
    const target = e.target as HTMLElement
    if (!target.matches(NAV_SELECTOR) || target.hasAttribute("data-sn-unfocusable")) return
    last.current = target
    for (const i of listItems(e.currentTarget)) i.tabIndex = i === target ? 0 : -1
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    // ItemNavigation.js _onkeydown uses unmodified Keys.js navigation predicates.
    if (e.defaultPrevented || hasNavigationModifiers(e)) return
    const items = listItems(e.currentTarget).filter((el) => !el.hasAttribute("data-sn-unfocusable"))
    const index = items.indexOf(document.activeElement as HTMLElement)
    if (index < 0) return
    const key = navigationKey(e)
    let next = -1
    if (key === "ArrowDown") next = Math.min(index + 1, items.length - 1)
    else if (key === "ArrowUp") next = Math.max(index - 1, 0)
    else if (key === "Home") next = 0
    else if (key === "End") next = items.length - 1
    else if (key === "PageDown") next = Math.min(index + PAGE_SIZE, items.length - 1)
    else if (key === "PageUp") next = Math.max(index - PAGE_SIZE, 0)
    else return
    e.preventDefault()
    items[next].focus()
  }

  return { ref, onFocus, onKeyDown }
}

function NavList({
  fixed,
  collapsed,
  inPopover,
  label,
  className,
  children,
}: {
  fixed: boolean
  collapsed: boolean
  inPopover?: boolean
  label?: string
  className: string
  children: React.ReactNode
}) {
  const root = useRoot()
  const { ref, onFocus, onKeyDown } = useRovingList()
  const overflowRef = React.useRef<HTMLDivElement>(null)
  const [hiddenItems, setHiddenItems] = React.useState<HTMLElement[]>([])
  const hiddenHosts = React.useRef<HTMLElement[]>([])
  const measure = React.useCallback(() => {
    const list = ref.current
    const more = overflowRef.current
    if (!collapsed || fixed || !list || !more) return
    // SideNavigation.js _updateOverflowItems / _updateItemsVisibility (UI5 2.28): reserve More,
    // the selected parent (including a selected sub-item), and group-ending separators first.
    // Separators travel with their preceding item; the selected parent always remains visible.
    const nodes = [...list.querySelectorAll<HTMLElement>('.fiori-sn-host[data-kind="item"], .fiori-sn-sep')]
      .filter((el) => el !== more && el.closest("[data-sn-list]") === list)
    for (const node of nodes) node.removeAttribute("data-sn-hidden")
    more.setAttribute("data-sn-hidden", "")
    const itemNode = (node: HTMLElement) => node.matches('.fiori-sn-host[data-kind="item"]') ? node.querySelector<HTMLElement>(NAV_SELECTOR) : null
    const height = (node: HTMLElement) => {
      const dom = itemNode(node) ?? node
      const style = getComputedStyle(dom)
      return dom.offsetHeight + parseFloat(style.marginTop) + parseFloat(style.marginBottom)
    }
    const style = getComputedStyle(list)
    const available = list.offsetHeight - parseInt(style.paddingTop) - parseInt(style.paddingBottom)
    const selected = nodes.find((node) => itemNode(node)?.getAttribute("aria-current") === "page")
    const navItems = nodes.filter((node) => itemNode(node))
    const nextSeparator = (node?: HTMLElement) => {
      const next = node && nodes[nodes.indexOf(node) + 1]
      return next && !itemNode(next) ? next : undefined
    }
    const hidden: HTMLElement[] = []
    if (window.innerWidth > 600 && nodes.reduce((sum, node) => sum + height(node), 0) > available) {
      more.removeAttribute("data-sn-hidden")
      let used = height(more) + 1 // UI5 adds one pixel for sub-pixel rounding.
      if (selected) used += height(selected) + (nextSeparator(selected)?.offsetHeight ?? 0)
      used += nextSeparator([...navItems].reverse().find((node) => node !== selected))?.offsetHeight ?? 0
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        if (node === selected || !itemNode(node)) continue
        used += height(node)
        const separator = nextSeparator(node)
        if (separator) {
          used += separator.offsetHeight
          i++
        }
        if (used > available) {
          node.setAttribute("data-sn-hidden", "")
          separator?.setAttribute("data-sn-hidden", "")
          hidden.push(node)
        }
      }
    }
    if (document.activeElement && hidden.some((node) => node.contains(document.activeElement))) {
      more.querySelector<HTMLElement>(NAV_SELECTOR)?.focus({ preventScroll: true })
    } else if (more.hasAttribute("data-sn-hidden") && more.contains(document.activeElement)) {
      (selected ?? navItems[0])?.querySelector<HTMLElement>(NAV_SELECTOR)?.focus({ preventScroll: true })
    }
    if (hidden.length !== hiddenHosts.current.length || hidden.some((node, i) => node !== hiddenHosts.current[i])) {
      hiddenHosts.current = hidden
      setHiddenItems(hidden)
    }
  }, [collapsed, fixed, ref, root.collapsedItems])
  React.useLayoutEffect(() => { measure() })
  React.useLayoutEffect(() => {
    if (!collapsed || fixed || !ref.current) return
    const resize = new ResizeObserver(measure)
    resize.observe(ref.current)
    const mutations = new MutationObserver(measure)
    mutations.observe(ref.current, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-selected", "aria-current"] })
    window.addEventListener("resize", measure)
    return () => {
      resize.disconnect()
      mutations.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [collapsed, fixed, measure, ref])
  const items = React.Children.toArray(children).filter(React.isValidElement)
  const content = items.map((child, i) => {
    const prev = items[i - 1]
    const pos: TopPosition = {
      first: i === 0,
      last: i === items.length - 1,
      belowGroup: !!prev && isGroupElement(prev) && isGroupElement(child),
      top: true,
    }
    return (
      <TopPositionContext.Provider key={child.key ?? i} value={pos}>
        {child}
      </TopPositionContext.Provider>
    )
  })
  const common = {
    "data-sn-list": "",
    "aria-roledescription": collapsed ? root.texts.collapsedListRoleDescription : root.texts.listRoleDescription,
    "aria-label": label,
    onFocus,
    onKeyDown,
  }
  return (
    <ModeContext.Provider value={{ collapsed, inPopover: !!inPopover, fixed }}>
      {collapsed ? (
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          role="menubar"
          aria-orientation="vertical"
          className={cn("fiori-sn__list", className)}
          {...common}
        >
          {content}
          {!fixed && <OverflowItem ref={overflowRef} items={hiddenItems} listRef={ref} />}
        </div>
      ) : (
        <ul ref={ref as React.Ref<HTMLUListElement>} role="tree" className={cn("fiori-sn__list", className)} {...common}>
          {content}
        </ul>
      )}
    </ModeContext.Provider>
  )
}

function isGroupElement(el: React.ReactElement) {
  return el.type === SideNavigationGroup
}

type NavigationKeyEvent = Pick<KeyboardEvent, "key" | "shiftKey" | "altKey" | "ctrlKey" | "metaKey">

function navigationKey(e: NavigationKeyEvent) {
  return ({ Left: "ArrowLeft", Right: "ArrowRight", Up: "ArrowUp", Down: "ArrowDown", Esc: "Escape", Spacebar: " " } as Record<string, string>)[e.key] ?? e.key
}

function hasNavigationModifiers(e: NavigationKeyEvent) {
  return e.shiftKey || e.altKey || e.ctrlKey || e.metaKey
}

// Keys.js isSpace / isEnter{,Shift,Ctrl,Alt}, used by NavigationMenuItem.js and
// SideNavigationSelectableItemBase.js: Space has no modifiers; Enter accepts at most one
// modifier family. getCtrlKey combines Ctrl and Meta, so Ctrl+Meta is still one family.
function isNavigationSpace(e: NavigationKeyEvent) {
  return navigationKey(e) === " " && !hasNavigationModifiers(e)
}

function isNavigationEnter(e: NavigationKeyEvent) {
  return e.key === "Enter" && Number(e.shiftKey) + Number(e.altKey) + Number(e.ctrlKey || e.metaKey) <= 1
}

const navigationKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"]
type OverflowKeyboard = {
  menus: Map<HTMLElement, { close: () => void; inSubmenu: boolean }>
  submenus: Map<HTMLElement, () => void>
  restoringFocus: boolean
  nativeTabFocus: boolean
}

function useOverflowKeyboard() {
  const keyboard = React.useRef<OverflowKeyboard>({ menus: new Map(), submenus: new Map(), restoringFocus: false, nativeTabFocus: false })
  React.useEffect(() => {
    let tabFrame: number | undefined
    // Install while More is closed, before Radix's document Escape listener. UI5's
    // OpenedPopupsRegistry.js _keydownListener closes only plain Escape without preventing
    // its browser default. Capture also blocks inherited typeahead/modified-key handlers
    // without blanket preventDefault; only this overflow's registered surfaces are affected.
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target
      if (!(target instanceof HTMLElement)) return
      const menu = target.closest<HTMLElement>("[data-sn-overflow-menu]")
      const entry = menu && keyboard.current.menus.get(menu)
      if (!menu || !entry) return
      const key = navigationKey(e)
      // NavigationMenuItem/ItemNavigation ignore F6 aliases; do not swallow their document bubble.
      if (isF6NavigationKey(e)) return
      if (key === "Escape") {
        e.stopImmediatePropagation()
        // OpenedPopupsRegistry.js closes the topmost popup even if its owning row has focus.
        if (!hasNavigationModifiers(e)) [...keyboard.current.menus.values()].at(-1)?.close()
        return
      }
      if (key === "Tab" && (e.ctrlKey || e.metaKey || e.altKey)) {
        // Keys.js ignores these combinations. Their native Tab default can still move focus;
        // keep the popups open during that transfer instead of inheriting Radix's dismissal.
        e.stopImmediatePropagation()
        keyboard.current.nativeTabFocus = true
        if (tabFrame !== undefined) cancelAnimationFrame(tabFrame)
        tabFrame = requestAnimationFrame(() => { keyboard.current.nativeTabFocus = false })
        return
      }
      if ((navigationKeys.includes(key) && hasNavigationModifiers(e))
        || (key === "Enter" && !isNavigationEnter(e))
        || (key === " " && !isNavigationSpace(e))
        || (key.length === 1 && key !== " ")) {
        e.stopImmediatePropagation()
        return
      }
      const items = [...menu.querySelectorAll<HTMLElement>("[data-sn-menu-row]")]
        .filter((item) => item.closest("[data-sn-overflow-menu]") === menu)
      const item = target.closest<HTMLElement>("[data-sn-menu-row]")
        ?? target.closest("[data-sn-menu-link]")?.querySelector<HTMLElement>("[data-sn-menu-row]")
      const index = item ? items.indexOf(item) : -1
      if (index < 0) {
        if (navigationKeys.includes(key) || key === "Tab" || key === "Enter" || key === " ") e.stopImmediatePropagation()
        return
      }
      if (key === "Tab") {
        // Menu.js _itemKeyDown prevents root Tab. MenuItem.js _itemKeyDown instead
        // closes only its submenu and leaves Tab's browser default available.
        if (!entry.inSubmenu) e.preventDefault()
        e.stopImmediatePropagation()
        entry.close()
        return
      }
      if (target !== item && key === "Enter" && !hasNavigationModifiers(e)) {
        // Menu.js prevents plain Enter on the item host. Its outer href anchor does not
        // invoke NavigationMenuItem's inner-LI activation handler.
        e.preventDefault()
        e.stopImmediatePropagation()
        return
      }
      const rtl = getComputedStyle(menu).direction === "rtl"
      if (key === (rtl ? "ArrowLeft" : "ArrowRight")) {
        // Menu.js _itemKeyDown opens a parent with the plain opening arrow, without
        // preventing the default. Leaves (and SideNavigation's depth-two rows) do nothing.
        e.stopImmediatePropagation()
        keyboard.current.submenus.get(item!)?.()
        return
      }
      if (key === (rtl ? "ArrowRight" : "ArrowLeft")) {
        e.stopImmediatePropagation()
        if (entry.inSubmenu) entry.close()
        return
      }
      let next = -1
      // ItemNavigation.js _canNavigate requires the item's actual focus DOM. Native href
      // anchors stay separate tab stops; they do not participate in row arrow navigation.
      if (target !== item && navigationKeys.includes(key)) {
        e.stopImmediatePropagation()
        return
      }
      if (key === "ArrowUp") next = Math.max(index - 1, 0)
      else if (key === "ArrowDown") next = Math.min(index + 1, items.length - 1)
      else if (key === "Home") next = 0
      else if (key === "End") next = items.length - 1
      else if (key === "PageUp" || key === "PageDown") {
        // Menu.js _updatePageSize uses visibleCount - 1; nested MenuItem lists retain
        // List.js's ten-row page. ItemNavigation.js clamps and never cycles.
        const visibleCount = Math.round(menu.getBoundingClientRect().height / items[0].offsetHeight)
        const pageSize = entry.inSubmenu ? PAGE_SIZE : visibleCount > 1 ? visibleCount - 1 : null
        next = pageSize === null ? (key === "PageUp" ? 0 : items.length - 1)
          : Math.max(0, Math.min(index + (key === "PageUp" ? -pageSize : pageSize), items.length - 1))
      }
      if (next >= 0) {
        e.preventDefault()
        e.stopImmediatePropagation()
        items[next].focus({ preventScroll: true })
      }
    }
    document.addEventListener("keydown", onKeyDown, true)
    return () => {
      document.removeEventListener("keydown", onKeyDown, true)
      if (tabFrame !== undefined) cancelAnimationFrame(tabFrame)
      keyboard.current.nativeTabFocus = false
    }
  }, [])
  return keyboard
}

function OverflowFocusBoundary() {
  return <div role="none" tabIndex={0} data-sn-focus-boundary="" className="fixed" onFocus={(e) => {
    // ListTemplate.js renders tabbable before/after dummies. List.js _onfocusin forwards
    // either boundary to its first focusable row when no Tab-forwarded previous row exists.
    e.stopPropagation()
    e.currentTarget.closest("[data-sn-overflow-menu]")?.querySelector<HTMLElement>("[data-sn-menu-row]")?.focus({ preventScroll: true })
  }} />
}

function OverflowLink({ item, children }: { item: SideNavigationItemProps; children: React.ReactElement }) {
  // NavigationMenuItemTemplate.js keeps a naturally tabbable href anchor outside its
  // roving LI. The LI still owns Enter/Space activation; native pointer navigation runs once.
  // NavigationMenuItem.css.js leaves the anchor's UA focus outline in the normal browser
  // scheme. Neutralize fiori.css's global dark scheme for that native outline only.
  return item.href && !item.disabled
    ? <a role="menuitem" data-sn-menu-link="" href={item.href} target={item.target} className="[color-scheme:normal] text-inherit no-underline">{children}</a>
    : children
}

function OverflowItem({ ref, items, listRef }: {
  ref: React.Ref<HTMLDivElement>
  items: HTMLElement[]
  listRef: React.RefObject<HTMLElement | null>
}) {
  const root = useRoot()
  const [open, setOpen] = React.useState(false)
  const [direction, setDirection] = React.useState<"ltr" | "rtl">("ltr")
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const [menuItems, setMenuItems] = React.useState<SideNavigationItemProps[]>([])
  const selectedFromMenu = React.useRef(false)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const keyboard = useOverflowKeyboard()
  const setMenuRef = React.useCallback((node: HTMLDivElement | null) => {
    if (menuRef.current) keyboard.current.menus.delete(menuRef.current)
    menuRef.current = node
    if (node) keyboard.current.menus.set(node, { close: () => setOpen(false), inSubmenu: false })
  }, [keyboard])
  const id = React.useId()
  const changeOpen = (next: boolean) => {
    if (next) {
      // NavigationMenu inherits its owning SideNavigation's effective direction.
      setDirection(getComputedStyle(triggerRef.current!).direction === "rtl" ? "rtl" : "ltr")
      root.setPopoverKey(null)
      selectedFromMenu.current = false
      setMenuItems(items.map((host) => root.collapsedItems.current.get(host)).filter((item): item is SideNavigationItemProps => !!item))
    }
    setOpen(next)
  }
  // Menu.js _afterPopoverOpen focuses _allMenuItems[0], including disabled items.
  // Override Menu's normal enabled-first focus without changing the shared Menu component.
  const initialFocus = { onOpenAutoFocus: (e: Event) => {
    e.preventDefault()
    menuRef.current?.querySelector<HTMLElement>("[data-sn-menu-row]")?.focus({ preventScroll: true })
  } }
  React.useEffect(() => {
    if (!items.length) setOpen(false)
  }, [items.length])
  return (
    <div ref={ref} role="none" data-kind="item" data-sn-overflow="" className="fiori-sn-host fiori-sn-overflow">
      <Menu open={open} onOpenChange={changeOpen} modal={false} dir={direction}>
        <MenuTrigger asChild>
          <div
            ref={triggerRef}
            data-slot="side-navigation-overflow"
            data-sn-nav=""
            data-level="1"
            data-has-icon=""
            data-active={open ? "" : undefined}
            role="menuitem"
            tabIndex={-1}
            aria-label={root.texts.overflowDescription}
            aria-labelledby={`${id}-text`}
            aria-haspopup="menu"
            aria-expanded={open}
            title={root.texts.overflowText}
            className="fiori-sn-item"
            onPointerDown={(e) => {
              // SideNavigationItemTemplate.js wires click to _onclick, not pointerdown.
              // Keep native pointer focus while blocking Radix's premature opening/toggling.
              if (e.button === 0) {
                e.preventDefault()
                e.currentTarget.focus({ preventScroll: true })
              }
            }}
            onClick={(e) => {
              // SideNavigationSelectableItemBase.js _activate stops propagation and opens More.
              e.stopPropagation()
              changeOpen(true)
            }}
            onKeyDownCapture={(e) => {
              // Keys.js: modified navigation and unsupported activation keys are ignored.
              // Stop before Radix Trigger's raw key handlers while retaining browser defaults.
              const key = navigationKey(e)
              // The MenuTrigger host filters Radix's raw opener; retain the native event unchanged.
              if (isF6NavigationKey(e)) return
              if ((navigationKeys.includes(key) && hasNavigationModifiers(e))
                || (key === " " && !isNavigationSpace(e))
                || (key === "Enter" && !isNavigationEnter(e))) e.stopPropagation()
            }}
            onKeyDown={(e) => {
              // SideNavigationSelectableItemBase.js _onkeydown does not open More on Down.
              // Own activation so Radix's raw key match cannot open for unsupported modifiers.
              const key = navigationKey(e)
              if (isF6NavigationKey(e)) return
              if (key === "ArrowDown" || key === " " || key === "ArrowLeft" || key === "ArrowRight") e.preventDefault()
              if (e.key === "Enter") {
                if (isNavigationEnter(e)) changeOpen(true)
                e.preventDefault()
              }
            }}
            onKeyUp={(e) => {
              if (isNavigationSpace(e)) {
                changeOpen(true)
                e.preventDefault()
              }
            }}
          >
            <SnIcon icon={overflow} className="fiori-sn-item__icon" />
            <div id={`${id}-text`} className="fiori-sn-item__text">{root.texts.overflowText}</div>
          </div>
        </MenuTrigger>
        <MenuContent ref={setMenuRef} data-sn-overflow-menu="" side="right" align="center" aria-label={root.texts.overflowMenuLabel} aria-labelledby={undefined} className="fiori-sn-menu" {...initialFocus}
          onFocusOutside={(e) => {
            // Nested Tab keeps its browser default while MenuItem.js restores its parent
            // after rendering. Do not dismiss the root during that transient focus transfer.
            if (keyboard.current.restoringFocus || keyboard.current.nativeTabFocus) e.preventDefault()
          }}
          onCloseAutoFocus={(e) => {
            // SideNavigation.js _onMenuClose: after selection focus the newly visible selected
            // parent, rather than restoring focus to More. Escape restores the trigger normally.
            if (!selectedFromMenu.current) return
            e.preventDefault()
            if (listRef.current) listItems(listRef.current).find((item) => item.getAttribute("aria-current") === "page")?.focus({ preventScroll: true })
          }}>
          <OverflowFocusBoundary />
          {/* ListTemplate.js/List.css.js wrap rows in an overflow:auto scroll container,
              which also clips the outer href anchor's native focus outline. */}
          <MenuGroup className="overflow-auto">
            {menuItems.map((item, i) => <OverflowMenuItem key={i} item={item} keyboard={keyboard} onSelected={() => { selectedFromMenu.current = true }} close={() => setOpen(false)} />)}
          </MenuGroup>
          <OverflowFocusBoundary />
        </MenuContent>
      </Menu>
    </div>
  )
}

function OverflowMenuItem({ item, keyboard, onSelected, close, parentRow = false, inSubmenu = false }: {
  item: SideNavigationItemProps
  keyboard: React.RefObject<OverflowKeyboard>
  onSelected: () => void
  close: () => void
  parentRow?: boolean
  inSubmenu?: boolean
}) {
  const root = useRoot()
  const subs = subItemProps(item.children)
  const hasSubmenu = subs.length > 0 && !parentRow
  const [submenuOpen, setSubmenuOpen] = React.useState(false)
  const focusSubmenuOnMount = React.useRef(false)
  const restoreSubmenuFocus = React.useRef(false)
  const submenuTrigger = React.useRef<HTMLDivElement>(null)
  const submenuElement = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    if (submenuOpen) {
      restoreSubmenuFocus.current = false
      keyboard.current.restoringFocus = false
      return
    }
    if (!restoreSubmenuFocus.current) return
    // MenuItem.js focus awaits renderFinished: use the frame after the closed render so
    // nested Tab's native default finishes before final focus returns to the owning parent.
    const frame = requestAnimationFrame(() => {
      restoreSubmenuFocus.current = false
      submenuTrigger.current?.focus({ preventScroll: true })
      keyboard.current.restoringFocus = false
    })
    return () => {
      cancelAnimationFrame(frame)
      keyboard.current.restoringFocus = false
    }
  }, [keyboard, submenuOpen])
  const triggerRef = React.useCallback((node: HTMLDivElement | null) => {
    if (submenuTrigger.current) keyboard.current.submenus.delete(submenuTrigger.current)
    submenuTrigger.current = node
    if (node) keyboard.current.submenus.set(node, () => {
      focusSubmenuOnMount.current = !submenuOpen
      setSubmenuOpen(true)
    })
  }, [keyboard, submenuOpen])
  const submenuRef = React.useCallback((node: HTMLDivElement | null) => {
    if (submenuElement.current) keyboard.current.menus.delete(submenuElement.current)
    submenuElement.current = node
    if (node) keyboard.current.menus.set(node, { close: () => {
      restoreSubmenuFocus.current = true
      keyboard.current.restoringFocus = true
      setSubmenuOpen(false)
    }, inSubmenu: true })
    // MenuItem.js _afterPopoverOpen focuses the first row for explicit activation.
    if (node && focusSubmenuOnMount.current) {
      focusSubmenuOnMount.current = false
      node.querySelector<HTMLElement>("[data-sn-menu-row]")?.focus({ preventScroll: true })
    }
  }, [keyboard])
  const descriptionId = React.useId()
  const activate = (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
    e.stopPropagation()
    if (item.disabled) {
      e.preventDefault()
      return
    }
    item.onClick?.(e)
    root.itemClick(item.value, e)
    // NavigationMenuItem.js _activate fires click before opening a submenu, even when click is canceled.
    if (hasSubmenu) {
      focusSubmenuOnMount.current = !submenuOpen
      setSubmenuOpen(true)
    }
    else {
      if (!e.defaultPrevented) {
        if (!item.unselectable && item.value !== undefined) {
          onSelected()
          root.select(item.value)
        }
      }
      close()
    }
    // NavigationMenuItem.js _onkeyup explicitly clicks the enclosing anchor for plain Space.
    // Enter activates the focused native-li without clicking its ancestor anchor. Pointer
    // clicks use the native wrapper's default action, including modifiers and cancellation.
    if (item.href && !e.defaultPrevented && "key" in e && isNavigationSpace(e)) {
      e.currentTarget.closest("[data-sn-menu-link]")?.dispatchEvent(new MouseEvent("click", { cancelable: true }))
    }
  }
  const common = {
    // Menu.js _navigatableMenuItems includes disabled rows. Keep the Radix collection enabled
    // for focus and navigation, expose the disabled state, and block only activation below.
    disabled: false,
    "data-sn-menu-row": "",
    "data-disabled": item.disabled ? "" : undefined,
    "aria-disabled": item.disabled || undefined,
    "aria-label": item.accessibleName,
    title: item.tooltip,
    icon: parentRow ? undefined : item.icon,
    // NavigationMenuItem.css.js uses 1rem real icons and .75rem submenu arrows. Normal
    // descendant utilities take precedence over Menu/Icon's generic size utilities.
    className: cn("fiori-sn-menu-item [&>div>svg]:size-4 [&>div>div>svg]:size-3", parentRow && "fiori-sn-menu-parent", item.design === "action" && "fiori-sn-menu-action"),
    // NavigationMenuTemplate.js does not wire mouseover on the root list: neither focus nor
    // submenus change on hover. Nested lists do wire MenuItem.js _itemMouseOver, which focuses
    // their rows. Neither list wires mouseout: leaving a row keeps focus until another action.
    // Block Radix's root hover opening/focus and its pointerleave focus transfer at both levels.
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      if (!inSubmenu) e.preventDefault()
    },
    onPointerLeave: (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
      // NavigationMenuItem.js activates Space on keyup, while Enter activates on keydown.
      if (e.key === " " || e.key === "Spacebar") e.preventDefault()
      if (e.key === "Enter") {
        if (isNavigationEnter(e)) activate(e)
        // Process the original event before preventing Radix's default; callbacks may cancel it.
        // Owning leaf activation also retains modifiers that Radix's synthetic click would lose.
        e.preventDefault()
        e.stopPropagation()
      }
    },
    onKeyUp: (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (isNavigationSpace(e)) {
        activate(e)
        e.preventDefault()
      }
    },
  }
  // SideNavigationPopoverTemplate.js renderMenuItem duplicates a selectable parent's own
  // navigation action at the beginning of its submenu, before its sub-items.
  if (hasSubmenu) return (
    <MenuSub open={submenuOpen} onOpenChange={setSubmenuOpen}>
      <OverflowLink item={item}><MenuSubTrigger ref={triggerRef} {...common} onClick={activate} aria-describedby={!item.unselectable ? descriptionId : undefined}>
        {item.text}{item.tag && <span className="fiori-sn-menu-tag">{item.tag}</span>}
      </MenuSubTrigger></OverflowLink>
      {!item.unselectable && <span id={descriptionId} className="fiori-sn-hidden-text">{root.texts.overflowParentDescription}</span>}
      <MenuSubContent ref={submenuRef} data-sn-overflow-menu="" aria-label={item.accessibleName || item.text} aria-labelledby={undefined} className="fiori-sn-menu"
        onFocusOutside={(e) => {
          if (keyboard.current.nativeTabFocus) e.preventDefault()
        }}>
        <OverflowFocusBoundary />
        <MenuGroup className="overflow-auto">
          {!item.unselectable && <OverflowMenuItem item={item} keyboard={keyboard} parentRow inSubmenu onSelected={onSelected} close={close} />}
          {subs.map((sub, i) => <OverflowMenuItem key={i} item={{ ...sub, disabled: item.disabled || sub.disabled }} keyboard={keyboard} inSubmenu onSelected={onSelected} close={close} />)}
        </MenuGroup>
        <OverflowFocusBoundary />
      </MenuSubContent>
    </MenuSub>
  )
  return (
    <OverflowLink item={item}><MenuItem {...common}
      onClick={activate}
      additionalText={item.href && item.target === "_blank" ? <SnIcon icon={arrowRight} className="fiori-sn-menu-external" /> : undefined}
      onSelect={(e) => {
        // NavigationMenuItem.js _activate owns selection/closing for clicks and accepted keys.
        e.preventDefault()
      }}>
      {item.text}{item.tag && <span className="fiori-sn-menu-tag">{item.tag}</span>}
    </MenuItem></OverflowLink>
  )
}

// ---------------------------------------------------------------------------------------------

type SideNavigationProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  /** Collapsed mode: icons only, sub-items in a popover. Defaults to the enclosing NavigationLayout's state. */
  collapsed?: boolean
  /** Value of the selected item (controlled). */
  value?: string
  defaultValue?: string
  /** Fired when the user selects another item. */
  onValueChange?: (value: string) => void
  /** Fired on every item click / activation (also for unselectable and already selected items). */
  onItemClick?: (value: string | undefined) => void
  /** Fired when an item or group is expanded or collapsed. */
  onItemToggle?: (value: string | undefined, expanded: boolean) => void
  /** Items pinned to the bottom (UI5 `fixedItems` slot), separated by a line. */
  fixedItems?: React.ReactNode
  /** Content above the items, shown only when expanded (UI5 `header` slot). */
  header?: React.ReactNode
  /** Accessible name of the <nav>. */
  accessibleName?: string
  texts?: Partial<SideNavigationTexts>
}

function SideNavigation({
  collapsed: collapsedProp,
  value: valueProp,
  defaultValue,
  onValueChange,
  onItemClick,
  onItemToggle,
  fixedItems,
  header,
  accessibleName,
  texts: textsProp,
  className,
  children,
  ...props
}: SideNavigationProps) {
  const layout = React.useContext(SideNavigationLayoutContext)
  const collapsed = collapsedProp ?? layout?.collapsed ?? false
  const [inner, setInner] = React.useState(defaultValue)
  const selected = valueProp !== undefined ? valueProp : inner
  const [popoverKey, setPopoverKey] = React.useState<string | null>(null)
  const collapsedItems = React.useRef(new WeakMap<HTMLElement, SideNavigationItemProps>())
  const texts = useFioriTexts(defaultTexts, defaultTextsKeys, textsProp)

  // Collapsing / expanding animates the width (UI5 .ui5-sn-animating keeps the lists at full width meanwhile).
  const [animating, setAnimating] = React.useState(false)
  const prevCollapsed = React.useRef(collapsed)
  React.useEffect(() => {
    if (prevCollapsed.current === collapsed) return
    prevCollapsed.current = collapsed
    setAnimating(true)
    const t = setTimeout(() => setAnimating(false), 500)
    return () => clearTimeout(t)
  }, [collapsed])
  React.useEffect(() => {
    if (!collapsed) setPopoverKey(null)
  }, [collapsed])

  const root = React.useMemo<RootContextValue>(
    () => ({
      collapsed,
      selected,
      texts,
      select: (v) => {
        if (v === selected) return
        if (valueProp === undefined) setInner(v)
        onValueChange?.(v)
      },
      itemClick: (v) => {
        onItemClick?.(v)
        layout?.onItemClick?.()
      },
      popoverKey,
      setPopoverKey,
      collapsedItems,
      toggle: (v, expanded) => onItemToggle?.(v, expanded),
    }),
    [collapsed, selected, texts, valueProp, onValueChange, onItemClick, onItemToggle, layout, popoverKey]
  )

  const hasFixed = React.Children.toArray(fixedItems).length > 0
  return (
    <RootContext.Provider value={root}>
      <div
        data-slot="side-navigation" data-sap-ui-fastnavgroup="true"
        data-collapsed={collapsed ? "" : undefined}
        className={cn("fiori-sn", className)}
        {...props}
      >
        <nav
          aria-label={accessibleName}
          className="fiori-sn__root"
          data-collapsed={collapsed ? "" : undefined}
          data-animating={animating ? "" : undefined}
          onTransitionEnd={(e) => {
            if (e.propertyName === "width" || e.propertyName === "min-width") setAnimating(false)
          }}
        >
          {header && !collapsed && header}
          <NavList fixed={false} collapsed={collapsed} label={texts.primaryListLabel} className="fiori-sn__list--flexible">
            {children}
          </NavList>
          {hasFixed && (
            <>
              <div role="separator" className="fiori-sn__spacer" />
              <NavList fixed collapsed={collapsed} label={texts.fixedListLabel} className="fiori-sn__list--fixed">
                {fixedItems}
              </NavList>
            </>
          )}
        </nav>
      </div>
    </RootContext.Provider>
  )
}

// ---------------------------------------------------------------------------------------------

type ExpandableState = {
  expanded?: boolean
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
}

function useExpanded({ expanded: prop, defaultExpanded = false, onExpandedChange }: ExpandableState, value: string | undefined) {
  const root = useRoot()
  const [inner, setInner] = React.useState(defaultExpanded)
  const expanded = prop ?? inner
  const set = (next: boolean) => {
    if (next === expanded) return
    if (prop === undefined) setInner(next)
    onExpandedChange?.(next)
    root.toggle(value, next)
  }
  return [expanded, set] as const
}

type SideNavigationGroupProps = Omit<React.ComponentProps<"li">, "children"> &
  ExpandableState & {
    text: string
    /** Disables the group and every item in it. */
    disabled?: boolean
    tooltip?: string
    accessibleName?: string
    /** Optional value reported by onItemToggle. */
    value?: string
    children?: React.ReactNode
  }

/** ui5-side-navigation-group: a collapsible titled section of items (no title in collapsed mode). */
function SideNavigationGroup({
  text,
  disabled,
  tooltip,
  accessibleName,
  value,
  expanded: expandedProp,
  defaultExpanded,
  onExpandedChange,
  className,
  children,
  ...props
}: SideNavigationGroupProps) {
  const root = useRoot()
  const mode = React.useContext(ModeContext)
  const pos = React.useContext(TopPositionContext)
  const [expanded, setExpanded] = useExpanded({ expanded: expandedProp, defaultExpanded, onExpandedChange }, value)
  const groupId = React.useId()
  const hasItems = React.Children.toArray(children).length > 0
  const hostAttrs = {
    "data-kind": "group",
    "data-first": pos.first ? "" : undefined,
    "data-last": pos.last ? "" : undefined,
    "data-below-group": pos.belowGroup ? "" : undefined,
  }
  const items = (
    <ParentDisabledContext.Provider value={!!disabled}>
      <TopPositionContext.Provider value={{ first: false, last: false, belowGroup: false, top: false }}>
        {children}
      </TopPositionContext.Provider>
    </ParentDisabledContext.Provider>
  )

  if (mode.collapsed) {
    return (
      <div role="none" className={cn("fiori-sn-host", className)} {...hostAttrs}>
        <div aria-hidden className="fiori-sn-sep" />
        {items}
        <div aria-hidden className="fiori-sn-sep" />
      </div>
    )
  }

  const toggle = (next: boolean) => {
    if (!disabled) setExpanded(next)
  }
  return (
    <li role="none" className={cn("fiori-sn-host", className)} {...hostAttrs} {...props}>
      <div aria-hidden className="fiori-sn-sep" />
      <div
        data-slot="side-navigation-group"
        data-sn-nav=""
        data-group=""
        data-disabled={disabled ? "" : undefined}
        role="treeitem"
        tabIndex={-1}
        aria-expanded={hasItems ? expanded : undefined}
        aria-label={accessibleName}
        aria-labelledby={accessibleName ? undefined : `${groupId}-text`}
        aria-owns={hasItems && expanded ? groupId : undefined}
        title={tooltip}
        className="fiori-sn-item"
        onClick={() => toggle(!expanded)}
        onKeyDown={(e) => {
          if (disabled || e.target !== e.currentTarget) return
          const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
          if (e.key === " ") e.preventDefault()
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault()
            toggle((e.key === "ArrowRight") !== rtl)
          } else if (e.key === "-") {
            e.preventDefault()
            toggle(false)
          } else if (e.key === "+") {
            e.preventDefault()
            toggle(true)
          }
        }}
      >
        <div id={`${groupId}-text`} className="fiori-sn-item__text">
          {text}
        </div>
        {hasItems && (
          <SnIcon
            icon={expanded ? navigationDownArrow : navigationRightArrow}
            className="fiori-sn-item__toggle"
            label={expanded ? root.texts.collapseText : root.texts.expandText}
          />
        )}
      </div>
      {hasItems && expanded && (
        <ul id={groupId} role="group" aria-label={accessibleName || text} className="fiori-sn-item-ul">
          {items}
        </ul>
      )}
      <div aria-hidden className="fiori-sn-sep" />
    </li>
  )
}

// ---------------------------------------------------------------------------------------------

type SelectableItemProps = {
  /** Identifies the item for selection (SideNavigation `value`). */
  value?: string
  text: string
  icon?: FioriIconData
  /** Renders the item as a link. */
  href?: string
  target?: string
  disabled?: boolean
  /** The item can't be selected (e.g. it only groups its sub-items). */
  unselectable?: boolean
  design?: ItemDesign
  tooltip?: string
  accessibleName?: string
  /** Content shown after the text, e.g. a <Tag> (UI5 `tag` slot). */
  tag?: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => void
  className?: string
}

type SideNavigationItemProps = SelectableItemProps &
  ExpandableState & {
    /** <SideNavigationSubItem> children. */
    children?: React.ReactNode
  }

function subItemProps(children: React.ReactNode): SelectableItemProps[] {
  return React.Children.toArray(children)
    .filter(React.isValidElement)
    .map((c) => c.props as SelectableItemProps)
}

/**
 * Shared behaviour of items and sub-items: click / Enter / Space activation, selection, link handling.
 * `onActivate` handles the collapsed-mode popover for items with sub-items.
 */
function useActivation({
  value,
  disabled,
  unselectable,
  href,
  onClick,
  open,
}: {
  value?: string
  disabled: boolean
  unselectable?: boolean
  href?: string
  onClick?: SelectableItemProps["onClick"]
  /** Opens the sub-item popover (collapsed mode, item with sub-items); returns true when it did. */
  open?: () => boolean
}) {
  const root = useRoot()
  const mode = React.useContext(ModeContext)

  const activate = (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
    e.stopPropagation()
    if (mode.inPopover) {
      if (disabled) {
        e.preventDefault()
        return
      }
      if (unselectable) return
      onClick?.(e)
      root.itemClick(value, e)
      if (e.defaultPrevented) return
      if (value !== undefined) root.select(value)
      mode.closePopover?.()
      return
    }
    root.itemClick(value, e)
    if (disabled) {
      e.preventDefault()
      return
    }
    if (open?.()) {
      e.preventDefault()
      return
    }
    onClick?.(e)
    if (e.defaultPrevented) return
    if (!unselectable && value !== undefined) root.select(value)
  }

  return {
    onClick: (e: React.MouseEvent<HTMLElement>) => activate(e),
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === " ") e.preventDefault()
      // A link activates through its native click on Enter.
      if (e.key === "Enter" && !href) {
        if (!unselectable) activate(e)
        e.preventDefault()
      }
    },
    onKeyUp: (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key !== " ") return
      if (href && !disabled) e.currentTarget.click()
      else activate(e)
    },
  }
}

/** ui5-side-navigation-item: a top-level item, optionally with <SideNavigationSubItem> children. */
function SideNavigationItem(props: SideNavigationItemProps) {
  const mode = React.useContext(ModeContext)
  if (mode.collapsed) return <CollapsedItem {...props} />
  return <TreeItem {...props} />
}

function TreeItem({
  value,
  text,
  icon,
  href,
  target,
  disabled: disabledProp,
  unselectable,
  design = "default",
  tooltip,
  accessibleName,
  tag,
  onClick,
  expanded: expandedProp,
  defaultExpanded,
  onExpandedChange,
  className,
  children,
}: SideNavigationItemProps) {
  const root = useRoot()
  const mode = React.useContext(ModeContext)
  const pos = React.useContext(TopPositionContext)
  const disabled = !!disabledProp || React.useContext(ParentDisabledContext)
  const [expandedState, setExpanded] = useExpanded({ expanded: expandedProp, defaultExpanded, onExpandedChange }, value)
  // In the popover the item is always shown expanded, without a toggle.
  const expanded = mode.inPopover || expandedState
  const subs = subItemProps(children)
  const hasSubs = subs.length > 0
  const id = React.useId()
  const childSelected = subs.some((s) => s.value !== undefined && s.value === root.selected)
  const isSelected = value !== undefined && value === root.selected
  const shownSelected = isSelected || (!expanded && childSelected)
  const effectiveHref = !disabled && href ? href : undefined
  const external = !!href && target === "_blank"
  const activation = useActivation({ value, disabled, unselectable, href: effectiveHref, onClick })
  const describe = !disabled && hasSubs && !unselectable && !mode.inPopover
  const describedBy = [tag ? `${id}-tag` : "", describe ? `${id}-desc` : ""].filter(Boolean).join(" ") || undefined
  // In the popover an unselectable parent is just a heading: not focusable, sub-items take focus.
  const popoverHeading = mode.inPopover && unselectable && hasSubs

  const toggle = (next: boolean) => {
    if (hasSubs && !disabled) setExpanded(next)
  }

  const Tag = effectiveHref ? "a" : "div"
  return (
    <li
      role="none"
      className={cn("fiori-sn-host", className)}
      data-kind="item"
      data-design={design}
      data-unselectable={unselectable ? "" : undefined}
      data-fixed={mode.fixed && pos.top ? "" : undefined}
      data-popover-unselectable={mode.inPopover && unselectable ? "" : undefined}
    >
      <Tag
        data-slot="side-navigation-item"
        data-sn-nav=""
        data-sn-unfocusable={popoverHeading ? "" : undefined}
        data-level="1"
        data-has-icon={icon ? "" : undefined}
        data-selected={shownSelected && !disabled ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        data-expander={!disabled && hasSubs ? "" : undefined}
        role="treeitem"
        tabIndex={popoverHeading ? undefined : -1}
        aria-current={isSelected ? "page" : undefined}
        aria-disabled={disabled || undefined}
        aria-expanded={hasSubs && !mode.inPopover ? expanded : hasSubs ? true : undefined}
        aria-owns={hasSubs && expanded ? `${id}-group` : undefined}
        aria-label={accessibleName}
        aria-labelledby={accessibleName ? undefined : `${id}-text`}
        aria-describedby={describedBy}
        title={tooltip}
        href={effectiveHref}
        target={effectiveHref ? target : undefined}
        className="fiori-sn-item"
        onClick={(e: React.MouseEvent<HTMLElement>) => {
          if (!mode.inPopover && unselectable) toggle(!expanded)
          activation.onClick(e)
        }}
        onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
          if (e.target !== e.currentTarget || disabled) {
            if (e.key === " ") e.preventDefault()
            return
          }
          if (!mode.inPopover) {
            const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault()
              toggle((e.key === "ArrowRight") !== rtl)
              return
            }
            if (e.key === "-" || e.key === "+") {
              e.preventDefault()
              toggle(e.key === "+")
              return
            }
          } else if (e.key === (getComputedStyle(e.currentTarget).direction === "rtl" ? "ArrowRight" : "ArrowLeft")) {
            e.preventDefault()
            mode.closePopover?.()
            return
          }
          activation.onKeyDown(e)
        }}
        onKeyUp={(e: React.KeyboardEvent<HTMLElement>) => {
          if (e.target === e.currentTarget) activation.onKeyUp(e)
        }}
      >
        {icon && <SnIcon icon={icon} className="fiori-sn-item__icon" />}
        <div id={`${id}-text`} className="fiori-sn-item__text">
          {text}
        </div>
        {tag && (
          <div id={`${id}-tag`} className="fiori-sn-item__tag">
            {tag}
          </div>
        )}
        {hasSubs && !mode.inPopover && (
          <SnIcon
            icon={expanded ? navigationDownArrow : navigationRightArrow}
            className="fiori-sn-item__toggle"
            label={expanded ? root.texts.collapseText : root.texts.expandText}
            onClick={(e) => {
              e.stopPropagation()
              toggle(!expanded)
            }}
          />
        )}
        {external && <SnIcon icon={arrowRight} className="fiori-sn-item__ext" />}
      </Tag>
      {hasSubs && expanded && (
        <ul id={`${id}-group`} role="group" aria-label={accessibleName || text} className="fiori-sn-item-ul">
          <ParentDisabledContext.Provider value={disabled}>
            <TopPositionContext.Provider value={{ first: false, last: false, belowGroup: false, top: false }}>
              {children}
            </TopPositionContext.Provider>
          </ParentDisabledContext.Provider>
        </ul>
      )}
      {describe && (
        <span id={`${id}-desc`} className="fiori-sn-hidden-text">
          {root.texts.parentItemDescription(text)}
        </span>
      )}
    </li>
  )
}

function CollapsedItem(props: SideNavigationItemProps) {
  const {
    value,
    text,
    icon,
    href,
    target,
    disabled: disabledProp,
    unselectable,
    design = "default",
    tooltip,
    accessibleName,
    tag,
    onClick,
    className,
    children,
  } = props
  const root = useRoot()
  const mode = React.useContext(ModeContext)
  const pos = React.useContext(TopPositionContext)
  const disabled = !!disabledProp || React.useContext(ParentDisabledContext)
  const subs = subItemProps(children)
  const hasSubs = subs.length > 0
  const key = React.useId()
  const anchorRef = React.useRef<HTMLElement | null>(null)
  const hostRef = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    if (hostRef.current) root.collapsedItems.current.set(hostRef.current, { ...props, disabled })
  })
  const popoverTreeRef = React.useRef<HTMLDivElement>(null)
  const isSelected = value !== undefined && value === root.selected
  const shownSelected = isSelected || subs.some((s) => s.value !== undefined && s.value === root.selected)
  const open = root.popoverKey === key
  // UI5 "no hover effect": after a selection, a selected item stops expanding on hover until re-entered.
  const [noHover, setNoHover] = React.useState(false)
  const effectiveHref = !disabled && href ? href : undefined
  const smallScreen = () => typeof window !== "undefined" && window.innerWidth < 600

  const activation = useActivation({
    value,
    disabled,
    unselectable,
    href: effectiveHref,
    onClick,
    open: () => {
      if (!hasSubs || smallScreen()) return false
      root.setPopoverKey(key)
      return true
    },
  })

  const closePopover = React.useCallback(() => root.setPopoverKey(null), [root])
  const Tag = effectiveHref ? "a" : "div"
  return (
    <div
      ref={hostRef}
      role="none"
      className={cn("fiori-sn-host", className)}
      data-kind="item"
      data-design={design}
      data-unselectable={unselectable ? "" : undefined}
      data-fixed={mode.fixed && pos.top ? "" : undefined}
    >
      <Tag
        ref={anchorRef as React.Ref<never>}
        data-slot="side-navigation-item"
        data-sn-nav=""
        data-level="1"
        data-has-icon=""
        data-selected={shownSelected && !disabled ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        data-expander={!disabled && hasSubs ? "" : undefined}
        data-active={open ? "" : undefined}
        data-no-hover={noHover ? "" : undefined}
        role={unselectable ? "menuitem" : "menuitemradio"}
        tabIndex={-1}
        aria-checked={unselectable ? undefined : shownSelected}
        aria-current={shownSelected ? "page" : undefined}
        aria-disabled={disabled || undefined}
        aria-haspopup={!disabled && hasSubs ? "tree" : undefined}
        aria-expanded={!disabled && hasSubs ? open : undefined}
        aria-label={accessibleName}
        aria-labelledby={accessibleName ? undefined : `${key}-text`}
        aria-describedby={tag ? `${key}-tag` : undefined}
        title={tooltip}
        href={effectiveHref}
        target={effectiveHref ? target : undefined}
        className="fiori-sn-item"
        onClick={activation.onClick}
        onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
          if (e.target !== e.currentTarget) return
          const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault()
            if ((e.key === "ArrowRight") !== rtl && hasSubs && !disabled) activation.onClick(e as never)
            return
          }
          activation.onKeyDown(e)
        }}
        onKeyUp={(e: React.KeyboardEvent<HTMLElement>) => {
          if (e.target === e.currentTarget) activation.onKeyUp(e)
        }}
        onMouseEnter={() => setNoHover(false)}
        onMouseLeave={() => setNoHover(shownSelected)}
        onBlur={() => setNoHover(false)}
      >
        <SnIcon icon={icon ?? navigationRightArrow} className={cn("fiori-sn-item__icon", !icon && "invisible")} />
        <div id={`${key}-text`} className="fiori-sn-item__text">
          {text}
        </div>
        {tag && (
          <div id={`${key}-tag`} className="fiori-sn-item__tag">
            {tag}
          </div>
        )}
        {hasSubs && <SnIcon icon={navigationRightArrow} className="fiori-sn-item__toggle" />}
      </Tag>
      {hasSubs && (
        <Popover open={open} onOpenChange={(o) => root.setPopoverKey(o ? key : null)}>
          <PopoverAnchor virtualRef={anchorRef as React.RefObject<HTMLElement>} />
          <PopoverContent
            side="right"
            align="start"
            hideArrow
            aria-label={root.texts.popoverLabel}
            className="fiori-sn-popover"
            onOpenAutoFocus={(e) => {
              e.preventDefault()
              const items = popoverTreeRef.current ? listItems(popoverTreeRef.current.querySelector("[data-sn-list]")!) : []
              const focusable = items.filter((i) => !i.hasAttribute("data-sn-unfocusable"))
              ;(focusable.find((i) => i.hasAttribute("data-selected") || i.getAttribute("aria-current") === "page") ?? focusable[0])?.focus()
            }}
            onCloseAutoFocus={(e) => {
              e.preventDefault()
              setNoHover(true)
              anchorRef.current?.focus()
            }}
          >
            {/* SideNavigationPopoverTemplate.js renders a nested SideNavigation (fastNavigation metadata). */}
            <div ref={popoverTreeRef} className="fiori-sn fiori-sn--popover" data-in-popover="" data-sap-ui-fastnavgroup="true">
              <div className="fiori-sn__root" role="none">
                <PopoverModeProvider closePopover={closePopover}>
                  <SideNavigationItem {...props} icon={undefined} expanded defaultExpanded onExpandedChange={undefined} />
                </PopoverModeProvider>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

/** The tree inside the collapsed-mode popover (UI5 renders a nested ui5-side-navigation with in-popover). */
function PopoverModeProvider({ closePopover, children }: { closePopover: () => void; children: React.ReactNode }) {
  const root = useRoot()
  const { ref, onFocus, onKeyDown } = useRovingList()
  return (
    <ModeContext.Provider value={{ collapsed: false, inPopover: true, fixed: false, closePopover }}>
      <ul
        ref={ref as React.Ref<HTMLUListElement>}
        data-sn-list=""
        role="tree"
        aria-roledescription={root.texts.listRoleDescription}
        className="fiori-sn__list fiori-sn__list--flexible"
        onFocus={onFocus}
        onKeyDown={onKeyDown}
      >
        <TopPositionContext.Provider value={{ first: true, last: true, belowGroup: false, top: true }}>{children}</TopPositionContext.Provider>
      </ul>
    </ModeContext.Provider>
  )
}

type SideNavigationSubItemProps = SelectableItemProps

/** ui5-side-navigation-sub-item: a child of a SideNavigationItem. */
function SideNavigationSubItem({
  value,
  text,
  icon,
  href,
  target,
  disabled: disabledProp,
  unselectable,
  design = "default",
  tooltip,
  accessibleName,
  tag,
  onClick,
  className,
}: SideNavigationSubItemProps) {
  const root = useRoot()
  const mode = React.useContext(ModeContext)
  const disabled = !!disabledProp || React.useContext(ParentDisabledContext)
  const id = React.useId()
  const isSelected = value !== undefined && value === root.selected
  const effectiveHref = !disabled && href ? href : undefined
  const external = !!href && target === "_blank"
  const activation = useActivation({ value, disabled, unselectable, href: effectiveHref, onClick })
  const Tag = effectiveHref ? "a" : "div"
  return (
    <li
      role="none"
      className={cn("fiori-sn-host", className)}
      data-kind="subitem"
      data-design={design}
      data-unselectable={unselectable ? "" : undefined}
    >
      <Tag
        data-slot="side-navigation-sub-item"
        data-sn-nav=""
        data-level="2"
        data-has-icon={icon ? "" : undefined}
        data-selected={isSelected && !disabled ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        role="treeitem"
        tabIndex={-1}
        aria-current={isSelected ? "page" : undefined}
        aria-disabled={disabled || undefined}
        aria-label={accessibleName}
        aria-labelledby={accessibleName ? undefined : `${id}-text`}
        aria-describedby={tag ? `${id}-tag` : undefined}
        title={tooltip}
        href={effectiveHref}
        target={effectiveHref ? target : undefined}
        className="fiori-sn-item"
        onClick={activation.onClick}
        onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
          if (e.target !== e.currentTarget) return
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault()
            const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
            if (mode.inPopover && (e.key === "ArrowLeft") !== rtl) mode.closePopover?.()
            return
          }
          activation.onKeyDown(e)
        }}
        onKeyUp={(e: React.KeyboardEvent<HTMLElement>) => {
          if (e.target === e.currentTarget) activation.onKeyUp(e)
        }}
      >
        {icon && <SnIcon icon={icon} className="fiori-sn-item__icon" />}
        <div id={`${id}-text`} className="fiori-sn-item__text">
          {text}
        </div>
        {tag && (
          <div id={`${id}-tag`} className="fiori-sn-item__tag">
            {tag}
          </div>
        )}
        {external && <SnIcon icon={arrowRight} className="fiori-sn-item__ext" />}
      </Tag>
    </li>
  )
}

export {
  SideNavigation,
  SideNavigationGroup,
  SideNavigationItem,
  SideNavigationSubItem,
  SideNavigationLayoutContext,
  type SideNavigationProps,
  type SideNavigationGroupProps,
  type SideNavigationItemProps,
  type SideNavigationSubItemProps,
  type SideNavigationTexts,
  type SideNavigationLayoutBridge,
}

// UI5 keys resolved at the existing rendered/announced text owner.
const defaultTextsKeys = {
  "primaryListLabel": "SIDE_NAVIGATION_FLEXIBLE_LIST_LABEL",
  "fixedListLabel": "SIDE_NAVIGATION_FIXED_LIST_LABEL",
  "listRoleDescription": "SIDE_NAVIGATION_LIST_ARIA_ROLE_DESC",
  "collapsedListRoleDescription": "SIDE_NAVIGATION_COLLAPSED_LIST_ARIA_ROLE_DESC",
  "expandText": "SIDE_NAVIGATION_ICON_EXPAND",
  "collapseText": "SIDE_NAVIGATION_ICON_COLLAPSE",
  "popoverLabel": "SIDE_NAVIGATION_POPOVER_HIDDEN_TEXT",
  "overflowText": "SIDE_NAVIGATION_OVERFLOW_ACCESSIBLE_NAME",
  "overflowDescription": "SIDE_NAVIGATION_OVERFLOW_ITEM_LABEL",
  "overflowMenuLabel": "NAVIGATION_MENU_POPOVER_HIDDEN_TEXT",
  "overflowParentDescription": "NAVIGATION_MENU_SELECTABLE_ITEM_HIDDEN_TEXT",
  "parentItemDescription": "SIDE_NAVIGATION_PARENT_ITEM_SELECTABLE_DESCRIPTION"
} as const
