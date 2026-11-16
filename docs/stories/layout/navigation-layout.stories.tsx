import * as React from "react"
import { ArgTypes, Controls, DocsContext, DocsStory, Primary, Title as DocsTitle } from "@storybook/addon-docs/blocks"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { NavigationLayout, type NavigationLayoutProps } from "@/components/ui/navigation-layout"
import { SideNavigation, SideNavigationItem, SideNavigationSubItem } from "@/components/ui/side-navigation"
import { Bar } from "@/components/ui/bar"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Title } from "@/components/ui/title"
import { actionSettings, group, home, menu2, product } from "@/lib/fiori-icons"
import { docsLink, fioriMeta } from "../_lib/meta"
const base = fioriMeta({ name: "navigation-layout", component: NavigationLayout })
const meta = {
  ...base,
  parameters: { ...base.parameters, layout: "fullscreen", docs: { page: ItemDocs, story: { inline: false, height: "540px" } } },
  args: { mode: "auto", onModeChange: fn() },
  argTypes: { ...base.argTypes, mode: { control: "inline-radio", options: ["auto", "collapsed", "expanded"] }, header: { control: false }, sideContent: { control: false }, onModeChange: { control: false } },
  render: function ApplicationLayout(args: NavigationLayoutProps) {
    const [, updateArgs] = useArgs<NavigationLayoutProps>()
    const [page, setPage] = React.useState("home")
    const toggle = () => { const collapsed = args.mode === "auto" ? window.matchMedia("(max-width: 599.98px)").matches : args.mode === "collapsed"; updateArgs({ mode: collapsed ? "expanded" : "collapsed" }) }
    return <div className="relative h-screen"><NavigationLayout {...args} onModeChange={(mode) => { args.onModeChange?.(mode); updateArgs({ mode }) }} header={<Bar startContent={<Button variant="transparent" size="icon" aria-label="Toggle navigation" onClick={toggle}><Icon icon={menu2} /></Button>}><Title level="H1" size="H4">Purchasing application</Title></Bar>} sideContent={<SideNavigation accessibleName="Purchasing navigation" value={page} onValueChange={setPage} fixedItems={<SideNavigationItem text="Settings" value="settings" icon={actionSettings} />}><SideNavigationItem text="Home" value="home" icon={home} /><SideNavigationItem text="People" value="people" icon={group}><SideNavigationSubItem text="My team" value="team" /></SideNavigationItem><SideNavigationItem text="Products" value="products" icon={product} /></SideNavigation>}><section aria-label="Application content" className="p-4"><Title level="H2" size="H3">Current page: {page}</Title><p>Select a business area from the navigation.</p></section></NavigationLayout></div>
  },
} satisfies Meta<typeof NavigationLayout>
export default meta
type Story = StoryObj<typeof meta>
// Inline is required for live Controls; the full-page variants retain isolated previews.
export const Playground: Story = { parameters: { docs: { story: { inline: true } } } }
export const Automatic: Story = {}
export const Expanded: Story = { args: { mode: "expanded" } }
export const Collapsed: Story = { args: { mode: "collapsed" } }
export const RTL: Story = { globals: { dir: "rtl" } }

const textKeys: string[][] = []
// Source: registry/items/navigation-layout.json and registry/ui/navigation-layout.tsx; story-local docs preserve the S0 fiori metadata.
const guide = {
  "description": "Fiori navigation layout: header, collapsible side navigation and content; collapses the side navigation on small screens (ui5-navigation-layout).",
  "usage": {
    "summary": "Compose a full-screen header, vertical navigation and page content with responsive navigation visibility.",
    "useWhen": [
      "Move between application sections through vertical navigation while keeping the current page beside it.",
      "Compose the header, navigation and content regions of an application screen yourself.",
      "Use mode=\"auto\" to collapse navigation below 600px; wire onModeChange to close expanded navigation after selection on these screens."
    ],
    "avoidWhen": [
      {
        "when": "Need navigation items only inside an application frame that already exists.",
        "use": [
          "side-navigation"
        ]
      },
      {
        "when": "Start from a wired frame with search, notifications, user menu and product switching.",
        "use": [
          "app-shell"
        ]
      },
      {
        "when": "Start from an application-entry scaffold with selected navigation and page placeholders.",
        "use": [
          "launchpad"
        ]
      },
      {
        "when": "Keep a record list and its selected detail visible as related pages.",
        "use": [
          "flexible-column-layout"
        ]
      },
      {
        "when": "Show supplementary context rather than application navigation beside a task.",
        "use": [
          "dynamic-side-content"
        ]
      }
    ],
    "source": "ui5-apidoc"
  }
}
const accessibilityNote = "Name the supplied SideNavigation and every header action. The layout connects collapsed navigation state and small-screen automatic collapse; it adds no keyboard model of its own. Its aside becomes inert when hidden on a small screen."
function ItemDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs") && !story.usesMount).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @fiori/navigation-layout"
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
