import "@ui5/webcomponents/dist/Form.js"
import "@ui5/webcomponents/dist/FormGroup.js"
import "@ui5/webcomponents/dist/FormItem.js"
import "@ui5/webcomponents/dist/Input.js"
import "@ui5/webcomponents/dist/Label.js"
import "@ui5/webcomponents/dist/Text.js"

import { defineUi5, h } from "../fixture-types"
import set, { formData } from "./form"

export default defineUi5(set, ({ width, layout, labelSpan, groups, edit, header, itemSpacing }) => {
  const item = ([label, value]: [string, string]) =>
    h(
      "ui5-form-item",
      {},
      h("ui5-label", { slot: "labelContent", "show-colon": true }, label),
      edit ? h("ui5-input", { value }) : h("ui5-text", {}, value)
    )
  const form = h(
    "ui5-form",
    {
      layout,
      "label-span": labelSpan,
      "item-spacing": itemSpacing === "large" ? "Large" : undefined,
      "accessible-mode": edit ? "Edit" : undefined,
      "header-text": header ? "Supplier" : undefined,
    },
    ...(groups
      ? formData.map((g) => h("ui5-form-group", { "header-text": g.group }, ...g.items.map(item)))
      : formData.flatMap((g) => g.items).map(item))
  )
  form.style.width = width
  return form
})
