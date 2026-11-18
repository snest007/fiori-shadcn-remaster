import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Controls, DocsContext, DocsStory, Primary, Title } from "@storybook/addon-docs/blocks"
import MasterDetail from "@/components/blocks/master-detail"
import { Button } from "@/components/ui/button"
const meta = {
  title: "Floorplans/Master Detail",
  component: MasterDetail,
  tags: ["autodocs"],
  parameters: { fiori: { name: "master-detail", ownsLandmarks: true }, layout: "fullscreen", docs: { page: BlockDocs, story: { inline: false, height: "720px" } } },
  // The real default block has no main. Own the full-page composition here;
  // keep its default data and descendant ARIA untouched, including native headers.
  decorators: [(Story, context) => context.viewMode === "story" ? <main aria-label="Manage Products"><Story /></main> : <div><Story /></div>],
  argTypes: { children: { control: false, table: { disable: true } }, sideNavigation: { control: false, table: { disable: true } } },
  render: () => <MasterDetail />,
} satisfies Meta<typeof MasterDetail>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const RTL: Story = { globals: { dir: "rtl" } }

// Source: registry/block-items/master-detail.json. Keep complete G2 guidance local:
// shared DocsPage only resolves registry/items and requires an owning demo.
const guide = {
  "title": "Master-Detail (Flexible Column Layout)",
  "description": "Fiori Flexible Column Layout app: searchable product list, product object view and sales order line item, navigated with useFlexibleColumnLayout.",
  "registryDependencies": [
    "@petalo/icons",
    "@petalo/flexible-column-layout",
    "@petalo/bar",
    "@petalo/button",
    "@petalo/input",
    "@petalo/list",
    "@petalo/tag",
    "@petalo/f6-navigation"
  ],
  "usage": {
    "summary": "Browse a searchable record list beside its selected detail and, when needed, a related sub-detail.",
    "useWhen": [
      "Select records from a list while keeping their detail visible in an adjacent column when space permits.",
      "Open a related sub-object in a third column, with full-screen and close actions for the selected detail.",
      "Start from a working list/detail navigation example and replace the inline products and sales-order items."
    ],
    "avoidWhen": [
      {
        "when": "Search and filter records with saved views, a results table and mass actions.",
        "use": [
          "list-report"
        ]
      },
      {
        "when": "Inspect or edit one object without keeping a record list beside it.",
        "use": [
          "object-page-floorplan"
        ]
      },
      {
        "when": "Show lightweight temporary details tied to an opener.",
        "use": [
          "popover"
        ]
      },
      {
        "when": "Compose custom related pages and columns with FlexibleColumnLayout, or supply only global application framing around those pages with AppShell.",
        "use": [
          "flexible-column-layout",
          "app-shell"
        ]
      }
    ],
    "source": "ui5-apidoc",
    "layout": [
      "viewport frame",
      "  header: native application heading",
      "  content: FlexibleColumnLayout",
      "    start column: Bar, Input with InputIcon and Icon, then List with ListItemStandard",
      "    mid column: Bar with Button and Icon column actions, scrolling attributes, Tag and related List",
      "      related records: ListItemStandard opens the end column",
      "    end column: Bar with Button and Icon column actions, then scrolling line-item attributes and Tag"
    ],
    "variations": [
      "Replace inline records and search filtering with application data; keep selected record keys and navigation levels synchronized.",
      "Use only list and detail columns when the object has no related sub-detail; retain close and full-screen behavior.",
      "Adapt the detail fields and related list to the business object; clear obsolete selections when their column or parent is closed."
    ]
  }
}
function BlockDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs")).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @petalo/master-detail"
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
