import * as React from "react"

import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"

// Mirrors ui5-toolbar (Horizon). Items are laid out in a row (aligned to the end by default),
// <ToolbarSpacer> takes the free space, <ToolbarSeparator> draws a vertical line.
// Keyboard (as UI5): every item stays in the Tab order; ←/→ move focus to the previous/next
// enabled item and Home/End to the first/last (no wrap-around). Inputs keep ←/→ until the
// caret reaches their edge, and keep Home/End.
// Not yet implemented: the overflow ("Additional Options") button and popover.
type ToolbarProps = React.ComponentProps<"div"> & {
  /** Where items go when there is no spacer. UI5 default: "end". */
  alignContent?: "start" | "end"
  /** "transparent" drops the toolbar background. */
  design?: "solid" | "transparent"
}

const FOCUSABLE =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"

function navigableItems(toolbar: HTMLElement) {
  return [...toolbar.children].flatMap((item) => {
    const el = item as HTMLElement
    if (el.hidden || el.dataset.slot === "toolbar-spacer" || el.dataset.slot === "toolbar-separator") return []
    const target = el.matches(FOCUSABLE) ? el : el.querySelector<HTMLElement>(FOCUSABLE)
    return target ? [{ item: el, target }] : []
  })
}

// Text fields own ←/→ until the caret is at the matching edge, and always own Home/End.
function fieldKeepsKey(el: HTMLElement, key: string, forward: boolean) {
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return false
  if (el instanceof HTMLInputElement && el.selectionStart === null) return false // checkbox, button…
  if (key === "Home" || key === "End") return true
  const { selectionStart: s, selectionEnd: e, value } = el
  return forward ? !(s === value.length && e === value.length) : !(s === 0 && e === 0)
}

function Toolbar({ alignContent = "end", design = "solid", className, onKeyDown, ...props }: ToolbarProps) {
  return (
    <div
      data-slot="toolbar"
      role="toolbar"
      data-design={design}
      className={cn(
        "fiori-toolbar flex h-(--fiori-x-toolbar-height) w-full items-center",
        "border-b-(length:--sapGroup_TitleBorderWidth) border-solid border-b-(--sapGroup_TitleBorderColor)",
        "pe-(--fiori-x-toolbar-padding-right) ps-(--fiori-x-toolbar-padding-left)",
        design === "transparent" ? "bg-transparent" : "bg-(--sapToolbar_Background)",
        alignContent === "start" ? "justify-start" : "justify-end",
        className
      )}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return
        const toolbar = e.currentTarget
        const rtl = getComputedStyle(toolbar).direction === "rtl"
        const forward = e.key === (rtl ? "ArrowLeft" : "ArrowRight") || e.key === "Home"
        const active = e.target as HTMLElement
        if (fieldKeepsKey(active, e.key, e.key === "Home" ? false : forward)) return
        const items = navigableItems(toolbar)
        const current = items.findIndex(({ item }) => item.contains(active))
        if (current === -1) return
        const next =
          e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : Math.min(Math.max(current + (forward ? 1 : -1), 0), items.length - 1)
        e.preventDefault()
        e.stopPropagation()
        if (next !== current) items[next].target.focus()
      }}
      {...props}
    />
  )
}

/** A Fiori button as a toolbar item (ui5-toolbar-button); takes every Button prop, e.g. variant="transparent". */
function ToolbarButton(props: ButtonProps) {
  return <Button data-toolbar-item="" {...props} />
}

type ToolbarSpacerProps = React.ComponentProps<"div"> & {
  /** Fixed width (any CSS length). Without it the spacer takes all remaining space. */
  width?: string
}

/** Takes the remaining width, pushing the following items to the end; or a fixed gap with `width`. */
function ToolbarSpacer({ width, className, style, ...props }: ToolbarSpacerProps) {
  const flexible = !width || width === "auto"
  return (
    <div
      data-slot="toolbar-spacer"
      data-flexible={flexible ? "" : undefined}
      aria-hidden
      className={cn(flexible && "flex-auto", className)}
      style={flexible ? style : { width, ...style }}
      {...props}
    />
  )
}

function ToolbarSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="toolbar-separator"
      role="separator"
      aria-orientation="vertical"
      className={cn("h-(--fiori-x-toolbar-separator-height) w-[0.0625rem] bg-(--sapToolbar_SeparatorColor)", className)}
      {...props}
    />
  )
}

export { Toolbar, ToolbarButton, ToolbarSpacer, ToolbarSeparator, type ToolbarProps }
