import * as React from "react"

import { search as searchIcon, slimArrowDown, slimArrowUp } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
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
}
const defaultTexts: FilterBarTexts = {
  go: "Go",
  adaptFilters: "Adapt Filters",
  showFilterBar: "Show Filter Bar",
  hideFilterBar: "Hide Filter Bar",
  search: "Search",
  noFiltersActive: "No filters active",
  oneFilterActive: "1 filter active",
  filtersActive: "{0} filters active",
}

/** "No filters active" / "1 filter active: A" / "3 filters active: A, B, C" (Fiori summary text). */
function filterSummary(active: string[], texts: Partial<FilterBarTexts> = {}) {
  const t = { ...defaultTexts, ...texts }
  if (!active.length) return t.noFiltersActive
  const head = active.length === 1 ? t.oneFilterActive : t.filtersActive.replace("{0}", String(active.length))
  return `${head}: ${active.join(", ")}`
}

const FilterBarContext = React.createContext<{ onGo?: () => void }>({})

type FilterBarProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** Variant management / page title shown in the header row (slot). */
  variant?: React.ReactNode
  /** Basic search. Pass `false` to hide it. */
  search?: boolean
  searchValue?: string
  defaultSearchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  /** Show the Go button (manual update mode). Default true. */
  showGoButton?: boolean
  onGo?: () => void
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
  search = true,
  searchValue,
  defaultSearchValue = "",
  onSearchChange,
  searchPlaceholder,
  showGoButton = true,
  onGo,
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
  const t = { ...defaultTexts, ...texts }
  const [innerExpanded, setInnerExpanded] = React.useState(defaultExpanded)
  const expanded = expandedProp ?? innerExpanded
  const setExpanded = (e: boolean) => {
    if (expandedProp === undefined) setInnerExpanded(e)
    onExpandedChange?.(e)
  }
  const [innerSearch, setInnerSearch] = React.useState(defaultSearchValue)
  const searchText = searchValue ?? innerSearch
  const filtersId = React.useId()
  const ctx = React.useMemo(() => ({ onGo }), [onGo])
  const count = activeFilters.length

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
        {(variant || showToggle || !expanded) && (
          <div className="fiori-filter-bar__header">
            <div className="fiori-filter-bar__title">
              {variant}
              {!expanded && (
                <div className="fiori-filter-bar__summary" data-slot="filter-bar-summary" aria-live="polite">
                  {filterSummary(activeFilters, t)}
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
                onChange={(e) => {
                  if (searchValue === undefined) setInnerSearch(e.target.value)
                  onSearchChange?.(e.target.value)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onGo?.()
                }}
                icon={
                  <InputIcon>
                    <Icon icon={searchIcon} />
                  </InputIcon>
                }
              />
            </div>
          )}
          <div className="fiori-filter-bar__fields">{children}</div>
          {(showGoButton || showAdaptFilters) && (
            <div className="fiori-filter-bar__actions">
              {showGoButton && (
                <Button variant="emphasized" onClick={onGo}>
                  {t.go}
                </Button>
              )}
              {showAdaptFilters && (
                <Button variant="transparent" onClick={onAdaptFilters} className="fiori-filter-bar__adapt">
                  {count ? `${t.adaptFilters} (${count})` : t.adaptFilters}
                </Button>
              )}
            </div>
          )}
        </div>
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

export { FilterBar, FilterBarItem, FilterBarToggle, filterSummary, type FilterBarProps, type FilterBarItemProps, type FilterBarTexts }
