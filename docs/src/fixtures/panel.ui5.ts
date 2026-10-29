import "@ui5/webcomponents/dist/Panel.js"
import "@ui5/webcomponents/dist/Title.js"
import "@ui5/webcomponents/dist/Text.js"
import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-right.js"

import { defineUi5, h } from "../fixture-types"
import set, { PANEL_CONTENT, PANEL_HEADER, PANEL_LONG, PANEL_WIDTH } from "./panel"

export default defineUi5(set, ({ collapsed, fixed, custom, long }) => {
  const headerEl = custom
    ? (() => {
        const d = h("div", { slot: "header" }, h("ui5-title", { level: "H3", size: "H6" }, PANEL_HEADER), h("ui5-button", { design: "Transparent" }, "Edit"))
        d.style.cssText = "display:flex;width:100%;align-items:center;justify-content:space-between"
        return [d]
      })()
    : []
  const el = h(
    "ui5-panel",
    { "header-text": custom ? undefined : long ? PANEL_LONG : PANEL_HEADER, collapsed, fixed },
    ...headerEl,
    h("ui5-text", {}, PANEL_CONTENT)
  )
  el.style.width = PANEL_WIDTH
  // ui5-panel sets no font-size, so its content inherits the page's. Our docs body uses
  // --sapFontSize (as Fiori apps do); the bare UI5 page is at the browser default 16px.
  el.style.fontSize = "var(--sapFontSize)"
  return el
})
