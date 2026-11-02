// Registers the fiori package's theme parameters for every theme (ui5-main only loads the main package's).
import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/Search.js"
import "@ui5/webcomponents-fiori/dist/SearchScope.js"
import "@ui5/webcomponents-fiori/dist/ShellBarSearch.js"
import "@ui5/webcomponents-icons/dist/search.js"
import "@ui5/webcomponents-icons/dist/decline.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-down.js"

import { defineUi5, h } from "../fixture-types"
import set, { SEARCH_SCOPES, SEARCH_WIDTH } from "./search"

export default defineUi5(set, ({ value, placeholder, clear, scopes, collapsed }) => {
  if (collapsed) return h("ui5-shellbar-search", { collapsed: true })
  const el = h(
    "ui5-search",
    { value, placeholder, "show-clear-icon": clear, "scope-value": scopes ? SEARCH_SCOPES[0].value : undefined },
    ...(scopes ? SEARCH_SCOPES.map((s) => h("ui5-search-scope", { slot: "scopes", value: s.value, text: s.text })) : [])
  )
  el.style.width = SEARCH_WIDTH
  return el
})
