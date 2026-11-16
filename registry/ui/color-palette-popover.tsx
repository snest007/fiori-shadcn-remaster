import * as React from "react"
import { useFioriLocale } from "@/lib/fiori-locale"

import { ColorPalette, ColorPaletteStateContext, ColorPaletteStateProvider, type ColorPaletteProps } from "@/components/ui/color-palette"
import { Popover, PopoverAnchor, PopoverContent, type PopoverContentProps } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

/**
 * @accessibility popoverLabel names the popup dialog. Palette accessibleName, containerLabel, colorLabel and item tooltips name the grouped swatches.
 * @accessibility Opening focuses the selected, recent or first swatch; Escape closes and restores the previously focused element or opener. Placement Start/End mirrors with direction. The popup retains the palette keyboard model and overridable dialog action text.
 */
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

function focusedElement() {
  // Popup.js openPopup/resetFocus uses PopupUtils.getFocusedElement, including nested ShadowRoots.
  let element = document.activeElement
  while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement
  return element instanceof HTMLElement ? element : null
}

function PalettePopoverSurface({ open: controlled, defaultOpen = false, opener, onOpenChange, placement = "Bottom", popoverLabel: popoverLabelProp,
  portal = true, contentProps, className, id, ...paletteProps }: ColorPalettePopoverProps) {
  const { t } = useFioriLocale()
  const popoverLabel = popoverLabelProp ?? t("COLORPALETTE_POPOVER_TITLE", "Color Palette") // UI5 COLORPALETTE_POPOVER_TITLE

  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen)
  const open = controlled ?? uncontrolled
  const state = React.useContext(ColorPaletteStateContext)!
  const paletteRef = React.useRef<HTMLDivElement | null>(null)
  const ownerRef = React.useRef<HTMLDivElement | null>(null)
  const previousFocus = React.useRef<HTMLElement | null>(null)
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null)
  const [observedAnchor, setObservedAnchor] = React.useState<HTMLElement | null>(null)
  const [anchorVisible, setAnchorVisible] = React.useState(false)
  const dismissedRequest = React.useRef(false)
  const [rtl, setRtl] = React.useState(paletteProps.dir === "rtl")
  const resolveOpener = () => {
    if (typeof opener !== "string") return opener && "current" in opener ? opener.current : opener ?? null
    // Popover.js getOpenerHTMLElement searches the owning root before the document.
    const root = ownerRef.current?.getRootNode() as Document | ShadowRoot | undefined
    return root?.getElementById(opener) ?? document.getElementById(opener)
  }
  const changeOpen = React.useCallback((next: boolean) => {
    if (controlled === undefined) setUncontrolled(next)
    onOpenChange?.(next)
  }, [controlled, onOpenChange])
  React.useLayoutEffect(() => {
    const nextRtl = ownerRef.current?.matches(":dir(rtl)") ?? false
    if (nextRtl !== rtl) setRtl(nextRtl)
    const next = resolveOpener()
    if (!open) {
      dismissedRequest.current = false
      if (next !== anchor) setAnchor(next)
      if (observedAnchor) setObservedAnchor(null)
      if (anchorVisible) setAnchorVisible(false)
      return
    }
    // Popover.js opener setter preserves an already-open popup and its original visibility observer.
    if (!next) {
      if (anchorVisible && observedAnchor?.isConnected) return
      if (anchorVisible) setAnchorVisible(false)
      if (observedAnchor && !observedAnchor.isConnected && !dismissedRequest.current) {
        dismissedRequest.current = true
        changeOpen(false)
      }
      return // An initially missing opener retains the open request without painting a layer.
    }
    if (next !== anchor) setAnchor(next)
    const rect = next.getBoundingClientRect()
    // Popover.isOpenerOutsideViewport uses strict edges before its IntersectionObserver handles clipping.
    if (rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth) {
      if (anchorVisible) setAnchorVisible(false)
      if (!dismissedRequest.current) { dismissedRequest.current = true; changeOpen(false) }
    } else if (!dismissedRequest.current) {
      if (!observedAnchor) setObservedAnchor(next)
      if (!anchorVisible) setAnchorVisible(true)
    }
  })
  React.useLayoutEffect(() => {
    if (!open || !observedAnchor || dismissedRequest.current) return
    // Popover.js _observeOpenerVisibility/_onOpenerIntersection closes on clipping, hiding or removal.
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
  // User-directed Radix positioning retains the known external anchor when its reference is cleared.
  // UI5 Popover._show's delayed missing-opener reset to viewport origin belongs to its native registry tick.
  const virtualRef = React.useMemo(() => ({ current: {
    getBoundingClientRect: () => anchor?.getBoundingClientRect() ?? new DOMRect(),
    contextElement: anchor ?? undefined,
  } }), [anchor])
  const side = placement === "Start" ? rtl ? "right" : "left" : placement === "End" ? rtl ? "left" : "right"
    : placement.toLowerCase() as "bottom" | "top" | "left" | "right"
  // forceMount retains the palette owner below, never a closed Radix Content: mounted Content owns an active layer.
  // This user-directed composition releases Radix's Escape/focus/pointer layer on every close, including forceMount.
  const { forceMount: _forceMount, onOpenAutoFocus, onCloseAutoFocus, onPointerDownOutside, onFocusOutside, onInteractOutside, onEscapeKeyDown, ...surfaceProps } = contentProps ?? {}
  const isOpenerEvent = (event: Event) => {
    const node = resolveOpener()
    if (!node) return false
    if (event.composedPath().includes(node) || event.target instanceof Node && node.contains(event.target)) return true
    // Radix defers outside-pointer notification until click; composedPath is then empty for a retargeted ShadowRoot event.
    // Popover.isClicked also treats a hit in the actual opener rectangle as inside.
    if (event instanceof MouseEvent) {
      const rect = node.getBoundingClientRect()
      return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom
    }
    return event instanceof FocusEvent && focusedElement() === node
  }
  const renderPalette = (live: boolean) => <ColorPalette {...paletteProps} ref={live ? paletteRef : undefined} popupMode onItemClick={(detail) => {
    // ColorPalettePopover.js onSelectedColor closes before forwarding the exact palette event payload.
    changeOpen(false)
    paletteProps.onItemClick?.(detail)
  }} />
  return <Popover open={paintedOpen} onOpenChange={changeOpen}>
    <div hidden ref={ownerRef} dir={paletteProps.dir}>
      {/* Popup.hide retains palette commits and component-local history while its interaction surface is closed. */}
      {!paintedOpen && renderPalette(false)}
    </div>
    <PopoverAnchor virtualRef={virtualRef} />
    {paintedOpen && <PopoverContent {...surfaceProps} id={id} data-slot="color-palette-popover" portal={portal} side={side} dir={rtl ? "rtl" : "ltr"}
      hideArrow aria-label={popoverLabel} className={cn("fiori-color-palette-popover", className, contentProps?.className)}
      onOpenAutoFocus={(event) => {
        previousFocus.current = focusedElement() ?? resolveOpener()
        onOpenAutoFocus?.(event)
        if (event.defaultPrevented) return
        // ColorPalettePopover.js onAfterOpen: selected/recent focus only on open, without late focus theft.
        // FocusableElements.js findFocusableElement/isElementHidden skips non-painted or visibility:hidden targets.
        const visible = (node: HTMLElement) => (node.offsetWidth > 0 || node.offsetHeight > 0) && getComputedStyle(node).visibility !== "hidden"
        const buttons = [...(paletteRef.current?.querySelectorAll<HTMLElement>("[data-color-palette-area]") ?? [])].filter(visible)
        const hint = state.reopenTarget.current
        const target = hint ? buttons.find((button) => button.dataset.colorPaletteArea === hint.area && button.dataset.colorPaletteKey === hint.key)
          : paletteProps.showRecentColors && state.recent.length ? buttons.find((button) => button.dataset.colorPaletteArea === "recent") : null
        event.preventDefault()
        const first = [...(paletteRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]),[data-color-palette-area][tabindex='0']") ?? [])].find(visible)
        // Popup.js applyFocus falls back to the popup root with tabindex=-1. Radix dispatches this event from shared Content.
        ;(target ?? first ?? (event.target instanceof HTMLElement ? event.target : null))?.focus()
      }}
      onCloseAutoFocus={(event) => {
        onCloseAutoFocus?.(event)
        if (!event.defaultPrevented) {
          // Popup.js resetFocus restores the deep element focused before opening, including pointer dismissal.
          event.preventDefault()
          ;(previousFocus.current?.isConnected ? previousFocus.current : resolveOpener())?.focus()
        }
        previousFocus.current = null
      }}
      onPointerDownOutside={(event) => {
        // An external opener is an anchor rather than a Radix Trigger, so preserve its composed-path hit explicitly.
        if (isOpenerEvent(event.detail.originalEvent)) event.preventDefault()
        else onPointerDownOutside?.(event)
      }}
      onFocusOutside={(event) => {
        onFocusOutside?.(event)
        // UI5 Popup._onfocusout does not dismiss ordinary outside focus. Keep Radix's shared layer ownership.
        event.preventDefault()
      }}
      onInteractOutside={(event) => {
        if (!isOpenerEvent(event.detail.originalEvent)) onInteractOutside?.(event)
      }}
      onEscapeKeyDown={(event) => {
        // OpenedPopupsRegistry.js ignores modified Escape. Layer order/capture follows the existing Radix Popover.
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) event.preventDefault()
        else onEscapeKeyDown?.(event)
      }}>
      {/* ColorPalettePopoverTemplate.js has one ordinary content wrapper, no arrow/header/footer on desktop. */}
      <div className="fiori-color-palette-popover__content">{renderPalette(true)}</div>
    </PopoverContent>}
  </Popover>
}

/** Desktop ui5-color-palette-popover composed with the registry's shared Radix Popover. */
function ColorPalettePopover(props: ColorPalettePopoverProps) {
  return <ColorPaletteStateProvider><PalettePopoverSurface {...props} /></ColorPaletteStateProvider>
}

export { ColorPalettePopover, type ColorPalettePopoverProps }
