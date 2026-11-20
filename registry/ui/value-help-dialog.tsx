// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { useFioriTexts, useFioriLocale, collatorIncludes } from "@/lib/fiori-locale"
import { useIsPhone } from "@/lib/use-is-phone"

import { decline, search as searchIcon } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FilterBarItem } from "@/components/ui/filter-bar"
import { Icon } from "@/components/ui/icon"
import { Input, InputIcon } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// ValueHelpDialog after the SAP Fiori design guidelines ("Value Help Dialog") and SAPUI5's
// sap.ui.comp.valuehelpdialog.ValueHelpDialog / sap.ui.mdc value help. There is no UI5 Web Component.
// Anatomy: header title; icon tab bar "Search and Select (n)" / "Define Conditions (n)" (tabs only when
// conditions are supported); basic search with "Go" and "Show Filters" / "Hide Filters" (filter fields
// above the result table); "Items (n)" result table (checkbox column in multi selection); "Selected Items
// and Conditions (n)" with the tokens (selected items as "Description (Key)", conditions as "=X", "X*",
// "*X*", "X...Y", "!(=X)", ...) and a clear-all button; footer OK + Cancel (single selection: Cancel only,
// choosing a row confirms it at once).
// Keyboard: dialog focus trap and Escape (Cancel) come from Dialog. Result table rows form one Tab stop:
// ↑/↓ / Home / End move, Space toggles (multi) or Enter / Space chooses (single). Enter in the search or a
// filter field runs Go. Tokens: Delete or Backspace on a token removes it.
// Searching: without `onSearch` the dialog filters `items` itself (search across all columns, filter fields
// "contains" per column) when Go is pressed; with `onSearch` the caller filters and passes new `items`.

type ValueHelpColumn = { key: string; label: string }
type ValueHelpItem = Record<string, string>
type ConditionOperator = "EQ" | "BT" | "Contains" | "StartsWith" | "EndsWith" | "LT" | "LE" | "GT" | "GE" | "NE"
type ValueHelpCondition = { operator: ConditionOperator; values: [string] | [string, string] }
type ValueHelpValue = { keys: string[]; conditions: ValueHelpCondition[] }
type ValueHelpResult = ValueHelpValue & { items: ValueHelpItem[] }

const operatorLabels: Record<ConditionOperator, string> = {
  EQ: "equal to",
  BT: "between",
  Contains: "contains",
  StartsWith: "starts with",
  EndsWith: "ends with",
  LT: "less than",
  LE: "less than or equal to",
  GT: "greater than",
  GE: "greater than or equal to",
  NE: "not equal to",
}

/** Token text of a condition, as SAPUI5 formats it. */
function formatCondition({ operator, values: [a, b] }: ValueHelpCondition) {
  switch (operator) {
    case "EQ": return `=${a}`
    case "BT": return `${a}...${b ?? ""}`
    case "Contains": return `*${a}*`
    case "StartsWith": return `${a}*`
    case "EndsWith": return `*${a}`
    case "LT": return `<${a}`
    case "LE": return `<=${a}`
    case "GT": return `>${a}`
    case "GE": return `>=${a}`
    case "NE": return `!(=${a})`
  }
}

const conditionFilled = (c: ValueHelpCondition) => !!c.values[0] && (c.operator !== "BT" || !!c.values[1])

