import "@ui5/webcomponents/dist/ToggleButton.js"
import "@ui5/webcomponents-icons/dist/edit.js"

import { defineUi5, h } from "../fixture-types"
import set from "./toggle-button"

const design = (v: string) => v[0].toUpperCase() + v.slice(1)

export default defineUi5(set, ({ variant, pressed, disabled, icon, text }) =>
  h("ui5-toggle-button", { design: design(variant), pressed, disabled, icon: icon ? "edit" : undefined }, ...(text ? [text] : []))
)
