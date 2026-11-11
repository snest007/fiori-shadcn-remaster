import "@ui5/webcomponents/dist/Menu.js"
import "@ui5/webcomponents/dist/MenuItem.js"
import "@ui5/webcomponents/dist/MenuItemGroup.js"
import "@ui5/webcomponents/dist/MenuSeparator.js"
import "@ui5/webcomponents-icons/dist/copy.js"
import "@ui5/webcomponents-icons/dist/paste.js"
import "@ui5/webcomponents-icons/dist/delete.js"

import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import { defineUi5, h, type Ui5FixtureElement } from "../fixture-types"
import { showShadowPopupInPlace } from "./ui5-popup-in-place"
import set from "./menu"

export default defineUi5(set, ({ icons, checkMode, disabledSubmenu, interaction }) => {
  if (checkMode) {
    const menu = h("ui5-menu", {},
      h("ui5-menu-item", { text: "Options", icon: icons ? "copy" : undefined }),
      h("ui5-menu-item-group", { "check-mode": checkMode === "single" ? "Single" : "Multiple" },
        h("ui5-menu-item", { text: "Alpha", checked: true, icon: icons ? "paste" : undefined, "additional-text": "Ctrl+A" }),
        h("ui5-menu-item", { text: "Beta", checked: checkMode === "multiple" }),
        h("ui5-menu-item", { text: "Disabled", disabled: true, checked: checkMode === "multiple" }),
        h("ui5-menu-item", { text: "Nested", disabled: disabledSubmenu, checked: checkMode === "multiple" || disabledSubmenu }, h("ui5-menu-item", { text: "Child" }))),
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
  const frame = showShadowPopupInPlace(menu, ".ui5-menu-rp", "10rem") as Ui5FixtureElement
  if (interaction) frame.fixtureReady = (async () => {
    while (!menu.isConnected || !menu.shadowRoot?.querySelector(".ui5-menu-rp")) await new Promise(requestAnimationFrame)
    await renderFinished()
    // Popup.onEnterDOM marks the closed reference surface as a native manual popover.
    // Displaying it in place paints it, but the browser still excludes its descendants
    // from Tab navigation. Remove that positioning mechanism for this open-surface cell;
    // its UI5 List/ItemNavigation tab stops and all visual CSS remain intact.
    const popup = menu.shadowRoot!.querySelector<HTMLElement>(".ui5-menu-rp")!
    popup.removeAttribute("popover")
    // PopupTemplate's traps and Popup.onEnterDOM's tabindex=-1 are modal
    // boundaries; this isolated in-place surface must allow Tab into its row.
    popup.removeAttribute("tabindex")
    popup.shadowRoot!.querySelectorAll("[data-ui5-focus-trap]").forEach((guard) => guard.setAttribute("tabindex", "-1"))
  })()
  return frame
})
