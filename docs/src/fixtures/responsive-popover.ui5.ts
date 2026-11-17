import "@ui5/webcomponents/dist/ResponsivePopover.js"
import { defineUi5, h } from "../fixture-types"
import { body, showPopupInPlace } from "./ui5-popup-in-place"
import set from "./responsive-popover"

export default defineUi5(set, ({ rtl }) => {
  const popup = h("ui5-responsive-popover", { "accessible-name": "Custom responsive popup", "hide-arrow": true, dir: rtl ? "rtl" : undefined }, body("Responsive content"))
  popup.style.width = "14rem"
  return showPopupInPlace(popup)
})
