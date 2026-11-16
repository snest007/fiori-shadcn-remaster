import * as React from "react"
import { ArgTypes, Controls, DocsContext, DocsStory, Primary, Title as DocsTitle } from "@storybook/addon-docs/blocks"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Search, SearchItem, SearchItemGroup, ShellBarSearch, type SearchProps } from "@/components/ui/search"
import { history } from "@/lib/fiori-icons"
import { Button } from "@/components/ui/button"
import { docsLink, fioriMeta } from "../_lib/meta"
const base = fioriMeta({ name: "search", component: Search })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: ItemDocs } },
  args: { accessibleName: "Product search", value: "", placeholder: "Search products", showClearIcon: true, noTypeahead: false, fieldLoading: false, loading: false, open: false, onValueChange: fn(), onOpenChange: fn(), onScopeChange: fn(), onSearch: fn() },
  argTypes: { ...base.argTypes, value: { control: "text" }, accessibleName: { control: "text" }, placeholder: { control: "text" }, showClearIcon: { control: "boolean" }, noTypeahead: { control: "boolean" }, fieldLoading: { control: "boolean" }, loading: { control: "boolean" }, open: { control: "boolean" }, scopeValue: { control: "select", options: ["all", "products"] }, scopes: { control: "object" }, defaultValue: { control: false }, action: { control: false }, portal: { control: false }, inputProps: { control: false }, texts: { control: false }, onValueChange: { control: false }, onOpenChange: { control: false }, onScopeChange: { control: false }, onSearch: { control: false } },
  render: function ProductSearch(args: SearchProps) {
    const [, updateArgs] = useArgs<SearchProps>()
    return <div className="w-96 max-w-full"><Search {...args} onValueChange={(value) => { args.onValueChange?.(value); updateArgs({ value }) }} onOpenChange={(open) => { args.onOpenChange?.(open); updateArgs({ open }) }} onScopeChange={(scopeValue) => { args.onScopeChange?.(scopeValue); updateArgs({ scopeValue }) }}><SearchItem text="Laptop" icon={history} /><SearchItem text="Lap desk" description="Office supplies" /><SearchItemGroup headerText="Products"><SearchItem text="Laptop bag" /></SearchItemGroup></Search></div>
  },
} satisfies Meta<typeof Search>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Placeholder: Story = {}
export const WithValue: Story = { args: { value: "Laptop" } }
export const Scoped: Story = { args: { placeholder: undefined, scopes: [{ value: "all", text: "All" }, { value: "products", text: "Products" }], scopeValue: "all" } }
export const ShellCollapsed: Story = { render: () => <ShellBarSearch accessibleName="Portal search" defaultCollapsed /> }
export const Open: Story = { args: { open: true, value: "Lap", noTypeahead: true }, parameters: { docs: { story: { inline: false, height: "380px" } } } }
export const FieldLoading: Story = { args: { fieldLoading: true } }
export const SuggestionsLoading: Story = { args: { open: true, value: "Lap", loading: true }, parameters: { docs: { story: { inline: false, height: "380px" } } } }
export const DeletableSuggestion: Story = { args: { open: true, value: "Lap" }, render: (args) => <Search {...args}><SearchItem text="Laptop" deletable onDelete={fn()} /></Search>, parameters: { docs: { story: { inline: false, height: "380px" } } } }
export const CustomTexts: Story = { args: { texts: { search: "Find products", clear: "Clear product search", suggestions: "Suggested products", open: "Find in portal", collapse: "Close portal search", searchIn: (scope) => `Find products in ${scope}` } } }
export const RTL: Story = { globals: { dir: "rtl" } }

// Source-backed defaults from registry/ui/search.tsx and the installed UI5 bundles.
const textKeys = [
  [
    "texts.field",
    "SEARCH_FIELD_LABEL",
    "Search Field"
  ],
  [
    "texts.search",
    "SEARCH_FIELD_SEARCH_ICON",
    "Search"
  ],
  [
    "texts.clear",
    "SEARCH_FIELD_CLEAR_ICON",
    "Clear Search"
  ],
  [
    "texts.scope",
    "SEARCH_FIELD_SCOPE_SELECT_LABEL",
    "Select Scope"
  ],
  [
    "texts.suggestions",
    "SEARCH_SUGGESTIONS",
    "Suggestions"
  ],
  [
    "texts.searchIn",
    "SEARCH_FIELD_PLACEHOLDER_WITH_SCOPE",
    "Search in: {0}"
  ],
  [
    "texts.open",
    "SHELLBAR_SEARCH_COLLAPSED",
    "Open Search"
  ],
  [
    "texts.collapse",
    "SHELLBAR_SEARCH_EXPANDED",
    "Collapse Search"
  ],
  [
    "texts.remove",
    "SEARCH_ITEM_DELETE_BUTTON_TOOLTIP",
    "Remove Suggestion"
  ],
  [
    "texts.cancel",
    "SEARCH_CANCEL_BUTTON",
    "Cancel"
  ],
  [
    "texts.scopeClose",
    "Application text; shared Button action",
    "Decline"
  ]
]
// Source: registry/items/search.json and registry/ui/search.tsx; story-local docs preserve the S0 fiori metadata.
const guide = {
  "description": "Fiori search field with scope select, type-ahead and suggestions, plus the collapsible ShellBarSearch (ui5-search, ui5-shellbar-search).",
  "usage": {
    "summary": "Find content by submitting a query, optionally with scopes and suggestions.",
    "useWhen": [
      "Let users find content or business objects by typing a query instead of browsing every item.",
      "Offer product-wide or cross-product search from the shell bar, or keyword search within a list.",
      "Group suggestions with SearchItemGroup; when no results page exists and a group exceeds five results, use action to offer progressive loading."
    ],
    "avoidWhen": [
      {
        "when": "Narrow a result collection by several separate criteria rather than a keyword alone.",
        "use": [
          "filter-bar"
        ]
      },
      {
        "when": "Choose one suggested field value rather than submit a content-search query.",
        "use": [
          "combobox"
        ]
      }
    ],
    "source": "sap-fiori-guidelines"
  }
}
const accessibilityNote = "accessibleName names the field and search landmark. texts names search, clear, scopes and suggestions. ArrowDown enters suggestions, ArrowUp from the first returns to the field, Enter searches and Escape closes while restoring typed text. inputProps forwards native input accessibility."
function ItemDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs") && !story.usesMount).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @fiori/search"
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
