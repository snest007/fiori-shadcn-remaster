import * as React from "react"

import { Bar } from "@/components/ui/bar"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Label } from "@/components/ui/label"
import { NavigationLayout, type NavigationLayoutMode } from "@/components/ui/navigation-layout"
import { SideNavigation, SideNavigationItem, SideNavigationSubItem } from "@/components/ui/side-navigation"
import { Text } from "@/components/ui/text"
import { actionSettings, group, home, menu2, product } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

function NavigationLayoutDemo() {
  const [mode, setMode] = React.useState<NavigationLayoutMode>("auto")
  const [page, setPage] = React.useState("home")
  const small = () => window.matchMedia("(max-width: 599.98px)").matches
  const toggle = () =>
    setMode((m) => {
      const collapsed = m === "auto" ? small() : m === "collapsed"
      return collapsed ? "expanded" : "collapsed"
    })
  return (
    <div id="navigation-layout-demo" className="relative h-[24rem] overflow-hidden rounded-(--sapElement_BorderCornerRadius)">
      <NavigationLayout
        mode={mode}
        onModeChange={setMode}
        header={
          <Bar
            design="header"
            startContent={
              <Button variant="transparent" size="icon" aria-label="Toggle navigation" onClick={toggle}>
                <Icon icon={menu2} />
              </Button>
            }
          >
            <Label>My Application</Label>
          </Bar>
        }
        sideContent={
          <SideNavigation
            accessibleName="Application navigation"
            value={page}
            onValueChange={setPage}
            fixedItems={<SideNavigationItem text="Settings" value="settings" icon={actionSettings} />}
          >
            <SideNavigationItem text="Home" value="home" icon={home} />
            <SideNavigationItem text="People" value="people" icon={group}>
              <SideNavigationSubItem text="From My Team" value="team" />
              <SideNavigationSubItem text="From Other Teams" value="other" />
            </SideNavigationItem>
            <SideNavigationItem text="Products" value="products" icon={product} />
          </SideNavigation>
        }
      >
        <div className="p-4">
          <Text>
            Current page: <span data-testid="navigation-layout-demo-page">{page}</span>
          </Text>
        </div>
      </NavigationLayout>
    </div>
  )
}

export default defineDemo({ title: "NavigationLayout", order: 71, Demo: NavigationLayoutDemo })
