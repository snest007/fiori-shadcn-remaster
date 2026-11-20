import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Controls, DocsContext, DocsStory, Primary, Title } from "@storybook/addon-docs/blocks"
import ObjectPageFloorplan from "@/components/blocks/object-page-floorplan"
import { Button } from "@/components/ui/button"
const meta = {
  title: "Floorplans/Object Page",
  component: ObjectPageFloorplan,
  tags: ["autodocs"],
  parameters: { fiori: { name: "object-page-floorplan", ownsLandmarks: true }, layout: "fullscreen", docs: { page: BlockDocs, story: { inline: false, height: "720px" } } },
  argTypes: { children: { control: false, table: { disable: true } }, sideNavigation: { control: false, table: { disable: true } } },
  // The real default block owns its main landmark.
  render: () => <ObjectPageFloorplan />,
} satisfies Meta<typeof ObjectPageFloorplan>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const RTL: Story = { globals: { dir: "rtl" } }

// Source: registry/block-items/object-page-floorplan.json. Keep complete G2 guidance local:
// shared DocsPage only resolves registry/items and requires an owning demo.
const guide = {
  "title": "Object Page",
  "description": "SAP Fiori Object Page floorplan: object header with avatar and facets, anchor navigation, sections General Information (form), Items (table) and Notes, edit mode with a Save / Cancel floating footer. Sample data inline.",
  "registryDependencies": [
    "@petalo/object-page",
    "@petalo/dynamic-page",
    "@petalo/form",
    "@petalo/table",
    "@petalo/toolbar",
    "@petalo/bar",
    "@petalo/breadcrumbs",
    "@petalo/button",
    "@petalo/input",
    "@petalo/textarea",
    "@petalo/text",
    "@petalo/label",
    "@petalo/title",
    "@petalo/avatar",
    "@petalo/object-status",
    "@petalo/object-number",
    "@petalo/object-identifier",
    "@petalo/icons",
    "@petalo/f6-navigation"
  ],
  "usage": {
    "summary": "Inspect and edit one object through a complete header, sectioned details and Save/Cancel flow.",
    "useWhen": [
      "Inspect or edit one business object with its identity, status, totals and categorized details.",
      "Keep related forms, line items and notes on one page with anchor navigation.",
      "Start from the display/edit example, then replace sample data and Save/Cancel handlers with application persistence."
    ],
    "avoidWhen": [
      {
        "when": "Find and filter a record collection or act on selected records together.",
        "use": [
          "list-report"
        ]
      },
      {
        "when": "Keep a record list and its selected detail visible in adjacent columns.",
        "use": [
          "master-detail"
        ]
      },
      {
        "when": "Guide unfamiliar object creation through 3–8 validated steps and review.",
        "use": [
          "wizard-page"
        ]
      },
      {
        "when": "Compose custom sections and edit handling with ObjectPage, or supply only shared global framing around the object page with AppShell.",
        "use": [
          "object-page",
          "app-shell"
        ]
      }
    ],
    "source": "sap-fiori-guidelines",
    "layout": [
      "viewport frame",
      "  ObjectPage",
      "    title: DynamicPageTitle with Breadcrumbs and BreadcrumbsItem, Title, Label and Toolbar actions",
      "    header: ObjectPageHeader with Avatar and ObjectPageHeaderFacet",
      "      facets: ObjectAttribute, ObjectStatus and ObjectNumber",
      "    navigation: anchor bar supplied by ObjectPage",
      "    general section: ObjectPageSection and ObjectPageSubSection with Form, FormGroup and FormItem",
      "      fields: Label with Text in display mode or Input in edit mode",
      "    items section: ObjectPageSection with ObjectPageSubSection",
      "      actions: Toolbar with Title, ToolbarSpacer and ToolbarButton",
      "      content: Table with TableHeaderRow, TableHeaderCell, TableRow and TableCell",
      "        cells: ObjectIdentifier, ObjectStatus and ObjectNumber",
      "    notes section: ObjectPageSection and ObjectPageSubSection with Text or TextArea",
      "    footer: Bar with save/cancel Button actions (shown in edit mode)"
    ],
    "variations": [
      "Replace the inline order, header facets, form groups, item columns and notes with the business object’s details.",
      "Connect Save and Cancel to application persistence and draft handling; preserve the distinction between saved display data and editable drafts.",
      "Choose ObjectPage mode=\"tabs\" when users should work with one categorized section at a time instead of the continuous anchor view."
    ]
  }
}
function BlockDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs")).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @petalo/object-page-floorplan"
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
