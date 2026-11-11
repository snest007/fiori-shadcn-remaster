import * as React from "react"

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

function getFocusedElement() {
  // PopupUtils.js getFocusedElement -> getActiveElement.js follows every open ShadowRoot.
  let element = document.activeElement
  while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement
  return element && "focus" in element && typeof element.focus === "function" ? element as HTMLElement : null
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
  const [anchorVisible, setAnchorVisible] = React.useState(false)
  const dismissedRequest = React.useRef(false)
  const [missingActiveOpener, setMissingActiveOpener] = React.useState(false)
  const [contentMounted, setContentMounted] = React.useState(false)
  const mountContent = React.useCallback((node: HTMLDivElement | null) => { setContentMounted(!!node) }, [])
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
  const anchorRef = React.useMemo(() => ({ current: { getBoundingClientRect: () => resolveOpener()?.getBoundingClientRect() ?? new DOMRect() } }), [anchor, missingActiveOpener])
  const changeOpen = React.useCallback((next: boolean) => {
    if (controlled === undefined) setUncontrolled(next)
    onOpenChange?.(next)
  }, [controlled, onOpenChange])
  React.useLayoutEffect(() => {
    const next = resolveOpener()
    if (!open) {
      dismissedRequest.current = false
      if (next !== anchor) setAnchor(next)
      if (anchorVisible) setAnchorVisible(false)
      if (missingActiveOpener) setMissingActiveOpener(false)
      return
    }
    // Popover.js opener setter preserves an already-open popup and its old observer when the reference is cleared.
    if (!next) {
      if (anchorVisible && anchor?.isConnected) { if (!missingActiveOpener) setMissingActiveOpener(true); return }
      if (anchorVisible) setAnchorVisible(false)
      if (anchor && !anchor.isConnected && !dismissedRequest.current) { dismissedRequest.current = true; changeOpen(false) }
      return // Initial missing opener keeps requested open without painting or firing close.
    }
    if (next !== anchor) setAnchor(next)
    if (missingActiveOpener) setMissingActiveOpener(false)
    const rect = next.getBoundingClientRect()
    // isOpenerOutsideViewport uses strict edges; an initially offviewport opener closes after the own commit.
    const outside = rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth
    if (outside) {
      if (anchorVisible) setAnchorVisible(false)
      if (!dismissedRequest.current) { dismissedRequest.current = true; changeOpen(false) }
    } else if (!dismissedRequest.current && !anchorVisible) setAnchorVisible(true)
  })
  React.useLayoutEffect(() => {
    if (!open || !anchor || dismissedRequest.current) return
    // Popover.js _observeOpenerVisibility/_onOpenerIntersection observes actual clipping, hiding and removal.
    let active = true
    const observer = new IntersectionObserver(([entry]) => {
      if (active && !entry?.isIntersecting && !dismissedRequest.current) {
        dismissedRequest.current = true
        setAnchorVisible(false)
        changeOpen(false)
      }
    })
    observer.observe(anchor)
    return () => { active = false; observer.disconnect() }
  }, [open, anchor, changeOpen])
  const paintedOpen = open && anchorVisible
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
  return (
    <><div hidden ref={directionRef} dir={paletteProps.dir}>
      {/* Popup.js hide keeps palette commits active while closed; this dormant instance shares its state with the live surface. */}
      {!paintedOpen && !forceMount && !contentMounted && renderPalette(false)}
    </div>
    <Popover open={paintedOpen} onOpenChange={changeOpen}>
      <PopoverAnchor virtualRef={anchorRef} />
      {/* Popover.js _show uses physical top/left 0 when an active opener is cleared; disable target collision mapping for that origin. */}
      <PopoverContent {...contentProps} id={id} data-slot="color-palette-popover" portal={portal} side={missingActiveOpener ? "bottom" : side} align={missingActiveOpener ? rtl ? "end" : "start" : contentProps?.align}
        avoidCollisions={missingActiveOpener ? false : contentProps?.avoidCollisions} dir={rtl ? "rtl" : "ltr"}
        hideArrow aria-label={popoverLabel} className={cn("fiori-color-palette-popover", className, contentProps?.className)}
        hidden={!paintedOpen} style={paintedOpen ? contentProps?.style : { ...contentProps?.style, display: "none" }}
        data-missing-opener={missingActiveOpener ? "" : undefined}
        onPointerDownOutside={(event) => { if (!paintedOpen) event.preventDefault(); else contentProps?.onPointerDownOutside?.(event) }}
        onFocusOutside={(event) => { if (!paintedOpen) event.preventDefault(); else contentProps?.onFocusOutside?.(event) }}
        onInteractOutside={(event) => { if (!paintedOpen) event.preventDefault(); else contentProps?.onInteractOutside?.(event) }}
        onEscapeKeyDown={(event) => { if (!paintedOpen) event.preventDefault(); else contentProps?.onEscapeKeyDown?.(event) }}
        onOpenAutoFocus={(event) => handleOpenFocus(event, false)}
        onCloseAutoFocus={handleCloseFocus}>
        {/* ColorPalettePopoverTemplate.js wraps the inline-block palette in an ordinary div. */}
        {renderPalette(true)}
      </PopoverContent>
    </Popover></>
  )
}

/** Desktop ui5-color-palette-popover: content-only ResponsivePopover with no arrow. */
function ColorPalettePopover(props: ColorPalettePopoverProps) {
  return <ColorPaletteStateProvider><PalettePopoverSurface {...props} /></ColorPaletteStateProvider>
}

export { ColorPalettePopover, type ColorPalettePopoverProps }
