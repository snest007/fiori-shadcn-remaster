import * as React from "react"
import { DataTable, createDataTableColumnHelper } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Title } from "@/components/ui/title"

type Order = { id: string; supplier: string; status: string; total: number }
const SUPPLIERS = ["Northwind Supplies", "Contoso Office", "Fabrikam Industrial", "Adventure Works"]
const STATUSES = ["Pending approval", "Approved", "Shipped", "Delivered"]
const ORDERS: Order[] = Array.from({ length: 5000 }, (_, index) => ({
  id: `PO-${String(10001 + index)}`,
  supplier: SUPPLIERS[index % SUPPLIERS.length],
  status: STATUSES[Math.floor(index / SUPPLIERS.length) % STATUSES.length],
  total: 100 + ((index * 137) % 100000) / 100,
}))
const amounts = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" })
const col = createDataTableColumnHelper<Order>()
const columns = col.columns([
  col.accessor("id", { header: "Order", meta: { importance: 10 } }),
  col.accessor("supplier", { header: "Supplier" }),
  col.accessor("status", { header: "Status" }),
  col.accessor("total", { header: "Total", cell: (cell) => amounts.format(cell.getValue()), meta: { horizontalAlign: "End" } }),
])

export default function OrderTablePage() {
  const [filters, setFilters] = React.useState({ id: "", supplier: "", status: "", minimum: "" })
  // The installed DataTable provides sorting, while the page owns column-filter editors and filtering.
  const rows = React.useMemo(() => ORDERS.filter((order) =>
    order.id.toLocaleLowerCase().includes(filters.id.toLocaleLowerCase()) &&
    order.supplier.toLocaleLowerCase().includes(filters.supplier.toLocaleLowerCase()) &&
    order.status.toLocaleLowerCase().includes(filters.status.toLocaleLowerCase()) &&
    (!filters.minimum || order.total >= Number(filters.minimum))
  ), [filters])

  return (
    <main data-case="case-10" style={{ height: "100vh", boxSizing: "border-box", display: "grid", gridTemplateRows: "auto auto auto minmax(0, 1fr)", gap: "var(--sapContent_Space_S)", padding: "var(--sapContent_Space_S)" }}>
      <Title id="order-table-heading" level="H1" size="H3">Orders</Title>
      <div role="group" aria-label="Column filters" style={{ display: "flex", flexWrap: "wrap", gap: "var(--sapContent_Space_S)" }}>
        {([["id", "Order"], ["supplier", "Supplier"], ["status", "Status"], ["minimum", "Minimum total (USD)"]] as const).map(([key, label]) => (
          <div key={key} style={{ display: "grid", gap: "var(--fiori-table-cell-vertical-padding)", flex: "1 1 auto" }}>
            <Label htmlFor={`order-filter-${key}`}>{label}</Label>
            <Input id={`order-filter-${key}`} type={key === "minimum" ? "number" : "text"} min={key === "minimum" ? 0 : undefined}
              value={filters[key]} onChange={(event) => setFilters((previous) => ({ ...previous, [key]: event.target.value }))} />
          </div>
        ))}
      </div>
      <p role="status" style={{ margin: 0 }}>{rows.length.toLocaleString()} of {ORDERS.length.toLocaleString()} orders. Open a column heading to sort.</p>
      <div style={{ minHeight: 0, overflow: "hidden" }}>
        <DataTable aria-labelledby="order-table-heading" data={rows} columns={columns} getRowId={(order) => order.id}
          virtualize virtualHeight="100%" overscan={0} stickyHeader style={{ height: "100%" }}
          noDataText="No orders match these column filters." />
      </div>
    </main>
  )
}
