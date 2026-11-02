import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/Page.js"
import "@ui5/webcomponents/dist/Bar.js"
import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents/dist/Label.js"
import "@ui5/webcomponents/dist/Text.js"

import { defineUi5, h } from "../fixture-types"
import set, { PAGE_HEIGHT, PAGE_TEXT, PAGE_TITLE } from "./page"

const designs = { solid: "Solid", transparent: "Transparent", list: "List" }

export default defineUi5(set, ({ background, fixedFooter, footer, width = "26rem" }) => {
  const page = h(
    "ui5-page",
    { "background-design": background && designs[background], "fixed-footer": fixedFooter },
    h("ui5-bar", { slot: "header", design: "Header" }, h("ui5-label", {}, PAGE_TITLE)),
    h("ui5-text", {}, PAGE_TEXT),
    ...(footer
      ? [
          h(
            "ui5-bar",
            { slot: "footer", design: fixedFooter ? "Footer" : "FloatingFooter" },
            h("ui5-button", { slot: "endContent", design: "Emphasized" }, "Save"),
            h("ui5-button", { slot: "endContent" }, "Cancel")
          ),
        ]
      : [])
  )
  const wrap = h("div", {}, page)
  wrap.style.cssText = `width:${width};height:${PAGE_HEIGHT}`
  return wrap
})
