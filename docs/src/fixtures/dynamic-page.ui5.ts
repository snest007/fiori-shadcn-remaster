import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/DynamicPage.js"
import "@ui5/webcomponents-fiori/dist/DynamicPageTitle.js"
import "@ui5/webcomponents-fiori/dist/DynamicPageHeader.js"
import "@ui5/webcomponents/dist/Bar.js"
import "@ui5/webcomponents/dist/Breadcrumbs.js"
import "@ui5/webcomponents/dist/BreadcrumbsItem.js"
import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents/dist/Label.js"
import "@ui5/webcomponents/dist/Title.js"
import "@ui5/webcomponents/dist/Toolbar.js"
import "@ui5/webcomponents/dist/ToolbarButton.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-up.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-down.js"
import "@ui5/webcomponents-icons/dist/pushpin-off.js"
import "@ui5/webcomponents-icons/dist/pushpin-on.js"

import { defineUi5, h } from "../fixture-types"
import set, { DP_HEIGHT, DP_WIDTH, dpContent } from "./dynamic-page"

const col = (...texts: string[]) => {
  const d = h("div", {}, ...texts.map((t) => h("ui5-label", {}, t)))
  d.style.cssText = "display:flex;flex-direction:column;gap:.25rem"
  return d
}

export default defineUi5(set, ({ snapped, footer, pinned, breadcrumbs, hidePin }) => {
  const title = h(
    "ui5-dynamic-page-title",
    { slot: "titleArea" },
    ...(breadcrumbs
      ? [h("ui5-breadcrumbs", { slot: "breadcrumbs" }, h("ui5-breadcrumbs-item", { href: "#" }, "Products"), h("ui5-breadcrumbs-item", {}, "Laptops"))]
      : []),
    h("ui5-title", { slot: "heading", level: "H2" }, "Laptop 15"),
    h("ui5-title", { slot: "snappedHeading", level: "H2" }, "Laptop 15 (snapped)"),
    h("ui5-label", { slot: "subheading" }, "PO-48865"),
    h("ui5-label", { slot: "snappedSubheading" }, "PO-48865"),
    h(
      "ui5-toolbar",
      { slot: "actionsBar", design: "Transparent" },
      h("ui5-toolbar-button", { text: "Edit", design: "Emphasized" }),
      h("ui5-toolbar-button", { text: "Delete", design: "Transparent" })
    )
  )
  const row = h("div", {}, col("Manufacturer: Robotech", "Factory: Orlando, FL"), col("Status", "Delivery in 12 days"))
  row.style.cssText = "display:flex;gap:2rem"
  const header = h("ui5-dynamic-page-header", { slot: "headerArea" }, row)
  const bar = h(
    "ui5-bar",
    { slot: "footerArea", design: "FloatingFooter" },
    h("ui5-button", { slot: "endContent", design: "Emphasized" }, "Save"),
    h("ui5-button", { slot: "endContent", design: "Transparent" }, "Cancel")
  )
  const page = h(
    "ui5-dynamic-page",
    { "header-snapped": snapped, "header-pinned": pinned, "hide-pin-button": hidePin, "show-footer": footer },
    title,
    header,
    h("ui5-label", {}, dpContent),
    bar
  )
  page.style.width = DP_WIDTH
  page.style.height = DP_HEIGHT
  return page
})
