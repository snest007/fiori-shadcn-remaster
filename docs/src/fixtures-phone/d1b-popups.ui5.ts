import "@ui5/webcomponents/dist/Assets.js"
import "@ui5/webcomponents/dist/DatePicker.js"
import "@ui5/webcomponents/dist/DateRangePicker.js"
import "@ui5/webcomponents/dist/TimePicker.js"
import "@ui5/webcomponents/dist/DateTimePicker.js"
import "@ui5/webcomponents-icons/dist/appointment-2.js"
import "@ui5/webcomponents-icons/dist/time-entry-request.js"
import "@ui5/webcomponents-icons/dist/date-time.js"
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import { defineUi5, h, type Ui5FixtureElement } from "../fixture-types"
import { ui5State } from "../fixtures/ui5-helpers"
import set, { PHONE_DATE, PHONE_RANGE, PHONE_TIME, PHONE_DATETIME, PHONE_EXTERNAL_DATETIME, phoneConsumerValue } from "./d1b-popups"
export default defineUi5(set, ({ kind, valueState, timeView, noLabel }) => {
  const frame = h("div") as Ui5FixtureElement
  const query = new URLSearchParams(location.search)
  frame.dataset.consumer = query.get("consumer") ?? "echo"; frame.dataset.numeric = query.get("numeric") ?? "12"
  frame.id = `${kind}-phone-demo`; frame.style.cssText = "width:375px;height:667px;overflow:hidden"
  const tags = { "date-picker": "ui5-date-picker", "date-range-picker": "ui5-daterange-picker", "time-picker": "ui5-time-picker", "date-time-picker": "ui5-datetime-picker" }
  const value = kind === "time-picker" ? query.get("numeric") === "24" ? "10:15:30" : query.get("period") === "PM" ? "10:15:30 PM" : PHONE_TIME : kind === "date-time-picker" ? query.has("datetime-minutes") ? "Nov 13, 2026, 9:20 AM" : PHONE_DATETIME : kind === "date-range-picker" ? PHONE_RANGE : PHONE_DATE
  const pattern = kind === "time-picker" ? query.get("numeric") === "24" ? "HH:mm:ss" : "h:mm:ss a" : kind === "date-time-picker" ? query.has("datetime-minutes") ? "MMM d, y, h:mm a" : "MMM d, y, h:mm:ss a" : "MMM d, y"
  const field = h(tags[kind], { "format-pattern": pattern, "accessible-name": noLabel ? undefined : "Appointment", "value-state": ui5State(valueState), value }) as any
  field.id = `${kind}-phone-field`; field.style.width = "15rem"; frame.append(field)
  const events: string[] = []
  const output = h("output", { hidden: true }); output.dataset.slot = "phone-events"; output.textContent = "[]"; frame.append(output)
  // A real consumer accepts or rejects proposals through the public value setter.
  let proposals = 0
  field.addEventListener("value-changed", () => { const next = field.value; events.push(`value:${next}`); output.textContent = JSON.stringify(events); field.value = phoneConsumerValue(next, value, query.get("consumer"), proposals++) })
  if (query.has("external-reset")) { const reset = h("button", { id: `${kind}-phone-external-reset` }, "Replace external value"); reset.addEventListener("click", () => { field.value = PHONE_EXTERNAL_DATETIME }); frame.append(reset) }
  const queryOutput = h("output", { hidden: true }); queryOutput.dataset.slot = "phone-query"; queryOutput.textContent = query.toString(); frame.append(queryOutput)
  if (kind === "date-range-picker") field.addEventListener("change", () => { events.push(`change:${field.value}`); output.textContent = JSON.stringify(events) })
  ;(frame as any).phoneRenderFinished = renderFinished
  frame.fixtureReady = (async () => {
    while (!frame.isConnected) await new Promise((resolve) => requestAnimationFrame(resolve))
    await renderFinished()
    const getDialog = () => field.shadowRoot?.querySelector("ui5-responsive-popover")?.shadowRoot?.querySelector("ui5-dialog")
    for (let iteration = 0; iteration < 300 && !getDialog(); iteration++) { await new Promise((resolve) => requestAnimationFrame(resolve)); await renderFinished() }
    if (!getDialog()) throw new Error(`${kind}: phone Dialog is unavailable`)
    if (!new URLSearchParams(location.search).has("interactive")) {
      field.open = true
      await renderFinished(); await document.fonts.ready
      if (timeView) {
        const toggle = field.shadowRoot?.querySelector('ui5-segmented-button')
        const item = toggle?.querySelector('ui5-segmented-button-item[data-ui5-key="Time"]')
        if (!item) throw new Error("DateTimePicker: native Time toggle unavailable")
        item.click(); await renderFinished(); await document.fonts.ready
      }
    }
  })()
  return frame
})
