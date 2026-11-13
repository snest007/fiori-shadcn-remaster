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
import set, { PHONE_OPTIONS, PHONE_LONG_OPTIONS, PHONE_CODE_VALUES } from "./popups"

export default defineUi5(set, ({ kind, valueState, tokens, longList }) => {
  const query = new URLSearchParams(location.search)
  const options = longList || query.has("long-list") ? PHONE_LONG_OPTIONS : PHONE_OPTIONS
  const itemValue = (text: string) => query.has("explicit-values") ? PHONE_CODE_VALUES[text] ?? text : text
  let selected = (query.get("controlled-start") === "pair" ? ["Germany", "Australia"] : Array.isArray(tokens) ? tokens : tokens ? ["Germany"] : []).map(itemValue)
  const controlled = kind === "multi-combobox" && !query.has("uncontrolled")
  const selectedOutput = h("output", { hidden: true }); selectedOutput.dataset.slot = "phone-selected"; selectedOutput.textContent = selected.join(",")
  const frame = h("div") as Ui5FixtureElement
  // Tests await UI5's supported render lifecycle after dynamic phone Lists
  // appear; this hook lives on the fixture wrapper, outside the native oracle.
  ;(frame as any).phoneRenderFinished = renderFinished
  frame.id = `${kind}-phone-demo`
  if (new URLSearchParams(location.search).has("nested-rtl")) frame.dir = "rtl"
  frame.style.cssText = "width:375px;height:667px;overflow:hidden"
  const attrs = { "accessible-name": "Country", "value-state": ui5State(valueState) }
  const field = kind === "responsive-popover" ? h("ui5-responsive-popover", { "header-text": "Country", ...(query.has("consumer-props") ? { "accessible-description": "Choose one country for delivery." } : {}) }, h("p", {}, "Choose a country."), h("ui5-button", {}, "Done"))
    : kind === "select" ? h("ui5-select", attrs, ...options.map((text) => h("ui5-option", { selected: text === "Germany", disabled: query.has("disabled-option") && text === "Australia" }, text)))
    : kind === "combobox" ? h("ui5-combobox", attrs, ...options.map((text) => h("ui5-cb-item", { text })))
    : kind === "multi-combobox" ? h("ui5-multi-combobox", { ...attrs, "show-select-all": true, "no-validation": new URLSearchParams(location.search).has("external-open") }, ...options.map((text) => h("ui5-mcb-item", { text, ...(controlled ? { value: itemValue(text) } : { selected: selected.includes(itemValue(text)) }) })))
    : h("ui5-multi-input", { ...attrs, "show-suggestions": true, ...(query.has("email") ? { type: "Email" } : {}) }, ...selected.map((text) => h("ui5-token", { slot: "tokens", text })), ...options.map((text) => h("ui5-suggestion-item", { text })))
  field.id = `${kind}-phone-field`
  field.style.width = "13.125rem"
  const setSelected = (next: string[]) => {
    selected = [...next]
    ;(field as any).selectedValues = [...selected]
    selectedOutput.textContent = selected.join(",")
  }
  if (controlled) {
    // MultiComboBox.js/_syncSelection owns the real value/selectedValues API.
    // React's omitted item.value uses text as its key, so give native items that
    // value too. Never write selected flags for the controlled comparison.
    setSelected(selected)
    field.addEventListener("selection-change", (event: any) => {
      setSelected(query.has("reject-selection") ? selected : event.detail.items.map((item: any) => item.value))
    })
  }
  if (query.has("controlled-echo")) {
    for (const [label, selection] of [["Reorder selection", () => [...selected].reverse()], ["Replace selection", () => [itemValue("Australia")]], ["Reset selection", () => []]] as const) {
      const button = h("ui5-button", {}, label)
      button.addEventListener("click", () => setSelected(selection()))
      frame.append(button)
    }
  }
  if (new URLSearchParams(location.search).has("external-open")) {
    const trigger = h("ui5-button", {}, "Open changed field")
    trigger.addEventListener("click", () => {
      ;(field as any).value = "Australia"
      if (controlled) setSelected([itemValue("Australia")])
      else field.querySelectorAll("ui5-mcb-item").forEach((item: any) => { item.selected = item.text === "Australia" })
      ;(field as any).open = true
    })
    frame.append(trigger)
  }
  frame.append(field, selectedOutput)
  const events: string[] = []
  const output = h("output", { hidden: true }); output.dataset.slot = "phone-events"; output.textContent = "[]"; frame.append(output)
  const record = (event: string) => { events.push(event); output.textContent = JSON.stringify(events) }
  field.addEventListener("change", () => record(`change:${(field as any).value}`))
  field.addEventListener("selection-change", (event: any) => record(`selection:${event.detail.items?.map((item: any) => controlled ? item.value : item.text).join(",") ?? event.detail.item?.text ?? ""}`))
  const openEvents: string[] = []
  const openOutput = h("output", { hidden: true }); openOutput.dataset.slot = "phone-open-events"; openOutput.textContent = "[]"; frame.append(openOutput)
  for (const event of ["open", "close"]) field.addEventListener(event, () => { openEvents.push(event); openOutput.textContent = JSON.stringify(openEvents) })
  field.addEventListener("suggestion-item-select", (event: any) => record(`suggestion:${event.detail.item.text}`))
  field.addEventListener("value-help-trigger", () => record("value-help"))
  field.addEventListener("token-delete", (event: any) => { event.detail.tokens.forEach((token: HTMLElement) => token.remove()); record(`delete:${event.detail.tokens.map((token: any) => token.text).join(",")}`) })
  frame.fixtureReady = (async () => {
    while (!frame.isConnected) await new Promise((resolve) => requestAnimationFrame(resolve))
    await renderFinished()
    // Theme loaders and Input.js/enableSuggestions can defer the phone template
    // past renderFinished(). Await the real Dialog before opening any field.
    const getDialog = () => kind === "responsive-popover" ? field.shadowRoot?.querySelector("ui5-dialog") : field.shadowRoot?.querySelector("ui5-responsive-popover")?.shadowRoot?.querySelector("ui5-dialog")
    const sourceReady = () => getDialog() && (kind !== "multi-input" || !!(field as any).Suggestions)
    for (let frame = 0; frame < 300 && !sourceReady(); frame++) {
      await new Promise((resolve) => requestAnimationFrame(resolve)); await renderFinished()
    }
    if (!sourceReady()) throw new Error(`${kind}: phone suggestions and dialog were not ready`)
    // MultiInput/Tokenizer ResizeHandler callbacks can settle after the outer
    // 375×667 cell stops changing. Await the rendered source geometry itself.
    await document.fonts.ready
    let previousGeometry = ""
    let stableGeometry = 0
    for (let frame = 0; frame < 300 && stableGeometry < 2; frame++) {
      await renderFinished()
      await new Promise((resolve) => requestAnimationFrame(resolve))
      const source = field as any
      const tokenizer = kind === "multi-input" ? source.tokenizer : undefined
      const input = source.nativeInput as HTMLElement | undefined
      const nodes = [field, ...(input ? [input] : []), ...(tokenizer ? [tokenizer] : [])]
      const geometry = nodes.map((node) => {
        const { x, y, width, height } = node.getBoundingClientRect()
        return `${x},${y},${width},${height}`
      }).join(";")
      const rendered = nodes.every((node: any) => !node.isUI5Element || (node._rendered && !node._changedState.length))
      stableGeometry = rendered && geometry === previousGeometry ? stableGeometry + 1 : 0
      previousGeometry = geometry
    }
    if (stableGeometry < 2) throw new Error(`${kind}: phone source geometry did not settle`)
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
