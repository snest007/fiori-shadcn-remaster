import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Link } from "@/components/ui/link"
import { chainLink, navigationRightArrow } from "@/lib/fiori-icons"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"


// Source-backed defaults from registry/ui/link.tsx and installed UI5 2.28 i18n defaults.
const textDefaults = [
  {
    "prop": "Link.designText (design=\"subtle\")",
    "key": "LINK_SUBTLE",
    "value": "Subtle"
  },
  {
    "prop": "Link.designText (design=\"emphasized\")",
    "key": "LINK_EMPHASIZED",
    "value": "Emphasized"
  }
]

const base = fioriMeta({ name: "link", component: Link })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: () => <><DocsPage /><section aria-label="Component localization text keys"><h2>Localization text keys</h2><table><thead><tr><th>Text prop / key</th><th>UI5 key / source</th><th>English default</th></tr></thead><tbody>{textDefaults.map((entry) => <tr key={entry.prop}><td><code>{entry.prop}</code></td><td>{entry.key}</td><td>{entry.value}</td></tr>)}</tbody></table></section></> } },
  args: { children: "View purchase order", design: "default", wrappingType: "normal", interactiveAreaSize: "normal", disabled: false, onClick: fn() },
  argTypes: { ...base.argTypes, children: { control: "text", table: { disable: false } }, design: { control: "select", options: ["default", "subtle", "emphasized"] }, wrappingType: { control: "inline-radio", options: ["normal", "none"] }, interactiveAreaSize: { control: "inline-radio", options: ["normal", "large"] }, disabled: { control: "boolean" }, href: { control: "text" }, designText: { control: "text" }, icon: { control: false }, endIcon: { control: false }, onClick: { control: false } },
  render: function ActionLink(args) { const [count, setCount] = React.useState(0); return <div className="grid max-w-xs gap-2"><Link {...args} onClick={(event) => { args.onClick?.(event); if (!args.href) setCount((value) => value + 1) }} /><output>Opened {count} times</output></div> },
} satisfies Meta<typeof Link>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Default: Story = { args: {} }
export const Subtle: Story = { args: { design: "subtle" } }
export const Emphasized: Story = { args: { design: "emphasized" } }
export const Disabled: Story = { args: { disabled: true } }
export const LeadingIcon: Story = { args: { icon: chainLink } }
export const TrailingIcon: Story = { args: { endIcon: navigationRightArrow } }
export const LargeTarget: Story = { args: { interactiveAreaSize: "large" } }
export const Wrapping: Story = { args: { children: "View the complete purchase order and delivery confirmation" } }
export const Truncated: Story = { args: { wrappingType: "none", children: "View the complete purchase order and delivery confirmation" } }
export const Navigation: Story = { args: { href: "#purchase-order", children: "Jump to purchase order" } }
export const CustomTexts: Story = { args: { design: "emphasized", designText: "Priority navigation" } }
export const RTL: Story = { globals: { dir: "rtl" } }

