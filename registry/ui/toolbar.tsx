// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { useFioriLocale } from "@/lib/fiori-locale"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"
import { overflow } from "@/lib/fiori-icons"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Popover, PopoverContent, PopoverTrigger, type PopoverContentProps } from "@/components/ui/popover"
import { Select } from "@/components/ui/select"
import { ComboBox } from "@/components/ui/combobox"
import { MultiComboBox } from "@/components/ui/multi-combobox"
import { DatePicker } from "@/components/ui/date-picker"
import { Switch } from "@/components/ui/switch"

type ToolbarItemOptions = {
  overflowPriority?: "default" | "neverOverflow" | "alwaysOverflow"
  preventOverflowClosing?: boolean
}

/**
 * @accessibility Native aria-label names the toolbar. Its actions retain their accessible names when moved into overflow; overflowButtonLabel and overflowPopoverLabel name that surface. One Tab stop enters; arrows and Home/End move. Escape closes overflow and restores focus.
 */
type ToolbarProps = React.ComponentProps<"div"> & {
  alignContent?: "start" | "end"
  design?: "solid" | "transparent"
  overflowButtonLabel?: string
  overflowPopoverLabel?: string
  defaultOverflowOpen?: boolean
  overflowContentProps?: Omit<PopoverContentProps, "children">
}

const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"

function navigableItems(toolbar: HTMLElement) {
  return [...toolbar.children].flatMap((item) => {
    const el = item as HTMLElement
    if (el.hidden || el.dataset.hidden !== undefined || el.dataset.kind === "spacer" || el.dataset.kind === "separator") return []
    const target = el.matches(FOCUSABLE) ? el : el.querySelector<HTMLElement>(FOCUSABLE)
    return target ? [{ item: el, target }] : []
  })
}

function fieldKeepsKey(el: HTMLElement, key: string, forward: boolean) {
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return false
  if (el instanceof HTMLInputElement && el.selectionStart === null) return false
  if (key === "Home" || key === "End") return true
  const { selectionStart: s, selectionEnd: e, value } = el
  return forward ? !(s === value.length && e === value.length) : !(s === 0 && e === 0)
}

const OverflowContext = React.createContext({ overflowed: false, close: () => {}, registerNestedInteraction: (_event: Event) => {} })
type ItemRecord = { key: string; node: HTMLElement; child: React.ReactNode; priority: ToolbarItemOptions["overflowPriority"]; kind: "item" | "separator" | "spacer"; flexible: boolean; unmanaged: boolean; width?: string }

/** UI5 Toolbar.js/distributeItems: ungrouped distribution units move right-to-left; separators cost zero. */
function distributeItems(items: ItemRecord[], widths: Map<string, number>, overflowSpace: number) {
  const result = items.filter((item) => item.priority === "alwaysOverflow")
  const movable = items.filter((item) => item.priority !== "alwaysOverflow" && item.priority !== "neverOverflow")
  const moved: ItemRecord[] = []
  let next = movable.length - 1
  for (; next >= 0 && overflowSpace > 0; next--) {
    moved.push(movable[next])
    overflowSpace -= widths.get(movable[next].key) ?? 0
  }
  while (next >= 0 && movable[next].kind === "separator") moved.push(movable[next--])
  moved.sort((a, b) => items.indexOf(a) - items.indexOf(b))
  return [...result, ...moved].map((item) => item.key)
}

