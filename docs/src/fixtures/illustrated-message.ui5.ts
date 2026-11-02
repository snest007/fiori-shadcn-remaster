// Registers the fiori package's theme parameters for every theme (ui5-main only loads the main package's).
import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/IllustratedMessage.js"
import "@ui5/webcomponents-fiori/dist/illustrations/NoData.js"
import "@ui5/webcomponents-fiori/dist/illustrations/NoSearchResults.js"
import "@ui5/webcomponents-fiori/dist/illustrations/UnableToLoad.js"
import "@ui5/webcomponents-fiori/dist/illustrations/SuccessScreen.js"
import "@ui5/webcomponents-fiori/dist/illustrations/Tent.js"
import "@ui5/webcomponents-fiori/dist/illustrations/SuccessBalloon.js"
import "@ui5/webcomponents-fiori/dist/illustrations/tnt/Success.js"
import "@ui5/webcomponents/dist/Button.js"

import { defineUi5, h } from "../fixture-types"
import set from "./illustrated-message"

export default defineUi5(set, ({ name, design, width, title, subtitle, action }) => {
  const el = h(
    "ui5-illustrated-message",
    { name, design, "title-text": title, "subtitle-text": subtitle },
    ...(action ? [h("ui5-button", { design: "Emphasized" }, action)] : [])
  )
  el.style.width = width
  return el
})
