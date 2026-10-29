import "@ui5/webcomponents/dist/MultiInput.js"
import "@ui5/webcomponents/dist/Token.js"
import "@ui5/webcomponents-icons/dist/decline.js"
import "@ui5/webcomponents-icons/dist/value-help.js"

import { defineUi5, FIELD_WIDTH, h } from "../fixture-types"
import { ui5State } from "./ui5-helpers"
import set from "./multi-input"

export default defineUi5(set, ({ tokens = [], value, placeholder, valueHelp, valueState, disabled, readOnly, width = FIELD_WIDTH }) => {
  const el = h(
    "ui5-multi-input",
    {
      value,
      placeholder,
      "show-value-help-icon": valueHelp,
      "value-state": ui5State(valueState),
      disabled,
      readonly: readOnly,
      "accessible-name": "Countries",
    },
    ...tokens.map((t) => h("ui5-token", { slot: "tokens", text: t }))
  )
  el.style.width = width
  return el
})
