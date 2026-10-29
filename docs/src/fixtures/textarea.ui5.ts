import "@ui5/webcomponents/dist/TextArea.js"

import { defineUi5, FIELD_WIDTH, h } from "../fixture-types"
import { ui5State } from "./ui5-helpers"
import set from "./textarea"

export default defineUi5(set, ({ value, placeholder, valueState, disabled, readOnly, rows, growing, growingMaxRows, maxLength, counter }) => {
  const el = h("ui5-textarea", {
    placeholder,
    "value-state": ui5State(valueState),
    disabled,
    readonly: readOnly,
    rows: rows?.toString(),
    growing,
    "growing-max-rows": growingMaxRows?.toString(),
    maxlength: maxLength?.toString(),
    "counter-mode": counter ? "Always" : undefined,
  })
  ;(el as any).value = value ?? ""
  el.style.width = FIELD_WIDTH
  return el
})
