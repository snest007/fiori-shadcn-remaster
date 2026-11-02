import "@ui5/webcomponents/dist/Tree.js"
import "@ui5/webcomponents/dist/TreeItem.js"
import "@ui5/webcomponents-icons/dist/folder.js"
import "@ui5/webcomponents-icons/dist/document.js"
import "@ui5/webcomponents-icons/dist/navigation-right-arrow.js"
import "@ui5/webcomponents-icons/dist/navigation-down-arrow.js"
import "@ui5/webcomponents-icons/dist/decline.js"
import "@ui5/webcomponents-icons/dist/accept.js"

import { defineUi5, h } from "../fixture-types"
import set, { TREE_WIDTH, type NodeSpec } from "./tree"

const cap = (s?: string) => (s && s !== "none" ? s[0].toUpperCase() + s.slice(1) : undefined)

const node = (n: NodeSpec): HTMLElement =>
  h(
    "ui5-tree-item",
    {
      text: n.text,
      icon: n.icon,
      "additional-text": n.additionalText,
      expanded: n.expanded,
      selected: n.selected,
      "has-children": n.hasChildren,
    },
    ...(n.children ?? []).map(node)
  )

export default defineUi5(set, ({ nodes, mode, headerText }) => {
  const tree = h(
    "ui5-tree",
    { "accessible-name": "Tree", "selection-mode": cap(mode), "header-text": headerText },
    ...nodes.map(node)
  )
  const wrap = h("div", {}, tree)
  wrap.style.width = TREE_WIDTH
  wrap.style.fontSize = "var(--sapFontSize)" // see list.ui5.ts
  return wrap
})