type ValueHelpTexts = {
  /** Counted UI5 titles; existing scalar title texts keep precedence when supplied. */
  searchAndSelectWithCount?: (count: number) => string
  defineConditionsWithCount?: (count: number) => string
  itemsWithCount?: (count: number) => string
  selectedItemsAndConditionsWithCount?: (count: number) => string
  searchAndSelect: string
  defineConditions: string
  search: string
  go: string
  showFilters: string
  hideFilters: string
  items: string
  selectedItemsAndConditions: string
  ok: string
  cancel: string
  add: string
  removeCondition: string
  removeAll: string
  removeToken: string
  selectAll: string
  operator: string
  value: string
  from: string
  to: string
  noData: string
}
const defaultTexts: Required<ValueHelpTexts> = {
  searchAndSelectWithCount: count => `Search and Select (${count})`, // UI5 valuehelp.SELECTFROMLIST
  defineConditionsWithCount: count => `Define Conditions (${count})`, // UI5 valuehelp.DEFINECONDITIONS
  itemsWithCount: count => `Items (${count})`, // UI5 valuehelp.TABLETITLE
  selectedItemsAndConditionsWithCount: count => `Selected Items and Conditions (${count})`, // UI5 valuehelp.TOKENIZERTITLE
  searchAndSelect: "Search and Select",
  defineConditions: "Define Conditions",
  search: "Search",
  go: "Go",
  showFilters: "Show Filters",
  hideFilters: "Hide Filters",
  items: "Items",
  selectedItemsAndConditions: "No Items or Conditions Selected", // UI5 valuehelp.TOKENIZERTITLENONUMBER
  ok: "OK",
  cancel: "Cancel",
  add: "Add",
  removeCondition: "Remove Condition",
  removeAll: "Remove All",
  removeToken: "Remove",
  selectAll: "Select All",
  operator: "Operator",
  value: "Value",
  from: "From",
  to: "To",
  noData: "No data",
}

/** @accessibility title names the dialog. texts names search, conditions, selection and token-removal controls; operatorTexts names operators. Arrow Up/Down and Home/End move result-row focus; Space toggles multiple selection, Enter/Space confirms single selection, and Escape cancels and restores focus. */
type ValueHelpDialogProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Dialog title, e.g. "Product" (multi) or "Select: Product" (single). */
  title: string
  columns: ValueHelpColumn[]
  items: ValueHelpItem[]
  /** Column holding the key (token: "Description (Key)"). */
  keyField: string
  /** Column holding the description; tokens show the key only without it. */
  descriptionField?: string
  selectionMode?: "single" | "multiple"
  /** "Define Conditions" tab (multi selection only). Default true. */
  supportConditions?: boolean
  /** Title above the condition rows (the field's label), e.g. "Product". Defaults to `title`. */
  conditionLabel?: string
  operators?: ConditionOperator[]
  /** Fields of the filter area ("Show Filters"); text inputs filtering the matching column. */
  filters?: ValueHelpColumn[]
  /** Initial selection when the dialog opens. */
  defaultValue?: ValueHelpValue
  /** Server-side search: called on Go; pass the new `items`. Without it the dialog filters `items` itself. */
  onSearch?: (query: { search: string; filters: Record<string, string> }) => void
  onConfirm?: (result: ValueHelpResult) => void
  onCancel?: () => void
  locale?: string
  texts?: Partial<ValueHelpTexts>
  operatorTexts?: Partial<Record<ConditionOperator, string>>
  /** Render in place instead of in a portal (no overlay). */
  portal?: boolean
  className?: string
  /** Opener (e.g. a DialogTrigger). */
  children?: React.ReactNode
}

const emptyCondition = (op: ConditionOperator): ValueHelpCondition => ({ operator: op, values: [""] })

