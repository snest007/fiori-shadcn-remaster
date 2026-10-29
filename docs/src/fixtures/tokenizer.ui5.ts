import "@ui5/webcomponents/dist/Token.js"
import "@ui5/webcomponents/dist/Tokenizer.js"
import "@ui5/webcomponents-icons/dist/decline.js"

import { defineUi5, h } from "../fixture-types"
import set from "./tokenizer"

export default defineUi5(set, ({ tokens, width, selected = [], readOnly, disabled }) => {
  const el = h(
    "ui5-tokenizer",
    { readonly: readOnly, disabled, "accessible-name": "Countries" },
    ...tokens.map((t) => h("ui5-token", { text: t, selected: selected.includes(t) }))
  )
  if (width) el.style.width = width
  return el
})
