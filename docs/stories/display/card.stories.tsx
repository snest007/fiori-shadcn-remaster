import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Card, CardHeader, CardContent, type CardProps, type CardHeaderProps } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Text } from "@/components/ui/text"
import { Title, type TitleLevel } from "@/components/ui/title"
import { calendar, overflow } from "@/lib/fiori-icons"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"

type Args = CardProps & Pick<CardHeaderProps, "titleText" | "subtitleText" | "additionalText" | "interactive" | "titleLevel" | "roleDescription"> & { avatarKind: "none" | "avatar" | "icon"; action: boolean; showHeader: boolean; showContent: boolean; onHeaderClick?: CardHeaderProps["onClick"] }

// Source-backed defaults from registry/ui/card.tsx and installed UI5 2.28 i18n defaults.
const textDefaults = [
  {
    "prop": "CardHeader.roleDescription",
    "key": "ARIA_ROLEDESCRIPTION_CARD_HEADER",
    "value": "Card Header"
  },
  {
    "prop": "CardHeader.roleDescription (interactive=true)",
    "key": "ARIA_ROLEDESCRIPTION_INTERACTIVE_CARD_HEADER",
    "value": "Interactive Card Header"
  }
]

const base = fioriMeta({ name: "card", component: Card })
// UI5 CardHeaderTemplate owns its heading; the application supplies the ancestor
// hierarchy when the live titleLevel Control selects a deeper heading.
const headingContext = ["Sales performance", "Regional overview", "Quarterly results", "Market totals", "Revenue details"]
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: () => <><DocsPage /><section aria-label="Component localization text keys"><h2>Localization text keys</h2><table><thead><tr><th>Text prop / key</th><th>UI5 key / source</th><th>English default</th></tr></thead><tbody>{textDefaults.map((entry) => <tr key={entry.prop}><td><code>{entry.prop}</code></td><td>{entry.key}</td><td>{entry.value}</td></tr>)}</tbody></table></section></> } },
  args: { accessibleName: "Quarterly sales", titleText: "Quarterly Sales", subtitleText: "Europe, Middle East and Africa", additionalText: "3 of 10", interactive: false, titleLevel: 2, avatarKind: "none", action: false, showHeader: true, showContent: true, onHeaderClick: fn() },
  argTypes: { ...base.argTypes, accessibleName: { control: "text" }, titleText: { control: "text" }, subtitleText: { control: "text" }, additionalText: { control: "text" }, interactive: { control: "boolean" }, titleLevel: { control: "select", options: [1,2,3,4,5,6] }, roleDescription: { control: "text" }, avatarKind: { control: "select", options: ["none", "avatar", "icon"] }, action: { control: "boolean" }, showHeader: { control: "boolean" }, showContent: { control: "boolean" }, onHeaderClick: { control: false } },
  render: function SalesCard(args: Args) {
    const [opened, setOpened] = React.useState(0)
    const { titleText, subtitleText, additionalText, interactive, titleLevel, roleDescription, avatarKind, action, showHeader, showContent, onHeaderClick, ...props } = args
    return <div className="grid gap-2">{showHeader && headingContext.slice(0, (titleLevel ?? 3) - 1).map((text, index) => <Title key={text} level={("H" + (index + 1)) as TitleLevel}>{text}</Title>)}<Card {...props} className="w-80 max-w-full">{showHeader && <CardHeader titleText={titleText} subtitleText={subtitleText} additionalText={additionalText} interactive={interactive} titleLevel={titleLevel} roleDescription={roleDescription} avatar={avatarKind === "avatar" ? <Avatar initials="QS" accessibleName="Quarterly sales" /> : avatarKind === "icon" ? <Icon icon={calendar} /> : undefined} action={action ? <Button variant="transparent" size="icon" aria-label="More sales actions" onClick={fn()}><Icon icon={overflow} /></Button> : undefined} onClick={(event) => { onHeaderClick?.(event); setOpened((value) => value + 1) }} />}{showContent && <CardContent className="px-4 pb-4"><Text>Revenue grew compared with the previous quarter.</Text>{interactive && <output> Opened {opened} times</output>}</CardContent>}</Card></div>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const TitleOnly: Story = { args: { subtitleText: undefined, additionalText: undefined, showContent: false } }
export const Subtitle: Story = { args: { additionalText: undefined, showContent: false } }
export const Status: Story = { args: { showContent: false } }
export const AvatarHeader: Story = { args: { avatarKind: "avatar", showContent: false } }
export const IconHeader: Story = { args: { avatarKind: "icon", showContent: false } }
export const HeaderAction: Story = { args: { action: true } }
export const InteractiveHeader: Story = { args: { interactive: true } }
export const WithContent: Story = { args: { avatarKind: "icon" } }
export const WithoutHeader: Story = { args: { showHeader: false } }
export const LongTitle: Story = { args: { titleText: "Quarterly sales for all international markets and product categories" } }
export const CustomTexts: Story = { args: { roleDescription: "Sales overview showHeader", accessibleName: "Sales performance", interactive: true } }
export const RTL: Story = { globals: { dir: "rtl" } }

export const German: Story = { globals: { locale: "de" } }
export const ContentTexts: Story = { args: { texts: { card: "Panel", content: "Panel content" } } }
export const HeaderTexts: Story = { render: args => <Card {...args}><CardHeader titleText="Shipping" titleLevel={2} texts={{ header: "Panel header", interactiveHeader: "Open panel", avatar: "Account portrait" }} /><CardContent>Shipping details</CardContent></Card> }
