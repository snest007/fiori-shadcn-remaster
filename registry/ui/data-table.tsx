import * as React from "react"
import { useFioriTexts, useFioriLocale } from "@/lib/fiori-locale"
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
  type CellData,
  type ColumnDef,
  type RowData,
  type SortingState,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"

import { sortAscending, sortDescending } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu"
import {
  Table,
  TableCell,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  type TableHorizontalAlign,
  type TableProps,
  type TableRowHighlight,
} from "@/components/ui/table"

// A data-driven Fiori table: TanStack Table v9 column definitions rendered with the Table primitives.
//
// Sorting: ui5-table 2.28 only renders the state (sort icon + aria-sort on the header cell, its
// `sortIndicator`) and leaves the interaction to the app. As in Fiori's column header menu (sap.m.Table),
// sortTrigger="menu" (default) opens a Sort Ascending / Sort Descending menu when the header cell is pressed
// (click, Enter or Space); sortTrigger="click" cycles asc → desc → none on press instead.
//
// Virtualization (`virtualize`) renders only the rows in view with @tanstack/react-virtual and keeps
// aria-rowcount / aria-rowindex on the full count, like ui5-table-virtualizer (fixed row height).

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns,
  columnMeta: {} as DataTableColumnMeta,
})

type DataTableColumnMeta = {
  /** Column width (any CSS width). */
  width?: string
  minWidth?: string
  /** Popin priority (lower moves into the popin first). */
  importance?: number
  popinText?: string
  popinHidden?: boolean
  horizontalAlign?: TableHorizontalAlign
}

type DataTableFeatures = typeof features
type DataTableColumnDef<TData extends RowData, TValue extends CellData = CellData> = ColumnDef<DataTableFeatures, TData, TValue>

/** Typed column helper for DataTable: `const col = createDataTableColumnHelper<Product>()`. */
const createDataTableColumnHelper = <TData extends RowData>() => createColumnHelper<DataTableFeatures, TData>()

type DataTableTexts = { sortAscending: string; sortDescending: string }
const defaultDataTableTexts: DataTableTexts = { sortAscending: "Sort Ascending", sortDescending: "Sort Descending" }

/**
 * @accessibility aria-label / aria-labelledby name the inner Table grid. Table owns row/gridcell/columnheader roles, selection states and row/column indices; custom cell JSX stays inside that owned gridcell. Virtualization keeps the full aria-rowcount and absolute aria-rowindex.
 * @accessibility The table is one Tab stop. Arrows navigate rows/cells (horizontal arrows mirror in RTL); Home/End and PageUp/Down navigate; F2/Enter enters cell content and F2/Escape returns. Space selects rows; Ctrl+A / Ctrl+Shift+A selects/clears multi-selection. Sort headers preserve aria-sort.
 * @accessibility texts overrides inherited Table names and announcements; dataTableTexts names the application sorting-menu actions. Native aria-describedby is forwarded to the Table wrapper; the grid has the component's selection aria-description.
 */
type DataTableProps<TData extends RowData> = Omit<TableProps, "children" | "virtualRows" | "selectedRows" | "defaultSelectedRows"> & {
  data: TData[]
  columns: DataTableColumnDef<TData, any>[] // eslint-disable-line @typescript-eslint/no-explicit-any
  /** Stable row key (needed for selection); defaults to the row index. */
  getRowId?: (row: TData, index: number) => string
  sorting?: SortingState
  defaultSorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  /** How sorting is offered: a menu button in the header cell (default), a click on the header cell, or not at all. */
  sortTrigger?: "menu" | "click" | "none"
  /** Sticky header row. */
  stickyHeader?: boolean
  selectedRows?: string[]
  defaultSelectedRows?: string[]
  rowHighlight?: (row: TData) => TableRowHighlight | undefined
  rowNavigated?: (row: TData) => boolean
  /** Row actions per row (TableRowAction / TableRowActionNavigation elements). */
  rowActions?: (row: TData) => React.ReactNode
  interactiveRows?: boolean
  /** Row movability. onMoveOver/onMove are passed to Table; callers reorder their data.
   * Like UI5 TableDragAndDrop._ondragover + TableVirtualizer, destinations are mounted rows only.
   * Dragging does not materialize unseen data; scroll to render another destination. */
  rowMovable?: boolean | ((row: TData) => boolean)
  /** Render only the rows in view. Needs a fixed `rowHeight` (px) and a height (`virtualHeight` or className). */
  virtualize?: boolean
  rowHeight?: number
  virtualHeight?: string
  overscan?: number
  /** Override the Sort Ascending / Sort Descending names on the sorting menu items. */
  dataTableTexts?: Partial<DataTableTexts>
}

