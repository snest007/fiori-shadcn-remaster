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
  const anchorRef = React.useRef({ getBoundingClientRect: () => resolveOpener()?.getBoundingClientRect() ?? new DOMRect() })
  anchorRef.current.getBoundingClientRect = () => resolveOpener()?.getBoundingClientRect() ?? new DOMRect()
  const changeOpen = React.useCallback((next: boolean) => {
    if (controlled === undefined) setUncontrolled(next)
    onOpenChange?.(next)
  }, [controlled, onOpenChange])
  React.useLayoutEffect(() => {
    const next = resolveOpener()
    if (next !== anchor) setAnchor(next)
    if (!open) { dismissedRequest.current = false; if (anchorVisible) setAnchorVisible(false); return }
    // Popover.js openPopup: no opener leaves requested open untouched and paints nothing.
    if (!next) {
      if (anchorVisible) setAnchorVisible(false)
      if (anchor && !anchor.isConnected && !dismissedRequest.current) { dismissedRequest.current = true; changeOpen(false) }
      return
    }
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
  const renderPalette = () => <div><ColorPalette {...paletteProps} ref={paintedOpen ? paletteRef : undefined} popupMode onItemClick={(detail) => {
    changeOpen(false)
    paletteProps.onItemClick?.(detail)
  }} /></div>
  return (
    <><div hidden ref={directionRef} dir={paletteProps.dir}>
      {/* Popup.js hide keeps palette commits active while closed; this dormant instance shares its state with the live surface. */}
      {!paintedOpen && renderPalette()}
    </div>
    <Popover open={paintedOpen} onOpenChange={changeOpen}>
      <PopoverAnchor virtualRef={anchorRef} />
      <PopoverContent {...contentProps} id={id} data-slot="color-palette-popover" portal={portal} side={side} dir={rtl ? "rtl" : "ltr"}
        hideArrow aria-label={popoverLabel} className={cn("fiori-color-palette-popover", className, contentProps?.className)}
        onOpenAutoFocus={(event) => {
          contentProps?.onOpenAutoFocus?.(event)
          if (event.defaultPrevented) return
          // Popup.js openPopup/resetFocus retains the deep focused element before opening.
          previousFocus.current = getFocusedElement() ?? resolveOpener()
          // ColorPalettePopover.js onAfterOpen restores only an actual selection or first recent.
          // Leave default/first-swatch initial focus to Radix so no delayed refocus steals navigation.
          const hint = state.reopenTarget.current
          const buttons = [...(paletteRef.current?.querySelectorAll<HTMLElement>("[data-color-palette-area]") ?? [])]
          const target = hint
            ? buttons.find((button) => button.dataset.colorPaletteArea === hint.area && button.dataset.colorPaletteKey === hint.key)
            : paletteProps.showRecentColors && state.recent.length ? buttons.find((button) => button.dataset.colorPaletteArea === "recent") : null
          if (target) { event.preventDefault(); target.focus() }
        }}
        onCloseAutoFocus={(event) => {
          contentProps?.onCloseAutoFocus?.(event)
          if (event.defaultPrevented) return
          event.preventDefault()
          const target = previousFocus.current?.isConnected ? previousFocus.current : resolveOpener()
          target?.focus()
          previousFocus.current = null
        }}>
        {/* ColorPalettePopoverTemplate.js wraps the inline-block palette in an ordinary div. */}
        {renderPalette()}
      </PopoverContent>
    </Popover></>
  )
}

/** Desktop ui5-color-palette-popover: content-only ResponsivePopover with no arrow. */
function ColorPalettePopover(props: ColorPalettePopoverProps) {
  return <ColorPaletteStateProvider><PalettePopoverSurface {...props} /></ColorPaletteStateProvider>
}

export { ColorPalettePopover, type ColorPalettePopoverProps }
