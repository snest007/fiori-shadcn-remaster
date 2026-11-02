// Registers the fiori package's theme parameters for every theme (ui5-main only loads the main package's).
import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/FlexibleColumnLayout.js"
import "@ui5/webcomponents-icons/dist/vertical-grip.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-left.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-right.js"

import { defineUi5, h } from "../fixture-types"
import set, { FCL_COLUMNS, FCL_CONTENT_STYLE, FCL_SIZES } from "./flexible-column-layout"

export default defineUi5(set, ({ layout, size, disableResizing }) => {
  const col = (slot: string, i: number) => {
    const el = h("div", { slot }, FCL_COLUMNS[i])
    el.style.cssText = FCL_CONTENT_STYLE
    return el
  }
  const fcl = h("ui5-flexible-column-layout", { layout, "disable-resizing": disableResizing }, col("startColumn", 0), col("midColumn", 1), col("endColumn", 2))
  fcl.style.width = `${FCL_SIZES[size].width}px`
  fcl.style.height = `${FCL_SIZES[size].height}px`
  return fcl
})
