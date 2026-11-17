import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Controls, DocsContext, DocsStory, Primary, Title } from "@storybook/addon-docs/blocks"
import Launchpad from "@/components/blocks/launchpad"
import { Button } from "@/components/ui/button"
const meta = {
  title: "Floorplans/Launchpad",
  component: Launchpad,
  tags: ["autodocs"],
  parameters: { fiori: { name: "launchpad", ownsLandmarks: true }, layout: "fullscreen", docs: { page: BlockDocs, story: { inline: false, height: "720px" } } },
  argTypes: { children: { control: false, table: { disable: true } }, sideNavigation: { control: false, table: { disable: true } } },
  // The real default block owns its main landmark.
  render: () => <Launchpad />,
} satisfies Meta<typeof Launchpad>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const RTL: Story = { globals: { dir: "rtl" } }

// Source: registry/block-items/launchpad.json. Keep complete G2 guidance local:
// shared DocsPage only resolves registry/items and requires an owning demo.
const guide = {
  "title": "Launchpad",
  "description": "The App Shell block with a SideNavigation wired to its menu button and a page per navigation item.",
  "registryDependencies": [
    "@fiori/app-shell",
    "@fiori/side-navigation",
    "@fiori/text",
    "@fiori/title",
    "@fiori/icons",
    "@fiori/f6-navigation"
  ],
  "usage": {
    "summary": "Start an application-entry page from a shared shell, selected side navigation and replaceable page content.",
    "useWhen": [
      "Give users an app-entry starting point for choosing business areas and opening favorite apps.",
      "Keep the selected side-navigation entry synchronized with the page beneath shared shell actions.",
      "Replace the Home Title/Text placeholder with app tiles and route targets; the current block supplies no tile grid."
    ],
    "avoidWhen": [
      {
        "when": "Need only the application frame or a custom header/navigation/content container.",
        "use": [
          "app-shell",
          "navigation-layout"
        ]
      },
      {
        "when": "Find and filter available business records, or explain an empty or unavailable result.",
        "use": [
          "list-report",
          "empty-states"
        ]
      },
      {
        "when": "Inspect or edit the details of one business object.",
        "use": [
          "object-page-floorplan"
        ]
      },
      {
        "when": "Browse a record list and its selected detail in adjacent columns.",
        "use": [
          "master-detail"
        ]
      },
      {
        "when": "Guide creation through 3–8 validated steps and review.",
        "use": [
          "wizard-page"
        ]
      }
    ],
    "source": "sap-fiori-guidelines",
    "layout": [
      "AppShell (shared shell actions and scrolling content)",
      "  side navigation: SideNavigation with SideNavigationItem and SideNavigationGroup",
      "    nested entries: SideNavigationSubItem",
      "    fixed entries: SideNavigationItem for settings and help",
      "  content: Title and Text for the selected placeholder page"
    ],
    "variations": [
      "Replace the Home placeholder with favorite-app tiles linked to application destinations; retain the shared shell and navigation.",
      "Replace the inline page-title map and selected-value state with application routes; retain navigation selection and the shell menu’s collapsed-state connection.",
      "Adapt navigation groups, nested entries and fixed settings/help items to the business roles using the application."
    ]
  }
}
function BlockDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs")).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @fiori/launchpad"
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
