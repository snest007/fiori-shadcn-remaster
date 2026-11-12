import "@ui5/webcomponents/dist/Assets.js"
import "@ui5/webcomponents/dist/Select.js"
import "@ui5/webcomponents/dist/Option.js"
import "@ui5/webcomponents/dist/ComboBox.js"
import "@ui5/webcomponents/dist/ComboBoxItem.js"
import "@ui5/webcomponents/dist/MultiComboBox.js"
import "@ui5/webcomponents/dist/MultiComboBoxItem.js"
import "@ui5/webcomponents/dist/MultiInput.js"
import "@ui5/webcomponents/dist/SuggestionItem.js"
import "@ui5/webcomponents/dist/Token.js"
import "@ui5/webcomponents/dist/ResponsivePopover.js"
import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents-icons/dist/decline.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-down.js"
import "@ui5/webcomponents-icons/dist/multiselect-all.js"
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import { defineUi5, h, type Ui5FixtureElement } from "../fixture-types"
import { ui5State } from "../fixtures/ui5-helpers"
import set, { PHONE_OPTIONS, PHONE_LONG_OPTIONS } from "./popups"

export default defineUi5(set, ({ kind, valueState, tokens, longList }) => {
  const options = longList ? PHONE_LONG_OPTIONS : PHONE_OPTIONS
  const selected = Array.isArray(tokens) ? tokens : tokens ? ["Germany"] : []
  const frame = h("div") as Ui5FixtureElement
  frame.id = `${kind}-phone-demo`
  if (new URLSearchParams(location.search).has("nested-rtl")) frame.dir = "rtl"
  frame.style.cssText = "width:375px;height:667px;overflow:hidden"
  const attrs = { "accessible-name": "Country", "value-state": ui5State(valueState) }
  const field = kind === "responsive-popover" ? h("ui5-responsive-popover", { "header-text": "Country" }, h("p", {}, "Choose a country."), h("ui5-button", {}, "Done"))
    : kind === "select" ? h("ui5-select", attrs, ...options.map((text) => h("ui5-option", { selected: text === "Germany" }, text)))
    : kind === "combobox" ? h("ui5-combobox", attrs, ...options.map((text) => h("ui5-cb-item", { text })))
    : kind === "multi-combobox" ? h("ui5-multi-combobox", { ...attrs, "show-select-all": true, "no-validation": new URLSearchParams(location.search).has("external-open") }, ...options.map((text) => h("ui5-mcb-item", { text, selected: selected.includes(text) })))
    : h("ui5-multi-input", { ...attrs, "show-suggestions": true }, ...selected.map((text) => h("ui5-token", { slot: "tokens", text })), ...options.map((text) => h("ui5-suggestion-item", { text })))
  field.id = `${kind}-phone-field`
  field.style.width = "13.125rem"
  if (new URLSearchParams(location.search).has("external-open")) {
    const trigger = h("ui5-button", {}, "Open changed field")
    trigger.addEventListener("click", () => {
      ;(field as any).value = "Australia"
      field.querySelectorAll("ui5-mcb-item").forEach((item: any) => { item.selected = item.text === "Australia" })
      ;(field as any).open = true
    })
    frame.append(trigger)
  }
  frame.append(field)
  const events: string[] = []
  const output = h("output", { hidden: true }); output.dataset.slot = "phone-events"; output.textContent = "[]"; frame.append(output)
  const record = (event: string) => { events.push(event); output.textContent = JSON.stringify(events) }
  field.addEventListener("change", () => record(`change:${(field as any).value}`))
  field.addEventListener("selection-change", (event: any) => record(`selection:${event.detail.items?.map((item: any) => item.text).join(",") ?? event.detail.item?.text ?? ""}`))
  field.addEventListener("suggestion-item-select", (event: any) => record(`suggestion:${event.detail.item.text}`))
  field.addEventListener("token-delete", (event: any) => { event.detail.tokens.forEach((token: HTMLElement) => token.remove()); record(`delete:${event.detail.tokens.map((token: any) => token.text).join(",")}`) })
  frame.fixtureReady = (async () => {
    while (!frame.isConnected) await new Promise((resolve) => requestAnimationFrame(resolve))
    await renderFinished()
    // Theme loaders and Input.js/enableSuggestions can defer the phone template
    // past renderFinished(). Await the real Dialog before opening any field.
    const getDialog = () => kind === "responsive-popover" ? field.shadowRoot?.querySelector("ui5-dialog") : field.shadowRoot?.querySelector("ui5-responsive-popover")?.shadowRoot?.querySelector("ui5-dialog")
    for (let frame = 0; frame < 300 && !getDialog(); frame++) {
      await new Promise((resolve) => requestAnimationFrame(resolve)); await renderFinished()
    }
    if (!getDialog()) throw new Error(`${kind}: phone dialog was not rendered`)
    if (!new URLSearchParams(location.search).has("interactive")) {
      if (kind === "select") (field as any)._toggleRespPopover()
      else (field as any).open = true
      await renderFinished()
      // Each phone fixture is the sole surface on its isolated page. It is opened
      // by its real API in the actual 375×667 viewport, with no position/style port.
      const dialog = getDialog()
      if (!dialog) throw new Error(`${kind}: phone dialog was not rendered`)
      await renderFinished()
    }
  })()
  return frame
})
