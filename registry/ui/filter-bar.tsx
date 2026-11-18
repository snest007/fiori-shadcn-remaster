// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { useFioriTexts } from "@/lib/fiori-locale"

import { search as searchIcon, slimArrowDown, slimArrowUp } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { AdaptFiltersDialog, type AdaptFiltersDialogProps, type FilterDefinition, type FilterValues } from "@/components/ui/adapt-filters-dialog"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Input, InputIcon } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// FilterBar after the SAP Fiori design guidelines ("Filter Bar") and SAPUI5's sap.ui.mdc.FilterBar /
// sap.ui.comp.filterbar.FilterBar. There is no UI5 Web Component for it; it is composed of our components.
// Anatomy (guideline numbering): (1) variant title slot, (2) basic search, (3) filter fields — label above
// field, laid out in a grid of equal columns that wrap, (4) "Go" (emphasized, manual update mode only),
// (5) "Adapt Filters (n)" (transparent button with the count of active filters).
// Collapsed (filter bar hidden): only the header row with the variant title and the filter summary text
// ("No filters active", "1 filter active: Name", "<n> filters active: A, B").
// The expand/collapse toggle (FilterBarToggle) is a separate small button so the dynamic page header can
// place it on its bottom edge, as in the guideline image; inside the bar it sits in the header row.
// Keyboard: everything is in the Tab order; Enter in a filter field or the search triggers Go (as UI5).

type FilterBarTexts = {
  go: string
  adaptFilters: string
  showFilterBar: string
  hideFilterBar: string
  search: string
  noFiltersActive: string
  oneFilterActive: string
  filtersActive: string
  searchTerms?: string
  oneFilterActiveHidden?: string
  filtersActiveHidden?: string
  requiredFilterValueMissing?: string
}
const defaultTexts: Required<FilterBarTexts> = {
  go: "Go",
  adaptFilters: "Adapt Filters",
  showFilterBar: "Show Filter Bar",
  hideFilterBar: "Hide Filter Bar",
  search: "Search",
  noFiltersActive: "No filters active",
  oneFilterActive: "1 filter active",
  filtersActive: "{0} filters active",
  searchTerms: "Search Terms",
  oneFilterActiveHidden: "{0} filter active ({1} hidden)",
  filtersActiveHidden: "{0} filters active ({1} hidden)",
  requiredFilterValueMissing: "{0} is a required field.",
}

/** "No filters active" / "1 filter active: A" / "3 filters active: A, B, C" (Fiori summary text). */
function filterSummary(active: string[], texts: Partial<FilterBarTexts> = {}) {
  const t = { ...defaultTexts, ...texts }
  if (!active.length) return t.noFiltersActive
  const head = active.length === 1 ? t.oneFilterActive : t.filtersActive.replace("{0}", String(active.length))
  return `${head}: ${active.join(", ")}`
}

/** OpenUI5 FilterBarBase._getAssignedFiltersExpandedText: active keys, including hidden editors. */
function filterExpandedSummary(activeCount: number, hiddenCount: number, texts: Partial<FilterBarTexts> = {}) {
  const t = { ...defaultTexts, ...texts }
  if (!activeCount) return t.noFiltersActive
  const text = hiddenCount
    ? activeCount === 1 ? t.oneFilterActiveHidden : t.filtersActiveHidden
    : activeCount === 1 ? t.oneFilterActive : t.filtersActive
  return text.replace("{0}", String(activeCount)).replace("{1}", String(hiddenCount))
}

const FilterBarContext = React.createContext<{ onGo?: () => void }>({})

type FilterBarState = { values: FilterValues; visibleKeys: string[]; search: string }

type FilterBarProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** Variant management / page title shown in the header row (slot). */
  variant?: React.ReactNode
  /** Variant management slot; takes precedence over the legacy variant slot. */
  variantManagement?: React.ReactNode
  /** Complete controlled state, like FilterBarBase.getCurrentState / StateUtil.applyExternalState. */
  state?: FilterBarState
  onStateChange?: (state: FilterBarState) => void
  /** Saved state of the selected view, used by Adapt Filters Reset. */
  initialState?: FilterBarState
  /** Basic search. Pass `false` to hide it. */
  search?: boolean
  searchValue?: string
  defaultSearchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  /** Show the Go button (manual update mode). Default true. */
  showGoButton?: boolean
  onGo?: () => void
  /** Search after each committed condition change, as in FilterBarBase.liveMode. */
  liveMode?: boolean
  /** Declarative filters. The same renderer is used in the bar and Adapt Filters dialog. */
  filters?: FilterDefinition[]
  values?: FilterValues
  defaultValues?: FilterValues
  onValuesChange?: (values: FilterValues) => void
  /** Ordered keys of fields shown in the bar. Required fields always remain visible. */
  visibleKeys?: string[]
  defaultVisibleKeys?: string[]
  onVisibleKeysChange?: (visibleKeys: string[]) => void
  /** Initial/selected-variant state used by the dialog's Reset action. */
  initialValues?: FilterValues
  initialVisibleKeys?: string[]
  p13nMode?: ("item" | "value")[]
  adaptFiltersTexts?: AdaptFiltersDialogProps["texts"]
  /** Show "Adapt Filters (n)". Default true. */
  showAdaptFilters?: boolean
  onAdaptFilters?: () => void
  /** Labels of the filters that have a value (drive the count and the collapsed summary). */
  activeFilters?: string[]
  /** Expanded (filters visible). */
  expanded?: boolean
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  /** Show the collapse/expand toggle in the header row. Default true. */
  showToggle?: boolean
  texts?: Partial<FilterBarTexts>
  /** Width of a filter column (search and every field). Default 13.125rem, Fiori's field width. */
  fieldWidth?: string
}

