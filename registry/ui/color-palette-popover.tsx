import * as React from "react"

import { ColorPalette, ColorPaletteStateContext, ColorPaletteStateProvider, type ColorPaletteProps } from "@/components/ui/color-palette"
import { Popover, PopoverAnchor, PopoverContent, type PopoverContentProps } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type ColorPalettePopoverProps = Omit<ColorPaletteProps, "ref" | "popupMode"> & {
  open?: boolean
  defaultOpen?: boolean
  opener?: HTMLElement | React.RefObject<HTMLElement | null> | string | null
  onOpenChange?: (open: boolean) => void
  placement?: "Bottom" | "Top" | "Left" | "Right"
  popoverLabel?: string
  portal?: boolean
  contentProps?: Omit<PopoverContentProps, "children" | "side" | "hideArrow" | "portal">
}

function PalettePopoverSurface({ open: controlled, defaultOpen = false, opener, onOpenChange, placement = "Bottom", popoverLabel = "Color Palette",
  portal = true, contentProps, className, id, ...paletteProps }: ColorPalettePopoverProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen)
  const open = controlled ?? uncontrolled
  const state = React.useContext(ColorPaletteStateContext)!
  const paletteRef = React.useRef<HTMLDivElement | null>(null)
  const previousFocus = React.useRef<HTMLElement | null>(null)
  const resolveOpener = () => typeof opener === "string" ? document.getElementById(opener) : opener && "current" in opener ? opener.current : opener ?? null
  const anchorRef = React.useRef({ getBoundingClientRect: () => resolveOpener()?.getBoundingClientRect() ?? new DOMRect() })
  anchorRef.current.getBoundingClientRect = () => resolveOpener()?.getBoundingClientRect() ?? new DOMRect()
  const changeOpen = (next: boolean) => {
    if (controlled === undefined) setUncontrolled(next)
    onOpenChange?.(next)
  }
  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverAnchor virtualRef={anchorRef} />
      <PopoverContent {...contentProps} id={id} data-slot="color-palette-popover" portal={portal} side={placement.toLowerCase() as "bottom" | "top" | "left" | "right"}
        hideArrow aria-label={popoverLabel} className={cn("fiori-color-palette-popover", className, contentProps?.className)}
        onOpenAutoFocus={(event) => {
          contentProps?.onOpenAutoFocus?.(event)
          if (event.defaultPrevented) return
          previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : resolveOpener()
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
        }}>
        <ColorPalette {...paletteProps} ref={paletteRef} popupMode onItemClick={(detail) => {
          changeOpen(false)
          paletteProps.onItemClick?.(detail)
        }} />
      </PopoverContent>
    </Popover>
  )
}

/** Desktop ui5-color-palette-popover: content-only ResponsivePopover with no arrow. */
function ColorPalettePopover(props: ColorPalettePopoverProps) {
  return <ColorPaletteStateProvider><PalettePopoverSurface {...props} /></ColorPaletteStateProvider>
}

export { ColorPalettePopover, type ColorPalettePopoverProps }
