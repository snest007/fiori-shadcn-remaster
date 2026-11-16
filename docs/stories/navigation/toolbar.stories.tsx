import * as React from "react"
import { ArgTypes, Controls, DocsContext, DocsStory, Primary, Title as DocsTitle } from "@storybook/addon-docs/blocks"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { Toolbar, ToolbarButton, ToolbarItem, ToolbarSeparator, ToolbarSpacer } from "@/components/ui/toolbar"
import { Title } from "@/components/ui/title"
import { Icon } from "@/components/ui/icon"
import { action } from "@/lib/fiori-icons"
import { Button } from "@/components/ui/button"
import { docsLink, fioriMeta } from "../_lib/meta"
const base = fioriMeta({ name: "toolbar", component: Toolbar })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: ItemDocs } },
  args: { design: "solid", alignContent: "end", "aria-label": "Purchase order actions", overflowButtonLabel: "Additional Options", overflowPopoverLabel: "Available Values", onClick: fn() },
  argTypes: { ...base.argTypes, design: { control: "inline-radio", options: ["solid", "transparent"] }, alignContent: { control: "inline-radio", options: ["start", "end"] }, overflowButtonLabel: { control: "text" }, overflowPopoverLabel: { control: "text" }, defaultOverflowOpen: { control: "boolean" }, overflowContentProps: { control: false }, onClick: { control: false } },
  render: (args) => <Toolbar {...args}><ToolbarButton>Edit</ToolbarButton><ToolbarButton>Share</ToolbarButton><ToolbarButton>Delete</ToolbarButton></Toolbar>,
} satisfies Meta<typeof Toolbar>
export default meta
type Story = StoryObj<typeof meta>
const narrow: Story["decorators"] = [(Story) => <div className="w-60 max-w-full"><Story /></div>]
export const Playground: Story = {}
export const Buttons: Story = {}
export const AlignStart: Story = { args: { alignContent: "start" } }
export const Transparent: Story = { args: { design: "transparent" } }
export const WithSpacer: Story = { render: (args) => <Toolbar {...args}><ToolbarItem><Title level="H2" size="H5">Products</Title></ToolbarItem><ToolbarSpacer /><ToolbarButton>Add</ToolbarButton><ToolbarButton>Delete</ToolbarButton></Toolbar> }
export const WithSeparators: Story = { render: (args) => <Toolbar {...args}><ToolbarButton>Edit</ToolbarButton><ToolbarSeparator /><ToolbarButton>Copy</ToolbarButton><ToolbarButton>Paste</ToolbarButton><ToolbarSeparator /><ToolbarButton>Delete</ToolbarButton></Toolbar> }
export const FixedSpacer: Story = { render: (args) => <Toolbar {...args}><ToolbarButton>Edit</ToolbarButton><ToolbarSpacer width="2rem" /><ToolbarButton>Delete</ToolbarButton></Toolbar> }
export const Overflow: Story = { decorators: narrow, render: (args) => <Toolbar {...args}><ToolbarButton>Edit</ToolbarButton><ToolbarSeparator /><ToolbarButton>Copy</ToolbarButton><ToolbarButton>Paste</ToolbarButton><ToolbarSeparator /><ToolbarButton>Delete</ToolbarButton></Toolbar> }
export const AlwaysOverflow: Story = { decorators: narrow, render: (args) => <Toolbar {...args}><ToolbarButton>Edit</ToolbarButton><ToolbarButton overflowPriority="alwaysOverflow">Share</ToolbarButton><ToolbarButton>Delete</ToolbarButton></Toolbar> }
export const NeverOverflow: Story = { decorators: narrow, render: (args) => <Toolbar {...args}><ToolbarButton>Edit</ToolbarButton><ToolbarButton>Copy</ToolbarButton><ToolbarButton>Paste</ToolbarButton><ToolbarButton>Delete</ToolbarButton><ToolbarButton overflowPriority="neverOverflow" aria-label="Share" size="icon"><Icon icon={action} /></ToolbarButton></Toolbar> }
export const Open: Story = { decorators: narrow, render: (args) => <Toolbar {...args}><ToolbarButton>Edit</ToolbarButton><ToolbarSeparator /><ToolbarButton>Copy</ToolbarButton><ToolbarButton>Paste</ToolbarButton><ToolbarSeparator /><ToolbarButton>Delete</ToolbarButton></Toolbar>, args: { defaultOverflowOpen: true }, parameters: { docs: { story: { inline: false, height: "340px" } } } }
export const ScrollableOverflow: Story = { args: { defaultOverflowOpen: true, overflowContentProps: { style: { maxHeight: "10rem" } } }, decorators: narrow, render: (args) => <Toolbar {...args}>{Array.from({ length: 12 }, (_, index) => <ToolbarButton key={index} overflowPriority="alwaysOverflow">Action {index + 1}</ToolbarButton>)}</Toolbar>, parameters: { docs: { story: { inline: false, height: "340px" } } } }
export const CustomTexts: Story = { decorators: narrow, render: (args) => <Toolbar {...args}><ToolbarButton>Edit</ToolbarButton><ToolbarButton overflowPriority="alwaysOverflow">Share</ToolbarButton><ToolbarButton>Delete</ToolbarButton></Toolbar>, args: { overflowButtonLabel: "More order actions", overflowPopoverLabel: "Order actions" } }
export const RTL: Story = { decorators: narrow, render: (args) => <Toolbar {...args}><ToolbarButton>Edit</ToolbarButton><ToolbarSeparator /><ToolbarButton>Copy</ToolbarButton><ToolbarButton>Paste</ToolbarButton><ToolbarSeparator /><ToolbarButton>Delete</ToolbarButton></Toolbar>, globals: { dir: "rtl" } }

// Source-backed defaults from registry/ui/toolbar.tsx and the installed UI5 bundles.
const textKeys = [
  [
    "overflowButtonLabel",
    "TOOLBAR_OVERFLOW_BUTTON_ARIA_LABEL",
    "Additional Options"
  ],
  [
    "overflowPopoverLabel",
    "TOOLBAR_POPOVER_AVAILABLE_VALUES",
    "Available Values"
  ]
]
// Source: registry/items/toolbar.json and registry/ui/toolbar.tsx; story-local docs preserve the S0 fiori metadata.
const guide = {
  "description": "Fiori toolbar with priority-based overflow, stable arbitrary items, spacers, separators and UI5 arrow-key navigation.",
  "usage": {
    "summary": "Group related actions and controls in a horizontal row with keyboard navigation and responsive overflow.",
    "useWhen": [
      "Let users act on page content or selected items from one labeled group of controls.",
      "Keep secondary controls reachable through an overflow popover when the available width shrinks.",
      "Use overflowPriority=\"neverOverflow\" on ToolbarButton or ToolbarItem for main actions that must remain visible."
    ],
    "avoidWhen": [
      {
        "when": "Arrange a header or footer with independent start, centered and end content without toolbar navigation or overflow.",
        "use": [
          "bar"
        ]
      },
      {
        "when": "Provide product branding and global search, notifications or profile access on every screen.",
        "use": [
          "shell-bar"
        ]
      }
    ],
    "source": "ui5-apidoc"
  }
}
const accessibilityNote = "Native aria-label names the toolbar. Its actions retain their accessible names when moved into overflow; overflowButtonLabel and overflowPopoverLabel name that surface. One Tab stop enters; arrows and Home/End move. Escape closes overflow and restores focus."
function ItemDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs") && !story.usesMount).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @fiori/toolbar"
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
