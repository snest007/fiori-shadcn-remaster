import * as React from "react"
import { FioriDropIndicator } from "@/lib/fiori-drag-and-drop"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  List,
  ListItemCustom,
  ListItemGroup,
  ListItemGroupHeader,
  ListItemStandard,
  type ListAdditionalTextState,
  type ListAccessibleRole,
  type ListGrowing,
  type ListItemHighlight,
  type ListItemType,
  type ListSelectionMode,
  type ListSeparators,
} from "@/components/ui/list"
import { calendar, email, employee, folder, history, product, settings, type FioriIconData } from "@/lib/fiori-icons"

import { defineFixtures, type FixtureCase } from "../fixture-types"

// Data-driven so list.ui5.ts renders exactly the same lists.
export type ItemSpec = {
  text: string
  description?: string
  icon?: "calendar" | "email" | "employee" | "folder" | "history" | "product" | "settings"
  iconEnd?: boolean
  additionalText?: string
  additionalTextState?: ListAdditionalTextState
  type?: ListItemType
  highlight?: ListItemHighlight
  selected?: boolean
  avatar?: string
  navigated?: boolean
  disabled?: boolean
  movable?: boolean
  moving?: boolean
  active?: boolean
  /** ListItemCustom with a text and a button. */
  custom?: boolean
  accessibleName?: string
  itemRole?: "listitem" | "option" | "treeitem" | "menuitem"
  position?: number
  setSize?: number
  noControl?: boolean
}
export type GroupSpec = { group: string; items: ItemSpec[] }
export type Props = {
  items: (ItemSpec | GroupSpec)[]
  mode?: ListSelectionMode
  headerText?: string
  footerText?: string
  noDataText?: string
  separators?: ListSeparators
  growing?: ListGrowing
  dropPlacement?: "Before" | "After" | "On"
  focusFirst?: boolean
  channel?: "name" | "name-ref" | "description" | "description-ref"
  growingA11y?: boolean
  listbox?: boolean
  role?: ListAccessibleRole
  groupHeaderA11y?: boolean
  rtl?: boolean
}

export const LIST_WIDTH = "20rem"
export const listIcons: Record<NonNullable<ItemSpec["icon"]>, FioriIconData> = { calendar, email, employee, folder, history, product, settings }

const three: ItemSpec[] = [{ text: "Apples" }, { text: "Bananas" }, { text: "Cherries" }]
const sel = (mode: ListSelectionMode, items: ItemSpec[] = three): Props => ({
  mode,
  items: items.map((it, i) => ({ ...it, selected: i === 1 })),
})
const states = ["none", "negative", "critical", "positive", "information"] as const
const richMovable: ItemSpec = { text: "Laptop", description: "Dell XPS 15", icon: "product", additionalText: "In stock", selected: true, movable: true }

