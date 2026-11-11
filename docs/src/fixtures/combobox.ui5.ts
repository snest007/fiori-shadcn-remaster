import "@ui5/webcomponents/dist/ComboBox.js"
import "@ui5/webcomponents/dist/ComboBoxItem.js"
import "@ui5/webcomponents/dist/ComboBoxItemGroup.js"

import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-down.js"

import { defineUi5, FIELD_WIDTH, h } from "../fixture-types"
import { ui5State } from "./ui5-helpers"
import { placeInPlace } from "./ui5-popup-in-place"
import set, { COUNTRIES, CB_GROUPS } from "./combobox"

export default defineUi5(set, ({ value, placeholder, valueState, disabled, readOnly, list }) => {
  const el = h(
    "ui5-combobox",
    { value, placeholder, "value-state": ui5State(valueState), disabled, readonly: readOnly },
    ...(list ? CB_GROUPS.map((group) => h("ui5-cb-item-group", { "header-text": group.headerText }, ...group.items.map((c) => h("ui5-cb-item", { text: c })))) : COUNTRIES.map((c) => h("ui5-cb-item", { text: c })))
  )
  if (!list) {
    el.style.width = FIELD_WIDTH
    return el
  }
  // Display the closed popover in place, preserving UI5 list and group styling.
  const show = async (tries = 0): Promise<void> => {
    await renderFinished()
    const popover = el.shadowRoot?.querySelector<HTMLElement>("[ui5-responsive-popover]")
    const root = el.shadowRoot?.querySelector<HTMLElement>(".ui5-combobox-root")
    if (!popover || !root) {
      if (tries > 100) throw new Error("ui5-combobox: popover not found")
      await new Promise((r) => requestAnimationFrame(r))
      return show(tries + 1)
    }
    root.style.display = "none"
    // ComboBoxTemplate nests the picker in an inline BusyIndicator. Remove its
    // empty field line box, preserving every style on the picker surface.
    const busy = el.shadowRoot?.querySelector<HTMLElement>(".ui5-combobox-busy-indicator")
    if (busy) busy.style.display = "block"
    placeInPlace(popover, "block")
    popover.style.width = "15rem"
  }
  show()
  el.style.cssText = "display:block;width:15rem;height:auto;margin:0;border:none;box-shadow:none;background:none;min-width:0"
  const frame = document.createElement("div")
  frame.style.cssText = "overflow:hidden;padding:0.75rem"
  frame.append(el)
  return frame
})
