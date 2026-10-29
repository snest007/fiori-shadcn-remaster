import "@ui5/webcomponents/dist/Dialog.js"
import "@ui5/webcomponents/dist/Bar.js"
import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents/dist/Text.js"
import "@ui5/webcomponents-icons/dist/error.js"
import "@ui5/webcomponents-icons/dist/alert.js"
import "@ui5/webcomponents-icons/dist/sys-enter-2.js"
import "@ui5/webcomponents-icons/dist/information.js"

import { defineUi5, h } from "../fixture-types"
import { body, showPopupInPlace } from "./ui5-popup-in-place"
import { ui5State } from "./ui5-helpers"
import set from "./dialog"

export default defineUi5(set, ({ state, footer }) => {
  const dialog = h(
    "ui5-dialog",
    { "header-text": "Dialog title", state: ui5State(state) },
    body("Dialog content text."),
    ...(footer
      ? [
          h(
            "ui5-bar",
            { slot: "footer", design: "Footer" },
            h("ui5-button", { slot: "endContent", design: "Emphasized" }, "Submit"),
            h("ui5-button", { slot: "endContent" }, "Cancel")
          ),
        ]
      : [])
  )
  return showPopupInPlace(dialog)
})