const cases: FixtureCase<Props>[] = [
  ...(["list", "listbox", "menu", "tree"] as const).map((role) => ({ id: `list-a11y-root-${role}`, props: { items: [{ text: "Apples", type: "inactive" as const }], role } })),
  { id: "list-a11y-standard-name", props: { items: [{ text: "Apples", accessibleName: "Produce row" }] } },
  { id: "list-a11y-custom-name", props: { items: [{ text: "Apples", custom: true, noControl: true, accessibleName: "Produce row", selected: true, position: 2, setSize: 7, itemRole: "option" }], role: "listbox", mode: "single" } },
  { id: "list-a11y-group-header-name", props: { items: [{ text: "Apples", type: "inactive" }], groupHeaderA11y: true } },
  { id: "list-a11y-selection-rtl", props: { items: three, mode: "multiple", rtl: true } },
  { id: "list-groups-rtl", props: { items: [{ group: "Fruit", items: three }], rtl: true } },
  ...(["name", "name-ref", "description", "description-ref"] as const).map((channel) => ({ id: `list-a11y-${channel}`, props: { items: [{ text: "Apples", type: "inactive" as const }], channel } })),
  { id: "list-a11y-role", props: { items: [{ text: "Apples", type: "inactive" }], listbox: true } },
  { id: "list-a11y-growing", props: { items: [{ text: "Apples", type: "inactive" }], growing: "button", growingA11y: true } },
  { id: "list-custom-focused", props: { items: [{ text: "Custom item", custom: true }], focusFirst: true } },
  { id: "list-drop-indicator-before", props: { items: three, dropPlacement: "Before" } },
  { id: "list-drop-indicator-after", props: { items: three, dropPlacement: "After" } },
  { id: "list-drop-indicator-on", props: { items: three, dropPlacement: "On" } },
  { id: "list-movable-disabled", props: { items: three.map((it, i) => ({ ...it, movable: true, disabled: i === 1 })) } },
  { id: "list-movable-moving", props: { items: three.map((it, i) => ({ ...it, movable: true, moving: i === 1 })) } },
  { id: "list-movable-rich", props: { items: [richMovable] } },
  { id: "list-movable-active-rich", props: { items: [{ ...richMovable, active: true }] } },
  { id: "list-movable-active-moving-rich", props: { items: [{ ...richMovable, active: true, moving: true }] } },
  { id: "list-basic", props: { items: three }, interact: { selector: '[data-slot="list-item"]', ui5Selector: "ui5-li" } },
  { id: "list-header-footer", props: { items: three, headerText: "Fruits", footerText: "3 items" } },
  {
    id: "list-icons",
    props: { items: [{ text: "Calendar", icon: "calendar" }, { text: "Mail", icon: "email" }, { text: "Settings", icon: "settings", iconEnd: true }] },
  },
  {
    id: "list-additional-text",
    props: { items: states.map((s) => ({ text: `State ${s}`, additionalText: s === "none" ? "Neutral" : s[0].toUpperCase() + s.slice(1), additionalTextState: s })) },
  },
  {
    id: "list-description",
    props: {
      items: [
        { text: "Laptop", description: "Dell XPS 15", additionalText: "In stock", additionalTextState: "positive" },
        { text: "Monitor", description: "27 inch, 4K", additionalText: "Low", additionalTextState: "critical", icon: "product" },
      ],
    },
  },
  {
    id: "list-avatar",
    props: {
      items: [
        { text: "John Doe", description: "Engineering", avatar: "JD" },
        { text: "Anna Brown", description: "Sales", avatar: "AB", additionalText: "Away" },
      ],
    },
  },
  {
    id: "list-types",
    props: {
      items: [
        { text: "Active (default)" },
        { text: "Navigation", type: "navigation" },
        { text: "Detail", type: "detail" },
        { text: "Inactive", type: "inactive" },
        { text: "Navigated", type: "navigation", navigated: true },
        { text: "Disabled", disabled: true },
      ],
    },
  },
  { id: "list-highlight", props: { items: (["negative", "critical", "positive", "information"] as const).map((h) => ({ text: `Highlight ${h}`, highlight: h })) } },
  { id: "list-selected", props: { items: [{ text: "Selected", selected: true }, { text: "Not selected" }] } },
  { id: "list-mode-single", props: sel("single") },
  { id: "list-mode-single-start", props: sel("singleStart") },
  { id: "list-mode-single-end", props: sel("singleEnd") },
  { id: "list-mode-single-auto", props: sel("singleAuto") },
  { id: "list-mode-multiple", props: sel("multiple") },
  { id: "list-mode-delete", props: sel("delete") },
  {
    id: "list-mode-multiple-description",
    props: sel("multiple", [
      { text: "Laptop", description: "Dell XPS 15" },
      { text: "Monitor", description: "27 inch, 4K", additionalText: "Low", additionalTextState: "critical" },
    ]),
  },
  { id: "list-separators-inner", props: { items: three, separators: "inner" } },
  { id: "list-separators-none", props: { items: three, separators: "none" } },
  {
    id: "list-groups",
    props: {
      items: [
        { group: "Fruits", items: [{ text: "Apples" }, { text: "Pears" }] },
        { group: "Vegetables", items: [{ text: "Carrots" }] },
      ],
    },
  },
  { id: "list-no-data", props: { items: [], noDataText: "No data", headerText: "Products" } },
  { id: "list-growing", props: { items: three, growing: "button" } },
  { id: "list-custom", props: { items: [{ text: "Custom item", custom: true }, { text: "Another one", custom: true }] } },
  { id: "list-custom-multiple", props: sel("multiple", [{ text: "Custom item", custom: true }, { text: "Another one", custom: true }]) },
  { id: "list-custom-single-start", props: sel("singleStart", [{ text: "Custom item", custom: true }, { text: "Another one", custom: true }]) },
]

