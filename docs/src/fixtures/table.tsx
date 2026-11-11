import * as React from "react"
import { FioriDropIndicator } from "@/lib/fiori-drag-and-drop"
import {
  Table,
  TableCell,
  TableGroupRow,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  TableRowAction,
  TableRowActionNavigation,
  type TableRowHighlight,
} from "@/components/ui/table"
import { deleteIcon, edit } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

export type TableFixtureProps = {
  interactive?: boolean
  selection?: "single" | "multi"
  selected?: string[]
  highlight?: boolean
  actions?: boolean
  navigated?: boolean
  group?: boolean
  noData?: boolean
  popin?: boolean
  growing?: boolean
  sort?: boolean
  alternate?: boolean
  dropPlacement?: "Before" | "After" | "On"
}

// Deterministic data shared with table.ui5.ts.
export const TABLE_COLUMNS = [
  { id: "product", label: "Product", importance: 3 },
  { id: "supplier", label: "Supplier", importance: 1 },
  { id: "price", label: "Price", importance: 2, align: "End" as const },
]
export const TABLE_ROWS = [
  { key: "p1", product: "Notebook Basic 15", supplier: "Very Best Screens", price: "956.00 EUR" },
  { key: "p2", product: "Notebook Basic 17", supplier: "Very Best Screens", price: "1,249.00 EUR" },
  { key: "p3", product: "Ergo Screen E-I", supplier: "Smartcards", price: "230.00 EUR" },
  { key: "p4", product: "Flat Basic", supplier: "Technocom", price: "399.00 EUR" },
]
export const TABLE_HIGHLIGHTS: TableRowHighlight[] = ["negative", "critical", "positive", "information"]
export const TABLE_WIDTH = "32rem"
export const TABLE_POPIN_WIDTH = "16rem"

function StaticTableDrop({ children, placement }: { children: React.ReactNode; placement?: "Before" | "After" | "On" }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [elements, setElements] = React.useState<{ owner: HTMLElement; target: HTMLElement } | null>(null)
  React.useLayoutEffect(() => {
    if (!placement || !ref.current) return
    const owner = ref.current.querySelector<HTMLElement>('[data-slot="table"]')!
    setElements({ owner, target: owner.querySelectorAll<HTMLElement>('[data-slot="table-row"]')[1] })
  }, [placement])
  return <div ref={ref} style={{ position: "relative" }}>{children}{elements && <FioriDropIndicator ownerReference={elements.owner} targetReference={elements.target} placement={placement} />}</div>
}

export default defineFixtures<TableFixtureProps>({
  name: "table",
  cases: [
    { id: "table", props: {} },
    { id: "table-interactive", props: { interactive: true }, interact: { selector: '[data-slot="table-row"]', ui5Selector: "ui5-table-row" } },
    { id: "table-drop-indicator-before", props: { dropPlacement: "Before" } },
    { id: "table-drop-indicator-after", props: { dropPlacement: "After" } },
    { id: "table-drop-indicator-on", props: { dropPlacement: "On" } },
    { id: "table-sorted", props: { sort: true } },
    { id: "table-multi", props: { selection: "multi", selected: ["p1", "p3"] } },
    { id: "table-multi-all", props: { selection: "multi", selected: ["p1", "p2", "p3", "p4"] } },
    { id: "table-single", props: { selection: "single", selected: ["p2"] } },
    { id: "table-actions", props: { actions: true, navigated: true } },
    { id: "table-group", props: { group: true } },
    { id: "table-alternate", props: { alternate: true } },
    { id: "table-no-data", props: { noData: true } },
    { id: "table-popin", props: { popin: true } },
    { id: "table-growing", props: { growing: true } },
    { id: "table-highlight", props: { highlight: true } },
  ],
  // ui5-table 2.28 has no row highlight (sap.m.Table's status bar); our highlight follows ui5-li's,
  // so there's nothing to compare it with. Checked by screenshot only.
  skipCompare: ["table-highlight"],
  react: ({ selection, selected, highlight, actions, navigated, group, noData, popin, growing, sort, alternate, dropPlacement, interactive }) => {
    const rows = noData ? [] : TABLE_ROWS
    const renderRow = (r: (typeof TABLE_ROWS)[number], i: number) => (
      <TableRow
        key={r.key}
        rowKey={r.key}
        interactive={interactive}
        navigated={navigated && i === 1}
        highlight={highlight ? TABLE_HIGHLIGHTS[i] : undefined}
        actions={
          actions && (
            <>
              <TableRowAction icon={edit} text="Edit" />
              <TableRowAction icon={deleteIcon} text="Delete" />
              <TableRowActionNavigation interactive />
            </>
          )
        }
      >
        {TABLE_COLUMNS.map((c) => (
          <TableCell key={c.id}>{r[c.id as keyof typeof r]}</TableCell>
        ))}
      </TableRow>
    )
    return (
      <StaticTableDrop placement={dropPlacement}>
      <Table
        aria-label="Products"
        style={{ width: popin ? TABLE_POPIN_WIDTH : TABLE_WIDTH }}
        overflowMode={popin ? "popin" : "scroll"}
        selectionMode={selection ?? "none"}
        selectedRows={selected}
        rowActionCount={actions ? 3 : 0}
        alternateRowColors={alternate}
        growing={growing ? "button" : undefined}
      >
        <TableHeaderRow>
          {TABLE_COLUMNS.map((c) => (
            <TableHeaderCell
              key={c.id}
              importance={c.importance}
              minWidth={popin ? "7rem" : undefined}
              horizontalAlign={c.align}
              sortIndicator={sort && c.id === "product" ? "ascending" : sort && c.id === "price" ? "descending" : undefined}
            >
              {c.label}
            </TableHeaderCell>
          ))}
        </TableHeaderRow>
        {group ? (
          <>
            <TableGroupRow>Very Best Screens</TableGroupRow>
            {rows.slice(0, 2).map(renderRow)}
            <TableGroupRow>Others</TableGroupRow>
            {rows.slice(2).map((r, i) => renderRow(r, i + 2))}
          </>
        ) : (
          rows.map(renderRow)
        )}
      </Table>
      </StaticTableDrop>
    )
  },
})
