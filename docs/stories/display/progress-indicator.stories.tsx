import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { ProgressIndicator } from "@/components/ui/progress-indicator"
import { Button } from "@/components/ui/button"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"


// Source-backed defaults from registry/ui/progress-indicator.tsx and installed UI5 2.28 i18n defaults.
const textDefaults = [
  {
    "prop": "ProgressIndicator.valueStateText.negative",
    "key": "VALUE_STATE_ERROR",
    "value": "Invalid entry"
  },
  {
    "prop": "ProgressIndicator.valueStateText.critical",
    "key": "VALUE_STATE_WARNING",
    "value": "Warning issued"
  },
  {
    "prop": "ProgressIndicator.valueStateText.positive",
    "key": "VALUE_STATE_SUCCESS",
    "value": "Entry successfully validated"
  },
  {
    "prop": "ProgressIndicator.valueStateText.information",
    "key": "VALUE_STATE_INFORMATION",
    "value": "Informative entry"
  }
]

const base = fioriMeta({ name: "progress-indicator", component: ProgressIndicator })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: () => <><DocsPage /><section aria-label="Component localization text keys"><h2>Localization text keys</h2><table><thead><tr><th>Text prop / key</th><th>UI5 key</th><th>English default</th></tr></thead><tbody>{textDefaults.map((entry) => <tr key={entry.prop}><td><code>{entry.prop}</code></td><td>{entry.key}</td><td>{entry.value}</td></tr>)}</tbody></table></section></> } },
  args: { value: 30, valueState: "none", hideValue: false, "aria-label": "Order upload progress" },
  argTypes: { ...base.argTypes, value: { control: { type: "range", min: 0, max: 100, step: 1 } }, valueState: { control: "select", options: ["none", "negative", "critical", "positive", "information"] }, hideValue: { control: "boolean" }, displayValue: { control: "text" }, valueStateText: { control: "text" }, "aria-label": { control: "text" } },
  render: function UploadProgress(args) { const [, updateArgs] = useArgs(); return <div className="grid max-w-md gap-3"><ProgressIndicator {...args} /><div className="flex gap-2"><Button onClick={() => updateArgs({ value: Math.min(100, (args.value ?? 0) + 10) })}>Advance upload</Button><Button onClick={() => updateArgs({ value: 0 })}>Reset</Button></div></div> },
} satisfies Meta<typeof ProgressIndicator>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Empty: Story = { args: { value: 0 } }
export const LowProgress: Story = { args: { value: 25 } }
export const HighProgress: Story = { args: { value: 75 } }
export const Complete: Story = { args: { value: 100 } }
export const None: Story = { args: { value: 60, valueState: "none" } }
export const Negative: Story = { args: { value: 60, valueState: "negative" } }
export const Critical: Story = { args: { value: 60, valueState: "critical" } }
export const Positive: Story = { args: { value: 60, valueState: "positive" } }
export const Information: Story = { args: { value: 60, valueState: "information" } }
export const LowNegative: Story = { args: { value: 30, valueState: "negative" } }
export const HiddenValue: Story = { args: { hideValue: true } }
export const DisplayValue: Story = { args: { value: 80, displayValue: "8 of 10 orders" } }
export const CustomTexts: Story = { args: { valueState: "critical", valueStateText: "Upload needs attention" } }
export const RTL: Story = { globals: { dir: "rtl" } }

