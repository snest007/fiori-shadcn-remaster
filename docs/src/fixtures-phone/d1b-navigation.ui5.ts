import "@ui5/webcomponents/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents/dist/Menu.js"
import "@ui5/webcomponents/dist/MenuItem.js"
import "@ui5/webcomponents-fiori/dist/Search.js"
import "@ui5/webcomponents-fiori/dist/ShellBarSearch.js"
import "@ui5/webcomponents-fiori/dist/SearchItem.js"
import "@ui5/webcomponents-fiori/dist/SearchScope.js"
import "@ui5/webcomponents-icons/dist/search.js"
import "@ui5/webcomponents-icons/dist/decline.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-down.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-right.js"
import "@ui5/webcomponents-icons/dist/nav-back.js"
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import { defineUi5, h, type Ui5FixtureElement } from "../fixture-types"
import set, { SEARCH_OPTIONS } from "./d1b-navigation"
export default defineUi5(set, ({ kind, nested, scopes, longList }) => {
  const frame = h("div") as Ui5FixtureElement
  frame.id = `${kind}-phone-demo`; frame.style.cssText = "width:375px;height:667px;overflow:hidden"
  const field = kind === "menu" ? h("ui5-menu", { "header-text": "Actions" }, h("ui5-menu-item", { text: "New" }), h("ui5-menu-item", { text: "Unavailable", disabled: true }), h("ui5-menu-item", { text: "More" }, h("ui5-menu-item", { text: "Copy" }), h("ui5-menu-item", { text: "Paste" })), ...(longList ? Array.from({ length: 30 }, (_, index) => h("ui5-menu-item", { text: `Action ${index + 1}` })) : [])) as any
    : h(kind === "search" ? "ui5-search" : "ui5-shellbar-search", { value: "Notebook", "accessible-name": "Product Search", "show-clear-icon": true }, ...(scopes ? [h("ui5-search-scope", { slot: "scopes", value: "all", text: "All" }), h("ui5-search-scope", { slot: "scopes", value: "products", text: "Products" })] : []), ...SEARCH_OPTIONS.map((text) => h("ui5-search-item", { text }))) as any
  field.id = `${kind}-phone-field`
  if (kind === "menu") {
    const opener = h("ui5-button", {}, "Open Menu"); opener.id = "menu-phone-opener"; field.opener = opener
    opener.addEventListener("click", () => { field.open = true }); frame.append(opener)
  }
  frame.append(field)
  if (kind === "search" && new URLSearchParams(location.search).has("lifecycle")) {
    const unmount = h("ui5-button", { id: "search-phone-unmount" }, "Unmount first search")
    unmount.addEventListener("click", () => field.remove())
    const secondFrame = h("div", { id: "search-phone-second-demo" })
    const second = h("ui5-search", { "accessible-name": "Second Search", value: "Notebook" }, h("ui5-search-item", { text: "Notebook" })) as any
    secondFrame.append(second)
    const openSecond = h("ui5-button", { id: "search-phone-open-second" }, "Open second search")
    openSecond.addEventListener("click", () => { second.open = true })
    frame.append(unmount, openSecond, secondFrame)
  }
  const events: string[] = []
  const output = h("output", { hidden: true }); output.dataset.slot = "phone-events"; output.textContent = "[]"; frame.append(output)
  const record = (event: string) => { events.push(event); output.textContent = JSON.stringify(events) }
  field.addEventListener("input", () => record(`input:${field.value}`))
  field.addEventListener("search", () => record(`search:${field.value}`))
  field.addEventListener("scope-change", (event: any) => record(`scope:${event.detail.scope.value}`))
  field.addEventListener("item-click", (event: any) => record(event.detail.item.text))
  ;(frame as any).phoneRenderFinished = renderFinished
  frame.fixtureReady = (async () => {
    while (!frame.isConnected) await new Promise((resolve) => requestAnimationFrame(resolve))
    await renderFinished()
    const getDialog = () => field.shadowRoot?.querySelector("ui5-responsive-popover")?.shadowRoot?.querySelector("ui5-dialog")
    for (let iteration = 0; iteration < 300 && !getDialog(); iteration++) { await new Promise((resolve) => requestAnimationFrame(resolve)); await renderFinished() }
    if (!getDialog()) throw new Error(`${kind}: phone Dialog is unavailable`)
    if (!new URLSearchParams(location.search).has("interactive")) {
      field.open = true; await renderFinished(); await document.fonts.ready
      if (nested) { field.querySelector('ui5-menu-item[text="More"]').click(); await renderFinished(); await document.fonts.ready }
    }
  })()
  return frame
})
