import "@ui5/webcomponents/dist/FileUploader.js"
import "@ui5/webcomponents-icons/dist/browse-folder.js"
import "@ui5/webcomponents-icons/dist/decline.js"

import { defineUi5, h } from "../fixture-types"
import { ui5State } from "./ui5-helpers"
import set from "./file-uploader"

export default defineUi5(set, ({ multiple, placeholder, valueState, disabled }) =>
  h("ui5-file-uploader", { multiple, placeholder, "value-state": ui5State(valueState), disabled, "accessible-name": "Attachment" })
)
