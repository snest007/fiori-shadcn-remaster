import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"
import { overflow } from "@/lib/fiori-icons"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Popover, PopoverContent, PopoverTrigger, type PopoverContentProps } from "@/components/ui/popover"
import { Select } from "@/components/ui/select"

type ToolbarItemOptions = {
  overflowPriority?: "default" | "neverOverflow" | "alwaysOverflow"
  preventOverflowClosing?: boolean
}

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

const OverflowContext = React.createContext({ overflowed: false, close: () => {} })
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

function Toolbar({ alignContent = "end", design = "solid", overflowButtonLabel = "Additional Options", overflowPopoverLabel = "Available actions", defaultOverflowOpen = false, overflowContentProps, className, onKeyDown, children, ...props }: ToolbarProps) {
  const bar = React.useRef<HTMLDivElement>(null)
  const parking = React.useRef<HTMLDivElement>(null)
  const overflowHost = React.useRef<HTMLDivElement>(null)
  const overflowButton = React.useRef<HTMLButtonElement>(null)
  const records = React.useRef(new Map<string, ItemRecord>())
  const widths = React.useRef(new Map<string, number>())
  // Parent effects and refs must see the original children on the first browser commit.
  // SSR remains portal-free; the client containers do not add markup to the server's bar.
  const [mounted, setMounted] = React.useState(() => typeof document !== "undefined")
  const [overflowKeys, setOverflowKeys] = React.useState<string[]>([])
  const [open, setOpen] = React.useState(defaultOverflowOpen)
  React.useLayoutEffect(() => setMounted(true), [])
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
  const hasOverflow = overflowItems.some((item) => item.kind !== "separator" && !item.node.hidden)
  const isOpen = React.useRef(false)
  isOpen.current = open && hasOverflow
  const close = React.useCallback(() => setOpen(false), [])
  const layout = React.useRef<() => void>(() => {})
  // Radix Presence can mount after the toolbar's layout effect. Relocate the stable containers
  // at the content ref boundary as well, before its autofocus/focus-trap effects run.
  const mountOverflow = React.useCallback((node: HTMLDivElement | null) => {
    const previous = overflowHost.current
    overflowHost.current = node
    if (node) {
      for (const key of overflowKeys) {
        const item = records.current.get(key)
        if (item && !item.flexible) node.append(item.node)
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
      if (overflowed && hadFocus && !open) button.focus()
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
    if (!hasOverflow && overflowKeys.length && open) setOpen(false)
  })

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

  return <Popover open={open && hasOverflow} onOpenChange={setOpen}>
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
        <PopoverTrigger asChild><Button ref={overflowButton} variant="transparent" size="icon" className="data-hidden:absolute data-hidden:invisible" data-slot="toolbar-overflow-button" data-hidden={!hasOverflow ? "" : undefined} aria-hidden={!hasOverflow || undefined} tabIndex={hasOverflow ? undefined : -1} aria-label={overflowButtonLabel} aria-haspopup="menu" title={overflowButtonLabel}><Icon icon={overflow} /></Button></PopoverTrigger>
      </div>
      <div ref={parking} hidden />
      {items.map((item) => createPortal(<OverflowContext.Provider value={{ overflowed: overflowKeys.includes(item.key) || item.priority === "alwaysOverflow", close }}>{item.child}</OverflowContext.Provider>, item.node, item.key))}
    </div>
    <PopoverContent hideArrow side="bottom" align="end" aria-label={overflowPopoverLabel} {...overflowContentProps}
      className={cn("fiori-toolbar-overflow", overflowContentProps?.className)}
      onInteractOutside={(event) => {
        overflowContentProps?.onInteractOutside?.(event)
        // Stable item portals retain their original React ancestry. An item's own picker is
        // therefore a sibling Radix layer; keep the toolbar open while its controlled popup
        // receives focus/interaction, as UI5 ToolbarSelect.onOpen does.
        const target = event.target as Node
        const controls = overflowHost.current?.querySelectorAll<HTMLElement>("[aria-controls]") ?? []
        for (const control of controls) {
          if (control.getAttribute("aria-controls")?.split(/\s+/).some((id) => document.getElementById(id)?.contains(target))) event.preventDefault()
        }
      }}
      onOpenAutoFocus={(event) => { event.preventDefault(); if (overflowContentProps?.onOpenAutoFocus) overflowContentProps.onOpenAutoFocus(event); else overflowHost.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus() }}
      onCloseAutoFocus={(event) => {
        overflowContentProps?.onCloseAutoFocus?.(event)
        if (!event.defaultPrevented) {
          event.preventDefault()
          // UI5 Toolbar.js/onOverflowPopoverOpened focuses the newly opened overflow item.
          // Radix schedules unmount focus restoration; an old scope must not steal that focus.
          if (isOpen.current) return
          const target = hasOverflow ? overflowButton.current : bar.current && navigableItems(bar.current).at(-1)?.target
          target?.focus()
        }
      }}>
      <div ref={mountOverflow} className="fiori-toolbar-overflow-list" />
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
function ToolbarItem({ overflowPriority: _priority, preventOverflowClosing = false, className, onClick, onChange, children, ...props }: ToolbarItemProps) {
  const { overflowed, close } = React.useContext(OverflowContext)
  // ToolbarItem.js/getClosingEvents closes Select on change, not when its picker opens.
  // React Select reports a callback (rather than a bubbling DOM change event), so bridge it here.
  const content = React.Children.map(children, (child) => {
    if (!React.isValidElement<React.ComponentProps<typeof Select>>(child) || child.type !== Select) return child
    return React.cloneElement(child, { onValueChange: (value) => {
      child.props.onValueChange?.(value)
      if (overflowed && !preventOverflowClosing) close()
    } })
  })
  return <div data-slot="toolbar-item" className={cn("fiori-toolbar-item", overflowed && "w-full [&>*]:w-full!", className)} {...props}
    onClick={(event) => { onClick?.(event); if (overflowed && !preventOverflowClosing && !event.defaultPrevented && (event.target as HTMLElement).closest("button:not([role='combobox']), a[href]")) close() }}
    onChange={(event) => {
      onChange?.(event)
      // Radix Select's aria-hidden native select synchronizes values with synthetic change
      // events. Its public callback above owns closing.
      const target = event.target as HTMLElement
      if (overflowed && !preventOverflowClosing && !event.defaultPrevented && target.getAttribute("aria-hidden") !== "true") close()
    }}>{content}</div>
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
