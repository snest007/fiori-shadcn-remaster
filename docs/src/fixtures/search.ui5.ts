// Registers the fiori package's theme parameters for every theme (ui5-main only loads the main package's).
import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/Search.js"
import "@ui5/webcomponents-fiori/dist/SearchScope.js"
import "@ui5/webcomponents-fiori/dist/SearchItem.js"
import "@ui5/webcomponents-fiori/dist/SearchItemGroup.js"
import "@ui5/webcomponents-icons/dist/history.js"
import "@ui5/webcomponents-fiori/dist/ShellBarSearch.js"
import "@ui5/webcomponents-icons/dist/search.js"
import "@ui5/webcomponents-icons/dist/decline.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-down.js"

import { defineUi5, h } from "../fixture-types"
import { showShadowPopupInPlace } from "./ui5-popup-in-place"
import set, { SEARCH_SCOPES, SEARCH_WIDTH } from "./search"

// Shows only ui5-search's popup: the host is a fixed-height flex box drawing the field, so the host's own surface is cleared.
function suggestions() {
  const el = h(
    "ui5-search",
    { value: "Lap", "no-typeahead": true },
    h("ui5-search-item", { text: "Laptop", icon: "history" }),
    h("ui5-search-item", { text: "Lap desk", description: "Office supplies" }),
    h("ui5-search-item-group", { "header-text": "Products" }, h("ui5-search-item", { text: "Laptop bag" }))
  )
  el.style.cssText = `width:${SEARCH_WIDTH};min-width:0;display:block;height:auto;background:none;box-shadow:none;border-radius:0`
  const frame = showShadowPopupInPlace(el, "#ui5-search-list")
  const tidy = () => {
    const root = el.shadowRoot
    const field = root?.querySelector<HTMLElement>(".ui5-search-field-busy-indicator")
    const popup = root?.querySelector<HTMLElement>("#ui5-search-list")
    if (!field || !popup) return requestAnimationFrame(tidy)
    field.style.display = "none"
    popup.style.marginTop = "0"
  }
  tidy()
  return frame
}

export default defineUi5(set, ({ value, placeholder, clear, scopes, collapsed, suggestions: withList }) => {
  if (withList) return suggestions()
  if (collapsed) return h("ui5-shellbar-search", { collapsed: true })
  const el = h(
    "ui5-search",
    { value, placeholder, "show-clear-icon": clear, "scope-value": scopes ? SEARCH_SCOPES[0].value : undefined },
    ...(scopes ? SEARCH_SCOPES.map((s) => h("ui5-search-scope", { slot: "scopes", value: s.value, text: s.text })) : [])
  )
  el.style.width = SEARCH_WIDTH
  return el
})
