import * as React from "react"
import { ArgTypes, Controls, DocsContext, DocsStory, Primary, Title as DocsTitle } from "@storybook/addon-docs/blocks"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { FilterBar, FilterBarItem, type FilterBarProps, type FilterDefinition } from "@/components/ui/filter-bar"
import { Input } from "@/components/ui/input"
import { Title } from "@/components/ui/title"
import { Button } from "@/components/ui/button"
import { docsLink, fioriMeta } from "../_lib/meta"
const filters: FilterDefinition[] = [
  { key: "supplier", label: "Supplier", render: ({ id, conditions, onConditionsChange, required, valueState, valueStateMessage }) => <Input id={id} required={required} valueState={valueState} valueStateMessage={valueStateMessage} value={String(conditions[0]?.values[0] ?? "")} onChange={(event) => onConditionsChange(event.target.value ? [{ operator: "Contains", values: [event.target.value] }] : [])} /> },
  { key: "product", label: "Product", render: ({ id, conditions, onConditionsChange, required, valueState, valueStateMessage }) => <Input id={id} required={required} valueState={valueState} valueStateMessage={valueStateMessage} value={String(conditions[0]?.values[0] ?? "")} onChange={(event) => onConditionsChange(event.target.value ? [{ operator: "Contains", values: [event.target.value] }] : [])} /> },
]
const base = fioriMeta({ name: "filter-bar", component: FilterBar })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: ItemDocs } },
  args: { search: true, searchValue: "", searchPlaceholder: "Search purchase orders", showGoButton: true, showAdaptFilters: true, showToggle: true, liveMode: false, expanded: true, filters, values: {}, visibleKeys: ["supplier", "product"], onSearchChange: fn(), onValuesChange: fn(), onVisibleKeysChange: fn(), onExpandedChange: fn(), onGo: fn(), onAdaptFilters: fn(), onStateChange: fn() },
  argTypes: { ...base.argTypes, search: { control: "boolean" }, searchValue: { control: "text" }, searchPlaceholder: { control: "text" }, showGoButton: { control: "boolean" }, showAdaptFilters: { control: "boolean" }, showToggle: { control: "boolean" }, liveMode: { control: "boolean" }, expanded: { control: "boolean" }, fieldWidth: { control: "text" }, values: { control: "object" }, visibleKeys: { control: "object" }, activeFilters: { control: "object" }, p13nMode: { control: "object" }, filters: { control: false }, variant: { control: false }, variantManagement: { control: false }, texts: { control: false }, adaptFiltersTexts: { control: false }, initialState: { control: false }, state: { control: false }, initialValues: { control: false }, initialVisibleKeys: { control: false }, defaultExpanded: { control: false }, defaultSearchValue: { control: false }, defaultValues: { control: false }, defaultVisibleKeys: { control: false }, onSearchChange: { control: false }, onValuesChange: { control: false }, onVisibleKeysChange: { control: false }, onExpandedChange: { control: false }, onGo: { control: false }, onAdaptFilters: { control: false }, onStateChange: { control: false } },
  render: function OrderFilters(args: FilterBarProps) {
    const [, updateArgs] = useArgs<FilterBarProps>()
    return <FilterBar {...args} variant={<Title level="H2" size="H4">Purchase orders</Title>} onSearchChange={(searchValue) => { args.onSearchChange?.(searchValue); updateArgs({ searchValue }) }} onValuesChange={(values) => { args.onValuesChange?.(values); updateArgs({ values }) }} onVisibleKeysChange={(visibleKeys) => { args.onVisibleKeysChange?.(visibleKeys); updateArgs({ visibleKeys }) }} onExpandedChange={(expanded) => { args.onExpandedChange?.(expanded); updateArgs({ expanded }) }} />
  },
} satisfies Meta<typeof FilterBar>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Expanded: Story = {}
export const Collapsed: Story = { args: { expanded: false, activeFilters: ["Supplier", "Product"] } }
export const LiveMode: Story = { args: { liveMode: true, showGoButton: false } }
export const WithoutSearch: Story = { args: { search: false } }
export const CustomFields: Story = { args: { filters: undefined }, render: function CustomOrderFilters(args) { const [, updateArgs] = useArgs<FilterBarProps>(); return <FilterBar {...args} onSearchChange={(searchValue) => { args.onSearchChange?.(searchValue); updateArgs({ searchValue }) }} onExpandedChange={(expanded) => { args.onExpandedChange?.(expanded); updateArgs({ expanded }) }}><FilterBarItem label="Order number" fieldId="filter-bar-story-order"><Input id="filter-bar-story-order" defaultValue="1001" /></FilterBarItem></FilterBar> } }
export const CustomTexts: Story = { args: { texts: { go: "Apply filters", adaptFilters: "Choose filters", search: "Find purchase orders", hideFilterBar: "Hide order filters", showFilterBar: "Show order filters", noFiltersActive: "All purchase orders" } } }
export const RTL: Story = { globals: { dir: "rtl" } }

