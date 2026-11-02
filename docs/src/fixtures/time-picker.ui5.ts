import "@ui5/webcomponents/dist/TimePicker.js"
import "@ui5/webcomponents/dist/TimeSelectionClocks.js"
import "@ui5/webcomponents-icons/dist/time-entry-request.js"
import "@ui5/webcomponents-icons/dist/alert.js"

import { defineUi5, FIELD_WIDTH, h } from "../fixture-types"
import { ui5State } from "./ui5-helpers"
import set from "./time-picker"
import { showPickerPopoverInPlace } from "./ui5-picker-popover"

export default defineUi5(set, ({ value, valueState, disabled, readOnly, clocks, popover }) => {
  if (clocks) {
    const el = h("ui5-time-selection-clocks", { "format-pattern": clocks, value: "15:25" })
    // UI5 sets this before opening its popover so the first clock doesn't fade in.
    ;(el as HTMLElement & { _skipAnimation: boolean })._skipAnimation = true
    const frame = h("div")
    frame.style.cssText = "width:20rem;background:var(--sapGroup_ContentBackground)"
    frame.append(el)
    return frame
  }
  const el = h("ui5-time-picker", { "format-pattern": "h:mm:ss\u202fa", value, "value-state": ui5State(valueState), disabled, readonly: readOnly })
  if (popover) return showPickerPopoverInPlace(el)
  el.style.width = FIELD_WIDTH
  return el
})
