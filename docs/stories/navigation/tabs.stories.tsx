import * as React from "react"
import { ArgTypes, Controls, DocsContext, DocsStory, Primary, Title as DocsTitle } from "@storybook/addon-docs/blocks"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn, expect, userEvent, waitFor, within } from "storybook/test"
import { Tabs, TabsList, TabsTrigger, TabsSeparator, TabsContent, type TabsProps, type TabDesign } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { inbox, employee, attachment, notes } from "@/lib/fiori-icons"
import { docsLink, fioriMeta } from "../_lib/meta"
type Args = TabsProps & { icons: boolean; iconOnly: boolean; counts: boolean; semantic: boolean; disabledTab: boolean; separator: boolean; longList: boolean; customOverflow: boolean; mixed: boolean }
const labels = ["Info", "People", "Attachments", "Notes"]
const icons = [inbox, employee, attachment, notes]
const designs: TabDesign[] = ["default", "positive", "negative", "critical", "neutral"]
const base = fioriMeta({ name: "tabs", component: Tabs })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: ItemDocs } },
  args: { value: "t0", headerBackground: "solid", contentBackground: "solid", overflowMode: "end", icons: false, iconOnly: false, counts: false, semantic: false, disabledTab: false, separator: false, longList: false, customOverflow: false, mixed: false, moreText: "More", overflowMenuTitle: "Overflow Menu", overflowListAriaLabel: "Hidden tabs", onValueChange: fn() },
  argTypes: { ...base.argTypes, value: { control: "select", options: ["t0", "t1", "t2", "t3", "t4", "t5", "t9"] }, headerBackground: { control: "select", options: ["solid", "transparent", "translucent"] }, contentBackground: { control: "select", options: ["solid", "transparent", "translucent"] }, overflowMode: { control: "inline-radio", options: ["end", "startAndEnd"] }, icons: { control: "boolean" }, iconOnly: { control: "boolean" }, counts: { control: "boolean" }, semantic: { control: "boolean" }, disabledTab: { control: "boolean" }, separator: { control: "boolean" }, longList: { control: "boolean" }, customOverflow: { control: "boolean" }, mixed: { control: "boolean" }, moreText: { control: "text" }, overflowMenuTitle: { control: "text" }, overflowListAriaLabel: { control: "text" }, overflowButton: { control: false }, startOverflowButton: { control: false }, defaultValue: { control: false }, onValueChange: { control: false } },
  render: function ObjectSections(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const { icons: showIcons, iconOnly, counts, semantic, disabledTab, separator, longList, customOverflow, mixed, ...props } = args
    // Icon-only tabs still display their count; include it in the supplied name.
    const tabs = longList ? Array.from({ length: 10 }, (_, index) => `Section ${index + 1}`) : semantic ? ["Default", "Positive", "Negative", "Critical", "Neutral"] : labels
    return <Tabs {...props} onValueChange={(value) => { args.onValueChange?.(value); updateArgs({ value }) }} overflowButton={customOverflow ? <Button>Next sections</Button> : undefined} startOverflowButton={customOverflow ? <Button>Previous sections</Button> : undefined}><TabsList aria-label="Object sections">{tabs.map((text, index) => <React.Fragment key={text}>{separator && index === 1 && <TabsSeparator />}<TabsTrigger value={`t${index}`} icon={showIcons || iconOnly || (mixed && index === 0) ? icons[index % 4] : undefined} aria-label={iconOnly || (mixed && index === 0) ? counts ? text + " " + (index + 2) : text : undefined} additionalText={counts ? String(index + 2) : undefined} design={semantic ? designs[index % 5] : undefined} disabled={disabledTab && index === 3}>{iconOnly || (mixed && index === 0) ? undefined : text}</TabsTrigger></React.Fragment>)}</TabsList>{tabs.map((text, index) => <TabsContent key={text} value={`t${index}`}>{text} for order 1001.</TabsContent>)}</Tabs>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
const narrow: Story["decorators"] = [(Story) => <div className="w-80 max-w-full"><Story /></div>]
export const Playground: Story = {}
export const Text: Story = {}
export const Disabled: Story = { args: { disabledTab: true } }
export const Counts: Story = { args: { counts: true } }
export const SemanticDesigns: Story = { args: { semantic: true, value: "t1" } }
export const WithSeparator: Story = { args: { separator: true } }
export const Icons: Story = { args: { icons: true, counts: true, disabledTab: true } }
export const IconsOnly: Story = { args: { iconOnly: true } }
export const SemanticIcons: Story = { args: { semantic: true, icons: true, counts: true, value: "t2" } }
export const Mixed: Story = { args: { mixed: true, separator: true, semantic: true, counts: true, value: "t2" } }
export const Transparent: Story = { args: { headerBackground: "transparent", contentBackground: "transparent" } }
export const Translucent: Story = { args: { headerBackground: "translucent", contentBackground: "translucent" } }
export const Overflow: Story = { decorators: narrow, args: { longList: true, value: "t2" } }
export const OverflowSelectedLast: Story = { decorators: narrow, args: { longList: true, value: "t9" } }
export const OverflowStartAndEnd: Story = { decorators: narrow, args: { longList: true, value: "t5", overflowMode: "startAndEnd" } }
export const OverflowIcons: Story = { decorators: narrow, args: { longList: true, icons: true, semantic: true, counts: true, value: "t2" } }
export const CustomOverflow: Story = { decorators: narrow, args: { longList: true, customOverflow: true, value: "t9" } }
export const CustomStartAndEnd: Story = { decorators: narrow, args: { longList: true, customOverflow: true, overflowMode: "startAndEnd", value: "t5" } }
export const CustomStartEmpty: Story = { decorators: narrow, args: { longList: true, customOverflow: true, overflowMode: "startAndEnd", value: "t0" } }
export const Open: Story = { decorators: narrow, args: { longList: true }, parameters: { docs: { story: { inline: false, height: "420px" } } }, play: async ({ canvasElement }) => { const canvas = within(canvasElement); await waitFor(() => expect(canvas.getByRole("button", { name: "More" })).toBeVisible()); await userEvent.click(canvas.getByRole("button", { name: "More" })); await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByRole("listbox", { name: "Hidden tabs" })).toBeVisible()) } }
export const CustomTexts: Story = { decorators: narrow, args: { longList: true, moreText: "Other sections", overflowMenuTitle: "Order sections", overflowListAriaLabel: "Additional order sections" } }
export const RTL: Story = { ...OverflowStartAndEnd, globals: { dir: "rtl" } }

