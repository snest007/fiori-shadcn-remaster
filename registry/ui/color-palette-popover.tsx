import * as React from "react"
import { Slot } from "radix-ui"
import { createPortal } from "react-dom"

import { ColorPalette, ColorPaletteStateContext, ColorPaletteStateProvider, type ColorPaletteProps } from "@/components/ui/color-palette"
import { type PopoverContentProps } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type ColorPalettePopoverProps = Omit<ColorPaletteProps, "ref" | "popupMode"> & {
  open?: boolean
  defaultOpen?: boolean
  opener?: HTMLElement | React.RefObject<HTMLElement | null> | string | null
  onOpenChange?: (open: boolean) => void
  placement?: "Bottom" | "Top" | "Start" | "End" | "Left" | "Right"
  popoverLabel?: string
  portal?: boolean
  contentProps?: Omit<PopoverContentProps, "children" | "side" | "hideArrow" | "portal">
}

type PalettePopup = {
  node: HTMLElement
  reposition: () => void
  isOpener: (event: Event) => boolean
  pointerOutside: (event: MouseEvent | PointerEvent) => boolean
  focusOutside: (event: FocusEvent) => void
  escape: (event: KeyboardEvent) => boolean
  iframeFocus: (element: HTMLElement) => void
}
const openedPalettes: PalettePopup[] = []
let positionInterval: number | undefined
let originalPointer: PointerEvent | undefined
const repositionOpenPalettes = () => { [...openedPalettes].forEach((popup) => popup.reposition()) }
const updateOpenPalettes = () => {
  // PopoverRegistry.js:29-33 repositions first, then checks only deep IFRAME focus on its shared 300ms tick.
  repositionOpenPalettes()
  const focused = getFocusedElement()
  if (focused?.tagName === "IFRAME") [...openedPalettes].reverse().forEach((popup) => popup.iframeFocus(focused))
}
const rememberPointer = (event: PointerEvent) => { originalPointer = event }
const dismissOnMouseDown = (event: MouseEvent) => {
  // PopoverRegistry.clickHandler and Popover.isClicked use the actual painted rectangle, not DOM ancestry.
  const original = originalPointer && originalPointer.target === event.target && originalPointer.clientX === event.clientX && originalPointer.clientY === event.clientY ? originalPointer : event
  originalPointer = undefined
  for (const popup of [...openedPalettes].reverse()) {
    const rect = popup.node.getBoundingClientRect()
    if (popup.isOpener(event) || event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) return
    if (!popup.pointerOutside(original)) return
  }
}
const notifyOutsideFocus = (event: FocusEvent) => {
  [...openedPalettes].forEach((popup) => { if (!event.composedPath().includes(popup.node)) popup.focusOutside(event) })
}
const dismissOnEscape = (event: KeyboardEvent) => {
  // OpenedPopupsRegistry.js:42-56 handles only the topmost unmarked, modifier-free Escape at document bubble.
  // Unlike target stopPropagation, target preventDefault does not suppress UI5's Escape close.
  if (!(event.key ? event.key === "Escape" || event.key === "Esc" : event.keyCode === 27)
    || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || (event as KeyboardEvent & { _sapui_handledByControl?: boolean })._sapui_handledByControl) return
  const popup = openedPalettes.at(-1)
  if (popup?.escape(event)) event.stopImmediatePropagation()
}
function registerPalettePopup(popup: PalettePopup) {
  openedPalettes.push(popup)
  popup.node.addEventListener("scroll", repositionOpenPalettes, true)
  if (openedPalettes.length === 1) {
    document.addEventListener("scroll", repositionOpenPalettes, true)
    document.addEventListener("pointerdown", rememberPointer, true)
    document.addEventListener("mousedown", dismissOnMouseDown, true)
    document.addEventListener("focusin", notifyOutsideFocus, true)
    document.addEventListener("keydown", dismissOnEscape)
    positionInterval = window.setInterval(updateOpenPalettes, 300)
  }
  return () => {
    const index = openedPalettes.indexOf(popup)
    if (index !== -1) openedPalettes.splice(index, 1)
    popup.node.removeEventListener("scroll", repositionOpenPalettes, true)
    if (!openedPalettes.length) {
      document.removeEventListener("scroll", repositionOpenPalettes, true)
      document.removeEventListener("pointerdown", rememberPointer, true)
      document.removeEventListener("mousedown", dismissOnMouseDown, true)
      document.removeEventListener("focusin", notifyOutsideFocus, true)
      document.removeEventListener("keydown", dismissOnEscape)
      window.clearInterval(positionInterval)
      positionInterval = undefined
      originalPointer = undefined
    }
  }
}
function getFocusedElement() {
  // PopupUtils.js getFocusedElement -> getActiveElement.js follows every open ShadowRoot.
  let element = document.activeElement
  while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement
  return element && "focus" in element && typeof element.focus === "function" ? element as HTMLElement : null
}
function dispatchOutsideEvent(type: "pointerDownOutside" | "focusOutside", originalEvent: MouseEvent | PointerEvent | FocusEvent,
  specific: PopoverContentProps["onPointerDownOutside"] | PopoverContentProps["onFocusOutside"], interact: PopoverContentProps["onInteractOutside"]) {
  const event = new CustomEvent(`dismissableLayer.${type}`, { cancelable: true, detail: { originalEvent } })
  const call = () => { specific?.(event as never); interact?.(event as never) }
  if (originalEvent.target) {
    originalEvent.target.addEventListener(event.type, call, { once: true })
    originalEvent.target.dispatchEvent(event)
  } else call()
  return event.defaultPrevented
}
function dispatchFocusEvent(node: HTMLElement, type: "autoFocusOnMount" | "autoFocusOnUnmount", handler: PopoverContentProps["onOpenAutoFocus"]) {
  const event = new Event(`focusScope.${type}`, { cancelable: true })
  if (handler) node.addEventListener(event.type, handler, { once: true })
  node.dispatchEvent(event)
}

