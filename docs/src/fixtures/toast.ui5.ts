import "@ui5/webcomponents/dist/Toast.js"

import { defineUi5, h } from "../fixture-types"
import { placeInPlace } from "./ui5-popup-in-place"
import set from "./toast"

export default defineUi5(set, ({ text, width }) => {
  // Kept closed (an open ui5-toast starts its fade-out and lives in the top layer) and shown in place.
  const toast = h("ui5-toast", {}, text)
  placeInPlace(toast, "block")
  toast.style.width = width
  const frame = h("div", {}, toast)
  frame.style.padding = "0.75rem"
  return frame
})
