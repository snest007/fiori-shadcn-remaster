// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { useFioriLocale } from "@/lib/fiori-locale"
import { isF6NavigationKey } from "@/lib/fiori-f6"
import { DropdownMenu as MenuPrimitive, Slot } from "radix-ui"

// MenuTemplate/MenuItemTemplate Popup > List are collapsed into Content here; List metadata marks its group.
// UI5 2.28 Popup.js/onEnterDOM: every rendered Popup surface bounds F6, modal or otherwise.

import type { FioriIconData } from "@/lib/fiori-icons"
import { accept, slimArrowRight, navBack } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { useIsPhone } from "@/lib/use-is-phone"
import { Button } from "@/components/ui/button"
import { ResponsivePopover, ResponsivePopoverContent } from "@/components/ui/responsive-popover"
import { Icon } from "@/components/ui/icon"

type CheckMode = "none" | "single" | "multiple"
type CheckProps = { checked?: boolean; defaultChecked?: boolean; onCheckedChange?: (checked: boolean) => void }
type StateKey = { /** @internal Stable identity assigned by Menu before Radix unmounts popup rows. */ _menuStateKey?: string }
type Surface = { element: HTMLDivElement | null; close: (nativeTab?: boolean) => void; escape?: (e: KeyboardEvent) => void; nested: boolean; depth: number; submenus: Map<HTMLElement, { close: () => void; open: (mouse?: boolean) => void }> }
type MenuState = { setOpen: (open: boolean) => void; checked: Map<string, boolean>; update: () => void; surfaces: Set<Surface>; nativeTab: boolean; triggerSpace: boolean; phone: boolean; open: boolean; trigger: React.RefObject<HTMLButtonElement | null> }
const MenuContext = React.createContext<MenuState | null>(null)
const SurfaceContext = React.createContext<Surface | null>(null)
const GroupContext = React.createContext<{ mode: CheckMode; keys: string[] } | null>(null)
const groupLabels = { none: "Contains Non-Selectable Items", single: "Contains Selectable Items", multiple: "Contains Multi-Selectable Items" }
const navigationKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"]
const modified = (e: { shiftKey: boolean; altKey: boolean; ctrlKey: boolean; metaKey: boolean }) => e.shiftKey || e.altKey || e.ctrlKey || e.metaKey
const activationAllowed = (e: { altKey: boolean; ctrlKey: boolean; metaKey: boolean }) => !e.altKey && !e.ctrlKey && !e.metaKey
const rows = (element: HTMLElement) => [...element.querySelectorAll<HTMLElement>('[role^="menuitem"]')]
  .filter((item) => item.closest('[role="menu"]') === element && (!item.hasAttribute("data-disabled") || item.hasAttribute("data-menu-checkable")))

// UI5 MenuItem.checked survives popup closing. Assign identities to the declared tree above
// Radix Content's Presence boundary; React keys preserve identity when callers reorder items.
function persistentChildren(children: React.ReactNode, path = "menu"): React.ReactNode {
  const mapped = React.Children.map(children, (child, index) => {
    if (!React.isValidElement<{ children?: React.ReactNode } & StateKey>(child)) return child
    const key = `${path}/${child.key ?? index}`
    const owned = child.type === MenuItem || child.type === MenuSubTrigger
    return React.cloneElement(child, {
      ...(owned ? { _menuStateKey: key } : {}),
      ...(child.props.children !== undefined ? { children: persistentChildren(child.props.children, key) } : {}),
    })
  })
  // Radix asChild requires the original single-element shape, not a one-item array.
  return React.isValidElement(children) ? mapped?.[0] : mapped
}

