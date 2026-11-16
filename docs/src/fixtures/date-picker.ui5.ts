import "@ui5/webcomponents/dist/DatePicker.js"
import "@ui5/webcomponents-icons/dist/appointment-2.js"
import "@ui5/webcomponents-icons/dist/error.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-left.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-right.js"

import { defineUi5, FIELD_WIDTH, h } from "../fixture-types"
import { ui5State } from "./ui5-helpers"
import set from "./date-picker"
import { showPickerPopoverInPlace } from "./ui5-picker-popover"

export default defineUi5(set, ({ value, placeholder, valueState, disabled, readOnly, popover, pattern }) => {
  const el = h("ui5-date-picker", {
    "format-pattern": pattern ?? "MMM d, y",
    "primary-calendar-type": "Gregorian",
    value,
    placeholder,
    "value-state": ui5State(valueState),
    disabled,
    readonly: readOnly,
  })
  if (popover) return showPickerPopoverInPlace(el)
  el.style.width = FIELD_WIDTH
  return el
})
