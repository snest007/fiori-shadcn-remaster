import * as React from "react"
import { ArgTypes, Controls, DocsContext, DocsStory, Primary, Title as DocsTitle } from "@storybook/addon-docs/blocks"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Breadcrumbs, BreadcrumbsItem, type BreadcrumbsProps } from "@/components/ui/breadcrumbs"
import { Button } from "@/components/ui/button"
import { docsLink, fioriMeta } from "../_lib/meta"
const base = fioriMeta({ name: "breadcrumbs", component: Breadcrumbs })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: ItemDocs } },
  args: { design: "standard", separators: "slash", "aria-label": "Purchase order trail", overflowOpen: false, overflowLabel: "More", overflowListLabel: "Available Values", onOverflowOpenChange: fn() },
  argTypes: { ...base.argTypes, design: { control: "inline-radio", options: ["standard", "no-current-page"] }, separators: { control: "select", options: ["slash", "double-slash", "back-slash", "double-back-slash", "greater-than", "double-greater-than"] }, overflowOpen: { control: "boolean" }, overflowLabel: { control: "text" }, overflowListLabel: { control: "text" }, positionText: { control: false }, defaultOverflowOpen: { control: false }, overflowContentProps: { control: false }, onOverflowOpenChange: { control: false } },
  render: function OrderTrail(args: BreadcrumbsProps) {
    const [, updateArgs] = useArgs<BreadcrumbsProps>()
    return <Breadcrumbs {...args} onOverflowOpenChange={(overflowOpen) => { args.onOverflowOpenChange?.(overflowOpen); updateArgs({ overflowOpen }) }}><BreadcrumbsItem href="#home">Home</BreadcrumbsItem><BreadcrumbsItem href="#purchasing">Purchasing</BreadcrumbsItem><BreadcrumbsItem href="#orders">Purchase orders</BreadcrumbsItem><BreadcrumbsItem>Order 1001</BreadcrumbsItem></Breadcrumbs>
  },
} satisfies Meta<typeof Breadcrumbs>
export default meta
type Story = StoryObj<typeof meta>
const narrow: Story["decorators"] = [(Story) => <div className="w-64 max-w-full"><Story /></div>]
export const Playground: Story = {}
export const Slash: Story = {}
export const DoubleSlash: Story = { args: { separators: "double-slash" } }
export const BackSlash: Story = { args: { separators: "back-slash" } }
export const DoubleBackSlash: Story = { args: { separators: "double-back-slash" } }
export const GreaterThan: Story = { args: { separators: "greater-than" } }
export const DoubleGreaterThan: Story = { args: { separators: "double-greater-than" } }
export const NoCurrentPage: Story = { args: { design: "no-current-page" } }
export const CurrentPageLink: Story = { render: function CurrentPageLinkTrail(args) { const [, updateArgs] = useArgs<BreadcrumbsProps>(); return <Breadcrumbs {...args} onOverflowOpenChange={(overflowOpen) => { args.onOverflowOpenChange?.(overflowOpen); updateArgs({ overflowOpen }) }}><BreadcrumbsItem href="#home">Home</BreadcrumbsItem><BreadcrumbsItem href="#orders">Orders</BreadcrumbsItem><BreadcrumbsItem href="#order-1001">Order 1001</BreadcrumbsItem></Breadcrumbs> } }
export const Overflow: Story = { decorators: narrow }
export const OverflowNoCurrentPage: Story = { decorators: narrow, args: { design: "no-current-page" } }
export const OverflowCurrentPageLink: Story = { decorators: narrow, render: function OverflowCurrentPageLinkTrail(args) { const [, updateArgs] = useArgs<BreadcrumbsProps>(); return <Breadcrumbs {...args} onOverflowOpenChange={(overflowOpen) => { args.onOverflowOpenChange?.(overflowOpen); updateArgs({ overflowOpen }) }}><BreadcrumbsItem href="#home">Home</BreadcrumbsItem><BreadcrumbsItem href="#purchasing">Purchasing</BreadcrumbsItem><BreadcrumbsItem href="#orders">Purchase orders</BreadcrumbsItem><BreadcrumbsItem href="#order-1001">Order 1001</BreadcrumbsItem></Breadcrumbs> } }
export const Open: Story = { decorators: narrow, args: { overflowOpen: true }, parameters: { docs: { story: { inline: false, height: "340px" } } } }
export const HiddenMiddle: Story = { decorators: narrow, render: function HiddenMiddleTrail(args) { const [, updateArgs] = useArgs<BreadcrumbsProps>(); return <Breadcrumbs {...args} onOverflowOpenChange={(overflowOpen) => { args.onOverflowOpenChange?.(overflowOpen); updateArgs({ overflowOpen }) }}><BreadcrumbsItem href="#home">Home</BreadcrumbsItem><BreadcrumbsItem hidden href="#obsolete">Obsolete category</BreadcrumbsItem><BreadcrumbsItem href="#purchasing">Purchasing</BreadcrumbsItem><BreadcrumbsItem href="#orders">Purchase orders</BreadcrumbsItem><BreadcrumbsItem>Order 1001</BreadcrumbsItem></Breadcrumbs> } }
export const HiddenMiddleOpen: Story = { ...HiddenMiddle, args: { overflowOpen: true }, render: function HiddenMiddleOpenTrail(args) { const [, updateArgs] = useArgs<BreadcrumbsProps>(); return <Breadcrumbs {...args} onOverflowOpenChange={(overflowOpen) => { args.onOverflowOpenChange?.(overflowOpen); updateArgs({ overflowOpen }) }}><BreadcrumbsItem href="#home">Home</BreadcrumbsItem><BreadcrumbsItem hidden href="#obsolete">Obsolete category</BreadcrumbsItem><BreadcrumbsItem href="#purchasing">Purchasing</BreadcrumbsItem><BreadcrumbsItem href="#orders">Purchase orders</BreadcrumbsItem><BreadcrumbsItem>Order 1001</BreadcrumbsItem></Breadcrumbs> }, parameters: { docs: { story: { inline: false, height: "340px" } } } }
export const CustomTexts: Story = { decorators: narrow, args: { overflowLabel: "Previous locations", overflowListLabel: "Purchase order locations", positionText: (position, size) => `Location ${position} of ${size}` } }
export const RTL: Story = { globals: { dir: "rtl" }, decorators: narrow }

