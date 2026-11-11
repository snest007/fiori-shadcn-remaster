import * as React from "react"
import { Slot } from "radix-ui"

import { ColorPalette, ColorPaletteStateContext, ColorPaletteStateProvider, type ColorPaletteProps } from "@/components/ui/color-palette"
import { Popover, PopoverAnchor, PopoverContent, type PopoverContentProps } from "@/components/ui/popover"
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

// popup-utils/PopoverRegistry.js shares one 300ms update interval and captured document scroll across open popovers.
const openPalettePositions = new Set<() => void>()
let positionInterval: number | undefined
const repositionOpenPalettes = () => { openPalettePositions.forEach((reposition) => reposition()) }
function registerPalettePosition(reposition: () => void) {
  openPalettePositions.add(reposition)
  if (openPalettePositions.size === 1) {
    document.addEventListener("scroll", repositionOpenPalettes, true)
    positionInterval = window.setInterval(repositionOpenPalettes, 300)
  }
  return () => {
    openPalettePositions.delete(reposition)
    if (!openPalettePositions.size) {
      document.removeEventListener("scroll", repositionOpenPalettes, true)
      window.clearInterval(positionInterval)
      positionInterval = undefined
    }
  }
}

function getFocusedElement() {
  // PopupUtils.js getFocusedElement -> getActiveElement.js follows every open ShadowRoot.
  let element = document.activeElement
  while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement
  return element && "focus" in element && typeof element.focus === "function" ? element as HTMLElement : null
}

type RetainedPaletteContentProps = PopoverContentProps & {
  active: boolean
  getAnchorRect: () => DOMRect
  onDismiss: () => void
}

