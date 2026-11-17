// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

// UI5 2.28 Popup.js/onEnterDOM: every rendered Popup surface bounds F6, modal or otherwise.

import { cn } from "@/lib/utils"
import { alert, arrowBottom as moveBottom, backToTop as moveTop, decline, filter, hide, horizontalGrip, resizeCorner, search, show, slimArrowDown, slimArrowUp } from "@/lib/fiori-icons"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ComboBox, ComboBoxItem } from "@/components/ui/combobox"
import { Icon } from "@/components/ui/icon"
import { Input, InputIcon } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SegmentedButton, SegmentedButtonItem } from "@/components/ui/segmented-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleButton } from "@/components/ui/toggle-button"

/** Conditions follow sap.ui.mdc.condition.Condition; editors own operator/value semantics. */
type FilterCondition = {
  operator: string
  values: unknown[]
  validated?: string
  isEmpty?: boolean | null
  payload?: Record<string, unknown>
  inParameters?: Record<string, unknown>
  outParameters?: Record<string, unknown>
}
type FilterValues = Record<string, FilterCondition[]>
type FilterRenderProps = {
  id: string
  conditions: FilterCondition[]
  onConditionsChange: (conditions: FilterCondition[]) => void
  required: boolean
  valueState: "none" | "negative"
  valueStateMessage?: string
  disabled?: boolean
}
type FilterDefinition = {
  key: string
  label: string
  group?: string
  groupLabel?: string
  required?: boolean
  visibleInFilterBar?: boolean
  render: (props: FilterRenderProps) => React.ReactNode
}
type AdaptFiltersState = { values: FilterValues; visibleKeys: string[] }
type AdaptFiltersTexts = {
  title: string; reset: string; ok: string; cancel: string; warning: string; resetWarning: string
  list: string; group: string; listView: string; groupView: string; toolbarTitle: string
  search: string; edit: string; sort: string; interactionModes: string; addFilter: string
  addPlaceholder: string; addOptions: string; selectOptions: string; noResults: string
  showFilter: string; hideFilter: string; removeFilter: string; dragToReorder: string
  moveTop: string; moveUp: string; moveDown: string; moveBottom: string; reorderHint: string
  filter: string; filterMode: string; visible: string; active: string; visibleActive: string
  all: string; mandatory: string; showValues: string; hideValues: string; basic: string; selectAll: string
  required: string; invalidFilter: string; added: string; removed: string; shown: string; hidden: string
  reordered: string; movedTop: string; movedUp: string; movedDown: string; movedBottom: string
  searchUpdate: string; oneItemAvailable: string; itemsAvailable: string; noItemsAvailable: string
  resetAnnouncement: string; resize: string; handleRoleDescription: string; dragResizeHint: string; hiddenWithValue: string
}
// OpenUI5 1.154 sap/ui/mdc/messagebundle.properties (adaptFiltersPanel.*, filterbar.*, p13nDialog.*)
// and sap/m/messagebundle.properties (p13n.*). Every default is overridable.
const defaultTexts: AdaptFiltersTexts = {
  title: "Adapt Filters", reset: "Reset", ok: "OK", cancel: "Cancel", warning: "Warning",
  resetWarning: "You are about to reset all the changes you made\n to your filters and revert back to the selected view.",
  list: "List", group: "Group", listView: "List View", groupView: "Group View",
  toolbarTitle: "Filter Values and Visibility", search: "Search for filters", edit: "Edit", sort: "Sort",
  interactionModes: "Filter Interaction Modes", addFilter: "Add Filter", addPlaceholder: "Select or Type Name",
  addOptions: "Available Filters", selectOptions: "Select Options", noResults: "No data",
  showFilter: "Show on Filter Bar", hideFilter: "Hide on Filter Bar", removeFilter: "Remove Filter",
  dragToReorder: "Drag to reorder", moveTop: "Move to Top", moveUp: "Move Up", moveDown: "Move Down", moveBottom: "Move to Bottom",
  reorderHint: "Use Ctrl + Arrow Up or Ctrl + Arrow Down to reorder item.",
  filter: "Filter", filterMode: "Filter Mode", visible: "Visible", active: "Active", visibleActive: "Visible and Active",
  all: "All", mandatory: "Mandatory", showValues: "Show Values", hideValues: "Hide Values", basic: "Basic", selectAll: "Select All",
  required: "{0} is a required field.", invalidFilter: 'Value "{0}" does not exist.',
  added: "Filter {0} added", removed: "Filter {0} removed", shown: "Filter {0} is now visible", hidden: "Filter {0} is now hidden",
  reordered: "List Item with label {0} has been reordered", movedTop: "List Item with label {0} has been moved to top",
  movedUp: "List Item with label {0} has been moved up", movedDown: "List Item with label {0} has been moved down",
  movedBottom: "List Item with label {0} has been moved to bottom", searchUpdate: "Table {0} has been updated. {1}",
  oneItemAvailable: "1 item available.", itemsAvailable: "{0} items available.", noItemsAvailable: "No items available.",
  resetAnnouncement: "Filters have been reset to the initially selected view.", resize: "Drag and resize dialog",
  handleRoleDescription: "Handle",
  dragResizeHint: "Use Arrow keys to move, Shift+Arrow keys to resize",
  hiddenWithValue: "The filter will not show in the filter bar.",
}
type AdaptFiltersDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: FilterDefinition[]
  values: FilterValues
  visibleKeys: string[]
  onApply: (state: AdaptFiltersState) => void
  /** Enables Reset for additional host-owned state, such as the FilterBar basic search. */
  resetEnabled?: boolean
  /** Confirms a staged Reset. The host commits its additional state only when onApply runs. */
  onReset?: () => void
  /** Reset baseline: the initial state or the currently selected variant, not the opening snapshot. */
  initialValues?: FilterValues
  initialVisibleKeys?: string[]
  p13nMode?: ("item" | "value")[]
  texts?: Partial<AdaptFiltersTexts>
  id?: string
  className?: string
  style?: React.CSSProperties
  /** Popup content dimensions, as in sap.m.p13n.Popup._createDialog. */
  contentWidth?: string
  contentHeight?: string
  defaultView?: "list" | "group"
  defaultMode?: "edit" | "sort"
  defaultSearch?: string
  defaultResetConfirmation?: boolean
  portal?: boolean
  modal?: boolean
}

