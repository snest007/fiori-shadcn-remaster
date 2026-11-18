import * as React from "react"
import { ArgTypes, Controls, DocsContext, DocsStory, Primary, Title as DocsTitle } from "@storybook/addon-docs/blocks"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { Bar } from "@/components/ui/bar"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Title } from "@/components/ui/title"
import { navBack, settings } from "@/lib/fiori-icons"
import { docsLink, fioriMeta } from "../_lib/meta"
const base = fioriMeta({ name: "bar", component: Bar })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: ItemDocs } },
  args: { design: "header", children: "Purchase order", onClick: fn() },
  argTypes: { ...base.argTypes, design: { control: "select", options: ["header", "subheader", "footer", "floating-footer"] }, children: { control: "text", table: { disable: false } }, startContent: { control: false }, endContent: { control: false }, onClick: { control: false } },
  render: (args) => <Bar {...args} startContent={<Button variant="transparent" size="icon" aria-label="Back"><Icon icon={navBack} /></Button>} endContent={<Button variant="transparent" size="icon" aria-label="Settings"><Icon icon={settings} /></Button>}><Title level="H2" size="H5">{args.children}</Title></Bar>,
} satisfies Meta<typeof Bar>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Header: Story = {}
export const Subheader: Story = { args: { design: "subheader", children: "Delivery details" } }
export const Footer: Story = { args: { design: "footer" }, render: (args) => <Bar {...args} startContent={undefined} endContent={<><Button variant="emphasized">Submit</Button><Button>Cancel</Button></>}>{undefined}</Bar> }
export const FloatingFooter: Story = { args: { design: "floating-footer" }, render: (args) => <Bar {...args} startContent={undefined} endContent={<><Button variant="emphasized">Submit</Button><Button>Cancel</Button></>}>{undefined}</Bar> }
export const RTL: Story = { globals: { dir: "rtl" } }

const textKeys: string[][] = []
// Source: registry/items/bar.json and registry/ui/bar.tsx; story-local docs preserve the S0 fiori metadata.
const guide = {
  "description": "Fiori bar (header, subheader, footer, floating footer) with start, middle and end content.",
  "usage": {
    "summary": "Arrange page or dialog header and footer content in start, centered and end areas.",
    "useWhen": [
      "Keep a title centered while navigation or actions occupy the start and end of a header or footer.",
      "Place page-level footer actions in a footer or floating footer.",
      "Use design=\"header\", \"subheader\", \"footer\" or \"floating-footer\" to match the surrounding region."
    ],
    "avoidWhen": [
      {
        "when": "Group related actions with arrow-key navigation and responsive overflow.",
        "use": [
          "toolbar"
        ]
      },
      {
        "when": "Provide a universal product header with branding, global search, notifications and profile access.",
        "use": [
          "shell-bar"
        ]
      }
    ],
    "source": "ui5-apidoc"
  }
}
const accessibilityNote = "Content areas inherit their meaning from placement; there is no default role. Name icon-only buttons with aria-label. Use Toolbar for an arrow-key composite with three or more actions."
function ItemDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs") && !story.usesMount).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @petalo/bar"
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
