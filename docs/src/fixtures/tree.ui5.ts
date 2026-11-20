import "@ui5/webcomponents/dist/Tree.js"
import "@ui5/webcomponents/dist/TreeItem.js"
import "@ui5/webcomponents/dist/TreeItemCustom.js"
import "@ui5/webcomponents-icons/dist/folder.js"
import "@ui5/webcomponents-icons/dist/document.js"
import "@ui5/webcomponents-icons/dist/navigation-right-arrow.js"
import "@ui5/webcomponents-icons/dist/navigation-down-arrow.js"
import "@ui5/webcomponents-icons/dist/decline.js"
import "@ui5/webcomponents-icons/dist/accept.js"

import { defineUi5, h } from "../fixture-types"
import set, { TREE_WIDTH, type NodeSpec } from "./tree"

const cap = (s?: string) => (s && s !== "none" ? s[0].toUpperCase() + s.slice(1) : undefined)

const node = (n: NodeSpec): HTMLElement => {
  const item = h(
    n.custom ? "ui5-tree-item-custom" : "ui5-tree-item",
    {
      text: n.custom ? undefined : n.text,
      "accessible-name": n.accessibleName,
      type: cap(n.type),
      icon: n.icon,
      "additional-text": n.additionalText,
      expanded: n.expanded,
      selected: n.selected,
      "has-children": n.hasChildren,
    },
    ...(n.custom ? [h("span", { slot: "content" }, n.text)] : []), ...(n.children ?? []).map(node)
  )
  ;(item as any).accessibilityAttributes = { hasPopup: n.hasPopup }
  return item
}

export default defineUi5(set, ({ nodes, mode, headerText, channel, rtl }) => {
  const targetId = `tree-a11y-${channel}${rtl ? "-rtl" : ""}-target-ui5`
  const tree = h(
    "ui5-tree",
    { "accessible-name": channel === "name" ? "File hierarchy" : channel === "name-ref" ? undefined : "Tree",
      "accessible-name-ref": channel === "name-ref" ? targetId : undefined,
      "accessible-description": channel === "description" ? "Browse company documents" : undefined,
      "accessible-description-ref": channel === "description-ref" ? targetId : undefined,
      "selection-mode": cap(mode), "header-text": headerText },
    ...nodes.map(node)
  )
  const wrap = h("div", { dir: rtl ? "rtl" : undefined }, ...(channel ? [h("span", { hidden: true, id: targetId }, channel.startsWith("name") ? "File hierarchy" : "Browse company documents")] : []), tree)
  wrap.style.width = TREE_WIDTH
  wrap.style.fontSize = "var(--sapFontSize)" // see list.ui5.ts
  return wrap
})
