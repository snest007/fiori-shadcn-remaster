import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/Wizard.js"
import "@ui5/webcomponents-fiori/dist/WizardStep.js"
import "@ui5/webcomponents/dist/Text.js"
import "@ui5/webcomponents-icons/dist/product.js"
import "@ui5/webcomponents-icons/dist/hint.js"
import "@ui5/webcomponents-icons/dist/activate.js"
import "@ui5/webcomponents-icons/dist/accept.js"

import { defineUi5, h } from "../fixture-types"
import set, { ICON_IDS, STEP_CONTENT_STYLE, WIZ_HEIGHT, stepText } from "./wizard"

export default defineUi5(set, ({ steps, selected, width = "48rem" }) => {
  const wiz = h(
    "ui5-wizard",
    {},
    ...steps.map((s, i) => {
      const t = h("ui5-text", {}, stepText(i))
      t.style.cssText = STEP_CONTENT_STYLE
      return h(
        "ui5-wizard-step",
        {
          "title-text": s.title,
          "subtitle-text": s.subtitle,
          icon: s.icon && ICON_IDS[s.icon],
          disabled: s.disabled,
          branching: s.branching,
          selected: i === selected,
        },
        t
      )
    })
  )
  const wrap = h("div", {}, wiz)
  wrap.style.cssText = `width:${width};height:${WIZ_HEIGHT};font-size:var(--sapFontSize)`
  return wrap
})
