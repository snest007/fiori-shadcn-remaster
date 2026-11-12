import * as React from "react"

import { useF6Navigation } from "@/lib/fiori-f6"

import { Bar } from "@/components/ui/bar"
import { Button } from "@/components/ui/button"
import { DataTable, createDataTableColumnHelper } from "@/components/ui/data-table"
import { DynamicPage, DynamicPageHeader, DynamicPageTitle } from "@/components/ui/dynamic-page"
import { FilterBar, filterSummary, type FilterDefinition, type FilterBarState } from "@/components/ui/filter-bar"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { ObjectIdentifier } from "@/components/ui/object-identifier"
import { ObjectNumber } from "@/components/ui/object-number"
import { ObjectStatus, type ObjectStatusState } from "@/components/ui/object-status"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TableRowActionNavigation } from "@/components/ui/table"
import { Title } from "@/components/ui/title"
import { VariantManagement } from "@/components/ui/variant-management"
import { localStorageAdapter, useVariantState, type Variant } from "@/lib/fiori-variants"
import { Toolbar, ToolbarButton, ToolbarSpacer } from "@/components/ui/toolbar"
import { action, settings, sort } from "@/lib/fiori-icons"

// F6 follows title, filter header, Table and visible Bar footer; the Table sentinel restores its current row.
// Install on document so portalled Popup containers participate; duplicate block installations share one listener.
// SAP Fiori "List Report" floorplan (guideline: list-report-floorplan-sap-fiori-element):
// DynamicPage whose title is the variant ("Standard"), whose header holds the filter bar, and whose content is the
// table with its own toolbar ("Products (n)" + actions). The header snaps away on scroll; the pin keeps the
// filter bar visible. Selecting rows reveals a footer with a mass action, as in the guideline's edit flow.
// Replace the sample data and handlers with your own.

type Product = {
  id: string
  name: string
  category: string
  supplier: string
  availability: number
  status: { text: string; state: ObjectStatusState }
  price: number
}

const PRODUCTS: Product[] = [
  ["HT-1000", "Premium Scissors - Set of 3", "Scissors & Knives", "Depot-4All", 42, 5.3],
  ["HT-1001", "Office Hole Punch - Black", "Staplers & Hole Punchers", "Depot-4All", 7, 9.89],
  ["HT-1002", "Plastic Box File - Blue", "Files & Binders", "Office-Guru AG", 188, 4.45],
  ["HT-1003", "Tea/Coffee Mugs", "Cups & Mugs", "Office Line Prag", 153, 2.65],
  ["HT-1004", "Energy-Saving LED Lightbulb", "Desk Lamps", "OffiPOR", 0, 21.95],
  ["HT-1005", "Ergonomic Office Chair", "Chairs", "Seat Comfort Inc.", 12, 249.0],
  ["HT-1006", "Whiteboard Markers - 4 Colors", "Writing Supplies", "Depot-4All", 320, 6.49],
  ["HT-1007", "Desk Organizer - Bamboo", "Desk Accessories", "Office-Guru AG", 3, 18.75],
  ["HT-1008", "A4 Copy Paper - 500 Sheets", "Paper", "PaperWorld", 1200, 4.99],
  ["HT-1009", "Wireless Presenter", "Electronics", "Technocom", 25, 39.9],
  ["HT-1010", "Laminating Pouches - 100 Pack", "Office Machines", "Technocom", 0, 12.3],
  ["HT-1011", "Monitor Stand - Adjustable", "Desk Accessories", "Seat Comfort Inc.", 64, 54.0],
].map(([id, name, category, supplier, availability, price]) => ({
  id: id as string,
  name: name as string,
  category: category as string,
  supplier: supplier as string,
  availability: availability as number,
  price: price as number,
  status:
    (availability as number) === 0
      ? { text: "Out of Stock", state: "negative" as const }
      : (availability as number) < 10
        ? { text: "Low Stock", state: "critical" as const }
        : { text: "In Stock", state: "positive" as const },
}))

const CATEGORIES = [...new Set(PRODUCTS.map((p) => p.category))].sort()

// Declarative editors are reused unchanged in the bar and its built-in personalization dialog.
const filters: FilterDefinition[] = [
  {
    key: "category", label: "Category", group: "product", groupLabel: "Product",
    render: ({ id, conditions, onConditionsChange, disabled, valueState, valueStateMessage }) => (
      <Select value={String(conditions[0]?.values[0] ?? "all")} onValueChange={(value) => onConditionsChange(value === "all" ? [] : [{ operator: "EQ", values: [value] }])}>
        <SelectTrigger id={id} aria-label="Category" disabled={disabled} valueState={valueState} valueStateMessage={valueStateMessage}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
        </SelectContent>
      </Select>
    ),
  },
  {
    key: "supplier", label: "Supplier", group: "supplier", groupLabel: "Supplier",
    render: ({ id, conditions, onConditionsChange, disabled, valueState, valueStateMessage }) => (
      <Input id={id} aria-label="Supplier" disabled={disabled} valueState={valueState} valueStateMessage={valueStateMessage} value={String(conditions[0]?.values[0] ?? "")}
        onChange={(event) => onConditionsChange(event.target.value ? [{ operator: "Contains", values: [event.target.value] }] : [])} />
    ),
  },
]

const initialVariants: Variant[] = [
  { key: "standard", title: "Standard", state: { values: {}, visibleKeys: ["category", "supplier"], search: "" } },
]
const variantStorage = localStorageAdapter("fiori-list-report-variants")