function Menu({ open: openProp, defaultOpen, onOpenChange, children, dir, ...props }: React.ComponentProps<typeof MenuPrimitive.Root>) {
  const phone = useIsPhone()
  const trigger = React.useRef<HTMLButtonElement>(null)
  const scope = React.useRef<HTMLSpanElement>(null)
  const [direction, setDirection] = React.useState<"ltr" | "rtl">("ltr")
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen ?? false)
  const [, update] = React.useReducer((n) => n + 1, 0)
  const state = React.useRef<MenuState>({ setOpen: () => {}, checked: new Map(), update, surfaces: new Set(), nativeTab: false, triggerSpace: false, phone, open: false, trigger }).current
  const setOpen = React.useCallback((open: boolean) => {
    // Phone Menu.js/_afterPopoverClose publishes one root close. Its Dialog
    // and nested Radix menu share this state; don't notify twice for one close.
    if (state.phone) { if (state.open === open) return; state.open = open; state.update() }
    if (openProp === undefined) setUncontrolled(open)
    onOpenChange?.(open)
  }, [openProp, onOpenChange, state])
  state.setOpen = setOpen
  state.phone = phone
  state.open = openProp ?? uncontrolled
  React.useLayoutEffect(() => {
    // Menu.js isRtl reads UI5Element.effectiveDir on the Menu itself, independently
    // of opener direction. Radix Root has no host: retain its declaration scope
    // with a hidden marker before any differently directed opener descendants.
    const node = scope.current
    if (!node) return
    const updateDirection = () => setDirection(node.matches(":dir(rtl)") ? "rtl" : "ltr")
    updateDirection()
    const observer = new MutationObserver(updateDirection)
    for (let ancestor: HTMLElement | null = node; ancestor; ancestor = ancestor.parentElement) {
      observer.observe(ancestor, { attributes: true, attributeFilter: ["dir", "style", "class"] })
    }
    return () => observer.disconnect()
  }, [])
  React.useEffect(() => {
    let tabFrame: number | undefined
    // OpenedPopupsRegistry.js _keydownListener: only plain Escape closes the topmost
    // popup. Register before opening so Radix's document listener cannot close ancestors.
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return
      const element = e.target.closest('[role="menu"]')
      if (!element || element.hasAttribute("data-sn-overflow-menu")) return // A5 owns NavigationMenu's distinct predicates.
      const surfaces = [...state.surfaces].filter((s) => s.element?.isConnected)
      if (!surfaces.some((s) => s.element === element)) return
      if (e.key === "Escape") {
        e.stopImmediatePropagation()
        if (!modified(e)) {
          const top = surfaces.sort((a, b) => a.depth - b.depth).at(-1)
          top?.escape?.(e)
          // MenuItem.js/_beforePopoverClose emits close-menu on phone Escape;
          // MenuTemplate.js bubbles it to the same tree's root _close.
          if (!e.defaultPrevented) { if (state.phone) state.setOpen(false); else top?.close() }
        }
      }
      if (e.key === "Tab" && (e.altKey || e.ctrlKey || e.metaKey)) {
        e.stopImmediatePropagation()
        state.nativeTab = true
        if (tabFrame !== undefined) cancelAnimationFrame(tabFrame)
        tabFrame = requestAnimationFrame(() => { state.nativeTab = false })
      }
    }
    document.addEventListener("keydown", onKeyDown, true)
    return () => {
      document.removeEventListener("keydown", onKeyDown, true)
      if (tabFrame !== undefined) cancelAnimationFrame(tabFrame)
    }
  }, [state])
  const content = <MenuPrimitive.Root dir={dir ?? direction} data-slot="menu" open={state.open} onOpenChange={setOpen} {...props} modal={phone ? false : props.modal}><span ref={scope} data-slot="menu-scope" hidden aria-hidden="true" />{persistentChildren(children)}</MenuPrimitive.Root>
  return <MenuContext.Provider value={state}>{phone ? <ResponsivePopover dir={dir ?? direction} open={state.open} onOpenChange={setOpen}>{content}</ResponsivePopover> : content}</MenuContext.Provider>
}

// UI5 Menu opener/List ItemNavigation do not cancel F6 aliases. Filtering Radix's
// composed raw-arrow callback in its public asChild host preserves native defaults,
// caller handlers and refs, without changing the rendered host or event propagation.
function MenuTriggerHost({ asChild, onKeyDown, aliasKeyDown, ...props }: React.ComponentProps<"button"> & {
  asChild?: boolean
  aliasKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>
}) {
  const Host = asChild ? Slot.Root : "button"
  return <Host {...props} onKeyDown={(event) => {
    if (isF6NavigationKey(event)) aliasKeyDown?.(event)
    else onKeyDown?.(event)
  }} />
}
function MenuContentHost({ asChild, onKeyDown, aliasKeyDown, ...props }: React.ComponentProps<"div"> & {
  asChild?: boolean
  aliasKeyDown?: React.KeyboardEventHandler<HTMLDivElement>
}) {
  const Host = asChild ? Slot.Root : "div"
  return <Host {...props} onKeyDown={(event) => {
    if (isF6NavigationKey(event)) aliasKeyDown?.(event)
    else onKeyDown?.(event)
  }} />
}
function MenuTrigger({ onKeyDown, onPointerDown, onClick, children, asChild, ref, ...props }: React.ComponentProps<typeof MenuPrimitive.Trigger>) {
  const root = React.useContext(MenuContext)
  const pointerPrevented = React.useRef(false)
  return <MenuPrimitive.Trigger ref={(node) => { if (root) root.trigger.current = node; if (typeof ref === "function") ref(node); else if (ref) ref.current = node }} data-slot="menu-trigger" {...props}
    onPointerDown={root?.phone ? (event) => {
      onPointerDown?.(event)
      pointerPrevented.current = event.defaultPrevented
      // ButtonTemplate.js/onclick completes the opener gesture before Menu
      // paints. Radix's pointerdown opening can retarget the same pointerup to
      // a phone row now covering a lower-positioned opener.
      event.preventDefault()
    } : onPointerDown}
    onClick={root?.phone ? (event) => {
      onClick?.(event)
      const prevented = pointerPrevented.current && event.detail !== 0
      pointerPrevented.current = false
      if (!event.defaultPrevented && !prevented && !props.disabled) root.setOpen(!root.open)
    } : onClick}
    onKeyDown={(e) => {
    onKeyDown?.(e)
    // Radix opens on Space down; its following keyup belongs to the opener, not the
    // newly focused item. UI5 button openers open on Space up instead.
    if (!e.defaultPrevented && root && (e.key === " " || e.key === "Spacebar")) root.triggerSpace = true
  }} asChild><MenuTriggerHost asChild={asChild} aliasKeyDown={onKeyDown}>{children}</MenuTriggerHost></MenuPrimitive.Trigger>
}

