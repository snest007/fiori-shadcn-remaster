import * as React from "react"
import { log, personPlaceholder, userSettings, type FioriIconData } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Avatar, type AvatarColorScheme } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"

// UI5 2.28 UserMenuTemplate.js renders internal Bar and List fastNavigation groups.

// Mirrors ui5-user-menu (Horizon): a popover opened against the shell bar's profile button, with the account
// header, a menu and a Sign Out footer. Keyboard (as UI5): opening focuses the first item, ↑/↓/Home/End move
// (no wrap), hovering an item focuses it, Enter/Space activate and close, Tab cycles inside, Escape closes and
// returns to the opener. When the title scrolls out of view it moves into the header bar.
// Not ported: other accounts panel, submenus (showSelection), avatar edit badge, phone full-screen dialog.

type UserMenuAccount = {
  titleText?: string
  subtitleText?: string
  description?: string
  additionalInfo?: string
  avatarSrc?: string
  avatarInitials?: string
  avatarColorScheme?: AvatarColorScheme
}

type UserMenuTexts = {
  /** Popover name prefix, followed by the account title (default "User menu for"). */
  accessibleName: string
  /** Hidden heading (default "User Menu"). */
  heading: string
  /** Name of the header bar (default "Current user information"). */
  currentInformation: string
  /** Name of the menu (default "Actions"). */
  actions: string
  manageAccount: string
  signOut: string
}

const defaultTexts: UserMenuTexts = {
  accessibleName: "User menu for",
  heading: "User Menu",
  currentInformation: "Current user information",
  actions: "Actions",
  manageAccount: "Manage Account",
  signOut: "Sign Out",
}

const MenuContext = React.createContext<{ activate: (value: string | undefined, onSelect?: (e: { preventDefault: () => void }) => void) => void } | null>(null)

type UserMenuProps = Omit<React.ComponentProps<typeof PopoverContent>, "title"> & {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** The element it opens against: ShellBar's onProfileClick `targetRef`. */
  opener?: HTMLElement | null
  account: UserMenuAccount
  showManageAccount?: boolean
  /** Makes the avatar a button (onAvatarClick). */
  avatarInteractive?: boolean
  onAvatarClick?: () => void
  onManageAccountClick?: () => void
  /** preventDefault keeps the menu open. */
  onSignOutClick?: (e: { preventDefault: () => void }) => void
  /** An item with a `value` was activated; preventDefault keeps the menu open. */
  onItemClick?: (value: string, e: { preventDefault: () => void }) => void
  /** Shown below the account texts (UI5 `infoArea`). */
  infoArea?: React.ReactNode
  /** Replaces the Sign Out footer; pass null for no footer. */
  footer?: React.ReactNode
  texts?: Partial<UserMenuTexts>
}

