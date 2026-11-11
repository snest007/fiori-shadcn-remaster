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
  const directionRef = React.useRef<HTMLSpanElement | null>(null)
  const [rtl, setRtl] = React.useState(paletteProps.dir === "rtl")
  React.useLayoutEffect(() => {
    // Popover.js getActualPlacement/isRtl -> getEffectiveDir.js uses the popup's own inherited :dir.
    const next = directionRef.current?.matches(":dir(rtl)") ?? false
    if (next !== rtl) setRtl(next)
  })
  const side = placement === "Start" ? rtl ? "right" : "left" : placement === "End" ? rtl ? "left" : "right" : placement.toLowerCase() as "bottom" | "top" | "left" | "right"
  const resolveOpener = () => typeof opener === "string" ? document.getElementById(opener) : opener && "current" in opener ? opener.current : opener ?? null
  const anchorRef = React.useRef({ getBoundingClientRect: () => resolveOpener()?.getBoundingClientRect() ?? new DOMRect() })
  anchorRef.current.getBoundingClientRect = () => resolveOpener()?.getBoundingClientRect() ?? new DOMRect()
  const changeOpen = (next: boolean) => {
    if (controlled === undefined) setUncontrolled(next)
    onOpenChange?.(next)
  }
  return (
    <><span hidden ref={directionRef} dir={paletteProps.dir} />
    <Popover open={open} onOpenChange={changeOpen}>
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
        <div><ColorPalette {...paletteProps} ref={paletteRef} popupMode onItemClick={(detail) => {
          changeOpen(false)
          paletteProps.onItemClick?.(detail)
        }} /></div>
      </PopoverContent>
    </Popover></>
  )
}

/** Desktop ui5-color-palette-popover: content-only ResponsivePopover with no arrow. */
function ColorPalettePopover(props: ColorPalettePopoverProps) {
  return <ColorPaletteStateProvider><PalettePopoverSurface {...props} /></ColorPaletteStateProvider>
}

export { ColorPalettePopover, type ColorPalettePopoverProps }
