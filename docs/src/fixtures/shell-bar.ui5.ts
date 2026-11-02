// Registers the fiori package's theme parameters for every theme (ui5-main only loads the main package's).
import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/ShellBar.js"
import "@ui5/webcomponents-fiori/dist/ShellBarBranding.js"
import "@ui5/webcomponents-fiori/dist/ShellBarItem.js"
import "@ui5/webcomponents-fiori/dist/ShellBarSpacer.js"
import "@ui5/webcomponents-fiori/dist/ShellBarSearch.js"
import "@ui5/webcomponents/dist/Avatar.js"
import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents/dist/ToggleButton.js"
import "@ui5/webcomponents/dist/Tag.js"
import "@ui5/webcomponents/dist/Text.js"
import "@ui5/webcomponents-icons/dist/menu2.js"
import "@ui5/webcomponents-icons/dist/da.js"
import "@ui5/webcomponents-icons/dist/sys-help.js"
import "@ui5/webcomponents-icons/dist/travel-expense.js"
import "@ui5/webcomponents-icons/dist/search.js"
import "@ui5/webcomponents-icons/dist/bell.js"
import "@ui5/webcomponents-icons/dist/grid.js"
import "@ui5/webcomponents-icons/dist/overflow.js"

import { defineUi5, h } from "../fixture-types"
import set, { SHELL_LOGO } from "./shell-bar"

const itemIcons = { help: "sys-help", expense: "travel-expense" }

export default defineUi5(set, (p) => {
  const bar = h(
    "ui5-shellbar",
    {
      "show-notifications": !!p.notifications,
      "notifications-count": typeof p.notifications === "string" ? p.notifications : undefined,
      "show-product-switch": p.productSwitch,
      "show-search-field": p.search === "expanded",
      "disable-search-collapse": true,
    },
    ...(p.startButton ? [h("ui5-button", { slot: "startButton", icon: "menu2", design: "Transparent", "accessible-name": "Menu" })] : []),
    ...(p.title || p.logo
      ? [h("ui5-shellbar-branding", { slot: "branding" }, ...(p.logo ? [h("img", { slot: "logo", src: SHELL_LOGO, alt: "" })] : []), p.title ?? "")]
      : []),
    ...(p.start ?? []).map((t) => (t.startsWith("#") ? h("ui5-text", { slot: "content" }, t.slice(1)) : h("ui5-tag", { slot: "content" }, t))),
    ...(p.start || p.end ? [h("ui5-shellbar-spacer", { slot: "content" })] : []),
    ...(p.end ?? []).map((t) => (t.startsWith("#") ? h("ui5-text", { slot: "content" }, t.slice(1)) : h("ui5-tag", { slot: "content" }, t))),
    ...(p.search ? [h("ui5-shellbar-search", { slot: "searchField", placeholder: "Search" })] : []),
    ...(p.assistant ? [h("ui5-toggle-button", { slot: "assistant", icon: "da", design: "Transparent", "accessible-name": "Joule" })] : []),
    ...(p.items ?? []).map((it) => h("ui5-shellbar-item", { icon: itemIcons[it.icon], text: it.text, count: it.count })),
    ...(p.profile ? [h("ui5-avatar", { slot: "profile", initials: "JD" })] : [])
  )
  bar.style.width = p.width
  return bar
})
