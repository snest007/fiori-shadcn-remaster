import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Panel } from "@/components/ui/panel"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Title } from "@/components/ui/title"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"


// Source-backed defaults from registry/ui/panel.tsx and installed UI5 2.28 i18n defaults.
const textDefaults = [
  {
    "prop": "Panel.toggleButtonText",
    "key": "PANEL_ICON",
    "value": "Expand/Collapse"
  }
]

const base = fioriMeta({ name: "panel", component: Panel })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: () => <><DocsPage /><section aria-label="Component localization text keys"><h2>Localization text keys</h2><table><thead><tr><th>Text prop / key</th><th>UI5 key</th><th>English default</th></tr></thead><tbody>{textDefaults.map((entry) => <tr key={entry.prop}><td><code>{entry.prop}</code></td><td>{entry.key}</td><td>{entry.value}</td></tr>)}</tbody></table></section></> } },
  args: { headerText: "Delivery details", collapsed: false, fixed: false, noAnimation: false, stickyHeader: false, headerLevel: 2, accessibleRole: "region", onToggle: fn(), children: "Deliver the order to the main warehouse before Friday." },
  argTypes: { ...base.argTypes, children: { control: "text", table: { disable: false } }, headerText: { control: "text" }, collapsed: { control: "boolean" }, fixed: { control: "boolean" }, noAnimation: { control: "boolean" }, stickyHeader: { control: "boolean" }, headerLevel: { control: "select", options: [1, 2, 3, 4, 5, 6] }, accessibleRole: { control: "select", options: ["form", "region", "complementary"] }, accessibleName: { control: "text" }, toggleButtonText: { control: "text" }, header: { control: false }, onToggle: { control: false }, contentClassName: { table: { disable: true } } },
  render: function DeliveryPanel(args) { const [, updateArgs] = useArgs(); return <Panel {...args} className="max-w-xl" onToggle={(collapsed) => { args.onToggle?.(collapsed); updateArgs({ collapsed }) }}><Text>{args.children}</Text></Panel> },
} satisfies Meta<typeof Panel>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Expanded: Story = { args: {} }
export const Collapsed: Story = { args: { collapsed: true } }
export const Fixed: Story = { args: { fixed: true } }
export const LongHeader: Story = { args: { headerText: "Delivery details for purchase orders from international suppliers", collapsed: true } }
export const CustomHeader: Story = { args: { headerText: undefined, accessibleName: "Delivery details", header: <div className="flex w-full items-center justify-between"><Title level="H3" size="H6">Delivery details</Title><Button variant="transparent" onClick={fn()}>Edit</Button></div> } }
export const CustomHeaderCollapsed: Story = { args: { headerText: undefined, collapsed: true, accessibleName: "Delivery details", header: <div className="flex w-full items-center justify-between"><Title level="H3" size="H6">Delivery details</Title><Button variant="transparent" onClick={fn()}>Edit</Button></div> } }
export const NoAnimation: Story = { args: { noAnimation: true } }
export const StickyHeader: Story = { args: { stickyHeader: true } }
export const CustomTexts: Story = { args: { toggleButtonText: "Show or hide delivery details" } }
export const RTL: Story = { globals: { dir: "rtl" } }

