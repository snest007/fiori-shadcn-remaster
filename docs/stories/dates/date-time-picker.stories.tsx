import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { DateTimePicker, type DateTimePickerProps } from "@/components/ui/date-time-picker"
import { Label } from "@/components/ui/label"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"

const base = fioriMeta({ name: "date-time-picker", component: DateTimePicker })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: S2DocsPage } },
  args: { value: "Mar 12, 2024, 3:25:40 PM", valueState: "none", disabled: false, readOnly: false, required: false, open: false, "aria-label": "Meeting", onValueChange: fn(), onInput: fn(), onOpenChange: fn(), onValueStateChange: fn() },
  argTypes: {
    ...base.argTypes,
    value: { control: "text" }, defaultValue: { control: false }, formatPattern: { control: "text" }, locale: { control: "text" }, placeholder: { control: "text" },
    valueState: { control: "select", options: ["none", "negative", "critical", "positive", "information"] }, valueStateMessage: { control: "text" },
    disabled: { control: "boolean" }, readOnly: { control: "boolean" }, required: { control: "boolean" }, open: { control: "boolean" }, defaultOpen: { control: false },
    cancelLabel: { control: "text" }, openIconLabel: { control: "text" }, closeIconLabel: { control: "text" }, pickerLabel: { control: "text" }, phoneHeaderText: { control: "text" },
    calendarLabels: { control: false }, specialDates: { control: false }, hideWeekNumbers: { control: "boolean" }, firstDayOfWeek: { control: "select", options: [0, 1, 2, 3, 4, 5, 6] }, minDate: { control: false }, maxDate: { control: false }, clockLabels: { control: false }, submitLabel: { control: "text" }, dateLabel: { control: "text" }, timeLabel: { control: "text" },
    wrapperClassName: { table: { disable: true } },
    onValueChange: { control: false }, onInput: { control: false }, onOpenChange: { control: false }, onValueStateChange: { control: false },
  },
  render: function ControlledPicker(args: DateTimePickerProps) {
    const [, updateArgs] = useArgs<DateTimePickerProps>()
    return <DateTimePicker {...args} onValueChange={(value, ...dates) => { args.onValueChange?.(value, ...dates); updateArgs({ value }) }} onOpenChange={(open) => { args.onOpenChange?.(open); updateArgs({ open }) }} />
  },
} satisfies Meta<typeof DateTimePicker>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Closed: Story = {}
export const Empty: Story = { args: { value: "" } }
export const None: Story = { args: { valueState: "none" } }
export const Negative: Story = { args: { valueState: "negative" } }
export const Critical: Story = { args: { valueState: "critical" } }
export const Positive: Story = { args: { valueState: "positive" } }
export const Information: Story = { args: { valueState: "information" } }
export const Disabled: Story = { args: { disabled: true } }
export const ReadOnly: Story = { args: { readOnly: true } }
export const Required: Story = { args: { required: true } }
export const InvalidText: Story = { args: { value: "Invalid entry" } }
export const Open: Story = { args: { open: true }, parameters: { docs: { story: { inline: false, height: "560px" } } } }
export const OpenNegative: Story = { args: { open: true, valueState: "negative" }, parameters: { docs: { story: { inline: false, height: "600px" } } } }
export const CustomTexts: Story = { args: { openIconLabel: "Choose a delivery slot", closeIconLabel: "Close delivery selection", pickerLabel: "Delivery selection", valueStateMessage: "Choose an available delivery slot.", calendarLabels: { nextMonth: "Next delivery month", previousMonth: "Previous delivery month" }, submitLabel: "Use this time", cancelLabel: "Keep current time", clockLabels: { hours: "Start hour", minutes: "Start minute", seconds: "Start second", clockDial: "Start time dial" } } }
export const RTL: Story = { globals: { dir: "rtl" } }
export const LabelledField: Story = { render: function LabelledPicker() {
  const id = React.useId()
  const [value, setValue] = React.useState("Mar 12, 2024, 3:25:40 PM")
  return <div className="grid max-w-md gap-2"><Label htmlFor={id} required showColon>Meeting</Label><DateTimePicker id={id} required value={value} onValueChange={setValue} /></div>
} }
export const MinMax: Story = { args: { minDate: new Date(2024, 2, 8), maxDate: new Date(2024, 2, 25) } }
export const NoWeekNumbers: Story = { args: { hideWeekNumbers: true } }
export const TwentyFourHourFormat: Story = { args: { formatPattern: "yyyy-MM-dd HH:mm", value: "2024-03-12 15:25" } }

