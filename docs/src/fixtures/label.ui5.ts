import "@ui5/webcomponents/dist/Input.js"
import "@ui5/webcomponents/dist/Label.js"

import { defineUi5, h } from "../fixture-types"
import set from "./label"

export default defineUi5(set, ({ text, required, showColon, customHost }) => {
  const label = h("ui5-label", { required, "show-colon": showColon, for: customHost ? "label-custom-host-input" : undefined }, text)
  if (!customHost) return label
  const frame = h("div", {}, label, h("ui5-input", { id: "label-custom-host-input", required: true }))
  frame.style.cssText = "display:flex;flex-direction:column"
  return frame
})
