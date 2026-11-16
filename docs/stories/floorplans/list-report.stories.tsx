import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Controls, DocsContext, DocsStory, Primary, Title } from "@storybook/addon-docs/blocks"
import ListReport from "@/components/blocks/list-report"
import { Button } from "@/components/ui/button"
const meta = {
  title: "Floorplans/List Report",
  component: ListReport,
  tags: ["autodocs"],
  parameters: { fiori: { name: "list-report" }, layout: "fullscreen", docs: { page: BlockDocs, story: { inline: false, height: "720px" } } },
  argTypes: { children: { control: false, table: { disable: true } }, sideNavigation: { control: false, table: { disable: true } } },
  render: () => <ListReport />,
} satisfies Meta<typeof ListReport>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const RTL: Story = { globals: { dir: "rtl" } }

// Source: registry/block-items/list-report.json. Keep complete G2 guidance local:
// shared DocsPage only resolves registry/items and requires an owning demo.
const guide = {
  "title": "List Report",
  "description": "SAP Fiori List Report with saved views, localStorage persistence, a personalized filter bar, a snapping header, products table and mass-action footer. Sample data inline.",
  "registryDependencies": [
    "@fiori/dynamic-page",
    "@fiori/filter-bar",
    "@fiori/data-table",
    "@fiori/table",
    "@fiori/toolbar",
    "@fiori/bar",
    "@fiori/button",
    "@fiori/input",
    "@fiori/select",
    "@fiori/title",
    "@fiori/object-status",
    "@fiori/object-number",
    "@fiori/object-identifier",
    "@fiori/icons",
    "@fiori/variant-management",
    "@fiori/variants",
    "@fiori/f6-navigation"
  ],
  "usage": {
    "summary": "Find and act on business records with saved views, applied filters and a responsive results table.",
    "useWhen": [
      "Let users search and filter a business-record collection before taking item or mass actions.",
      "Return to saved filter views when the same search tasks recur.",
      "Keep applied results distinct from draft filters and reveal finalizing actions after row selection."
    ],
    "avoidWhen": [
      {
        "when": "Inspect or edit one record with categorized details, or keep a list beside its selected detail.",
        "use": [
          "object-page-floorplan",
          "master-detail"
        ]
      },
      {
        "when": "Create an unfamiliar object through 3–8 validated steps and review.",
        "use": [
          "wizard-page"
        ]
      },
      {
        "when": "Compose a custom result-page container with DynamicPage, or categorized details for one object with ObjectPage, instead of adapting a complete results floorplan.",
        "use": [
          "dynamic-page",
          "object-page"
        ]
      },
      {
        "when": "Build shared global application framing around the business results page.",
        "use": [
          "app-shell"
        ]
      },
      {
        "when": "Explain an empty or unavailable result and provide recovery actions rather than show available rows.",
        "use": [
          "empty-states"
        ]
      }
    ],
    "source": "sap-fiori-guidelines",
    "layout": [
      "DynamicPage",
      "  title: DynamicPageTitle with VariantManagement and snapped filter summary",
      "  header: DynamicPageHeader with FilterBar",
      "  content: Toolbar with Title and row actions, then DataTable",
      "    cells: ObjectIdentifier, ObjectStatus, ObjectNumber",
      "  footer: Bar with Button mass actions (shown on selection)"
    ],
    "variations": [
      "Replace the inline products and applyState handler with application records and a search service; keep filters separate from applied results.",
      "Adapt columns, row actions and mass actions to the business object; retain stable row keys and selection-driven footer visibility.",
      "Replace localStorageAdapter with a VariantStorage implementation when saved views must persist outside this browser."
    ]
  }
}
function BlockDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs")).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @fiori/list-report"
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
