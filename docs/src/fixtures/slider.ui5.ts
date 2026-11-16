import "@ui5/webcomponents/dist/Slider.js"
import "@ui5/webcomponents/dist/RangeSlider.js"
import "@ui5/webcomponents-icons/dist/direction-arrows.js"

import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"

import { defineUi5, h } from "../fixture-types"
import set from "./slider"

const num = (n?: number) => (n === undefined ? undefined : String(n))

export default defineUi5(set, ({ range, value, min, max, step, showTickmarks, labelInterval, disabled, editableTooltip, tooltipFixture }) => {
  const common = { "editable-tooltip": editableTooltip, "show-tooltip": editableTooltip, min: num(min), max: num(max), step: num(step), "show-tickmarks": showTickmarks, "label-interval": num(labelInterval), disabled }
  const el = range
    ? h("ui5-range-slider", { ...common, "start-value": String(range[0]), "end-value": String(range[1]) })
    : h("ui5-slider", { ...common, value: num(value) })
  const box = h("div", {}, el)
  box.style.width = "20rem"
  if (tooltipFixture) box.style.paddingBlockStart = "6rem"
  const ready = async () => { await renderFinished() }
  ;(box as typeof box & { fixtureReady?: Promise<void> }).fixtureReady = ready()
  return box
})