const format = (text: string, ...values: (string | number)[]) => values.reduce<string>((result, value, index) => result.replaceAll(`{${index}}`, String(value)), text)
const cloneValues = (values: FilterValues): FilterValues => structuredClone(values)
const normalizedKeys = (filters: FilterDefinition[], keys: string[]) => [...new Set([...keys.filter((key) => filters.some((field) => field.key === key)), ...filters.filter((field) => field.required).map((field) => field.key)])]
const hasConditions = (values: FilterValues, key: string) => !!values[key]?.length
const comparableValues = (filters: FilterDefinition[], values: FilterValues) => JSON.stringify(filters.map(({ key }) => values[key] ?? []))

function AdaptFiltersDialog(props: AdaptFiltersDialogProps) {
  // Mount a fresh session on every open. Cancel/Escape discard the entire draft, including editor values.
  // Mirrors FilterBarBase/AdaptationFilterBar transient conditions and Popup's Ok vs Cancel close reasons.
  return props.open ? <AdaptFiltersSession {...props} /> : null
}

function AdaptFiltersSession({
  open, onOpenChange, filters, values, visibleKeys, onApply, resetEnabled = false, onReset, initialValues = values, initialVisibleKeys = visibleKeys,
  p13nMode = ["item", "value"], texts, id, className, style, contentWidth = "40rem", contentHeight = "55rem",
  defaultView = "list", defaultMode = "edit", defaultSearch = "", defaultResetConfirmation = false, portal = true, modal = true,
}: AdaptFiltersDialogProps) {
  const t = { ...defaultTexts, ...texts }
  const autoId = React.useId()
  const baseId = id ?? `adapt-filters-dialog-${autoId}`
  const [draftValues, setDraftValues] = React.useState(() => cloneValues(values))
  const [keys, setKeys] = React.useState(() => normalizedKeys(filters, visibleKeys))
  // AdaptFiltersPanelContent._enhanceP13nData/_getItemFactory retains initially hidden active items
  // throughout the session, even after their values are cleared. Eye toggles also retain the row.
  const [rows, setRows] = React.useState(() => [...new Set([...normalizedKeys(filters, visibleKeys), ...filters.filter((field) => hasConditions(values, field.key)).map((field) => field.key)])])
  const [view, setView] = React.useState(defaultView)
  const [mode, setMode] = React.useState(defaultMode)
  const [query, setQuery] = React.useState(defaultSearch)
  const [quickMode, setQuickMode] = React.useState("all")
  const [quickChanged, setQuickChanged] = React.useState(false)
  const [addedKeys, setAddedKeys] = React.useState<string[]>([])
  const [showValues, setShowValues] = React.useState(true)
  const [collapsed, setCollapsed] = React.useState<string[]>([])
  const [resetOpen, setResetOpen] = React.useState(defaultResetConfirmation)
  const [hostReset, setHostReset] = React.useState(false)
  const [addText, setAddText] = React.useState("")
  const [addError, setAddError] = React.useState(false)
  const [invalid, setInvalid] = React.useState<string[]>([])
  const [announcement, setAnnouncement] = React.useState({ text: "", sequence: 0 })
  const [focusedKey, setFocusedKey] = React.useState<string>()
  const [bounds, setBounds] = React.useState<{ left: number; top: number; width: number; height: number }>()
  const rowRefs = React.useRef(new Map<string, HTMLDivElement>())
  const surfaceRef = React.useRef<HTMLDivElement>(null)
  const pendingFocus = React.useRef<{ key?: string; editor?: boolean; ok?: boolean } | null>(null)
  const dragCleanup = React.useRef<(() => void) | null>(null)
  const opener = React.useRef(typeof document === "undefined" ? null : document.activeElement as HTMLElement | null)
  const itemMode = p13nMode.includes("item")
  const valueMode = p13nMode.includes("value")
  const editable = mode === "edit" || view === "group"
  const resetKeys = normalizedKeys(filters, initialVisibleKeys)
  const dirty = (itemMode && JSON.stringify(keys) !== JSON.stringify(resetKeys)) || (valueMode && comparableValues(filters, draftValues) !== comparableValues(filters, initialValues))
  const announce = (text: string) => setAnnouncement((old) => ({ text, sequence: old.sequence + 1 }))
  const fieldFor = (key: string) => filters.find((field) => field.key === key)!
  const shown = (key: string) => keys.includes(key)
  const rowCandidates = view === "group" && quickChanged && quickMode === "all" ? filters.map((field) => field.key) : rows
  const matchesRow = (key: string, searchText: string, retainAdded = true) => {
    if (retainAdded && addedKeys.includes(key)) return true
    const field = fieldFor(key)
    if (!field.label.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())) return false
    if (view !== "group") return true
    if (quickMode === "visible") return shown(key)
    if (quickMode === "active") return hasConditions(draftValues, key)
    if (quickMode === "visibleactive") return shown(key) && hasConditions(draftValues, key)
    if (quickMode === "mandatory") return !!field.required
    return true
  }
  const searchedRows = rowCandidates.filter((key) => matchesRow(key, query))
  const available = filters.filter((field) => !shown(field.key) && !field.required && !hasConditions(draftValues, field.key)).sort((a, b) => a.label.localeCompare(b.label))
  const groups = [...new Set(searchedRows.map((key) => fieldFor(key).group ?? "basic"))].sort((a, b) => {
    if (a === "basic" || a === "__$INTERNAL$") return -1
    if (b === "basic" || b === "__$INTERNAL$") return 1
    return (filters.find((field) => field.group === a)?.groupLabel ?? a).localeCompare(filters.find((field) => field.group === b)?.groupLabel ?? b)
  })

  React.useLayoutEffect(() => {
    const next = pendingFocus.current
    if (!next) return
    pendingFocus.current = null
    if (next.ok) { surfaceRef.current?.querySelector<HTMLButtonElement>("[data-slot=adapt-filters-ok]")?.focus(); return }
    const row = next.key ? rowRefs.current.get(next.key) : undefined
    const target = next.editor ? Array.from(row?.querySelectorAll<HTMLElement>(".fiori-adapt-filters__editor :is(input, [role=combobox], button)") ?? [])
      .find((element) => !element.closest("[inert]") && !element.matches(":disabled, [aria-disabled=true]") && element.getClientRects().length > 0) : row
    if (target || row) (target ?? row)!.focus()
    else surfaceRef.current?.querySelector<HTMLInputElement>("[data-slot=adapt-filters-add] input")?.focus()
  })
  React.useEffect(() => () => dragCleanup.current?.(), [])

  const changeValue = (key: string, conditions: FilterCondition[]) => {
    setDraftValues((current) => ({ ...current, [key]: structuredClone(conditions) }))
    if (conditions.length) setInvalid((current) => current.filter((item) => item !== key))
  }
  const toggle = (key: string) => {
    if (!itemMode || fieldFor(key).required) return
    setKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : rows.filter((item) => item === key || current.includes(item)))
    if (!rows.includes(key)) { setRows((current) => [...current, key]); setKeys((current) => [...current, key]) }
    announce(format(shown(key) ? t.hidden : t.shown, fieldFor(key).label))
  }
  const remove = (key: string) => {
    if (!itemMode || fieldFor(key).required) return
    const index = searchedRows.indexOf(key)
    const remaining = searchedRows.filter((item) => item !== key)
    pendingFocus.current = { key: remaining[Math.min(index, remaining.length - 1)], editor: true }
    setRows((current) => current.filter((item) => item !== key))
    setAddedKeys((current) => current.filter((item) => item !== key))
    setKeys((current) => current.filter((item) => item !== key))
    // AdaptFiltersPanelContent._onRemoveRow clears conditions as well as visibility and position.
    if (valueMode) setDraftValues((current) => ({ ...current, [key]: [] }))
    announce(format(t.removed, fieldFor(key).label))
  }
  const move = (key: string, target: number, direction?: "top" | "up" | "down" | "bottom") => {
    // AdaptFiltersPanelContent._handleReorder/_moveListItem: move relative to the filtered rows,
    // retain the other model entries, and restore focus to the moved row after rendering.
    if (!itemMode || view !== "list" || editable || !rows.includes(key) || target < 0 || target >= searchedRows.length) return
    const destination = searchedRows[target]
    if (destination === key) return
    const next = rows.filter((item) => item !== key)
    const index = next.indexOf(destination) + (rows.indexOf(key) < rows.indexOf(destination) ? 1 : 0)
    next.splice(index, 0, key)
    pendingFocus.current = { key }
    setRows(next)
    setKeys(next.filter((item) => keys.includes(item)))
    announce(format(direction ? ({ top: t.movedTop, up: t.movedUp, down: t.movedDown, bottom: t.movedBottom })[direction] : t.reordered, fieldFor(key).label))
  }
  const add = (text: string) => {
    if (!text) return
    const field = available.find((item) => item.label.toLocaleLowerCase() === text.toLocaleLowerCase())
    if (!field) { setAddError(true); return }
    pendingFocus.current = { key: field.key, editor: true }
    setRows((current) => [...current.filter((key) => key !== field.key), field.key])
    setKeys((current) => [...current.filter((key) => key !== field.key), field.key])
    // AdaptFiltersPanelContent._selectKey ORs newly added keys into the query, preserving
    // the search and mode while making the new editor visible until filtering changes.
    setAddedKeys((current) => [...current, field.key])
    setCollapsed((current) => current.filter((key) => key !== (field.group ?? "basic")))
    setAddText("")
    setAddError(false)
    announce(format(t.added, field.label))
  }
  const apply = () => {
    const missing = valueMode ? filters.filter((field) => field.required && !hasConditions(draftValues, field.key)) : []
    if (missing.length) {
      setInvalid(missing.map((field) => field.key))
      setQuery("")
      setQuickMode("all")
      setView("list")
      setMode("edit")
      pendingFocus.current = { key: missing[0].key, editor: true }
      announce(missing.map((field) => format(t.required, field.label)).join(" "))
      return
    }
    onApply({ values: cloneValues(valueMode ? draftValues : values), visibleKeys: itemMode ? [...keys] : normalizedKeys(filters, visibleKeys) })
    onOpenChange(false)
  }
  const reset = () => {
    const restoredValues = valueMode ? initialValues : values
    const restoredKeys = itemMode ? resetKeys : normalizedKeys(filters, visibleKeys)
    setDraftValues(cloneValues(restoredValues))
    setKeys(restoredKeys)
    setRows([...new Set([...restoredKeys, ...filters.filter((field) => hasConditions(restoredValues, field.key)).map((field) => field.key)])])
    setView("list"); setMode("edit"); setQuery(""); setQuickMode("all"); setQuickChanged(false)
    setAddText(""); setAddError(false); setInvalid([]); setAddedKeys([]); setResetOpen(false)
    pendingFocus.current = { ok: true }
    setHostReset(true)
    onReset?.()
    announce(t.resetAnnouncement)
  }
  const dragStart = (event: React.PointerEvent<HTMLElement>, resize = false) => {
    if (!portal || event.button !== 0 || (!resize && (event.target as HTMLElement).closest("button"))) return
    const surface = surfaceRef.current
    if (!surface) return
    const rect = surface.getBoundingClientRect()
    const start = { x: event.clientX, y: event.clientY }
    // sap/m/Dialog.js pointer drag/resize reads CSS min-width and min-height + footer.
    const computed = getComputedStyle(surface)
    const minWidth = parseFloat(computed.minWidth) || 0
    const minHeight = (parseFloat(computed.minHeight) || 0) + (surface.querySelector("footer")?.getBoundingClientRect().height ?? 0)
    event.currentTarget.setPointerCapture(event.pointerId)
    const update = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - start.x, dy = moveEvent.clientY - start.y
      setBounds(resize ? {
        left: rect.left, top: rect.top, width: Math.max(minWidth, Math.min(rect.width + dx, innerWidth - rect.left)),
        height: Math.max(minHeight, Math.min(rect.height + dy, innerHeight - rect.top)),
      } : { width: rect.width, height: rect.height, left: Math.max(0, Math.min(rect.left + dx, innerWidth - rect.width)), top: Math.max(0, Math.min(rect.top + dy, innerHeight - rect.height)) })
    }
    dragCleanup.current?.()
    const finish = () => { window.removeEventListener("pointermove", update); window.removeEventListener("pointerup", finish); dragCleanup.current = null }
    dragCleanup.current = finish
    window.addEventListener("pointermove", update)
    window.addEventListener("pointerup", finish, { once: true })
    event.preventDefault()
  }

  const renderRow = (key: string) => {
    const field = fieldFor(key), index = searchedRows.indexOf(key)
    const requiredMessage = invalid.includes(key) ? format(t.required, field.label) : undefined
    return <div key={key} ref={(node) => { if (node) rowRefs.current.set(key, node); else rowRefs.current.delete(key) }}
      data-slot="adapt-filters-row" data-key={key} className="fiori-adapt-filters__row" tabIndex={editable ? -1 : 0}
      aria-label={editable ? undefined : field.label} aria-describedby={!editable ? `${baseId}-reorder-hint` : undefined}
      onFocus={() => setFocusedKey(key)} onMouseEnter={() => setFocusedKey(key)}
      draggable={itemMode && !editable && view === "list"}
      onDragStart={(event) => { event.dataTransfer.setData("text/plain", key); event.dataTransfer.effectAllowed = "move" }}
      onDragOver={(event) => { if (!editable) event.preventDefault() }}
      onDrop={(event) => { event.preventDefault(); move(event.dataTransfer.getData("text/plain"), index) }}
      onKeyDown={(event) => {
        if (editable || view !== "list") return
        if ((event.ctrlKey || event.metaKey) && ["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
          event.preventDefault(); event.stopPropagation()
          const directions = { ArrowUp: "up", ArrowDown: "down", Home: "top", End: "bottom" } as const
          move(key, event.key === "Home" ? 0 : event.key === "End" ? searchedRows.length - 1 : index + (event.key === "ArrowUp" ? -1 : 1), directions[event.key as keyof typeof directions])
        } else if (["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
          event.preventDefault()
          rowRefs.current.get(searchedRows[event.key === "Home" ? 0 : event.key === "End" ? searchedRows.length - 1 : Math.max(0, Math.min(index + (event.key === "ArrowUp" ? -1 : 1), searchedRows.length - 1))])?.focus()
        }
      }}>
      <Label htmlFor={`${baseId}-field-${key}`} showColon required={field.required} className="fiori-adapt-filters__label">{field.label}</Label>
      <div className="fiori-adapt-filters__editor" inert={!editable || !valueMode ? true : undefined} data-disabled={!editable || !valueMode ? "" : undefined}>
        {(view !== "group" || showValues) && field.render({ id: `${baseId}-field-${key}`, conditions: draftValues[key] ?? [], onConditionsChange: (conditions) => { if (editable && valueMode) changeValue(key, conditions) }, required: !!field.required, valueState: invalid.includes(key) ? "negative" : "none", valueStateMessage: requiredMessage, disabled: !editable || !valueMode })}
        {view === "group" && !showValues && hasConditions(draftValues, key) && <span className="fiori-adapt-filters__active" role="img" aria-label={t.active} />}
      </div>
      {itemMode && <div className="fiori-adapt-filters__actions">
        <ToggleButton variant="transparent" size="icon" pressed={shown(key)} onPressedChange={() => toggle(key)} disabled={!editable || field.required}
          title={shown(key) ? t.hideFilter : t.showFilter} aria-label={`${shown(key) ? t.hideFilter : t.showFilter}: ${field.label}`}><Icon icon={shown(key) ? show : hide} /></ToggleButton>
        {editable && !field.required && <Button variant="transparent" size="icon" title={t.removeFilter} aria-label={`${t.removeFilter}: ${field.label}`} onClick={() => remove(key)}><Icon icon={decline} /></Button>}
        {!editable && view === "list" && <Icon icon={horizontalGrip} className="fiori-adapt-filters__grip" />}
      </div>}
    </div>
  }

  const confirmation = <DialogPrimitive.Root open={resetOpen} onOpenChange={setResetOpen} modal={modal}>
    {resetOpen && <ResetConfirmation portal={portal} standalone={defaultResetConfirmation && !portal} title={t.warning} message={t.resetWarning} ok={t.ok} cancel={t.cancel} onConfirm={reset} onCancel={() => setResetOpen(false)} id={`${baseId}-reset`} />}
  </DialogPrimitive.Root>
  const content = <DialogPrimitive.Content data-sap-ui-fastnavgroup-container="true" ref={surfaceRef} id={baseId} data-slot="adapt-filters-dialog" data-portal={portal ? "" : undefined}
    data-view={view} data-mode={mode} aria-describedby={undefined} className={cn("fiori-adapt-filters", className)}
    style={{ "--fiori-adapt-content-width": contentWidth, "--fiori-adapt-content-height": contentHeight, ...(bounds ? { inset: "auto", margin: 0, ...bounds } : {}), ...style } as React.CSSProperties}
    onPointerDownOutside={(event) => event.preventDefault()}
    onInteractOutside={(event) => event.preventDefault()}
    onOpenAutoFocus={(event) => { event.preventDefault(); if (portal) surfaceRef.current?.querySelector<HTMLInputElement>("[data-slot=adapt-filters-search] input")?.focus() }}
    onCloseAutoFocus={(event) => { event.preventDefault(); opener.current?.focus() }}
    onKeyDown={(event) => { if (!resetOpen && (event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); apply() } }}>
    <header className="fiori-adapt-filters__header" onPointerDown={(event) => dragStart(event)}>
      <DialogPrimitive.Title className="fiori-adapt-filters__title">{t.title}</DialogPrimitive.Title>
      <Button variant="transparent" disabled={!dirty && (!resetEnabled || hostReset)} onClick={() => setResetOpen(true)}>{t.reset}</Button>
    </header>
    <div className="fiori-adapt-filters__content">
      <div role="tablist" aria-label={t.title} className="fiori-adapt-filters__tabs" onKeyDown={(event) => {
        const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]"))
        const index = tabs.indexOf(event.target as HTMLButtonElement)
        const target = event.key === "ArrowRight" ? tabs[(index + 1) % tabs.length] : event.key === "ArrowLeft" ? tabs[(index + tabs.length - 1) % tabs.length] : event.key === "Home" ? tabs[0] : event.key === "End" ? tabs[tabs.length - 1] : undefined
        if (target) { event.preventDefault(); target.focus(); target.click() }
      }}>
        {(["list", "group"] as const).map((key) => <button key={key} type="button" role="tab" aria-selected={view === key} aria-label={key === "list" ? t.listView : t.groupView} aria-controls={`${baseId}-panel`} tabIndex={view === key ? 0 : -1} className="fiori-adapt-filters__tab" onClick={() => { setView(key); setAddedKeys([]) }}><span>{key === "list" ? t.list : t.group}</span></button>)}
      </div>
      <div id={`${baseId}-panel`} className="fiori-adapt-filters__panel">
        <div className="fiori-adapt-filters__toolbar">
          <h2>{t.toolbarTitle}</h2>
          <div data-slot="adapt-filters-search" className="fiori-adapt-filters__search">
            <Input type="search" aria-label={t.search} placeholder={t.search} value={query}
              onChange={(event) => { setQuery(event.target.value); setAddedKeys([]); const count = rowCandidates.filter((key) => matchesRow(key, event.target.value, false)).length; announce(format(t.searchUpdate, t.toolbarTitle, count === 1 ? t.oneItemAvailable : count ? format(t.itemsAvailable, count) : t.noItemsAvailable)) }}
              icon={<InputIcon><Icon icon={search} /></InputIcon>} />
          </div>
          {view === "list" && itemMode && <SegmentedButton value={mode} onValueChange={(value) => setMode(value as "edit" | "sort")} aria-label={t.interactionModes}>
            <SegmentedButtonItem value="edit">{t.edit}</SegmentedButtonItem><SegmentedButtonItem value="sort">{t.sort}</SegmentedButtonItem>
          </SegmentedButton>}
          {/* AdaptFiltersPanelContent._createFilterQuery and GroupView.showFactory provide
              the quick modes and values toggle alongside the current grouped-row layout. */}
          {view === "group" && <Popover><PopoverTrigger asChild><Button variant="transparent" size="icon" aria-label={t.filter} title={t.filter}><Icon icon={filter} /></Button></PopoverTrigger>
            <PopoverContent id={`${baseId}-group-options`} side="bottom" align="end" hideArrow className="fiori-adapt-filters__options">
              <Label>{t.filterMode}</Label><Select value={quickMode} onValueChange={(value) => { setQuickMode(value); setQuickChanged(true); setAddedKeys([]) }}>
                <SelectTrigger aria-label={t.filterMode}><SelectValue /></SelectTrigger><SelectContent>
                  {[['visible', t.visible], ['active', t.active], ['visibleactive', t.visibleActive], ['all', t.all], ['mandatory', t.mandatory]].map(([key, text]) => <SelectItem key={key} value={key}
                    onPointerUp={() => { setQuickMode(key); setQuickChanged(true); setAddedKeys([]) }}
                    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { setQuickMode(key); setQuickChanged(true); setAddedKeys([]) } }}>{text}</SelectItem>)}
                </SelectContent>
              </Select><Button variant="transparent" onClick={() => setShowValues((current) => !current)}>{showValues ? t.hideValues : t.showValues}</Button>
            </PopoverContent></Popover>}
        </div>
        <div className="fiori-adapt-filters__scroll">
          {view === "list" ? searchedRows.map(renderRow) : groups.map((groupKey) => {
            const groupRows = searchedRows.filter((key) => (fieldFor(key).group ?? "basic") === groupKey)
            const label = fieldFor(groupRows[0]).groupLabel ?? t.basic
            const selected = groupRows.filter(shown).length
            return <section key={groupKey} className="fiori-adapt-filters__group">
              <div className="fiori-adapt-filters__group-header">
                <button type="button" aria-expanded={!collapsed.includes(groupKey)} onClick={() => setCollapsed((current) => current.includes(groupKey) ? current.filter((key) => key !== groupKey) : [...current, groupKey])}>{label}</button>
                {itemMode && <Checkbox aria-label={`${t.selectAll}: ${label}`} disabled={groupRows.every((key) => fieldFor(key).required)} checked={selected === groupRows.length ? true : selected ? "indeterminate" : false}
                  onCheckedChange={(checked) => {
                    setRows((current) => [...new Set([...current, ...groupRows])])
                    setKeys((current) => checked ? [...new Set([...current, ...groupRows])] : current.filter((key) => !groupRows.includes(key) || fieldFor(key).required))
                    announce(groupRows.filter((key) => !fieldFor(key).required).map((key) => format(checked ? t.shown : t.hidden, fieldFor(key).label)).join(" "))
                  }} />}
              </div>
              {!collapsed.includes(groupKey) && groupRows.map(renderRow)}
            </section>
          })}
          {!searchedRows.length && <div className="fiori-adapt-filters__no-results">{t.noResults}</div>}
          {itemMode && filters.some((field) => !shown(field.key) && !field.required) && <div data-slot="adapt-filters-add" className="fiori-adapt-filters__add">
            <Label htmlFor={`${baseId}-add`} showColon>{t.addFilter}</Label>
            <ComboBox id={`${baseId}-add`} aria-label={t.addFilter} placeholder={t.addPlaceholder} value={addText} onValueChange={(text) => { setAddText(text); setAddError(false) }} onCommit={add}
              valueState={addError ? "negative" : "none"} valueStateMessage={format(t.invalidFilter, addText)} listLabel={t.addOptions} arrowLabel={t.selectOptions}>
              {available.map((field) => <ComboBoxItem key={field.key} text={field.label} />)}
            </ComboBox>
          </div>}
        </div>
        {!editable && view === "list" && focusedKey && searchedRows.includes(focusedKey) && <div className="fiori-adapt-filters__move" data-slot="adapt-filters-move">
          {([['top', t.moveTop, moveTop, 0], ['up', t.moveUp, slimArrowUp, searchedRows.indexOf(focusedKey) - 1], ['down', t.moveDown, slimArrowDown, searchedRows.indexOf(focusedKey) + 1], ['bottom', t.moveBottom, moveBottom, searchedRows.length - 1]] as const).map(([direction, text, icon, target]) => <Button key={direction} variant="transparent" size="icon" aria-label={`${text}: ${fieldFor(focusedKey).label}`} title={text} disabled={target < 0 || target >= searchedRows.length || searchedRows[target] === focusedKey} onClick={() => move(focusedKey, target, direction)}><Icon icon={icon} /></Button>)}
        </div>}
      </div>
    </div>
    <footer className="fiori-adapt-filters__footer"><Button data-slot="adapt-filters-ok" variant="emphasized" onClick={apply}>{t.ok}</Button><Button variant="transparent" onClick={() => onOpenChange(false)}>{t.cancel}</Button></footer>
    {<div className="fiori-adapt-filters__resize" role="img" aria-label={t.resize} aria-roledescription={t.handleRoleDescription} aria-describedby={`${baseId}-drag-resize-hint`} tabIndex={portal ? 0 : -1} onPointerDown={(event) => dragStart(event, true)} onKeyDown={(event) => {
      if (!event.key.startsWith("Arrow")) return
      const rect = surfaceRef.current?.getBoundingClientRect()
      if (!rect) return
      event.preventDefault()
      // OpenUI5 sap/m/Dialog.js:_handleKeyboardDragResize, DRAGRESIZE_STEP = Rem.toPx(1).
      const step = parseFloat(getComputedStyle(document.documentElement).fontSize)
      const dx = event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0
      const dy = event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0
      const computed = getComputedStyle(event.currentTarget.parentElement!)
      const minHeight = (parseFloat(computed.minHeight) || 0) + (surfaceRef.current?.querySelector("footer")?.getBoundingClientRect().height ?? 0)
      setBounds(event.shiftKey ? { left: rect.left, top: rect.top, width: Math.max(parseFloat(computed.minWidth) || 0, Math.min(rect.width + dx, innerWidth - rect.left)), height: Math.max(minHeight, Math.min(rect.height + dy, innerHeight - rect.top)) } : { width: rect.width, height: rect.height, left: Math.max(0, Math.min(rect.left + dx, innerWidth - rect.width)), top: Math.max(0, Math.min(rect.top + dy, innerHeight - rect.height)) })
    }}><Icon icon={resizeCorner} /></div>}
    <span id={`${baseId}-reorder-hint`} hidden>{t.reorderHint}</span>
    <span id={`${baseId}-drag-resize-hint`} hidden>{t.dragResizeHint}</span>
    <div className="sr-only" role="status" aria-live="assertive" aria-atomic="true"><span key={announcement.sequence}>{announcement.text}</span></div>
    {confirmation}
  </DialogPrimitive.Content>
  if (defaultResetConfirmation && !portal) return confirmation
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={modal}>
    {portal ? <DialogPrimitive.Portal><DialogPrimitive.Overlay className="fiori-adapt-filters__overlay" />{content}</DialogPrimitive.Portal> : content}
  </DialogPrimitive.Root>
}