type MenuGroupProps = React.ComponentProps<typeof MenuPrimitive.Group> & { checkMode?: CheckMode }
function MenuGroup({ checkMode = "none", children, "aria-label": ariaLabel, ...props }: MenuGroupProps) {
  const state = React.useContext(MenuContext)
  const keys: string[] = []
  const collect = (nodes: React.ReactNode) => React.Children.forEach(nodes, (child) => {
    if (!React.isValidElement<CheckProps & StateKey & { children?: React.ReactNode }>(child)) return
    if (child.type === MenuItem || child.type === MenuSubTrigger) {
      const key = child.props._menuStateKey
      if (key && state) {
        keys.push(key)
        if (child.props.checked !== undefined) state.checked.set(key, child.props.checked)
        else if (!state.checked.has(key)) state.checked.set(key, child.props.defaultChecked ?? false)
      }
    } else if (child.type !== MenuGroup && child.type !== MenuSubContent && child.type !== MenuContent) collect(child.props.children)
  })
  collect(children)
  // MenuItemGroup.js _ensureSingleItemIsChecked: the last direct checked item wins;
  // normalization is silent, and selecting the checked item is allowed to clear it.
  if (state && checkMode === "single") {
    const last = keys.filter((key) => state.checked.get(key)).at(-1)
    keys.forEach((key) => state.checked.set(key, key === last))
  }
  return <GroupContext.Provider value={{ mode: checkMode, keys }}><MenuPrimitive.Group data-slot="menu-group" aria-label={ariaLabel ?? groupLabels[checkMode]} {...props}>{children}</MenuPrimitive.Group></GroupContext.Provider>
}

function useSurface(nested: boolean, close: (nativeTab?: boolean) => void) {
  const root = React.useContext(MenuContext)
  const parent = React.useContext(SurfaceContext)
  const surface = React.useRef<Surface>({ element: null, nested, depth: parent ? parent.depth + 1 : 0, close, submenus: new Map() }).current
  surface.close = close
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  React.useEffect(() => () => { if (timer.current !== undefined) clearTimeout(timer.current) }, [])
  const setRef = React.useCallback((node: HTMLDivElement | null) => {
    surface.element = node
    if (node) root?.surfaces.add(surface)
    else root?.surfaces.delete(surface)
  }, [root, surface])
  const hover = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.pointerType !== "mouse") return
    e.preventDefault() // Menu.js owns the 300ms root delay; nested MenuItem.js never opens on hover.
    if (e.currentTarget.hasAttribute("data-disabled") && !e.currentTarget.hasAttribute("data-menu-checkable")) return
    e.currentTarget.focus({ preventScroll: true })
    if (timer.current !== undefined) clearTimeout(timer.current)
    const item = e.currentTarget
    const act = () => {
      surface.submenus.forEach((sub, trigger) => { if (trigger !== item) sub.close() })
      if (!nested) surface.submenus.get(item)?.open(true)
    }
    if (nested) act()
    else timer.current = setTimeout(act, 300) // Menu.js MENU_OPEN_DELAY.
  }
  return { surface, setRef, hover }
}
const HoverContext = React.createContext<((e: React.PointerEvent<HTMLDivElement>) => void) | null>(null)

