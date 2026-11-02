import type * as React from "react"

import { SideNavigation, SideNavigationGroup, SideNavigationItem, SideNavigationSubItem } from "@/components/ui/side-navigation"
import * as icons from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

// Data-driven so side-navigation.ui5.ts renders the same navigation.
export type IconName = "home" | "group" | "calendar" | "history" | "chainLink" | "customer" | "product" | "actionSettings" | "sysHelp" | "building"
export type SubSpec = { text: string; value?: string; icon?: IconName; disabled?: boolean; unselectable?: boolean }
export type ItemSpec = SubSpec & { expanded?: boolean; href?: string; target?: string; design?: "action"; items?: SubSpec[] }
export type GroupSpec = { group: string; expanded?: boolean; disabled?: boolean; items: ItemSpec[] }
export type Entry = ItemSpec | GroupSpec
export type Props = { entries: Entry[]; fixed?: Entry[]; collapsed?: boolean; selected?: string; height?: string }

export const SN_HEIGHT = "28rem"
export const ICON_IDS: Record<IconName, string> = {
  home: "home",
  group: "group",
  calendar: "calendar",
  history: "history",
  chainLink: "chain-link",
  customer: "customer",
  product: "product",
  actionSettings: "action-settings",
  sysHelp: "sys-help",
  building: "building",
}
const iconData = (n?: IconName) => (n ? (icons as unknown as Record<string, icons.FioriIconData>)[n] : undefined)

export const isGroup = (e: Entry): e is GroupSpec => "group" in e

const main: Entry[] = [
  { text: "Home", value: "home", icon: "home" },
  {
    group: "Group 1",
    expanded: true,
    items: [
      {
        text: "People",
        value: "people",
        icon: "group",
        expanded: true,
        items: [
          { text: "From My Team", value: "team" },
          { text: "From Other Teams", value: "other" },
        ],
      },
      { text: "Locations", value: "locations", icon: "building", disabled: true },
      { text: "Events", value: "events", icon: "calendar", items: [{ text: "Local", value: "local" }, { text: "Others", value: "others" }] },
    ],
  },
  { group: "Group 2", items: [{ text: "History", value: "history", icon: "history" }] },
  { text: "External", value: "external", icon: "chainLink", href: "#external", target: "_blank" },
]
const fixed: Entry[] = [
  { text: "Legal", value: "legal", icon: "sysHelp", unselectable: true, items: [{ text: "Terms", value: "terms" }, { text: "Privacy", value: "privacy" }] },
  { text: "Settings", value: "settings", icon: "actionSettings" },
]
const flat: Entry[] = [
  { text: "Home", value: "home", icon: "home" },
  { text: "Customers", value: "customers", icon: "customer", items: [{ text: "Active", value: "active" }, { text: "Archived", value: "archived" }] },
  { text: "Products", value: "products", icon: "product" },
  { text: "Unselectable parent", value: "parent", icon: "calendar", unselectable: true, expanded: true, items: [{ text: "Child A", value: "a" }, { text: "Child B", value: "b" }] },
]

export default defineFixtures<Props>({
  name: "side-navigation",
  cases: [
    { id: "side-navigation-expanded", props: { entries: main, fixed, selected: "team" } },
    { id: "side-navigation-collapsed", props: { entries: main, fixed, collapsed: true, selected: "team" } },
    { id: "side-navigation-flat", props: { entries: flat, selected: "products", height: "22rem" } },
    { id: "side-navigation-parent-selected", props: { entries: flat, selected: "archived", height: "22rem" } },
    { id: "side-navigation-collapsed-flat", props: { entries: flat, collapsed: true, selected: "archived", height: "22rem" } },
  ],
  react: ({ entries, fixed, collapsed, selected, height = SN_HEIGHT }) => {
    const sub = (s: SubSpec) => (
      <SideNavigationSubItem key={s.text} text={s.text} value={s.value} icon={iconData(s.icon)} disabled={s.disabled} unselectable={s.unselectable} />
    )
    const item = (it: ItemSpec) => (
      <SideNavigationItem
        key={it.text}
        text={it.text}
        value={it.value}
        icon={iconData(it.icon)}
        disabled={it.disabled}
        unselectable={it.unselectable}
        href={it.href}
        target={it.target}
        design={it.design}
        defaultExpanded={it.expanded}
      >
        {it.items?.map(sub)}
      </SideNavigationItem>
    )
    const entry = (e: Entry): React.ReactNode =>
      isGroup(e) ? (
        <SideNavigationGroup key={e.group} text={e.group} defaultExpanded={e.expanded} disabled={e.disabled}>
          {e.items.map(item)}
        </SideNavigationGroup>
      ) : (
        item(e)
      )
    return (
      <div style={{ height }}>
        <SideNavigation
          accessibleName={`Side navigation fixture ${collapsed ? "collapsed" : "expanded"} ${entries.length}`}
          collapsed={collapsed}
          defaultValue={selected}
          fixedItems={fixed?.map(entry)}
        >
          {entries.map(entry)}
        </SideNavigation>
      </div>
    )
  },
})
