import "@ui5/webcomponents/dist/Select.js"
import "@ui5/webcomponents/dist/Option.js"
import "@ui5/webcomponents/dist/OptionGroup.js"

import { defineUi5, FIELD_WIDTH, h } from "../fixture-types"
import { ui5State } from "./ui5-helpers"
import set from "./select"

export default defineUi5(set, ({ options, groups, selected, valueState, disabled }) => {
  const el = h(
    "ui5-select",
    { "value-state": ui5State(valueState), disabled },
    ...options.map((o) => h("ui5-option", { selected: o === selected }, o)),
    ...(groups?.map(group => h("ui5-option-group", { "header-text": group.label }, ...group.options.map(option => h("ui5-option", { selected: option === selected }, option)))) ?? [])
  )
  el.style.width = FIELD_WIDTH
  return el
})
