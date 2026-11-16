import "@ui5/webcomponents/dist/SegmentedButton.js"
import "@ui5/webcomponents/dist/SegmentedButtonItem.js"
import "@ui5/webcomponents-icons/dist/text-align-left.js"
import "@ui5/webcomponents-icons/dist/text-align-center.js"
import "@ui5/webcomponents-icons/dist/text-align-right.js"

import { defineUi5, h } from "../fixture-types"
import set from "./segmented-button"

export default defineUi5(set, ({ items, multiple, channel, itemChannel }) => {
  const targetId = `segmented-button-${itemChannel ? "item" : "root"}-${channel}-ui5`
  const attributes = {
    "accessible-name": channel === "name" ? "Cartography" : undefined,
    "accessible-name-ref": channel === "name-ref" ? targetId : undefined,
    "accessible-description": channel === "description" ? "Choose a map layer" : undefined,
    "accessible-description-ref": channel === "description-ref" ? targetId : undefined,
  }
  const rootAttributes = itemChannel || !channel ? {} : { ...attributes, "accessible-name": attributes["accessible-name"] ?? (channel === "name-ref" ? undefined : "Segmented") }
  const group = h("ui5-segmented-button", { "selection-mode": multiple ? "Multiple" : undefined, "accessible-name": "Segmented", ...rootAttributes },
    ...items.map((it, i) => h("ui5-segmented-button-item", { icon: it.icon, selected: it.selected, disabled: it.disabled, hidden: it.hidden, "accessible-name": it.text ? undefined : it.icon, ...(itemChannel && i === 0 ? attributes : {}) }, ...(it.text ? [it.text] : []))))
  return channel ? h("span", {}, h("span", { hidden: true, id: targetId }, channel.startsWith("name") ? "Cartography" : "Choose a map layer"), group) : group
})
