import * as React from "react"

import { employee, type FioriIconData } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"

type AvatarSize = "XS" | "S" | "M" | "L" | "XL"
type AvatarColorScheme =
  | "auto"
  | "accent1" | "accent2" | "accent3" | "accent4" | "accent5"
  | "accent6" | "accent7" | "accent8" | "accent9" | "accent10"
  | "placeholder"
  | "transparent"

type AvatarProps = Omit<React.ComponentProps<"button">, "children"> & {
  size?: AvatarSize
  shape?: "circle" | "square"
  /** "auto" is Accent6, as in UI5 (AvatarGroup assigns accents 1–10 in turn). */
  colorScheme?: AvatarColorScheme
  /** 1–3 letters. Falls back to `fallbackIcon` when invalid or too wide to fit. */
  initials?: string
  /** Icon shown instead of initials. */
  icon?: FioriIconData
  /** Shown when there are neither initials nor icon (default "employee"). */
  fallbackIcon?: FioriIconData
  /** Image URL. On load error the avatar falls back to initials / icon. */
  src?: string
  alt?: string
  /** Renders a focusable <button> (Enter / Space activate). */
  interactive?: boolean
  /** Non-interactive avatars are role="img"; "decorative" hides them from assistive tech. */
  mode?: "image" | "decorative"
  /** Default: "Avatar" + initials. */
  accessibleName?: string
  /** Optional badge element, positioned bottom-end. */
  badge?: React.ReactNode
}

const iconSizes: Record<AvatarSize, string> = {
  XS: "[&>svg]:size-(--fiori-avatar-icon-xs)",
  S: "[&>svg]:size-(--fiori-avatar-icon-s)",
  M: "[&>svg]:size-(--fiori-avatar-icon-m)",
  L: "[&>svg]:size-(--fiori-avatar-icon-l)",
  XL: "[&>svg]:size-(--fiori-avatar-icon-xl)",
}

// UI5: 1–3 letters from any script where initials are meaningful (not Han / Kana).
const validInitials = (s?: string) =>
  !!s && /^\p{L}{1,3}$/u.test(s) && !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(s)

