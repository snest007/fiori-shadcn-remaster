import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// Mirrors ui5-popover (Horizon): optional header bar (<PopoverHeader><PopoverTitle>), a padded, scrolling
// <PopoverBody>, and an optional footer bar (<PopoverFooter>, end-aligned like a ui5-bar footer).

type MediaRange = "S" | "M" | "L" | "XL"

/** UI5's 4-step range set, measured on the popup's own width (drives content padding). */
function usePopupMediaRange<T extends HTMLElement>(): [React.RefCallback<T>, MediaRange] {
  const [range, setRange] = React.useState<MediaRange>("S")
  const observer = React.useRef<ResizeObserver | null>(null)
  const ref = React.useCallback((node: T | null) => {
    observer.current?.disconnect()
    if (!node) return
    const update = (w: number) => setRange(w < 600 ? "S" : w < 1024 ? "M" : w < 1440 ? "L" : "XL")
    update(node.offsetWidth)
    observer.current = new ResizeObserver(([entry]) => update(entry.borderBoxSize?.[0]?.inlineSize ?? node.offsetWidth))
    observer.current.observe(node)
  }, [])
  return [ref, range]
}

const PopoverTitleContext = React.createContext<{ id: string; register: () => void } | null>(null)

function Popover(props: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger(props: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverAnchor(props: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

type PopoverContentProps = React.ComponentProps<typeof PopoverPrimitive.Content> & {
  /** Hide the arrow that points at the opener (ui5-popover `hide-arrow`). */
  hideArrow?: boolean
  /** Render in place instead of in a portal on document.body. */
  portal?: boolean
}

function PopoverContent({
  className,
  children,
  side = "right",
  align = "center",
  sideOffset = 0,
  collisionPadding = 10,
  hideArrow = false,
  portal = true,
  ...props
}: PopoverContentProps) {
  const [rangeRef, range] = usePopupMediaRange<HTMLDivElement>()
  const titleId = React.useId()
  const [hasTitle, setHasTitle] = React.useState(false)
  const titleCtx = React.useMemo(() => ({ id: titleId, register: () => setHasTitle(true) }), [titleId])

  const surface = (
    <PopoverPrimitive.Content
      data-slot="popover-content"
      data-media-range={range}
      data-hide-arrow={hideArrow ? "" : undefined}
      side={side}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      aria-labelledby={hasTitle ? titleId : undefined}
      className={cn(
        "fiori-popup fiori-popover-surface z-50 max-h-(--radix-popover-content-available-height) max-w-[calc(100vw-20px)] outline-none",
        className
      )}
      {...props}
    >
      {!hideArrow && (
        <PopoverPrimitive.Arrow asChild width={16} height={8}>
          <span className="fiori-popover-arrow" />
        </PopoverPrimitive.Arrow>
      )}
      <PopoverTitleContext.Provider value={titleCtx}>
        <div ref={rangeRef} className="fiori-popup__root">
          {children}
        </div>
      </PopoverTitleContext.Provider>
    </PopoverPrimitive.Content>
  )
  return portal ? <PopoverPrimitive.Portal>{surface}</PopoverPrimitive.Portal> : surface
}

/** Header bar. Put a <PopoverTitle> (and optionally actions) inside. */
function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="popover-header" className={cn("fiori-popup__header", className)} {...props} />
}

function PopoverTitle({ className, children, ...props }: React.ComponentProps<"h1">) {
  const ctx = React.useContext(PopoverTitleContext)
  React.useLayoutEffect(() => ctx?.register(), [ctx])
  return (
    <h1 data-slot="popover-title" id={ctx?.id} className={cn("fiori-popup__title", className)} {...props}>
      <span>{children}</span>
    </h1>
  )
}

/** The padded, scrollable content area between header and footer. */
function PopoverBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="popover-body" className={cn("fiori-popup__content", className)} {...props} />
}

/** Footer bar; content is end-aligned like a ui5-bar footer. */
function PopoverFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="popover-footer" className={cn("fiori-popup__footer", className)} {...props} />
}

function PopoverClose(props: React.ComponentProps<typeof PopoverPrimitive.Close>) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />
}

export {
  Popover,
  PopoverAnchor,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  usePopupMediaRange,
  type PopoverContentProps,
}