function Toolbar({ alignContent = "end", design = "solid", overflowButtonLabel: overflowButtonLabelProp, overflowPopoverLabel: overflowPopoverLabelProp, defaultOverflowOpen = false, overflowContentProps, className, onKeyDown, children, ...props }: ToolbarProps) {
  const { t } = useFioriLocale()
  const overflowButtonLabel = overflowButtonLabelProp ?? t("TOOLBAR_OVERFLOW_BUTTON_ARIA_LABEL", "Additional Options") // UI5 TOOLBAR_OVERFLOW_BUTTON_ARIA_LABEL
  const overflowPopoverLabel = overflowPopoverLabelProp ?? t("INPUT_AVALIABLE_VALUES", "Available Values") // UI5 INPUT_AVALIABLE_VALUES

  const bar = React.useRef<HTMLDivElement>(null)
  const parking = React.useRef<HTMLDivElement>(null)
  const overflowHost = React.useRef<HTMLDivElement>(null)
  const overflowButton = React.useRef<HTMLButtonElement>(null)
  const records = React.useRef(new Map<string, ItemRecord>())
  const widths = React.useRef(new Map<string, number>())
  // A server/hydration fallback renders the supplied children before creating portals.
  // Client-only mounts still expose children on the first commit, as legacy consumers need.
  // Portals cannot adopt hydrated fibers: child mount effects can run again at initialization.
  // Preserve native edits during that one transition; later overflow moves never remount.
  type NativeState = { value: string; checked?: boolean; selected?: boolean[]; selection?: [number | null, number | null, "forward" | "backward" | "none" | null]; focused: boolean }
  const hydrationState = React.useRef(new Map<string, NativeState[]>())
  const getMountedSnapshot = React.useCallback(() => {
    for (const node of bar.current?.querySelectorAll<HTMLElement>("[data-toolbar-initial-key]") ?? []) {
      const key = node.dataset.toolbarInitialKey!
      if (hydrationState.current.has(key)) continue
      hydrationState.current.set(key, [...node.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select")].map((field) => ({
        value: field.value,
        checked: field instanceof HTMLInputElement ? field.checked : undefined,
        selected: field instanceof HTMLSelectElement ? [...field.options].map((option) => option.selected) : undefined,
        selection: field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement ? [field.selectionStart, field.selectionEnd, field.selectionDirection] : undefined,
        focused: field === document.activeElement,
      })))
    }
    return true
  }, [])
  const mounted = React.useSyncExternalStore(React.useCallback(() => () => {}, []), getMountedSnapshot, () => false)
  const [overflowKeys, setOverflowKeys] = React.useState<string[]>([])
  const [open, setOpen] = React.useState(defaultOverflowOpen)
  const [reverseOverflow, setReverseOverflow] = React.useState(false)
  const actualPlacement = React.useRef("bottom")
  const placementObserver = React.useRef<MutationObserver | null>(null)
  const items: ItemRecord[] = mounted ? React.Children.toArray(children).map((child, index) => {
    const element = React.isValidElement<ToolbarItemOptions & { width?: string; hidden?: boolean }>(child) ? child : undefined
    const key = element?.key?.toString() ?? String(index)
    const kind = element?.type === ToolbarSpacer ? "spacer" : element?.type === ToolbarSeparator ? "separator" : "item"
    const unmanaged = !element || ![ToolbarButton, ToolbarItem, ToolbarSpacer, ToolbarSeparator].includes(element.type as typeof ToolbarItem)
    let record = records.current.get(key)
    if (!record) {
      record = { key, node: document.createElement("div"), child, kind, flexible: false, unmanaged, priority: "default" }
      records.current.set(key, record)
    }
    // Bare children predate overflow and keep their original flex/percentage-width semantics.
    // Use ToolbarItem to opt arbitrary controls into the UI5 overflow lifecycle.
    Object.assign(record, { child, kind, unmanaged, priority: unmanaged ? "neverOverflow" : element?.props.overflowPriority ?? "default", flexible: kind === "spacer" && (!element?.props.width || element.props.width === "auto"), width: element?.props.width })
    record.node.className = "fiori-toolbar-container"
    record.node.dataset.kind = kind
    record.node.toggleAttribute("data-flexible", record.flexible)
    record.node.toggleAttribute("data-unmanaged", unmanaged)
    record.node.hidden = !!element?.props.hidden
    return record
  }) : []
  const overflowItems = overflowKeys.map((key) => records.current.get(key)).filter((item): item is ItemRecord => !!item && !item.flexible)
  // Toolbar.js/overflowItems reverses the effective list when openOverflow sees Top.
  if (reverseOverflow) overflowItems.reverse()
  const hasOverflow = overflowItems.some((item) => item.kind !== "separator" && !item.node.hidden)
  const isOpen = React.useRef(false)
  const nestedInteractions = React.useRef(new WeakSet<Event>())
  const opening = React.useRef(0)
  const restoredOpening = React.useRef<number | null>(null)
  const renderedOpening = opening.current
  isOpen.current = open && hasOverflow
  const close = React.useCallback(() => setOpen(false), [])
  const registerNestedInteraction = React.useCallback((event: Event) => { nestedInteractions.current.add(event) }, [])
  const isPickerTarget = React.useCallback((target: Node) => {
    const controls = overflowHost.current?.querySelectorAll<HTMLElement>("[aria-controls]") ?? []
    return [...controls].some((control) => control.getAttribute("aria-controls")?.split(/\s+/).some((id) => document.getElementById(id)?.contains(target)))
  }, [])
  React.useEffect(() => {
    if (!open) return
    // Radix defers an outside pointer event until click. A child picker may have
    // removed that target by then; retain the original association while mounted.
    const capture = (event: PointerEvent) => {
      if (event.target instanceof Node && isPickerTarget(event.target)) registerNestedInteraction(event)
    }
    document.addEventListener("pointerdown", capture, true)
    return () => document.removeEventListener("pointerdown", capture, true)
  }, [open, isPickerTarget, registerNestedInteraction])
  const changeOpen = React.useCallback((next: boolean) => {
    // Toolbar.js/openOverflow reads the actual placement retained after closing.
    if (next) {
      if (!isOpen.current) opening.current++
      setReverseOverflow(actualPlacement.current === "top")
    }
    setOpen(next)
  }, [])
  const layout = React.useRef<() => void>(() => {})
  // Radix Presence can mount after the toolbar's layout effect. Relocate the stable containers
  // at the content ref boundary as well, before its autofocus/focus-trap effects run.
  const mountOverflow = React.useCallback((node: HTMLDivElement | null) => {
    const previous = overflowHost.current
    placementObserver.current?.disconnect()
    overflowHost.current = node
    if (node) {
      for (const key of overflowKeys) {
        const item = records.current.get(key)
        if (item && !item.flexible) node.append(item.node)
      }
      const surface = node.closest<HTMLElement>("[data-slot=popover-content]")
      if (surface) {
        const updatePlacement = () => {
          const side = surface.dataset.side
          if (!side) return
          actualPlacement.current = side
          // Popover._show can resolve Top synchronously on a first measurable open.
          // Radix publishes the resolved side after mounting; reconcile that placement.
          setReverseOverflow(side === "top")
        }
        placementObserver.current = new MutationObserver(updatePlacement)
        placementObserver.current.observe(surface, { attributes: true, attributeFilter: ["data-side"] })
        updatePlacement()
      }
    } else if (previous && parking.current) {
      for (const item of records.current.values()) if (item.node.parentElement === previous) parking.current.append(item.node)
    }
  }, [overflowKeys])

  React.useLayoutEffect(() => {
    if (!mounted || !bar.current || !parking.current || !overflowButton.current) return
    const host = bar.current
    const button = overflowButton.current
    // Keep one portal container per item, like ToolbarItemBase.stableDomRef. Moving the container
    // preserves arbitrary child state (including uncontrolled fields) through overflow and resize.
    for (const item of items) if (!item.node.isConnected) host.insertBefore(item.node, button)
    for (const [key, record] of records.current) {
      if (!items.some((item) => item.key === key)) { record.node.remove(); records.current.delete(key); widths.current.delete(key) }
    }
    layout.current = () => {
      const root = host.parentElement!
      if (!root.offsetWidth) return
      const style = getComputedStyle(root)
      const containerWidth = root.offsetWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
      for (const item of items) {
        if (item.flexible || item.kind === "separator" || item.node.hidden) widths.current.set(item.key, 0)
        else if (item.node.parentElement === host && !overflowKeys.includes(item.key) && item.priority !== "alwaysOverflow") {
          const measured = item.unmanaged ? item.node.firstElementChild as HTMLElement | null : item.node
          if (!measured) continue
          const itemStyle = getComputedStyle(measured)
          widths.current.set(item.key, Math.ceil(measured.offsetWidth + parseFloat(itemStyle.marginInlineStart) + parseFloat(itemStyle.marginInlineEnd)))
        }
      }
      const contentWidth = items.reduce((sum, item) => sum + (widths.current.get(item.key) ?? 0), 0)
      // Toolbar.js/processOverflowLayout reserves the button only when content exceeds the bar.
      const budget = contentWidth > containerWidth ? contentWidth - containerWidth + button.getBoundingClientRect().width : 0
      const next = distributeItems(items, widths.current, budget)
      setOverflowKeys((previous) => previous.join("|") === next.join("|") ? previous : next)
    }
    layout.current()
    for (const item of items) {
      const overflowed = overflowKeys.includes(item.key) || item.priority === "alwaysOverflow"
      item.node.toggleAttribute("data-overflowed", overflowed)
      item.node.style.width = item.kind === "spacer" && !item.flexible ? item.width ?? "" : ""
      const target = overflowed ? (open && overflowHost.current && !item.flexible ? overflowHost.current : parking.current) : host
      const hadFocus = item.node.contains(document.activeElement)
      if (item.node.parentElement !== target) {
        if (target === host) host.insertBefore(item.node, button)
        else target.append(item.node)
      }
      if (overflowed && hadFocus && !open) {
        button.focus()
        // Like UI5 Popup.js/resetFocus clearing _focusedElementBeforeOpen, hand off
        // focus once; a queued Radix callback must not undo subsequent bar navigation.
        restoredOpening.current = opening.current
      }
      // Toolbar.js/shouldShowSeparatorInOverflow hides leading/trailing separators.
      if (overflowed && item.kind === "separator") {
        const index = overflowItems.indexOf(item)
        item.node.toggleAttribute("data-hidden", !overflowItems.slice(0, index).some((it) => it.kind !== "separator") || !overflowItems.slice(index + 1).some((it) => it.kind !== "separator"))
      } else item.node.removeAttribute("data-hidden")
    }
    // Reconcile source order without moving nodes that are already in place: unnecessary
    // append/insertBefore calls would blur a focused field or preventOverflowClosing button.
    for (const target of [host, overflowHost.current, parking.current]) {
      if (!target) continue
      const ordered = (target === overflowHost.current ? overflowItems : items).filter((item) => item.node.parentElement === target)
      let next: Node | null = target === host ? button : null
      for (const item of ordered.reverse()) {
        if (item.node.nextSibling !== next) target.insertBefore(item.node, next)
        next = item.node
      }
    }
    for (const item of items) {
      const saved = hydrationState.current.get(item.key)
      if (!saved) continue
      const fields = item.node.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select")
      saved.forEach((state, index) => {
        const field = fields[index]
        if (!field) return
        if (!(field instanceof HTMLInputElement && field.type === "file")) field.value = state.value
        if (field instanceof HTMLInputElement && state.checked !== undefined) field.checked = state.checked
        if (field instanceof HTMLSelectElement && state.selected) [...field.options].forEach((option, i) => { option.selected = !!state.selected![i] })
        if (state.selection?.[0] !== null && state.selection?.[1] !== null && state.selection && (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) field.setSelectionRange(state.selection[0], state.selection[1], state.selection[2] ?? undefined)
        if (state.focused) { if (item.node.parentElement === parking.current) button.focus(); else field.focus() }
      })
      hydrationState.current.delete(item.key)
    }
    if (!hasOverflow && overflowKeys.length && open) setOpen(false)
  })

  React.useLayoutEffect(() => {
    if (open && hasOverflow && !overflowContentProps?.onOpenAutoFocus) overflowHost.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
  }, [reverseOverflow])

  React.useLayoutEffect(() => {
    if (!mounted || !bar.current) return
    let size = `${bar.current.parentElement!.offsetWidth}/${bar.current.parentElement!.offsetHeight}`
    const observer = new ResizeObserver(() => {
      const root = bar.current?.parentElement
      const nextSize = `${root?.offsetWidth ?? 0}/${root?.offsetHeight ?? 0}`
      if (nextSize !== size) { size = nextSize; close(); layout.current() }
    })
    observer.observe(bar.current.parentElement!)
    document.fonts.ready.then(() => layout.current())
    return () => observer.disconnect()
  }, [mounted, close])

  return <Popover open={open && hasOverflow} onOpenChange={changeOpen}>
    <div data-slot="toolbar" role="toolbar" data-design={design}
      className={cn("fiori-toolbar flex h-(--fiori-x-toolbar-height) w-full items-center", "border-b-(length:--sapGroup_TitleBorderWidth) border-solid border-b-(--sapGroup_TitleBorderColor)", "pe-(--fiori-x-toolbar-padding-right) ps-(--fiori-x-toolbar-padding-left)", design === "transparent" ? "bg-transparent" : "bg-(--sapToolbar_Background)", alignContent === "start" ? "justify-start" : "justify-end", className)}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || !bar.current?.contains(e.target as Node)) return
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return
        const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
        const forward = e.key === (rtl ? "ArrowLeft" : "ArrowRight") || e.key === "Home"
        const active = e.target as HTMLElement
        if (fieldKeepsKey(active, e.key, e.key === "Home" ? false : forward)) return
        const navigable = navigableItems(bar.current)
        const current = navigable.findIndex(({ item }) => item.contains(active))
        if (current === -1) return
        const next = e.key === "Home" ? 0 : e.key === "End" ? navigable.length - 1 : Math.min(Math.max(current + (forward ? 1 : -1), 0), navigable.length - 1)
        e.preventDefault(); e.stopPropagation()
        if (next !== current) navigable[next].target.focus()
      }} {...props}>
      <div ref={bar} data-slot="toolbar-items" className="fiori-toolbar-items">
        {!mounted && React.Children.toArray(children).map((child, index) => {
          const element = React.isValidElement<{ width?: string; hidden?: boolean }>(child) ? child : undefined
          const kind = element?.type === ToolbarSpacer ? "spacer" : element?.type === ToolbarSeparator ? "separator" : "item"
          const unmanaged = !element || ![ToolbarButton, ToolbarItem, ToolbarSpacer, ToolbarSeparator].includes(element.type as typeof ToolbarItem)
          const key = element?.key?.toString() ?? String(index)
          return <div key={key} data-toolbar-initial-key={key} className="fiori-toolbar-container" data-kind={kind}
            data-flexible={kind === "spacer" && (!element?.props.width || element.props.width === "auto") ? "" : undefined}
            data-unmanaged={unmanaged ? "" : undefined} hidden={element?.props.hidden}>{child}</div>
        })}
        <PopoverTrigger asChild><Button ref={overflowButton} variant="transparent" size="icon" className="data-hidden:absolute data-hidden:invisible" data-slot="toolbar-overflow-button" data-hidden={!hasOverflow ? "" : undefined} aria-hidden={!hasOverflow || undefined} tabIndex={hasOverflow ? undefined : -1} aria-label={overflowButtonLabel} aria-haspopup="menu" title={overflowButtonLabel}><Icon icon={overflow} /></Button></PopoverTrigger>
      </div>
      <div ref={parking} hidden />
      {items.map((item) => createPortal(<OverflowContext.Provider value={{ overflowed: overflowKeys.includes(item.key) || item.priority === "alwaysOverflow", close, registerNestedInteraction }}>{item.child}</OverflowContext.Provider>, item.node, item.key))}
    </div>
    <PopoverContent key={renderedOpening} hideArrow side="bottom" align="end" aria-label={overflowPopoverLabel} {...overflowContentProps}
      className={cn("fiori-toolbar-overflow", overflowContentProps?.className)}
      onInteractOutside={(event) => {
        overflowContentProps?.onInteractOutside?.(event)
        // Stable item portals retain their original React ancestry. An item's own picker is
        // therefore a sibling Radix layer; keep the toolbar open while its controlled popup
        // receives focus/interaction, as UI5 ToolbarSelect.onOpen does.
        const target = event.target as Node
        if (overflowHost.current?.contains(target) || isPickerTarget(target) || nestedInteractions.current.has(event.detail.originalEvent)) event.preventDefault()
      }}
      onOpenAutoFocus={(event) => { event.preventDefault(); if (overflowContentProps?.onOpenAutoFocus) overflowContentProps.onOpenAutoFocus(event); else overflowHost.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus() }}
      onCloseAutoFocus={(event) => {
        overflowContentProps?.onCloseAutoFocus?.(event)
        if (!event.defaultPrevented) {
          event.preventDefault()
          // UI5 Toolbar.js/onOverflowPopoverOpened focuses the new overflow item.
          // Radix react-focus-scope queues unmount autofocus. Key each opening so an old
          // callback cannot take focus after a later opening has itself closed.
          if (isOpen.current || renderedOpening !== opening.current || restoredOpening.current === renderedOpening) return
          const target = hasOverflow ? overflowButton.current : bar.current && navigableItems(bar.current).at(-1)?.target
          target?.focus()
          restoredOpening.current = renderedOpening
        }
      }}>
      <div className="fiori-toolbar-overflow-content"><div ref={mountOverflow} className="fiori-toolbar-overflow-list" /></div>
    </PopoverContent>
  </Popover>
}