const col = createDataTableColumnHelper<Product>()
const columns = col.columns([
  col.accessor("name", {
    header: "Product",
    cell: (c) => <ObjectIdentifier title={c.getValue()} text={c.row.original.id} />,
    meta: { minWidth: "12rem", importance: 10 },
  }),
  col.accessor("category", { header: "Category", meta: { minWidth: "10rem" } }),
  col.accessor("supplier", { header: "Supplier", meta: { minWidth: "9rem" } }),
  col.accessor((p) => p.status.text, {
    id: "status",
    header: "Availability",
    cell: (c) => <ObjectStatus text={c.row.original.status.text} state={c.row.original.status.state} />,
    meta: { minWidth: "8rem" },
  }),
  col.accessor("price", {
    header: "Price",
    cell: (c) => <ObjectNumber number={c.getValue().toFixed(2)} unit="USD" />,
    meta: { horizontalAlign: "End", minWidth: "7rem" },
  }),
])

export default function ListReport() {
  useF6Navigation()
  const [applied, setApplied] = React.useState({ search: "", category: "all", supplier: "" })
  const applyState = (state: FilterBarState) => {
    setApplied({ search: state.search, category: String(state.values.category?.[0]?.values[0] ?? "all"), supplier: String(state.values.supplier?.[0]?.values[0] ?? "") })
    setSelected([])
  }
  const views = useVariantState({ initialVariants, storage: variantStorage, onExecute: applyState })
  const { search, values } = views.state
  const category = String(values.category?.[0]?.values[0] ?? "all")
  const supplier = String(values.supplier?.[0]?.values[0] ?? "")
  const [selected, setSelected] = React.useState<string[]>([])
  const [opened, setOpened] = React.useState<string | null>(null)

  const active = [search && "Search Terms", category !== "all" && "Category", supplier && "Supplier"].filter(Boolean) as string[]
  const rows = PRODUCTS.filter(
    (p) =>
      (!applied.search || `${p.name} ${p.id}`.toLowerCase().includes(applied.search.toLowerCase())) &&
      (applied.category === "all" || p.category === applied.category) &&
      (!applied.supplier || p.supplier.toLowerCase().includes(applied.supplier.toLowerCase()))
  )
  const go = () => {
    applyState(views.state)
  }

  return (
    <div className="h-screen" inert={!views.ready ? true : undefined} data-variants-ready={views.ready ? "" : undefined} data-variants-saving={views.saving ? "" : undefined} aria-busy={!views.ready || views.saving}>
      <DynamicPage
        id="list-report"
        accessibilityAttributes={{ root: { role: "main", name: "Manage Products" } }}
        showFooter={selected.length > 0}
        title={
          <DynamicPageTitle
            heading={
              <VariantManagement
                id="list-report-variants" items={views.variants} selectedKey={views.selectedKey}
                defaultKey={views.defaultKey} modified={views.modified} level="H1" titleStyle="H3"
                popoverTitle="My Views" creationAllowed={views.ready} onClick={(event) => event.stopPropagation()}
                onSelect={({ key }) => views.selectVariant(key)} onSave={views.saveVariant} onManage={views.manageVariants}
              />
            }
            snappedHeading={
              <Title level="H1" size="H4">
                {views.selectedVariant.title}{views.modified ? "*" : ""}
              </Title>
            }
            snappedSubheading={<span data-slot="list-report-summary">{filterSummary(active)}</span>}
            navigationActions={
              <Toolbar aria-label="Page navigation actions" design="transparent">
                <ToolbarButton variant="transparent" size="icon" aria-label="Share" title="Share">
                  <Icon icon={action} />
                </ToolbarButton>
              </Toolbar>
            }
          />
        }
        header={
          <DynamicPageHeader accessibleName="Filter Bar" data-sap-ui-fastnavgroup="true">
            <FilterBar
              className="!p-0 !bg-transparent"
              showToggle={false}
              id="list-report-filter-bar"
              filters={filters} state={views.state} onStateChange={views.setState} initialState={views.savedState}
              onGo={go}
            />
          </DynamicPageHeader>
        }
        footer={
          <Bar
            design="floating-footer"
            endContent={
              <>
                <Button variant="emphasized" onClick={() => setSelected([])}>
                  {`Approve (${selected.length})`}
                </Button>
                <Button variant="transparent" onClick={() => setSelected([])}>
                  Cancel
                </Button>
              </>
            }
          />
        }
      >
        <div className="list-report-table overflow-hidden rounded-(--sapElement_BorderCornerRadius) bg-(--sapGroup_ContentBackground)">
          <Toolbar aria-label="Products toolbar" className="h-[3rem] ps-4 pe-2">
            <Title id="list-report-table-title" level="H2" size="H4" wrappingType="None">
              {`Products (${rows.length})`}
            </Title>
            <ToolbarSpacer />
            <ToolbarButton variant="transparent">Create</ToolbarButton>
            <ToolbarButton variant="transparent" disabled={!selected.length}>
              Delete
            </ToolbarButton>
            <ToolbarButton variant="transparent" size="icon" aria-label="Sort" title="Sort">
              <Icon icon={sort} />
            </ToolbarButton>
            <ToolbarButton variant="transparent" size="icon" aria-label="Settings" title="Settings">
              <Icon icon={settings} />
            </ToolbarButton>
          </Toolbar>
          <DataTable
            aria-labelledby="list-report-table-title"
            data={rows}
            columns={columns}
            getRowId={(r) => r.id}
            selectionMode="multi"
            selectedRows={selected}
            onSelectionChange={setSelected}
            overflowMode="popin"
            stickyHeader
            interactiveRows
            rowNavigated={(r) => r.id === opened}
            onRowClick={(key) => key && setOpened(key)}
            rowActions={() => <TableRowActionNavigation />}
            rowActionCount={1}
            noDataText="No products found. Try adjusting the search or filter parameters."
          />
        </div>
      </DynamicPage>
    </div>
  )
}
