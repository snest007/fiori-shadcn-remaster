// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { Slot } from "radix-ui"
import { useIsPhone } from "@/lib/use-is-phone"
import { decline } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger, type PopoverContentProps } from "@/components/ui/popover"

type ResponsivePopoverProps = React.ComponentProps<typeof Popover> & { dir?: "ltr" | "rtl" }
const ResponsiveContext = React.createContext<{ phone: boolean; close: () => void; dir?: "ltr" | "rtl"; owner: React.RefObject<HTMLElement | null> }>({ phone: false, close: () => {}, owner: { current: null } })
function ResponsivePopover({ open: openProp, defaultOpen = false, onOpenChange, children, dir, ...props }: ResponsivePopoverProps) {
  const phone = useIsPhone()
  const owner = React.useRef<HTMLElement>(null)
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const open = openProp ?? internalOpen
  const change = (next: boolean) => { if (openProp === undefined) setInternalOpen(next); onOpenChange?.(next) }
  const Root = phone ? Dialog : Popover
  return <ResponsiveContext.Provider value={{ phone, close: () => change(false), dir, owner }}><Root {...props} open={open} onOpenChange={change}>{children}</Root></ResponsiveContext.Provider>
}
function ResponsivePopoverTrigger({ ref, ...props }: React.ComponentProps<typeof PopoverTrigger>) {
  const context = React.useContext(ResponsiveContext)
  const ownerRef = React.useCallback((node: HTMLButtonElement | null) => {
    context.owner.current = node
    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node
  }, [context.owner, ref])
  return context.phone ? <DialogTrigger {...props} ref={ownerRef} /> : <PopoverTrigger {...props} ref={ownerRef} />
}
function ResponsivePopoverAnchor({ children, asChild, ref, ...props }: React.ComponentProps<typeof PopoverAnchor>) {
  const context = React.useContext(ResponsiveContext)
  const ownerRef = React.useCallback((node: HTMLDivElement | null) => {
    context.owner.current = node
    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node
  }, [context.owner, ref])
  if (!context.phone) return <PopoverAnchor {...props} asChild={asChild} ref={ownerRef}>{children}</PopoverAnchor>
  const Host = asChild ? Slot.Root : "div"
  return <Host {...props} ref={ownerRef} style={asChild ? props.style : { ...props.style, display: "contents" }}>{children}</Host>
}
/** @accessibility The desktop popover and phone dialog require headerText or aria-label on the surface. The phone close button uses closeLabel. Tab stays in the phone dialog, Escape closes it, and focus returns to the opener unless preventFocusRestore is set. */
type ResponsivePopoverContentProps = PopoverContentProps & {
  /** Phone title; callers with a custom header still get an accessible dialog title. */
  headerText?: string
  closeLabel?: string
  /** Replaces the phone title/close bar, like ResponsivePopover's header slot. */
  phoneHeader?: React.ReactNode
  phoneFooter?: React.ReactNode
  /** Field pickers have unpadded content/header parts in UI5. */
  phoneField?: boolean
  phoneClassName?: string
  /** UI5 preventFocusRestore, e.g. the editable suggestion fields close the keyboard. */
  preventFocusRestore?: boolean
  /** Keep a portalled phone surface in its field/trigger direction scope. */
  phoneOwnerRef?: React.RefObject<HTMLElement | null>
}
function ResponsivePopoverContent({ headerText = "", closeLabel = "Decline", phoneHeader, phoneFooter,
  phoneField, phoneClassName, preventFocusRestore, phoneOwnerRef, children, asChild, className, portal = true,
  onCloseAutoFocus, onOpenAutoFocus, onEscapeKeyDown, onInteractOutside, onPointerDownOutside,
  onFocusOutside, ref, style, ...props }: ResponsivePopoverContentProps) {
  const { phone, close, dir, owner } = React.useContext(ResponsiveContext)
  const titleId = React.useId()
  const [ownerDirection, setOwnerDirection] = React.useState<"ltr" | "rtl">("ltr")
  const [hasExplicitName, setHasExplicitName] = React.useState(false)
  React.useLayoutEffect(() => {
    if (!phone) return
    const update = () => {
      const referenced = props["aria-labelledby"]?.split(/\s+/).some((id) => document.getElementById(id)?.textContent?.trim())
      setHasExplicitName(!!(referenced || props["aria-label"]?.trim()))
    }
    update()
    if (!props["aria-labelledby"]) return
    const observer = new MutationObserver(update)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["id"] })
    return () => observer.disconnect()
  }, [phone, props["aria-label"], props["aria-labelledby"]])
  React.useLayoutEffect(() => {
    if (!phone) return
    const node = phoneOwnerRef?.current ?? owner.current
    const update = () => setOwnerDirection(getComputedStyle(node ?? document.documentElement).direction === "rtl" ? "rtl" : "ltr")
    update()
    const observer = new MutationObserver(update)
    for (let parent = node; parent; parent = parent.parentElement) observer.observe(parent, { attributes: true, attributeFilter: ["dir", "style", "class"] })
    return () => observer.disconnect()
  }, [phone, phoneOwnerRef, owner])
  if (!phone) return <PopoverContent {...props} asChild={asChild} dir={props.dir ?? dir} ref={ref} style={style} className={className} portal={portal}
    onOpenAutoFocus={onOpenAutoFocus} onCloseAutoFocus={onCloseAutoFocus} onEscapeKeyDown={onEscapeKeyDown}
    onInteractOutside={onInteractOutside} onPointerDownOutside={onPointerDownOutside} onFocusOutside={onFocusOutside}>{children}</PopoverContent>
  // ResponsivePopoverTemplate.js: a stretch Dialog; custom header replaces the
  // default title/decline button. Position/placement props belong only to Popover.
  const { side: _side, align: _align, sideOffset: _offset, alignOffset: _alignOffset,
    avoidCollisions: _avoid, collisionPadding: _padding, collisionBoundary: _boundary,
    sticky: _sticky, hideWhenDetached: _hide, hideArrow: _arrow, draggable: _draggable, ...dialogProps } = props
  const custom = asChild ? React.Children.only(children) as React.ReactElement<{ children?: React.ReactNode }> : undefined
  // ResponsivePopoverTemplate.js places header/content/footer inside its owning
  // phone Dialog. Keep the consumer host around that body before forwarding Slot.
  const body = <>
    {/* ResponsivePopoverTemplate.js replaces its fallback Title with a custom
        header slot. DatePickerPopoverTemplate.js:defaultHeader supplies a span;
        SelectPopoverTemplate.js supplies one Title. An explicitly named dialog
        must not expose an additional internal heading. Keep the title when it
        is still the only fallback naming channel. */}
    {phoneHeader !== undefined ? <><DialogTitle id={titleId} className="sr-only" aria-hidden={hasExplicitName || undefined}>{headerText}</DialogTitle><DialogHeader className="fiori-responsive-popover__field-header">{phoneHeader}</DialogHeader></> :
      <DialogHeader className="fiori-responsive-popover__default-header"><DialogTitle id={titleId}>{headerText}</DialogTitle><Button variant="transparent" aria-label={closeLabel} onClick={close}><Icon icon={decline} /></Button></DialogHeader>}
    <div data-slot="responsive-popover-body" className="fiori-popup__content">{custom ? custom.props.children : children}</div>
    {phoneFooter != null && <div data-slot="responsive-popover-footer" className="fiori-popup__footer fiori-responsive-popover__footer">{phoneFooter}</div>}
  </>
  return <DialogContent {...dialogProps} asChild={asChild} dir={props.dir ?? dir ?? ownerDirection} ref={ref} portal={portal} aria-describedby={props["aria-describedby"]}
    // Dialog.js:_ariaLabelledBy binds the header title when no explicit name
    // is supplied. Own the binding even across the responsive Root switch.
    aria-labelledby={props["aria-labelledby"] ?? (props["aria-label"]?.trim() ? undefined : titleId)}
    style={style} className={cn("fiori-responsive-popover h-full w-full max-h-full max-w-full min-h-0 min-w-0 rounded-none", phoneField && "fiori-responsive-popover--field", className, phoneClassName)}
    onOpenAutoFocus={onOpenAutoFocus} onCloseAutoFocus={(event) => {
      onCloseAutoFocus?.(event)
      if (preventFocusRestore) event.preventDefault()
      else if (!event.defaultPrevented && owner.current) { event.preventDefault(); owner.current.focus() }
    }} onEscapeKeyDown={onEscapeKeyDown} onInteractOutside={(event) => { event.preventDefault(); onInteractOutside?.(event) }}
    onPointerDownOutside={(event) => { event.preventDefault(); onPointerDownOutside?.(event) }} onFocusOutside={onFocusOutside}>
    {custom ? React.cloneElement(custom, {}, body) : body}
  </DialogContent>
}
export { ResponsivePopover, ResponsivePopoverTrigger, ResponsivePopoverAnchor, ResponsivePopoverContent, type ResponsivePopoverContentProps, type ResponsivePopoverProps }
