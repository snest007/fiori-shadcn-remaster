import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { RadioGroup, RadioGroupItem, type RadioGroupProps } from "@/components/ui/radio-group"
import { fioriMeta } from "../_lib/meta"
import { DocsPage } from "../_lib/DocsPage"

const base = fioriMeta({ name: "radio-group", component: RadioGroup })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: function ComponentDocs() {
  const textKeys = [
  [
    "RadioGroupItem.valueStateText (negative)",
    "VALUE_STATE_ERROR",
    "Invalid entry"
  ],
  [
    "RadioGroupItem.valueStateText (critical)",
    "VALUE_STATE_WARNING",
    "Warning issued"
  ],
  [
    "RadioGroupItem.valueStateText (positive)",
    "VALUE_STATE_SUCCESS",
    "Entry successfully validated"
  ],
  [
    "RadioGroupItem.valueStateText (information)",
    "VALUE_STATE_INFORMATION",
    "Informative entry"
  ]
] as const
  return <><DocsPage /><section aria-label="Localization text keys" className="sbdocs-content"><h2>Localization text keys</h2><p>Override these public text props in your application; CustomTexts demonstrates the supported API. Existing label props remain available.</p><table><thead><tr><th>Prop / key</th><th>UI5 key or source</th><th>English component default</th></tr></thead><tbody>{textKeys.map(([prop, key, value]) => <tr key={prop}><td><code>{prop}</code></td><td>{key}</td><td>{value}</td></tr>)}</tbody></table></section></>
} } },
  args: { value: "standard", orientation: "vertical", disabled: false, readOnly: false, required: false, valueState: "none", "aria-label": "Delivery method", onValueChange: fn() },
  argTypes: { ...base.argTypes, valueState: { control: "select", options: ["none", "negative", "critical", "positive", "information"] }, value: { control: "select", options: ["", "standard", "express", "pickup"] }, orientation: { control: "inline-radio", options: ["vertical", "horizontal"] }, disabled: { control: "boolean" }, readOnly: { control: "boolean" }, required: { control: "boolean" }, loop: { control: "boolean" }, dir: { control: false }, onValueChange: { control: false } },
  render: function DeliveryMethod(args: RadioGroupProps) {
    const [, updateArgs] = useArgs<RadioGroupProps>()
    return <RadioGroup {...args} onValueChange={(value) => { args.onValueChange?.(value); updateArgs({ value }) }}>
      <RadioGroupItem value="standard" text="Standard delivery" />
      <RadioGroupItem value="express" text="Express delivery" />
      <RadioGroupItem value="pickup" text="Collect in person" />
    </RadioGroup>
  },
} satisfies Meta<typeof RadioGroup>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const None: Story = { args: { valueState: "none" } }
export const Negative: Story = { args: { valueState: "negative" } }
export const Critical: Story = { args: { valueState: "critical" } }
export const Positive: Story = { args: { valueState: "positive" } }
export const Information: Story = { args: { valueState: "information" } }
export const Unselected: Story = { args: { value: "" } }
export const Horizontal: Story = { args: { orientation: "horizontal" } }
export const Required: Story = { args: { required: true } }
export const Disabled: Story = { args: { value: "", disabled: true } }
export const DisabledChecked: Story = { args: { disabled: true } }
export const ReadOnly: Story = { args: { value: "", readOnly: true } }
export const ReadOnlyChecked: Story = { args: { readOnly: true } }
export const CustomTexts: Story = { render: function ReviewedMethod() {
  return <RadioGroup aria-label="Delivery method" defaultValue="standard"><RadioGroupItem value="standard" text="Standard delivery" valueState="critical" valueStateText="Review the estimated arrival date." /><RadioGroupItem value="express" text="Express delivery" /></RadioGroup>
} }
export const DisabledItem: Story = { render: function AvailableMethods() {
  return <RadioGroup aria-label="Delivery method" defaultValue="standard"><RadioGroupItem value="standard" text="Standard delivery" /><RadioGroupItem value="express" text="Express delivery (unavailable)" disabled /><RadioGroupItem value="pickup" text="Collect in person" /></RadioGroup>
} }
export const RTL: Story = { globals: { dir: "rtl" }, args: { orientation: "horizontal" } }
export const NegativeUnselected: Story = { args: { valueState: "negative", value: "" } }
export const CriticalUnselected: Story = { args: { valueState: "critical", value: "" } }
export const PositiveUnselected: Story = { args: { valueState: "positive", value: "" } }
export const InformationUnselected: Story = { args: { valueState: "information", value: "" } }
