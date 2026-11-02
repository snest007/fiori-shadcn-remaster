import * as React from "react"

import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"

import { defineDemo } from "./types"

function DatePickerDemo() {
  const [value, setValue] = React.useState("Mar 12, 2024")
  const [date, setDate] = React.useState<Date | null>(new Date(2024, 2, 12))
  return (
    <>
      <div id="date-picker-demo" className="grid max-w-md grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
        <Label htmlFor="date-picker-main" showColon>Date</Label>
        <DatePicker
          id="date-picker-main"
          value={value}
          onValueChange={(v, d) => {
            setValue(v)
            setDate(d)
          }}
        />
        <Label htmlFor="date-picker-de" showColon>German, dd.MM.yyyy</Label>
        <DatePicker id="date-picker-de" locale="de-DE" formatPattern="dd.MM.yyyy" defaultValue="12.03.2024" />
        <Label htmlFor="date-picker-min-max" showColon>March 2024 only</Label>
        <DatePicker id="date-picker-min-max" minDate={new Date(2024, 2, 1)} maxDate={new Date(2024, 2, 31)} defaultValue="Mar 20, 2024" />
        <Label htmlFor="date-picker-month" showColon>Month (MMMM y)</Label>
        <DatePicker id="date-picker-month" formatPattern="MMMM y" defaultValue="March 2024" />
        <Label htmlFor="date-picker-disabled" showColon>Disabled</Label>
        <DatePicker id="date-picker-disabled" disabled defaultValue="Mar 12, 2024" />
      </div>
      <p className="mt-4 text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        Type a date in any common form ("3/12/24", "march 12 2024", "2024-03-12"); invalid text turns the field negative.
        F4 or Alt+↓ open the calendar; PageUp/PageDown change the day (Shift: month, Ctrl+Shift: year).
        Committed: <span data-testid="date-picker-value">{value || "—"}</span> ·{" "}
        <span data-testid="date-picker-date">{date ? date.toDateString() : "—"}</span>
      </p>
    </>
  )
}

export default defineDemo({ title: "DatePicker", order: 61, Demo: DatePickerDemo })
