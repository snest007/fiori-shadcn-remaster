import "@ui5/webcomponents/dist/BusyIndicator.js"

import { defineUi5, h } from "../fixture-types"
import set from "./busy-indicator"

export default defineUi5(set, ({ size, text, top, content }) => {
  const box = h("div")
  box.style.cssText = "width:12rem;height:5rem;background:var(--sapGroup_ContentBackground)"
  return h(
    "ui5-busy-indicator",
    { active: true, delay: "0", size, text, "text-placement": top ? "Top" : undefined },
    ...(content ? [box] : [])
  )
})
