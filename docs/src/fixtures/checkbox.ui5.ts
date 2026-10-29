import "@ui5/webcomponents/dist/CheckBox.js"

import { defineUi5, h } from "../fixture-types"
import { ui5State } from "./ui5-helpers"
import set from "./checkbox"

export default defineUi5(set, ({ checked, text, disabled, readOnly, required, valueState }) =>
  h("ui5-checkbox", {
    checked: !!checked,
    indeterminate: checked === "indeterminate",
    text,
    disabled,
    readonly: readOnly,
    required,
    "value-state": ui5State(valueState),
    "accessible-name": text ? undefined : "Checkbox",
  })
)