type NativePaletteContentProps = PopoverContentProps & {
  active: boolean
  getAnchorRect: () => DOMRect
  isOpener: (event: Event) => boolean
  onDismiss: (preserveFocus?: boolean) => void
  onBeforeOpen: () => void
  reposition: () => void
}
/** Popup.js owns one native manual-popover surface; only painted popups join the interaction registry. */
function NativePaletteContent({ active, getAnchorRect, isOpener, onDismiss, onBeforeOpen, reposition, children, className, ref,
  side = "bottom", align = "center", sideOffset = 0, alignOffset = 0, collisionPadding, collisionBoundary, avoidCollisions = true,
  arrowPadding: _arrowPadding, sticky: _sticky, hideWhenDetached, updatePositionStrategy = "optimized", asChild, portal = true,
  hideArrow: _arrow, forceMount: _force, onOpenAutoFocus, onCloseAutoFocus, onPointerDownOutside, onFocusOutside, onInteractOutside,
  onEscapeKeyDown, onKeyDown, style, ...props }: NativePaletteContentProps) {
  const root = React.useRef<HTMLDivElement | null>(null)
  const content = React.useRef<HTMLDivElement | null>(null)
  const place = React.useRef<() => void>(() => {})
  const wasActive = React.useRef(false)
  const handlers = React.useRef({ isOpener, onDismiss, onBeforeOpen, reposition, onPointerDownOutside, onFocusOutside, onInteractOutside, onEscapeKeyDown, onOpenAutoFocus, onCloseAutoFocus })
  React.useLayoutEffect(() => { handlers.current = { isOpener, onDismiss, onBeforeOpen, reposition, onPointerDownOutside, onFocusOutside, onInteractOutside, onEscapeKeyDown, onOpenAutoFocus, onCloseAutoFocus } })
  const mount = React.useCallback((node: HTMLDivElement | null) => {
    root.current = node
    if (typeof ref === "function") {
      const cleanup = ref(node)
      if (typeof cleanup === "function") return () => { if (root.current === node) root.current = null; cleanup() }
      return
    }
    if (ref) ref.current = node
  }, [ref])
  React.useLayoutEffect(() => {
    place.current = () => {
      const node = root.current
      if (!node || !active || !node.matches(":popover-open")) return
      if (node.hasAttribute("data-missing-opener-origin")) { node.style.left = "0px"; node.style.top = "0px"; return }
      const rect = getAnchorRect()
      const tokenMargin = parseFloat(getComputedStyle(node).getPropertyValue("--fiori-popup-viewport-margin"))
      const padding = (edge: "left" | "top" | "right" | "bottom") => typeof collisionPadding === "number" ? collisionPadding : collisionPadding?.[edge] ?? tokenMargin
      const boundaries = (Array.isArray(collisionBoundary) ? collisionBoundary : [collisionBoundary]).filter((boundary): boundary is Element => !!boundary)
      const limit = boundaries.reduce((limits, boundary) => {
        const box = boundary.getBoundingClientRect()
        return { left: Math.max(limits.left, box.left), top: Math.max(limits.top, box.top), right: Math.min(limits.right, box.right), bottom: Math.min(limits.bottom, box.bottom) }
      }, { left: 0, top: 0, right: document.documentElement.clientWidth, bottom: document.documentElement.clientHeight })
      const viewportWidth = limit.right - limit.left, viewportHeight = limit.bottom - limit.top
      node.style.setProperty("--radix-popover-content-available-width", `${Math.max(0, viewportWidth - padding("right"))}px`)
      node.style.setProperty("--radix-popover-content-available-height", `${Math.max(0, viewportHeight - padding("bottom"))}px`)
      const box = node.getBoundingClientRect()
      // Popover.getPopoverSize(true) uses the scrolling content's complete height when choosing placement.
      const width = box.width, height = Math.max(box.height, content.current?.scrollHeight ?? 0)
      const topSpace = rect.top - limit.top, bottomSpace = limit.bottom - padding("bottom") - rect.bottom
      const leftSpace = rect.left - limit.left, rightSpace = limit.right - rect.right
      let actualSide = side
      if (avoidCollisions) {
        // Popover.getActualPlacement/fallbackPlacement: flip vertical only for more room; horizontal fallback tries L/R/B/T.
        if (side === "top" && topSpace < height + sideOffset && topSpace < bottomSpace) actualSide = "bottom"
        else if (side === "bottom" && bottomSpace < height + sideOffset && bottomSpace < topSpace) actualSide = "top"
        else if (side === "left" && leftSpace < width + sideOffset || side === "right" && rightSpace < width + sideOffset) {
          if (leftSpace > width + sideOffset) actualSide = "left"
          else if (rightSpace > leftSpace) actualSide = "right"
          else if (bottomSpace > height + sideOffset) actualSide = "bottom"
          else if (bottomSpace < topSpace) actualSide = "top"
        }
      }
      const vertical = actualSide === "top" || actualSide === "bottom", rtl = node.matches(":dir(rtl)")
      const start = vertical ? rtl ? rect.right - width : rect.left : rect.top
      const end = vertical ? rtl ? rect.left : rect.right - width : rect.bottom - height
      const offset = alignOffset * (align === "end" ? -1 : 1) * (vertical && rtl ? -1 : 1)
      const cross = (align === "start" ? start : align === "end" ? end : vertical ? rect.left + (rect.width - width) / 2 : rect.top + (rect.height - height) / 2) + offset
      let x = vertical ? cross : actualSide === "right" ? rect.right + sideOffset : Math.max(rect.left - width - sideOffset, limit.left)
      let y = vertical ? actualSide === "bottom" ? rect.bottom + sideOffset : Math.max(rect.top - height - sideOffset, limit.top) : cross
      let availableHeight = viewportHeight - padding("bottom"), availableWidth = viewportWidth - padding("right")
      if (avoidCollisions) {
        // Popover.calcPlacement:488-542 limits the root on the main axis instead of moving its full box across the opener.
        if (actualSide === "top") availableHeight = topSpace - sideOffset - padding("top")
        else if (actualSide === "bottom") availableHeight = limit.bottom - rect.bottom - sideOffset - padding("bottom")
        else if (actualSide === "left") availableWidth = leftSpace - sideOffset - padding("left")
        else availableWidth = rightSpace - sideOffset - padding("right")
        if (vertical) {
          if (width > viewportWidth || x < limit.left + padding("left")) x = limit.left + padding("left")
          else if (x + width > limit.right - padding("right")) x = limit.right - padding("right") - width
        } else {
          if (height > viewportHeight || y < limit.top + padding("top")) y = limit.top + padding("top")
          else if (y + height > limit.bottom - padding("bottom")) y = limit.bottom - padding("bottom") - height
        }
      }
      node.style.setProperty("--radix-popover-content-available-width", `${Math.max(0, Math.round(availableWidth))}px`)
      node.style.setProperty("--radix-popover-content-available-height", `${Math.max(0, Math.round(availableHeight))}px`)
      node.style.setProperty("--radix-popover-trigger-width", `${rect.width}px`)
      node.style.setProperty("--radix-popover-trigger-height", `${rect.height}px`)
      node.style.setProperty("--radix-popover-content-transform-origin", vertical ? `50% ${actualSide === "top" ? "100%" : "0%"}` : `${actualSide === "left" ? "100%" : "0%"} 50%`)
      node.dataset.side = actualSide
      // Popover.calcPlacement keeps a 1.5px dead band and rounds coordinates after applying placement.
      if (!node.style.left || Math.abs(parseFloat(node.style.left) - x) > 1.5) node.style.left = `${Math.round(x)}px`
      if (!node.style.top || Math.abs(parseFloat(node.style.top) - y) > 1.5) node.style.top = `${Math.round(y)}px`
      const detached = rect.bottom < limit.top || rect.top > limit.bottom || rect.right < limit.left || rect.left > limit.right
      node.style.visibility = hideWhenDetached && detached ? "hidden" : style?.visibility ?? ""
      node.dataset.mediaRange = width < 600 ? "S" : width < 1024 ? "M" : width < 1440 ? "L" : "XL"
    }
    const node = root.current
    if (!node) return
    if (active && !wasActive.current) {
      handlers.current.onBeforeOpen()
      node.showPopover()
      wasActive.current = true
      place.current()
      dispatchFocusEvent(node, "autoFocusOnMount", handlers.current.onOpenAutoFocus)
    } else if (!active && wasActive.current) {
      node.hidePopover()
      wasActive.current = false
      dispatchFocusEvent(node, "autoFocusOnUnmount", handlers.current.onCloseAutoFocus)
    } else place.current()
  })
  React.useLayoutEffect(() => () => {
    const node = root.current
    if (node && wasActive.current) {
      node.hidePopover()
      wasActive.current = false
      dispatchFocusEvent(node, "autoFocusOnUnmount", handlers.current.onCloseAutoFocus)
    }
  }, [])
  React.useLayoutEffect(() => {
    const node = root.current
    if (!active || !node) return
    let pointerTarget: EventTarget | null = null
    let canceledFocus: HTMLElement | null = null
    const unregister = registerPalettePopup({ node, reposition: () => handlers.current.reposition(), isOpener: (event) => handlers.current.isOpener(event),
      pointerOutside: (event) => {
        pointerTarget = event.target
        const canceled = dispatchOutsideEvent("pointerDownOutside", event, handlers.current.onPointerDownOutside, handlers.current.onInteractOutside)
        if (!canceled) handlers.current.onDismiss()
        return !canceled
      }, focusOutside: (event) => {
        if (event.target === pointerTarget) return
        // Popup._onfocusout records focus; ordinary outside focus never dismisses. React callbacks remain observable/cancelable.
        const canceled = dispatchOutsideEvent("focusOutside", event, handlers.current.onFocusOutside, handlers.current.onInteractOutside)
        canceledFocus = canceled ? getFocusedElement() : null
      }, escape: (event) => {
        // UI5 ignores an Item's preventDefault. Track only this caller's cancellation without resetting the original event.
        let callerCanceled = false
        const callerEvent = new Proxy(event, { get(target, property) {
          if (property === "preventDefault") return () => { callerCanceled = true; target.preventDefault() }
          const value = Reflect.get(target, property, target)
          return typeof value === "function" ? value.bind(target) : value
        } })
        handlers.current.onEscapeKeyDown?.(callerEvent)
        if (callerCanceled || event.cancelBubble) return false
        handlers.current.onDismiss()
        return true
      }, iframeFocus: (element) => {
        if (element === canceledFocus) return
        let current: Node | null = element
        while (current) {
          if (handlers.current.isOpener(new CustomEvent("iframeFocus", { detail: { element: current } }))) return
          current = current.parentNode ?? (current.getRootNode() instanceof ShadowRoot ? (current.getRootNode() as ShadowRoot).host : null)
        }
        handlers.current.onDismiss(true)
      } })
    const click = () => { pointerTarget = null }
    document.addEventListener("click", click, true)
    let frame = 0
    if (updatePositionStrategy === "always") {
      // Only the caller's explicit "always" strategy adds RAF updates; UI5's default remains the shared 300ms registry.
      const tick = () => { place.current(); frame = requestAnimationFrame(tick) }
      frame = requestAnimationFrame(tick)
    }
    return () => { unregister(); document.removeEventListener("click", click, true); cancelAnimationFrame(frame) }
  }, [active, updatePositionStrategy])
  const Root = asChild ? Slot.Root : "div"
  const surface = <Root {...props} ref={mount} popover="manual" role={props.role ?? "dialog"} tabIndex={props.tabIndex ?? -1}
    data-native-palette="" data-state={active ? "open" : "closed"} data-align={align} data-hide-arrow="" data-media-range="S"
    className={cn("fiori-popup fiori-popover-surface z-50 outline-none", className)} style={style}
    onKeyDown={(event) => {
      onKeyDown?.(event)
      if (event.defaultPrevented || event.key !== "Tab") return
      // Popup.forwardToFirst/forwardToLast wraps the boundary after the palette handles its own row Tab selection.
      const buttons = [...(root.current?.querySelectorAll<HTMLElement>("button:not([disabled]),[data-color-palette-area]:not([data-disabled])") ?? [])].filter((button) => !button.closest("[hidden]"))
      const target = event.shiftKey ? buttons.at(-1) : buttons[0]
      if (target && event.target === (event.shiftKey ? buttons[0] : buttons.at(-1))) { event.preventDefault(); target.focus() }
    }}><div className="fiori-popup__root"><div ref={content} className="fiori-color-palette-popover__content">{children}</div></div></Root>
  return portal ? createPortal(surface, document.body) : surface
}

