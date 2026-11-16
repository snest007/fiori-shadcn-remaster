import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

// Mirrors ui5-toast (Horizon): a short, non-interactive message that fades out on its own.
// - Shown for `duration` ms (default 3000, minimum 500); it fades during the last third (max 1s).
// - Hovering or focusing it pauses the countdown; leaving restarts it, as in UI5.
// - Ctrl+Shift+M (Cmd+Shift+M on macOS) moves focus to the open toast; Escape returns focus.

const MIN_DURATION = 500
const MAX_FADE = 1000

// Like UI5, the keyboard shortcut targets only the most recently opened toast.
const openToasts: React.RefObject<HTMLDivElement | null>[] = []

type ToastPlacement =
  | "top-start"
  | "top-center"
  | "top-end"
  | "middle-start"
  | "middle-center"
  | "middle-end"
  | "bottom-start"
  | "bottom-center"
  | "bottom-end"

/** @accessibility Toast announces its children as an alert. Ctrl+Shift+M (Cmd+Shift+M on macOS) focuses the most recent toast; Escape restores prior focus. Hover or focus pauses automatic dismissal. */
type ToastProps = Omit<React.ComponentProps<"div">, "role"> & {
  open?: boolean
  defaultOpen?: boolean
  /** Called with `false` when the toast closes after its duration. */
  onOpenChange?: (open: boolean) => void
  /** Milliseconds the toast stays visible, fade included. Minimum 500. `Infinity` keeps it open. */
  duration?: number
  /** Where the toast appears in the viewport. */
  placement?: ToastPlacement
  /** Render in place instead of in a portal on document.body (also drops the fixed placement). */
  portal?: boolean
}

function Toast({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  duration = 3000,
  placement = "bottom-center",
  portal = true,
  className,
  style,
  children,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onKeyDown,
  ...props
}: ToastProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen)
  const open = openProp ?? uncontrolled
  const setOpen = React.useCallback(
    (o: boolean) => {
      if (openProp === undefined) setUncontrolled(o)
      onOpenChange?.(o)
    },
    [openProp, onOpenChange]
  )

  const [hovered, setHovered] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const opener = React.useRef<HTMLElement | null>(null)
  const paused = hovered || focused
  const effective = Math.max(duration, MIN_DURATION)
  const finite = Number.isFinite(effective)
  const fade = Math.min(effective / 3, MAX_FADE)

  React.useEffect(() => {
    if (!open || paused || !finite) return
    const t = window.setTimeout(() => setOpen(false), effective)
    return () => window.clearTimeout(t)
    // Re-runs when the pause ends: the countdown restarts from the full duration, and removing then
    // re-adding data-fading restarts the fade animation, as in UI5.
  }, [open, paused, finite, effective, setOpen])

  React.useEffect(() => {
    if (!open) {
      setHovered(false)
      setFocused(false)
    }
  }, [open])

  // Global shortcut to reach the toast with the keyboard (ui5-toast: Ctrl/Cmd+Shift+M).
  React.useEffect(() => {
    if (!open) return
    openToasts.push(ref)
    const onKey = (e: KeyboardEvent) => {
      const mac = /Mac|iPhone|iPad/.test(navigator.platform)
      if (!((mac ? e.metaKey : e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "m")) return
      if (openToasts[openToasts.length - 1] !== ref) return
      e.preventDefault()
      const node = ref.current
      if (!node) return
      if (node.contains(document.activeElement)) opener.current?.focus()
      else {
        opener.current = document.activeElement as HTMLElement | null
        node.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      openToasts.splice(openToasts.indexOf(ref), 1)
    }
  }, [open])

  if (!open) return null

  const toast = (
    <div
      ref={ref}
      data-slot="toast"
      role="alert"
      tabIndex={focused ? 0 : -1}
      data-placement={portal ? placement : undefined}
      data-fading={!paused && finite ? "" : undefined}
      className={cn("fiori-toast", className)}
      style={{ "--fiori-toast-fade-duration": `${fade}ms`, "--fiori-toast-fade-delay": `${effective - fade}ms`, ...style } as React.CSSProperties}
      onMouseEnter={(e) => {
        onMouseEnter?.(e)
        setHovered(true)
      }}
      onMouseLeave={(e) => {
        onMouseLeave?.(e)
        setHovered(false)
      }}
      onFocus={(e) => {
        onFocus?.(e)
        setFocused(true)
      }}
      onBlur={(e) => {
        onBlur?.(e)
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
        setFocused(false)
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        // Unconditional, as in UI5 (another layer may already have handled the same Escape).
        if (e.key === "Escape") opener.current?.focus()
      }}
      {...props}
    >
      <div className="fiori-toast__root">
        <bdi>{children}</bdi>
      </div>
    </div>
  )
  return portal ? createPortal(toast, document.body) : toast
}

export { Toast, type ToastPlacement, type ToastProps }
