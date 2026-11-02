import "@ui5/webcomponents/dist/ExpandableText.js"

import { defineUi5, h } from "../fixture-types"
import set from "./expandable-text"

export default defineUi5(set, ({ text, maxCharacters, overflowMode, emptyIndicatorMode, expanded }) => {
  const t = h("ui5-expandable-text", {
    text,
    "max-characters": maxCharacters === undefined ? undefined : String(maxCharacters),
    "overflow-mode": overflowMode,
    "empty-indicator-mode": emptyIndicatorMode,
  })
  t.style.width = "24rem"
  // No public attribute for it; this is what clicking "Show More" sets.
  if (expanded) Object.assign(t, { _expanded: true })
  return t
})
