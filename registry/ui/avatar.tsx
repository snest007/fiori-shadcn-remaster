// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by shadcn-fiori: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

import { employee, type FioriIconData } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import { Button } from "@/components/ui/button"

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

// UI5 webcomponents-base/Keys.js isEnter/isSpace and ItemNavigation use hasModifierKeys.
const hasAvatarModifier = (event: Pick<React.KeyboardEvent, "shiftKey" | "ctrlKey" | "altKey" | "metaKey">) =>
  event.shiftKey || event.ctrlKey || event.altKey || event.metaKey
const isAvatarActivationKey = (key: string) => key === "Enter" || key === " " || key === "Spacebar"

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
  onKeyDown,
  onKeyUp,
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
        onKeyDown={(event) => {
          onKeyDown?.(event)
          // Avatar.js _onkeydown delegates to Keys.isEnter/isSpace (no modifiers).
          // A native button would otherwise activate modified Enter/Space by default.
          if (hasAvatarModifier(event) && isAvatarActivationKey(event.key)) event.preventDefault()
        }}
        onKeyUp={(event) => {
          onKeyUp?.(event)
          // Avatar.js _onkeyup also rejects modified Space on release.
          if (hasAvatarModifier(event) && isAvatarActivationKey(event.key)) event.preventDefault()
        }}
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
      {...({ onKeyDown, onKeyUp, ...props } as React.ComponentProps<"div">)}
    >
      {children}
    </div>
  )
}

type AvatarGroupClickDetail = {
  targetRef: HTMLElement
  overflowButtonClicked: boolean
}

type AvatarGroupTexts = {
  groupLabel?: string
  individualLabel?: string
  displayedHiddenLabel?: (displayed: number, hidden: number) => string
  showCompleteListLabel?: string
  moveLabel?: string
  overflowButtonText?: (hidden: number) => string
}

type AvatarGroupProps = React.ComponentProps<"div"> & {
  /** "group" is one button; "individual" roves avatars, followed by an overflow Tab stop. */
  type?: "group" | "individual"
  /** Size applied to every child Avatar that doesn't set its own. */
  size?: AvatarSize
  /** Custom overflow control. Like UI5's slot, it stays visible even when every avatar fits. */
  overflowButton?: React.ReactNode
  /** Original child elements, in their supplied order, currently hidden by lack of space. */
  onOverflowClick?: (hiddenItems: React.ReactElement<AvatarProps>[]) => void
  /** Matches AvatarGroup.js _fireGroupEvent/onAvatarClick/onOverflowButtonClick. */
  onGroupClick?: (detail: AvatarGroupClickDetail) => void
  accessibleName?: string
  texts?: AvatarGroupTexts
}

// UI5 AvatarGroup.js offsets: these geometry values have no theme parameters.
const groupOffsets: Record<AvatarSize, { group: string; individual: string }> = {
  XS: { individual: "0.0625rem", group: "-0.5rem" },
  S: { individual: "0.125rem", group: "-1.25rem" },
  M: { individual: "0.125rem", group: "-1.625rem" },
  L: { individual: "0.125rem", group: "-2rem" },
  XL: { individual: "0.25rem", group: "-2.75rem" },
}