/** Popup.js keeps native manual-popover DOM while registering interactions only while open. */
function RetainedPaletteContent({ active, getAnchorRect, onDismiss, children, className, ref, side = "bottom", align = "center", sideOffset = 0, alignOffset = 0,
  collisionPadding, collisionBoundary, avoidCollisions = true, arrowPadding: _arrowPadding, sticky = "partial", hideWhenDetached: _hideDetached,
  updatePositionStrategy = "optimized", asChild, portal: _portal, hideArrow: _arrow, forceMount: _force,
  onOpenAutoFocus: _openFocus, onCloseAutoFocus: _closeFocus, onPointerDownOutside, onFocusOutside, onInteractOutside,
  onEscapeKeyDown, onKeyDown, ...props }: RetainedPaletteContentProps) {
  const root = React.useRef<HTMLDivElement | null>(null)
  const place = React.useRef<() => void>(() => {})
  const handlers = React.useRef({ onDismiss, onPointerDownOutside, onFocusOutside, onInteractOutside, onEscapeKeyDown })
  React.useLayoutEffect(() => { handlers.current = { onDismiss, onPointerDownOutside, onFocusOutside, onInteractOutside, onEscapeKeyDown } })
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
      if (!node) return
      // Popup.js _show/hide uses the browser's manual popover; hidden DOM owns no keyboard/pointer layer.
      if (!active) { if (node.matches(":popover-open")) node.hidePopover(); return }
      if (!node.matches(":popover-open")) node.showPopover()
      const rect = getAnchorRect()
      const box = node.getBoundingClientRect()
      const tokenMargin = parseFloat(getComputedStyle(node).getPropertyValue("--fiori-popup-viewport-margin"))
      const padding = (edge: "left" | "top" | "right" | "bottom") => typeof collisionPadding === "number" ? collisionPadding : collisionPadding?.[edge] ?? tokenMargin
      const boundaries = (Array.isArray(collisionBoundary) ? collisionBoundary : [collisionBoundary]).filter((boundary): boundary is Element => !!boundary)
      const limit = boundaries.reduce((limits, boundary) => {
        const box = boundary.getBoundingClientRect()
        return { left: Math.max(limits.left, box.left), top: Math.max(limits.top, box.top), right: Math.min(limits.right, box.right), bottom: Math.min(limits.bottom, box.bottom) }
      }, { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight })
      let actualSide = side
      const rtl = node.matches(":dir(rtl)")
      const position = (placement: typeof side) => {
        const vertical = placement === "bottom" || placement === "top"
        const start = vertical ? rtl ? rect.right - box.width : rect.left : rect.top
        const end = vertical ? rtl ? rect.left : rect.right - box.width : rect.bottom - box.height
        const offset = alignOffset * (align === "end" ? -1 : 1) * (vertical && rtl ? -1 : 1)
        const cross = (align === "start" ? start : align === "end" ? end : vertical ? rect.left + (rect.width - box.width) / 2 : rect.top + (rect.height - box.height) / 2) + offset
        return vertical ? { x: cross, y: placement === "bottom" ? rect.bottom + sideOffset : rect.top - box.height - sideOffset }
          : { x: placement === "right" ? rect.right + sideOffset : rect.left - box.width - sideOffset, y: cross }
      }
      let next = position(actualSide)
      // Popover.calcPlacement tries the requested/opposite placement, then limits the cross axis to the viewport.
      if (avoidCollisions) {
        const opposite = { bottom: "top", top: "bottom", left: "right", right: "left" } as const
        const outside = side === "bottom" ? next.y + box.height > limit.bottom - padding("bottom") : side === "top" ? next.y < limit.top + padding("top")
          : side === "right" ? next.x + box.width > limit.right - padding("right") : next.x < limit.left + padding("left")
        if (outside) { actualSide = opposite[side]; next = position(actualSide) }
        if (sticky === "partial") {
          if (actualSide === "top" || actualSide === "bottom") next.x = Math.max(rect.left - box.width, Math.min(next.x, rect.right))
          else next.y = Math.max(rect.top - box.height, Math.min(next.y, rect.bottom))
        }
        next.x = Math.max(limit.left + padding("left"), Math.min(next.x, limit.right - box.width - padding("right")))
        next.y = Math.max(limit.top + padding("top"), Math.min(next.y, limit.bottom - box.height - padding("bottom")))
      }
      if (node.hasAttribute("data-missing-opener-origin")) next = { x: 0, y: 0 }
      node.dataset.side = actualSide
      node.style.left = `${next.x}px`; node.style.top = `${next.y}px`
      node.dataset.mediaRange = box.width < 600 ? "S" : box.width < 1024 ? "M" : box.width < 1440 ? "L" : "XL"
    }
    place.current()
  })
  React.useLayoutEffect(() => {
    if (!active || updatePositionStrategy !== "always") return
    // Only the caller's explicit public "always" strategy adds animation-frame positioning; native default remains 300ms.
    let frame: number
    const tick = () => { place.current(); frame = requestAnimationFrame(tick) }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, updatePositionStrategy])
  // ColorPalettePopover has no arrow; its native opener IntersectionObserver already governs detachment.
  React.useLayoutEffect(() => {
    const node = root.current
    if (!active || !node) return
    let pointerTarget: EventTarget | null = null
    const inside = (event: Event) => event.composedPath().includes(node)
    const pointer = (event: PointerEvent) => {
      if (inside(event)) return
      pointerTarget = event.target
      const outside = new CustomEvent("dismissableLayer.pointerDownOutside", { cancelable: true, detail: { originalEvent: event } })
      const call = () => { handlers.current.onPointerDownOutside?.(outside); handlers.current.onInteractOutside?.(outside) }
      if (event.target) { event.target.addEventListener(outside.type, call, { once: true }); event.target.dispatchEvent(outside) }
      else call()
      if (!outside.defaultPrevented) handlers.current.onDismiss()
    }
    const focus = (event: FocusEvent) => {
      if (inside(event) || event.target === pointerTarget) return
      const outside = new CustomEvent("dismissableLayer.focusOutside", { cancelable: true, detail: { originalEvent: event } })
      const call = () => { handlers.current.onFocusOutside?.(outside); handlers.current.onInteractOutside?.(outside) }
      if (event.target) { event.target.addEventListener(outside.type, call, { once: true }); event.target.dispatchEvent(outside) }
      else call()
      if (!outside.defaultPrevented) handlers.current.onDismiss()
    }
    const click = () => { pointerTarget = null }
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return
      handlers.current.onEscapeKeyDown?.(event)
      if (!event.defaultPrevented) { event.preventDefault(); handlers.current.onDismiss() }
    }
    document.addEventListener("pointerdown", pointer, true)
    document.addEventListener("focusin", focus, true)
    document.addEventListener("click", click, true)
    document.addEventListener("keydown", key, true)
    return () => {
      document.removeEventListener("pointerdown", pointer, true)
      document.removeEventListener("focusin", focus, true)
      document.removeEventListener("click", click, true)
      document.removeEventListener("keydown", key, true)
    }
  }, [active])
  const Root = asChild ? Slot.Root : "div"
  return <Root {...props} ref={mount} popover="manual" role={props.role ?? "dialog"} tabIndex={props.tabIndex ?? -1} data-retained="" data-state={active ? "open" : "closed"}
    data-align={align} data-hide-arrow="" data-media-range="S" className={cn("fiori-popup fiori-popover-surface z-50 outline-none", className)}
    onKeyDown={(event) => {
      onKeyDown?.(event)
      if (event.defaultPrevented || event.key !== "Tab") return
      // Popup.forwardToFirst/forwardToLast only wraps the boundary; palette Tab selection handles its own rows first.
      const buttons = [...(root.current?.querySelectorAll<HTMLElement>("button:not([disabled]),[data-color-palette-area]:not([data-disabled])") ?? [])].filter((button) => !button.closest("[hidden]"))
      const target = event.shiftKey ? buttons.at(-1) : buttons[0]
      if (target && event.target === (event.shiftKey ? buttons[0] : buttons.at(-1))) { event.preventDefault(); target.focus() }
    }}><div className="fiori-popup__root">{children}</div></Root>
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
  const openerPointerPaths = React.useRef(new WeakMap<Event, EventTarget[]>())
  React.useLayoutEffect(() => {
    if (!anchor) return
    // Popover.js isOpenerClicked uses the original composed path. Radix defers outside pointerdown until click,
    // when that path has expired, so capture its path on the actual opener (also in ShadowRoot).
    const remember = (event: Event) => { openerPointerPaths.current.set(event, event.composedPath()) }
    anchor.addEventListener("pointerdown", remember, true)
    return () => anchor.removeEventListener("pointerdown", remember, true)
  }, [anchor])
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
  // The shared Popover's Portal has its own open Presence; only the in-place forceMount path retains content while closed.
  const forceMount = contentProps?.forceMount === true && !portal
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
  const isOpenerPointerDown = (event: Event) => {
    const node = resolveOpener()
    return event.type === "pointerdown" && !!node && (openerPointerPaths.current.get(event)?.includes(node)
      || (event.target instanceof Node && node.contains(event.target)) || event.composedPath().includes(node))
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
    const reposition = () => repositionRequest.current()
    const unregister = registerPalettePosition(reposition)
    // PopoverRegistry.attachScrollHandler also captures scroll within the popup's own root.
    root.addEventListener("scroll", reposition, true)
    return () => { root.removeEventListener("scroll", reposition, true); unregister() }
  }, [paintedOpen, contentMounted])
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
    // Popup.js openPopup/resetFocus retains the deep focused element before opening.
    previousFocus.current = getFocusedElement() ?? resolveOpener()
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
    if (event.defaultPrevented) return
    event.preventDefault()
    const target = previousFocus.current?.isConnected ? previousFocus.current : resolveOpener()
    target?.focus()
    previousFocus.current = null
  }
  React.useLayoutEffect(() => {
    // Presence(forceMount || open) retains one palette owner; focus events follow actual open/close transitions.
    if (!forceMount) return
    if (paintedOpen && !focusedRequest.current) handleOpenFocus(new Event("focusScope.autoFocusOnMount", { cancelable: true }), true)
    else if (!paintedOpen && focusedRequest.current) handleCloseFocus(new Event("focusScope.autoFocusOnUnmount", { cancelable: true }))
  }, [forceMount, paintedOpen])
  // Popover.js _show uses physical top/left 0 after a missing opener is recomputed by real resize, scroll or the registry's idle tick.
  const surface = (
      <PopoverContent {...contentProps} id={id} data-slot="color-palette-popover" portal={portal} side={missingOpenerOrigin ? "bottom" : side} align={missingOpenerOrigin ? rtl ? "end" : "start" : contentProps?.align}
        avoidCollisions={missingOpenerOrigin ? false : contentProps?.avoidCollisions} dir={rtl ? "rtl" : "ltr"}
        hideArrow aria-label={popoverLabel} className={cn("fiori-color-palette-popover", className, contentProps?.className)}
        hidden={!paintedOpen} style={paintedOpen ? contentProps?.style : { ...contentProps?.style, display: "none" }}
        data-missing-opener={missingActiveOpener ? "" : undefined} data-missing-opener-origin={missingOpenerOrigin ? "" : undefined}
        // popup-utils/PopoverRegistry.js clickHandler excludes isOpenerClicked, including retained Content's opening pointerdown.
        onPointerDownOutside={(event) => { if (!paintedOpen || isOpenerPointerDown(event.detail.originalEvent)) event.preventDefault(); else contentProps?.onPointerDownOutside?.(event) }}
        onFocusOutside={(event) => { if (!paintedOpen) event.preventDefault(); else contentProps?.onFocusOutside?.(event) }}
        onInteractOutside={(event) => { if (!paintedOpen || isOpenerPointerDown(event.detail.originalEvent)) event.preventDefault(); else contentProps?.onInteractOutside?.(event) }}
        onEscapeKeyDown={(event) => { if (!paintedOpen) event.preventDefault(); else contentProps?.onEscapeKeyDown?.(event) }}
        onOpenAutoFocus={(event) => handleOpenFocus(event, false)}
        onCloseAutoFocus={handleCloseFocus}>
        {/* ColorPalettePopoverTemplate.js wraps the inline-block palette in an ordinary div. */}
        {renderPalette(true)}
      </PopoverContent>
  )
  return (
    <><div hidden ref={directionRef} dir={paletteProps.dir}>
      {/* Popup.js hide keeps palette commits active while closed; this dormant instance shares its state with the live surface. */}
      {!paintedOpen && !forceMount && !contentMounted && renderPalette(false)}
    </div>
    <Popover open={paintedOpen} onOpenChange={changeOpen}>
      <PopoverAnchor virtualRef={anchorRef} />
      {forceMount ? <RetainedPaletteContent {...surface.props} active={paintedOpen} getAnchorRect={anchorRef.current.getBoundingClientRect} onDismiss={() => changeOpen(false)} /> : surface}
    </Popover></>
  )
}

/** Desktop ui5-color-palette-popover: content-only ResponsivePopover with no arrow. */
function ColorPalettePopover(props: ColorPalettePopoverProps) {
  return <ColorPaletteStateProvider><PalettePopoverSurface {...props} /></ColorPaletteStateProvider>
}

export { ColorPalettePopover, type ColorPalettePopoverProps }
