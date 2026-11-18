import * as React from "react"
import { ArgTypes, Controls, DocsContext, DocsStory, Primary, Title as DocsTitle } from "@storybook/addon-docs/blocks"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { FlexibleColumnLayout, useFlexibleColumnLayout, type FlexibleColumnLayoutProps, type FCLLayout } from "@/components/ui/flexible-column-layout"
import { Bar } from "@/components/ui/bar"
import { Button } from "@/components/ui/button"
import { List, ListItemStandard } from "@/components/ui/list"
import { Title } from "@/components/ui/title"
import { docsLink, fioriMeta } from "../_lib/meta"
const layouts: FCLLayout[] = ["OneColumn", "TwoColumnsStartExpanded", "TwoColumnsMidExpanded", "ThreeColumnsMidExpanded", "ThreeColumnsEndExpanded", "ThreeColumnsStartExpandedEndHidden", "ThreeColumnsMidExpandedEndHidden", "ThreeColumnsStartHiddenMidExpanded", "ThreeColumnsStartHiddenEndExpanded", "MidColumnFullScreen", "EndColumnFullScreen"]
type Args = FlexibleColumnLayoutProps & { width: number }
const base = fioriMeta({ name: "flexible-column-layout", component: FlexibleColumnLayout })
const meta = {
  ...base,
  parameters: { ...base.parameters, fiori: { ...base.parameters.fiori, ownsLandmarks: true }, layout: "fullscreen", docs: { page: ItemDocs, story: { inline: false, height: "540px" } } },
  // This full-page composition owns a native main in story mode. Docs owns its
  // main already, so inline Playground content keeps a neutral wrapper there.
  decorators: [(Story, context) => context.viewMode === "story" ? <main aria-label="Order workspace"><Story /></main> : <div><Story /></div>],
  args: { layout: "ThreeColumnsMidExpanded", width: 1100, disableResizing: false, disableAnimation: false, onLayoutChange: fn(), onLayoutConfigurationChange: fn(), onMediaChange: fn() },
  argTypes: { ...base.argTypes, layout: { control: "select", options: layouts }, width: { control: { type: "number", min: 400, max: 1600 } }, disableResizing: { control: "boolean" }, disableAnimation: { control: "boolean" }, startColumn: { control: false }, midColumn: { control: false }, endColumn: { control: false }, defaultLayout: { control: false }, layoutsConfiguration: { control: "object" }, accessibilityAttributes: { control: false }, onLayoutChange: { control: false }, onLayoutConfigurationChange: { control: false }, onMediaChange: { control: false } },
  render: function OrderColumns(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const [order, setOrder] = React.useState("Order 1001")
    const [item, setItem] = React.useState("Notebook Basic 15")
    const { width, ...props } = args
    return <div className="max-w-full overflow-x-auto"><FlexibleColumnLayout {...props} style={{ width, height: "32rem" }} onLayoutChange={(detail) => { args.onLayoutChange?.(detail); updateArgs({ layout: detail.layout }) }} accessibilityAttributes={{ startColumn: { role: "region", name: "Orders" }, midColumn: { role: "region", name: "Order detail" }, endColumn: { role: "region", name: "Item detail" }, ...args.accessibilityAttributes }} startColumn={<div><Bar><Title level="H1" size="H4">Orders</Title></Bar><List aria-label="Orders" selectionMode="single" value={[order]} onItemClick={(value) => { setOrder(value); updateArgs({ layout: "TwoColumnsMidExpanded" }) }}>{["Order 1001", "Order 1002", "Order 1003"].map((value) => <ListItemStandard key={value} value={value} text={value} type="navigation" />)}</List></div>} midColumn={<div><Bar endContent={<Button onClick={() => updateArgs({ layout: "MidColumnFullScreen" })}>Full screen</Button>}><Title level="H2" size="H4">{order}</Title></Bar><List aria-label="Order items" onItemClick={(value) => { setItem(value); updateArgs({ layout: "ThreeColumnsEndExpanded" }) }}>{["Notebook Basic 15", "Wireless mouse", "USB-C dock"].map((value) => <ListItemStandard key={value} value={value} text={value} type="navigation" />)}</List></div>} endColumn={<div><Bar endContent={<Button onClick={() => updateArgs({ layout: "TwoColumnsMidExpanded" })}>Close item</Button>}><Title level="H2" size="H4">Item</Title></Bar><p className="p-4">{item}: Delivery confirmed.</p></div>} /></div>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
// Inline is required for live Controls; the full-page variants retain isolated previews.
export const Playground: Story = { parameters: { docs: { story: { inline: true } } } }
export const OneColumn: Story = { args: { layout: "OneColumn" } }
export const TwoColumnsStartExpanded: Story = { args: { layout: "TwoColumnsStartExpanded" } }
export const TwoColumnsMidExpanded: Story = { args: { layout: "TwoColumnsMidExpanded" } }
export const ThreeColumnsMidExpanded: Story = {}
export const ThreeColumnsEndExpanded: Story = { args: { layout: "ThreeColumnsEndExpanded" } }
export const ThreeColumnsStartExpandedEndHidden: Story = { args: { layout: "ThreeColumnsStartExpandedEndHidden" } }
export const ThreeColumnsMidExpandedEndHidden: Story = { args: { layout: "ThreeColumnsMidExpandedEndHidden" } }
export const ThreeColumnsStartHiddenMidExpanded: Story = { args: { layout: "ThreeColumnsStartHiddenMidExpanded" } }
export const ThreeColumnsStartHiddenEndExpanded: Story = { args: { layout: "ThreeColumnsStartHiddenEndExpanded" } }
export const MidColumnFullScreen: Story = { args: { layout: "MidColumnFullScreen" } }
export const EndColumnFullScreen: Story = { args: { layout: "EndColumnFullScreen" } }
export const Tablet: Story = { args: { width: 800, layout: "TwoColumnsMidExpanded" } }
export const Phone: Story = { args: { width: 500, layout: "TwoColumnsMidExpanded" } }
export const DisableResizing: Story = { args: { disableResizing: true } }
export const CustomTexts: Story = { args: { accessibilityAttributes: { startColumn: { role: "region", name: "Purchase orders" }, midColumn: { role: "region", name: "Selected purchase order" }, endColumn: { role: "region", name: "Selected order item" }, startSeparator: { name: "Resize orders and detail" }, endSeparator: { name: "Resize order and item" }, startArrow: { name: "Show or hide purchase orders" } } } }
export const RTL: Story = { globals: { dir: "rtl" } }
export const HookNavigation: Story = { render: function RelatedColumns() { const fcl = useFlexibleColumnLayout(); return <FlexibleColumnLayout {...fcl.layoutProps} className="h-screen" startColumn={<div className="p-4"><Title level="H1" size="H3">Orders</Title><Button onClick={() => fcl.navigate(1)}>Open order 1001</Button></div>} midColumn={<div className="p-4"><Title level="H2">Order 1001</Title><Button onClick={() => fcl.navigate(2)}>Open item</Button>{fcl.actions.midColumn.closeColumn && <Button onClick={fcl.actions.midColumn.closeColumn}>Close order</Button>}{fcl.actions.midColumn.fullScreen && <Button onClick={fcl.actions.midColumn.fullScreen}>Full screen order</Button>}{fcl.actions.midColumn.exitFullScreen && <Button onClick={fcl.actions.midColumn.exitFullScreen}>Exit full screen</Button>}</div>} endColumn={<div className="p-4"><Title level="H2">Notebook Basic 15</Title>{fcl.actions.endColumn.closeColumn && <Button onClick={fcl.actions.endColumn.closeColumn}>Close item</Button>}</div>} /> } }

// Source-backed defaults from registry/ui/flexible-column-layout.tsx and the installed UI5 bundles.
const textKeys = [
  [
    "accessibilityAttributes.startColumn.name",
    "FCL_START_COLUMN_TXT",
    "First column"
  ],
  [
    "accessibilityAttributes.midColumn.name",
    "FCL_MIDDLE_COLUMN_TXT",
    "Middle column"
  ],
  [
    "accessibilityAttributes.endColumn.name",
    "FCL_END_COLUMN_TXT",
    "Last column"
  ],
  [
    "accessibilityAttributes.startSeparator.name",
    "FCL_START_SEPARATOR_TOOLTIP",
    "Resize between start and mid columns"
  ],
  [
    "accessibilityAttributes.endSeparator.name",
    "FCL_END_SEPARATOR_TOOLTIP",
    "Resize between mid and end columns"
  ],
  [
    "accessibilityAttributes.startArrow.name",
    "FCL_START_ARROW_TOOLTIP",
    "Switch between start and middle column layouts"
  ]
]
// Source: registry/items/flexible-column-layout.json and registry/ui/flexible-column-layout.tsx; story-local docs preserve the S0 fiori metadata.
const guide = {
  "description": "Fiori list-detail-detail layout with up to three columns, resizable separators, responsive column count and the useFlexibleColumnLayout navigation helper.",
  "usage": {
    "summary": "Show up to three related pages in responsive list, detail and sub-detail columns.",
    "useWhen": [
      "Browse a record list, its selected object and a related sub-object while retaining their relationship.",
      "Keep related pages adjacent when space permits: one column at 599px or less, up to two at 600–1023px and up to three at 1024px or more; resized columns stay at least 248px wide.",
      "Use useFlexibleColumnLayout to coordinate navigation levels and full-screen, exit-full-screen and close actions in a custom page composition."
    ],
    "avoidWhen": [
      {
        "when": "Show noncritical supporting context beside or below one task instead of navigating between related pages.",
        "use": [
          "dynamic-side-content"
        ]
      },
      {
        "when": "Start from a complete searchable list, selected detail and sub-detail example.",
        "use": [
          "master-detail"
        ]
      },
      {
        "when": "Read or edit one object across sections without a list-detail navigation hierarchy.",
        "use": [
          "object-page"
        ]
      },
      {
        "when": "Switch between application sections through vertical navigation.",
        "use": [
          "navigation-layout"
        ]
      }
    ],
    "source": "ui5-apidoc"
  }
}
const accessibilityNote = "accessibilityAttributes names columns, separators and the start arrow. Separators retain orientation, current value and keyboard resizing, mirrored in RTL. Column actions must remain named and preserve list/detail selection as layouts change."
function ItemDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs") && !story.usesMount).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @petalo/flexible-column-layout"
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