function ResetConfirmation({ portal, standalone, title, message, ok, cancel, onConfirm, onCancel, id }: { portal: boolean; standalone?: boolean; title: string; message: string; ok: string; cancel: string; onConfirm: () => void; onCancel: () => void; id: string }) {
  const content = <DialogPrimitive.Content data-sap-ui-fastnavgroup-container="true" id={id} data-slot="adapt-filters-reset" role="alertdialog" aria-describedby={`${id}-message`} className="fiori-adapt-filters-reset" data-portal={portal ? "" : undefined} onPointerDownOutside={(event) => event.preventDefault()}
    // sap.m.MessageBox closes only through its buttons or Escape; focus moving elsewhere must not dismiss it.
    onInteractOutside={(event) => event.preventDefault()}
    onOpenAutoFocus={(event) => { if (!portal) event.preventDefault() }}
    onKeyDown={(event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); event.stopPropagation(); onConfirm() }
    }}>
    <header className="fiori-adapt-filters__header"><Icon icon={alert} className="fiori-adapt-filters-reset__warning" /><DialogPrimitive.Title className="fiori-adapt-filters__title">{title}</DialogPrimitive.Title></header>
    <DialogPrimitive.Description id={`${id}-message`} className="fiori-adapt-filters-reset__message"><span>{message}</span></DialogPrimitive.Description>
    <footer className="fiori-adapt-filters__footer"><Button variant="emphasized" onClick={onConfirm}>{ok}</Button><Button variant="transparent" onClick={onCancel}>{cancel}</Button></footer>
  </DialogPrimitive.Content>
  return portal ? <DialogPrimitive.Portal><DialogPrimitive.Overlay className="fiori-adapt-filters__overlay" />{content}</DialogPrimitive.Portal> : standalone ? content : <div className="fiori-adapt-filters-reset__in-place">{content}</div>
}

export { AdaptFiltersDialog, type AdaptFiltersDialogProps, type AdaptFiltersTexts, type AdaptFiltersState, type FilterDefinition, type FilterCondition, type FilterValues, type FilterRenderProps }