function surfaceKeyDown(e: React.KeyboardEvent<HTMLDivElement>, surface: Surface) {
  const element = surface.element
  if (!element || e.defaultPrevented || (e.target as HTMLElement).closest('[role="menu"]') !== element || element.hasAttribute("data-sn-overflow-menu")) return
  const key = e.key === "Spacebar" ? " " : e.key
  // Menu.js/_itemKeyDown and ItemNavigation ignore aliases without cancelling their native event.
  if (isF6NavigationKey(e)) return
  // UI5 has no printable typeahead; do not let Radix's search buffer poison Space.
  if ((navigationKeys.includes(key) && modified(e)) || (key.length === 1 && key !== " ")
    || ((key === " " || key === "Enter") && !activationAllowed(e))) { e.stopPropagation(); return }
  if (key === "Tab") {
    if (!surface.nested) e.preventDefault() // MenuItem.js leaves nested Tab's browser default intact.
    e.stopPropagation()
    surface.close(true)
    return
  }
  const items = rows(element)
  const item = (e.target as HTMLElement).closest<HTMLElement>('[role^="menuitem"]')
  const index = item ? items.indexOf(item) : -1
  if (index < 0 || e.target !== item) return
  const rtl = getComputedStyle(element).direction === "rtl"
  if (key === (rtl ? "ArrowLeft" : "ArrowRight")) {
    e.stopPropagation()
    if (!item?.hasAttribute("data-disabled")) surface.submenus.get(item!)?.open()
    return
  }
  if (key === (rtl ? "ArrowRight" : "ArrowLeft")) {
    e.stopPropagation()
    if (surface.nested) surface.close()
    return
  }
  let next = -1
  // ItemNavigation.js static boundaries and Menu.js _updatePageSize. Nested List uses 10.
  if (key === "ArrowUp") next = Math.max(index - 1, 0)
  else if (key === "ArrowDown") next = Math.min(index + 1, items.length - 1)
  else if (key === "Home") next = 0
  else if (key === "End") next = items.length - 1
  else if (key === "PageUp" || key === "PageDown") {
    const visibleCount = Math.round(element.getBoundingClientRect().height / items[0].offsetHeight)
    const pageSize = surface.nested ? 10 : visibleCount > 1 ? visibleCount - 1 : null
    next = pageSize === null ? (key === "PageUp" ? 0 : items.length - 1)
      : Math.max(0, Math.min(index + (key === "PageUp" ? -pageSize : pageSize), items.length - 1))
  }
  if (next >= 0) { e.preventDefault(); e.stopPropagation(); items[next].focus({ preventScroll: true }) }
}

type MenuContentProps = React.ComponentProps<typeof MenuPrimitive.Content> & {
  /** Render in place instead of in a portal on document.body. */ portal?: boolean
  /** Don't move focus into the menu on open. UI5 normally focuses the first item for mouse too. */ preventInitialFocus?: boolean
  /** Phone MenuTemplate title and footer action. */
  headerText?: string
  cancelLabel?: string
}
function MenuContent({ className, side = "bottom", align = "start", sideOffset = 0, collisionPadding = 10, portal = true, preventInitialFocus = false, headerText = "", cancelLabel: cancelLabelProp, ref, onKeyDownCapture, onKeyDown, asChild, onFocusOutside, onEscapeKeyDown, children, ...props }: MenuContentProps) {
  const { t } = useFioriLocale()
  const cancelLabel = cancelLabelProp ?? t("MENU_CANCEL_BUTTON_TEXT", "Cancel") // UI5 MENU_CANCEL_BUTTON_TEXT

  const root = React.useContext(MenuContext)
  const { surface, setRef, hover } = useSurface(false, () => root?.setOpen(false))
  surface.escape = onEscapeKeyDown
  const mergedRef = React.useCallback((node: HTMLDivElement | null) => { setRef(node); if (typeof ref === "function") ref(node); else if (ref) ref.current = node }, [ref, setRef])
  const autoFocus = { onOpenAutoFocus: (e: Event) => { e.preventDefault(); if (!preventInitialFocus && surface.element) rows(surface.element)[0]?.focus({ preventScroll: true }) } } as object
  // The phone Dialog owns the modal layer. Keep its nested Radix menu interactive:
  // DismissableLayer otherwise writes pointer-events:none below the Dialog layer.
  const content = <SurfaceContext.Provider value={surface}><HoverContext.Provider value={hover}><GroupContext.Provider value={null}>
    <MenuPrimitive.Content ref={mergedRef} data-slot="menu-content" data-sap-ui-fastnavgroup="true" side={side} align={align} sideOffset={sideOffset} collisionPadding={collisionPadding}
      className={cn("fiori-menu z-50 max-h-(--radix-dropdown-menu-content-available-height)", root?.phone && "fiori-menu-phone__list", className)}
      onKeyDownCapture={(e) => { onKeyDownCapture?.(e); surfaceKeyDown(e, surface) }}
      onFocusOutside={(e) => { onFocusOutside?.(e); if (root?.nativeTab || root?.phone) e.preventDefault() }} {...autoFocus} {...props} onKeyDown={onKeyDown} data-sap-ui-fastnavgroup-container="true" style={root?.phone ? { ...props.style, pointerEvents: "auto" } : props.style} asChild><MenuContentHost asChild={asChild} aliasKeyDown={onKeyDown}>{children}</MenuContentHost></MenuPrimitive.Content>
  </GroupContext.Provider></HoverContext.Provider></SurfaceContext.Provider>
  if (root?.phone) return <ResponsivePopoverContent portal={portal} headerText={headerText} phoneField phoneClassName="fiori-menu-phone"
    phoneHeader={<div className="fiori-menu-phone__header"><div className="fiori-menu-phone__title"><h1>{headerText}</h1></div></div>}
    phoneFooter={<div className="fiori-menu-phone__footer"><Button variant="transparent" onClick={() => root.setOpen(false)}>{cancelLabel}</Button></div>}
    onEscapeKeyDown={(event) => { if (modified(event)) { event.preventDefault(); return }; onEscapeKeyDown?.(event) }}
    onOpenAutoFocus={(event) => event.preventDefault()} onCloseAutoFocus={(event) => { event.preventDefault(); root.trigger.current?.focus() }}>
    {content}
  </ResponsivePopoverContent>
  return portal ? <MenuPrimitive.Portal>{content}</MenuPrimitive.Portal> : content
}