function UserMenu({
  open,
  onOpenChange,
  opener,
  account,
  showManageAccount,
  avatarInteractive,
  onAvatarClick,
  onManageAccountClick,
  onSignOutClick,
  onItemClick,
  infoArea,
  footer,
  texts: textsProp,
  className,
  children,
  side = "bottom",
  align = "end",
  onOpenAutoFocus,
  onCloseAutoFocus,
  onInteractOutside,
  onKeyDown,
  ...props
}: UserMenuProps) {
  const texts = { ...defaultTexts, ...textsProp }
  const listRef = React.useRef<HTMLUListElement>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const titleRef = React.useRef<HTMLDivElement>(null)
  const surfaceRef = React.useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = React.useState(false)
  const [titleInHeader, setTitleInHeader] = React.useState(false)
  const [current, setCurrent] = React.useState(0)
  // Callers may clear `opener` as they close the menu; it still anchors the closing surface and gets the focus back.
  const lastOpener = React.useRef(opener)
  if (opener) lastOpener.current = opener
  const anchor = lastOpener as React.RefObject<HTMLElement>
  // Decided as it closes, while the surface is still mounted: Radix's close-focus callback can run much later, when
  // focus may legitimately have gone elsewhere (another popup opened from the bar, and even closed again).
  const restoreFocus = React.useRef(false)
  React.useLayoutEffect(() => {
    if (open) return
    const active = document.activeElement
    restoreFocus.current = active === document.body || !!surfaceRef.current?.contains(active)
  }, [open])
  const close = () => onOpenChange?.(false)

  const items = () => [...(listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]

  // The title moving into the header once less than 15% of it is visible.
  React.useEffect(() => {
    const title = titleRef.current
    const root = scrollRef.current
    if (!open || !title || !root) return
    const io = new IntersectionObserver(([e]) => setTitleInHeader(!e.isIntersecting), { root, threshold: [0.15] })
    io.observe(title)
    return () => io.disconnect()
  }, [open])
  React.useEffect(() => {
    if (open) return
    setScrolled(false)
    setTitleInHeader(false)
    setCurrent(0)
  }, [open])

  const menu = React.useMemo(
    () => ({
      activate: (value: string | undefined, onSelect?: (e: { preventDefault: () => void }) => void) => {
        let prevented = false
        const e = { preventDefault: () => (prevented = true) }
        onSelect?.(e)
        if (value !== undefined) onItemClick?.(value, e)
        if (!prevented) onOpenChange?.(false)
      },
    }),
    [onItemClick, onOpenChange]
  )

  const hasItems = React.Children.toArray(children).length > 0
  const defaultFooter = footer === undefined
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor virtualRef={anchor} />
      <PopoverContent
        ref={surfaceRef}
        data-slot="user-menu"
        side={side}
        align={align}
        tabIndex={-1}
        aria-label={`${texts.accessibleName} ${account.titleText ?? ""}`.trim()}
        className={cn("fiori-user-menu", className)}
        onOpenAutoFocus={(e) => {
          onOpenAutoFocus?.(e)
          if (e.defaultPrevented) return
          const first = items()[0]
          if (first) {
            e.preventDefault()
            first.focus()
          }
        }}
        onCloseAutoFocus={(e) => {
          onCloseAutoFocus?.(e)
          if (e.defaultPrevented) return
          e.preventDefault()
          // Not when the user has moved on, e.g. by clicking another button of the shell bar.
          if (restoreFocus.current && document.activeElement === document.body) lastOpener.current?.focus()
        }}
        onInteractOutside={(e) => {
          onInteractOutside?.(e)
          // The opener toggles on its own click.
          if (lastOpener.current?.contains(e.target as Node)) e.preventDefault()
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e)
          if (e.defaultPrevented || e.key !== "Tab") return
          // Focus stays inside, as in UI5's popups.
          const stops = [...e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, select, textarea, [tabindex="0"]')].filter((el) => el.offsetParent !== null)
          const first = stops[0]
          const last = stops.at(-1)
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last?.focus()
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first?.focus()
          }
        }}
        {...props}
      >
        <h1 className="sr-only">{texts.heading}</h1>
        <div role="group" aria-label={texts.currentInformation} className="fiori-user-menu__bar" data-sap-ui-fastnavgroup="true" data-scrolled={scrolled || titleInHeader ? "" : undefined}>
          {titleInHeader && <div className="fiori-user-menu__bar-title">{account.titleText}</div>}
        </div>
        <div ref={scrollRef} className="fiori-user-menu__content" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}>
          <div className="fiori-user-menu__account">
            <span className="fiori-user-menu__avatar-wrap">
              <Avatar
                size="L"
                src={account.avatarSrc}
                initials={account.avatarInitials}
                colorScheme={account.avatarColorScheme}
                fallbackIcon={personPlaceholder}
                interactive={avatarInteractive}
                accessibleName={account.titleText}
                onClick={avatarInteractive ? onAvatarClick : undefined}
                className="fiori-user-menu__avatar"
              />
            </span>
            {account.titleText && (
              <div ref={titleRef} role="heading" aria-level={2} className="fiori-user-menu__title">
                {account.titleText}
              </div>
            )}
            {account.subtitleText && <span className="fiori-user-menu__subtitle">{account.subtitleText}</span>}
            {account.description && <span className="fiori-user-menu__text">{account.description}</span>}
            {account.additionalInfo && <span className="fiori-user-menu__text fiori-user-menu__additional">{account.additionalInfo}</span>}
            {infoArea && <div className="fiori-user-menu__info">{infoArea}</div>}
            {showManageAccount && (
              <Button className="fiori-user-menu__manage" onClick={onManageAccountClick}>
                <Icon icon={userSettings} />
                {texts.manageAccount}
              </Button>
            )}
          </div>
          {hasItems && (
            <MenuContext.Provider value={menu}>
              <ul
                ref={listRef}
                role="menu"
                aria-label={texts.actions}
                className="fiori-user-menu__list" data-sap-ui-fastnavgroup="true"
                onFocus={(e) => {
                  const i = items().indexOf(e.target as HTMLElement)
                  if (i !== -1) setCurrent(i)
                }}
                onKeyDown={(e) => {
                  const list = items()
                  const i = list.indexOf(e.target as HTMLElement)
                  if (i === -1) return
                  let to: number
                  if (e.key === "ArrowDown") to = Math.min(i + 1, list.length - 1)
                  else if (e.key === "ArrowUp") to = Math.max(i - 1, 0)
                  else if (e.key === "Home") to = 0
                  else if (e.key === "End") to = list.length - 1
                  else return
                  e.preventDefault()
                  list[to].focus()
                }}
              >
                <RovingIndex.Provider value={current}>
                  {React.Children.toArray(children).map((child, i) => (
                    <ItemIndex.Provider key={React.isValidElement(child) ? (child.key ?? i) : i} value={i}>
                      {child}
                    </ItemIndex.Provider>
                  ))}
                </RovingIndex.Provider>
              </ul>
            </MenuContext.Provider>
          )}
        </div>
        {defaultFooter ? (
          <div className="fiori-popup__footer fiori-user-menu__footer">
            <Button
              variant="transparent"
              className="fiori-user-menu__sign-out"
              onClick={() => {
                let prevented = false
                onSignOutClick?.({ preventDefault: () => (prevented = true) })
                if (!prevented) close()
              }}
            >
              <Icon icon={log} />
              {texts.signOut}
            </Button>
          </div>
        ) : (
          footer && <div className="fiori-popup__footer fiori-user-menu__footer">{footer}</div>
        )}
      </PopoverContent>
    </Popover>
  )
}