function FilterBar({
  variant,
  variantManagement,
  state,
  onStateChange,
  initialState,
  search = true,
  searchValue,
  defaultSearchValue = "",
  onSearchChange,
  searchPlaceholder,
  showGoButton = true,
  onGo,
  liveMode = false,
  filters,
  values: valuesProp,
  defaultValues = {},
  onValuesChange,
  visibleKeys: visibleKeysProp,
  defaultVisibleKeys,
  onVisibleKeysChange,
  initialValues,
  initialVisibleKeys,
  p13nMode = ["item", "value"],
  adaptFiltersTexts,
  showAdaptFilters = true,
  onAdaptFilters,
  activeFilters = [],
  expanded: expandedProp,
  defaultExpanded = true,
  onExpandedChange,
  showToggle = true,
  texts,
  fieldWidth = "13.125rem",
  className,
  style,
  children,
  ...props
}: FilterBarProps) {
  const t = useFioriTexts<Required<FilterBarTexts>>(defaultTexts, defaultTextsKeys, texts)
  const [innerExpanded, setInnerExpanded] = React.useState(defaultExpanded)
  const expanded = expandedProp ?? innerExpanded
  const setExpanded = (e: boolean) => {
    if (expandedProp === undefined) setInnerExpanded(e)
    onExpandedChange?.(e)
  }
  const [innerSearch, setInnerSearch] = React.useState(defaultSearchValue)
  const searchText = state?.search ?? searchValue ?? innerSearch
  const filtersId = React.useId()
  const [innerValues, setInnerValues] = React.useState(defaultValues)
  const values = state?.values ?? valuesProp ?? innerValues
  const [innerKeys, setInnerKeys] = React.useState(() => defaultVisibleKeys ?? filters?.filter((f) => f.visibleInFilterBar !== false || f.required).map((f) => f.key) ?? [])
  const requestedKeys = state?.visibleKeys ?? visibleKeysProp ?? innerKeys
  const requiredKeys = filters?.filter((filter) => filter.required).map((filter) => filter.key) ?? []
  const keys = [...new Set([...requestedKeys.filter((key) => filters?.some((filter) => filter.key === key)), ...requiredKeys])]
  const [baseline] = React.useState(() => ({
    values: structuredClone(initialState?.values ?? initialValues ?? values),
    keys: [...(initialState?.visibleKeys ?? initialVisibleKeys ?? keys)],
    search: initialState?.search ?? searchText,
  }))
  const [adaptOpen, setAdaptOpen] = React.useState(false)
  const resetSearch = React.useRef(false)
  const savedSearch = initialState?.search ?? baseline.search
  const titleSlot = variantManagement ?? variant
  const [invalidKeys, setInvalidKeys] = React.useState<string[]>([])
  const updateState = (change: Partial<FilterBarState>) => {
    const next = { values, visibleKeys: keys, search: searchText, ...change }
    if (change.values !== undefined) {
      if (state === undefined && valuesProp === undefined) setInnerValues(change.values)
      onValuesChange?.(change.values)
      // Keep errors only for fields still missing a condition; valid edits clear them immediately.
      setInvalidKeys((invalid) => invalid.filter((key) => !change.values![key]?.length))
    }
    if (change.visibleKeys !== undefined) {
      if (state === undefined && visibleKeysProp === undefined) setInnerKeys(change.visibleKeys)
      onVisibleKeysChange?.(change.visibleKeys)
    }
    if (change.search !== undefined) {
      if (state === undefined && searchValue === undefined) setInnerSearch(change.search)
      onSearchChange?.(change.search)
    }
    // FilterBarBase._handleAssignedFilterNames suppresses dirty reporting on variant application.
    // Only user edits emit state; applying a controlled state does not echo a change back to its owner.
    onStateChange?.(next)
  }
  const updateValues = (next: FilterValues) => updateState({ values: next })
  const fieldId = (key: string) => `${props.id ?? `filter-bar-${filtersId}`}-${key}`
  const go = () => {
    // OpenUI5 FilterBarBase._getRequiredFilterFieldValueText / triggerSearch validate required filters.
    const missing = filters?.filter((filter) => filter.required && !values[filter.key]?.length).map((filter) => filter.key) ?? []
    setInvalidKeys(missing)
    if (missing.length) {
      document.getElementById(fieldId(missing[0]))?.focus()
      return
    }
    onGo?.()
  }
  const goRef = React.useRef(go)
  goRef.current = go
  const previousConditions = React.useRef({ values: JSON.stringify(values), search: searchText })
  React.useEffect(() => {
    const next = { values: JSON.stringify(values), search: searchText }
    const previous = previousConditions.current
    previousConditions.current = next
    // OpenUI5 FilterBarBase._reportModelChange searches after applied conditions in live mode.
    if (liveMode && (previous.values !== next.values || previous.search !== next.search)) goRef.current()
  }, [values, searchText, liveMode])
  const ctx = { onGo: go }
  // OpenUI5 FilterBarBase.getAssignedFilterNames: search first, then active properties (also hidden).
  const assigned = filters
    ? [searchText && t.searchTerms, ...filters.filter((filter) => values[filter.key]?.length).map((filter) => filter.label)].filter(Boolean) as string[]
    : activeFilters
  const hiddenCount = (filters?.filter((filter) => values[filter.key]?.length && !keys.includes(filter.key)).length ?? 0) + (filters && !search && searchText ? 1 : 0)
  const count = assigned.length

  return (
    <FilterBarContext.Provider value={ctx}>
      <div
        data-slot="filter-bar"
        data-expanded={expanded ? "" : undefined}
        role="search"
        className={cn("fiori-filter-bar", className)}
        style={{ "--fiori-x-filter-min-width": fieldWidth, ...style } as React.CSSProperties}
        {...props}
      >
        {(titleSlot || showToggle || !expanded || filters) && (
          <div className="fiori-filter-bar__header">
            <div className="fiori-filter-bar__title">
              {titleSlot}
              {(!expanded || filters) && (
                <div className="fiori-filter-bar__summary" data-slot="filter-bar-summary" aria-live="polite">
                  {expanded ? filterExpandedSummary(count, hiddenCount, t) : filterSummary(assigned, t)}
                </div>
              )}
            </div>
            {showToggle && (
              <FilterBarToggle
                expanded={expanded}
                onExpandedChange={setExpanded}
                aria-controls={filtersId}
                showText={t.showFilterBar}
                hideText={t.hideFilterBar}
              />
            )}
          </div>
        )}
        <div id={filtersId} className="fiori-filter-bar__content" hidden={!expanded}>
          {search && (
            <div className="fiori-filter-bar__search">
              <Input
                type="search"
                aria-label={searchPlaceholder ?? t.search}
                placeholder={searchPlaceholder ?? t.search}
                value={searchText}
                onChange={(e) => updateState({ search: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") go()
                }}
                icon={
                  <InputIcon>
                    <Icon icon={searchIcon} />
                  </InputIcon>
                }
              />
            </div>
          )}
          <div className="fiori-filter-bar__fields">
            {filters && keys.map((key) => {
              const filter = filters.find((candidate) => candidate.key === key)!
              const invalid = invalidKeys.includes(key) && !values[key]?.length
              return (
                <FilterBarItem key={key} label={filter.label} fieldId={fieldId(key)} required={filter.required} data-filter-key={key}>
                  {filter.render({
                    id: fieldId(key), conditions: values[key] ?? [], required: !!filter.required,
                    valueState: invalid ? "negative" : "none",
                    valueStateMessage: invalid ? t.requiredFilterValueMissing.replace("{0}", filter.label) : undefined,
                    onConditionsChange: (conditions) => updateValues({ ...values, [key]: conditions }),
                  })}
                </FilterBarItem>
              )
            })}
            {children}
          </div>
          {((showGoButton && !liveMode) || showAdaptFilters) && (
            <div className="fiori-filter-bar__actions">
              {showGoButton && !liveMode && (
                <Button variant="emphasized" onClick={go}>
                  {t.go}
                </Button>
              )}
              {showAdaptFilters && (
                <Button variant="transparent" onClick={() => {
                  if (onAdaptFilters) onAdaptFilters()
                  else if (filters) { resetSearch.current = false; setAdaptOpen(true) }
                }} className="fiori-filter-bar__adapt" aria-haspopup={filters && !onAdaptFilters ? "dialog" : undefined} aria-expanded={filters && !onAdaptFilters ? adaptOpen : undefined}>
                  {count ? `${t.adaptFilters} (${count})` : t.adaptFilters}
                </Button>
              )}
            </div>
          )}
        </div>
        {filters && !onAdaptFilters && (
          <AdaptFiltersDialog
            id={`${props.id ?? `filter-bar-${filtersId}`}-adapt-dialog`}
            open={adaptOpen} onOpenChange={setAdaptOpen} filters={filters} values={values} visibleKeys={keys}
            p13nMode={p13nMode} initialValues={initialState?.values ?? initialValues ?? baseline.values}
            initialVisibleKeys={initialState?.visibleKeys ?? initialVisibleKeys ?? baseline.keys} texts={adaptFiltersTexts}
            resetEnabled={searchText !== savedSearch} onReset={() => { resetSearch.current = true }}
            onApply={(next) => updateState({ ...next, ...(resetSearch.current ? { search: savedSearch } : {}) })}
          />
        )}
      </div>
    </FilterBarContext.Provider>
  )
}

type FilterBarItemProps = React.ComponentProps<"div"> & {
  /** Label shown above the field (with a colon, as in Fiori forms). */
  label: React.ReactNode
  /** id of the field inside, for the label's htmlFor. */
  fieldId?: string
  required?: boolean
}

/** One filter: label above, field below. Enter in its field triggers the bar's Go. */
function FilterBarItem({ label, fieldId, required, className, children, onKeyDown, ...props }: FilterBarItemProps) {
  const { onGo } = React.useContext(FilterBarContext)
  return (
    <div
      data-slot="filter-bar-item"
      className={cn("fiori-filter-bar__item", className)}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        const tgt = e.target as HTMLElement
        if (!e.defaultPrevented && e.key === "Enter" && tgt instanceof HTMLInputElement) onGo?.()
      }}
      {...props}
    >
      <Label htmlFor={fieldId} showColon required={required} truncate className="fiori-filter-bar__label">
        {label}
      </Label>
      {children}
    </div>
  )
}

