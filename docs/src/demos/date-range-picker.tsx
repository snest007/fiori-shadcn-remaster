import * as React from "react"

import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Label } from "@/components/ui/label"

import { defineDemo } from "./types"

function DateRangePickerDemo() {
  const [value, setValue] = React.useState("")
  return (
    <>
      <div id="date-range-picker-demo" className="grid max-w-md grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
        <Label htmlFor="date-range-picker-main" showColon>Travel dates</Label>
        <DateRangePicker id="date-range-picker-main" value={value} onValueChange={(v) => setValue(v)} />
      </div>
      <p className="mt-4 text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        Pick the first and the last day; the range previews while you hover. Committed:{" "}
        <span data-testid="date-range-picker-value">{value || "—"}</span>
      </p>
    </>
  )
}

export default defineDemo({ title: "DateRangePicker", order: 62, Demo: DateRangePickerDemo })
