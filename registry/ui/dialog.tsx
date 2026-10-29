import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import { valueStateIcons, type ValueState } from "@/components/ui/input"
import { usePopupMediaRange } from "@/components/ui/popover"

// Mirrors ui5-dialog (Horizon): a centered modal with a header bar (optional state icon + title,
// plus a colored state line), padded content and a footer bar whose actions are end-aligned.
// Fiori puts the emphasized (primary) action first in the footer: <Button variant="emphasized">Save</Button><Button>Cancel</Button>.
// Focus moves to the first focusable element on open and returns to the opener on close; Escape closes.

const DialogContext = React.createContext<{ modal: boolean }>({ modal: true })
const DialogStateContext = React.createContext<ValueState>("none")

function Dialog({ modal = true, ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return (
    <DialogContext.Provider value={{ modal }}>
      <DialogPrimitive.Root data-slot="dialog" modal={modal} {...props} />
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
}

function DialogContent({ className, children, state = "none", portal = true, ...props }: DialogContentProps) {
  const { modal } = React.useContext(DialogContext)
  const [rangeRef, range] = usePopupMediaRange<HTMLDivElement>()
  const alert = state === "negative" || state === "critical"
  const surface = (
    <DialogPrimitive.Content
      data-slot="dialog-content"
      data-media-range={range}
      data-state-value={state !== "none" ? state : undefined}
      role={alert ? "alertdialog" : "dialog"}
      aria-modal={modal || undefined}
      className={cn(
        "fiori-popup fiori-dialog",
        // Centered without transforms (keeps text on whole pixels), like UI5's _center().
        portal ? "fixed inset-0 z-50 m-auto h-fit w-fit" : "relative max-h-none max-w-none",
        className
      )}
      {...props}
    >
      <DialogStateContext.Provider value={state}>
        <div ref={rangeRef} className="fiori-popup__root">
          {children}
        </div>
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
function DialogHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  const state = React.useContext(DialogStateContext)
  return (
    <div data-slot="dialog-header" className={cn("fiori-popup__header", className)} {...props}>
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
}
