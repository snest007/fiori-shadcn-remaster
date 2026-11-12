import * as React from "react"

import { Calendar, CalendarLegend, CalendarLegendItem, type CalendarSelectionMode } from "@/components/ui/calendar"
import { SegmentedButton, SegmentedButtonItem } from "@/components/ui/segmented-button"

import { defineDemo } from "./types"

const today = new Date()
const at = (offset: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset)

function CalendarDemo() {
  const [mode, setMode] = React.useState<CalendarSelectionMode>("single")
  const [dates, setDates] = React.useState<Date[]>([])
  return (
    <div id="calendar-demo" className="flex flex-wrap items-start gap-6">
      <Calendar
        key={mode}
        id="calendar-main"
        aria-label="Calendar"
        selectionMode={mode}
        selectedDates={dates}
        onSelectedDatesChange={setDates}
        minDate={at(-400)}
        maxDate={at(400)}
        specialDates={[
          { date: at(3), type: "Type01" },
          { date: at(8), type: "Type05" },
          { date: at(10), type: "NonWorking" },
        ]}
        legend={
          <CalendarLegend>
            <CalendarLegendItem type="Type01" text="Holiday" />
            <CalendarLegendItem type="Type05" text="Training" />
          </CalendarLegend>
        }
      />
      <div className="grid gap-3">
        <SegmentedButton
          id="calendar-mode"
          aria-label="Selection mode"
          value={mode}
          onValueChange={(v) => {
            setMode(v as CalendarSelectionMode)
            setDates([])
          }}
        >
          <SegmentedButtonItem value="single">Single</SegmentedButtonItem>
          <SegmentedButtonItem value="multiple">Multiple</SegmentedButtonItem>
          <SegmentedButtonItem value="range">Range</SegmentedButtonItem>
        </SegmentedButton>
        <p className="max-w-xs text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
          Arrows move by day, PageUp/PageDown by month, Shift+PageUp/Down by year, Home/End to the week's ends. F4 shows months,
          Shift+F4 years (twice: year ranges). Enter or Space selects. Gregorian calendar; names and the first day of the week
          come from Intl.
        </p>
        <p className="text-(length:--sapFontSmallSize)">
          Selected: <span data-testid="calendar-selected">{dates.map((d) => d.toDateString()).join(", ") || "—"}</span>
        </p>
      </div>
    </div>
  )
}

export default defineDemo({
  category: "Dates",
  docs: [
    {
      name: "calendar",
      description: "Gregorian date selection with day, month and year pickers.",
      props: [
        { name: "Calendar.selectionMode", type: "single | multiple | range", description: "Choose individual days or a start/end range.", defaultValue: "single" },
        { name: "Calendar.selectedDates", type: "Date[]", description: "Controlled selected days." },
        { name: "Calendar.onSelectedDatesChange", type: "(dates: Date[]) => void", description: "Receive selected days." },
        { name: "Calendar.minDate", type: "Date", description: "Earliest focusable and selectable day." },
        { name: "Calendar.maxDate", type: "Date", description: "Latest focusable and selectable day." },
        { name: "Calendar.locale", type: "string", description: "Locale for names, week start and weekend.", defaultValue: "en-US" },
      ],
    },
  ],
 title: "Calendar", order: 60, Demo: CalendarDemo })
