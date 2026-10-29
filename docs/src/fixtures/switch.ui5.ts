import "@ui5/webcomponents/dist/Switch.js"
import "@ui5/webcomponents-icons/dist/accept.js"
import "@ui5/webcomponents-icons/dist/decline.js"
import "@ui5/webcomponents-icons/dist/less.js"

import { defineUi5, h } from "../fixture-types"
import set from "./switch"

export default defineUi5(set, ({ checked, design, textOn, textOff, disabled, readOnly }) =>
  h("ui5-switch", {
    checked,
    design: design === "graphical" ? "Graphical" : undefined,
    "text-on": textOn,
    "text-off": textOff,
    disabled,
    readonly: readOnly,
    "accessible-name": "Switch",
  })
)
