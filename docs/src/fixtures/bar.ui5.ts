import "@ui5/webcomponents/dist/Bar.js"
import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents/dist/Label.js"
import "@ui5/webcomponents-icons/dist/nav-back.js"
import "@ui5/webcomponents-icons/dist/settings.js"

import { defineUi5, h } from "../fixture-types"
import set, { BAR_WIDTH } from "./bar"

const designs = { header: "Header", subheader: "Subheader", footer: "Footer", "floating-footer": "FloatingFooter" }

export default defineUi5(set, ({ design, start, title, end }) => {
  const children: Node[] = []
  if (start) children.push(h("ui5-button", { slot: "startContent", design: "Transparent", icon: "nav-back", "accessible-name": "Back" }))
  if (title) children.push(h("ui5-label", {}, title))
  end?.forEach((t, i) =>
    children.push(
      t === "settings"
        ? h("ui5-button", { slot: "endContent", design: "Transparent", icon: "settings", "accessible-name": "Settings" })
        : h("ui5-button", { slot: "endContent", design: i === 0 && end.length > 1 ? "Emphasized" : "Default" }, t)
    )
  )
  const el = h("ui5-bar", { design: designs[design] }, ...children)
  el.style.width = BAR_WIDTH
  return el
})
