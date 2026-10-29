import "@ui5/webcomponents/dist/Tag.js"
import "@ui5/webcomponents/dist/Icon.js"
import "@ui5/webcomponents-icons/dist/favorite.js"
import "@ui5/webcomponents-icons/dist/sys-help-2.js"
import "@ui5/webcomponents-icons/dist/sys-enter-2.js"
import "@ui5/webcomponents-icons/dist/error.js"
import "@ui5/webcomponents-icons/dist/alert.js"
import "@ui5/webcomponents-icons/dist/information.js"

import { defineUi5, h } from "../fixture-types"
import set from "./tag"

const design = (d: string) => (d === "set1" ? "Set1" : d === "set2" ? "Set2" : d[0].toUpperCase() + d.slice(1))

export default defineUi5(set, ({ design: d, scheme, hideStateIcon, icon, text, size, interactive, width, nowrap }) => {
  const el = h(
    "ui5-tag",
    {
      design: design(d),
      "color-scheme": scheme ? String(scheme) : undefined,
      "hide-state-icon": hideStateIcon,
      size,
      interactive,
      "wrapping-type": nowrap ? "None" : undefined,
    },
    ...(icon ? [h("ui5-icon", { name: "favorite", slot: "icon" })] : []),
    ...(text === null ? [] : [text ?? "Tag"])
  )
  if (width) el.style.width = width
  return el
})