type ItemExtras = { icon?: FioriIconData; additionalText?: React.ReactNode }
function ItemContent({ icon, children, end, checked }: { icon?: FioriIconData; children: React.ReactNode; end?: React.ReactNode; checked?: boolean }) {
  return <div className="fiori-menu-item__content">
    {icon && <Icon icon={icon} className="fiori-menu-item__icon size-(--fiori-list-item-icon-size)" />}
    <div className="fiori-menu-item__text">{children}</div>{end}
    {checked && <div className="fiori-menu-item__checked"><Icon icon={accept} /></div>}
  </div>
}
type MenuItemProps = React.ComponentProps<typeof MenuPrimitive.Item> & ItemExtras & CheckProps & StateKey
function MenuItem({ className, icon, additionalText, children, checked: checkedProp, defaultChecked, onCheckedChange, _menuStateKey, disabled, onSelect, onKeyDown, onKeyUp, onClick, onPointerMove, onPointerLeave, ...props }: MenuItemProps) {
  const root = React.useContext(MenuContext)
  const surface = React.useContext(SurfaceContext)
  const group = React.useContext(GroupContext)
  const hover = React.useContext(HoverContext)
  const fallbackKey = React.useId()
  const key = _menuStateKey ?? props.id ?? fallbackKey
  const checkable = !!group && group.mode !== "none"
  const [local, setLocal] = React.useState(defaultChecked ?? false)
  if (root && !root.checked.has(key)) root.checked.set(key, checkedProp ?? defaultChecked ?? false)
  const checked = group?.mode === "single" ? root?.checked.get(key) ?? local : checkedProp ?? root?.checked.get(key) ?? local
  const shift = React.useRef(false)
  const activate = (event: Event) => {
    // ListItemBase.js fireItemPress suppresses every activation callback for disabled rows.
    if (disabled) { event.preventDefault(); return }
    onSelect?.(event)
    if (event.defaultPrevented) return
    if (checkable) {
      const next = !checked
      if (group.mode === "single") group.keys.forEach((sibling) => root?.checked.set(sibling, false))
      root?.checked.set(key, next)
      if (checkedProp === undefined) setLocal(next)
      onCheckedChange?.(next)
      root?.update()
      if (shift.current) event.preventDefault()
    }
  }
  const keyActivate = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // MenuItem.js _isEnter/_isSpace admit plain and Shift-only activation;
    // ListItemBase.js _onkeydown presses Enter, while _onkeyup presses Space.
    shift.current = e.shiftKey
    const selection = new CustomEvent("menu.itemSelect", { bubbles: true, cancelable: true })
    e.currentTarget.addEventListener("menu.itemSelect", activate, { once: true })
    e.currentTarget.dispatchEvent(selection)
    if (!selection.defaultPrevented) root?.setOpen(false)
  }
  return <MenuPrimitive.Item data-slot="menu-item" className={cn("fiori-list-item fiori-menu-item", className)}
    {...props} disabled={checkable ? false : disabled} data-disabled={disabled ? "" : (props as Record<string, unknown>)["data-disabled"] as string | undefined} aria-disabled={disabled || props["aria-disabled"]}
    role={props.role ?? (group?.mode === "single" ? "menuitemradio" : group?.mode === "multiple" ? "menuitemcheckbox" : "menuitem")}
    aria-checked={checkable ? !!checked : undefined} data-menu-checkable={checkable ? "" : undefined}
    onSelect={activate} onClick={(e) => { shift.current = e.shiftKey; onClick?.(e) }}
    onKeyDown={(e) => { onKeyDown?.(e); if (e.defaultPrevented || surface?.element?.hasAttribute("data-sn-overflow-menu")) return; if (e.key === " " || e.key === "Spacebar") { if (root) root.triggerSpace = false; e.preventDefault() } if (e.key === "Enter") { if (activationAllowed(e)) keyActivate(e); e.preventDefault(); e.stopPropagation() } }}
    onKeyUp={(e) => { onKeyUp?.(e); if (surface?.element?.hasAttribute("data-sn-overflow-menu")) return; if (root?.triggerSpace && (e.key === " " || e.key === "Spacebar")) { root.triggerSpace = false; return } if (!e.defaultPrevented && (e.key === " " || e.key === "Spacebar") && activationAllowed(e)) { keyActivate(e); e.preventDefault(); e.stopPropagation() } }}
    onPointerMove={(e) => { onPointerMove?.(e); hover?.(e) }} onPointerLeave={(e) => { onPointerLeave?.(e); e.preventDefault() }}>
    <ItemContent icon={icon} checked={checkable && !!checked} end={additionalText != null && <span className="fiori-menu-item__additional-text">{additionalText}</span>}>{children}</ItemContent>
  </MenuPrimitive.Item>
}

