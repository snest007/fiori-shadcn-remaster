import "@ui5/webcomponents/dist/Assets.js"
import "@ui5/webcomponents/dist/ResponsivePopover.js"
import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents-icons/dist/decline.js"
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import { defineUi5, h, type Ui5FixtureElement } from "../fixture-types"
import set from "./responsive-popover-host"

export default defineUi5(set, ({ rtl }) => {
  const frame = h("div", { id: "responsive-popover-host-phone-demo", dir: rtl ? "rtl" : undefined }) as Ui5FixtureElement
  frame.style.cssText = "width:375px;height:667px;overflow:hidden"
  const popup = h("ui5-responsive-popover", { "header-text": "Country", "accessible-name": "Country" }, h("p", {}, "Choose a country."), h("ui5-button", {}, "Done")) as any
  const opener = h("ui5-button", {}, "Open popup")
  opener.addEventListener("click", () => popup.open = true)
  frame.append(opener, popup)
  frame.fixtureReady = (async () => {
    await renderFinished()
    for (let attempt = 0; attempt < 300 && !popup.shadowRoot?.querySelector("ui5-dialog"); attempt++) {
      await new Promise((resolve) => requestAnimationFrame(resolve)); await renderFinished()
    }
    if (!popup.shadowRoot?.querySelector("ui5-dialog")) throw new Error("ResponsivePopover custom-host phone Dialog was not ready")
    // Like phone-popups.ui5.ts, this is the only popup on its isolated 375x667
    // fixture page. Open the real API; retain native positioning and focus.
    if (!new URLSearchParams(location.search).has("interactive")) { popup.open = true; await renderFinished() }
  })()
  return frame
})