function renderItem(it: ItemSpec, i: number) {
  if (it.custom) {
    return (
      <ListItemCustom aria-label={it.accessibleName} role={it.itemRole} aria-posinset={it.position} aria-setsize={it.setSize} key={i} value={String(i)} highlight={it.highlight} type={it.type} disabled={it.disabled} movable={it.movable} data-moving={it.moving ? "" : undefined} {...(it.active === undefined ? {} : { "data-active": it.active ? "" : undefined })}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <span>{it.text}</span>
          {!it.noControl && <Button>Edit</Button>}
        </div>
      </ListItemCustom>
    )
  }
  return (
    <ListItemStandard
      key={i}
      value={String(i)}
      aria-label={it.accessibleName}
      role={it.itemRole}
      aria-posinset={it.position}
      aria-setsize={it.setSize}
      text={it.text}
      description={it.description}
      icon={it.icon && listIcons[it.icon]}
      iconEnd={it.iconEnd}
      additionalText={it.additionalText}
      additionalTextState={it.additionalTextState}
      type={it.type}
      highlight={it.highlight}
      navigated={it.navigated}
      disabled={it.disabled}
      movable={it.movable}
      data-moving={it.moving ? "" : undefined}
      {...(it.active === undefined ? {} : { "data-active": it.active ? "" : undefined })}
      image={it.avatar ? <Avatar initials={it.avatar} size="S" /> : undefined}
    />
  )
}

export const selectedValues = (items: Props["items"]) => {
  const out: string[] = []
  let n = 0
  for (const x of items) for (const it of "group" in x ? x.items : [x]) (it.selected && out.push(String(n)), n++)
  return out
}

function StaticListDrop({ children, placement }: { children: React.ReactNode; placement?: "Before" | "After" | "On" }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [elements, setElements] = React.useState<{ owner: HTMLElement; target: HTMLElement } | null>(null)
  React.useLayoutEffect(() => {
    if (!placement || !ref.current) return
    const owner = ref.current.querySelector<HTMLElement>('[data-slot="list"]')!
    setElements({ owner, target: owner.querySelectorAll<HTMLElement>('[data-slot="list-item"]')[1] })
  }, [placement])
  return <div ref={ref} style={{ width: LIST_WIDTH, position: "relative" }}>{children}{elements && <FioriDropIndicator ownerReference={elements.owner} targetReference={elements.target} placement={placement} />}</div>
}

function FocusedListFixture({ focused, children, rtl }: { focused?: boolean; children: React.ReactNode; rtl?: boolean }) {
  const root = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    if (!focused) return
    const item = root.current?.querySelector<HTMLElement>('[data-slot="list-item"]')
    item?.focus()
    // INTEGRATION cause 3: later popup fixtures steal document focus. Preserve
    // only this already-focused fixture's paint for the full-page pixel capture;
    // its isolated AX/behavior checks still require real owning keyboard focus.
    if (item && item === document.activeElement && item.matches(":focus-visible")) item.setAttribute("data-fixture-keyboard-focus", "")
  }, [focused])
  return <div ref={root} dir={rtl ? "rtl" : undefined}>
    {focused && <style>{`[data-fixture="list-custom-focused"] .fiori-li[data-fixture-keyboard-focus]::after {
      content: ""; border: var(--sapContent_FocusWidth) var(--sapContent_FocusStyle) var(--sapContent_FocusColor);
      position: absolute; inset: .125rem; pointer-events: none;
    }`}</style>}
    {children}
  </div>
}

