import "@ui5/webcomponents/dist/DateTimePicker.js"
import "@ui5/webcomponents-icons/dist/date-time.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-left.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-right.js"

import { defineUi5, FIELD_WIDTH, h } from "../fixture-types"
import { ui5State } from "./ui5-helpers"
import set from "./date-time-picker"
import { showPickerPopoverInPlace } from "./ui5-picker-popover"

export default defineUi5(set, ({ value, valueState, disabled, readOnly, popover }) => {
  const el = h("ui5-datetime-picker", {
    "format-pattern": "MMM d, y, h:mm:ss a",
    value,
    "value-state": ui5State(valueState),
    disabled,
    readonly: readOnly,
  })
  // Closed, the picker's popover shows the value's day and time (opening would preview the same).
  if (popover) return showPickerPopoverInPlace(el)
  el.style.width = FIELD_WIDTH
  return el
})
