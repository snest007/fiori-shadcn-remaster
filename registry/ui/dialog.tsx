import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

// UI5 2.28 Popup.js/onEnterDOM: every rendered Popup surface bounds F6, modal or otherwise.

import { cn } from "@/lib/utils"
import { resizeCorner } from "@/lib/fiori-icons"
import { Icon } from "@/components/ui/icon"
import { valueStateIcons, type ValueState } from "@/components/ui/input"
import { usePopupMediaRange } from "@/components/ui/popover"

// Mirrors ui5-dialog (Horizon): a centered modal with a header bar (optional state icon + title,
// plus a colored state line), padded content and a footer bar whose actions are end-aligned.
// Fiori puts the emphasized (primary) action first in the footer: <Button variant="emphasized">Save</Button><Button>Cancel</Button>.
// Focus moves to the first focusable element on open and returns to the opener on close; Escape closes.

const DialogContext = React.createContext<{ modal: boolean; open: boolean }>({ modal: true, open: false })
const DialogStateContext = React.createContext<ValueState>("none")
const DialogDragContext = React.createContext<((event: React.MouseEvent<HTMLDivElement>) => void) | undefined>(undefined)

function Dialog({ modal = true, open, defaultOpen = false, onOpenChange, ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const effectiveOpen = open ?? uncontrolledOpen
  return (
    <DialogContext.Provider value={{ modal, open: effectiveOpen }}>
      <DialogPrimitive.Root data-slot="dialog" modal={modal} open={effectiveOpen} onOpenChange={(next) => {
        if (open === undefined) setUncontrolledOpen(next)
        onOpenChange?.(next)
      }} {...props} />
    </DialogContext.Provider>
  )
}

function DialogTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return <DialogPrimitive.Overlay data-slot="dialog-overlay" className={cn("fiori-dialog-overlay z-50", className)} {...props} />
}

type DialogContentProps = React.ComponentProps<typeof DialogPrimitive.Content> & {
  /**
   * Value state of the dialog (ui5-dialog `state`): colors the header line and shows the state icon.
   * Negative and critical dialogs get role="alertdialog".
   */
  state?: ValueState
  /** Render in place instead of in a portal on document.body (no overlay is rendered then either). */
  portal?: boolean
  /** Move by the header on desktop; arrow keys work on the keyboard handle at the end. */
  draggable?: boolean
  /** Resize from the bottom-end corner on desktop, or with Shift+arrows on the keyboard handle. */
  resizable?: boolean
  /** Override UI5's English movement announcements, handle names and tooltip. */
  movementTexts?: Partial<DialogMovementTexts>
}

type DialogMovementTexts = {
  dragDescription: string
  resizeDescription: string
  dragResizeDescription: string
  dragReachDescription: string
  resizeReachDescription: string
  dragResizeReachDescription: string
  dragHandleLabel: string
  resizeHandleLabel: string
  dragResizeHandleLabel: string
  handleRoleDescription: string
  resizeHandleTooltip: string
}

// UI5 Dialog.js accessibility getters and generated/i18n/i18n-defaults.js (2.28).
const defaultMovementTexts: DialogMovementTexts = {
  dragDescription: "Use arrow keys to move",
  resizeDescription: "Use shift+arrow keys to resize",
  dragResizeDescription: "Use arrow keys to move, Shift+arrow keys to resize",
  dragReachDescription: "Tab to the end of dialog to reach drag handle.",
  resizeReachDescription: "Tab to the end of dialog to reach resize handle.",
  dragResizeReachDescription: "Tab to the end of dialog to reach drag and resize handle.",
  dragHandleLabel: "Drag Dialog",
  resizeHandleLabel: "Resize Dialog",
  dragResizeHandleLabel: "Drag and Resize Dialog",
  handleRoleDescription: "Handle",
  resizeHandleTooltip: "Drag handle to resize (shift+arrow)",
}

// UI5 base/util/clamp.js preserves the minimum when the available viewport is smaller.
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max))
// Dialog.js STEP_SIZE is an interaction constant, independent of density and root font size.
const MOVEMENT_STEP = 16

