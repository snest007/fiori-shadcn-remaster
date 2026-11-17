import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Checkbox, type CheckboxProps } from "@/components/ui/checkbox"
import { fioriMeta } from "../_lib/meta"
import { DocsPage } from "../_lib/DocsPage"

const base = fioriMeta({ name: "checkbox", component: Checkbox })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: function ComponentDocs() {
  const textKeys = [
  [
    "valueStateText (negative)",
    "VALUE_STATE_ERROR",
    "Invalid entry"
  ],
  [
    "valueStateText (critical)",
    "VALUE_STATE_WARNING",
    "Warning issued"
  ],
  [
    "valueStateText (positive)",
    "VALUE_STATE_SUCCESS",
    "Entry successfully validated"
  ],
  [
    "valueStateText (information)",
    "VALUE_STATE_INFORMATION",
    "Informative entry"
  ]
] as const
  return <><DocsPage /><section aria-label="Localization text keys" className="sbdocs-content"><h2>Localization text keys</h2><p>Override these public text props in your application; CustomTexts demonstrates the supported API. Existing label props remain available.</p><table><thead><tr><th>Prop / key</th><th>UI5 key or source</th><th>English component default</th></tr></thead><tbody>{textKeys.map(([prop, key, value]) => <tr key={prop}><td><code>{prop}</code></td><td>{key}</td><td>{value}</td></tr>)}</tbody></table></section></>
} } },
  args: { checked: false, text: "Accept purchasing terms", valueState: "none", disabled: false, readOnly: false, required: false, truncate: false, onCheckedChange: fn() },
  argTypes: { ...base.argTypes, valueState: { control: "select", options: ["none", "negative", "critical", "positive", "information"] }, checked: { control: "select", options: [false, true, "indeterminate"] }, text: { control: "text" }, disabled: { control: "boolean" }, readOnly: { control: "boolean" }, required: { control: "boolean" }, truncate: { control: "boolean" }, valueStateText: { control: "text" }, onCheckedChange: { control: false } },
  render: function PurchasingTerms(args: CheckboxProps) {
    const [, updateArgs] = useArgs<CheckboxProps>()
    return <Checkbox {...args} onCheckedChange={(checked) => { args.onCheckedChange?.(checked); updateArgs({ checked }) }} />
  },
} satisfies Meta<typeof Checkbox>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const None: Story = { args: { valueState: "none" } }
export const Negative: Story = { args: { valueState: "negative" } }
export const Critical: Story = { args: { valueState: "critical" } }
export const Positive: Story = { args: { valueState: "positive" } }
export const Information: Story = { args: { valueState: "information" } }
export const NegativeChecked: Story = { args: { valueState: "negative", checked: true } }
export const CriticalChecked: Story = { args: { valueState: "critical", checked: true } }
export const PositiveChecked: Story = { args: { valueState: "positive", checked: true } }
export const InformationChecked: Story = { args: { valueState: "information", checked: true } }
export const Checked: Story = { args: { checked: true } }
export const Indeterminate: Story = { args: { checked: "indeterminate" } }
export const WithoutText: Story = { args: { text: "", "aria-label": "Accept purchasing terms" } }
export const Required: Story = { args: { required: true } }
export const Disabled: Story = { args: { disabled: true } }
export const DisabledChecked: Story = { args: { disabled: true, checked: true } }
export const ReadOnly: Story = { args: { readOnly: true } }
export const ReadOnlyChecked: Story = { args: { readOnly: true, checked: true } }
export const CriticalIndeterminate: Story = { args: { checked: "indeterminate", valueState: "critical" } }
export const LongText: Story = { args: { text: "I confirm that the purchase meets the department's procurement and approval requirements." }, decorators: [(Story) => <div className="max-w-xs"><Story /></div>] }
export const Truncated: Story = { args: { text: "I confirm that the purchase meets the department's procurement and approval requirements.", truncate: true }, decorators: [(Story) => <div className="max-w-xs"><Story /></div>] }
export const CustomTexts: Story = { args: { valueState: "critical", valueStateText: "Confirm the terms before submitting this purchase." } }
export const RTL: Story = { globals: { dir: "rtl" } }
