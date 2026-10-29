import "@ui5/webcomponents/dist/ComboBox.js"
import "@ui5/webcomponents/dist/ComboBoxItem.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-down.js"

import { defineUi5, FIELD_WIDTH, h } from "../fixture-types"
import { ui5State } from "./ui5-helpers"
import set, { COUNTRIES } from "./combobox"

export default defineUi5(set, ({ value, placeholder, valueState, disabled, readOnly }) => {
  const el = h(
    "ui5-combobox",
    { value, placeholder, "value-state": ui5State(valueState), disabled, readonly: readOnly },
    ...COUNTRIES.map((c) => h("ui5-cb-item", { text: c }))
  )
  el.style.width = FIELD_WIDTH
  return el
})
