import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Controls, DocsContext, DocsStory, Primary, Title } from "@storybook/addon-docs/blocks"
import WizardPage from "@/components/blocks/wizard-page"
import { Button } from "@/components/ui/button"
const meta = {
  title: "Floorplans/Wizard Page",
  component: WizardPage,
  tags: ["autodocs"],
  parameters: { fiori: { name: "wizard-page", ownsLandmarks: true }, layout: "fullscreen", docs: { page: BlockDocs, story: { inline: false, height: "720px" } } },
  // The real default block has no main. Own the full-page composition here;
  // keep its default data and descendant ARIA untouched, including native headers.
  decorators: [(Story, context) => context.viewMode === "story" ? <main aria-label="Create Product"><Story /></main> : <div><Story /></div>],
  argTypes: { children: { control: false, table: { disable: true } }, sideNavigation: { control: false, table: { disable: true } } },
  render: () => <WizardPage />,
} satisfies Meta<typeof WizardPage>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const RTL: Story = { globals: { dir: "rtl" } }

// Source: registry/block-items/wizard-page.json. Keep complete G2 guidance local:
// shared DocsPage only resolves registry/items and requires an owning demo.
const guide = {
  "title": "Wizard page (floorplan)",
  "description": "Fiori Wizard floorplan: a Page with a Wizard of form steps (Select, Input, DatePicker, Checkbox), step-by-step validation, a review page with Edit links and a footer with Review / Submit / Cancel.",
  "registryDependencies": [
    "@fiori/page",
    "@fiori/wizard",
    "@fiori/bar",
    "@fiori/button",
    "@fiori/checkbox",
    "@fiori/date-picker",
    "@fiori/input",
    "@fiori/label",
    "@fiori/link",
    "@fiori/message-strip",
    "@fiori/select",
    "@fiori/text",
    "@fiori/title",
    "@fiori/icons"
  ],
  "categories": [
    "floorplan",
    "wizard"
  ],
  "usage": {
    "summary": "Guide linear creation through validated steps, a review screen and final submission actions.",
    "useWhen": [
      "Create an unfamiliar object through 3–8 ordered steps before reviewing and submitting the result.",
      "Prevent progress until required entries are valid, then let users revisit completed sections from review.",
      "Start from a complete Page and Wizard flow with validation, review, footer actions and completion feedback."
    ],
    "avoidWhen": [
      {
        "when": "Complete fewer than 3 steps or enter fields together on one existing page.",
        "use": [
          "form",
          "page"
        ]
      },
      {
        "when": "Inspect or edit one object directly through sectioned details instead of a guided sequence.",
        "use": [
          "object-page",
          "object-page-floorplan"
        ]
      },
      {
        "when": "Need the step control inside an existing or custom page with your own validation and final actions.",
        "use": [
          "wizard"
        ]
      },
      {
        "when": "Find and filter a business-record collection.",
        "use": [
          "list-report"
        ]
      }
    ],
    "source": "sap-fiori-guidelines",
    "layout": [
      "viewport frame",
      "  Page",
      "    header: Bar with Title",
      "    edit content: Wizard with WizardStep sections",
      "      fields: Label, Input, DatePicker and Checkbox",
      "      selection fields: Select",
      "        trigger: SelectTrigger with SelectValue",
      "        popup: SelectContent with SelectItem",
      "      step content: Title, Text and next-step Button actions",
      "    review content: native sections",
      "      headings: Title with edit Link",
      "      values: Label and Text",
      "    completion content: MessageStrip",
      "      action: Link to create another object",
      "      followed by the same reviewed sections",
      "    footer: Bar with Button actions",
      "      review/cancel or submit/cancel; absent after completion"
    ],
    "variations": [
      "Replace the four sample product steps and fields with 3–8 steps for the creation task; keep later steps unreachable while preceding required data is invalid.",
      "Replace the local Submit completion state with application submission and error handling; retain review, section editing and cancellation.",
      "Adapt review labels and values to match the entry steps so users can verify and correct the same data before submission."
    ]
  }
}
function BlockDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs")).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @fiori/wizard-page"
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
