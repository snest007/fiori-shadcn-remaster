import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/DynamicSideContent.js"
import "@ui5/webcomponents/dist/Text.js"
import "@ui5/webcomponents/dist/Title.js"

import { defineUi5, h } from "../fixture-types"
import set, { DSC_HEIGHT, DSC_MAIN, DSC_SIDE, MAIN_STYLE, SIDE_STYLE } from "./dynamic-side-content"

export default defineUi5(set, ({ width, position, equalSplit }) => {
  const main = h("div", {}, h("ui5-title", { level: "H3", size: "H5" }, DSC_MAIN))
  main.style.cssText = MAIN_STYLE
  const side = h("div", { slot: "sideContent" }, h("ui5-text", {}, DSC_SIDE))
  side.style.cssText = SIDE_STYLE
  const dsc = h("ui5-dynamic-side-content", { "side-content-position": position === "start" ? "Start" : undefined, "equal-split": equalSplit }, main, side)
  const wrap = h("div", {}, dsc)
  wrap.style.cssText = `width:${width};height:${DSC_HEIGHT};font-size:var(--sapFontSize)`
  return wrap
})
