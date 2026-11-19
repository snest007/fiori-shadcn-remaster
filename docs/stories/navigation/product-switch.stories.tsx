import * as React from "react"
import { ArgTypes, Controls, DocsContext, DocsStory, Primary, Title as DocsTitle } from "@storybook/addon-docs/blocks"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { ProductSwitch, ProductSwitchItem } from "@/components/ui/product-switch"
import { Button } from "@/components/ui/button"
import { Popover, PopoverBody, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { home, customer, product, settings, travelExpense, sysHelp, actionSettings, grid } from "@/lib/fiori-icons"
import { docsLink, fioriMeta } from "../_lib/meta"
const products = [{ icon: home, title: "Home", subtitle: "Central Home" }, { icon: customer, title: "Customers", subtitle: "CRM" }, { icon: product, title: "Products", subtitle: "Catalog" }, { icon: travelExpense, title: "Travel and expenses", subtitle: "Travel" }, { icon: settings, title: "Settings", subtitle: "Preferences" }, { icon: sysHelp, title: "Support", subtitle: "Help portal" }, { icon: actionSettings, title: "Administration", subtitle: "Identity services" }, { icon: grid, title: "All applications", subtitle: "Application catalog" }]
type Args = React.ComponentProps<typeof ProductSwitch> & { count: number; selectedIndex: number; onActivate: (title: string) => void }
const base = fioriMeta({ name: "product-switch", component: ProductSwitch })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: ItemDocs } },
  args: { accessibleName: "Business applications", count: 5, selectedIndex: 1, onActivate: fn() },
  argTypes: { ...base.argTypes, accessibleName: { control: "text" }, count: { control: { type: "number", min: 0, max: 8 } }, selectedIndex: { control: { type: "number", min: -1, max: 7 }, description: "Initial selection. Changing this Control resets the product list." }, onActivate: { control: false } },
  render: (args) => <ProductSwitch key={`${args.count}-${args.selectedIndex}`} accessibleName={args.accessibleName}>{products.slice(0, args.count).map((item, index) => <ProductSwitchItem key={item.title} icon={item.icon} titleText={item.title} subtitleText={item.subtitle} selected={index === args.selectedIndex} onClick={() => args.onActivate(item.title)} />)}</ProductSwitch>,
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const TwoColumns: Story = { args: { count: 2, selectedIndex: -1 } }
export const ThreeColumns: Story = {}
export const FourColumns: Story = { args: { count: 8, selectedIndex: -1 } }
export const Empty: Story = { args: { count: 0 } }
export const WithLinks: Story = { render: (args) => <ProductSwitch accessibleName={args.accessibleName}><ProductSwitchItem icon={home} titleText="Home" subtitleText="Launchpad" targetSrc="#home" onClick={() => args.onActivate("Home")} /><ProductSwitchItem icon={product} titleText="Products" subtitleText="Catalog" targetSrc="#products" onClick={() => args.onActivate("Products")} /></ProductSwitch> }
export const Trigger: Story = { render: (args) => <Popover><PopoverTrigger asChild><Button>Open applications</Button></PopoverTrigger><PopoverContent aria-label="Business applications" hideArrow><PopoverBody><ProductSwitch accessibleName={args.accessibleName}>{products.map((item) => <ProductSwitchItem key={item.title} icon={item.icon} titleText={item.title} subtitleText={item.subtitle} onClick={() => args.onActivate(item.title)} />)}</ProductSwitch></PopoverBody></PopoverContent></Popover> }
export const CustomTexts: Story = { args: { accessibleName: "Procurement workspaces" } }
export const RTL: Story = { globals: { dir: "rtl" } }

// Source-backed defaults from registry/ui/product-switch.tsx and the installed UI5 bundles.
const textKeys = [
  [
    "accessibleName",
    "PRODUCT_SWITCH_CONTAINER_LABEL",
    "Products"
  ]
]
// Source: registry/items/product-switch.json and registry/ui/product-switch.tsx; story-local docs preserve the S0 fiori metadata.
const guide = {
  "description": "Fiori grid of product tiles with grid keyboard navigation, shown in a popover from the shell bar (ui5-product-switch).",
  "usage": {
    "summary": "Let users choose another product from a grid of labeled product entries.",
    "useWhen": [
      "Give users access to other products from the shell bar product-switch entry point.",
      "Identify each destination with a product title and optional subtitle, icon or image."
    ],
    "avoidWhen": [
      {
        "when": "Navigate modules or destinations within the current product.",
        "use": [
          "side-navigation"
        ]
      },
      {
        "when": "Inspect the signed-in user or access account settings and sign out.",
        "use": [
          "user-menu"
        ]
      }
    ],
    "source": "ui5-apidoc"
  }
}
const accessibilityNote = "accessibleName names the product list. Each tile derives its name from titleText and subtitleText; provide a title even for an icon tile. One Tab stop enters; arrows navigate by tile or row and Home/End move within the row. Enter or Space activates."
function ItemDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs") && !story.usesMount).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @petalo/product-switch"
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