function MenuSeparator({ className, ...props }: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return <MenuPrimitive.Separator data-slot="menu-separator" className={cn("fiori-menu-separator", className)} {...props} />
}

const MenuSubContext = React.createContext<{ close: () => void; open: (mouse?: boolean) => void; trigger: React.RefObject<HTMLDivElement | null>; mouse: React.RefObject<boolean>; isOpen: boolean } | null>(null)
function MenuSub({ open: openProp, defaultOpen, onOpenChange, ...props }: React.ComponentProps<typeof MenuPrimitive.Sub>) {
  const root = React.useContext(MenuContext)
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen ?? false)
  // MenuItem.js hasSubmenu returns false for disabled owners; its template omits
  // the popup entirely, even if the owner has child items.
  const disabledOwner = React.Children.toArray(props.children).some((child) =>
    React.isValidElement<MenuSubTriggerProps>(child) && child.type === MenuSubTrigger && child.props.disabled)
  React.useEffect(() => { if (disabledOwner && openProp === undefined) setUncontrolled(false) }, [disabledOwner, openProp])
  const setOpen = React.useCallback((open: boolean) => { if (openProp === undefined) setUncontrolled(open); onOpenChange?.(open) }, [openProp, onOpenChange])
  const trigger = React.useRef<HTMLDivElement>(null)
  const mouse = React.useRef(false)
  const ctx = React.useMemo(() => ({ close: () => setOpen(false), open: (byMouse = false) => { if (!disabledOwner) { mouse.current = byMouse; setOpen(true) } }, trigger, mouse, isOpen: !disabledOwner && (openProp ?? uncontrolled) }), [setOpen, disabledOwner, openProp, uncontrolled])
  return <MenuSubContext.Provider value={ctx}><MenuPrimitive.Sub data-slot="menu-sub" open={ctx.isOpen} onOpenChange={setOpen}>{root?.phone ? <ResponsivePopover open={ctx.isOpen} onOpenChange={setOpen}>{props.children}</ResponsivePopover> : props.children}</MenuPrimitive.Sub></MenuSubContext.Provider>
}
type MenuSubTriggerProps = React.ComponentProps<typeof MenuPrimitive.SubTrigger> & Omit<ItemExtras, "additionalText"> & CheckProps & StateKey
function MenuSubTrigger({ className, icon, children, ref, checked: _checked, defaultChecked: _defaultChecked, onCheckedChange: _onCheckedChange, _menuStateKey: _key, disabled, onKeyDown, onKeyUp, onClick, onPointerMove, onPointerLeave, ...props }: MenuSubTriggerProps) {
  const root = React.useContext(MenuContext)
  const sub = React.useContext(MenuSubContext)
  const surface = React.useContext(SurfaceContext)
  const group = React.useContext(GroupContext)
  const hover = React.useContext(HoverContext)
  const checkable = !!group && group.mode !== "none"
  // MenuItem.js _markChecked excludes enabled submenu owners. Disabled owners
  // have hasSubmenu=false and retain normal leaf checks and accessibility.
  const element = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => () => { if (element.current) surface?.submenus.delete(element.current) }, [surface])
  const mergedRef = React.useCallback((node: HTMLDivElement | null) => {
    if (element.current) surface?.submenus.delete(element.current)
    element.current = node
    if (sub) sub.trigger.current = node
    if (node && sub && !disabled) surface?.submenus.set(node, sub)
    if (typeof ref === "function") ref(node); else if (ref) ref.current = node
  }, [surface, sub, ref, disabled])
  if (disabled) {
    // SubTrigger's onSelect is the native text-selection callback, not Item's
    // cancelable activation callback. A disabled leaf does not activate either way.
    const { onSelect: _nativeSelect, ...leafProps } = props
    return <MenuItem {...leafProps} ref={mergedRef} data-slot="menu-sub-trigger" className={className} icon={icon}
      checked={_checked} defaultChecked={_defaultChecked} onCheckedChange={_onCheckedChange} _menuStateKey={_key} disabled
      onKeyDown={onKeyDown} onKeyUp={onKeyUp} onClick={onClick} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>{children}</MenuItem>
  }
  // ButtonTemplate.js's native Space activation completes before Menu.js _afterPopoverOpen
  // focuses a row; consume the opener's keyup just as MenuItem does.
  return <MenuPrimitive.SubTrigger {...props} ref={mergedRef} data-slot="menu-sub-trigger" className={cn("fiori-list-item fiori-menu-item", className)} disabled={checkable ? false : disabled}
    data-disabled={disabled ? "" : (props as Record<string, unknown>)["data-disabled"] as string | undefined} aria-disabled={disabled || props["aria-disabled"]} data-menu-checkable={checkable ? "" : undefined}
    role={props.role ?? (group?.mode === "single" ? "menuitemradio" : group?.mode === "multiple" ? "menuitemcheckbox" : "menuitem")} aria-checked={checkable ? false : undefined}
    onClick={(e) => { onClick?.(e); if (!e.defaultPrevented && !disabled) sub?.open(); e.preventDefault() }}
    onKeyDown={(e) => { onKeyDown?.(e); if (e.defaultPrevented || surface?.element?.hasAttribute("data-sn-overflow-menu")) return; if (e.key === " " || e.key === "Spacebar") { if (root) root.triggerSpace = false; e.preventDefault() } if (e.key === "Enter") { if (activationAllowed(e) && !disabled) sub?.open(); e.preventDefault(); e.stopPropagation() } }}
    onKeyUp={(e) => { onKeyUp?.(e); if (surface?.element?.hasAttribute("data-sn-overflow-menu")) return; if (root?.triggerSpace && (e.key === " " || e.key === "Spacebar")) { root.triggerSpace = false; return } if (!e.defaultPrevented && (e.key === " " || e.key === "Spacebar") && activationAllowed(e) && !disabled) { sub?.open(); e.preventDefault(); e.stopPropagation() } }}
    onPointerMove={(e) => { onPointerMove?.(e); hover?.(e) }} onPointerLeave={(e) => { onPointerLeave?.(e); e.preventDefault() }}>
    <ItemContent icon={icon} end={<div className="fiori-menu-item__submenu"><Icon icon={slimArrowRight} /></div>}>{children}</ItemContent>
  </MenuPrimitive.SubTrigger>
}

