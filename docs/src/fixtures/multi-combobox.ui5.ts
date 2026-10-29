import "@ui5/webcomponents/dist/MultiComboBox.js"
import "@ui5/webcomponents/dist/MultiComboBoxItem.js"
import "@ui5/webcomponents-icons/dist/decline.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-down.js"

import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"

import { defineUi5, FIELD_WIDTH, h } from "../fixture-types"
import { ui5State } from "./ui5-helpers"
import { placeInPlace } from "./ui5-popup-in-place"
import set, { MCB_ITEMS } from "./multi-combobox"

export default defineUi5(set, ({ selected = [], placeholder, valueState, disabled, readOnly, width = FIELD_WIDTH, list, selectAll }) => {
  const el = h(
    "ui5-multi-combobox",
    {
      placeholder,
      "value-state": ui5State(valueState),
      disabled,
      readonly: readOnly,
      "accessible-name": "Countries",
      "show-select-all": selectAll,
    },
    ...MCB_ITEMS.map((c) => h("ui5-mcb-item", { text: c, selected: selected.includes(c) }))
  )
  if (!list) {
    el.style.width = width
    return el
  }
  // Only the (closed) list popover, displayed in place: the field's root is hidden and the host sized to it.
  const show = async (tries = 0): Promise<void> => {
    await renderFinished()
    const popover = el.shadowRoot?.querySelector<HTMLElement>("[ui5-responsive-popover]")
    const root = el.shadowRoot?.querySelector<HTMLElement>(".ui5-multi-combobox-root")
    if (!popover || !root) {
      if (tries > 100) throw new Error("ui5-multi-combobox: popover not found")
      await new Promise((r) => requestAnimationFrame(r))
      return show(tries + 1)
    }
    root.style.display = "none"
    placeInPlace(popover, "block")
    popover.style.width = "15rem"
  }
  show()
  el.style.cssText = "width:15rem;height:auto;margin:0;border:none;box-shadow:none;background:none;min-width:0"
  const frame = document.createElement("div")
  frame.style.cssText = "overflow:hidden;padding:0.75rem"
  frame.append(el)
  return frame
})
