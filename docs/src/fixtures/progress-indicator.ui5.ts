import "@ui5/webcomponents/dist/ProgressIndicator.js"
import "@ui5/webcomponents-icons/dist/status-negative.js"
import "@ui5/webcomponents-icons/dist/status-critical.js"
import "@ui5/webcomponents-icons/dist/status-positive.js"
import "@ui5/webcomponents-icons/dist/information.js"

import { defineUi5, h } from "../fixture-types"
import { ui5State } from "./ui5-helpers"
import set from "./progress-indicator"

export default defineUi5(set, ({ value, valueState, hideValue, displayValue }) => {
  const el = h("ui5-progress-indicator", {
    value: String(value),
    "value-state": ui5State(valueState),
    "hide-value": hideValue,
    "display-value": displayValue,
  })
  el.style.width = "15rem"
  return el
})
