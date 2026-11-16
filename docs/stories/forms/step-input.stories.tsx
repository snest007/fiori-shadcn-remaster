import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { StepInput, type StepInputProps } from "@/components/ui/step-input"
import { fioriMeta } from "../_lib/meta"
import { DocsPage } from "../_lib/DocsPage"

const base = fioriMeta({ name: "step-input", component: StepInput })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: function ComponentDocs() {
  const textKeys = [
  [
    "valueStateMessage (negative)",
    "VALUE_STATE_ERROR",
    "Invalid entry"
  ],
  [
    "valueStateMessage (critical)",
    "VALUE_STATE_WARNING",
    "Warning issued"
  ],
  [
    "valueStateMessage (positive)",
    "VALUE_STATE_SUCCESS",
    "Entry successfully validated"
  ],
  [
    "valueStateMessage (information)",
    "VALUE_STATE_INFORMATION",
    "Informative entry"
  ],
  [
    "decrementLabel",
    "NUMBERINPUT_DEC_ICON_TITLE",
    "Decrease"
  ],
  [
    "incrementLabel",
    "NUMBERINPUT_INC_ICON_TITLE",
    "Increase"
  ]
] as const
  return <><DocsPage /><section aria-label="Localization text keys" className="sbdocs-content"><h2>Localization text keys</h2><p>Override these public text props in your application; CustomTexts demonstrates the supported API. Existing label props remain available.</p><table><thead><tr><th>Prop / key</th><th>UI5 key or source</th><th>English component default</th></tr></thead><tbody>{textKeys.map(([prop, key, value]) => <tr key={prop}><td><code>{prop}</code></td><td>{key}</td><td>{value}</td></tr>)}</tbody></table></section></>
} } },
  args: { value: 5, min: 0, max: 10, step: 1, valuePrecision: 0, valueState: "none", disabled: false, readOnly: false, required: false, "aria-label": "Order quantity", onValueChange: fn(), onValidityChange: fn() },
  argTypes: { ...base.argTypes, valueState: { control: "select", options: ["none", "negative", "critical", "positive", "information"] }, value: { control: "number" }, min: { control: "number" }, max: { control: "number" }, step: { control: "number" }, valuePrecision: { control: "number" }, disabled: { control: "boolean" }, readOnly: { control: "boolean" }, required: { control: "boolean" }, valueStateMessage: { control: "text" }, decrementLabel: { control: "text" }, incrementLabel: { control: "text" }, onValueChange: { control: false }, onValidityChange: { control: false } },
  render: function OrderQuantity(args: StepInputProps) {
    const [, updateArgs] = useArgs<StepInputProps>()
    return <div className="max-w-xs"><StepInput {...args} onValueChange={(value) => { args.onValueChange?.(value); updateArgs({ value }) }} /></div>
  },
} satisfies Meta<typeof StepInput>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const None: Story = { args: { valueState: "none" } }
export const Negative: Story = { args: { valueState: "negative" } }
export const Critical: Story = { args: { valueState: "critical" } }
export const Positive: Story = { args: { valueState: "positive" } }
export const Information: Story = { args: { valueState: "information" } }
export const DecimalPrecision: Story = { args: { value: 2.5, step: 0.25, valuePrecision: 2 } }
export const Minimum: Story = { args: { value: 0 } }
export const Maximum: Story = { args: { value: 10 } }
export const Disabled: Story = { args: { disabled: true } }
export const ReadOnly: Story = { args: { readOnly: true } }
export const Required: Story = { args: { required: true } }
export const CustomTexts: Story = { args: { decrementLabel: "Remove one unit", incrementLabel: "Add one unit", valueState: "critical", valueStateMessage: "Review the requested quantity." } }
export const RTL: Story = { globals: { dir: "rtl" } }

export const German: Story = { globals: { locale: "de" }, args: { value: 1.5, step: 0.1, valuePrecision: 1 } }
export const Arabic: Story = { globals: { locale: "ar", dir: "rtl" }, args: { value: 1.5, step: 0.1, valuePrecision: 1 } }
export const ProviderOverride: Story = { globals: { locale: "de" }, args: { texts: { increment: "Add one delivery unit" } } }