type ToolbarButtonProps = ButtonProps & ToolbarItemOptions & { overflowText?: React.ReactNode }
function ToolbarButton({ overflowPriority: _priority, preventOverflowClosing = false, overflowText, size, children, onClick, className, ...props }: ToolbarButtonProps) {
  const { overflowed, close } = React.useContext(OverflowContext)
  const text = overflowText ?? props.title ?? props["aria-label"]
  const showText = overflowed && size === "icon" && !!text
  const content = showText && props.asChild && React.isValidElement<{ children?: React.ReactNode }>(children)
    ? React.cloneElement(children, {}, <>{children.props.children}<span>{text}</span></>)
    : <>{children}{showText && <span>{text}</span>}</>
  return <Button data-toolbar-item="" data-overflowed={overflowed ? "" : undefined} size={overflowed ? "default" : size} className={cn(overflowed && "fiori-toolbar-overflow-button w-full justify-start px-(--fiori-button-base-padding)", className)}
    onClick={(event) => { onClick?.(event); if (!event.defaultPrevented && !preventOverflowClosing && overflowed) close() }} {...props}>{props.asChild && !showText ? children : content}</Button>
}

type ToolbarItemProps = React.ComponentProps<"div"> & ToolbarItemOptions
function ToolbarItem({ overflowPriority: _priority, preventOverflowClosing = false, className, children, ref, ...props }: ToolbarItemProps) {
  const { overflowed, close, registerNestedInteraction } = React.useContext(OverflowContext)
  const wrapper = React.useRef<HTMLDivElement>(null)
  React.useImperativeHandle(ref, () => wrapper.current!, [])
  const currentKey = React.useRef<React.KeyboardEvent<HTMLDivElement> | null>(null)
  const closeOnEvent = (type: "click" | "change" | "selection-change") => {
    if (!overflowed || preventOverflowClosing) return
    // ToolbarItem.js/getClosingEvents derives event types from the first rendered
    // control; attachCloseOverflowHandlers then accepts that type from any child.
    const first = wrapper.current?.firstElementChild as HTMLElement | null
    // A function component may add its own data-slot to a DOM wrapper. Resolve
    // component roots through it, including nonclosing Input/CheckBox/Link roots.
    const controlRoots = '[data-slot="button"], [data-slot="select-trigger-wrapper"], [data-slot="combobox"], [data-slot="multi-combobox"], [data-slot="picker-field"], [data-slot="switch"], [data-slot="input"], [data-slot="checkbox"], [data-slot="link"]'
    const control = first?.matches(controlRoots) ? first : first?.querySelector<HTMLElement>(controlRoots)
    // PickerField owns the field frame; DatePicker marks its native input.
    const slot = control?.dataset.slot === "picker-field" ? control.querySelector<HTMLInputElement>("input")?.dataset.slot : control?.dataset.slot
    const closingType = slot === "button" ? "click" : slot === "multi-combobox" ? "selection-change"
      : slot && ["select-trigger-wrapper", "combobox", "date-picker", "switch"].includes(slot) ? "change" : undefined
    if (type !== closingType) return
    // UI5 ToolbarItem/getClosingEvents closes on the committed change, and
    // Popup.closePopup/resetFocus restores the opener. With React's native opener,
    // suppress the committing Enter's default activation after that focus transfer.
    if (currentKey.current?.key === "Enter") currentKey.current.preventDefault()
    close()
  }
  React.useLayoutEffect(() => {
    const node = wrapper.current
    const onChange = () => closeOnEvent("change")
    const onSelectionChange = () => closeOnEvent("selection-change")
    // Semantic committed events bubble through opaque function components. Raw
    // native/React input events must not substitute for UI5's committed change.
    node?.addEventListener("fiori-control-change", onChange)
    node?.addEventListener("fiori-control-selection-change", onSelectionChange)
    return () => {
      node?.removeEventListener("fiori-control-change", onChange)
      node?.removeEventListener("fiori-control-selection-change", onSelectionChange)
    }
  })
  // Retain committed callback bridges for known controls, including later siblings
  // of the same event type. Input/CheckBox/Link do not define a closing event type.
  const bridgeCommittedEvents = (nodes: React.ReactNode): React.ReactNode => React.Children.map(nodes, (child) => {
    if (!React.isValidElement(child)) return child
    if (child.type === React.Fragment) {
      const fragment = child as React.ReactElement<{ children?: React.ReactNode }>
      return React.cloneElement(fragment, {}, bridgeCommittedEvents(fragment.props.children))
    }
    if (child.type === Select) {
      const element = child as React.ReactElement<React.ComponentProps<typeof Select>>
      return React.cloneElement(element, { onValueChange: (value) => { element.props.onValueChange?.(value); closeOnEvent("change") } })
    }
    if (child.type === ComboBox) {
      const element = child as React.ReactElement<React.ComponentProps<typeof ComboBox>>
      return React.cloneElement(element, { onCommit: (value) => { element.props.onCommit?.(value); closeOnEvent("change") } })
    }
    if (child.type === MultiComboBox) {
      const element = child as React.ReactElement<React.ComponentProps<typeof MultiComboBox>>
      return React.cloneElement(element, { onSelectionChange: (values) => { element.props.onSelectionChange?.(values); closeOnEvent("selection-change") } })
    }
    if (child.type === DatePicker) {
      const element = child as React.ReactElement<React.ComponentProps<typeof DatePicker>>
      return React.cloneElement(element, { onValueChange: (value, date) => { element.props.onValueChange?.(value, date); closeOnEvent("change") } })
    }
    if (child.type === Switch) {
      const element = child as React.ReactElement<React.ComponentProps<typeof Switch>>
      return React.cloneElement(element, { onCheckedChange: (checked) => { element.props.onCheckedChange?.(checked); closeOnEvent("change") } })
    }
    return child
  })
  return <div ref={wrapper} data-slot="toolbar-item" className={cn("fiori-toolbar-item", overflowed && "w-full", className)} {...props}
    // UI5 ToolbarItem owns its picker's interactions. React portal descendants
    // retain this ancestry even when their surface has no aria-controls link.
    onPointerDownCapture={(event) => {
      if (overflowed && !event.currentTarget.contains(event.target as Node)) registerNestedInteraction(event.nativeEvent)
      props.onPointerDownCapture?.(event)
    }}
    onFocusCapture={(event) => {
      if (overflowed && !event.currentTarget.contains(event.target as Node)) registerNestedInteraction(event.nativeEvent)
      props.onFocusCapture?.(event)
    }}
    onClick={(event) => {
      props.onClick?.(event)
      // ToolbarItem.js/attachCloseOverflowHandlers listens on the item itself, so
      // every descendant click closes when its first control maps to Button.
      // Resolve the rendered component root, including function/DOM wrappers,
      // instead of inspecting the React owner or attaching to one child Button.
      closeOnEvent("click")
    }}
    onKeyDownCapture={(event) => { currentKey.current = event; props.onKeyDownCapture?.(event) }}
    onKeyDown={(event) => { props.onKeyDown?.(event); currentKey.current = null }}>{bridgeCommittedEvents(children)}</div>
}

type ToolbarSpacerProps = React.ComponentProps<"div"> & { width?: string }
function ToolbarSpacer({ width, className, style, ...props }: ToolbarSpacerProps) {
  const flexible = !width || width === "auto"
  return <div data-slot="toolbar-spacer" data-flexible={flexible ? "" : undefined} aria-hidden className={cn(flexible && "flex-auto", className)} style={flexible ? style : { width, ...style }} {...props} />
}

function ToolbarSeparator({ className, ...props }: React.ComponentProps<"div">) {
  const { overflowed } = React.useContext(OverflowContext)
  return <div data-slot="toolbar-separator" role="separator" aria-orientation={overflowed ? "horizontal" : "vertical"} className={cn("fiori-toolbar-separator", className)} {...props} />
}

export { Toolbar, ToolbarButton, ToolbarItem, ToolbarSpacer, ToolbarSeparator, type ToolbarProps, type ToolbarButtonProps, type ToolbarItemProps, type ToolbarItemOptions }
