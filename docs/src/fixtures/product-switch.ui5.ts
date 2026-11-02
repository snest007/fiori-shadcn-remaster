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

import { defineUi5, h, readPageOptions } from "../fixture-types"
import set, { PRODUCTS } from "./product-switch"

// In the HC themes UI5 2.28 declares --_ui5_product_switch_item_border twice: "1px solid" in the fiori package, which
// owns the component, and a stale "none" in the main package. Whichever bundle's promise resolves last wins, so the
// reference renders either one from load to load (measured: 9 of 30 loads with the border on a small page). Pinned to the
// owning package's value, which is what fiori.css generates, so that the comparison doesn't depend on that race.
const pinBorder = (item: HTMLElement) => {
  if (readPageOptions().theme.includes("_hc")) item.style.setProperty("--_ui5_product_switch_item_border", "1px solid var(--sapField_BorderColor)")
  return item
}

export default defineUi5(set, ({ count, selected }) =>
  h(
    "ui5-product-switch",
    {},
    ...PRODUCTS.slice(0, count).map((p, i) =>
      pinBorder(
        h("ui5-product-switch-item", {
          icon: p.icon,
          "title-text": p.title,
          "subtitle-text": "subtitle" in p ? p.subtitle : undefined,
          selected: i === selected,
        })
      )
    )
  )
)
