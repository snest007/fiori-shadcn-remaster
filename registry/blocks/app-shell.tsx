import * as React from "react"

import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Icon } from "@/components/ui/icon"
import { NotificationList, NotificationListGroupItem, NotificationListItem } from "@/components/ui/notification-list"
import { Popover, PopoverAnchor, PopoverBody, PopoverContent, PopoverHeader, PopoverTitle } from "@/components/ui/popover"
import { ProductSwitch, ProductSwitchItem } from "@/components/ui/product-switch"
import { SearchItem, ShellBarSearch } from "@/components/ui/search"
import { ShellBar, ShellBarBranding, ShellBarItem, type ShellBarClickEvent } from "@/components/ui/shell-bar"
import { Text } from "@/components/ui/text"
import { Title } from "@/components/ui/title"
import { UserMenu, UserMenuItem } from "@/components/ui/user-menu"
import { actionSettings, customer, globe, home, menu2, product, settings, sysHelp, travelExpense } from "@/lib/fiori-icons"

// SAP Fiori launchpad-style shell: a ShellBar wired to the notifications, user menu and product switch popovers, above a
// side navigation slot and the page's content. Sample data is inline; replace it with your own.

const LOGO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="24" viewBox="0 0 48 24"><path d="M0 0h48L24 24H0z" fill="#0070f2"/><path d="M6 6h14v3H9v2h10v7H5v-3h11v-2H6z" fill="#fff"/></svg>`
  )

const PRODUCTS = [
  { icon: home, title: "Home", subtitle: "Launchpad" },
  { icon: customer, title: "Customers", subtitle: "CRM" },
  { icon: product, title: "Products", subtitle: "Catalog" },
  { icon: travelExpense, title: "Travel & Expenses", subtitle: "Concur" },
  { icon: settings, title: "Settings" },
  { icon: sysHelp, title: "Support", subtitle: "Help Portal" },
]

const NOTIFICATIONS = [
  { id: "delayed", group: "Orders", title: "Order #2565 delayed", text: "Shipping was delayed by the carrier.", state: "negative", notes: ["Logistics", "3 Hours"] },
  { id: "shipped", group: "Orders", title: "Order #2566 shipped", text: "The order left the warehouse.", state: "positive", notes: ["Logistics", "1 Day"] },
  { id: "requisition", group: "Approvals", title: "Purchase requisition", text: "Needs your approval.", state: "information", notes: ["Anna Bauer"] },
] as const

type OpenPopup = { name: "notifications" | "profile" | "products"; target: HTMLElement } | null

type AppShellProps = {
  /**
   * The side navigation, shown between the bar and the content (e.g. <SideNavigation collapsed={collapsed} />).
   * With a function, the bar's menu button collapses and expands it; a node is simply shown. Without it, no button.
   */
  sideNavigation?: React.ReactNode | ((state: { collapsed: boolean }) => React.ReactNode)
  /** The page. Defaults to a placeholder. */
  children?: React.ReactNode
}

/** A popover positioned against whichever element the shell bar reports as `targetRef` (the overflow button, once it has moved there). */
function ShellPopover({ target, onClose, title, children, ...props }: Omit<React.ComponentProps<typeof PopoverContent>, "title"> & { target: HTMLElement | null; onClose: () => void; title?: string }) {
  // The target is cleared on close, but it still anchors the closing surface and gets the focus back.
  const last = React.useRef(target)
  if (target) last.current = target
  // Decided as it closes: Radix's close-focus callback can run later, when focus may be in another popup's hands.
  const surface = React.useRef<HTMLDivElement>(null)
  const restoreFocus = React.useRef(false)
  React.useLayoutEffect(() => {
    if (target) return
    const active = document.activeElement
    restoreFocus.current = active === document.body || !!surface.current?.contains(active)
  }, [target])
  return (
    <Popover open={!!target} onOpenChange={(o) => !o && onClose()}>
      <PopoverAnchor virtualRef={last as React.RefObject<HTMLElement>} />
      <PopoverContent
        ref={surface}
        side="bottom"
        align="end"
        hideArrow
        // The button that opened it toggles it on its own click.
        onInteractOutside={(e) => {
          if (last.current?.contains(e.target as Node)) e.preventDefault()
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          if (restoreFocus.current && document.activeElement === document.body) last.current?.focus()
        }}
        {...props}
      >
        {title && (
          <PopoverHeader>
            <PopoverTitle>{title}</PopoverTitle>
          </PopoverHeader>
        )}
        <PopoverBody className="p-0">{children}</PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

export default function AppShell({ sideNavigation, children }: AppShellProps) {
  const [popup, setPopup] = React.useState<OpenPopup>(null)
  const [closed, setClosed] = React.useState<string[]>([])
  const [read, setRead] = React.useState<string[]>([])
  const [collapsed, setCollapsed] = React.useState(false)
  const notifications = NOTIFICATIONS.filter((n) => !closed.includes(n.id))
  const unread = notifications.filter((n) => !read.includes(n.id)).length
  const groups = [...new Set(notifications.map((n) => n.group))]

  const toggle = (name: NonNullable<OpenPopup>["name"]) => (e: ShellBarClickEvent) => {
    setPopup((p) => (p?.name === name ? null : { name, target: e.targetRef }))
  }
  const close = () => setPopup(null)
  const targetOf = (name: NonNullable<OpenPopup>["name"]) => (popup?.name === name ? popup.target : null)

  return (
    <div data-slot="app-shell" className="flex h-dvh flex-col bg-(--sapBackgroundColor) font-(family-name:--sapFontFamily) text-(--sapTextColor)">
      <ShellBar
        className="shrink-0"
        startButton={
          typeof sideNavigation === "function" ? (
            <Button variant="transparent" size="icon" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} aria-expanded={!collapsed} onClick={() => setCollapsed((c) => !c)}>
              <Icon icon={menu2} />
            </Button>
          ) : undefined
        }
        branding={<ShellBarBranding href="#" logo={<img src={LOGO} alt="" />}>Corporate Portal</ShellBarBranding>}
        search={
          <ShellBarSearch placeholder="Search">
            <SearchItem text="Sales orders" />
            <SearchItem text="Sales analytics" description="Report" />
            <SearchItem text="Suppliers" />
          </ShellBarSearch>
        }
        showNotifications
        notificationsCount={unread ? String(unread) : undefined}
        onNotificationsClick={toggle("notifications")}
        profile={<Avatar initials="JD" />}
        onProfileClick={toggle("profile")}
        showProductSwitch
        onProductSwitchClick={toggle("products")}
        accessibilityAttributes={{
          notifications: { hasPopup: "dialog", expanded: popup?.name === "notifications" },
          profile: { hasPopup: "menu", expanded: popup?.name === "profile" },
          product: { hasPopup: "dialog", expanded: popup?.name === "products" },
        }}
      >
        <ShellBarItem key="help" icon={sysHelp} text="Help" />
      </ShellBar>

      <ShellPopover target={targetOf("notifications")} onClose={close} title="Notifications" aria-label="Notifications" className="w-[30rem] max-w-[calc(100vw-20px)]">
        <NotificationList
          noDataText="You do not have any notifications."
          onItemClick={(id) => setRead((r) => [...r, id])}
          onItemClose={(id) => setClosed((c) => [...c, id])}
        >
          {groups.map((g) => (
            <NotificationListGroupItem key={g} value={g} titleText={g}>
              {notifications
                .filter((n) => n.group === g)
                .map((n) => (
                  <NotificationListItem key={n.id} value={n.id} titleText={n.title} state={n.state} read={read.includes(n.id)} showClose footnotes={[...n.notes]}>
                    {n.text}
                  </NotificationListItem>
                ))}
            </NotificationListGroupItem>
          ))}
        </NotificationList>
      </ShellPopover>

      <ShellPopover target={targetOf("products")} onClose={close} aria-label="Products" className="max-w-[calc(100vw-20px)]">
        <ProductSwitch>
          {PRODUCTS.map((p) => (
            <ProductSwitchItem key={p.title} icon={p.icon} titleText={p.title} subtitleText={p.subtitle} onClick={close} />
          ))}
        </ProductSwitch>
      </ShellPopover>

      <UserMenu
        open={popup?.name === "profile"}
        onOpenChange={(o) => !o && close()}
        opener={targetOf("profile")}
        account={{ titleText: "John Doe", subtitleText: "john.doe@example.com", avatarInitials: "JD" }}
        showManageAccount
      >
        <UserMenuItem value="settings" icon={actionSettings}>Settings</UserMenuItem>
        <UserMenuItem value="language" icon={globe} additionalText="English">Language</UserMenuItem>
        <UserMenuItem value="help" icon={sysHelp}>Help</UserMenuItem>
      </UserMenu>

      <div className="flex min-h-0 flex-1">
        {typeof sideNavigation === "function" ? sideNavigation({ collapsed }) : sideNavigation}
        <main data-sap-ui-fastnavgroup="true" className="min-w-0 flex-1 overflow-auto p-8">
          {children ?? (
            <Card className="max-w-3xl">
              <div className="grid gap-2 p-4">
                <Title level="H3">Welcome to the launchpad</Title>
                <Text>Your page goes here. Pass it as children, and your side navigation as the sideNavigation prop.</Text>
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}

export { AppShell, type AppShellProps }
