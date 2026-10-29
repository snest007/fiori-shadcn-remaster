import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents-icons/dist/add.js"
import "@ui5/webcomponents-icons/dist/edit.js"

import { defineUi5, h } from "../fixture-types"
import set from "./button"

const design = (v: string) => (v === "default" ? "Default" : v[0].toUpperCase() + v.slice(1))

export default defineUi5(set, ({ variant, text, icon, disabled }) =>
  h("ui5-button", { design: design(variant), icon, disabled }, ...(text ? [text] : []))
)