type FilterBarToggleProps = Omit<React.ComponentProps<"button">, "children"> & {
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  showText?: string
  hideText?: string
}

/** The small collapse/expand button (an icon button with the Show/Hide Filter Bar tooltip). */
function FilterBarToggle({ expanded, onExpandedChange, showText = defaultTexts.showFilterBar, hideText = defaultTexts.hideFilterBar, className, ...props }: FilterBarToggleProps) {
  const text = expanded ? hideText : showText
  return (
    <Button
      variant="transparent"
      size="icon"
      data-slot="filter-bar-toggle"
      aria-expanded={expanded}
      aria-label={text}
      title={text}
      className={cn("fiori-filter-bar__toggle", className)}
      onClick={() => onExpandedChange(!expanded)}
      {...props}
    >
      <Icon icon={expanded ? slimArrowUp : slimArrowDown} />
    </Button>
  )
}

export { FilterBar, FilterBarItem, FilterBarToggle, filterSummary, filterExpandedSummary, type FilterDefinition, type FilterValues, type FilterBarState, type FilterBarProps, type FilterBarItemProps, type FilterBarTexts }

// OpenUI5 FilterBarBase text getters, from sap/ui/mdc/messagebundle.properties.
const defaultTextsKeys = {
  "go": "filterbar.GO",
  "adaptFilters": "filterbar.ADAPT",
  "search": "filterbar.SEARCH",
  "noFiltersActive": "filterbar.ADAPT_NOTFILTERED",
  "oneFilterActive": "filterbar.ADAPT_FILTER_WITH_NON_HIDDEN",
  "filtersActive": "filterbar.ADAPT_FILTERS_WITH_NON_HIDDEN",
  "searchTerms": "filterbar.ADAPT_SEARCHTERM",
  "oneFilterActiveHidden": "filterbar.ADAPT_FILTER_WITH_HIDDEN",
  "filtersActiveHidden": "filterbar.ADAPT_FILTERS_WITH_HIDDEN",
  "requiredFilterValueMissing": "filterbar.REQUIRED_FILTER_VALUE_MISSING"
} as const
