import "@ui5/webcomponents/dist/Link.js"
import "@ui5/webcomponents-icons/dist/calendar.js"

import { defineUi5, h } from "../fixture-types"
import set from "./link"

const design = (d: string) => d[0].toUpperCase() + d.slice(1)

export default defineUi5(set, ({ design: d, disabled, text, width, nowrap, icon, large }) => {
  const el = h(
    "ui5-link",
    {
      href: "#",
      design: design(d),
      disabled,
      "wrapping-type": nowrap ? "None" : undefined,
      "interactive-area-size": large ? "Large" : undefined,
      icon: icon ? "calendar" : undefined,
    },
    text ?? "Link text"
  )
  if (width) el.style.width = width
  return el
})
