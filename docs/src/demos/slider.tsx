import * as React from "react"

import { Label } from "@/components/ui/label"
import { RangeSlider, Slider } from "@/components/ui/slider"

import { defineDemo } from "./types"

function SliderDemo() {
  const [value, setValue] = React.useState(20)
  const [committed, setCommitted] = React.useState(20)
  const [range, setRange] = React.useState<[number, number]>([20, 60])
  return (
    <div className="grid max-w-xl gap-4">
      <div>
        <Label>Volume (0–100)</Label>
        <Slider id="slider-demo" value={value} onValueChange={setValue} onValueCommit={setCommitted} showTooltip aria-label="Volume" />
        <span className="text-(--sapContent_LabelColor)">
          Value <span id="slider-demo-value">{value}</span>, committed <span id="slider-demo-committed">{committed}</span>
        </span>
      </div>
      <div>
        <Label>Rating (0–10, tickmarks)</Label>
        <Slider id="slider-demo-ticks" min={0} max={10} defaultValue={4} showTickmarks labelInterval={2} aria-label="Rating" />
      </div>
      <div>
        <Label>Price range</Label>
        <RangeSlider id="slider-demo-range" value={range} onValueChange={setRange} showTooltip aria-label="Price" />
        <span id="slider-demo-range-value" className="text-(--sapContent_LabelColor)">{range.join(" – ")}</span>
      </div>
    </div>
  )
}

export default defineDemo({
  category: "Forms",
  docs: [
    {
      name: "slider",
      description: "Single values and ranges on a horizontal numeric scale.",
      props: [
        { name: "Slider.value", type: "number", description: "Controlled single value." },
        { name: "RangeSlider.value", type: "[number, number]", description: "Controlled start and end values." },
        { name: "Slider.min / Slider.max", type: "number", description: "Scale bounds.", defaultValue: "0 / 100" },
        { name: "Slider.step", type: "number", description: "Step interval.", defaultValue: "1" },
        { name: "Slider.onValueChange", type: "(value: number) => void", description: "Receive every interaction change." },
        { name: "Slider.onValueCommit", type: "(value: number) => void", description: "Receive the changed value when an interaction ends." },
      ],
    },
  ],
 title: "Slider, RangeSlider", order: 62, Demo: SliderDemo })
