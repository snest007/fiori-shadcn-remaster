import type * as React from "react"

import { SideNavigation, SideNavigationGroup, SideNavigationItem, SideNavigationSubItem } from "@/components/ui/side-navigation"
import { Menu, MenuContent, MenuGroup, MenuItem, MenuSub, MenuSubContent, MenuSubTrigger } from "@/components/ui/menu"
import { Icon } from "@/components/ui/icon"
import * as icons from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"
import { inPlace } from "./popover"

// Data-driven so side-navigation.ui5.ts renders the same navigation.
export type IconName = "home" | "group" | "calendar" | "history" | "chainLink" | "customer" | "product" | "actionSettings" | "sysHelp" | "building"
export type SubSpec = { text: string; value?: string; icon?: IconName; disabled?: boolean; unselectable?: boolean }
export type ItemSpec = SubSpec & { expanded?: boolean; href?: string; target?: string; design?: "action"; items?: SubSpec[] }
export type GroupSpec = { group: string; expanded?: boolean; disabled?: boolean; items: ItemSpec[] }
export type Entry = ItemSpec | GroupSpec
export type Props = { entries: Entry[]; fixed?: Entry[]; collapsed?: boolean; selected?: string; height?: string; overflowMenu?: boolean; overflowAnchorFocus?: boolean }

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

const overflowEntries: Entry[] = Array.from({ length: 10 }, (_, i) => ({
  text: `Page ${i + 1}`,
  value: `page-${i + 1}`,
  icon: i === 0 ? "home" : "product",
  ...(i === 8 ? { items: [{ text: "Page 9 detail", value: "page-9-detail" }] } : {}),
}))

const overflowMenuItemClass = "fiori-sn-menu-item [&>div>svg]:size-4 [&>div>div>svg]:size-3"
const fixtureLink = (it: ItemSpec, row: React.ReactElement) => it.href && !it.disabled
  ? <a key={it.text} role="menuitem" data-sn-fixture-link="" href={it.href} target={it.target} className="[color-scheme:normal] text-inherit no-underline">{row}</a>
  : row

export default defineFixtures<Props>({
  name: "side-navigation",
  cases: [
    { id: "side-navigation-expanded", props: { entries: main, fixed, selected: "team" } },
    { id: "side-navigation-collapsed", props: { entries: main, fixed, collapsed: true, selected: "team" } },
    { id: "side-navigation-flat", props: { entries: flat, selected: "products", height: "22rem" } },
    { id: "side-navigation-parent-selected", props: { entries: flat, selected: "archived", height: "22rem" } },
    { id: "side-navigation-collapsed-flat", props: { entries: flat, collapsed: true, selected: "archived", height: "22rem" } },
    { id: "side-navigation-collapsed-overflow", props: { entries: overflowEntries, collapsed: true, selected: "page-1", height: "18rem" } },
    { id: "side-navigation-collapsed-overflow-selected", props: { entries: overflowEntries, collapsed: true, selected: "page-10", height: "18rem" } },
    { id: "side-navigation-collapsed-overflow-sub-selected", props: { entries: overflowEntries, collapsed: true, selected: "page-9-detail", height: "18rem" } },
    { id: "side-navigation-collapsed-overflow-groups", props: { entries: main, fixed, collapsed: true, selected: "history", height: "18rem" } },
    { id: "side-navigation-overflow-menu", props: { entries: overflowEntries.slice(5).map((e, i) => i === 4 ? { ...e, icon: undefined } : e), overflowMenu: true } },
    { id: "side-navigation-overflow-menu-external", props: { entries: [
      { text: "Disabled", icon: "product", disabled: true },
      { text: "External", icon: "chainLink", href: "#external", target: "_blank" },
    ], overflowMenu: true } },
    { id: "side-navigation-overflow-menu-external-anchor-focus", props: { entries: [
      { text: "Disabled", icon: "product", disabled: true },
      { text: "External", icon: "chainLink", href: "#external", target: "_blank" },
    ], overflowMenu: true, overflowAnchorFocus: true } },
  ],
  react: ({ entries, fixed, collapsed, selected, height = SN_HEIGHT, overflowMenu, overflowAnchorFocus }) => {
    // The overflow surface is shown in place like menu.tsx; actual measurement, opening,
    // selection and submenus are exercised through the real navigation in its behaviour spec.
    if (overflowMenu) return (
      <div className={inPlace}>
        <Menu open modal={false}>
          <MenuContent portal={false} preventInitialFocus aria-label="Navigation" className="fiori-sn-menu w-56" ref={(node) => {
            if (node && overflowAnchorFocus) requestAnimationFrame(() => node.querySelector<HTMLAnchorElement>("[data-sn-fixture-link]")?.focus({ preventScroll: true }))
          }}>
            <MenuGroup className="overflow-auto">
              {(entries as ItemSpec[]).map((it) => it.items?.length ? (
                <MenuSub key={it.text}>
                  <MenuSubTrigger icon={iconData(it.icon)} className={overflowMenuItemClass}>{it.text}</MenuSubTrigger>
                  <MenuSubContent className="fiori-sn-menu">
                    <MenuGroup>
                      {!it.unselectable && <MenuItem className={`${overflowMenuItemClass} fiori-sn-menu-parent`}>{it.text}</MenuItem>}
                      {it.items.map((s) => <MenuItem key={s.text} icon={iconData(s.icon)} className={overflowMenuItemClass}>{s.text}</MenuItem>)}
                    </MenuGroup>
                  </MenuSubContent>
                </MenuSub>
              ) : fixtureLink(it, <MenuItem key={it.text} icon={iconData(it.icon)} disabled={it.disabled} className={overflowMenuItemClass}
                additionalText={it.href && it.target === "_blank" ? <Icon icon={icons.arrowRight} className="fiori-sn-menu-external" style={{ width: "1rem", height: "0.875rem" }} /> : undefined}>
                {it.text}
              </MenuItem>))}
            </MenuGroup>
          </MenuContent>
        </Menu>
      </div>
    )
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
      <div style={{ height, display: "flex" }}>
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