function AvatarGroup({
  type = "group", size = "S", className, children, overflowButton, onOverflowClick, onGroupClick,
  accessibleName, texts, onClick, onKeyDown, onKeyUp, onFocus, style, ...props
}: AvatarGroupProps) {
  const isGroup = type === "group"
  const collectItems = (nodes: React.ReactNode): React.ReactElement<AvatarProps>[] => React.Children.toArray(nodes).flatMap((child) => {
    if (!React.isValidElement<AvatarProps & { children?: React.ReactNode }>(child)) return []
    return child.type === React.Fragment ? collectItems(child.props.children) : [child]
  })
  const items = collectItems(children)
  const hasCustomOverflow = overflowButton !== undefined && overflowButton !== null && overflowButton !== false
  const firstSize = items[0]?.props.size ?? size
  const hostRef = React.useRef<HTMLDivElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const overflowRef = React.useRef<HTMLSpanElement>(null)
  const overflowSpacePressed = React.useRef(false)
  const overflowCancelAction = React.useRef(false)
  const [visibleCount, setVisibleCount] = React.useState(items.length)
  const [current, setCurrent] = React.useState(0)
  const hiddenItems = items.slice(visibleCount)
  const showOverflow = hasCustomOverflow || hiddenItems.length > 0

  const overflowControl = () => {
    const wrapper = overflowRef.current
    return wrapper?.querySelector<HTMLElement>("button, [role=button], a[href]") ?? wrapper
  }
  const controls = () => {
    // AvatarGroup.js ItemNavigation manages only visible avatars; overflow has its own Tab stop.
    return [...(containerRef.current?.querySelectorAll<HTMLElement>(":scope > button:not(:disabled):not([hidden])") ?? [])]
  }

  React.useLayoutEffect(() => {
    const host = hostRef.current
    const container = containerRef.current
    if (!host || !container) return
    // Port AvatarGroup.js _overflowItems/_overflowButtonEffectiveWidth/_getWidthToItem:
    // reveal only the current item, and reserve overflow width from the current visibility.
    // Revealing every avatar together changes UI5's ultra-narrow group result.
    const measure = () => {
      const avatars = [...container.querySelectorAll<HTMLElement>(":scope > [data-slot=avatar]")]
      const overflow = overflowRef.current
      if (!overflow) return
      const rtl = getComputedStyle(host).direction === "rtl"
      const hostBox = host.getBoundingClientRect()
      const widthToItem = (item: HTMLElement) => {
        if (!item.offsetParent) return rtl ? 0 : -host.offsetLeft
        const box = item.getBoundingClientRect()
        // Slotted UI5 hosts share offset coordinates; our light-DOM avatars have the inner
        // flex container as offsetParent. Use the same integer distance from the host edge.
        return Math.round(rtl ? hostBox.right - box.right : box.left - hostBox.left)
      }
      const effectiveOverflowWidth = () => {
        if (!isGroup) return overflow.offsetWidth
        const second = avatars[1]
        // AvatarGroup.js computes the LTR second-avatar offset before its hidden-item
        // fallback: a hidden second avatar has offsetLeft=0. Keep that reservation,
        // which lets the first avatar remain visible in a 56–80px group.
        if (!rtl) return widthToItem(second)
        return widthToItem(second.hidden ? overflow : second)
      }
      let next = avatars.length
      if (avatars.length >= 2) {
        for (let index = 0; index < avatars.length; index++) {
          const avatar = avatars[index]
          avatar.hidden = false
          let totalWidth = widthToItem(avatar) + avatar.offsetWidth
          if (index !== avatars.length - 1 || hasCustomOverflow) totalWidth += effectiveOverflowWidth()
          if (totalWidth > host.offsetWidth) {
            next = index
            break
          }
        }
      }
      // AvatarGroup.js _setHiddenItems updates visibility without moving focus:
      // the browser releases focus when the focused avatar or overflow becomes hidden.
      avatars.forEach((avatar, index) => { avatar.hidden = index >= next })
      overflow.hidden = !hasCustomOverflow && next === avatars.length
      setVisibleCount(next)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    container.querySelectorAll<HTMLElement>(":scope > [data-slot=avatar]").forEach((avatar) => observer.observe(avatar))
    if (overflowRef.current) observer.observe(overflowRef.current)
    return () => observer.disconnect()
  }, [children, firstSize, isGroup, hasCustomOverflow, overflowButton, visibleCount])

  React.useLayoutEffect(() => {
    if (isGroup) return
    containerRef.current?.querySelectorAll<HTMLElement>(":scope > button[hidden]").forEach((button) => { button.tabIndex = -1 })
    const buttons = controls()
    const selected = Math.min(current, Math.max(0, buttons.length - 1))
    buttons.forEach((button, index) => { button.tabIndex = index === selected ? 0 : -1 })
    const wrapper = overflowRef.current
    const overflow = overflowControl()
    if (wrapper && overflow === wrapper) wrapper.setAttribute("role", "button")
    else wrapper?.removeAttribute("role")
    if (overflow) overflow.tabIndex = showOverflow && !overflow.matches(":disabled, [aria-disabled=true]") ? 0 : -1
    if (selected !== current) setCurrent(selected)
  })

  const activate = (targetRef: HTMLElement, overflowButtonClicked: boolean) => {
    onGroupClick?.({ targetRef, overflowButtonClicked })
    if (overflowButtonClicked) onOverflowClick?.(hiddenItems)
  }
  const moveFocus = (event: React.KeyboardEvent) => {
    // ItemNavigation.js _onkeydown uses Keys helpers that ignore all modified navigation keys.
    if (hasAvatarModifier(event)) return
    const buttons = controls()
    const index = buttons.indexOf(event.target as HTMLElement)
    if (index < 0) return
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl"
    const next = {
      ArrowRight: rtl ? index - 1 : index + 1, ArrowDown: index + 1,
      ArrowLeft: rtl ? index + 1 : index - 1, ArrowUp: index - 1,
      Home: 0, End: buttons.length - 1, PageUp: 0, PageDown: buttons.length - 1,
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    buttons[Math.max(0, Math.min(buttons.length - 1, next))]?.focus()
  }
  const label = accessibleName ?? [
    isGroup ? texts?.groupLabel ?? "Conjoined avatars." : texts?.individualLabel ?? "Individual avatars.",
    texts?.displayedHiddenLabel?.(visibleCount, hiddenItems.length) ?? `${visibleCount} displayed, ${hiddenItems.length} hidden.`,
    isGroup ? texts?.showCompleteListLabel ?? "Activate for complete list." : texts?.moveLabel ?? "Press ARROW keys to move.",
  ].join(" ")
  const completeListLabel = texts?.showCompleteListLabel ?? "Activate for complete list."
  const overflowText = texts?.overflowButtonText?.(hiddenItems.length) ?? `+${Math.min(99, hiddenItems.length)}`

  return (
    <div ref={hostRef} data-slot="avatar-group" data-type={type} className={cn("fiori-avatar-group-host", className)} style={style}>
      <div
        ref={containerRef}
        role={isGroup ? "button" : "group"}
        tabIndex={isGroup ? 0 : undefined}
        className="fiori-avatar-group"
        data-size={firstSize}
        aria-label={label}
        onFocus={(event) => {
          onFocus?.(event)
          if (!isGroup) {
            const index = controls().indexOf(event.target as HTMLElement)
            if (index >= 0) setCurrent(index)
          }
        }}
        onClick={(event) => {
          if (!isGroup) return
          onClick?.(event)
          if (!event.defaultPrevented) activate(event.currentTarget, false)
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented) return
          if (!isGroup) return moveFocus(event)
          // AvatarGroup.js _onkeydown uses Keys.isEnter/isSpace: all modifiers are rejected.
          if (hasAvatarModifier(event)) return
          if (event.key === "Enter") event.currentTarget.click()
          if (event.key === " ") event.preventDefault()
        }}
        onKeyUp={(event) => {
          onKeyUp?.(event)
          // AvatarGroup.js _onkeyup uses Keys.isSpace, rejecting Shift/Ctrl/Alt/Meta on release.
          if (isGroup && !event.defaultPrevented && !hasAvatarModifier(event) && event.key === " ") {
            event.preventDefault()
            event.currentTarget.click()
          }
        }}
        {...props}
      >
        {items.map((child, index) => {
          const avatarSize = child.props.size ?? size
          return React.cloneElement(child, {
            key: child.key ?? index,
            size: avatarSize,
            hidden: index >= visibleCount,
            interactive: isGroup ? false : (child.props.interactive ?? true),
            mode: isGroup ? "decorative" : child.props.mode,
            colorScheme: !child.props.colorScheme || child.props.colorScheme === "auto"
              ? `accent${(index % 10) + 1}` as AvatarColorScheme : child.props.colorScheme,
            style: { marginInlineEnd: index === items.length - 1 && !hasCustomOverflow ? undefined : groupOffsets[avatarSize][type], ...child.props.style },
            ...(!isGroup ? {
              tabIndex: -1,
              onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
                child.props.onClick?.(event)
                event.stopPropagation()
                if (!event.defaultPrevented) activate(event.currentTarget, false)
              },
            } : {}),
          })
        })}
        <span
          ref={overflowRef}
          data-avatar-group-overflow=""
          hidden={!showOverflow}
          inert={isGroup || undefined}
          aria-hidden={isGroup || undefined}
          className="fiori-avatar-group__overflow"
          onClick={(event) => {
            if (isGroup) return
            event.stopPropagation()
            if (!event.defaultPrevented) activate(overflowControl() ?? event.currentTarget, true)
          }}
          onKeyDown={(event) => {
            if (isGroup) return
            // Button.js _onkeydown/_onkeyup: Shift or Escape cancels a held Space.
            // Listen to the default and slotted controls' bubbling events so preventDefault
            // cancels their native click too, without changing the shared Button component.
            if (event.key === "Shift" || (!hasAvatarModifier(event) && (event.key === "Escape" || event.key === "Esc"))) {
              overflowCancelAction.current = true
            } else if (!hasAvatarModifier(event) && (event.key === " " || event.key === "Spacebar")) {
              overflowSpacePressed.current = true
            }
            // Non-button custom content gets the same Enter/Space semantics as the default button.
            if (event.target !== event.currentTarget || event.defaultPrevented) return
            if (event.key === "Enter") event.currentTarget.click()
            if (event.key === " ") event.preventDefault()
          }}
          onKeyUp={(event) => {
            if (isGroup) return
            const isSpace = (event.key === " " || event.key === "Spacebar") && !hasAvatarModifier(event)
            const isShiftSpace = (event.key === " " || event.key === "Spacebar") && event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey
            const isCancelKey = event.key === "Shift" || (!hasAvatarModifier(event) && (event.key === "Escape" || event.key === "Esc"))
            if (isSpace || isShiftSpace) {
              // Also reject a shifted release if Shift was pressed before this control gained focus.
              const canceled = overflowCancelAction.current || isShiftSpace
              overflowCancelAction.current = false
              overflowSpacePressed.current = false
              if (canceled) {
                event.preventDefault()
                return
              }
            } else if (isCancelKey && !overflowSpacePressed.current) {
              overflowCancelAction.current = false
            }
            if (event.target === event.currentTarget && !event.defaultPrevented && !event.shiftKey && event.key === " ") event.currentTarget.click()
          }}
          onBlur={() => {
            // Button.js _onfocusout clears cancellation when focus leaves the control.
            overflowSpacePressed.current = false
            overflowCancelAction.current = false
          }}
        >
          {hasCustomOverflow ? overflowButton : (
            // UI5 2.28 AvatarGroupTemplate uses a neutral Button, not the next avatar accent.
            <Button asChild={isGroup} className="fiori-avatar-group__overflow-button" data-size={firstSize} aria-label={isGroup ? undefined : completeListLabel}>
              {/* +N is a decorative count badge, as for Avatar initials. Keep UI5's action label;
                  the group accessible name still announces the full displayed/hidden counts. */}
              {isGroup ? <span><span className="fiori-avatar-group__overflow-text" data-text={overflowText} aria-hidden /></span> : <span className="fiori-avatar-group__overflow-text" data-text={overflowText} aria-hidden />}
            </Button>
          )}
        </span>
      </div>
    </div>
  )
}

export { Avatar, AvatarGroup, type AvatarProps, type AvatarGroupProps, type AvatarGroupClickDetail, type AvatarGroupTexts, type AvatarSize, type AvatarColorScheme }
