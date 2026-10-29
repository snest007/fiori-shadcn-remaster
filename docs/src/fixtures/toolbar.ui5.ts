import "@ui5/webcomponents/dist/Label.js"
import "@ui5/webcomponents/dist/Toolbar.js"
import "@ui5/webcomponents/dist/ToolbarButton.js"
import "@ui5/webcomponents/dist/ToolbarItem.js"
import "@ui5/webcomponents/dist/ToolbarSeparator.js"
import "@ui5/webcomponents/dist/ToolbarSpacer.js"
import "@ui5/webcomponents-icons/dist/overflow.js"

import { defineUi5, h } from "../fixture-types"
import set, { TOOLBAR_WIDTH } from "./toolbar"

export default defineUi5(set, ({ items, alignContent, design }) => {
  const el = h(
    "ui5-toolbar",
    { "accessible-name": "Actions", "align-content": alignContent === "start" ? "Start" : undefined, design: design === "transparent" ? "Transparent" : undefined },
    ...items.map((t) =>
      t === "|"
        ? h("ui5-toolbar-separator")
        : t === "<->"
          ? h("ui5-toolbar-spacer")
          : t.endsWith("rem")
            ? h("ui5-toolbar-spacer", { width: t })
            : t.startsWith("#")
              ? h("ui5-toolbar-item", {}, h("ui5-label", {}, t.slice(1)))
              : h("ui5-toolbar-button", { text: t })
    )
  )
  el.style.width = TOOLBAR_WIDTH
  return el
})
