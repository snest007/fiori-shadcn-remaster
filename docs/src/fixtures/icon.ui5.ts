import "@ui5/webcomponents/dist/Icon.js"
import "@ui5/webcomponents-icons/dist/navigation-right-arrow.js"
import { defineUi5, h } from "../fixture-types"
import set from "./icon"

export default defineUi5(set, () => {
  const wrapper = h("span", { dir: "rtl" }, h("ui5-icon", { name: "navigation-right-arrow" }))
  wrapper.style.display = "inline-flex"
  return wrapper
})
