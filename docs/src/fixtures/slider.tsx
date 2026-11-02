import { RangeSlider, Slider } from "@/components/ui/slider"

import { defineFixtures } from "../fixture-types"

type Props = {
  range?: [number, number]
  value?: number
  min?: number
  max?: number
  step?: number
  showTickmarks?: boolean
  labelInterval?: number
  disabled?: boolean
}

export default defineFixtures<Props>({
  name: "slider",
  cases: [
    { id: "slider-0", props: { value: 0 } },
    { id: "slider-40", props: { value: 40 } },
    { id: "slider-100", props: { value: 100 } },
    { id: "slider-tickmarks", props: { value: 3, min: 0, max: 10, showTickmarks: true } },
    { id: "slider-labels", props: { value: 6, min: 0, max: 10, showTickmarks: true, labelInterval: 2 } },
    { id: "slider-disabled", props: { value: 30, disabled: true } },
    { id: "slider-range", props: { range: [20, 70] } },
    { id: "slider-range-tickmarks", props: { range: [2, 6], min: 0, max: 10, showTickmarks: true, labelInterval: 5 } },
    { id: "slider-range-disabled", props: { range: [10, 50], disabled: true } },
  ],
  react: ({ range, value, ...p }) => (
    <div style={{ width: "20rem" }}>
      {range ? <RangeSlider value={range} aria-label="Range" {...p} /> : <Slider value={value} aria-label="Value" {...p} />}
    </div>
  ),
})
