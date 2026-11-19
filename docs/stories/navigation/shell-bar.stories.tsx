import * as React from "react"
import { ArgTypes, Controls, DocsContext, DocsStory, Primary, Title as DocsTitle } from "@storybook/addon-docs/blocks"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { ShellBar, ShellBarBranding, ShellBarItem, ShellBarMenuButton, ShellBarSpacer, type ShellBarProps } from "@/components/ui/shell-bar"
import { SearchItem, ShellBarSearch } from "@/components/ui/search"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { MenuItem } from "@/components/ui/menu"
import { Tag } from "@/components/ui/tag"
import { Text } from "@/components/ui/text"
import { Title } from "@/components/ui/title"
import { ToggleButton } from "@/components/ui/toggle-button"
import { da, menu2, product, sysHelp, travelExpense } from "@/lib/fiori-icons"
import { docsLink, fioriMeta } from "../_lib/meta"
type Args = ShellBarProps & { titleText: string; menuBranding: boolean; withStartButton: boolean; withLogo: boolean; withSearch: boolean; withProfile: boolean; withAssistant: boolean; minimal: boolean }
const base = fioriMeta({ name: "shell-bar", component: ShellBar })
const meta = {
  ...base,
  parameters: { ...base.parameters, fiori: { ...base.parameters.fiori, ownsLandmarks: true }, layout: "fullscreen", docs: { page: ItemDocs, story: { inline: false, height: "340px" } } },
  // ShellBarTemplate.js uses a native application header. Keep its banner above
  // a separate, meaningful main workspace rather than changing header semantics.
  // The Docs document already owns main; its inline component stays embedded.
  decorators: [(Story, context) => context.viewMode === "story" ? <><Story /><main aria-label="Purchase orders" className="grid gap-3 p-4"><Title level="H1" size="H3">Purchase orders</Title><Text>Review supplier confirmations and delivery dates for the purchasing team.</Text><section aria-label="Order summary"><Title level="H2" size="H4">Order 1001</Title><Text>Northwind Traders: Delivery confirmed. Three order lines are ready for review.</Text></section></main></> : <div><Story /></div>],
  args: { titleText: "Corporate portal", menuBranding: false, withStartButton: true, withLogo: true, withSearch: true, withProfile: true, withAssistant: true, minimal: false, searchExpanded: false, showNotifications: true, notificationsCount: "12", showProductSwitch: true, disableSearchCollapse: false, onSearchExpandedChange: fn(), onNotificationsClick: fn(), onProfileClick: fn(), onProductSwitchClick: fn(), onSearchButtonClick: fn(), onSearchFieldClear: fn(), onContentItemVisibilityChange: fn(), onBreakpointChange: fn() },
  argTypes: { ...base.argTypes, titleText: { control: "text" }, menuBranding: { control: "boolean" }, withStartButton: { control: "boolean" }, withLogo: { control: "boolean" }, withSearch: { control: "boolean" }, withProfile: { control: "boolean" }, withAssistant: { control: "boolean" }, minimal: { control: "boolean" }, searchExpanded: { control: "boolean" }, showNotifications: { control: "boolean" }, notificationsCount: { control: "text" }, showProductSwitch: { control: "boolean" }, disableSearchCollapse: { control: "boolean" }, branding: { control: false }, startButton: { control: false }, search: { control: false }, assistant: { control: false }, profile: { control: false }, content: { control: false }, texts: { control: false }, accessibilityAttributes: { control: false }, defaultSearchExpanded: { control: false }, onSearchExpandedChange: { control: false }, onNotificationsClick: { control: false }, onProfileClick: { control: false }, onProductSwitchClick: { control: false }, onSearchButtonClick: { control: false }, onSearchFieldClear: { control: false }, onContentItemVisibilityChange: { control: false }, onBreakpointChange: { control: false } },
  render: function PortalHeader(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const { titleText, menuBranding, withStartButton, withLogo, withSearch, withProfile, withAssistant, minimal, ...props } = args
    return <ShellBar {...props} onSearchExpandedChange={(searchExpanded) => { args.onSearchExpandedChange?.(searchExpanded); updateArgs({ searchExpanded }) }} startButton={withStartButton ? <Button variant="transparent" size="icon" aria-label="Toggle navigation" onClick={fn()}><Icon icon={menu2} /></Button> : undefined} branding={menuBranding ? <ShellBarMenuButton accessibleName={titleText} secondaryTitle="Purchasing" logo={withLogo ? <Icon icon={product} /> : undefined} menu={<><MenuItem>Purchasing</MenuItem><MenuItem>Sales orders</MenuItem></>}>{titleText}</ShellBarMenuButton> : <ShellBarBranding accessibleName={titleText} logo={withLogo ? <Icon icon={product} /> : undefined} href="#portal">{titleText}</ShellBarBranding>} content={!minimal ? <><Text key="app">Purchase orders</Text><ShellBarSpacer key="spacer" /><Tag key="trial">Trial</Tag></> : undefined} search={withSearch ? <ShellBarSearch accessibleName="Portal search"><SearchItem text="Laptop" /><SearchItem text="Lap desk" /></ShellBarSearch> : undefined} profile={withProfile ? <Avatar initials="AL" accessibleName="Alex Lee" /> : undefined} assistant={withAssistant ? <ToggleButton variant="transparent" size="icon" aria-label="Assistant" onPressedChange={fn()}><Icon icon={da} /></ToggleButton> : undefined}>{!minimal && <><ShellBarItem icon={sysHelp} text="Help" onClick={fn()} /><ShellBarItem icon={travelExpense} text="Expenses" count="3" onClick={fn()} /></>}</ShellBar>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
// Inline is required for live Controls; the full-page variants retain isolated previews.
export const Playground: Story = { parameters: { docs: { story: { inline: true } } } }
export const ExpandedSearch: Story = { args: { searchExpanded: true, disableSearchCollapse: true } }
export const Minimal: Story = { args: { minimal: true, withStartButton: false, withSearch: false, withAssistant: false, showNotifications: false, showProductSwitch: false } }
export const ApplicationMenu: Story = { args: { menuBranding: true } }
export const TitleOnly: Story = { args: { withLogo: false, minimal: true, withStartButton: false, withSearch: false, withAssistant: false, withProfile: false, showProductSwitch: false } }
export const Large: Story = { decorators: [(Story) => <div className="w-[92rem]"><Story /></div>], args: { searchExpanded: true } }
export const OverflowDot: Story = { decorators: [(Story) => <div className="w-72 max-w-full"><Story /></div>], args: { withStartButton: false, withSearch: false, withAssistant: false, notificationsCount: "5" } }
export const Small: Story = { decorators: [(Story) => <div className="w-80 max-w-full"><Story /></div>], args: { notificationsCount: "5" } }
export const CustomTexts: Story = { args: { texts: { label: "Procurement application header", notifications: (count) => `${count} purchasing updates`, profile: "Account settings", products: "Procurement applications", overflow: "More header actions", additionalInfo: "Purchase order context" } } }
export const RTL: Story = { globals: { dir: "rtl" } }

// Source-backed defaults from registry/ui/shell-bar.tsx and the installed UI5 bundles.
const textKeys = [
  [
    "texts.label",
    "SHELLBAR_LABEL",
    "Shell Bar"
  ],
  [
    "texts.notifications",
    "SHELLBAR_NOTIFICATIONS",
    "{0} Notifications"
  ],
  [
    "texts.notificationsNoCount",
    "SHELLBAR_NOTIFICATIONS_NO_COUNT",
    "Notifications"
  ],
  [
    "texts.profile",
    "SHELLBAR_PROFILE",
    "User Menu"
  ],
  [
    "texts.products",
    "SHELLBAR_PRODUCTS",
    "Products"
  ],
  [
    "texts.overflow",
    "SHELLBAR_OVERFLOW",
    "More"
  ],
  [
    "texts.assistant",
    "SHELLBAR_ASSISTANT",
    "Assistant"
  ],
  [
    "texts.search",
    "SHELLBAR_SEARCH",
    "Search"
  ],
  [
    "texts.cancel",
    "SEARCH_CANCEL_BUTTON",
    "Cancel"
  ],
  [
    "texts.additionalInfo",
    "SHELLBAR_ADDITIONAL_CONTEXT",
    "Additional Info"
  ]
]
// Source: registry/items/shell-bar.json and registry/ui/shell-bar.tsx; story-local docs preserve the S0 fiori metadata.
const guide = {
  "description": "Fiori application header with branding, content, collapsible search, notifications, custom items, overflow, profile and product switch (ui5-shellbar).",
  "usage": {
    "summary": "Provide a consistent product header with branding and global entry points.",
    "useWhen": [
      "Let users recognize the product and reach global search, notifications, profile and other products from every screen.",
      "Keep global functions available while the page content or navigation target changes.",
      "Provide search through ShellBarSearch and use profile, notification and product-switch callbacks to open the appropriate surfaces."
    ],
    "avoidWhen": [
      {
        "when": "Group actions that apply to page content or selected table items.",
        "use": [
          "toolbar"
        ]
      },
      {
        "when": "Arrange a local page or dialog header/footer in start, center and end areas without global product functions.",
        "use": [
          "bar"
        ]
      }
    ],
    "source": "sap-fiori-guidelines"
  }
}
const accessibilityNote = "texts.label names the shell navigation; branding needs accessibleName when its title is non-text or hidden. Icon actions have text-derived names; accessibilityAttributes advertises their popup states. Arrow keys and Home/End navigate shell actions. Popup content retains its own focus model."
function ItemDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs") && !story.usesMount).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @petalo/shell-bar"
  return <main><DocsTitle /><p>{guide.description}</p>
    <section aria-label="Install component"><div className="flex items-center gap-3"><pre><code>{command}</code></pre><Button aria-label="Copy install command" onClick={async () => { await navigator.clipboard.writeText(command); setCopied(true) }}>{copied ? "Copied" : "Copy"}</Button></div><span role="status" className="sr-only">{copied ? "Install command copied" : ""}</span></section>
    <section aria-label="Usage guidance"><p>{guide.usage.summary}</p><h2>When to use</h2><ul>{guide.usage.useWhen.map((text) => <li key={text}>{text}</li>)}</ul><h2>Don't use</h2><ul>{guide.usage.avoidWhen.map((entry) => <li key={entry.when}>{entry.when}{" "}{entry.use.map((alternative, index) => <React.Fragment key={alternative}>{index > 0 && ", "}<a href={docsLink(alternative)} target="_top">{alternative}</a></React.Fragment>)}</li>)}</ul></section>
    <section aria-label="Accessibility"><h2>Accessibility</h2><ul><li>{accessibilityNote}</li></ul></section>
    <section aria-label="Localization"><h2>Localization</h2>{textKeys.length ? <><p>Override these props for application terminology. Function texts receive their parameters in UI5 order.</p><table><thead><tr><th>Text prop / key</th><th>UI5 key</th><th>English default</th></tr></thead><tbody>{textKeys.map(([key, ui5, value]) => <tr key={key}><td><code>{key}</code></td><td>{ui5}</td><td>{value}</td></tr>)}</tbody></table></> : <p>Supply application labels and native accessible names through the component's content and aria props. The Direction toolbar applies RTL to each example.</p>}</section>
    <h2>Playground</h2><div data-fiori-primary><Primary /></div><div data-fiori-controls><Controls /></div>
    <h2>Props</h2><ArgTypes />
    <h2>Variants and examples</h2>{variants.map((story) => <DocsStory key={story.id} of={story.moduleExport} __forceInitialArgs={false} />)}
  </main>
}
