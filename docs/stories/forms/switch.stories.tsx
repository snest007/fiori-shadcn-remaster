import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Switch, type SwitchProps } from "@/components/ui/switch"
import { fioriMeta } from "../_lib/meta"
import { DocsPage } from "../_lib/DocsPage"

const base = fioriMeta({ name: "switch", component: Switch })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: function ComponentDocs() {
  const textKeys = [
  [
    "readOnlyText",
    "ACC_STATE_READONLY",
    "Read Only"
  ],
  [
    "textOn / textOff",
    "SWITCH_ON / SWITCH_OFF",
    "No text by default; shows icons. Caller may supply short track labels."
  ]
] as const
  return <><DocsPage /><section aria-label="Localization text keys" className="sbdocs-content"><h2>Localization text keys</h2><p>Override these public text props in your application; CustomTexts demonstrates the supported API. Existing label props remain available.</p><table><thead><tr><th>Prop / key</th><th>UI5 key or source</th><th>English component default</th></tr></thead><tbody>{textKeys.map(([prop, key, value]) => <tr key={prop}><td><code>{prop}</code></td><td>{key}</td><td>{value}</td></tr>)}</tbody></table></section></>
} } },
  args: { checked: false, design: "textual", disabled: false, readOnly: false, required: false, "aria-label": "Email notifications", onCheckedChange: fn() },
  argTypes: { ...base.argTypes, checked: { control: "boolean" }, design: { control: "select", options: ["textual", "graphical"] }, disabled: { control: "boolean" }, readOnly: { control: "boolean" }, required: { control: "boolean" }, textOn: { control: "text" }, textOff: { control: "text" }, readOnlyText: { control: "text" }, onCheckedChange: { control: false } },
  render: function EmailNotifications(args: SwitchProps) {
    const [, updateArgs] = useArgs<SwitchProps>()
    return <Switch {...args} onCheckedChange={(checked) => { args.onCheckedChange?.(checked); updateArgs({ checked }) }} />
  },
} satisfies Meta<typeof Switch>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Textual: Story = {}
export const Checked: Story = { args: { checked: true } }
export const WithText: Story = { args: { textOn: "On", textOff: "Off" } }
export const WithTextChecked: Story = { args: { textOn: "On", textOff: "Off", checked: true } }
export const Graphical: Story = { args: { design: "graphical" } }
export const GraphicalChecked: Story = { args: { design: "graphical", checked: true } }
export const Disabled: Story = { args: { disabled: true } }
export const DisabledChecked: Story = { args: { disabled: true, checked: true } }
export const TextDisabledChecked: Story = { args: { textOn: "On", textOff: "Off", disabled: true, checked: true } }
export const GraphicalDisabled: Story = { args: { design: "graphical", disabled: true } }
export const ReadOnly: Story = { args: { readOnly: true } }
export const ReadOnlyChecked: Story = { args: { readOnly: true, checked: true } }
export const TextReadOnlyChecked: Story = { args: { textOn: "On", textOff: "Off", readOnly: true, checked: true } }
export const CustomTexts: Story = { args: { textOn: "Yes", textOff: "No", readOnly: true, readOnlyText: "Notification settings are managed by your administrator." } }
export const RTL: Story = { globals: { dir: "rtl" } }
