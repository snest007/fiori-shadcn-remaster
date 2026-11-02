import type * as React from "react"

import type { ListSelectionMode } from "@/components/ui/list"
import { Tree, TreeItem } from "@/components/ui/tree"
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
  children?: NodeSpec[]
}
export type Props = { nodes: NodeSpec[]; mode?: ListSelectionMode; headerText?: string }

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
    { id: "tree-basic", props: { nodes: sample() } },
    { id: "tree-collapsed", props: { nodes: [{ text: "Root A", children: [{ text: "A1" }] }, { text: "Root B", children: [{ text: "B1" }] }, { text: "Leaf" }] } },
    { id: "tree-header", props: { nodes: sample().slice(1), headerText: "Files" } },
    { id: "tree-mode-multiple", props: { nodes: sample(true), mode: "multiple" } },
    { id: "tree-mode-single-start", props: { nodes: sample().map((n, i) => ({ ...n, selected: i === 2 })), mode: "singleStart" } },
    { id: "tree-mode-single", props: { nodes: sample(true).slice(0, 1).map((n) => ({ ...n, children: n.children!.slice(0, 1) })), mode: "single" } },
    { id: "tree-mode-delete", props: { nodes: sample().slice(1), mode: "delete" } },
  ],
  react: ({ nodes, mode, headerText }) => {
    let n = 0
    const selected: string[] = []
    const render = (node: NodeSpec): React.ReactNode => {
      const value = String(n++)
      if (node.selected) selected.push(value)
      return (
        <TreeItem
          key={value}
          value={value}
          text={node.text}
          icon={node.icon && icons[node.icon]}
          additionalText={node.additionalText}
          defaultExpanded={node.expanded}
          hasChildren={node.hasChildren}
        >
          {node.children?.map(render)}
        </TreeItem>
      )
    }
    const items = nodes.map(render)
    return (
      <div style={{ width: TREE_WIDTH }}>
        <Tree aria-label="Tree" selectionMode={mode} headerText={headerText} defaultValue={selected}>
          {items}
        </Tree>
      </div>
    )
  },
})
