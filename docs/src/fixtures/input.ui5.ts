import "@ui5/webcomponents/dist/Input.js"

import { defineUi5, FIELD_WIDTH, h } from "../fixture-types"
import { ui5State } from "./ui5-helpers"
import set from "./input"

export default defineUi5(set, ({ value, placeholder, valueState, disabled, readOnly, a11y }) => {
  const prefix = `input-a11y-${a11y}`
  const el = h("ui5-input", {
    "accessible-name": a11y === "name" ? "Supplier identifier" : "Input",
    "accessible-name-ref": a11y === "name-ref" ? `${prefix}-label` : undefined,
    "accessible-description": a11y === "description" ? "Use the supplier number" : undefined,
    "accessible-description-ref": a11y === "description-ref" ? `${prefix}-description` : undefined,
    value, placeholder, "value-state": ui5State(valueState), disabled, readonly: readOnly })
  el.style.width = FIELD_WIDTH
  if (!a11y) return el
  return h("div", {}, h("span", { id: `${prefix}-label`, hidden: true }, "Supplier identifier"), h("span", { id: `${prefix}-description`, hidden: true }, "Use the supplier number"), el)
})
