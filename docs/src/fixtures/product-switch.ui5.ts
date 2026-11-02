// Registers the fiori package's theme parameters for every theme (ui5-main only loads the main package's).
import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/ProductSwitch.js"
import "@ui5/webcomponents-fiori/dist/ProductSwitchItem.js"
import "@ui5/webcomponents-icons/dist/home.js"
import "@ui5/webcomponents-icons/dist/customer.js"
import "@ui5/webcomponents-icons/dist/product.js"
import "@ui5/webcomponents-icons/dist/travel-expense.js"
import "@ui5/webcomponents-icons/dist/settings.js"
import "@ui5/webcomponents-icons/dist/sys-help.js"
import "@ui5/webcomponents-icons/dist/action-settings.js"
import "@ui5/webcomponents-icons/dist/grid.js"

import { defineUi5, h } from "../fixture-types"
import set, { PRODUCTS } from "./product-switch"

export default defineUi5(set, ({ count, selected }) =>
  h(
    "ui5-product-switch",
    {},
    ...PRODUCTS.slice(0, count).map((p, i) =>
      h("ui5-product-switch-item", {
        icon: p.icon,
        "title-text": p.title,
        "subtitle-text": "subtitle" in p ? p.subtitle : undefined,
        selected: i === selected,
      })
    )
  )
)