export default defineFixtures<Props>({
  name: "list",
  a11yDiff: {
    "list-a11y-custom-name": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-a11y-description": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-a11y-description-ref": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-a11y-group-header-name": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-a11y-growing": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/0",
        "/ours/ax/0/children/0/children/0/children/3",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-a11y-name": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-a11y-name-ref": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-a11y-role": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-a11y-root-list": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-a11y-root-listbox": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-a11y-root-menu": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-a11y-root-tree": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-a11y-selection-rtl": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/3",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/3",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/3",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/2/children/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/2/children/1/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/2/children/2/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-a11y-standard-name": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-additional-text": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/3/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/3/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/3/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/4/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/4/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/4/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-avatar": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/1/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/1/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/1/children/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/1/children/1/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/1/children/1/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/1/children/1/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-basic": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-custom": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/1/children/0/children/1/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/1/children/1/children/1/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-custom-focused": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/1/children/0/children/1/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-custom-multiple": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/3",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/3",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/2/children/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/2/children/0/children/2/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/2/children/1/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/2/children/1/children/2/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-custom-single-start": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/3",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/3",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/2/children/0/children/2/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/2/children/1/children/2/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-description": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-drop-indicator-after": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/1",
        "/ui5/ax/0/children/0/children/0/children/1/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-drop-indicator-before": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/1",
        "/ui5/ax/0/children/0/children/0/children/1/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-drop-indicator-on": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/1",
        "/ui5/ax/0/children/0/children/0/children/1/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-groups": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1/children/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1/children/0/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1/children/0/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1/children/0/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1/children/0/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1/children/0/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1/children/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1/children/0/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1/children/0/children/0/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/1/children/0/children/1/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/1/children/1/children/1/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-groups-rtl": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1/children/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1/children/0/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1/children/0/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1/children/0/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1/children/0/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1/children/0/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1/children/0/children/2/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1/children/0/children/2/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1/children/0/children/2/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/1/children/0/children/1/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-growing": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/0",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-header-footer": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/0",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-highlight": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/3",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/3",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/3",
        "/ours/ax/0/children/0/children/0/children/1/children/3/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/3/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/3/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/3/children/3",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/1/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/1/children/1/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/1/children/2/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/1/children/3/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-icons": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-mode-delete": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/3",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/3",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/0",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/3",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-mode-multiple": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/3",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/3",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/3",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/2/children/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/2/children/1/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/2/children/2/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-mode-multiple-description": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/3",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/3",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/2/children/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/2/children/1/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-mode-single": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/0",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-mode-single-auto": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/0",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-mode-single-end": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/3",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/3",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/0",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/3",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-mode-single-start": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/0/children/3",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/1/children/3",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/1",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/2",
        "/ours/ax/0/children/0/children/0/children/2/children/2/children/3",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-movable-active-moving-rich": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-movable-active-rich": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-movable-disabled": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-movable-moving": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-movable-rich": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-no-data": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/1/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-selected": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-separators-inner": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-separators-none": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "list-types": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/0/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/1/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/2/children/3",
        "/ours/ax/0/children/0/children/0/children/1/children/3/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/3/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/3/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/4/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/4/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/4/children/2",
        "/ours/ax/0/children/0/children/0/children/1/children/4/children/3",
        "/ours/ax/0/children/0/children/0/children/1/children/5/children/0",
        "/ours/ax/0/children/0/children/0/children/1/children/5/children/1",
        "/ours/ax/0/children/0/children/0/children/1/children/5/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/1/children/4/children/2"
      ],
      "reason": "React/DOM difference in list: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    }
  },
  cases,
  react: ({ items, mode, headerText, footerText, noDataText, separators, growing, dropPlacement, focusFirst, channel, growingA11y, listbox, role, groupHeaderA11y, rtl }) => {
    let n = 0
    const targetId = `list-a11y-${channel}-target`
    const attributes = {
      "aria-label": channel === "name" ? "Produce" : channel === "name-ref" ? undefined : "List",
      "aria-labelledby": channel === "name-ref" ? targetId : undefined,
      "aria-description": channel === "description" ? "Fresh fruit" : undefined,
      "aria-describedby": channel === "description-ref" ? targetId : undefined,
    }
    return (<FocusedListFixture focused={focusFirst} rtl={rtl}>
      {channel && <span hidden id={targetId}>{channel.startsWith("name") ? "Produce" : "Fresh fruit"}</span>}
      <StaticListDrop placement={dropPlacement}>
        <List
          {...attributes}
          accessibleRole={role ?? (listbox ? "listbox" : undefined)}
          growingButtonName={growingA11y ? "Load produce" : undefined}
          growingButtonDescription={growingA11y ? "Fetch additional fruit" : undefined}
          selectionMode={mode}
          defaultValue={selectedValues(items)}
          headerText={headerText}
          footerText={footerText}
          noDataText={noDataText}
          separators={separators}
          growing={growing}
        >
          {groupHeaderA11y && <ListItemGroupHeader accessibleName="Produce categories">Fruit group</ListItemGroupHeader>}
          {items.map((x, gi) =>
            "group" in x ? (
              <ListItemGroup key={`g${gi}`} headerText={x.group}>
                {x.items.map((it) => renderItem(it, n++))}
              </ListItemGroup>
            ) : (
              renderItem(x, n++)
            )
          )}
        </List>
      </StaticListDrop>
      </FocusedListFixture>)
  },
})
