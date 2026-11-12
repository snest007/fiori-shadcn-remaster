import * as React from "react"

import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { MenuItem } from "@/components/ui/menu"
import { SearchItem, ShellBarSearch } from "@/components/ui/search"
import { ShellBar, ShellBarBranding, ShellBarItem, ShellBarMenuButton, ShellBarSpacer } from "@/components/ui/shell-bar"
import { Tag } from "@/components/ui/tag"
import { Text } from "@/components/ui/text"
import { ToggleButton } from "@/components/ui/toggle-button"
import { da, menu2, sysHelp, travelExpense } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

const LOGO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="24" viewBox="0 0 48 24"><path d="M0 0h48L24 24H0z" fill="#0070f2"/><path d="M6 6h14v3H9v2h10v7H5v-3h11v-2H6z" fill="#fff"/></svg>`
  )

function ShellBarDemo() {
  const [last, setLast] = React.useState("none")
  const [hidden, setHidden] = React.useState<string[]>([])
  return (
    <div className="grid gap-4">
      <ShellBar
        id="shell-bar-demo"
        aria-label="Application header"
        onContentItemVisibilityChange={setHidden}
        startButton={
          <Button id="shell-bar-demo-start" variant="transparent" size="icon" aria-label="Menu" onClick={() => setLast("start")}>
            <Icon icon={menu2} />
          </Button>
        }
        branding={
          <ShellBarBranding id="shell-bar-demo-branding" logo={<img src={LOGO} alt="" />} onClick={() => setLast("branding")}>
            Corporate Portal
          </ShellBarBranding>
        }
        content={
          <>
            <Text key="app">Sales Orders</Text>
            <ShellBarSpacer key="spacer" />
            <Tag key="trial">Trial</Tag>
          </>
        }
        search={
          <ShellBarSearch accessibleName="Portal search" placeholder="Search" onSearch={({ value }) => setLast(`search:${value}`)}>
            <SearchItem text="Laptop" />
            <SearchItem text="Lap desk" description="Office supplies" />
            <SearchItem text="Monitor" />
          </ShellBarSearch>
        }
        assistant={
          <ToggleButton variant="transparent" size="icon" aria-label="Joule" onPressedChange={(p) => setLast(p ? "assistant:on" : "assistant:off")}>
            <Icon icon={da} />
          </ToggleButton>
        }
        showNotifications
        notificationsCount="12"
        onNotificationsClick={() => setLast("notifications")}
        profile={<Avatar initials="JD" />}
        onProfileClick={() => setLast("profile")}
        showProductSwitch
        onProductSwitchClick={() => setLast("products")}
      >
        <ShellBarItem key="help" icon={sysHelp} text="Help" onClick={() => setLast("help")} />
        <ShellBarItem key="expenses" icon={travelExpense} text="Expenses" count="3" onClick={() => setLast("expenses")} />
      </ShellBar>
      <span id="shell-bar-demo-last" className="text-(--sapContent_LabelColor)">{`Last action: ${last}`}</span>
      <span id="shell-bar-demo-hidden" className="text-(--sapContent_LabelColor)">{`Hidden content: ${hidden.join(", ") || "none"}`}</span>
      <ShellBar
        id="shell-bar-demo-menu"
        branding={
          <ShellBarMenuButton logo={<img src={LOGO} alt="" />} secondaryTitle="Secondary title" menu={<><MenuItem>Application 1</MenuItem><MenuItem>Application 2</MenuItem></>}>
            Corporate Portal
          </ShellBarMenuButton>
        }
        profile={<Avatar initials="JD" />}
      />
    </div>
  )
}

export default defineDemo({
  category: "Navigation",
  docs: [
    {
      name: "shell-bar",
      description: "Responsive application headers with branding, search, notifications and profile actions.",
      props: [
        { name: "ShellBar.branding", type: "ReactNode", description: "Branding or application-menu content." },
        { name: "ShellBar.startButton", type: "ReactNode", description: "Button before branding, such as the navigation toggle." },
        { name: "ShellBar.search", type: "ReactNode", description: "ShellBarSearch content." },
        { name: "ShellBar.searchExpanded", type: "boolean", description: "Controlled search-field expansion." },
        { name: "ShellBar.onSearchExpandedChange", type: "(expanded: boolean) => void", description: "Receive search expansion changes." },
        { name: "ShellBar.onProfileClick", type: "(event: ShellBarClickEvent) => void", description: "Receive profile activation with its popup target." },
        { name: "ShellBar.onNotificationsClick", type: "(event: ShellBarClickEvent) => void", description: "Receive notifications activation with its popup target." },
        { name: "ShellBar.onProductSwitchClick", type: "(event: ShellBarClickEvent) => void", description: "Receive product-switch activation with its popup target." },
        { name: "ShellBar.onContentItemVisibilityChange", type: "(hiddenKeys: string[]) => void", description: "Receive the keys of hidden content items." },
      ],
    },
  ], title: "Shell Bar", order: 60, Demo: ShellBarDemo })
