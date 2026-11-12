import * as React from "react"

import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Label } from "@/components/ui/label"

import { defineDemo } from "./types"

function DateTimePickerDemo() {
  const [value, setValue] = React.useState("")
  return (
    <>
      <div id="date-time-picker-demo" className="grid max-w-md grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
        <Label htmlFor="date-time-picker-main" showColon>Meeting</Label>
        <DateTimePicker id="date-time-picker-main" value={value} onValueChange={(v) => setValue(v)} />
      </div>
      <p className="mt-4 text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        Choose a day and a time, then OK. Committed: <span data-testid="date-time-picker-value">{value || "—"}</span>
      </p>
    </>
  )
}

export default defineDemo({
  category: "Dates",
  docs: [
    {
      name: "date-time-picker",
      description: "Combined calendar and clock selection for a date and time.",
      props: [
        { name: "DateTimePicker.value", type: "string", description: "Controlled date-time text." },
        { name: "DateTimePicker.onValueChange", type: "(value: string, date: Date | null) => void", description: "Receive committed text and its parsed date-time." },
        { name: "DateTimePicker.formatPattern", type: "string", description: "Date-time pattern or named format style." },
        { name: "DateTimePicker.open", type: "boolean", description: "Controlled picker state." },
        { name: "DateTimePicker.locale", type: "string", description: "Formatting locale.", defaultValue: "en-US" },
      ],
    },
  ],
 title: "DateTimePicker", order: 64, Demo: DateTimePickerDemo })
