import "@ui5/webcomponents/dist/Assets.js"
import "@ui5/webcomponents/dist/Select.js"
import "@ui5/webcomponents/dist/Option.js"
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import { defineUi5, h, type Ui5FixtureElement } from "../fixture-types"
import set from "./select-a11y"

export default defineUi5(set, ({ channel, rtl }) => {
  const frame = h("div", { id: "select-a11y-phone-demo", dir: rtl ? "rtl" : undefined }) as Ui5FixtureElement
  frame.style.cssText = "width:375px;height:667px;overflow:hidden"
  const label = h(channel === "label" ? "label" : "span", { id: "select-a11y-phone-name", hidden: channel !== "label", for: channel === "label" ? "select-a11y-phone-field" : undefined }, "Shipping country")
  const field = h("ui5-select", { id: "select-a11y-phone-field", "accessible-name": channel === "name" ? "Shipping country" : channel === "name-ref" ? "Ignored direct name" : undefined, "accessible-name-ref": channel === "name-ref" ? "select-a11y-phone-name" : undefined },
    ...["Argentina", "Australia", "Germany"].map((text) => h("ui5-option", { value: text, disabled: text === "Australia", selected: text === "Germany" }, text))) as any
  const update = h("button", { id: "select-a11y-phone-update-name" }, "Update field name")
  update.addEventListener("click", () => { label.textContent = "Billing country"; if (channel === "name") field.accessibleName = "Billing country" })
  const output = h("output", { hidden: true, "data-slot": "select-a11y-phone-events" }, "[]")
  const events: string[] = []
  field.addEventListener("change", () => { events.push(`change:${field.value}`); output.textContent = JSON.stringify(events) })
  frame.append(label, update, field, output)
  frame.fixtureReady = (async () => {
    await renderFinished()
    for (let frame = 0; frame < 300 && !field.shadowRoot?.querySelector("ui5-responsive-popover")?.shadowRoot?.querySelector("ui5-dialog"); frame++) {
      await new Promise((resolve) => requestAnimationFrame(resolve)); await renderFinished()
    }
    if (!field.shadowRoot?.querySelector("ui5-responsive-popover")?.shadowRoot?.querySelector("ui5-dialog")) throw new Error("Select accessibility phone dialog was not ready")
    if (!new URLSearchParams(location.search).has("interactive")) { field._toggleRespPopover(); await renderFinished() }
  })()
  return frame
})
