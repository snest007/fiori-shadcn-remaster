import * as React from "react"

import { Label } from "@/components/ui/label"
import { TimePicker } from "@/components/ui/time-picker"

import { defineDemo } from "./types"

function TimePickerDemo() {
  const [value, setValue] = React.useState("9:30:00 AM")
  return (
    <>
      <div id="time-picker-demo" className="grid max-w-md grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
        <Label htmlFor="time-picker-main" showColon>Start</Label>
        <TimePicker id="time-picker-main" value={value} onValueChange={(v) => setValue(v)} />
        <Label htmlFor="time-picker-24h" showColon>24 hours (HH:mm)</Label>
        <TimePicker id="time-picker-24h" formatPattern="HH:mm" defaultValue="14:45" />
      </div>
      <p className="mt-4 text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        F4 opens the clocks: drag or click on the dial, ↑/↓ change the active clock, Space or ":" moves on, digits type a value,
        A / P switch AM / PM, Enter submits. Committed: <span data-testid="time-picker-value">{value || "—"}</span>
      </p>
    </>
  )
}

export default defineDemo({
  category: "Dates",
  docs: [
    {
      name: "time-picker",
      description: "Typed times with a format-aware clock popup.",
      props: [
        { name: "TimePicker.value", type: "string", description: "Controlled formatted time." },
        { name: "TimePicker.onValueChange", type: "(value: string, date: Date | null) => void", description: "Receive committed text and parsed time." },
        { name: "TimePicker.formatPattern", type: "string", description: "Time pattern or named format style." },
        { name: "TimePicker.open", type: "boolean", description: "Controlled clock popup state." },
        { name: "TimePicker.submitLabel", type: "string", description: "Confirmation action text.", defaultValue: "OK" },
      ],
    },
  ],
 title: "TimePicker", order: 63, Demo: TimePickerDemo })