// Current defaults are read from registry/ui/date-time-picker.tsx and its shared calendar/input/clock primitives.
// UI5 keys come from the installed 2.28 English i18n defaults; non-identical wording is identified explicitly.
function S2DocsPage() {
  const textKeys = [
  {
    "prop": "openIconLabel",
    "text": "Open Picker",
    "key": "DATEPICKER_OPEN_ICON_TITLE (inherited DatePicker.openIconTitle)"
  },
  {
    "prop": "closeIconLabel",
    "text": "Close Picker",
    "key": "DATEPICKER_OPEN_ICON_TITLE_OPENED (inherited DatePicker.openIconTitle)"
  },
  {
    "prop": "cancelLabel",
    "text": "Cancel",
    "key": "TIMEPICKER_CANCEL_BUTTON, CALENDAR_FOOTER_CANCEL_BUTTON"
  },
  {
    "prop": "valueStateMessage.negative",
    "text": "Invalid entry",
    "key": "VALUE_STATE_ERROR"
  },
  {
    "prop": "valueStateMessage.critical",
    "text": "Warning issued",
    "key": "VALUE_STATE_WARNING"
  },
  {
    "prop": "valueStateMessage.positive",
    "text": "Entry successfully validated",
    "key": "VALUE_STATE_SUCCESS"
  },
  {
    "prop": "valueStateMessage.information",
    "text": "Informative entry",
    "key": "VALUE_STATE_INFORMATION"
  },
  {
    "prop": "calendarLabels.previousMonth",
    "text": "Previous Month",
    "key": "CALENDAR_HEADER_MONTH_PREVIOUS_BUTTON_TITLE"
  },
  {
    "prop": "calendarLabels.nextMonth",
    "text": "Next Month",
    "key": "CALENDAR_HEADER_MONTH_NEXT_BUTTON_TITLE"
  },
  {
    "prop": "calendarLabels.previousYear",
    "text": "Previous Year",
    "key": "CALENDAR_HEADER_YEAR_PREVIOUS_BUTTON_TITLE"
  },
  {
    "prop": "calendarLabels.nextYear",
    "text": "Next Year",
    "key": "CALENDAR_HEADER_YEAR_NEXT_BUTTON_TITLE"
  },
  {
    "prop": "calendarLabels.previousYearRange",
    "text": "Previous Year Range",
    "key": "CALENDAR_HEADER_YEAR_RANGE_PREVIOUS_BUTTON_TITLE"
  },
  {
    "prop": "calendarLabels.nextYearRange",
    "text": "Next Year Range",
    "key": "CALENDAR_HEADER_YEAR_RANGE_NEXT_BUTTON_TITLE"
  },
  {
    "prop": "calendarLabels.monthButton",
    "text": "Month {0}",
    "key": "CALENDAR_HEADER_MONTH_BUTTON"
  },
  {
    "prop": "calendarLabels.yearButton",
    "text": "Year {0}",
    "key": "CALENDAR_HEADER_YEAR_BUTTON"
  },
  {
    "prop": "calendarLabels.yearRangeButton",
    "text": "Year range from {0} to {1}",
    "key": "CALENDAR_HEADER_YEAR_RANGE_BUTTON"
  },
  {
    "prop": "calendarLabels.weekNumber",
    "text": "Week Number",
    "key": "DAY_PICKER_WEEK_NUMBER_TEXT"
  },
  {
    "prop": "calendarLabels.calendarWeek",
    "text": "Calendar Week {0}",
    "key": "DAY_PICKER_CALENDAR_WEEK"
  },
  {
    "prop": "calendarLabels.today",
    "text": "Today",
    "key": "CAL_LEGEND_TODAY_TEXT, DAY_PICKER_TODAY, DYNAMIC_DATE_RANGE_TODAY_TEXT"
  },
  {
    "prop": "calendarLabels.nonWorkingDay",
    "text": "Non-Working Day",
    "key": "CAL_LEGEND_NON_WORKING_DAY_TEXT, DAY_PICKER_NON_WORKING_DAY"
  },
  {
    "prop": "calendarLabels.rangeStart",
    "text": "{0} First date of range",
    "key": "DAY_PICKER_SELECTED_RANGE_START"
  },
  {
    "prop": "calendarLabels.rangeEnd",
    "text": "{0} Last date of range",
    "key": "DAY_PICKER_SELECTED_RANGE_END"
  },
  {
    "prop": "calendarLabels.rangeBetween",
    "text": "{0} in a selected range",
    "key": "DAY_PICKER_SELECTED_RANGE_BETWEEN"
  },
  {
    "prop": "calendarLabels.monthPicker",
    "text": "Month Picker",
    "key": "MONTH_PICKER_DESCRIPTION"
  },
  {
    "prop": "calendarLabels.yearPicker",
    "text": "Year Picker",
    "key": "YEAR_PICKER_DESCRIPTION"
  },
  {
    "prop": "calendarLabels.yearRangePicker",
    "text": "Year Range Picker",
    "key": "YEAR_RANGE_PICKER_DESCRIPTION"
  },
  {
    "prop": "clockLabels.hours",
    "text": "Hours",
    "key": "TIMEPICKER_HOURS_LABEL"
  },
  {
    "prop": "clockLabels.minutes",
    "text": "Minutes",
    "key": "TIMEPICKER_MINUTES_LABEL"
  },
  {
    "prop": "clockLabels.seconds",
    "text": "Seconds",
    "key": "TIMEPICKER_SECONDS_LABEL"
  },
  {
    "prop": "clockLabels.clockDial",
    "text": "Clock Dial",
    "key": "TIMEPICKER_CLOCK_DIAL_LABEL"
  },
  {
    "prop": "submitLabel",
    "text": "OK",
    "key": "TIMEPICKER_SUBMIT_BUTTON, CALENDAR_FOOTER_OK_BUTTON"
  },
  {
    "prop": "dateLabel",
    "text": "Date",
    "key": "DATETIME_PICKER_DATE_BUTTON"
  },
  {
    "prop": "timeLabel",
    "text": "Time",
    "key": "DATETIME_PICKER_TIME_BUTTON"
  },
  {
    "prop": "pickerLabel",
    "text": "Choose Date and Time",
    "key": "Application text; no identical UI5 2.28 default"
  },
  {
    "prop": "phoneHeaderText",
    "text": "Input aria-label prop; otherwise \"Enter date\"",
    "key": "DATEPICKER_MOBILE_HEADER_TITLE (phone fallback in PickerField)"
  }
]
  return <><DocsPage /><section aria-label="Localization text keys"><h2>Localization text keys</h2><p>Override these props to translate built-in labels and announcements. English defaults below describe the current component API. phoneHeaderText wins over the literal input aria-label prop. The phone title does not fall back to pickerLabel or aria-labelledby.</p><table><thead><tr><th>Text prop / key</th><th>UI5 reference key</th><th>English default</th></tr></thead><tbody>{textKeys.map((text) => <tr key={text.prop}><td><code>{text.prop}</code></td><td>{text.key}</td><td>{text.text}</td></tr>)}</tbody></table></section></>
}

export const German: Story = { globals: { locale: "de" }, args: { value: "", formatPattern: "medium" } }
export const Arabic: Story = { globals: { locale: "ar", dir: "rtl" }, args: { value: "", formatPattern: "medium" } }