function PalettePopoverSurface({ open: controlled, defaultOpen = false, opener, onOpenChange, placement = "Bottom", popoverLabel = "Color Palette",
  portal = true, contentProps, className, id, ...paletteProps }: ColorPalettePopoverProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen)
  const open = controlled ?? uncontrolled
  const state = React.useContext(ColorPaletteStateContext)!
  const paletteRef = React.useRef<HTMLDivElement | null>(null)
  const previousFocus = React.useRef<HTMLElement | null>(null)
  const directionRef = React.useRef<HTMLDivElement | null>(null)
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null)
  const [observedAnchor, setObservedAnchor] = React.useState<HTMLElement | null>(null)
  const retainedOpenerRect = React.useRef<DOMRect | null>(null)
  const [anchorVisible, setAnchorVisible] = React.useState(false)
  const dismissedRequest = React.useRef(false)
  const [missingActiveOpener, setMissingActiveOpener] = React.useState(false)
  const [contentMounted, setContentMounted] = React.useState(false)
  const contentNode = React.useRef<HTMLDivElement | null>(null)
  const mountContent = React.useCallback((node: HTMLDivElement | null) => { contentNode.current = node; setContentMounted(!!node) }, [])
  const [missingOpenerOrigin, setMissingOpenerOrigin] = React.useState(false)
  const [positionVersion, updatePosition] = React.useReducer((value: number) => value + 1, 0)
  const repositionRequest = React.useRef<() => void>(() => {})
  const missingOpenerRef = React.useRef(false)
  React.useLayoutEffect(() => {
    missingOpenerRef.current = missingActiveOpener
    if (!missingActiveOpener && missingOpenerOrigin) setMissingOpenerOrigin(false)
  }, [missingActiveOpener, missingOpenerOrigin])
  const forceMount = contentProps?.forceMount === true
  const preserveCloseFocus = React.useRef(false)
  const focusedRequest = React.useRef(false)
  const [rtl, setRtl] = React.useState(paletteProps.dir === "rtl")
  React.useLayoutEffect(() => {
    // Popover.js getActualPlacement/isRtl -> getEffectiveDir.js uses the popup's own inherited :dir.
    const next = directionRef.current?.matches(":dir(rtl)") ?? false
    if (next !== rtl) setRtl(next)
  })
  const side = placement === "Start" ? rtl ? "right" : "left" : placement === "End" ? rtl ? "left" : "right" : placement.toLowerCase() as "bottom" | "top" | "left" | "right"
  const resolveOpener = () => {
    if (typeof opener !== "string") return opener && "current" in opener ? opener.current : opener ?? null
    // Popover.js getOpenerHTMLElement searches the owning root, then falls back from ShadowRoot to document.
    const root = directionRef.current?.getRootNode() as Document | ShadowRoot | undefined
    return root?.getElementById(opener) ?? document.getElementById(opener)
  }
  const anchorRef = React.useMemo(() => ({ current: { getBoundingClientRect: () => {
    if (missingActiveOpener) return missingOpenerOrigin ? new DOMRect() : retainedOpenerRect.current ?? new DOMRect()
    const node = resolveOpener()
    const rect = node?.getBoundingClientRect() ?? new DOMRect()
    // _show refreshes the live opener rectangle on real positioning; a later clear retains this painted geometry.
    if (node) retainedOpenerRect.current = rect
    return rect
  } } }), [anchor, missingActiveOpener, missingOpenerOrigin, positionVersion])
  const isOpenerEvent = (event: Event) => {
    const node = resolveOpener()
    if (event instanceof CustomEvent && event.type === "iframeFocus") return event.detail.element === node
    return !!node && (event.composedPath().includes(node) || event.target instanceof Node && node.contains(event.target))
  }
  const changeOpen = React.useCallback((next: boolean) => {
    if (controlled === undefined) setUncontrolled(next)
    onOpenChange?.(next)
  }, [controlled, onOpenChange])
  React.useLayoutEffect(() => {
    const next = resolveOpener()
    if (!open) {
      dismissedRequest.current = false
      if (next !== anchor) setAnchor(next)
      if (observedAnchor) setObservedAnchor(null)
      if (anchorVisible) setAnchorVisible(false)
      if (missingActiveOpener) setMissingActiveOpener(false)
      return
    }
    // Popover.js opener setter preserves an already-open popup and its old observer when the reference is cleared.
    if (!next) {
      if (anchorVisible && observedAnchor?.isConnected) { if (!missingActiveOpener) setMissingActiveOpener(true); return }
      if (anchorVisible) setAnchorVisible(false)
      if (observedAnchor && !observedAnchor.isConnected && !dismissedRequest.current) { dismissedRequest.current = true; changeOpen(false) }
      return // Initial missing opener keeps requested open without painting or firing close.
    }
    if (next !== anchor) setAnchor(next)
    if (missingActiveOpener) setMissingActiveOpener(false)
    const rect = next.getBoundingClientRect()
    retainedOpenerRect.current = rect
    // isOpenerOutsideViewport uses strict edges; an initially offviewport opener closes after the own commit.
    const outside = rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth
    if (outside) {
      if (anchorVisible) setAnchorVisible(false)
      if (!dismissedRequest.current) { dismissedRequest.current = true; changeOpen(false) }
    } else if (!dismissedRequest.current) {
      if (!observedAnchor) setObservedAnchor(next) // openPopup observes its initial actual opener only once per open lifecycle.
      if (!anchorVisible) setAnchorVisible(true)
    }
  })
  React.useLayoutEffect(() => {
    if (!open || !observedAnchor || dismissedRequest.current) return
    // Popover.js _observeOpenerVisibility/_onOpenerIntersection observes actual clipping, hiding and removal.
    let active = true
    const observer = new IntersectionObserver(([entry]) => {
      if (active && !entry?.isIntersecting && !dismissedRequest.current) {
        dismissedRequest.current = true
        setAnchorVisible(false)
        changeOpen(false)
      }
    })
    observer.observe(observedAnchor)
    return () => { active = false; observer.disconnect() }
  }, [open, observedAnchor, changeOpen])
  const paintedOpen = open && anchorVisible
  React.useLayoutEffect(() => {
    repositionRequest.current = () => {
      // Popover._resize/reposition/_show recomputes physical origin whenever the active opener is missing.
      if (missingOpenerRef.current) setMissingOpenerOrigin(true)
      else updatePosition()
    }
  })
  React.useLayoutEffect(() => {
    if (!paintedOpen) return
    const root = contentNode.current?.closest<HTMLElement>("[data-slot=color-palette-popover]")
    if (!root) return
    // Popup.js _registerResizeHandler -> ResizeHandler.js observes getDomRef and repositions on the next frame.
    // Size registration alone must not move an active missing opener; actual resize joins the registry's idle/scroll triggers.
    let previous = root.getBoundingClientRect()
    let active = true
    const frames = new Set<number>()
    const observer = new ResizeObserver(() => {
      const frame = requestAnimationFrame(() => {
        frames.delete(frame)
        if (!active) return
        const next = root.getBoundingClientRect()
        if (next.width !== previous.width || next.height !== previous.height) repositionRequest.current()
        previous = next
      })
      frames.add(frame)
    })
    observer.observe(root)
    return () => { active = false; observer.disconnect(); frames.forEach(cancelAnimationFrame) }
  }, [paintedOpen, contentMounted])
  const renderPalette = (live: boolean) => <div ref={live ? mountContent : undefined}><ColorPalette {...paletteProps} ref={live ? paletteRef : undefined} popupMode onItemClick={(detail) => {
    changeOpen(false)
    paletteProps.onItemClick?.(detail)
  }} /></div>
  const handleOpenFocus = (event: Event, initialFocus: boolean) => {
    if (!paintedOpen || focusedRequest.current) { event.preventDefault(); return }
    focusedRequest.current = true
    contentProps?.onOpenAutoFocus?.(event)
    if (event.defaultPrevented) return
    const hint = state.reopenTarget.current
    const buttons = [...(paletteRef.current?.querySelectorAll<HTMLElement>("[data-color-palette-area]") ?? [])]
    const target = hint ? buttons.find((button) => button.dataset.colorPaletteArea === hint.area && button.dataset.colorPaletteKey === hint.key)
      : paletteProps.showRecentColors && state.recent.length ? buttons.find((button) => button.dataset.colorPaletteArea === "recent") : null
    if (target) { event.preventDefault(); target.focus() }
    else if (initialFocus) {
      // Popup.js applyInitialFocus is needed on an actual open even when forceMount retained the closed content.
      event.preventDefault()
      const first = paletteRef.current?.querySelector<HTMLElement>("button:not([disabled]),[data-color-palette-area][tabindex='0']")
      ;(first ?? paletteRef.current?.closest<HTMLElement>("[data-slot=color-palette-popover]"))?.focus()
    }
  }
  const handleCloseFocus = (event: Event) => {
    if (!focusedRequest.current) { event.preventDefault(); return }
    focusedRequest.current = false
    contentProps?.onCloseAutoFocus?.(event)
    if (!event.defaultPrevented && !preserveCloseFocus.current) {
      event.preventDefault()
      const target = previousFocus.current?.isConnected ? previousFocus.current : resolveOpener()
      target?.focus()
    }
    preserveCloseFocus.current = false
    previousFocus.current = null
  }
  const contentRef = contentProps?.ref
  const surfaceRef = React.useCallback((node: HTMLDivElement | null) => {
    if (typeof contentRef === "function") return contentRef(node)
    if (contentRef) contentRef.current = node
  }, [contentRef])
  return <><div hidden ref={directionRef} dir={paletteProps.dir}>
    {/* Popup.js hide keeps palette commits active while closed; this dormant instance shares state with the live surface. */}
    {!paintedOpen && !forceMount && !contentMounted && renderPalette(false)}
  </div>
  {(paintedOpen || forceMount) && <NativePaletteContent {...contentProps} ref={surfaceRef} id={id} data-slot="color-palette-popover"
    active={paintedOpen} portal={portal} side={side} dir={rtl ? "rtl" : "ltr"} hideArrow aria-label={popoverLabel}
    className={cn("fiori-color-palette-popover", className, contentProps?.className)} hidden={!paintedOpen}
    style={paintedOpen ? contentProps?.style : { ...contentProps?.style, display: "none" }}
    data-missing-opener={missingActiveOpener ? "" : undefined} data-missing-opener-origin={missingOpenerOrigin ? "" : undefined}
    getAnchorRect={anchorRef.current.getBoundingClientRect} isOpener={isOpenerEvent}
    reposition={() => repositionRequest.current()}
    onDismiss={(preserveFocus) => { preserveCloseFocus.current = !!preserveFocus; changeOpen(false) }}
    // Popup.openPopup:186 saves deep prior focus BEFORE _show and caller-cancelable initial focus.
    onBeforeOpen={() => { previousFocus.current = getFocusedElement() ?? resolveOpener(); preserveCloseFocus.current = false }}
    onOpenAutoFocus={(event) => handleOpenFocus(event, true)} onCloseAutoFocus={handleCloseFocus}>
    {/* ColorPalettePopoverTemplate.js wraps the inline-block palette in an ordinary div. */}
    {renderPalette(true)}
  </NativePaletteContent>}</>

}

/** Desktop ui5-color-palette-popover: content-only ResponsivePopover with no arrow. */
function ColorPalettePopover(props: ColorPalettePopoverProps) {
  return <ColorPaletteStateProvider><PalettePopoverSurface {...props} /></ColorPaletteStateProvider>
}

export { ColorPalettePopover, type ColorPalettePopoverProps }
