import "@ui5/webcomponents/dist/Token.js"
import "@ui5/webcomponents/dist/Tokenizer.js"
import "@ui5/webcomponents-icons/dist/decline.js"

import { defineUi5, h } from "../fixture-types"
import set from "./token"

export default defineUi5(set, ({ selected, readOnly, disabled }) =>
  h("ui5-tokenizer", { readonly: readOnly, disabled, "accessible-name": "Token" }, h("ui5-token", { text: "Andorra", selected }))
)
