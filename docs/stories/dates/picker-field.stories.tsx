import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Calendar } from "@/components/ui/calendar"
import { PickerField, type PickerFieldProps } from "@/components/ui/picker-field"
import { appointment2 } from "@/lib/fiori-icons"
import { formatDate, parseDate, resolvePattern } from "@/lib/fiori-dates"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"

type Args = PickerFieldProps & { formatPattern?: string; locale?: string; minDate?: Date; maxDate?: Date }
const base = fioriMeta({ name: "picker-field", component: PickerField })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: S2DocsPage } },
  args: { value: "Mar 12, 2024", open: false, icon: appointment2, "aria-label": "Delivery date", pickerLabel: "Delivery calendar", roleDescription: "Date Input", disabled: false, readOnly: false, required: false, valueState: "none", onTextChange: fn(), onCommit: fn(), onOpenChange: fn(), onPickerKeyDown: fn() },
  argTypes: {
    ...base.argTypes,
    value: { control: "text" }, open: { control: "boolean" }, valueState: { control: "select", options: ["none", "negative", "critical", "positive", "information"] },
    valueStateMessage: { control: "text" }, disabled: { control: "boolean" }, readOnly: { control: "boolean" }, required: { control: "boolean" }, placeholder: { control: "text" },
    openIconLabel: { control: "text" }, closeIconLabel: { control: "text" }, pickerLabel: { control: "text" }, roleDescription: { control: "text" }, f4Closes: { control: "boolean" }, phoneHeaderText: { control: "text" }, cancelLabel: { control: "text" },
    locale: { control: "text", description: "Formatting locale for this application-owned calendar composition." },
    formatPattern: { control: "text", description: "Application format used by this composed calendar example; PickerField itself owns text only." }, minDate: { control: false }, maxDate: { control: false },
    icon: { control: false }, children: { control: false }, footer: { control: false }, phoneFooter: { control: false }, inputRef: { table: { disable: true } }, wrapperClassName: { table: { disable: true } }, popoverClassName: { table: { disable: true } },
    onTextChange: { control: false }, onCommit: { control: false }, onOpenChange: { control: false }, onPickerKeyDown: { control: false }, phoneInputFocus: { control: false }, phonePreventInitialFocus: { control: false },
  },
  render: function ComposedPickerField(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const { formatPattern = "medium", locale = navigator.language, minDate, maxDate, ...field } = args
    const pattern = resolvePattern(formatPattern, locale, "date")
    const selected = parseDate(args.value, pattern, locale, "date")
    return <PickerField {...field} onTextChange={(value) => { args.onTextChange?.(value); updateArgs({ value }) }} onOpenChange={(open) => { args.onOpenChange(open); updateArgs({ open }) }}>
      <Calendar aria-label="Delivery dates" locale={locale} autoFocus minDate={minDate} maxDate={maxDate} selectedDates={selected ? [selected] : []} defaultFocusedDate={selected ?? undefined} onSelectedDatesChange={(dates) => {
        const day = dates.at(-1)
        if (!day) return
        const value = formatDate(day, pattern, locale)
        args.onCommit?.(value)
        args.onOpenChange(false)
        updateArgs({ value, open: false })
      }} />
    </PickerField>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Closed: Story = {}
export const Empty: Story = { args: { value: "", placeholder: "Choose a delivery date" } }
export const None: Story = {}
export const Negative: Story = { args: { valueState: "negative" } }
export const Critical: Story = { args: { valueState: "critical" } }
export const Positive: Story = { args: { valueState: "positive" } }
export const Information: Story = { args: { valueState: "information" } }
export const Disabled: Story = { args: { disabled: true } }
export const ReadOnly: Story = { args: { readOnly: true } }
export const Required: Story = { args: { required: true } }
export const Open: Story = { args: { open: true }, parameters: { docs: { story: { inline: false, height: "560px" } } } }
export const OpenNegative: Story = { args: { open: true, valueState: "negative" }, parameters: { docs: { story: { inline: false, height: "600px" } } } }
export const MinMax: Story = { args: { minDate: new Date(2024, 2, 8), maxDate: new Date(2024, 2, 25) } }
export const NumericFormat: Story = { args: { formatPattern: "yyyy-MM-dd", value: "2024-03-12" } }
export const CustomTexts: Story = { args: { openIconLabel: "Choose shipment date", closeIconLabel: "Close shipment calendar", pickerLabel: "Shipment dates", phoneHeaderText: "Shipment calendar", cancelLabel: "Keep current date", valueState: "critical", valueStateMessage: "Delivery capacity is limited." } }
export const RTL: Story = { globals: { dir: "rtl" } }

// Current defaults are read from registry/ui/picker-field.tsx and its shared calendar/input/clock primitives.
// UI5 keys come from the installed 2.28 English i18n defaults; non-identical wording is identified explicitly.
function S2DocsPage() {
  const textKeys = [
  {
    "prop": "openIconLabel",
    "text": "Open Picker",
    "key": "DATEPICKER_OPEN_ICON_TITLE"
  },
  {
    "prop": "closeIconLabel",
    "text": "Close Picker",
    "key": "DATEPICKER_OPEN_ICON_TITLE_OPENED"
  },
  {
    "prop": "cancelLabel",
    "text": "Cancel",
    "key": "CALENDAR_FOOTER_CANCEL_BUTTON"
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
    "prop": "phoneHeaderText",
    "text": "Field accessible name (or pickerLabel)",
    "key": "Application text; no identical UI5 2.28 default"
  }
]
  return <><DocsPage /><section aria-label="Localization text keys"><h2>Localization text keys</h2><p>Override these props to translate built-in labels and announcements. English defaults below describe the current component API.</p><table><thead><tr><th>Text prop / key</th><th>UI5 reference key</th><th>English default</th></tr></thead><tbody>{textKeys.map((text) => <tr key={text.prop}><td><code>{text.prop}</code></td><td>{text.key}</td><td>{text.text}</td></tr>)}</tbody></table></section></>
}
