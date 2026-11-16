import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Controls, DocsContext, DocsStory, Primary, Title } from "@storybook/addon-docs/blocks"
import AppShell from "@/components/blocks/app-shell"
import { Button } from "@/components/ui/button"
const meta = {
  title: "Floorplans/App Shell",
  component: AppShell,
  tags: ["autodocs"],
  parameters: { fiori: { name: "app-shell" }, layout: "fullscreen", docs: { page: BlockDocs, story: { inline: false, height: "720px" } } },
  argTypes: { children: { control: false, table: { disable: true } }, sideNavigation: { control: false, table: { disable: true } } },
  render: () => <AppShell />,
} satisfies Meta<typeof AppShell>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const RTL: Story = { globals: { dir: "rtl" } }

// Source: registry/block-items/app-shell.json. Keep complete G2 guidance local:
// shared DocsPage only resolves registry/items and requires an owning demo.
const guide = {
  "title": "App Shell",
  "description": "SAP Fiori launchpad-style shell: a ShellBar wired to notifications, user menu and product switch popovers, with a side navigation slot and a content area.",
  "registryDependencies": [
    "@fiori/icons",
    "@fiori/avatar",
    "@fiori/button",
    "@fiori/card",
    "@fiori/notification-list",
    "@fiori/popover",
    "@fiori/product-switch",
    "@fiori/search",
    "@fiori/shell-bar",
    "@fiori/text",
    "@fiori/title",
    "@fiori/user-menu",
    "@fiori/f6-navigation"
  ],
  "usage": {
    "summary": "Frame application pages with shared shell actions, optional side navigation and a scrolling content area.",
    "useWhen": [
      "Let users work across application pages while retaining global search, notifications, profile and product access.",
      "Keep global shell actions available as users navigate between business tasks.",
      "Provide an application frame around page content, with optional persistent side navigation."
    ],
    "avoidWhen": [
      {
        "when": "Compose your own header, vertical navigation and content without the sample shell integrations.",
        "use": [
          "navigation-layout"
        ]
      },
      {
        "when": "Build an entry point with selected business-area navigation and app-tile content.",
        "use": [
          "launchpad"
        ]
      },
      {
        "when": "Build the business page itself: filter records, inspect one object, or browse an adjacent list and detail.",
        "use": [
          "list-report",
          "object-page-floorplan",
          "master-detail"
        ]
      },
      {
        "when": "Show an empty or recovery view within a frame that already exists.",
        "use": [
          "empty-states"
        ]
      }
    ],
    "source": "sap-fiori-guidelines",
    "layout": [
      "viewport frame",
      "  header: ShellBar with ShellBarBranding, ShellBarSearch, SearchItem, Avatar and ShellBarItem",
      "    menu trigger: Button with Icon when side navigation is a render function",
      "  notification surface: Popover with PopoverAnchor and PopoverContent",
      "    header: PopoverHeader with PopoverTitle",
      "    body: PopoverBody with NotificationList",
      "      groups: NotificationListGroupItem with NotificationListItem",
      "  product surface: Popover with PopoverAnchor and PopoverContent",
      "    body: PopoverBody with ProductSwitch and ProductSwitchItem",
      "  profile surface: UserMenu with UserMenuItem",
      "  body: optional caller-supplied side navigation beside scrolling main content",
      "    default content: Card with Title and Text; replaced by children"
    ],
    "variations": [
      "Supply page content as children and sideNavigation as a node or render function; the render function connects collapsed state to the menu button.",
      "Replace the sample account, search results, product targets and notification data and handlers with application services; preserve shell openers and focus return.",
      "Omit sideNavigation for a page that needs no navigation rail; the menu trigger is then absent."
    ]
  }
}
function BlockDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs")).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @fiori/app-shell"
  return <main><Title /><p>{guide.description}</p>
    <section aria-label="Install floorplan"><h2>Install</h2><div className="flex items-center gap-3"><pre><code>{command}</code></pre><Button aria-label="Copy install command" onClick={async () => { await navigator.clipboard.writeText(command); setCopied(true) }}>{copied ? "Copied" : "Copy"}</Button></div><span role="status" className="sr-only">{copied ? "Install command copied" : ""}</span></section>
    <section aria-label="Usage guidance"><p>{guide.usage.summary}</p><h2>When to use</h2><ul>{guide.usage.useWhen.map((text) => <li key={text}>{text}</li>)}</ul><h2>Don't use</h2><ul>{guide.usage.avoidWhen.map((entry) => <li key={entry.when}>{entry.when} Alternatives: {entry.use.join(", ")}.</li>)}</ul></section>
    <section aria-label="Floorplan structure"><h2>Layout</h2><pre>{guide.usage.layout.join("\n")}</pre><h2>Adapt the example</h2><ul>{guide.usage.variations.map((text) => <li key={text}>{text}</li>)}</ul></section>
    <section aria-label="Accessibility"><h2>Accessibility</h2><p>Use Tab and Shift+Tab to reach actions and fields. Composite controls retain their own arrow-key navigation, names and selection states. Keep existing field labels, section identities, dialog titles and focus return when adapting the block.</p><p>The real block runs with its default inline data. Its sample recovery, submit and navigation handlers must be connected to application services for production use.</p></section>
    <section aria-label="Localization"><h2>Localization</h2><p>The Direction toolbar and RTL story exercise the real floorplan. Adapt the block's inline application labels and data for the target locale; component text props remain available in the installed source. Text keys and UI5 defaults are documented on each component's Docs page.</p></section>
    <h2>Playground</h2><div data-fiori-primary><Primary /></div><div data-fiori-controls><Controls /></div>
    <h2>Examples</h2>{variants.map((story) => <DocsStory key={story.id} of={story.moduleExport} __forceInitialArgs={false} />)}
  </main>
}
