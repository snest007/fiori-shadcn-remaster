import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { BusyIndicator } from "@/components/ui/busy-indicator"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"


// Source-backed defaults from registry/ui/busy-indicator.tsx and installed UI5 2.28 i18n defaults.
const textDefaults = [
  {
    "prop": "BusyIndicator.title",
    "key": "BUSY_INDICATOR_TITLE",
    "value": "Please wait"
  },
  {
    "prop": "BusyIndicator.text",
    "key": "Application text; no matching component UI5 default",
    "value": "Unset; title names the progressbar"
  }
]

const base = fioriMeta({ name: "busy-indicator", component: BusyIndicator })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: () => <><DocsPage /><section aria-label="Component localization text keys"><h2>Localization text keys</h2><table><thead><tr><th>Text prop / key</th><th>UI5 key / source</th><th>English default</th></tr></thead><tbody>{textDefaults.map((entry) => <tr key={entry.prop}><td><code>{entry.prop}</code></td><td>{entry.key}</td><td>{entry.value}</td></tr>)}</tbody></table></section></> } },
  args: { active: false, delay: 0, size: "M", textPlacement: "bottom" },
  argTypes: { ...base.argTypes, active: { control: "boolean" }, delay: { control: "number" }, size: { control: "select", options: ["S", "M", "L"] }, text: { control: "text" }, title: { control: "text" }, textPlacement: { control: "inline-radio", options: ["top", "bottom"] } },
  render: function LoadingArea(args) { const [, updateArgs] = useArgs(); return <div className="grid gap-3"><Button onClick={() => updateArgs({ active: !args.active })}>{args.active ? "Stop loading" : "Load orders"}</Button><BusyIndicator {...args}><div className="max-w-sm p-4"><Text>Purchase order details remain visible while loading.</Text></div></BusyIndicator></div> },
} satisfies Meta<typeof BusyIndicator>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Inactive: Story = { args: { active: false } }
export const SizeS: Story = { args: { active: true, size: "S" } }
export const SizeM: Story = { args: { active: true, size: "M" } }
export const SizeL: Story = { args: { active: true, size: "L" } }
export const WithText: Story = { args: { active: true, text: "Loading orders" } }
export const TextAbove: Story = { args: { active: true, size: "L", text: "Loading orders", textPlacement: "top" } }
export const Delayed: Story = { args: { delay: 1000 } }
export const IndicatorOnly: Story = { args: { active: true }, render: (args) => <BusyIndicator {...args} /> }
export const CustomTexts: Story = { args: { active: true, text: "Retrieving purchase orders", title: "Please wait for the order list" } }
export const RTL: Story = { globals: { dir: "rtl" } }

