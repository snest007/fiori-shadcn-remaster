import * as React from "react"
import { DropdownMenu as MenuPrimitive } from "radix-ui"

import type { FioriIconData } from "@/lib/fiori-icons"
import { slimArrowRight } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"

// Mirrors ui5-menu / ui5-menu-item / ui5-menu-separator (Horizon).
// Keyboard (as UI5): the first item is focused on open; ↑/↓ move, Enter/Space activate, → opens a
// submenu, ← (or Escape) closes it and returns to its item, Escape closes the menu, Tab closes it.

const MenuOpenContext = React.createContext<((open: boolean) => void) | null>(null)

function Menu({ open: openProp, defaultOpen, onOpenChange, ...props }: React.ComponentProps<typeof MenuPrimitive.Root>) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen ?? false)
  const open = openProp ?? uncontrolled
  const setOpen = React.useCallback(
    (o: boolean) => {
      if (openProp === undefined) setUncontrolled(o)
      onOpenChange?.(o)
    },
    [openProp, onOpenChange]
  )
  return (
    <MenuOpenContext.Provider value={setOpen}>
      <MenuPrimitive.Root data-slot="menu" open={open} onOpenChange={setOpen} {...props} />
    </MenuOpenContext.Provider>
  )
}

function MenuTrigger(props: React.ComponentProps<typeof MenuPrimitive.Trigger>) {
  return <MenuPrimitive.Trigger data-slot="menu-trigger" {...props} />
}

function MenuGroup(props: React.ComponentProps<typeof MenuPrimitive.Group>) {
  return <MenuPrimitive.Group data-slot="menu-group" {...props} />
}

type MenuContentProps = React.ComponentProps<typeof MenuPrimitive.Content> & {
  /** Render in place instead of in a portal on document.body. */
  portal?: boolean
  /** Don't move focus into the menu on open (UI5 focuses the first item, however the menu was opened). */
  preventInitialFocus?: boolean
}

function MenuContent({
  className,
  side = "bottom",
  align = "start",
  sideOffset = 0,
  collisionPadding = 10,
  portal = true,
  preventInitialFocus = false,
  onKeyDown,
  ...props
}: MenuContentProps) {
  const setOpen = React.useContext(MenuOpenContext)
  const ref = React.useRef<HTMLDivElement>(null)
  // Radix focuses the first item only when opened with the keyboard; UI5 does it for mouse too.
  // (onOpenAutoFocus is supported by Radix's menu content but missing from DropdownMenu's types.)
  const autoFocus = {
    onOpenAutoFocus: (e: Event) => {
      e.preventDefault()
      if (!preventInitialFocus)
        ref.current?.querySelector<HTMLElement>('[role^="menuitem"]:not([data-disabled])')?.focus({ preventScroll: true })
    },
  } as object
  const content = (
    <MenuPrimitive.Content
      ref={ref}
      data-slot="menu-content"
      side={side}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      className={cn("fiori-menu z-50 max-h-(--radix-dropdown-menu-content-available-height)", className)}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (!e.defaultPrevented && e.key === "Tab") setOpen?.(false)
      }}
      {...autoFocus}
      {...props}
    />
  )
  return portal ? <MenuPrimitive.Portal>{content}</MenuPrimitive.Portal> : content
}

type ItemExtras = {
  /** Leading icon. When any item in a menu has one, the others keep its space so texts align. */
  icon?: FioriIconData
  /** Secondary text at the end of the item, e.g. a keyboard shortcut (ui5-menu-item `additional-text`). */
  additionalText?: React.ReactNode
}

function ItemContent({ icon, children, end }: { icon?: FioriIconData; children: React.ReactNode; end?: React.ReactNode }) {
  return (
    <div className="fiori-menu-item__content">
      {icon && <Icon icon={icon} className="fiori-menu-item__icon size-(--fiori-list-item-icon-size)" />}
      <div className="fiori-menu-item__text">{children}</div>
      {end}
    </div>
  )
}

type MenuItemProps = React.ComponentProps<typeof MenuPrimitive.Item> & ItemExtras

function MenuItem({ className, icon, additionalText, children, ...props }: MenuItemProps) {
  return (
    <MenuPrimitive.Item data-slot="menu-item" className={cn("fiori-list-item fiori-menu-item", className)} {...props}>
      <ItemContent icon={icon} end={additionalText != null && <span className="fiori-menu-item__additional-text">{additionalText}</span>}>
        {children}
      </ItemContent>
    </MenuPrimitive.Item>
  )
}

function MenuSeparator({ className, ...props }: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return <MenuPrimitive.Separator data-slot="menu-separator" className={cn("fiori-menu-separator", className)} {...props} />
}

// UI5 closes only the submenu on Escape (Radix would close the whole menu), so submenus track their own state.
const MenuSubContext = React.createContext<{ close: () => void; trigger: React.RefObject<HTMLDivElement | null> } | null>(null)

function MenuSub({ open: openProp, defaultOpen, onOpenChange, ...props }: React.ComponentProps<typeof MenuPrimitive.Sub>) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen ?? false)
  const open = openProp ?? uncontrolled
  const setOpen = React.useCallback(
    (o: boolean) => {
      if (openProp === undefined) setUncontrolled(o)
      onOpenChange?.(o)
    },
    [openProp, onOpenChange]
  )
  const trigger = React.useRef<HTMLDivElement>(null)
  const ctx = React.useMemo(() => ({ close: () => setOpen(false), trigger }), [setOpen])
  return (
    <MenuSubContext.Provider value={ctx}>
      <MenuPrimitive.Sub data-slot="menu-sub" open={open} onOpenChange={setOpen} {...props} />
    </MenuSubContext.Provider>
  )
}

type MenuSubTriggerProps = React.ComponentProps<typeof MenuPrimitive.SubTrigger> & Omit<ItemExtras, "additionalText">

/** An item that opens a submenu (→ or hover). Its text is the children. */
function MenuSubTrigger({ className, icon, children, ...props }: MenuSubTriggerProps) {
  const sub = React.useContext(MenuSubContext)
  return (
    <MenuPrimitive.SubTrigger ref={sub?.trigger} data-slot="menu-sub-trigger" className={cn("fiori-list-item fiori-menu-item", className)} {...props}>
      <ItemContent
        icon={icon}
        end={
          <div className="fiori-menu-item__submenu">
            <Icon icon={slimArrowRight} />
          </div>
        }
      >
        {children}
      </ItemContent>
    </MenuPrimitive.SubTrigger>
  )
}

function MenuSubContent({
  className,
  sideOffset = 0,
  alignOffset = 4,
  collisionPadding = 10,
  onEscapeKeyDown,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.SubContent>) {
  const sub = React.useContext(MenuSubContext)
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.SubContent
        data-slot="menu-sub-content"
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        className={cn("fiori-menu z-50 max-h-(--radix-dropdown-menu-content-available-height)", className)}
        onEscapeKeyDown={(e) => {
          onEscapeKeyDown?.(e)
          if (e.defaultPrevented || !sub) return
          e.preventDefault()
          sub.close()
          sub.trigger.current?.focus()
        }}
        {...props}
      />
    </MenuPrimitive.Portal>
  )
}

export {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  type MenuContentProps,
  type MenuItemProps,
  type MenuSubTriggerProps,
}
