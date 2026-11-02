// Registers the fiori package's theme parameters for every theme (ui5-main only loads the main package's).
import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/HeroBanner.js"
import "@ui5/webcomponents/dist/Button.js"

import { defineUi5, h } from "../fixture-types"
import set from "./hero-banner"

export default defineUi5(set, ({ width = "48rem", start, end, actions, overlineText, columnsRatio, actionsPlacement, headerBlockPlacement }) => {
  const b = h(
    "ui5-hero-banner",
    {
      "header-text": "Welcome back, Ann",
      "overline-text": overlineText,
      "columns-ratio": columnsRatio ?? "FirstWider",
      "actions-placement": actionsPlacement ?? "TopEnd",
      "header-block-placement": headerBlockPlacement ?? "Top",
    },
    ...(start ? [h("div", {}, "Start content")] : []),
    ...(end ? [h("div", { slot: "endContent" }, "End content")] : []),
    ...(actions ? [h("ui5-button", { slot: "actions", design: "Transparent" }, "Customize")] : [])
  )
  b.style.width = width
  return b
})
