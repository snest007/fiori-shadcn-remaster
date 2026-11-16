import "@ui5/webcomponents/dist/Select.js"
import "@ui5/webcomponents/dist/Option.js"
import "@ui5/webcomponents/dist/OptionGroup.js"

import { defineUi5, FIELD_WIDTH, h } from "../fixture-types"
import { ui5State } from "./ui5-helpers"
import set from "./select"

export default defineUi5(set, ({ options, selected, valueState, disabled, groups, channel, rtl }) => {
  const targetId = `select-a11y-${channel}${rtl ? "-rtl" : ""}-description-target-ui5`
  const el = h(
    "ui5-select",
    { "value-state": ui5State(valueState), disabled,
      "accessible-name": channel === "name" ? "Country" : channel === "name-ref" ? undefined : "Select",
      "accessible-name-ref": channel === "name-ref" ? targetId : undefined,
      "accessible-description": channel === "description" ? "Choose an office location" : undefined,
      "accessible-description-ref": channel === "description-ref" ? targetId : undefined,
    },
    ...(groups ? groups.map((group, i) => h("ui5-option-group", { "header-text": `Region ${i + 1}` }, ...group.map((o) => h("ui5-option", { selected: o === selected }, o)))) : options.map((o) => h("ui5-option", { selected: o === selected }, o)))
  )
  el.style.width = FIELD_WIDTH
  return channel || rtl ? h("span", { dir: rtl ? "rtl" : undefined }, ...(channel ? [h("span", { hidden: true, id: targetId }, channel.startsWith("name") ? "Country" : "Choose an office location")] : []), el) : el
})