// Mirrors ui5-avatar (Horizon).
function Avatar({
  size = "S",
  shape = "circle",
  colorScheme = "auto",
  initials,
  icon,
  fallbackIcon = employee,
  src,
  alt = "",
  interactive,
  mode = "image",
  accessibleName,
  badge,
  disabled,
  className,
  ...props
}: AvatarProps) {
  const [imageFailed, setImageFailed] = React.useState(false)
  React.useEffect(() => setImageFailed(false), [src])
  const hasImage = !!src && !imageFailed
  const rootRef = React.useRef<HTMLElement>(null)
  const initialsRef = React.useRef<HTMLSpanElement>(null)
  const showInitialsCandidate = !hasImage && !icon && validInitials(initials)
  const [initialsFit, setInitialsFit] = React.useState(true)
  React.useLayoutEffect(() => {
    const root = rootRef.current
    const el = initialsRef.current
    if (!root || !el) return
    const check = () => setInitialsFit(el.scrollWidth <= root.scrollWidth)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [showInitialsCandidate, initials, size])

  const isInteractive = interactive && !disabled
  const label = accessibleName ?? (initials ? `Avatar ${initials}` : "Avatar")
  const scheme = colorScheme === "auto" ? "accent6" : colorScheme

  const content = hasImage ? (
    <img className="fiori-avatar__image" src={src} alt={alt} onError={() => setImageFailed(true)} />
  ) : icon ? (
    <Icon icon={icon} />
  ) : showInitialsCandidate ? (
    <>
      {/* Drawn with ::before (content: attr(data-initials)): the avatar's name comes from aria-label, and
          keeping the letters out of the DOM text stops them leaking into a parent's name (e.g. AvatarGroup). */}
      <span ref={initialsRef} className="fiori-avatar__initials" data-initials={initials} data-hidden={initialsFit ? undefined : ""} aria-hidden />
      {!initialsFit && <Icon icon={fallbackIcon} />}
    </>
  ) : (
    <Icon icon={fallbackIcon} />
  )

  const common = {
    "data-slot": "avatar",
    "data-size": size,
    "data-shape": shape,
    "data-color-scheme": scheme,
    "data-has-image": hasImage ? "" : undefined,
    "data-interactive": isInteractive ? "" : undefined,
    "data-disabled": disabled ? "" : undefined,
    className: cn("fiori-avatar", iconSizes[size], "[&>svg]:text-inherit", className),
  }
  const children = (
    <>
      {content}
      {badge}
    </>
  )

  if (interactive) {
    return (
      <button
        ref={rootRef as React.Ref<HTMLButtonElement>}
        type="button"
        aria-label={label}
        disabled={disabled}
        {...common}
        {...props}
      >
        {children}
      </button>
    )
  }
  const decorative = mode === "decorative"
  return (
    <div
      ref={rootRef as React.Ref<HTMLDivElement>}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
      {...common}
      {...(props as React.ComponentProps<"div">)}
    >
      {children}
    </div>
  )
}

type AvatarGroupProps = React.ComponentProps<"div"> & {
  /**
   * "group": avatars overlap and the whole group is one button (onClick).
   * "individual": avatars sit side by side, each interactive on its own.
   */
  type?: "group" | "individual"
  /** Size applied to every child Avatar that doesn't set its own. */
  size?: AvatarSize
}

const groupOffsets: Record<AvatarSize, { group: string; individual: string }> = {
  XS: { individual: "0.0625rem", group: "-0.5rem" },
  S: { individual: "0.125rem", group: "-1.25rem" },
  M: { individual: "0.125rem", group: "-1.625rem" },
  L: { individual: "0.125rem", group: "-2rem" },
  XL: { individual: "0.25rem", group: "-2.75rem" },
}

// Mirrors ui5-avatar-group without overflow handling: assigns Accent1..10 to "auto" avatars and
// the UI5 offsets between them. Overflow (+N button) is left to the caller.
// Default aria-label is UI5's; pass aria-label to override (`{...props}` comes after it).
function AvatarGroup({ type = "group", size = "S", className, children, onClick, onKeyDown, onKeyUp, ...props }: AvatarGroupProps) {
  const isGroup = type === "group"
  // Individual mode: roving tabindex with arrow / Home / End navigation (UI5 ItemNavigation).
  const [current, setCurrent] = React.useState(0)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const moveFocus = (e: React.KeyboardEvent) => {
    const buttons = [...(containerRef.current?.querySelectorAll<HTMLElement>(":scope > button:not(:disabled)") ?? [])]
    const i = buttons.indexOf(e.target as HTMLElement)
    if (i < 0) return
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
    const next = { ArrowRight: rtl ? i - 1 : i + 1, ArrowDown: i + 1, ArrowLeft: rtl ? i + 1 : i - 1, ArrowUp: i - 1, Home: 0, End: buttons.length - 1 }[e.key]
    if (next === undefined) return
    e.preventDefault()
    const target = buttons[Math.max(0, Math.min(buttons.length - 1, next))]
    target.focus()
  }
  const items = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<AvatarProps>[]
  return (
    <div data-slot="avatar-group" data-type={type} className={cn("flex p-(--fiori-avatar-group-padding)", className)}>
      <div
        ref={containerRef}
        role={isGroup ? "button" : "group"}
        tabIndex={isGroup ? 0 : undefined}
        className={cn(
          "fiori-avatar-group relative inline-flex whitespace-nowrap outline-none",
          isGroup && "cursor-pointer"
        )}
        data-size={size}
        aria-label={
          isGroup
            ? `Conjoined avatars. ${items.length} displayed, 0 hidden. Activate for complete list.`
            : `Individual avatars. ${items.length} displayed, 0 hidden. Press ARROW keys to move.`
        }
        onClick={isGroup ? onClick : undefined}
        onKeyDown={(e) => {
          onKeyDown?.(e)
          if (e.defaultPrevented) return
          if (!isGroup) return moveFocus(e)
          if (e.key === "Enter") e.currentTarget.click()
          if (e.key === " ") e.preventDefault()
        }}
        onKeyUp={(e) => {
          onKeyUp?.(e)
          if (isGroup && !e.defaultPrevented && e.key === " ") e.currentTarget.click()
        }}
        {...props}
      >
        {items.map((child, i) => {
          const s = child.props.size ?? size
          const last = i === items.length - 1
          return React.cloneElement(child, {
            key: child.key ?? i,
            size: s,
            interactive: isGroup ? false : (child.props.interactive ?? true),
            // In a group the container is the one button; its avatars are decoration.
            mode: isGroup ? "decorative" : child.props.mode,
            colorScheme:
              !child.props.colorScheme || child.props.colorScheme === "auto"
                ? (`accent${(i % 10) + 1}` as AvatarColorScheme)
                : child.props.colorScheme,
            style: { marginInlineEnd: last ? undefined : groupOffsets[s][type], ...child.props.style },
            ...(isGroup ? {} : { tabIndex: i === current ? 0 : -1, onFocus: () => setCurrent(i) }),
          })
        })}
      </div>
    </div>
  )
}

export { Avatar, AvatarGroup, type AvatarProps, type AvatarGroupProps, type AvatarSize, type AvatarColorScheme }
