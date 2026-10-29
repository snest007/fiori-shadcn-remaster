import "@ui5/webcomponents/dist/MessageStrip.js"
import "@ui5/webcomponents/dist/Icon.js"
import "@ui5/webcomponents-icons/dist/favorite.js"

import { defineUi5, h } from "../fixture-types"
import set, { MS_LONG, MS_TEXT } from "./message-strip"

const design = (d: string) =>
  d === "color-set-1" ? "ColorSet1" : d === "color-set-2" ? "ColorSet2" : d[0].toUpperCase() + d.slice(1)

export default defineUi5(set, ({ design: d, scheme, hideIcon, hideClose, icon, long }) => {
  const el = h(
    "ui5-message-strip",
    { design: design(d), "color-scheme": scheme ? String(scheme) : undefined, "hide-icon": hideIcon, "hide-close-button": hideClose },
    ...(icon ? [h("ui5-icon", { name: "favorite", slot: "icon" })] : []),
    long ? MS_LONG : MS_TEXT
  )
  const wrap = h("div", {}, el)
  wrap.style.width = "20rem"
  return wrap
})
