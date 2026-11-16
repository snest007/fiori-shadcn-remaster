import * as React from "react"
import { ArgTypes, Controls, DocsContext, DocsStory, Primary, Title as DocsTitle } from "@storybook/addon-docs/blocks"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { Page } from "@/components/ui/page"
import { Bar } from "@/components/ui/bar"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Title } from "@/components/ui/title"
import { docsLink, fioriMeta } from "../_lib/meta"
const base = fioriMeta({ name: "page", component: Page })
const meta = {
  ...base,
  parameters: { ...base.parameters, layout: "fullscreen", docs: { page: ItemDocs, story: { inline: false, height: "500px" } } },
  args: { backgroundDesign: "solid", noScrolling: false, fixedFooter: false, hideFooter: false, onClick: fn() },
  argTypes: { ...base.argTypes, backgroundDesign: { control: "inline-radio", options: ["solid", "transparent", "list"] }, noScrolling: { control: "boolean" }, fixedFooter: { control: "boolean" }, hideFooter: { control: "boolean" }, header: { control: false }, footer: { control: false }, contentProps: { control: false }, onClick: { control: false } },
  render: (args) => <Page {...args} className="h-screen" header={<Bar design="header"><Title level="H1" size="H4">Supplier details</Title></Bar>} contentProps={{ tabIndex: 0, "aria-label": "Supplier information" }} footer={<Bar design={args.fixedFooter ? "footer" : "floating-footer"} endContent={<><Button variant="emphasized">Accept</Button><Button>Discard</Button></>} />}>{Array.from({ length: 12 }, (_, index) => <p key={index} className="my-3"><Text>Section {index + 1}: Review supplier contacts, delivery terms and purchasing details before accepting the changes.</Text></p>)}</Page>,
} satisfies Meta<typeof Page>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const FloatingFooter: Story = {}
export const FixedFooter: Story = { args: { fixedFooter: true } }
export const ListBackground: Story = { args: { backgroundDesign: "list" } }
export const TransparentBackground: Story = { args: { backgroundDesign: "transparent" } }
export const FooterHidden: Story = { args: { hideFooter: true } }
export const NoScrolling: Story = { args: { noScrolling: true } }
export const WithoutFooter: Story = { render: (args) => <Page {...args} className="h-screen" header={<Bar><Title level="H1" size="H4">Supplier summary</Title></Bar>} contentProps={{ "aria-label": "Supplier summary" }}><Text>Supplier information is up to date.</Text></Page> }
export const RTL: Story = { globals: { dir: "rtl" } }

const textKeys: string[][] = []
// Source: registry/items/page.json and registry/ui/page.tsx; story-local docs preserve the S0 fiori metadata.
const guide = {
  "description": "Fiori page container: header bar, scrolling content and a floating or fixed footer bar, with responsive padding and background designs (ui5-page).",
  "usage": {
    "summary": "Hold one application screen with a header bar, scrolling content and optional floating or fixed footer.",
    "useWhen": [
      "Complete a task on one screen while keeping its header and footer separate from the scrolling content.",
      "Provide a page container without an expandable, structured header.",
      "Give the parent a fixed height; use noScrolling when a child owns scrolling and fixedFooter when the footer must dock below content."
    ],
    "avoidWhen": [
      {
        "when": "Keep filters or structured context in a header that collapses while the page content scrolls.",
        "use": [
          "dynamic-page"
        ]
      },
      {
        "when": "Organize one object’s details with section navigation and an object header.",
        "use": [
          "object-page"
        ]
      },
      {
        "when": "Start from a complete guided creation page with 3–8 steps, validation and review.",
        "use": [
          "wizard-page"
        ]
      }
    ],
    "source": "ui5-apidoc"
  }
}
const accessibilityNote = "contentProps forwards native section accessibility, including aria-label and tabIndex for scrolling content without interactive children. Header and footer actions must have names. Page adds no composite keyboard model; Tab follows their normal order."
function ItemDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs") && !story.usesMount).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @fiori/page"
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