const RovingIndex = React.createContext(0)
const ItemIndex = React.createContext(0)

type UserMenuItemProps = Omit<React.ComponentProps<"li">, "value" | "onSelect"> & {
  /** Reported by UserMenu's onItemClick. */
  value?: string
  icon?: FioriIconData
  /** Secondary text at the end of the item. */
  additionalText?: React.ReactNode
  disabled?: boolean
  /** preventDefault keeps the menu open. */
  onSelect?: (e: { preventDefault: () => void }) => void
}

/** ui5-user-menu-item */
function UserMenuItem({ value, icon, additionalText, disabled, onSelect, className, children, onClick, onKeyDown, onKeyUp, onMouseEnter, ...props }: UserMenuItemProps) {
  const ctx = React.useContext(MenuContext)
  const current = React.useContext(RovingIndex)
  const index = React.useContext(ItemIndex)
  const activate = () => {
    if (!disabled) ctx?.activate(value, onSelect)
  }
  return (
    <li
      data-slot="user-menu-item"
      role="menuitem"
      tabIndex={current === index ? 0 : -1}
      aria-disabled={disabled || undefined}
      data-disabled={disabled ? "" : undefined}
      className={cn("fiori-list-item fiori-menu-item fiori-user-menu-item", className)}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) activate()
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented) return
        if (e.key === " ") e.preventDefault()
        if (e.key === "Enter") {
          e.preventDefault()
          activate()
        }
      }}
      onKeyUp={(e) => {
        onKeyUp?.(e)
        if (!e.defaultPrevented && e.key === " ") activate()
      }}
      onMouseEnter={(e) => {
        onMouseEnter?.(e)
        e.currentTarget.focus()
      }}
      {...props}
    >
      <div className="fiori-menu-item__content">
        {icon && <Icon icon={icon} className="fiori-menu-item__icon size-(--fiori-list-item-icon-size)" />}
        <div className="fiori-menu-item__text">{children}</div>
        {additionalText != null && <span className="fiori-menu-item__additional-text">{additionalText}</span>}
      </div>
    </li>
  )
}

export { UserMenu, UserMenuItem, type UserMenuAccount, type UserMenuItemProps, type UserMenuProps, type UserMenuTexts }