// MenuItemTemplate.js passes aria-label="Back" to the host; ButtonTemplate.js
// names the rendered inner button from the nav-back icon tooltip ("Navigate Back").
function MenuSubContent({ className, headerText, cancelLabel: cancelLabelProp, backLabel: backLabelProp, sideOffset = 0, alignOffset = 4, collisionPadding = 10, ref, onKeyDownCapture, onKeyDown, asChild, onFocusOutside, onEscapeKeyDown, children, ...props }: React.ComponentProps<typeof MenuPrimitive.SubContent> & { headerText?: string; cancelLabel?: string; backLabel?: string }) {
  const { t } = useFioriLocale()
  const cancelLabel = cancelLabelProp ?? t("MENU_CANCEL_BUTTON_TEXT", "Cancel") // UI5 MENU_CANCEL_BUTTON_TEXT
  const backLabel = backLabelProp ?? t("DYNAMIC_DATE_RANGE_NAVIGATION_ICON_TOOLTIP", "Navigate Back") // UI5 DYNAMIC_DATE_RANGE_NAVIGATION_ICON_TOOLTIP

  const sub = React.useContext(MenuSubContext)
  const root = React.useContext(MenuContext)
  const close = (nativeTab = false) => {
    sub?.close()
    sub?.trigger.current?.focus({ preventScroll: true })
    // MenuItem.js restores its owning row after nested Tab's native focus transfer.
    if (root && nativeTab) {
      root.nativeTab = true
      requestAnimationFrame(() => { sub?.trigger.current?.focus({ preventScroll: true }); root.nativeTab = false })
    }
  }
  const { surface, setRef, hover } = useSurface(true, close)
  surface.escape = onEscapeKeyDown
  const mergedRef = React.useCallback((node: HTMLDivElement | null) => {
    setRef(node)
    if (typeof ref === "function") ref(node); else if (ref) ref.current = node
    // MenuItem.js _afterPopoverOpen focuses after click and keyboard activation,
    // but not delayed hover. Radix only handles the keyboard case by itself.
    if (node && !node.hasAttribute("data-sn-overflow-menu") && !sub?.mouse.current) queueMicrotask(() => {
      if (node.isConnected) rows(node)[0]?.focus({ preventScroll: true })
    })
  }, [ref, setRef, sub])
  // Menu's internal RovingFocusGroup hook is forwarded at runtime, but omitted from
  // DropdownMenu's published types (like Content's onOpenAutoFocus above).
  const entryFocus = { onEntryFocus: (e: Event) => {
    if (sub?.mouse.current && !surface.element?.hasAttribute("data-sn-overflow-menu")) { e.preventDefault(); sub.trigger.current?.focus({ preventScroll: true }) }
  } } as object
  const content = <SurfaceContext.Provider value={surface}><HoverContext.Provider value={hover}><GroupContext.Provider value={null}>
    <MenuPrimitive.SubContent data-sap-ui-fastnavgroup="true" {...props} data-sap-ui-fastnavgroup-container="true" ref={mergedRef} data-slot="menu-sub-content" sideOffset={sideOffset} alignOffset={alignOffset} collisionPadding={collisionPadding}
      className={cn("fiori-menu z-50 max-h-(--radix-dropdown-menu-content-available-height)", className)}
      onKeyDownCapture={(e) => { onKeyDownCapture?.(e); surfaceKeyDown(e, surface) }}
      {...entryFocus}
      onFocusOutside={(e) => { onFocusOutside?.(e); if (root?.nativeTab || root?.phone) e.preventDefault() }}
      onEscapeKeyDown={(e) => { onEscapeKeyDown?.(e); if (!e.defaultPrevented) { e.preventDefault(); if (!modified(e)) { if (root?.phone) root.setOpen(false); else close() } } }} onKeyDown={onKeyDown} style={root?.phone ? { ...props.style, pointerEvents: "auto" } : props.style} asChild><MenuContentHost asChild={asChild} aliasKeyDown={onKeyDown}>{children}</MenuContentHost></MenuPrimitive.SubContent>
  </GroupContext.Provider></HoverContext.Provider></SurfaceContext.Provider>
  if (root?.phone) return <ResponsivePopoverContent headerText={headerText ?? sub?.trigger.current?.textContent ?? ""} phoneField phoneClassName="fiori-menu-phone"
    phoneHeader={<div className="fiori-menu-phone__header"><Button variant="transparent" aria-label={backLabel} className="fiori-menu-phone__back" onClick={() => close()}><Icon icon={navBack} /></Button><div className="fiori-menu-phone__title">{headerText ?? sub?.trigger.current?.textContent}</div></div>}
    phoneFooter={<div className="fiori-menu-phone__footer"><Button variant="transparent" onClick={() => root.setOpen(false)}>{cancelLabel}</Button></div>}
    onEscapeKeyDown={(event) => { if (modified(event)) { event.preventDefault(); return }; onEscapeKeyDown?.(event); if (!event.defaultPrevented) { event.preventDefault(); root.setOpen(false) } }}
    onOpenAutoFocus={(event) => event.preventDefault()} onCloseAutoFocus={(event) => { event.preventDefault(); if (root.open) sub?.trigger.current?.focus(); else root.trigger.current?.focus() }}>
    {content}
  </ResponsivePopoverContent>
  return <MenuPrimitive.Portal>{content}</MenuPrimitive.Portal>
}

export { Menu, MenuContent, MenuGroup, MenuItem, MenuSeparator, MenuSub, MenuSubContent, MenuSubTrigger, MenuTrigger, type MenuContentProps, type MenuGroupProps, type MenuItemProps, type MenuSubTriggerProps }
