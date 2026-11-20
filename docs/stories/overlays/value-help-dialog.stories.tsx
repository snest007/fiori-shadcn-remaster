import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { expect, fn, userEvent, within } from "storybook/test"
import { ValueHelpDialog, type ValueHelpDialogProps } from "@/components/ui/value-help-dialog"
import { DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"
const products = [
  { id: "HT1000", name: "Notebook Basic 15", supplier: "Northwind Traders" },
  { id: "HT1001", name: "Notebook Basic 17", supplier: "Northwind Traders" },
  { id: "HT1002", name: "Ergo Screen", supplier: "Contoso" },
  { id: "HT1003", name: "Wireless Keyboard", supplier: "Contoso" },
]
const columns = [{ key: "id", label: "Product ID" }, { key: "name", label: "Product" }, { key: "supplier", label: "Supplier" }]
// Source-backed defaults from registry/ui/value-help-dialog.tsx and installed UI5 2.28 i18n defaults.
const textDefaults = [
  {
    "prop": "operatorTexts.EQ",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "equal to"
  },
  {
    "prop": "operatorTexts.BT",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "between"
  },
  {
    "prop": "operatorTexts.Contains",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "contains"
  },
  {
    "prop": "operatorTexts.StartsWith",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "starts with"
  },
  {
    "prop": "operatorTexts.EndsWith",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "ends with"
  },
  {
    "prop": "operatorTexts.LT",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "less than"
  },
  {
    "prop": "operatorTexts.LE",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "less than or equal to"
  },
  {
    "prop": "operatorTexts.GT",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "greater than"
  },
  {
    "prop": "operatorTexts.GE",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "greater than or equal to"
  },
  {
    "prop": "operatorTexts.NE",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "not equal to"
  },
  {
    "prop": "texts.searchAndSelect",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "Search and Select"
  },
  {
    "prop": "texts.defineConditions",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "Define Conditions"
  },
  {
    "prop": "texts.search",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "Search"
  },
  {
    "prop": "texts.go",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "Go"
  },
  {
    "prop": "texts.showFilters",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "Show Filters"
  },
  {
    "prop": "texts.hideFilters",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "Hide Filters"
  },
  {
    "prop": "texts.items",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "Items"
  },
  {
    "prop": "texts.selectedItemsAndConditions",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "Selected Items and Conditions"
  },
  {
    "prop": "texts.ok",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "OK"
  },
  {
    "prop": "texts.cancel",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "Cancel"
  },
  {
    "prop": "texts.add",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "Add"
  },
  {
    "prop": "texts.removeCondition",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "Remove Condition"
  },
  {
    "prop": "texts.removeAll",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "Remove All"
  },
  {
    "prop": "texts.removeToken",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "Remove"
  },
  {
    "prop": "texts.selectAll",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "Select All"
  },
  {
    "prop": "texts.operator",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "Operator"
  },
  {
    "prop": "texts.value",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "Value"
  },
  {
    "prop": "texts.from",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "From"
  },
  {
    "prop": "texts.to",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "To"
  },
  {
    "prop": "texts.noData",
    "key": "Application value-help text; no UI5 Web Component",
    "value": "No data"
  }
]

const base = fioriMeta({ name: "value-help-dialog", component: ValueHelpDialog })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: () => <><DocsPage /><section aria-label="Component localization text keys"><h2>Localization text keys</h2><table><thead><tr><th>Text prop / key</th><th>UI5 key / source</th><th>English default</th></tr></thead><tbody>{textDefaults.map((entry) => <tr key={entry.prop}><td><code>{entry.prop}</code></td><td>{entry.key}</td><td>{entry.value}</td></tr>)}</tbody></table></section></>, story: { inline: false, height: "800px" } } },
  args: { open: false, title: "Products", columns, items: products, keyField: "id", descriptionField: "name", selectionMode: "multiple", supportConditions: true, filters: columns, defaultValue: { keys: ["HT1000"], conditions: [] }, onOpenChange: fn(), onSearch: fn(), onConfirm: fn(), onCancel: fn() },
  argTypes: { ...base.argTypes, open: { control: "boolean" }, title: { control: "text" }, columns: { control: "object" }, items: { control: "object" }, keyField: { control: "text" }, descriptionField: { control: "text" }, selectionMode: { control: "inline-radio", options: ["single", "multiple"] }, supportConditions: { control: "boolean" }, conditionLabel: { control: "text" }, filters: { control: "object" }, operators: { control: "object" }, defaultValue: { control: "object" }, texts: { control: "object" }, operatorTexts: { control: "object" }, portal: { control: false }, onOpenChange: { control: false }, onSearch: { control: false }, onConfirm: { control: false }, onCancel: { control: false } },
  render: function ProductValueHelp(args: ValueHelpDialogProps) {
    const [, updateArgs] = useArgs<ValueHelpDialogProps>()
    const [items, setItems] = React.useState(args.items)
    React.useEffect(() => setItems(args.items), [args.items])
    return <div className="grid gap-2"><ValueHelpDialog {...args} items={items} onOpenChange={(open) => { args.onOpenChange?.(open); updateArgs({ open }); if (open) setItems(args.items) }} onSearch={(query) => { args.onSearch?.(query); const search = query.search.toLocaleLowerCase(); setItems(args.items.filter((item) => (!search || args.columns.some((column) => item[column.key]?.toLocaleLowerCase().includes(search))) && Object.entries(query.filters).every(([key, value]) => !value || item[key]?.toLocaleLowerCase().includes(value.toLocaleLowerCase())))) }} onConfirm={(result) => { args.onConfirm?.(result); updateArgs({ defaultValue: { keys: result.keys, conditions: result.conditions } }) }}><DialogTrigger asChild><Button>Choose products</Button></DialogTrigger></ValueHelpDialog><output>Selected keys: {args.defaultValue?.keys.join(", ") || "None"}</output></div>
  },
} satisfies Meta<typeof ValueHelpDialog>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = { parameters: { docs: { story: { inline: true } } } }
export const Trigger: Story = {}
export const Open: Story = { args: { open: true } }
export const MultipleSelection: Story = { args: { open: true, defaultValue: { keys: ["HT1000", "HT1002"], conditions: [{ operator: "StartsWith", values: ["HT"] }, { operator: "Contains", values: ["100"] }] } } }
export const SingleSelection: Story = { args: { open: true, title: "Select: Product", selectionMode: "single", defaultValue: { keys: [], conditions: [] } } }
export const WithoutConditions: Story = { args: { open: true, supportConditions: false } }
export const WithoutFilters: Story = { args: { open: true, filters: [] } }
export const Empty: Story = { args: { open: true, items: [], defaultValue: { keys: [], conditions: [] } } }
export const CustomTexts: Story = { args: { open: true, texts: { search: "Find products", go: "Search products", ok: "Use products", cancel: "Keep selection", selectedItemsAndConditions: "Chosen products and conditions" }, operatorTexts: { EQ: "matches product ID", Contains: "includes text" } } }
export const RTL: Story = { args: { open: true }, globals: { dir: "rtl" } }

export const German: Story = { globals: { locale: "de" } }
export const CountedTitles: Story = {
  args: {
    defaultValue: { keys: ["HT1000"], conditions: [{ operator: "StartsWith", values: ["HT"] }] },
    texts: {
      itemsWithCount: count => `Rows ${count}`,
      searchAndSelectWithCount: count => `Selected ${count}`,
      defineConditionsWithCount: count => `Rules ${count}`,
      selectedItemsAndConditionsWithCount: count => `Total ${count}`,
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Choose products" }))
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog", { name: "Products" }))
    await expect(dialog.getByRole("grid")).toHaveAccessibleName(`Rows ${products.length}`)
    await expect(dialog.getByRole("tab", { name: "Selected 1" })).toBeVisible()
    await expect(dialog.getByRole("tab", { name: "Rules 1" })).toBeVisible()
    await expect(dialog.getByRole("list", { name: "Total 2" })).toBeVisible()
  },
}
