import * as React from "react"
import { ArgTypes, Controls, DocsContext, DocsStory, Primary, Title as DocsTitle } from "@storybook/addon-docs/blocks"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { DynamicSideContent, type DynamicSideContentProps } from "@/components/ui/dynamic-side-content"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Title } from "@/components/ui/title"
import { docsLink, fioriMeta } from "../_lib/meta"
type Args = DynamicSideContentProps & { width: number }
const base = fioriMeta({ name: "dynamic-side-content", component: DynamicSideContent })
const meta = {
  ...base,
  parameters: { ...base.parameters, layout: "fullscreen", docs: { page: ItemDocs, story: { inline: false, height: "420px" } } },
  args: { width: 1100, sideContentPosition: "end", sideContentVisibility: "showAboveS", sideContentFallDown: "onMinimumWidth", equalSplit: false, hideMainContent: false, hideSideContent: false, toggled: false, onToggledChange: fn(), onLayoutChange: fn() },
  argTypes: { ...base.argTypes, width: { control: { type: "number", min: 400, max: 1600 } }, sideContentPosition: { control: "inline-radio", options: ["end", "start"] }, sideContentVisibility: { control: "select", options: ["alwaysShow", "showAboveL", "showAboveM", "showAboveS", "neverShow"] }, sideContentFallDown: { control: "select", options: ["belowXL", "belowL", "belowM", "onMinimumWidth"] }, equalSplit: { control: "boolean" }, hideMainContent: { control: "boolean" }, hideSideContent: { control: "boolean" }, toggled: { control: "boolean" }, sideContent: { control: false }, accessibilityAttributes: { control: false }, onToggledChange: { control: false }, onLayoutChange: { control: false } },
  render: function SupplierSideContent(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const [breakpoint, setBreakpoint] = React.useState("")
    const { width, ...props } = args
    return <div className="grid gap-3 p-4"><div className="flex items-center gap-3"><Button onClick={() => { const toggled = !args.toggled; args.onToggledChange?.(toggled); updateArgs({ toggled }) }}>Toggle contents</Button><output>Breakpoint: {breakpoint}</output></div><div className="overflow-x-auto"><DynamicSideContent {...props} style={{ width, minHeight: "16rem" }} accessibilityAttributes={{ mainContent: { role: "region", ariaLabel: "Supplier details" }, sideContent: { role: "region", ariaLabel: "Supplier contacts" }, ...args.accessibilityAttributes }} onLayoutChange={(detail) => { args.onLayoutChange?.(detail); setBreakpoint(detail.currentBreakpoint) }} sideContent={<div className="h-full bg-(--sapList_SelectionBackgroundColor) p-4"><Title level="H2" size="H4">Contacts</Title><Text>Alex Lee, purchasing coordinator</Text></div>}><div className="h-full bg-(--sapGroup_ContentBackground) p-4"><Title level="H1" size="H3">Supplier details</Title><Text>Review delivery terms and purchasing agreements.</Text></div></DynamicSideContent></div></div>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Large: Story = {}
export const SideAtStart: Story = { args: { sideContentPosition: "start" } }
export const EqualSplit: Story = { args: { equalSplit: true } }
export const Medium: Story = { args: { width: 1000 } }
export const Small: Story = { args: { width: 600 } }
export const AlwaysShowSmall: Story = { args: { width: 600, sideContentVisibility: "alwaysShow" } }
export const ToggledSmall: Story = { args: { width: 600, toggled: true } }
export const MainHidden: Story = { args: { hideMainContent: true } }
export const SideHidden: Story = { args: { hideSideContent: true } }
export const CustomTexts: Story = { args: { accessibilityAttributes: { mainContent: { role: "region", ariaLabel: "Purchase agreement" }, sideContent: { role: "region", ariaLabel: "Agreement contacts" } } } }
export const RTL: Story = { globals: { dir: "rtl" } }

// Source-backed defaults from registry/ui/dynamic-side-content.tsx and the installed UI5 bundles.
const textKeys = [
  [
    "accessibilityAttributes.mainContent.ariaLabel",
    "DSC_MAIN_ARIA_LABEL",
    "Main Content"
  ],
  [
    "accessibilityAttributes.sideContent.ariaLabel",
    "DSC_SIDE_ARIA_LABEL",
    "Side Content"
  ]
]
// Source: registry/items/dynamic-side-content.json and registry/ui/dynamic-side-content.tsx; story-local docs preserve the S0 fiori metadata.
const guide = {
  "description": "Fiori dynamic side content: main and side content laid out by the control's width (S/M/L/XL), side position, fall-down, equal split and toggle (ui5-dynamic-side-content).",
  "usage": {
    "summary": "Keep supplementary context beside or below the main task without covering its content.",
    "useWhen": [
      "Consult relevant supporting information while completing a task that remains possible without the side content.",
      "Let supporting content move below the main area as the container narrows instead of overlaying it.",
      "At widths of 720px or less, provide a toggleContents() trigger for hidden side content, or set sideContentVisibility=\"alwaysShow\" to keep it below the main area."
    ],
    "avoidWhen": [
      {
        "when": "Navigate between a record list, selected object and related sub-object as separate pages.",
        "use": [
          "flexible-column-layout"
        ]
      },
      {
        "when": "Place application navigation beside page content under a shared header.",
        "use": [
          "navigation-layout"
        ]
      },
      {
        "when": "Show essential object attributes or finalizing actions that users must access to complete the task.",
        "use": [
          "object-page"
        ]
      }
    ],
    "source": "ui5-apidoc"
  }
}
const accessibilityNote = "accessibilityAttributes applies role and ariaLabel to the main and side areas. Default roles are main and complementary; use named regions when embedded in an existing main. Keep a keyboard-accessible toggle for small-screen alternate content."
function ItemDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs") && !story.usesMount).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @fiori/dynamic-side-content"
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
