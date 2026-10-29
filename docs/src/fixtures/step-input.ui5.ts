import "@ui5/webcomponents/dist/StepInput.js"
import "@ui5/webcomponents-icons/dist/less.js"
import "@ui5/webcomponents-icons/dist/add.js"

import { defineUi5, FIELD_WIDTH, h } from "../fixture-types"
import { ui5State } from "./ui5-helpers"
import set from "./step-input"

export default defineUi5(set, ({ value, min, max, step, valuePrecision, valueState, disabled, readOnly }) => {
  const el = h("ui5-step-input", {
    value: value?.toString(),
    min: min?.toString(),
    max: max?.toString(),
    step: step?.toString(),
    "value-precision": valuePrecision?.toString(),
    "value-state": ui5State(valueState),
    disabled,
    readonly: readOnly,
  })
  el.style.width = FIELD_WIDTH
  return el
})
