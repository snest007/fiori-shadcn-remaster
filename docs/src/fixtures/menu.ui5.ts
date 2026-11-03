import "@ui5/webcomponents/dist/Menu.js"
import "@ui5/webcomponents/dist/MenuItem.js"
import "@ui5/webcomponents/dist/MenuItemGroup.js"
import "@ui5/webcomponents/dist/MenuSeparator.js"
import "@ui5/webcomponents-icons/dist/copy.js"
import "@ui5/webcomponents-icons/dist/paste.js"
import "@ui5/webcomponents-icons/dist/delete.js"

import { defineUi5, h } from "../fixture-types"
import { showShadowPopupInPlace } from "./ui5-popup-in-place"
import set from "./menu"

export default defineUi5(set, ({ icons, checkMode }) => {
  if (checkMode) {
    const menu = h("ui5-menu", {},
      h("ui5-menu-item", { text: "Options", icon: icons ? "copy" : undefined }),
      h("ui5-menu-item-group", { "check-mode": checkMode === "single" ? "Single" : "Multiple" },
        h("ui5-menu-item", { text: "Alpha", checked: true, icon: icons ? "paste" : undefined, "additional-text": "Ctrl+A" }),
        h("ui5-menu-item", { text: "Beta", checked: checkMode === "multiple" }),
        h("ui5-menu-item", { text: "Disabled", disabled: true, checked: checkMode === "multiple" }),
        h("ui5-menu-item", { text: "Nested", checked: checkMode === "multiple" }, h("ui5-menu-item", { text: "Child" }))),
      h("ui5-menu-separator"),
      h("ui5-menu-item-group", {}, h("ui5-menu-item", { text: "Ordinary", checked: true })))
    return showShadowPopupInPlace(menu, ".ui5-menu-rp", "10rem")
  }
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
