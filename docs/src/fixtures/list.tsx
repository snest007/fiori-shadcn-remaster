import * as React from "react"
import { FioriDropIndicator } from "@/lib/fiori-drag-and-drop"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  List,
  ListItemCustom,
  ListItemGroup,
  ListItemStandard,
  type ListAdditionalTextState,
  type ListGrowing,
  type ListItemHighlight,
  type ListItemType,
  type ListSelectionMode,
  type ListSeparators,
} from "@/components/ui/list"
import { calendar, email, employee, folder, history, product, settings, type FioriIconData } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

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
  /** ListItemCustom with a text and a button. */
  custom?: boolean
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
}

export const LIST_WIDTH = "20rem"
export const listIcons: Record<NonNullable<ItemSpec["icon"]>, FioriIconData> = { calendar, email, employee, folder, history, product, settings }

const three: ItemSpec[] = [{ text: "Apples" }, { text: "Bananas" }, { text: "Cherries" }]
const sel = (mode: ListSelectionMode, items: ItemSpec[] = three): Props => ({
  mode,
  items: items.map((it, i) => ({ ...it, selected: i === 1 })),
})
const states = ["none", "negative", "critical", "positive", "information"] as const

const cases: { id: string; props: Props }[] = [
  { id: "list-drop-indicator-before", props: { items: three, dropPlacement: "Before" } },
  { id: "list-drop-indicator-after", props: { items: three, dropPlacement: "After" } },
  { id: "list-drop-indicator-on", props: { items: three, dropPlacement: "On" } },
  { id: "list-basic", props: { items: three } },
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
      <ListItemCustom key={i} value={String(i)} highlight={it.highlight} type={it.type} disabled={it.disabled}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <span>{it.text}</span>
          <Button>Edit</Button>
        </div>
      </ListItemCustom>
    )
  }
  return (
    <ListItemStandard
      key={i}
      value={String(i)}
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

export default defineFixtures<Props>({
  name: "list",
  cases,
  react: ({ items, mode, headerText, footerText, noDataText, separators, growing, dropPlacement }) => {
    let n = 0
    return (
      <StaticListDrop placement={dropPlacement}>
        <List
          aria-label="List"
          selectionMode={mode}
          defaultValue={selectedValues(items)}
          headerText={headerText}
          footerText={footerText}
          noDataText={noDataText}
          separators={separators}
          growing={growing}
        >
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
    )
  },
})
