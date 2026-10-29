import "@ui5/webcomponents/dist/Text.js"

import { defineUi5, h } from "../fixture-types"
import set, { LOREM } from "./text"

export default defineUi5(set, ({ maxLines }) => {
  const el = h("ui5-text", { "max-lines": maxLines != null ? String(maxLines) : undefined }, LOREM)
  el.style.width = "14rem"
  return el
})
