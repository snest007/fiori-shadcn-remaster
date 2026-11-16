import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Tag } from "@/components/ui/tag"
import { Icon } from "@/components/ui/icon"
import { favorite } from "@/lib/fiori-icons"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"


// Source-backed defaults from registry/ui/tag.tsx and installed UI5 2.28 i18n defaults.
const textDefaults = [
  {
    "prop": "Tag.tagText",
    "value": "Tag (neutral/set1/set2); Tag Error / Tag Warning / Tag Success / Tag Information",
    "key": "TAG_DESCRIPTION_TAG, TAG_ERROR, TAG_WARNING, TAG_SUCCESS, TAG_INFORMATION"
  },
  {
    "prop": "Tag.roleDescription",
    "key": "TAG_ROLE_DESCRIPTION",
    "value": "Tag button"
  }
]

const base = fioriMeta({ name: "tag", component: Tag })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: () => <><DocsPage /><section aria-label="Component localization text keys"><h2>Localization text keys</h2><table><thead><tr><th>Text prop / key</th><th>UI5 key / source</th><th>English default</th></tr></thead><tbody>{textDefaults.map((entry) => <tr key={entry.prop}><td><code>{entry.prop}</code></td><td>{entry.key}</td><td>{entry.value}</td></tr>)}</tbody></table></section></> } },
  args: { children: "In review", design: "neutral", colorScheme: 1, size: "S", wrappingType: "normal", hideStateIcon: false, interactive: false, onClick: fn() },
  argTypes: { ...base.argTypes, children: { control: "text", table: { disable: false } }, design: { control: "select", options: ["neutral", "positive", "negative", "critical", "information", "set1", "set2"] }, colorScheme: { control: "select", options: [1,2,3,4,5,6,7,8,9,10] }, size: { control: "inline-radio", options: ["S", "L"] }, wrappingType: { control: "inline-radio", options: ["normal", "none"] }, hideStateIcon: { control: "boolean" }, interactive: { control: "boolean" }, tagText: { control: "text" }, roleDescription: { control: "text" }, icon: { control: false }, onClick: { control: false } },
  render: function StatusTag(args) { const [count, setCount] = React.useState(0); return <div className="grid max-w-xs gap-2"><Tag {...args} onClick={(event) => { args.onClick?.(event); setCount((value) => value + 1) }} />{args.interactive && <output>Opened {count} times</output>}</div> },
} satisfies Meta<typeof Tag>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Neutral: Story = { args: { design: "neutral" } }
export const NeutralWithoutIcon: Story = { args: { design: "neutral", hideStateIcon: true } }
export const Positive: Story = { args: { design: "positive" } }
export const PositiveWithoutIcon: Story = { args: { design: "positive", hideStateIcon: true } }
export const Negative: Story = { args: { design: "negative" } }
export const NegativeWithoutIcon: Story = { args: { design: "negative", hideStateIcon: true } }
export const Critical: Story = { args: { design: "critical" } }
export const CriticalWithoutIcon: Story = { args: { design: "critical", hideStateIcon: true } }
export const Information: Story = { args: { design: "information" } }
export const InformationWithoutIcon: Story = { args: { design: "information", hideStateIcon: true } }
export const Set1Scheme1: Story = { args: { design: "set1", colorScheme: 1 } }
export const Set1Scheme2: Story = { args: { design: "set1", colorScheme: 2 } }
export const Set1Scheme3: Story = { args: { design: "set1", colorScheme: 3 } }
export const Set1Scheme4: Story = { args: { design: "set1", colorScheme: 4 } }
export const Set1Scheme5: Story = { args: { design: "set1", colorScheme: 5 } }
export const Set1Scheme6: Story = { args: { design: "set1", colorScheme: 6 } }
export const Set1Scheme7: Story = { args: { design: "set1", colorScheme: 7 } }
export const Set1Scheme8: Story = { args: { design: "set1", colorScheme: 8 } }
export const Set1Scheme9: Story = { args: { design: "set1", colorScheme: 9 } }
export const Set1Scheme10: Story = { args: { design: "set1", colorScheme: 10 } }
export const Set2Scheme1: Story = { args: { design: "set2", colorScheme: 1 } }
export const Set2Scheme2: Story = { args: { design: "set2", colorScheme: 2 } }
export const Set2Scheme3: Story = { args: { design: "set2", colorScheme: 3 } }
export const Set2Scheme4: Story = { args: { design: "set2", colorScheme: 4 } }
export const Set2Scheme5: Story = { args: { design: "set2", colorScheme: 5 } }
export const Set2Scheme6: Story = { args: { design: "set2", colorScheme: 6 } }
export const Set2Scheme7: Story = { args: { design: "set2", colorScheme: 7 } }
export const Set2Scheme8: Story = { args: { design: "set2", colorScheme: 8 } }
export const Set2Scheme9: Story = { args: { design: "set2", colorScheme: 9 } }
export const Set2Scheme10: Story = { args: { design: "set2", colorScheme: 10 } }
export const CustomIcon: Story = { args: { design: "set1", colorScheme: 6, icon: <Icon icon={favorite} /> } }
export const IconOnly: Story = { args: { icon: <Icon icon={favorite} />, children: undefined, "aria-label": "Favorite status" } }
export const Large: Story = { args: { size: "L", design: "positive" } }
export const LargeColorSet: Story = { args: { size: "L", design: "set2", colorScheme: 4, hideStateIcon: true } }
export const Interactive: Story = { args: { interactive: true, design: "negative" } }
export const Wrapping: Story = { args: { design: "critical", children: "Order confirmation awaiting review" }, decorators: [(Story) => <div className="w-24"><Story /></div>] }
export const Truncated: Story = { args: { design: "critical", wrappingType: "none", children: "Order confirmation awaiting review" }, decorators: [(Story) => <div className="w-24"><Story /></div>] }
export const CustomTexts: Story = { args: { design: "negative", tagText: "Order status: action required", roleDescription: "Order status action" } }
export const RTL: Story = { globals: { dir: "rtl" } }