// Source-backed defaults from registry/ui/tabs.tsx and the installed UI5 bundles.
const textKeys = [
  [
    "moreText",
    "TABCONTAINER_END_OVERFLOW",
    "More"
  ],
  [
    "overflowMenuTitle",
    "TABCONTAINER_OVERFLOW_MENU_TITLE",
    "Overflow Menu"
  ],
  [
    "overflowListAriaLabel",
    "Application text; no matching UI5 key",
    "Hidden tabs"
  ],
  [
    "TabsTrigger.designLabel",
    "TAB_ARIA_DESIGN_POSITIVE / TAB_ARIA_DESIGN_NEGATIVE / TAB_ARIA_DESIGN_CRITICAL / TAB_ARIA_DESIGN_NEUTRAL",
    "Positive / Negative / Critical / Neutral"
  ]
]
// Source: registry/items/tabs.json and registry/ui/tabs.tsx; story-local docs preserve the S0 fiori metadata.
const guide = {
  "description": "Fiori IconTabBar / TabContainer: text and icon tabs, counts, semantic designs, responsive overflow, UI5 keyboard model.",
  "usage": {
    "summary": "Switch between content facets or prominent filtered views within the current page.",
    "useWhen": [
      "Let users browse different facets of a business object without leaving its page.",
      "Offer prominent filters above a list, optionally with counts for all items and each filtered view.",
      "Use overflowMode=\"startAndEnd\" when tabs represent process states whose order must stay visible."
    ],
    "avoidWhen": [
      {
        "when": "Choose compact related options that change the same view or setting rather than distinct content sections.",
        "use": [
          "segmented-button"
        ]
      },
      {
        "when": "Navigate application modules or primary destinations rather than facets within one page.",
        "use": [
          "side-navigation"
        ]
      },
      {
        "when": "Guide users through task steps and control which steps they can reach.",
        "use": [
          "wizard"
        ]
      },
      {
        "when": "Show a location path and let users return to its ancestors.",
        "use": [
          "breadcrumbs"
        ]
      }
    ],
    "source": "sap-fiori-guidelines"
  }
}
const accessibilityNote = "Name TabsList with aria-label and icon-only TabsTrigger with aria-label. The component owns tab, tabpanel, aria-selected and aria-controls relationships. One Tab stop enters the header; arrows and Home/End move, Enter/Space selects. Overflow selection restores header focus."
function ItemDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs") && !story.usesMount).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @petalo/tabs"
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
