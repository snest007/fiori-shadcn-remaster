import { Calendar, CalendarLegend, CalendarLegendItem, type CalendarPicker, type CalendarSelectionMode, type SpecialDate } from "@/components/ui/calendar"

import { defineFixtures } from "../fixture-types"

export type CalendarFixture = {
  /** yyyy-MM-dd */
  dates?: string[]
  mode?: CalendarSelectionMode
  min?: string
  max?: string
  hideWeekNumbers?: boolean
  picker?: CalendarPicker
  special?: boolean
}

/** yyyy-MM-dd -> local Date */
export const d = (s: string) => {
  const [y, m, day] = s.split("-").map(Number)
  return new Date(y, m - 1, day)
}

export const SPECIAL: { value: string; type: SpecialDate["type"] }[] = [
  { value: "2024-03-04", type: "Type01" },
  { value: "2024-03-13", type: "Type05" },
  { value: "2024-03-20", type: "NonWorking" },
  { value: "2024-03-23", type: "Working" },
]

// Today marker: every dated case shows March 2024, far from the real today, so neither side marks a
// day as today. "calendar-today" has no selection: both sides show the current month (the same system
// clock) with today marked, so the marker itself is compared too.
export default defineFixtures<CalendarFixture>({
  name: "calendar",
  a11yDiff: {
    "calendar-min-max": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/4",
        "/ui5/ax/0",
        "/ui5/ax/0/children/4"
      ],
      "reason": "React/DOM difference in calendar: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order. Documented UI5 bug: CalendarHeaderTemplate.js:32–33 emits the i18n-defaults.js:257–258 shortcut \"Shift + F4\", invalid ARIA shortcut grammar; this exact year/year-range node alone is corrected to \"Shift+F4\" under strict runtime checks.",
      "calendarHeaderBug": {
        "shortcutAX": "/ax/2"
      }
    },
    "calendar-month-picker": {
      "ignore": [
        "/ours/ax/0",
        "/ui5/ax/0"
      ],
      "reason": "React/DOM difference in calendar: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order. Documented UI5 bug: CalendarHeaderTemplate.js:32–33 emits the i18n-defaults.js:257–258 shortcut \"Shift + F4\", invalid ARIA shortcut grammar; this exact year/year-range node alone is corrected to \"Shift+F4\" under strict runtime checks.",
      "calendarHeaderBug": {
        "shortcutAX": "/ax/1"
      }
    },
    "calendar-multiple": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/4",
        "/ui5/ax/0",
        "/ui5/ax/0/children/4"
      ],
      "reason": "React/DOM difference in calendar: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order. Documented UI5 bug: CalendarHeaderTemplate.js:32–33 emits the i18n-defaults.js:257–258 shortcut \"Shift + F4\", invalid ARIA shortcut grammar; this exact year/year-range node alone is corrected to \"Shift+F4\" under strict runtime checks.",
      "calendarHeaderBug": {
        "shortcutAX": "/ax/2"
      }
    },
    "calendar-no-week-numbers": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/4",
        "/ui5/ax/0",
        "/ui5/ax/0/children/4"
      ],
      "reason": "React/DOM difference in calendar: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order. Documented UI5 bug: CalendarHeaderTemplate.js:32–33 emits the i18n-defaults.js:257–258 shortcut \"Shift + F4\", invalid ARIA shortcut grammar; this exact year/year-range node alone is corrected to \"Shift+F4\" under strict runtime checks.",
      "calendarHeaderBug": {
        "shortcutAX": "/ax/2"
      }
    },
    "calendar-range": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/4",
        "/ui5/ax/0",
        "/ui5/ax/0/children/4"
      ],
      "reason": "React/DOM difference in calendar: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order. Documented UI5 bug: CalendarHeaderTemplate.js:32–33 emits the i18n-defaults.js:257–258 shortcut \"Shift + F4\", invalid ARIA shortcut grammar; this exact year/year-range node alone is corrected to \"Shift+F4\" under strict runtime checks.",
      "calendarHeaderBug": {
        "shortcutAX": "/ax/2"
      }
    },
    "calendar-single": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/4",
        "/ui5/ax/0",
        "/ui5/ax/0/children/4"
      ],
      "reason": "React/DOM difference in calendar: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order. Documented UI5 bug: CalendarHeaderTemplate.js:32–33 emits the i18n-defaults.js:257–258 shortcut \"Shift + F4\", invalid ARIA shortcut grammar; this exact year/year-range node alone is corrected to \"Shift+F4\" under strict runtime checks.",
      "calendarHeaderBug": {
        "shortcutAX": "/ax/2"
      }
    },
    "calendar-special": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/4",
        "/ours/ax/0/children/4/children/0/children/2/children/2/children/1",
        "/ours/ax/0/children/4/children/0/children/3/children/4/children/1",
        "/ours/ax/0/children/4/children/0/children/4/children/4/children/1",
        "/ours/ax/0/children/4/children/0/children/4/children/7/children/1",
        "/ui5/ax/0",
        "/ui5/ax/0/children/4",
        "/ui5/ax/0/children/4/children/0/children/2/children/2/children/1",
        "/ui5/ax/0/children/4/children/0/children/3/children/4/children/1",
        "/ui5/ax/0/children/4/children/0/children/4/children/4/children/1",
        "/ui5/ax/0/children/4/children/0/children/4/children/7/children/1",
        "/ui5/ax/1"
      ],
      "reason": "React/DOM difference in calendar: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order. Documented UI5 bug: CalendarHeaderTemplate.js:32–33 emits the i18n-defaults.js:257–258 shortcut \"Shift + F4\", invalid ARIA shortcut grammar; this exact year/year-range node alone is corrected to \"Shift+F4\" under strict runtime checks.",
      "calendarHeaderBug": {
        "shortcutAX": "/ax/2"
      }
    },
    "calendar-today": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/4",
        "/ui5/ax/0",
        "/ui5/ax/0/children/4"
      ],
      "reason": "React/DOM difference in calendar: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order. Documented UI5 bug: CalendarHeaderTemplate.js:32–33 emits the i18n-defaults.js:257–258 shortcut \"Shift + F4\", invalid ARIA shortcut grammar; this exact year/year-range node alone is corrected to \"Shift+F4\" under strict runtime checks.",
      "calendarHeaderBug": {
        "shortcutAX": "/ax/2"
      }
    },
    "calendar-year-picker": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/1/children/0",
        "/ours/ax/0/children/1/children/1",
        "/ui5/ax/0"
      ],
      "reason": "React/DOM difference in calendar: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order. Documented UI5 bug: CalendarHeaderTemplate.js:32–33 emits the i18n-defaults.js:257–258 shortcut \"Shift + F4\", invalid ARIA shortcut grammar; this exact year/year-range node alone is corrected to \"Shift+F4\" under strict runtime checks. S0 mandated name correction: CalendarTemplate.js delegates to CalendarHeaderTemplate.js:33, whose purpose-only aria-label omits visible \"2015 - 2034\". Keep visible range plus the unchanged purpose via valid aria-labelledby, exact hidden purpose text and unchanged description; strict guards reject every other name/channel/descendant change.",
      "calendarHeaderBug": {
        "shortcutAX": "/ax/1",
        "yearRange": {
          "ax": "/ax/1",
          "snapshot": "/snapshot/1",
          "from": 2015,
          "to": 2034
        }
      }
    }
  },
  cases: [
    { id: "calendar-single", props: { dates: ["2024-03-12"] } },
    { id: "calendar-today", props: {} },
    { id: "calendar-range", props: { mode: "range", dates: ["2024-03-05", "2024-03-14"] } },
    { id: "calendar-multiple", props: { mode: "multiple", dates: ["2024-03-05", "2024-03-06", "2024-03-21"] } },
    { id: "calendar-min-max", props: { dates: ["2024-03-12"], min: "2024-03-08", max: "2024-03-25" } },
    { id: "calendar-no-week-numbers", props: { dates: ["2024-03-12"], hideWeekNumbers: true } },
    { id: "calendar-special", props: { dates: ["2024-03-12"], special: true } },
    { id: "calendar-month-picker", props: { dates: ["2024-03-12"], picker: "month" } },
    { id: "calendar-year-picker", props: { dates: ["2024-03-12"], picker: "year" } },
  ],
  react: ({ dates = [], mode = "single", min, max, hideWeekNumbers, picker, special }) => (
    <Calendar
      selectionMode={mode}
      defaultSelectedDates={dates.map(d)}
      minDate={min ? d(min) : undefined}
      maxDate={max ? d(max) : undefined}
      hideWeekNumbers={hideWeekNumbers}
      initialPicker={picker}
      specialDates={special ? SPECIAL.map((s) => ({ date: d(s.value), type: s.type })) : undefined}
      legend={
        special ? (
          <CalendarLegend>
            <CalendarLegendItem type="Type01" text="Holiday" />
            <CalendarLegendItem type="Type05" text="Training" />
          </CalendarLegend>
        ) : undefined
      }
    />
  ),
})