// Source-backed defaults from registry/ui/filter-bar.tsx and the installed UI5 bundles.
const textKeys = [
  [
    "texts.go",
    "filterbar.GO",
    "Go"
  ],
  [
    "texts.adaptFilters",
    "filterbar.ADAPT",
    "Adapt Filters"
  ],
  [
    "texts.showFilterBar",
    "Application text; no matching OpenUI5 key",
    "Show Filter Bar"
  ],
  [
    "texts.hideFilterBar",
    "Application text; no matching OpenUI5 key",
    "Hide Filter Bar"
  ],
  [
    "texts.search",
    "filterbar.SEARCH",
    "Search"
  ],
  [
    "texts.noFiltersActive",
    "filterbar.ADAPT_NOTFILTERED",
    "No filters active"
  ],
  [
    "texts.oneFilterActive",
    "filterbar.ADAPT_FILTER_WITH_NON_HIDDEN",
    "1 filter active"
  ],
  [
    "texts.filtersActive",
    "filterbar.ADAPT_FILTERS_WITH_NON_HIDDEN",
    "{0} filters active"
  ],
  [
    "texts.searchTerms",
    "filterbar.ADAPT_SEARCHTERM",
    "Search Terms"
  ],
  [
    "texts.oneFilterActiveHidden",
    "filterbar.ADAPT_FILTER_WITH_HIDDEN",
    "{0} filter active ({1} hidden)"
  ],
  [
    "texts.filtersActiveHidden",
    "filterbar.ADAPT_FILTERS_WITH_HIDDEN",
    "{0} filters active ({1} hidden)"
  ],
  [
    "texts.requiredFilterValueMissing",
    "filterbar.REQUIRED_FILTER_VALUE_MISSING",
    "{0} is a required field."
  ]
]
// Source: registry/items/filter-bar.json and registry/ui/filter-bar.tsx; story-local docs preserve the S0 fiori metadata.
const guide = {
  "description": "Fiori filter bar with declarative condition editors, built-in Adapt Filters personalization, ordered visibility, live search, required-field validation and SAPUI5 active-filter summaries.",
  "usage": {
    "summary": "Let users limit a result collection by several criteria in the page header.",
    "useWhen": [
      "Help users narrow objects in a list report or other result page using several filter criteria.",
      "Let users combine a keyword search with typed fields, then inspect the active-filter summary.",
      "Use liveMode for updates after committed condition changes; otherwise use onGo for manual search."
    ],
    "avoidWhen": [
      {
        "when": "Filter a table inside an object-page section rather than a result-page header.",
        "use": [
          "view-settings-dialog"
        ]
      },
      {
        "when": "Find items in a list using only a keyword query.",
        "use": [
          "search"
        ]
      },
      {
        "when": "Personalize only filter-field visibility, order and conditions in a separate dialog.",
        "use": [
          "adapt-filters-dialog"
        ]
      },
      {
        "when": "Manage named saved views rather than edit the current filter criteria.",
        "use": [
          "variant-management"
        ]
      },
      {
        "when": "Guide users through data-entry steps rather than filter a result collection.",
        "use": [
          "wizard"
        ]
      }
    ],
    "source": "sap-fiori-guidelines"
  }
}
const accessibilityNote = "Every filter renderer must keep its supplied id and matching label, required flag and value-state description. Tab reaches fields and actions; Enter in a field submits Go. texts names the toggle, search and actions; Adapt Filters owns its dialog focus."
function ItemDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs") && !story.usesMount).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @petalo/filter-bar"
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