function DataTable<TData extends RowData>({
  data,
  columns,
  getRowId,
  sorting: sortingProp,
  defaultSorting,
  onSortingChange,
  sortTrigger = "menu",
  stickyHeader,
  rowHighlight,
  rowNavigated,
  rowActions,
  interactiveRows,
  rowMovable,
  virtualize = false,
  rowHeight = 45,
  virtualHeight,
  overscan = 5,
  dataTableTexts,
  style,
  ...props
}: DataTableProps<TData>) {
  const { locale, localized } = useFioriLocale(props.locale)
  const collator = React.useMemo(() => new Intl.Collator(locale, { sensitivity: "base" }), [locale])
  const texts = useFioriTexts(defaultDataTableTexts, defaultDataTableTextsKeys, dataTableTexts, props.locale)
  const [uncontrolledSorting, setUncontrolledSorting] = React.useState<SortingState>(defaultSorting ?? [])
  const sorting = sortingProp ?? uncontrolledSorting
  const table = useTable({
    features,
    defaultColumn: localized ? { sortFn: (rowA, rowB, columnId) => { const a = rowA.getValue(columnId), b = rowB.getValue(columnId); return typeof a === "string" && typeof b === "string" ? collator.compare(a, b) : Number(a) - Number(b) } } : undefined,
    columns,
    data,
    getRowId: getRowId ? (row: TData, index: number) => getRowId(row, index) : undefined,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater
      if (sortingProp === undefined) setUncontrolledSorting(next)
      onSortingChange?.(next)
    },
    enableSortingRemoval: true,
    sortDescFirst: false,
  })
  const rows = table.getRowModel().rows
  const headers = table.getHeaderGroups().at(-1)?.headers ?? []

  const gridRef = React.useRef<HTMLDivElement | null>(null)
  const virtualizer = useVirtualizer({
    count: virtualize ? rows.length : 0,
    getScrollElement: () => gridRef.current,
    estimateSize: () => rowHeight,
    overscan,
    getItemKey: (i) => rows[i]?.id ?? i,
  })
  const items = virtualize ? virtualizer.getVirtualItems() : []
  const rendered = virtualize ? items.map((it) => ({ row: rows[it.index], position: it.index })) : rows.map((row, i) => ({ row, position: undefined as number | undefined, i }))
  const offset = virtualize && items.length ? items[0].start : 0

  return (
    <Table
      {...props}
      gridRef={gridRef}
      virtualRows={virtualize ? { count: rows.length, rowHeight, offset } : undefined}
      style={virtualize && virtualHeight ? ({ ...style, "--fiori-x-table-height": virtualHeight } as React.CSSProperties) : style}
    >
      <TableHeaderRow sticky={stickyHeader || virtualize}>
        {headers.map((header) => {
          const column = header.column
          const meta = column.columnDef.meta ?? {}
          const canSort = sortTrigger !== "none" && column.getCanSort()
          const sorted = column.getIsSorted()
          return (
            <SortableHeaderCell
              key={header.id}
              trigger={canSort ? sortTrigger : "none"}
              sorted={sorted}
              texts={texts}
              onSort={(desc) => (desc === null ? column.toggleSorting(undefined, false) : column.toggleSorting(desc, false))}
              width={meta.width}
              minWidth={meta.minWidth}
              importance={meta.importance}
              popinText={meta.popinText}
              popinHidden={meta.popinHidden}
              horizontalAlign={meta.horizontalAlign}
            >
              {header.isPlaceholder ? null : <table.FlexRender header={header} />}
            </SortableHeaderCell>
          )
        })}
      </TableHeaderRow>
      {rendered.map(({ row, position }) => {
        if (!row) return null
        return (
          <TableRow
            key={row.id}
            rowKey={row.id}
            position={position}
            interactive={interactiveRows}
            movable={typeof rowMovable === "function" ? rowMovable(row.original) : rowMovable}
            highlight={rowHighlight?.(row.original)}
            navigated={rowNavigated?.(row.original)}
            actions={rowActions?.(row.original)}
          >
            {row.getAllCells().map((cell) => (
              <TableCell key={cell.id}>
                <table.FlexRender cell={cell} />
              </TableCell>
            ))}
          </TableRow>
        )
      })}
    </Table>
  )
}

