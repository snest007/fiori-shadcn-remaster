import "@ui5/webcomponents/dist/Menu.js"
import "@ui5/webcomponents/dist/MenuItem.js"
import "@ui5/webcomponents/dist/MenuSeparator.js"
import "@ui5/webcomponents-icons/dist/copy.js"
import "@ui5/webcomponents-icons/dist/paste.js"
import "@ui5/webcomponents-icons/dist/delete.js"

import { defineUi5, h } from "../fixture-types"
import { showShadowPopupInPlace } from "./ui5-popup-in-place"
import set from "./menu"

export default defineUi5(set, ({ icons }) => {
  const menu = h(
    "ui5-menu",
    {},
    h("ui5-menu-item", { text: "Copy", icon: icons ? "copy" : undefined, "additional-text": "Ctrl+C" }),
    h("ui5-menu-item", { text: "Paste", icon: icons ? "paste" : undefined, disabled: true }),
    h("ui5-menu-separator"),
    h("ui5-menu-item", { text: "Share" }, h("ui5-menu-item", { text: "Email" })),
    h("ui5-menu-item", { text: "Delete", icon: icons ? "delete" : undefined })
  )
  // ui5-menu draws its surface with an internal ui5-responsive-popover in its shadow root.
  return showShadowPopupInPlace(menu, ".ui5-menu-rp", "10rem")
})
