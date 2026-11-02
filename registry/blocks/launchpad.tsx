import * as React from "react"

import AppShell from "@/components/blocks/app-shell"
import { SideNavigation, SideNavigationGroup, SideNavigationItem, SideNavigationSubItem } from "@/components/ui/side-navigation"
import { Text } from "@/components/ui/text"
import { Title } from "@/components/ui/title"
import { actionSettings, customer, home, product, salesOrder, sysHelp } from "@/lib/fiori-icons"

// The app-shell block with a real SideNavigation in its slot: the bar's menu button collapses and expands it,
// and the selected item drives the page. Sample pages are inline; replace them with your routes.

const PAGES: Record<string, string> = {
  home: "Home",
  customers: "Customers",
  "customers-active": "Active customers",
  products: "Products",
  orders: "Sales orders",
  settings: "Settings",
}

export default function Launchpad() {
  const [value, setValue] = React.useState("home")
  return (
    <AppShell
      sideNavigation={({ collapsed }) => (
        <div data-slot="launchpad-navigation" className="h-full">
          <SideNavigation
            accessibleName="Main navigation"
            collapsed={collapsed}
            value={value}
            onValueChange={setValue}
            fixedItems={
              <>
                <SideNavigationItem text="Settings" value="settings" icon={actionSettings} />
                <SideNavigationItem text="Help" icon={sysHelp} unselectable />
              </>
            }
          >
            <SideNavigationItem text="Home" value="home" icon={home} />
            <SideNavigationGroup text="Business" defaultExpanded>
              <SideNavigationItem text="Customers" value="customers" icon={customer} defaultExpanded>
                <SideNavigationSubItem text="Active customers" value="customers-active" />
              </SideNavigationItem>
              <SideNavigationItem text="Products" value="products" icon={product} />
              <SideNavigationItem text="Sales orders" value="orders" icon={salesOrder} />
            </SideNavigationGroup>
          </SideNavigation>
        </div>
      )}
    >
      <div className="grid gap-2" data-slot="launchpad-page">
        <Title level="H2" size="H3">{PAGES[value] ?? value}</Title>
        <Text>Content for “{PAGES[value] ?? value}”.</Text>
      </div>
    </AppShell>
  )
}

export { Launchpad }