type SortableHeaderCellProps = React.ComponentProps<typeof TableHeaderCell> & {
  trigger: "menu" | "click" | "none"
  sorted: false | "asc" | "desc"
  texts: DataTableTexts
  /** true = descending, false = ascending, null = next in the asc → desc → none cycle. */
  onSort: (desc: boolean | null) => void
}

/** A header cell that sorts on press: directly ("click") or through a Sort Ascending / Descending menu ("menu"). */
function SortableHeaderCell({ trigger, sorted, texts, onSort, children, className, onClick, onKeyDown, ...props }: SortableHeaderCellProps) {
  const [open, setOpen] = React.useState(false)
  const cellRef = React.useRef<HTMLDivElement>(null)
  const indicator = sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"
  if (trigger === "none")
    return (
      <TableHeaderCell sortIndicator={indicator} className={className} onClick={onClick} onKeyDown={onKeyDown} {...props}>
        {children}
      </TableHeaderCell>
    )
  const activate = () => (trigger === "menu" ? setOpen(true) : onSort(null))
  return (
    <TableHeaderCell
      ref={cellRef}
      sortIndicator={indicator}
      aria-haspopup={trigger === "menu" ? "menu" : undefined}
      aria-expanded={trigger === "menu" ? open : undefined}
      data-sortable=""
      className={cn("relative cursor-pointer", className)}
      onClick={(e) => {
        onClick?.(e)
        // React bubbles events from the portaled menu through here; only real presses on the cell count.
        if (!e.defaultPrevented && e.currentTarget.contains(e.target as Node)) activate()
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented || e.target !== e.currentTarget || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          e.stopPropagation()
          activate()
        }
      }}
      {...props}
    >
      {children}
      {trigger === "menu" && (
        <Menu open={open} onOpenChange={setOpen} modal={false}>
          {/* Positioning anchor only: the cell itself opens the menu (keeps arrow keys for grid navigation). */}
          <MenuTrigger asChild>
            <span aria-hidden tabIndex={-1} className="pointer-events-none absolute inset-0" />
          </MenuTrigger>
          <MenuContent
            align="start"
            onCloseAutoFocus={(e) => {
              e.preventDefault()
              // Back to the header cell (the table makes it the current item and its tab stop).
              cellRef.current?.setAttribute("tabindex", "-1")
              cellRef.current?.focus()
            }}
          >
            <MenuItem icon={sortAscending} onSelect={() => onSort(false)}>
              {texts.sortAscending}
            </MenuItem>
            <MenuItem icon={sortDescending} onSelect={() => onSort(true)}>
              {texts.sortDescending}
            </MenuItem>
          </MenuContent>
        </Menu>
      )}
    </TableHeaderCell>
  )
}

export { DataTable, createDataTableColumnHelper, defaultDataTableTexts, type DataTableProps, type DataTableColumnDef, type DataTableColumnMeta, type DataTableFeatures, type DataTableTexts }

// UI5 keys resolved at their rendered/announced owner.
const defaultDataTableTextsKeys = {
  "sortAscending": "TBL_SORT_ASC",
  "sortDescending": "TBL_SORT_DESC"
} as const
