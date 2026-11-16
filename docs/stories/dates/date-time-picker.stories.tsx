import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { DateTimePicker, type DateTimePickerProps } from "@/components/ui/date-time-picker"
import { fioriMeta } from "../_lib/meta"

const base = fioriMeta({ name: "date-time-picker", component: DateTimePicker })
const meta = {
  ...base,
  args: { value: "2024-03-12 15:25:40", formatPattern: "yyyy-MM-dd HH:mm:ss", "aria-label": "Delivery value", onValueChange: fn() },
  argTypes: { ...base.argTypes, texts: { control: false }, onValueChange: { control: false } },
  render: function LocalizedPicker(args: DateTimePickerProps) {
    const [, updateArgs] = useArgs<DateTimePickerProps>()
    return <DateTimePicker {...args} onValueChange={(value, ...dates) => { args.onValueChange?.(value, ...dates); updateArgs({ value }) }} />
  },
} satisfies Meta<typeof DateTimePicker>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const German: Story = { globals: { locale: "de" }, args: { value: "", formatPattern: "medium" } }
export const Arabic: Story = { globals: { locale: "ar", dir: "rtl" }, args: { value: "", formatPattern: "medium" } }
export const Required: Story = { args: { value: "", required: true } }
export const CustomTexts: Story = { args: { value: "", required: true, texts: { valueMissing: pattern => `Enter a delivery value using ${pattern}`, invalidFormat: pattern => `Use the delivery format ${pattern}` } } }
export const RTL: Story = { globals: { dir: "rtl" } }
