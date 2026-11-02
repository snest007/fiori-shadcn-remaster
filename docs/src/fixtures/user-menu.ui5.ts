// Registers the fiori package's theme parameters for every theme (ui5-main only loads the main package's).
import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/UserMenu.js"
import "@ui5/webcomponents-fiori/dist/UserMenuAccount.js"
import "@ui5/webcomponents-fiori/dist/UserMenuItem.js"
import "@ui5/webcomponents-icons/dist/action-settings.js"
import "@ui5/webcomponents-icons/dist/globe.js"
import "@ui5/webcomponents-icons/dist/sys-help.js"
import "@ui5/webcomponents-icons/dist/log.js"
import "@ui5/webcomponents-icons/dist/user-settings.js"
import "@ui5/webcomponents-icons/dist/person-placeholder.js"

import { defineUi5, h } from "../fixture-types"
import { showShadowPopupInPlace } from "./ui5-popup-in-place"
import set from "./user-menu"

export default defineUi5(set, ({ manage, subtitle, icons }) => {
  const menu = h(
    "ui5-user-menu",
    { "show-manage-account": manage },
    h("ui5-user-menu-account", {
      slot: "accounts",
      "title-text": "John Doe",
      "subtitle-text": subtitle ? "john.doe@example.com" : undefined,
      "avatar-initials": "JD",
    }),
    h("ui5-user-menu-item", { text: "Settings", icon: icons ? "action-settings" : undefined }),
    h("ui5-user-menu-item", { text: "Language", icon: icons ? "globe" : undefined }),
    h("ui5-user-menu-item", { text: "Help", icon: icons ? "sys-help" : undefined })
  )
  // ui5-user-menu draws its surface with an internal ui5-responsive-popover in its shadow root.
  const frame = showShadowPopupInPlace(menu, "#user-menu-rp")
  const hideArrow = () => {
    const popup = menu.shadowRoot?.querySelector("#user-menu-rp")
    if (popup) popup.setAttribute("hide-arrow", "")
    else requestAnimationFrame(hideArrow)
  }
  hideArrow()
  return frame
})
