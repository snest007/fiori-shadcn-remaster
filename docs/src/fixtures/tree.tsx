import type * as React from "react"

import type { ListSelectionMode } from "@/components/ui/list"
import { Tree, TreeItem, TreeItemCustom } from "@/components/ui/tree"
import { document as documentIcon, folder } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

// Data-driven so tree.ui5.ts renders the same trees.
export type NodeSpec = {
  text: string
  expanded?: boolean
  selected?: boolean
  icon?: "folder" | "document"
  additionalText?: string
  hasChildren?: boolean
  custom?: boolean
  accessibleName?: string
  type?: "active" | "inactive" | "inactiveSelectable"
  hasPopup?: "dialog"
  conflictingAttributes?: boolean
  children?: NodeSpec[]
}
export type Props = { nodes: NodeSpec[]; mode?: ListSelectionMode; headerText?: string; channel?: "name" | "name-ref" | "description" | "description-ref"; rtl?: boolean }

export const TREE_WIDTH = "20rem"
const icons = { folder, document: documentIcon }

const sample = (sel = false): NodeSpec[] => [
  {
    text: "Documents",
    expanded: true,
    icon: "folder",
    children: [
      { text: "Reports", expanded: true, icon: "folder", selected: sel, children: [{ text: "Q1.pdf", icon: "document" }, { text: "Q2.pdf", icon: "document", selected: sel }] },
      { text: "Invoices", icon: "folder", children: [{ text: "Jan.pdf" }] },
    ],
  },
  { text: "Pictures", icon: "folder", hasChildren: true },
  { text: "Notes.txt", icon: "document", additionalText: "2 KB" },
]

export default defineFixtures<Props>({
  name: "tree",
  cases: [
    ...(["name", "name-ref", "description", "description-ref"] as const).flatMap((channel) => [false, true].map((rtl) => ({ id: `tree-a11y-${channel}${rtl ? "-rtl" : ""}`, props: { nodes: [{ text: "Documents" }], channel, rtl } }))),
    ...[false, true].flatMap((rtl) => [
      { id: `tree-a11y-item-name${rtl ? "-rtl" : ""}`, props: { nodes: [{ text: "Documents", accessibleName: "Document collection", hasPopup: "dialog" as const }], rtl } },
      { id: `tree-a11y-custom${rtl ? "-rtl" : ""}`, props: { nodes: [{ text: "Custom documents", custom: true, conflictingAttributes: true, expanded: true, children: [{ text: "Owned child" }] }], mode: "singleStart" as const, rtl } },
    ]),
    { id: "tree-basic", props: { nodes: sample() } },
    { id: "tree-collapsed", props: { nodes: [{ text: "Root A", children: [{ text: "A1" }] }, { text: "Root B", children: [{ text: "B1" }] }, { text: "Leaf" }] } },
    { id: "tree-header", props: { nodes: sample().slice(1), headerText: "Files" } },
    { id: "tree-mode-multiple", props: { nodes: sample(true), mode: "multiple" } },
    { id: "tree-mode-single-start", props: { nodes: sample().map((n, i) => ({ ...n, selected: i === 2 })), mode: "singleStart" } },
    { id: "tree-mode-single", props: { nodes: sample(true).slice(0, 1).map((n) => ({ ...n, children: n.children!.slice(0, 1) })), mode: "single" } },
    { id: "tree-mode-delete", props: { nodes: sample().slice(1), mode: "delete" } },
  ],
  react: ({ nodes, mode, headerText, channel, rtl }) => {
    let n = 0
    const selected: string[] = []
    const render = (node: NodeSpec): React.ReactNode => {
      const value = String(n++)
      if (node.selected) selected.push(value)
      const Item = node.custom ? TreeItemCustom : TreeItem
      return (
        <Item
          {...(node.conflictingAttributes ? { role: "button", tabIndex: 7, "aria-selected": true, "aria-expanded": false, "aria-level": 9, "aria-posinset": 7, "aria-setsize": 8, "aria-owns": "missing-tree-group" } : {})}
          key={value}
          value={value}
          {...(node.custom ? { content: <span>{node.text}</span> } : { text: node.text })}
          type={node.type}
          aria-label={node.accessibleName}
          aria-haspopup={node.hasPopup}
          icon={node.icon && icons[node.icon]}
          additionalText={node.additionalText}
          defaultExpanded={node.expanded}
          hasChildren={node.hasChildren}
        >
          {node.children?.map(render)}
        </Item>
      )
    }
    const items = nodes.map(render)
    const targetId = `tree-a11y-${channel}${rtl ? "-rtl" : ""}-target`
    return (
      <div style={{ width: TREE_WIDTH }} dir={rtl ? "rtl" : undefined}>
        {channel && <span hidden id={targetId}>{channel.startsWith("name") ? "File hierarchy" : "Browse company documents"}</span>}
        <Tree aria-label={channel === "name" ? "File hierarchy" : channel === "name-ref" ? undefined : "Tree"}
          aria-labelledby={channel === "name-ref" ? targetId : undefined}
          aria-description={channel === "description" ? "Browse company documents" : undefined}
          aria-describedby={channel === "description-ref" ? targetId : undefined}
          selectionMode={mode} headerText={headerText} defaultValue={selected}>
          {items}
        </Tree>
      </div>
    )
  },
})
