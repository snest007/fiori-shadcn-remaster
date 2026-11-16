import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { DataTable, createDataTableColumnHelper, type DataTableProps } from "@/components/ui/data-table"
import { TableRowAction, TableRowActionNavigation, type TableRowHighlight } from "@/components/ui/table"
import { Toolbar, ToolbarButton, ToolbarItem, ToolbarSpacer } from "@/components/ui/toolbar"
import { Button } from "@/components/ui/button"
import { edit } from "@/lib/fiori-icons"
import { fioriMeta } from "../_lib/meta"

type Product = { id: string; name: string; supplier: string; price: number }
const products: Product[] = [
  { id: "p1", name: "Notebook Basic 15", supplier: "Very Best Screens", price: 956 },
  { id: "p2", name: "Notebook Basic 17", supplier: "Very Best Screens", price: 1249 },
  { id: "p3", name: "Ergo Screen E-I", supplier: "Smartcards", price: 230 },
  { id: "p4", name: "Flat Basic", supplier: "Technocom", price: 399 },
]
const col = createDataTableColumnHelper<Product>()
const columns = col.columns([
  col.accessor("name", { header: "Product", meta: { importance: 3, minWidth: "8rem" } }),
  col.accessor("supplier", { header: "Supplier", meta: { importance: 1, minWidth: "9rem" } }),
  col.accessor("price", { header: "Price", cell: (cell) => `${cell.getValue().toFixed(2)} EUR`, meta: { importance: 2, horizontalAlign: "End", minWidth: "7rem" } }),
])
const base = fioriMeta({ name: "data-table", component: DataTable<Product> })
const meta = {
  ...base,
  args: { data: products, columns, getRowId: (row: Product) => row.id, selectionMode: "none", selectedRows: [], sortTrigger: "menu", virtualize: false, loading: false, alternateRowColors: false, stickyHeader: false, "aria-label": "Products", onSelectionChange: fn(), onSortingChange: fn(), onRowClick: fn() },
  argTypes: {
    ...base.argTypes,
    data: { ...base.argTypes?.data, control: "object" }, columns: { ...base.argTypes?.columns, control: false }, getRowId: { ...base.argTypes?.getRowId, control: false },
    selectionMode: { control: "inline-radio", options: ["none", "single", "multi"] },
    selectionBehavior: { control: "inline-radio", options: ["rowSelector", "rowOnly"] },
    sortTrigger: { ...base.argTypes?.sortTrigger, control: "inline-radio", options: ["menu", "click", "none"] },
    overflowMode: { control: "inline-radio", options: ["scroll", "popin"] },
    virtualize: { ...base.argTypes?.virtualize, control: "boolean" }, loading: { control: "boolean" },
    alternateRowColors: { control: "boolean" }, stickyHeader: { control: "boolean" }, interactiveRows: { control: "boolean" },
    selectedRows: { control: "object" }, sorting: { control: "object" },
    virtualHeight: { control: "text" }, rowHeight: { control: "number" }, noDataText: { control: "text" },
    growing: { control: "select", options: [undefined, "button", "scroll"] },
    rowHighlight: { control: false }, rowNavigated: { control: false }, rowActions: { control: false }, rowMovable: { control: false },
    onSelectionChange: { control: false }, onSortingChange: { ...base.argTypes?.onSortingChange, control: false }, onRowClick: { control: false }, onLoadMore: { control: false },
  },
  render: function ProductsTable(args: DataTableProps<Product>) {
    const [, updateArgs] = useArgs<DataTableProps<Product>>()
    return <DataTable {...args} onSelectionChange={(selectedRows) => { args.onSelectionChange?.(selectedRows); updateArgs({ selectedRows }) }} onSortingChange={(sorting) => { args.onSortingChange?.(sorting); updateArgs({ sorting }) }} />
  },
} satisfies Meta<DataTableProps<Product>>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const NoSelection: Story = {}
export const SingleSelection: Story = { args: { selectionMode: "single", selectedRows: ["p2"] } }
export const MultiSelection: Story = { args: { selectionMode: "multi", selectedRows: ["p1", "p3"] } }
export const AllSelected: Story = { args: { selectionMode: "multi", selectedRows: products.map((product) => product.id) } }
export const ClickSorting: Story = { args: { sortTrigger: "click" } }
export const Sorted: Story = { args: { sortTrigger: "click", sorting: [{ id: "price", desc: false }] } }
export const NoSorting: Story = { args: { sortTrigger: "none" } }
export const Empty: Story = { args: { data: [], noDataText: "No products found" } }
export const Loading: Story = { args: { loading: true, loadingDelay: 0 } }
export const AlternateRows: Story = { args: { alternateRowColors: true } }
export const HighlightedRows: Story = { args: { rowHighlight: (row) => ({ p1: "negative", p2: "critical", p3: "positive", p4: "information" } as Record<string, TableRowHighlight>)[row.id] } }
export const InteractiveRows: Story = { args: { interactiveRows: true } }
export const RowActions: Story = { args: { rowActionCount: 2, rowNavigated: (row) => row.id === "p2", rowActions: () => <><TableRowAction icon={edit} text="Edit product" onClick={fn()} /><TableRowActionNavigation /></> } }
export const NarrowPopin: Story = { args: { overflowMode: "popin" }, decorators: [(Story) => <div className="max-w-xs"><Story /></div>] }
export const Virtualized: Story = { args: { data: Array.from({ length: 1000 }, (_, index) => ({ id: `product-${index}`, name: `Product ${index + 1}`, supplier: "Northwind Traders", price: 100 + index })), virtualize: true, virtualHeight: "20rem", selectionMode: "single" } }
export const LongText: Story = { args: { data: [{ id: "long", name: "Professional widescreen monitor with adjustable height and integrated docking station", supplier: "Northwind International Procurement Services", price: 1250 }] } }
export const Growing: Story = { render: function GrowingProducts() {
  const [rows, setRows] = React.useState(products)
  return <DataTable data={rows} columns={columns} getRowId={(row) => row.id} aria-label="Growing product list" growing="button" onLoadMore={() => setRows((current) => [...current, { id: `p${current.length + 1}`, name: `Product ${current.length + 1}`, supplier: "Northwind Traders", price: 250 }])} />
} }
export const WithToolbar: Story = { render: function ProductWorklist() {
  const [selected, setSelected] = React.useState<string[]>([])
  const [rows, setRows] = React.useState(products)
  return <div className="grid gap-2"><Toolbar aria-label="Product actions"><ToolbarItem><span>Products ({rows.length})</span></ToolbarItem><ToolbarSpacer /><ToolbarButton variant="emphasized" onClick={() => setRows((current) => [...current, { id: `p${current.length + 1}`, name: "New product", supplier: "Northwind Traders", price: 100 }])}>Create</ToolbarButton><ToolbarItem><Button disabled={!selected.length} onClick={() => { setRows((current) => current.filter((row) => !selected.includes(row.id))); setSelected([]) }}>Delete</Button></ToolbarItem></Toolbar><DataTable data={rows} columns={columns} getRowId={(row) => row.id} aria-label="Products" selectionMode="multi" selectedRows={selected} onSelectionChange={setSelected} /></div>
} }
