import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Controls, DocsContext, DocsStory, Primary, Title } from "@storybook/addon-docs/blocks"
import EmptyStates from "@/components/blocks/empty-states"
import { Button } from "@/components/ui/button"
const meta = {
  title: "Floorplans/Empty States",
  component: EmptyStates,
  tags: ["autodocs"],
  parameters: { fiori: { name: "empty-states" }, layout: "fullscreen", docs: { page: BlockDocs, story: { inline: false, height: "720px" } } },
  argTypes: { children: { control: false, table: { disable: true } }, sideNavigation: { control: false, table: { disable: true } } },
  render: () => <EmptyStates />,
} satisfies Meta<typeof EmptyStates>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const RTL: Story = { globals: { dir: "rtl" } }

// Source: registry/block-items/empty-states.json. Keep complete G2 guidance local:
// shared DocsPage only resolves registry/items and requires an owning demo.
const guide = {
  "title": "Empty states",
  "description": "Gallery of the standard Fiori empty and error states (no data, no search results, no filter results, unable to load, page not found, success) as IllustratedMessage with actions, at different sizes.",
  "registryDependencies": [
    "@fiori/button",
    "@fiori/card",
    "@fiori/illustrated-message",
    "@fiori/label",
    "@fiori/segmented-button",
    "@fiori/title"
  ],
  "categories": [
    "empty-states"
  ],
  "usage": {
    "summary": "Start from a gallery of empty, no-results, failure and success messages with recovery-action examples.",
    "useWhen": [
      "Explain why no content is available and offer the action that can help users continue.",
      "Choose a starting pattern for no data, no search or filter results, loading failure, a missing page or completed work.",
      "Compare full-page and embedded message sizes before adapting one state to the application."
    ],
    "avoidWhen": [
      {
        "when": "Embed a single empty or unavailable state in content that already has its own container.",
        "use": [
          "illustrated-message"
        ]
      },
      {
        "when": "Show available records with search, filters and row actions.",
        "use": [
          "list-report"
        ]
      },
      {
        "when": "Build the shared application frame rather than an empty or recovery view.",
        "use": [
          "app-shell"
        ]
      },
      {
        "when": "Offer an application-entry page with favorite app tiles.",
        "use": [
          "launchpad"
        ]
      }
    ],
    "source": "ui5-apidoc",
    "layout": [
      "main gallery",
      "  header: Title, then Label and SegmentedButton with SegmentedButtonItem size choices",
      "  full-page section: Title, Card and IllustratedMessage with a create Button",
      "  search/filter section: Title and two Card surfaces",
      "    each: IllustratedMessage with clear Button actions",
      "  errors section: Title and two Card surfaces with IllustratedMessage and retry/home Button actions",
      "  small-container section: Title and two Card surfaces with IllustratedMessage; success has a Button",
      "  action feedback: native status text after filter clearing and retry attempts"
    ],
    "variations": [
      "Keep only the state relevant to the page and replace the gallery heading and size selector with the application’s own context.",
      "Wire create, clear-search, clear-filter, retry and home actions to real recovery behavior; the sample handlers do not fetch or navigate.",
      "Choose Scene, Dialog, Spot or Dot to fit the host region and provide task-specific titleText and subtitleText."
    ]
  }
}
function BlockDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs")).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @fiori/empty-states"
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
