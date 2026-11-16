import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { TextArea, type TextAreaProps } from "@/components/ui/textarea"
import { fioriMeta } from "../_lib/meta"
import { DocsPage } from "../_lib/DocsPage"

const base = fioriMeta({ name: "textarea", component: TextArea })
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
    "TextArea.js hasMessageState",
    "No default message for positive; caller may provide one"
  ],
  [
    "valueStateMessage (information)",
    "VALUE_STATE_INFORMATION",
    "Informative entry"
  ],
  [
    "counterText (remaining >= 0)",
    "TEXTAREA_CHARACTERS_LEFT",
    "{0} characters left"
  ],
  [
    "counterText (remaining < 0)",
    "TEXTAREA_CHARACTERS_EXCEEDED",
    "{0} characters over limit"
  ]
] as const
  return <><DocsPage /><section aria-label="Localization text keys" className="sbdocs-content"><h2>Localization text keys</h2><p>Override these public text props in your application; CustomTexts demonstrates the supported API. Existing label props remain available.</p><table><thead><tr><th>Prop / key</th><th>UI5 key or source</th><th>English component default</th></tr></thead><tbody>{textKeys.map(([prop, key, value]) => <tr key={prop}><td><code>{prop}</code></td><td>{key}</td><td>{value}</td></tr>)}</tbody></table></section></>
} } },
  args: { value: "Deliver to the receiving desk.", placeholder: "Enter delivery notes", rows: 2, growing: false, growingMaxRows: 0, counterMode: "none", maxLength: 80, disabled: false, readOnly: false, required: false, valueState: "none", "aria-label": "Delivery notes", onChange: fn() },
  argTypes: { ...base.argTypes, valueState: { control: "select", options: ["none", "negative", "critical", "positive", "information"] }, value: { control: "text" }, placeholder: { control: "text" }, rows: { control: "number" }, growing: { control: "boolean" }, growingMaxRows: { control: "number" }, counterMode: { control: "select", options: ["none", "always", "auto"] }, maxLength: { control: "number" }, disabled: { control: "boolean" }, readOnly: { control: "boolean" }, required: { control: "boolean" }, valueStateMessage: { control: "text" }, counterText: { control: false }, onChange: { control: false } },
  render: function DeliveryNotes(args: TextAreaProps) {
    const [, updateArgs] = useArgs<TextAreaProps>()
    return <div className="w-full max-w-md"><TextArea {...args} onChange={(event) => { args.onChange?.(event); updateArgs({ value: event.target.value }) }} /></div>
  },
} satisfies Meta<typeof TextArea>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const None: Story = { args: { valueState: "none" } }
export const Negative: Story = { args: { valueState: "negative" } }
export const Critical: Story = { args: { valueState: "critical" } }
export const Positive: Story = { args: { valueState: "positive" } }
export const Information: Story = { args: { valueState: "information" } }
export const NegativeEmpty: Story = { args: { valueState: "negative", value: "" } }
export const CriticalEmpty: Story = { args: { valueState: "critical", value: "" } }
export const PositiveEmpty: Story = { args: { valueState: "positive", value: "" } }
export const InformationEmpty: Story = { args: { valueState: "information", value: "" } }
export const Empty: Story = { args: { value: "" } }
export const Disabled: Story = { args: { disabled: true } }
export const ReadOnly: Story = { args: { readOnly: true } }
export const Required: Story = { args: { required: true } }
export const OneRow: Story = { args: { rows: 1 } }
export const FourRows: Story = { args: { rows: 4, value: "Keep the goods dry.\nUse the north entrance." } }
export const Growing: Story = { args: { growing: true, value: "Pack each monitor separately.\nAttach a packing slip.\nUse the north entrance.\nCall the receiving desk." } }
export const GrowingMaxRows: Story = { args: { growing: true, growingMaxRows: 3, value: "Pack each monitor separately.\nAttach a packing slip.\nUse the north entrance.\nCall the receiving desk." } }
export const Counter: Story = { args: { counterMode: "always", maxLength: 40 } }
export const AutoCounter: Story = { args: { counterMode: "auto", maxLength: 40 } }
export const OverLimit: Story = { args: { counterMode: "always", maxLength: 20 } }
export const NegativeCounter: Story = { args: { counterMode: "always", maxLength: 40, valueState: "negative" } }
export const CustomTexts: Story = { args: { counterMode: "always", valueState: "critical", valueStateMessage: "Keep the delivery note brief.", counterText: (remaining) => remaining >= 0 ? `${remaining} characters available for the note` : `Remove ${-remaining} characters from the note` } }
export const RTL: Story = { globals: { dir: "rtl" } }
