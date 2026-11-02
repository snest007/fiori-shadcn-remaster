import "@ui5/webcomponents/dist/DateRangePicker.js"
import "@ui5/webcomponents-icons/dist/appointment-2.js"

import { defineUi5, FIELD_WIDTH, h } from "../fixture-types"
import { ui5State } from "./ui5-helpers"
import set from "./date-range-picker"

export default defineUi5(set, ({ value, valueState, disabled, readOnly }) => {
  const el = h("ui5-daterange-picker", { "format-pattern": "MMM d, y", value, "value-state": ui5State(valueState), disabled, readonly: readOnly })
  el.style.width = FIELD_WIDTH
  return el
})
