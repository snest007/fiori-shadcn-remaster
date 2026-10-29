import "@ui5/webcomponents/dist/RadioButton.js"

import { defineUi5, h } from "../fixture-types"
import { ui5State } from "./ui5-helpers"
import set from "./radio-group"

export default defineUi5(set, ({ checked, text, disabled, readOnly, valueState }) =>
  h("ui5-radio-button", {
    checked,
    text,
    disabled,
    readonly: readOnly,
    "value-state": ui5State(valueState),
    "accessible-name": text ? undefined : "Radio",
  })
)
