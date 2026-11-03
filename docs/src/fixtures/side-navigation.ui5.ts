import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/SideNavigation.js"
import "@ui5/webcomponents-fiori/dist/SideNavigationGroup.js"
import "@ui5/webcomponents-fiori/dist/SideNavigationItem.js"
import "@ui5/webcomponents-fiori/dist/SideNavigationSubItem.js"
import "@ui5/webcomponents-fiori/dist/NavigationMenu.js"
import "@ui5/webcomponents-fiori/dist/NavigationMenuItem.js"
import "@ui5/webcomponents-icons/dist/home.js"
import "@ui5/webcomponents-icons/dist/group.js"
import "@ui5/webcomponents-icons/dist/calendar.js"
import "@ui5/webcomponents-icons/dist/history.js"
import "@ui5/webcomponents-icons/dist/chain-link.js"
import "@ui5/webcomponents-icons/dist/customer.js"
import "@ui5/webcomponents-icons/dist/product.js"
import "@ui5/webcomponents-icons/dist/action-settings.js"
import "@ui5/webcomponents-icons/dist/sys-help.js"
import "@ui5/webcomponents-icons/dist/building.js"
import "@ui5/webcomponents-icons/dist/navigation-right-arrow.js"
import "@ui5/webcomponents-icons/dist/navigation-down-arrow.js"
import "@ui5/webcomponents-icons/dist/arrow-right.js"
import "@ui5/webcomponents-icons/dist/overflow.js"

import { defineUi5, h } from "../fixture-types"
import { showShadowPopupInPlace } from "./ui5-popup-in-place"
import set, { ICON_IDS, SN_HEIGHT, isGroup, type Entry, type ItemSpec, type SubSpec } from "./side-navigation"

export default defineUi5(set, ({ entries, fixed, collapsed, selected, height = SN_HEIGHT, overflowMenu }) => {
  if (overflowMenu) {
    // SideNavigationPopoverTemplate.js renderMenuItem: NavigationMenu is the real overflow
    // surface, with a duplicated selectable parent row at the beginning of each submenu.
    const menuItem = (it: ItemSpec | SubSpec): HTMLElement => h("ui5-navigation-menu-item", {
      text: it.text,
      icon: it.icon && ICON_IDS[it.icon],
      disabled: it.disabled,
      href: "href" in it ? it.href : undefined,
      target: "target" in it ? it.target : undefined,
    }, ...("items" in it && it.items?.length ? [
      ...(!it.unselectable ? [h("ui5-navigation-menu-item", { text: it.text, class: "ui5-navigation-menu-item-root-parent" })] : []),
      ...it.items.map(menuItem),
    ] : []))
    return showShadowPopupInPlace(h("ui5-navigation-menu", {}, ...(entries as ItemSpec[]).map(menuItem)), ".ui5-menu-rp", "14rem")
  }
  const sub = (s: SubSpec) =>
    h("ui5-side-navigation-sub-item", {
      text: s.text,
      icon: s.icon && ICON_IDS[s.icon],
      disabled: s.disabled,
      unselectable: s.unselectable,
      selected: s.value === selected,
    })
  const item = (it: ItemSpec, slot?: string) =>
    h(
      "ui5-side-navigation-item",
      {
        slot,
        text: it.text,
        icon: it.icon && ICON_IDS[it.icon],
        disabled: it.disabled,
        unselectable: it.unselectable,
        href: it.href,
        target: it.target,
        design: it.design && "Action",
        expanded: it.expanded,
        selected: it.value === selected,
      },
      ...(it.items ?? []).map(sub)
    )
  const entry = (e: Entry, slot?: string) =>
    isGroup(e)
      ? h("ui5-side-navigation-group", { slot, text: e.group, expanded: e.expanded, disabled: e.disabled }, ...e.items.map((i) => item(i)))
      : item(e, slot)
  const nav = h(
    "ui5-side-navigation",
    { collapsed, "accessible-name": "Side navigation" },
    ...entries.map((e) => entry(e)),
    ...(fixed ?? []).map((e) => entry(e, "fixedItems"))
  )
  const wrap = h("div", {}, nav)
  // Native SideNavigation.handleResize measures this constrained height for the collapsed
  // overflow cases, including the selected parent and separators in overflowItems.
  wrap.style.height = height
  // Align the inline-block hosts at the top; their light/shadow DOM fallback baselines differ
  // when every trailing flexible item is hidden by overflow.
  wrap.style.display = "flex"
  return wrap
})
