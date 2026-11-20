import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { TimePicker, TimeSelectionClocks, type TimePickerProps } from "@/components/ui/time-picker"
import { Label } from "@/components/ui/label"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"

const base = fioriMeta({ name: "time-picker", component: TimePicker })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: S2DocsPage } },
  args: { value: "3:25:40 PM", valueState: "none", disabled: false, readOnly: false, required: false, open: false, "aria-label": "Start time", onValueChange: fn(), onInput: fn(), onOpenChange: fn(), onValueStateChange: fn() },
  argTypes: {
    ...base.argTypes,
    value: { control: "text" }, defaultValue: { control: false }, formatPattern: { control: "text" }, locale: { control: "text" }, placeholder: { control: "text" },
    valueState: { control: "select", options: ["none", "negative", "critical", "positive", "information"] }, valueStateMessage: { control: "text" },
    disabled: { control: "boolean" }, readOnly: { control: "boolean" }, required: { control: "boolean" }, open: { control: "boolean" }, defaultOpen: { control: false },
    cancelLabel: { control: "text" }, openIconLabel: { control: "text" }, closeIconLabel: { control: "text" }, pickerLabel: { control: "text" }, phoneHeaderText: { control: "text" },
    clockLabels: { control: false }, submitLabel: { control: "text" }, numericLabels: { control: false },
    wrapperClassName: { table: { disable: true } },
    onValueChange: { control: false }, onInput: { control: false }, onOpenChange: { control: false }, onValueStateChange: { control: false },
  },
  render: function ControlledPicker(args: TimePickerProps) {
    const [, updateArgs] = useArgs<TimePickerProps>()
    return <TimePicker {...args} onValueChange={(value, ...dates) => { args.onValueChange?.(value, ...dates); updateArgs({ value }) }} onOpenChange={(open) => { args.onOpenChange?.(open); updateArgs({ open }) }} />
  },
} satisfies Meta<typeof TimePicker>
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
export const OpenCritical: Story = { args: { open: true, valueState: "critical" }, parameters: { docs: { story: { inline: false, height: "600px" } } } }
export const OpenNegative: Story = { args: { open: true, valueState: "negative" }, parameters: { docs: { story: { inline: false, height: "600px" } } } }
export const CustomTexts: Story = { args: { openIconLabel: "Choose a delivery slot", closeIconLabel: "Close delivery selection", pickerLabel: "Delivery selection", valueStateMessage: "Choose an available delivery slot.", submitLabel: "Use this time", cancelLabel: "Keep current time", clockLabels: { hours: "Start hour", minutes: "Start minute", seconds: "Start second", clockDial: "Start time dial" } } }
export const RTL: Story = { globals: { dir: "rtl" } }
export const LabelledField: Story = { render: function LabelledPicker() {
  const id = React.useId()
  const [value, setValue] = React.useState("3:25:40 PM")
  return <div className="grid max-w-md gap-2"><Label htmlFor={id} required showColon>Start time</Label><TimePicker id={id} required value={value} onValueChange={setValue} /></div>
} }
export const TwentyFourHourFormat: Story = { args: { formatPattern: "HH:mm", value: "15:25" } }
export const HoursMinutes: Story = { args: { formatPattern: "h:mm a", value: "3:25 PM" } }

export const TwentyFourHourClocks: Story = { render: function EditableClocks() {
  const [time, setTime] = React.useState(new Date(2024, 2, 12, 15, 25))
  return <TimeSelectionClocks aria-label="Start time" formatPattern="HH:mm" value={time} onValueChange={setTime} />
} }

// Current defaults are read from registry/ui/time-picker.tsx and its shared calendar/input/clock primitives.
// UI5 keys come from the installed 2.28 English i18n defaults; non-identical wording is identified explicitly.
function S2DocsPage() {
  const textKeys = [
    { prop: "numericLabels.hours", key: "TIMEPICKER_INPUTS_ENTER_HOURS", text: "Please enter hours" },
    { prop: "numericLabels.minutes", key: "TIMEPICKER_INPUTS_ENTER_MINUTES", text: "Please enter minutes" },
    { prop: "numericLabels.seconds", key: "TIMEPICKER_INPUTS_ENTER_SECONDS", text: "Please enter seconds" },
    { prop: "numericLabels.period", key: "Application text; no matching UI5 2.28 key", text: "AM/PM" },

  {
    "prop": "openIconLabel",
    "text": "Open Picker",
    "key": "TIMEPICKER_OPEN_ICON_TITLE"
  },
  {
    "prop": "closeIconLabel",
    "text": "Close Picker",
    "key": "TIMEPICKER_OPEN_ICON_TITLE_OPENED"
  },
  {
    "prop": "cancelLabel",
    "text": "Cancel",
    "key": "TIMEPICKER_CANCEL_BUTTON"
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
    "key": "TIMEPICKER_SUBMIT_BUTTON"
  },
  {
    "prop": "pickerLabel",
    "text": "Choose Time",
    "key": "Application text; no identical UI5 2.28 default"
  },
  {
    "prop": "phoneHeaderText",
    "text": "Input aria-label prop; otherwise All Items",
    "key": "INPUT_SUGGESTIONS_TITLE (phone fallback in PickerField)"
  }
]
  return <><DocsPage /><section aria-label="Localization text keys"><h2>Localization text keys</h2><p>Override these props to translate built-in labels and announcements. English defaults below describe the current component API. phoneHeaderText wins over the literal input aria-label prop; the phone title does not fall back to pickerLabel or aria-labelledby.</p><table><thead><tr><th>Text prop / key</th><th>UI5 reference key</th><th>English default</th></tr></thead><tbody>{textKeys.map((text) => <tr key={text.prop}><td><code>{text.prop}</code></td><td>{text.key}</td><td>{text.text}</td></tr>)}</tbody></table></section></>
}

export const German: Story = { globals: { locale: "de" }, args: { value: "", formatPattern: "medium" } }
export const Arabic: Story = { globals: { locale: "ar", dir: "rtl" }, args: { value: "", formatPattern: "medium" } }