function DialogContent({ className, children, state = "none", portal = true, draggable = false, resizable = false,
  movementTexts, style, ref, "aria-describedby": describedBy, ...props }: DialogContentProps) {
  const { modal, open } = React.useContext(DialogContext)
  const [rangeRef, range] = usePopupMediaRange<HTMLDivElement>()
  const surfaceRef = React.useRef<HTMLDivElement | null>(null)
  const surfaceObserver = React.useRef<ResizeObserver | null>(null)
  const mouseCleanup = React.useRef<(() => void) | undefined>(undefined)
  const resized = React.useRef(false)
  // Dialog.js _draggedOrResized belongs to the dialog instance and survives close/reopen.
  // Keyboard movement leaves it false; pointer dragging and either resize path set it true.
  const draggedOrResized = React.useRef(false)
  const [geometry, setGeometry] = React.useState<React.CSSProperties>({})
  const geometryRef = React.useRef<React.CSSProperties>({})
  const [desktop, setDesktop] = React.useState(false)
  const movementId = React.useId()
  const texts = { ...defaultMovementTexts, ...movementTexts }
  const movable = desktop && (draggable || resizable)
  const description = draggable && resizable ? texts.dragResizeDescription : draggable ? texts.dragDescription : texts.resizeDescription
  const reachDescription = draggable && resizable ? texts.dragResizeReachDescription : draggable ? texts.dragReachDescription : texts.resizeReachDescription
  const handleLabel = draggable && resizable ? texts.dragResizeHandleLabel : draggable ? texts.dragHandleLabel : texts.resizeHandleLabel
  const updateGeometry = React.useCallback((next: React.CSSProperties) => {
    geometryRef.current = { ...geometryRef.current, right: "auto", bottom: "auto", margin: 0, ...next }
    setGeometry(geometryRef.current)
  }, [])
  const contentRef = React.useCallback<React.RefCallback<HTMLDivElement>>((node) => {
    if (surfaceRef.current && surfaceRef.current !== node) surfaceObserver.current?.unobserve(surfaceRef.current)
    surfaceRef.current = node
    // Radix Portal may mount Content after the open effect has created its observer.
    // Observe in both lifecycle paths so Popup.js's open-surface ResizeHandler is always bound.
    if (node) surfaceObserver.current?.observe(node)
    if (node && portal && movable) {
      // Dialog.js _show/_center uses rounded offset sizes on every open. A stable ref centers
      // only on mount, so subsequent drag/resize renders cannot re-center the moving surface.
      updateGeometry({ top: Math.round((window.innerHeight - node.offsetHeight) / 2), left: Math.round((window.innerWidth - node.offsetWidth) / 2) })
    }
    if (typeof ref === "function") {
      const cleanup = ref(node)
      if (typeof cleanup === "function") return () => {
        if (surfaceRef.current === node) {
          if (node) surfaceObserver.current?.unobserve(node)
          surfaceRef.current = null
        }
        cleanup()
      }
    } else if (ref) ref.current = node
  }, [movable, portal, ref, updateGeometry])
  React.useLayoutEffect(() => {
    // Device.js isWindows8OrAbove parses the NT MAJOR and compares >= 8, so touch NT 6.2/6.3
    // remain non-desktop in UI5 2.28. A narrow non-touch browser still counts as desktop.
    const windowsVersion = navigator.userAgent.match(/Windows NT (\d+).(\d)/)
    setDesktop(!("ontouchstart" in window || navigator.maxTouchPoints > 0)
      || Boolean(navigator.platform.includes("Win") && windowsVersion && Number.parseFloat(windowsVersion[1]) >= 8))
  }, [])
  React.useLayoutEffect(() => {
    if (!open) {
      mouseCleanup.current?.()
      // Dialog.js registers _revertSize on close only after resizing. Mouse dragging retains
      // the measured size, while _show/_center resets the position on the next open.
      const { width, height } = geometryRef.current
      geometryRef.current = resized.current ? {} : {
        ...(width === undefined ? {} : { width }),
        ...(height === undefined ? {} : { height }),
      }
      resized.current = false
      setGeometry(geometryRef.current)
    }
  }, [open])
  React.useEffect(() => {
    if (!open || !portal || !movable) return
    const center = () => {
      const node = surfaceRef.current
      if (node) updateGeometry({ top: Math.round((window.innerHeight - node.offsetHeight) / 2), left: Math.round((window.innerWidth - node.offsetWidth) / 2) })
    }
    // Dialog.js _screenResize() calls _center() even after the dialog was moved/resized.
    window.addEventListener("resize", center)
    let resizeFrame = 0
    // Popup.js _registerResizeHandler observes getDomRef(); Dialog.js _resize re-centers
    // on content/surface size changes only before pointer dragging or any resizing.
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(() => {
        if (!draggedOrResized.current) center()
      })
    })
    surfaceObserver.current = observer
    if (surfaceRef.current) observer.observe(surfaceRef.current)
    return () => {
      window.removeEventListener("resize", center)
      if (surfaceObserver.current === observer) surfaceObserver.current = null
      observer.disconnect()
      cancelAnimationFrame(resizeFrame)
    }
  }, [open, portal, movable, updateGeometry])
  React.useEffect(() => () => mouseCleanup.current?.(), [])
  const minHeight = (node: HTMLElement) => {
    // Dialog.js _minHeight: content minimum plus the rendered header/footer heights.
    const body = node.querySelector<HTMLElement>('[data-slot="dialog-body"]')
    return (body ? Number.parseInt(getComputedStyle(body).minHeight) || 0 : 0)
      + (node.querySelector<HTMLElement>('[data-slot="dialog-header"]')?.offsetHeight ?? 0)
      + (node.querySelector<HTMLElement>('[data-slot="dialog-footer"]')?.offsetHeight ?? 0)
  }
  const trackMouse = (move: (event: MouseEvent) => void) => {
    mouseCleanup.current?.()
    const cleanup = () => {
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseup", cleanup)
      mouseCleanup.current = undefined
    }
    mouseCleanup.current = cleanup
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", cleanup)
  }
  const startDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    // Dialog.js _isHeader/_onDragMouseDown accepts the header itself, never its buttons/title.
    if (!movable || !draggable || event.target !== event.currentTarget || event.defaultPrevented) return
    const node = surfaceRef.current
    if (!node) return
    draggedOrResized.current = true
    const box = node.getBoundingClientRect()
    const computed = getComputedStyle(node)
    updateGeometry({ top: box.top, left: box.left, width: Math.round(Number.parseFloat(computed.width) * 100) / 100, height: Math.round(Number.parseFloat(computed.height) * 100) / 100 })
    let x = event.clientX, y = event.clientY, left = box.left, top = box.top
    // Dialog.js _onDragMouseMove deliberately does not clamp mouse dragging (keyboard does).
    trackMouse((next) => {
      next.preventDefault()
      left = Math.floor(left + next.clientX - x)
      top = Math.floor(top + next.clientY - y)
      updateGeometry({ left, top })
      x = next.clientX
      y = next.clientY
    })
  }
  const startResize = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!movable || !resizable) return
    event.preventDefault()
    const node = surfaceRef.current
    if (!node) return
    resized.current = true
    draggedOrResized.current = true
    const box = node.getBoundingClientRect(), computed = getComputedStyle(node)
    const minimumWidth = Number.parseFloat(computed.minWidth), minimumHeight = minHeight(node)
    const rtl = computed.direction === "rtl", x = event.clientX, y = event.clientY
    updateGeometry({ left: box.left, top: box.top })
    // Dialog.js _onResizeMouseDown/Move: keep the opposite edge fixed, clamp to the viewport.
    trackMouse((next) => {
      const width = clamp(box.width + (rtl ? x - next.clientX : next.clientX - x), minimumWidth, rtl ? box.right : window.innerWidth - box.left)
      let left: number | undefined
      if (rtl) {
        // UI5 _onResizeMouseMove reads the actual width after applying max-width before moving
        // the left edge, so a CSS-limited width cannot make the anchored right edge jump.
        node.style.width = `${width}px`
        const rightEdge = box.right + width - node.getBoundingClientRect().width
        left = clamp(rightEdge - width, 0, rightEdge - minimumWidth)
      }
      updateGeometry({ width, height: clamp(box.height + next.clientY - y, minimumHeight, window.innerHeight - box.top), ...(rtl ? { left } : {}) })
    })
  }
  const moveWithKey = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    // Dialog.js _onDragOrResizeKeyDown targets only the hidden end-of-dialog handle.
    if (!movable || event.target !== event.currentTarget || event.ctrlKey || event.metaKey || event.altKey || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return
    const node = surfaceRef.current
    if (!node || (event.shiftKey ? !resizable : !draggable)) return
    event.preventDefault()
    const box = node.getBoundingClientRect(), horizontal = event.key === "ArrowLeft" || event.key === "ArrowRight"
    const delta = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -MOVEMENT_STEP : MOVEMENT_STEP
    if (event.shiftKey) {
      resized.current = true
      draggedOrResized.current = true
      // Dialog.js _resizeWithEvent uses physical arrows also in RTL (left decreases width).
      updateGeometry({ left: box.left, top: box.top,
        width: clamp(box.width + (horizontal ? delta : 0), Number.parseFloat(getComputedStyle(node).minWidth), window.innerWidth - box.left),
        height: clamp(box.height + (horizontal ? 0 : delta), minHeight(node), window.innerHeight - box.top) })
    } else {
      updateGeometry({ left: horizontal ? clamp(box.left + delta, 0, window.innerWidth - box.width) : box.left,
        top: horizontal ? box.top : clamp(box.top + delta, 0, window.innerHeight - box.height) })
    }
  }
  const alert = state === "negative" || state === "critical"
  const surface = (
    <DialogPrimitive.Content
      ref={contentRef}
      data-slot="dialog-content"
      data-media-range={range}
      data-state-value={state !== "none" ? state : undefined}
      role={alert ? "alertdialog" : "dialog"}
      aria-modal={modal || undefined}
      // Radix DialogContentImpl concatenates its automatic DialogDescription ID with these IDs.
      aria-describedby={movable ? [describedBy, `${movementId}-dialog-description`].filter(Boolean).join(" ") : describedBy}
      data-draggable={draggable || undefined}
      data-resizable={resizable || undefined}
      style={{ ...style, ...geometry }}
      className={cn(
        "fiori-popup fiori-dialog",
        // Centered without transforms (keeps text on whole pixels), like UI5's _center().
        portal ? "fixed inset-0 z-50 m-auto h-fit w-fit" : "relative max-h-none max-w-none",
        className
      )}
      {...props} data-sap-ui-fastnavgroup-container="true"
    >
      <DialogStateContext.Provider value={state}>
        <DialogDragContext.Provider value={startDrag}>
          <div ref={rangeRef} className="fiori-popup__root">
            {children}
            {resizable && movable && <div data-slot="dialog-resize-handle" className="fiori-dialog__resize-handle" title={texts.resizeHandleTooltip} onMouseDown={startResize}><Icon icon={resizeCorner} /></div>}
            {movable && <>
              <span data-slot="dialog-movement-handle" className="fiori-dialog__movement-handle sr-only" tabIndex={0} role="img" aria-roledescription={texts.handleRoleDescription} aria-label={handleLabel} aria-describedby={`${movementId}-movement-description`} onKeyDown={moveWithKey} />
              <span id={`${movementId}-movement-description`} className="sr-only" aria-hidden="true">{description}</span>
              <span id={`${movementId}-dialog-description`} className="sr-only" aria-hidden="true">{reachDescription}</span>
            </>}
          </div>
        </DialogDragContext.Provider>
      </DialogStateContext.Provider>
    </DialogPrimitive.Content>
  )
  if (!portal) return surface
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      {surface}
    </DialogPrimitive.Portal>
  )
}

