// Registers the fiori package's theme parameters for every theme (ui5-main only loads the main package's).
import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/UploadCollection.js"
import "@ui5/webcomponents-fiori/dist/UploadCollectionItem.js"
// The empty state's illustration; otherwise it is lazy-loaded, which can outlast the page's stability wait.
import "@ui5/webcomponents-fiori/dist/illustrations/Tent.js"
import "@ui5/webcomponents/dist/Icon.js"
import "@ui5/webcomponents-icons/dist/document.js"
import "@ui5/webcomponents-icons/dist/refresh.js"
import "@ui5/webcomponents-icons/dist/stop.js"
import "@ui5/webcomponents-icons/dist/decline.js"

import { defineUi5, h } from "../fixture-types"
import set from "./upload-collection"

const states = { complete: "Complete", uploading: "Uploading", ready: "Ready", error: "Error" }

export default defineUi5(set, ({ state = "ready", progress, clickable, empty, description }) => {
  const uc = h("ui5-upload-collection", { "accessible-name": "Attachments" })
  uc.style.width = "40rem"
  if (!empty) {
    const item = h(
      "ui5-upload-collection-item",
      {
        "file-name": "LaptopHT-1000.jpg",
        "file-name-clickable": clickable,
        "upload-state": states[state],
        progress: progress === undefined ? undefined : String(progress),
      },
      h("ui5-icon", { name: "document", slot: "thumbnail" }),
      ...(description ? [description] : [])
    )
    uc.append(item)
  }
  return uc
})
