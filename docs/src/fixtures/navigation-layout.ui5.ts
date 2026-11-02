import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/NavigationLayout.js"
import "@ui5/webcomponents-fiori/dist/SideNavigation.js"
import "@ui5/webcomponents-fiori/dist/SideNavigationItem.js"
import "@ui5/webcomponents-fiori/dist/SideNavigationSubItem.js"
import "@ui5/webcomponents/dist/Bar.js"
import "@ui5/webcomponents/dist/Label.js"
import "@ui5/webcomponents/dist/Text.js"
import "@ui5/webcomponents-icons/dist/home.js"
import "@ui5/webcomponents-icons/dist/group.js"
import "@ui5/webcomponents-icons/dist/product.js"
import "@ui5/webcomponents-icons/dist/action-settings.js"
import "@ui5/webcomponents-icons/dist/navigation-right-arrow.js"
import "@ui5/webcomponents-icons/dist/navigation-down-arrow.js"
import "@ui5/webcomponents-icons/dist/overflow.js"

import { defineUi5, h } from "../fixture-types"
import set, { NL_CONTENT, NL_HEIGHT, NL_TITLE, NL_WIDTH } from "./navigation-layout"

export default defineUi5(set, ({ mode }) => {
  const content = h("div", {}, h("ui5-text", {}, NL_CONTENT))
  content.style.padding = "1rem"
  const layout = h(
    "ui5-navigation-layout",
    { mode: mode === "expanded" ? "Expanded" : "Collapsed" },
    h("ui5-bar", { slot: "header", design: "Header" }, h("ui5-label", {}, NL_TITLE)),
    h(
      "ui5-side-navigation",
      { slot: "sideContent", "accessible-name": "Side navigation" },
      h("ui5-side-navigation-item", { text: "Home", icon: "home" }),
      h(
        "ui5-side-navigation-item",
        { text: "People", icon: "group", expanded: true },
        h("ui5-side-navigation-sub-item", { text: "From My Team", selected: true }),
        h("ui5-side-navigation-sub-item", { text: "From Other Teams" })
      ),
      h("ui5-side-navigation-item", { text: "Products", icon: "product" }),
      h("ui5-side-navigation-item", { slot: "fixedItems", text: "Settings", icon: "action-settings" })
    ),
    content
  )
  const wrap = h("div", {}, layout)
  wrap.style.cssText = `position:relative;width:${NL_WIDTH};height:${NL_HEIGHT};font-size:var(--sapFontSize)`
  return wrap
})
