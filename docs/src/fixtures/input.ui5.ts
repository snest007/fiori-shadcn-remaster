import "@ui5/webcomponents/dist/Input.js"

import { defineUi5, FIELD_WIDTH, h } from "../fixture-types"
import { ui5State } from "./ui5-helpers"
import set from "./input"

export default defineUi5(set, ({ value, placeholder, valueState, disabled, readOnly }) => {
  const el = h("ui5-input", { value, placeholder, "value-state": ui5State(valueState), disabled, readonly: readOnly })
  el.style.width = FIELD_WIDTH
  return el
})
