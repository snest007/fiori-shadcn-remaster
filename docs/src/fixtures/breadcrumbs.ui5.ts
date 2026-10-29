import "@ui5/webcomponents/dist/Breadcrumbs.js"
import "@ui5/webcomponents/dist/BreadcrumbsItem.js"

import { defineUi5, h } from "../fixture-types"
import set, { BREADCRUMBS_WIDTH, trail } from "./breadcrumbs"

const pascal = (s: string) => s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("")

export default defineUi5(set, ({ separators, design, lastLink }) => {
  const el = h(
    "ui5-breadcrumbs",
    { separators: separators && pascal(separators).replace("Backslash", "BackSlash"), design: design && pascal(design) },
    ...trail.map((t, i) => h("ui5-breadcrumbs-item", { href: i < trail.length - 1 || lastLink ? "#" : undefined }, t))
  )
  el.style.width = BREADCRUMBS_WIDTH
  return el
})
