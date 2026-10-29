import "@ui5/webcomponents/dist/Title.js"

import { defineUi5, h } from "../fixture-types"
import set from "./title"

export default defineUi5(set, ({ level, size, text, nowrap, width }) => {
  const el = h("ui5-title", { level, size, "wrapping-type": nowrap ? "None" : undefined }, text ?? `Title ${size ?? "default"}`)
  if (width) el.style.width = width
  return el
})