function ValueHelpDialog({
  open: openProp,
  defaultOpen,
  onOpenChange,
  title,
  columns,
  items,
  keyField,
  descriptionField,
  selectionMode = "multiple",
  supportConditions = true,
  conditionLabel,
  operators = ["EQ", "BT", "Contains", "StartsWith", "EndsWith", "LT", "LE", "GT", "GE", "NE"],
  filters = [],
  defaultValue,
  onSearch,
  onConfirm,
  onCancel,
  texts,
  locale: localeProp,
  operatorTexts,
  portal = true,
  className,
  children,
}: ValueHelpDialogProps) {
  const phone = useIsPhone()
  const { locale, localized, hasProvider } = useFioriLocale(localeProp)
  const matchLocale = localized ? locale : undefined
  const t = useFioriTexts<Required<ValueHelpTexts>>(defaultTexts, defaultTextsKeys, texts, localeProp)
  // Conditions.getFormattedTitle, FilterableListContent.getFormattedTitle and
  // MTable._updateHeaderText choose numbered keys for nonzero counts. Preserve
  // the pre-E5 scalar-title/count behavior without a locale/text provider.
  const countedTitle = (base: string, explicitBase: string | undefined, count: number, formatted: (count: number) => string, explicitCounted: ((count: number) => string) | undefined) => explicitCounted ? formatted(count) : explicitBase !== undefined ? `${base} (${count})` : count > 0 || !(localized || hasProvider) ? formatted(count) : base
  const opLabel = { ...operatorLabels, ...operatorTexts }
  const multi = selectionMode === "multiple"
  const withConditions = multi && supportConditions
  const [innerOpen, setInnerOpen] = React.useState(!!defaultOpen)
  const open = openProp ?? innerOpen
  const setOpen = (o: boolean) => {
    if (openProp === undefined) setInnerOpen(o)
    onOpenChange?.(o)
  }

  const initialConditions = () => {
    const cs = defaultValue?.conditions ?? []
    return cs.length ? cs : [emptyCondition(operators[0])]
  }
  const [keys, setKeys] = React.useState<string[]>(defaultValue?.keys ?? [])
  const [conditions, setConditions] = React.useState<ValueHelpCondition[]>(initialConditions)
  const [tab, setTab] = React.useState("search")
  const [searchText, setSearchText] = React.useState("")
  const [filterValues, setFilterValues] = React.useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = React.useState(false)
  const [applied, setApplied] = React.useState<{ search: string; filters: Record<string, string> }>({ search: "", filters: {} })
  const tableRef = React.useRef<HTMLTableSectionElement>(null)

  // A fresh session each time the dialog opens.
  React.useEffect(() => {
    if (!open) return
    setKeys(defaultValue?.keys ?? [])
    setConditions(initialConditions())
    setTab("search")
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const rows = React.useMemo(() => {
    if (onSearch) return items
    const s = applied.search.trim()
    return items.filter(
      (it) =>
        (!s || columns.some((c) => collatorIncludes(it[c.key] ?? "", s, matchLocale))) &&
        Object.entries(applied.filters).every(([k, v]) => !v.trim() || collatorIncludes(it[k] ?? "", v.trim(), matchLocale))
    )
  }, [items, applied, columns, onSearch, matchLocale])

  const go = () => {
    const q = { search: searchText, filters: filterValues }
    setApplied(q)
    onSearch?.(q)
  }
  const tokenText = (key: string) => {
    const it = items.find((i) => i[keyField] === key)
    return descriptionField && it?.[descriptionField] ? `${it[descriptionField]} (${key})` : key
  }
  const filledConditions = conditions.filter(conditionFilled)
  const result = (): ValueHelpResult => ({
    keys,
    conditions: filledConditions,
    items: keys.map((k) => items.find((i) => i[keyField] === k)).filter(Boolean) as ValueHelpItem[],
  })
  const confirm = (r: ValueHelpResult) => {
    onConfirm?.(r)
    setOpen(false)
  }
  const cancel = () => {
    onCancel?.()
    setOpen(false)
  }
  const toggleKey = (k: string) => setKeys((ks) => (ks.includes(k) ? ks.filter((x) => x !== k) : [...ks, k]))
  const choose = (row: ValueHelpItem) => {
    if (multi) toggleKey(row[keyField])
    else confirm({ keys: [row[keyField]], conditions: [], items: [row] })
  }
  const visibleKeys = rows.map((r) => r[keyField])
  const allSelected = visibleKeys.length > 0 && visibleKeys.every((k) => keys.includes(k))
  const someSelected = visibleKeys.some((k) => keys.includes(k))

  // Roving tab stop on the result rows.
  React.useLayoutEffect(() => {
    const trs = [...(tableRef.current?.querySelectorAll<HTMLElement>("tr[data-row]") ?? [])]
    if (trs.length && !trs.some((r) => r.tabIndex === 0)) trs[0].tabIndex = 0
  })

  const itemsTitle = countedTitle(t.items, texts?.items, rows.length, t.itemsWithCount, texts?.itemsWithCount)
  const searchTitle = countedTitle(t.searchAndSelect, texts?.searchAndSelect, keys.length, t.searchAndSelectWithCount, texts?.searchAndSelectWithCount)
  const conditionsTitle = countedTitle(t.defineConditions, texts?.defineConditions, filledConditions.length, t.defineConditionsWithCount, texts?.defineConditionsWithCount)
  const searchPage = (
    <div className="fiori-vhd__search-page">
      <div
        className="fiori-vhd__search-row"
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.target instanceof HTMLInputElement) go()
        }}
      >
        <Input
          type="search"
          aria-label={t.search}
          placeholder={t.search}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          wrapperClassName="fiori-vhd__search"
          icon={
            <InputIcon>
              <Icon icon={searchIcon} />
            </InputIcon>
          }
        />
        <div className="fiori-vhd__search-actions">
          <Button variant="emphasized" onClick={go}>
            {t.go}
          </Button>
          {filters.length > 0 && (
            <Button variant="transparent" aria-expanded={showFilters} onClick={() => setShowFilters((s) => !s)}>
              {showFilters ? t.hideFilters : t.showFilters}
            </Button>
          )}
        </div>
      </div>
      {filters.length > 0 && showFilters && (
        <div
          className="fiori-vhd__filters"
          data-slot="value-help-filters"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.target instanceof HTMLInputElement) go()
          }}
        >
          {filters.map((f) => (
            <FilterBarItem key={f.key} label={f.label} fieldId={`vhd-filter-${f.key}`}>
              <Input
                id={`vhd-filter-${f.key}`}
                value={filterValues[f.key] ?? ""}
                onChange={(e) => setFilterValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            </FilterBarItem>
          ))}
        </div>
      )}
      <h2 className="fiori-vhd__section-title fiori-vhd__items-title">{itemsTitle}</h2>
      <div className="fiori-vhd__table-wrap">
        <table className="fiori-vhd__table" aria-label={itemsTitle} aria-multiselectable={multi || undefined} role="grid">
          <thead>
            <tr>
              {multi && (
                <th className="fiori-vhd__select-cell" scope="col">
                  <Checkbox
                    aria-label={t.selectAll}
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={() =>
                      setKeys((ks) => (allSelected ? ks.filter((k) => !visibleKeys.includes(k)) : [...new Set([...ks, ...visibleKeys])]))
                    }
                  />
                </th>
              )}
              {columns.map((c) => (
                <th key={c.key} scope="col">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            ref={tableRef}
            onKeyDown={(e) => {
              const tr = (e.target as HTMLElement).closest<HTMLElement>("tr[data-row]")
              if (!tr || e.target !== tr) return
              const trs = [...e.currentTarget.querySelectorAll<HTMLElement>("tr[data-row]")]
              const i = trs.indexOf(tr)
              const n = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: trs.length - 1 }[e.key]
              if (n !== undefined) {
                e.preventDefault()
                const next = trs[Math.min(Math.max(n, 0), trs.length - 1)]
                trs.forEach((r) => (r.tabIndex = r === next ? 0 : -1))
                next.focus()
                return
              }
              if (e.key === " " || (e.key === "Enter" && !multi)) {
                e.preventDefault()
                choose(rows[i])
              }
            }}
          >
            {rows.map((row) => {
              const k = row[keyField]
              const selected = keys.includes(k)
              return (
                <tr
                  key={k}
                  data-row=""
                  data-selected={multi && selected ? "" : undefined}
                  aria-selected={multi ? selected : undefined}
                  tabIndex={-1}
                  onClick={() => choose(row)}
                  onFocus={(e) =>
                    tableRef.current?.querySelectorAll<HTMLElement>("tr[data-row]").forEach((r) => (r.tabIndex = r === e.currentTarget ? 0 : -1))
                  }
                >
                  {multi && (
                    <td className="fiori-vhd__select-cell">
                      <Checkbox
                        checked={selected}
                        tabIndex={-1}
                        aria-label={tokenText(k)}
                        // The row handles the toggle (also for clicks on the box).
                        onClick={(e) => e.preventDefault()}
                      />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key}>{row[c.key]}</td>
                  ))}
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + (multi ? 1 : 0)} className="fiori-vhd__no-data">
                  {t.noData}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  const conditionsPage = (
    <div className="fiori-vhd__conditions" data-slot="value-help-conditions">
      <h2 className="fiori-vhd__section-title">{conditionLabel ?? title}</h2>
      {conditions.map((c, i) => {
        const set = (next: ValueHelpCondition) => setConditions((cs) => cs.map((x, j) => (j === i ? next : x)))
        return (
          <div key={i} className="fiori-vhd__condition" data-slot="value-help-condition">
            <Select
              value={c.operator}
              onValueChange={(op) =>
                set({ operator: op as ConditionOperator, values: op === "BT" ? [c.values[0], c.values[1] ?? ""] : [c.values[0]] })
              }
            >
              <SelectTrigger aria-label={t.operator} wrapperClassName="fiori-vhd__operator">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op} value={op}>
                    {opLabel[op]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="fiori-vhd__condition-values">
              <Input
                aria-label={c.operator === "BT" ? t.from : t.value}
                placeholder={c.operator === "BT" ? t.from : undefined}
                value={c.values[0]}
                onChange={(e) => set({ ...c, values: c.operator === "BT" ? [e.target.value, c.values[1] ?? ""] : [e.target.value] })}
              />
              {c.operator === "BT" && (
                <Input
                  aria-label={t.to}
                  placeholder={t.to}
                  value={c.values[1] ?? ""}
                  onChange={(e) => set({ ...c, values: [c.values[0], e.target.value] })}
                />
              )}
            </div>
            <Button
              variant="transparent"
              size="icon"
              aria-label={t.removeCondition}
              title={t.removeCondition}
              onClick={() => setConditions((cs) => (cs.length === 1 ? [emptyCondition(operators[0])] : cs.filter((_, j) => j !== i)))}
            >
              <Icon icon={decline} />
            </Button>
          </div>
        )
      })}
      <div className="fiori-vhd__add-row">
        <Button onClick={() => setConditions((cs) => [...cs, emptyCondition(operators[0])])}>{t.add}</Button>
      </div>
    </div>
  )

  const tokenCount = keys.length + filledConditions.length
  const selectedTitle = countedTitle(t.selectedItemsAndConditions, texts?.selectedItemsAndConditions, tokenCount, t.selectedItemsAndConditionsWithCount, texts?.selectedItemsAndConditionsWithCount)
  const removeToken = (kind: "key" | "condition", id: string | number) => {
    if (kind === "key") setKeys((ks) => ks.filter((k) => k !== id))
    else setConditions((cs) => {
      const filled = cs.filter(conditionFilled)
      const target = filled[id as number]
      const rest = cs.filter((c) => c !== target)
      return rest.length ? rest : [emptyCondition(operators[0])]
    })
  }
  const tokens = [
    ...keys.map((k) => ({ kind: "key" as const, id: k as string | number, text: tokenText(k) })),
    ...filledConditions.map((c, i) => ({ kind: "condition" as const, id: i as string | number, text: formatCondition(c) })),
  ]

  const selectedArea = multi && (
    <div className="fiori-vhd__selected" data-slot="value-help-selected">
      <h2 className="fiori-vhd__section-title">{selectedTitle}</h2>
      <div className="fiori-vhd__tokens-row">
        <div className="fiori-vhd__tokens" role="list" aria-label={selectedTitle}>
          {tokens.map((tk) => (
            <div key={`${tk.kind}-${tk.id}`} role="listitem" className="fiori-vhd__token" data-slot="value-help-token">
              <span className="fiori-vhd__token-text">{tk.text}</span>
              <button
                type="button"
                className="fiori-vhd__token-remove"
                aria-label={`${t.removeToken} ${tk.text}`}
                title={t.removeToken}
                onClick={() => removeToken(tk.kind, tk.id)}
                onKeyDown={(e) => {
                  if (e.key === "Delete" || e.key === "Backspace") {
                    e.preventDefault()
                    const list = e.currentTarget.closest('[role="list"]')
                    const buttons = [...(list?.querySelectorAll<HTMLElement>(".fiori-vhd__token-remove") ?? [])]
                    const i = buttons.indexOf(e.currentTarget)
                    removeToken(tk.kind, tk.id)
                    requestAnimationFrame(() => {
                      const left = [...(list?.querySelectorAll<HTMLElement>(".fiori-vhd__token-remove") ?? [])]
                      left[Math.min(i, left.length - 1)]?.focus()
                    })
                  }
                }}
              >
                <Icon icon={decline} />
              </button>
            </div>
          ))}
        </div>
        <Button
          variant="transparent"
          size="icon"
          aria-label={t.removeAll}
          title={t.removeAll}
          disabled={!tokenCount}
          onClick={() => {
            setKeys([])
            setConditions([emptyCondition(operators[0])])
          }}
        >
          <Icon icon={decline} />
        </Button>
      </div>
    </div>
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) setOpen(true)
        else cancel()
      }}
      modal={portal}
    >
      {children}
      <DialogContent
        portal={portal}
        aria-describedby={undefined}
        data-slot="value-help-dialog"
        className={cn("fiori-vhd", phone && "fiori-vhd--phone", !multi && "fiori-vhd--single", className)}
        onOpenAutoFocus={(e) => {
          if (!portal) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="fiori-vhd__main">
          {withConditions ? (
            <Tabs value={tab} onValueChange={setTab} className="fiori-vhd__tabs">
              <TabsList aria-label={title}>
                <TabsTrigger value="search">{searchTitle}</TabsTrigger>
                <TabsTrigger value="conditions">{conditionsTitle}</TabsTrigger>
              </TabsList>
              <TabsContent value="search">{searchPage}</TabsContent>
              <TabsContent value="conditions">{conditionsPage}</TabsContent>
            </Tabs>
          ) : (
            <div className="fiori-vhd__body">{searchPage}</div>
          )}
          {selectedArea}
        </div>
        <DialogFooter>
          {multi && (
            <Button variant="emphasized" onClick={() => confirm(result())}>
              {t.ok}
            </Button>
          )}
          <Button variant="transparent" onClick={cancel}>
            {t.cancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export {
  ValueHelpDialog,
  formatCondition,
  type ValueHelpDialogProps,
  type ValueHelpColumn,
  type ValueHelpItem,
  type ValueHelpCondition,
  type ValueHelpValue,
  type ValueHelpResult,
  type ConditionOperator,
  type ValueHelpTexts,
}

// UI5 keys resolved at the existing rendered/announced text owner.
const defaultTextsKeys = {
  searchAndSelectWithCount: "valuehelp.SELECTFROMLIST",
  defineConditionsWithCount: "valuehelp.DEFINECONDITIONS",
  itemsWithCount: "valuehelp.TABLETITLE",
  selectedItemsAndConditionsWithCount: "valuehelp.TOKENIZERTITLE",
  selectedItemsAndConditions: "valuehelp.TOKENIZERTITLENONUMBER",
  defineConditions: "valuehelp.DEFINECONDITIONSNONUMBER",
  search: "filterbar.SEARCH",
  go: "filterbar.GO",
  items: "valuehelp.TABLETITLENONUMBER",
  ok: "valuehelp.OK",
  cancel: "valuehelp.CANCEL",
  add: "p13n.ADD_FILTER_CRITERIA",
  removeToken: "TOKEN_ARIA_DELETE",
  selectAll: "TABLE_SELECT_ALL_TOOLTIP",
  value: "valuehelp.DEFINECONDITIONS_VALUE",
  from: "valuehelp.DEFINECONDITIONS_FROM",
  to: "valuehelp.DEFINECONDITIONS_TO",

  "searchAndSelect": "valuehelp.SELECTFROMLISTNONUMBER",
  "showFilters": "valuehelp.SHOWADVSEARCH",
  "hideFilters": "valuehelp.HIDEADVSEARCH",
  "removeCondition": "CONDITIONPANEL_REMOVE_CONDITION_TOOLTIP",
  "removeAll": "CONDITIONPANEL_REMOVE_ALL",
  "operator": "valuehelp.DEFINECONDITIONS_OPERATORLABEL",
  "noData": "LIST_NO_DATA"
} as const
