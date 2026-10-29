import "@ui5/webcomponents/dist/SegmentedButton.js"
import "@ui5/webcomponents/dist/SegmentedButtonItem.js"
import "@ui5/webcomponents-icons/dist/text-align-left.js"
import "@ui5/webcomponents-icons/dist/text-align-center.js"
import "@ui5/webcomponents-icons/dist/text-align-right.js"

import { defineUi5, h } from "../fixture-types"
import set from "./segmented-button"

export default defineUi5(set, ({ items, multiple }) =>
  h(
    "ui5-segmented-button",
    { "selection-mode": multiple ? "Multiple" : undefined, "accessible-name": "Segmented" },
    ...items.map((it) =>
      h("ui5-segmented-button-item", { icon: it.icon, selected: it.selected, disabled: it.disabled, "accessible-name": it.text ? undefined : it.icon }, ...(it.text ? [it.text] : []))
    )
  )
)