/** Header bar. Shows the state icon automatically when the dialog has a `state`. */
function DialogHeader({ className, children, onMouseDown, onDragStart, ...props }: React.ComponentProps<"div">) {
  const state = React.useContext(DialogStateContext)
  const startDrag = React.useContext(DialogDragContext)
  return (
    <div data-slot="dialog-header" className={cn("fiori-popup__header", className)} onMouseDown={(event) => { onMouseDown?.(event); startDrag?.(event) }} onDragStart={(event) => {
      onDragStart?.(event)
      if (event.target === event.currentTarget && event.currentTarget.closest("[data-draggable]")) event.preventDefault()
    }} {...props}>
      {state !== "none" && <Icon icon={valueStateIcons[state]} className="fiori-dialog__state-icon" />}
      {children}
    </div>
  )
}

function DialogTitle({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title asChild>
      <h1 data-slot="dialog-title" className={cn("fiori-popup__title", className)} {...props}>
        <span>{children}</span>
      </h1>
    </DialogPrimitive.Title>
  )
}

function DialogDescription(props: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description data-slot="dialog-description" {...props} />
}

/** The padded, scrollable content area. */
function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-body" className={cn("fiori-popup__content", className)} {...props} />
}

/** Footer bar; actions are end-aligned. Put the emphasized action first. */
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-footer" className={cn("fiori-popup__footer", className)} {...props} />
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
  type DialogContentProps,
  type DialogMovementTexts,
}
