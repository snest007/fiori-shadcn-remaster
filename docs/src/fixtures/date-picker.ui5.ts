import "@ui5/webcomponents/dist/DatePicker.js"
import "@ui5/webcomponents-icons/dist/appointment-2.js"

import { defineUi5, FIELD_WIDTH, h } from "../fixture-types"
import { ui5State } from "./ui5-helpers"
import set from "./date-picker"

export default defineUi5(set, ({ value, placeholder, valueState, disabled, readOnly }) => {
  const el = h("ui5-date-picker", {
    "format-pattern": "MMM d, y",
    value,
    placeholder,
    "value-state": ui5State(valueState),
    disabled,
    readonly: readOnly,
  })
  el.style.width = FIELD_WIDTH
  return el
})
