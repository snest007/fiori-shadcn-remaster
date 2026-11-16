import * as React from "react"
import { ArgTypes, Controls, DocsContext, DocsStory, Primary, Title as DocsTitle } from "@storybook/addon-docs/blocks"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { DynamicPage, DynamicPageHeader, DynamicPageTitle, type DynamicPageProps } from "@/components/ui/dynamic-page"
import { Bar } from "@/components/ui/bar"
import { Breadcrumbs, BreadcrumbsItem } from "@/components/ui/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Title } from "@/components/ui/title"
import { Toolbar, ToolbarButton } from "@/components/ui/toolbar"
import { docsLink, fioriMeta } from "../_lib/meta"
const base = fioriMeta({ name: "dynamic-page", component: DynamicPage })
const meta = {
  ...base,
  parameters: { ...base.parameters, layout: "fullscreen", docs: { page: ItemDocs, story: { inline: false, height: "560px" } } },
  args: { headerSnapped: false, headerPinned: false, hidePinButton: false, showFooter: false, onTitleToggle: fn(), onPinButtonToggle: fn() },
  argTypes: { ...base.argTypes, headerSnapped: { control: "boolean" }, headerPinned: { control: "boolean" }, hidePinButton: { control: "boolean" }, showFooter: { control: "boolean" }, title: { control: false }, header: { control: false }, footer: { control: false }, subheader: { control: false }, accessibilityAttributes: { control: false }, texts: { control: false }, defaultHeaderPinned: { control: false }, defaultHeaderSnapped: { control: false }, scrollContainerRef: { control: false }, contentClassName: { control: false, table: { disable: true } }, onTitleToggle: { control: false }, onPinButtonToggle: { control: false } },
  render: function OrderPage(args: DynamicPageProps) {
    const [, updateArgs] = useArgs<DynamicPageProps>()
    return <DynamicPage {...args} className="h-screen" accessibilityAttributes={{ header: { role: "region", name: "Order overview header" }, content: { role: "region", name: "Order overview content" } }} onTitleToggle={(headerSnapped) => { args.onTitleToggle?.(headerSnapped); updateArgs({ headerSnapped }) }} onPinButtonToggle={(headerPinned) => { args.onPinButtonToggle?.(headerPinned); updateArgs({ headerPinned }) }} title={<DynamicPageTitle heading={<Title level="H1" size="H3">Purchase order 1001</Title>} snappedHeading={<Title level="H1" size="H4">Purchase order 1001</Title>} subheading={<Label>Supplier: Northwind Traders</Label>} snappedSubheading={<Label>Northwind Traders</Label>} breadcrumbs={<Breadcrumbs aria-label="Order trail"><BreadcrumbsItem href="#orders">Purchase orders</BreadcrumbsItem><BreadcrumbsItem>Order 1001</BreadcrumbsItem></Breadcrumbs>} actions={<Toolbar aria-label="Order actions" design="transparent"><ToolbarButton variant="emphasized">Edit</ToolbarButton><ToolbarButton onClick={() => updateArgs({ showFooter: !args.showFooter })}>Toggle footer</ToolbarButton></Toolbar>}><Label>Delivery confirmed</Label></DynamicPageTitle>} header={<DynamicPageHeader accessibleName="Order delivery details"><div className="flex flex-wrap gap-8"><Label>Manufacturer: Robotech</Label><Label>Factory: Orlando</Label><Label>Delivery: Confirmed</Label></div></DynamicPageHeader>} footer={<Bar design="floating-footer" endContent={<><Button variant="emphasized">Confirm</Button><Button>Cancel</Button></>} />}><div className="grid gap-4">{Array.from({ length: 30 }, (_, index) => <p key={index}>Order line {index + 1}: Confirm the product, quantity and delivery information.</p>)}</div></DynamicPage>
  },
} satisfies Meta<typeof DynamicPage>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Expanded: Story = {}
export const Snapped: Story = { args: { headerSnapped: true } }
export const Footer: Story = { args: { showFooter: true } }
export const SnappedFooter: Story = { args: { showFooter: true, headerSnapped: true } }
export const Pinned: Story = { args: { headerPinned: true } }
export const WithoutPin: Story = { args: { hidePinButton: true } }
export const CustomTexts: Story = { args: { texts: { expandHeader: "Show order details", collapseHeader: "Hide order details", pinHeader: "Keep order details visible", unpinHeader: "Allow order details to collapse", headerExpanded: "Order details expanded", headerSnapped: "Order details collapsed", toggleHeader: "Toggle order details" } } }
export const RTL: Story = { globals: { dir: "rtl" } }

const textKeys = [
  [
    "texts.headerExpanded",
    "DYNAMIC_PAGE_ARIA_LABEL_EXPANDED_HEADER",
    "Header Expanded"
  ],
  [
    "texts.headerSnapped",
    "DYNAMIC_PAGE_ARIA_LABEL_SNAPPED_HEADER",
    "Header Snapped"
  ],
  [
    "texts.expandHeader",
    "DYNAMIC_PAGE_ARIA_LABEL_EXPAND_HEADER",
    "Expand Header"
  ],
  [
    "texts.collapseHeader",
    "DYNAMIC_PAGE_ARIA_LABEL_SNAP_HEADER",
    "Collapse Header"
  ],
  [
    "texts.pinHeader",
    "DYNAMIC_PAGE_ARIA_LABEL_PIN_HEADER",
    "Pin Header"
  ],
  [
    "texts.unpinHeader",
    "DYNAMIC_PAGE_ARIA_LABEL_UNPIN_HEADER",
    "Unpin Header"
  ],
  [
    "texts.toggleHeader",
    "DYNAMIC_PAGE_ARIA_DESCR_TOGGLE_HEADER",
    "Toggle Header"
  ]
]
// Source: registry/items/dynamic-page.json and registry/ui/dynamic-page.tsx; story-local docs preserve the S0 fiori metadata.
const guide = {
  "description": "Fiori dynamic page: sticky title (heading, breadcrumbs, KPIs, actions), header that snaps on scroll, expand/collapse and pin buttons, floating footer.",
  "usage": {
    "summary": "Compose a page with a structured title, collapsing header, scrolling content and optional finalizing footer.",
    "useWhen": [
      "Work with business content while keeping essential context and page actions available as the header collapses.",
      "Build a freestyle full-screen page or a page inside one FlexibleColumnLayout column.",
      "Keep filters or supporting header information accessible through expansion and pinning; leave page actions available when the header is snapped."
    ],
    "avoidWhen": [
      {
        "when": "Need only a header bar, scrolling content and footer without structured collapsing header content.",
        "use": [
          "page"
        ]
      },
      {
        "when": "Organize one object into sections with anchor or tab navigation.",
        "use": [
          "object-page"
        ]
      },
      {
        "when": "Start from a complete record-search page with saved filters, results and mass actions.",
        "use": [
          "list-report"
        ]
      },
      {
        "when": "Show a product-home greeting or hero that scrolls away (5.75rem/92px minimum height; 24rem/384px recommended maximum).",
        "use": [
          "hero-banner"
        ]
      }
    ],
    "source": "sap-fiori-guidelines"
  }
}
const accessibilityNote = "accessibilityAttributes names and sets roles on root, header, content and footer; use named regions when embedding in an existing main. The title is a button with aria-expanded and a toggle description while a header exists. Enter/Space, expand and pin controls update header state and preserve focus."
function ItemDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs") && !story.usesMount).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @fiori/dynamic-page"
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