// Source-backed defaults from registry/ui/breadcrumbs.tsx and the installed UI5 bundles.
const textKeys = [
  [
    "positionText",
    "BREADCRUMB_ITEM_POS",
    "{0} of {1}"
  ],
  [
    "overflowLabel",
    "BREADCRUMBS_OVERFLOW_ARIA_LABEL",
    "More"
  ],
  [
    "overflowListLabel",
    "FORM_SELECTABLE_AVALIABLE_VALUES",
    "Available Values"
  ]
]
// Source: registry/items/breadcrumbs.json and registry/ui/breadcrumbs.tsx; story-local docs preserve the S0 fiori metadata.
const guide = {
  "description": "Fiori breadcrumbs with responsive leading overflow, UI5 separator styles and arrow-key navigation.",
  "usage": {
    "summary": "Show the current location and let users return to ancestors in the navigation path.",
    "useWhen": [
      "Help users understand their location after drilling down and return to an ancestor.",
      "Use a consistent hierarchy across pages; for fixed hierarchies, show the same path regardless of how users arrived."
    ],
    "avoidWhen": [
      {
        "when": "Choose application modules or primary destinations rather than return along a location path.",
        "use": [
          "side-navigation"
        ]
      },
      {
        "when": "Switch between content facets within the current page.",
        "use": [
          "tabs"
        ]
      }
    ],
    "source": "ui5-apidoc"
  }
}
const accessibilityNote = "The nav receives native aria-label. Links retain aria-current and positionText. One Tab stop enters the trail; Arrow keys, Home and End move, Enter or Space activates, F4 or Alt+Arrow opens overflowing locations and Escape returns focus."
function ItemDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs") && !story.usesMount).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @petalo/breadcrumbs"
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

export const German: Story = { globals: { locale: "de" } }
export const PositionTexts: Story = { args: { texts: { breadcrumbTrail: "Navigation path", overflow: "Earlier locations", position: (position, size) => `${position} among ${size}` } } }
