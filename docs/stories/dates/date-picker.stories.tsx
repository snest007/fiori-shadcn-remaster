import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { DatePicker, type DatePickerProps } from "@/components/ui/date-picker"
import { fioriMeta } from "../_lib/meta"

const base = fioriMeta({ name: "date-picker", component: DatePicker })
const meta = {
  ...base,
  args: { value: "Mar 12, 2024", formatPattern: "MMM d, y", "aria-label": "Delivery value", onValueChange: fn() },
  argTypes: { ...base.argTypes, texts: { control: false }, onValueChange: { control: false } },
  render: function LocalizedPicker(args: DatePickerProps) {
    const [, updateArgs] = useArgs<DatePickerProps>()
    return <DatePicker {...args} onValueChange={(value, ...dates) => { args.onValueChange?.(value, ...dates); updateArgs({ value }) }} />
  },
} satisfies Meta<typeof DatePicker>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const German: Story = { globals: { locale: "de" }, args: { value: "", formatPattern: "medium" } }
export const Arabic: Story = { globals: { locale: "ar", dir: "rtl" }, args: { value: "", formatPattern: "medium" } }
export const Required: Story = { args: { value: "", required: true } }
export const CustomTexts: Story = { args: { value: "", required: true, texts: { valueMissing: pattern => `Enter a delivery value using ${pattern}`, invalidFormat: pattern => `Use the delivery format ${pattern}` } } }
export const RTL: Story = { globals: { dir: "rtl" } }
