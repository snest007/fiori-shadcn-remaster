import "@ui5/webcomponents/dist/Label.js"

import { defineUi5, h } from "../fixture-types"
import set from "./label"

export default defineUi5(set, ({ text, required, showColon }) => h("ui5-label", { required, "show-colon": showColon }, text))
