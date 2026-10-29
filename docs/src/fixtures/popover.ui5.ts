import "@ui5/webcomponents/dist/Popover.js"
import "@ui5/webcomponents/dist/Bar.js"
import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents/dist/Text.js"

import { defineUi5, h } from "../fixture-types"
import { body, showPopupInPlace } from "./ui5-popup-in-place"
import set from "./popover"

export default defineUi5(set, ({ title, footer, arrow }) => {
  const popover = h(
    "ui5-popover",
    { "header-text": title ? "Popover title" : undefined, "hide-arrow": !arrow },
    body("Popover content text."),
    ...(footer
      ? [h("ui5-bar", { slot: "footer", design: "Footer" }, h("ui5-button", { slot: "endContent", design: "Emphasized" }, "OK"))]
      : [])
  )
  popover.style.width = "14rem"
  return showPopupInPlace(popover)
})
