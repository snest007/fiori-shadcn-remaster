// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { useFioriTexts } from "@/lib/fiori-locale"

// UI5 2.28 ViewSettingsDialogTemplate.js renders an internal List (fastNavigation metadata).

import { accept, filter as filterIcon, group2, navBack, sort as sortIcon } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Icon } from "@/components/ui/icon"
import { SegmentedButton, SegmentedButtonItem } from "@/components/ui/segmented-button"

// Mirrors ui5-view-settings-dialog (Horizon, @ui5/webcomponents-fiori).
// Header: title ("View Settings", or "Filter By: <filter>" on the second filter level with a back button)
// and a Reset button (disabled while nothing differs from the initial settings, unless resetEnabled);
// below it a segmented button switching Sort / Filter / Group (only when more than one is configured).
// Sort and Group pages: "Sort Order" (Ascending/Descending) and "Sort By" single-selection lists.
// Filter page: "Filter By" list of filters with the count of selected values; choosing one opens its
// values as a multi-selection list (two-level navigation; back button returns).
// Footer: OK (emphasized) confirms, Cancel and Escape restore the settings from the last confirmation.
// Keyboard (as ui5-list): each list is one Tab stop; ↑/↓, Home/End move; Space/Enter select.

type SortItem = { text: string; selected?: boolean }
type FilterOption = { text: string; selected?: boolean }
type FilterItem = { text: string; values: FilterOption[] }
type Mode = "sort" | "filter" | "group"

type ViewSettings = {
  sortBy?: string
  sortDescending: boolean
  groupBy?: string
  groupDescending: boolean
  /** Selected values per filter. */
  filters: Record<string, string[]>
}

type ViewSettingsTexts = {
  title: string
  reset: string
  ok: string
  cancel: string
  sortOrder: string
  sortBy: string
  groupOrder: string
  groupBy: string
  filterBy: string
  ascending: string
  descending: string
  sortTooltip: string
  filterTooltip: string
  groupTooltip: string
  back: string
  resetAnnouncement?: string
  filterItemLabel?: (text: string, count: number) => string
}

const defaultTexts: Required<ViewSettingsTexts> = {
  title: "View Settings",
  reset: "Reset",
  ok: "OK",
  cancel: "Cancel",
  sortOrder: "Sort Order",
  sortBy: "Sort By",
  groupOrder: "Group Order",
  groupBy: "Group By",
  filterBy: "Filter By",
  ascending: "Ascending",
  descending: "Descending",
  sortTooltip: "Sort",
  filterTooltip: "Filter",
  groupTooltip: "Group",
  back: "Back",
  resetAnnouncement: "Reset has reverted all settings to initial state", // UI5 VSD_RESET_BUTTON_ACTION
  filterItemLabel: (text, count) => `${text}, Counter ${count},`, // UI5 VSD_FILTER_ITEM_LABEL_TEXT; preserve existing no-provider punctuation
}

/** @accessibility texts.title names the dialog; texts names mode buttons, lists, order choices, reset and footer actions. Each list is one Tab stop: Arrow Up/Down and Home/End move, Enter/Space select. Escape cancels staged changes and returns focus to DialogTrigger. */
type ViewSettingsDialogProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Sort criteria (UI5 sortItems); `selected` marks the initial one. */
  sortItems?: SortItem[]
  sortDescending?: boolean
  filterItems?: FilterItem[]
  groupItems?: SortItem[]
  groupDescending?: boolean
  /** Keep Reset enabled even when nothing changed. */
  resetEnabled?: boolean
  onConfirm?: (settings: ViewSettings) => void
  onCancel?: (settings: ViewSettings) => void
  onReset?: () => void
  texts?: Partial<ViewSettingsTexts>
  /** Render in place instead of in a portal (no overlay). */
  portal?: boolean
  /** Opener of the dialog (e.g. a DialogTrigger), rendered as is. */
  children?: React.ReactNode
  className?: string
}

type State = {
  sortOrder: boolean // descending
  sortBy: number
  groupOrder: boolean
  groupBy: number
  filters: boolean[][]
}

const initialState = (p: ViewSettingsDialogProps): State => ({
  sortOrder: !!p.sortDescending,
  sortBy: (p.sortItems ?? []).findIndex((i) => i.selected),
  groupOrder: !!p.groupDescending,
  groupBy: (p.groupItems ?? []).findIndex((i) => i.selected),
  filters: (p.filterItems ?? []).map((f) => f.values.map((v) => !!v.selected)),
})

const sameState = (a: State, b: State) => JSON.stringify(a) === JSON.stringify(b)

function toSettings(s: State, p: ViewSettingsDialogProps): ViewSettings {
  const filters: Record<string, string[]> = {}
  ;(p.filterItems ?? []).forEach((f, i) => {
    const sel = f.values.filter((_, j) => s.filters[i]?.[j]).map((v) => v.text)
    if (sel.length) filters[f.text] = sel
  })
  return {
    sortBy: p.sortItems?.[s.sortBy]?.text,
    sortDescending: s.sortOrder,
    groupBy: p.groupItems?.[s.groupBy]?.text,
    groupDescending: s.groupOrder,
    filters,
  }
}

/** A list with ui5-list keyboard handling: one Tab stop, ↑/↓/Home/End move focus. */
function VsdList({
  label,
  header,
  children,
  role = "listbox",
  multiselectable,
  className,
}: {
  label: string
  header?: string
  children: React.ReactNode
  role?: "listbox" | "list"
  multiselectable?: boolean
  className?: string
}) {
  const headerId = React.useId()
  const ref = React.useRef<HTMLUListElement>(null)
  React.useLayoutEffect(() => {
    const items = [...(ref.current?.querySelectorAll<HTMLElement>("[data-vsd-item]") ?? [])]
    if (items.length && !items.some((i) => i.tabIndex === 0)) {
      const sel = items.find((i) => i.getAttribute("aria-selected") === "true") ?? items[0]
      sel.tabIndex = 0
    }
  })
  return (
    <div className={cn("fiori-vsd__list", className)} data-sap-ui-fastnavgroup="true">
      {header && (
        <div id={headerId} className="fiori-vsd__group-header" role="presentation">
          <span>{header}</span>
        </div>
      )}
      <ul
        ref={ref}
        role={role}
        aria-label={header ? undefined : label}
        aria-labelledby={header ? headerId : undefined}
        aria-multiselectable={multiselectable || undefined}
        className="fiori-vsd__ul"
        onFocus={(e) => {
          const t = e.target as HTMLElement
          if (!t.hasAttribute("data-vsd-item")) return
          ref.current?.querySelectorAll<HTMLElement>("[data-vsd-item]").forEach((i) => (i.tabIndex = i === t ? 0 : -1))
        }}
        onKeyDown={(e) => {
          const t = e.target as HTMLElement
          if (!t.hasAttribute("data-vsd-item")) return
          const items = [...e.currentTarget.querySelectorAll<HTMLElement>("[data-vsd-item]")]
          const i = items.indexOf(t)
          const n = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 }[e.key]
          if (n === undefined) return
          e.preventDefault()
          items[Math.min(Math.max(n, 0), items.length - 1)].focus()
        }}
      >
        {children}
      </ul>
    </div>
  )
}

type VsdItemProps = {
  children: React.ReactNode
  selected?: boolean
  /** "single": radio before the text; "multiple": checkbox; "none": navigation item. */
  mode: "single" | "multiple" | "none"
  additionalText?: string
  onPress: () => void
  "aria-label"?: string
}

// The selection controls reuse <RadioGroupItem> / <Checkbox> markup and CSS (fiori-radio / fiori-checkbox),
// rendered decoratively (the item itself is the focusable option), as ui5-li renders them with tabindex -1.
function VsdItem({ children, selected, mode, additionalText, onPress, "aria-label": ariaLabel }: VsdItemProps) {
  const [active, setActive] = React.useState(false)
  return (
    <li
      data-vsd-item=""
      data-mode={mode}
      data-selected={selected ? "" : undefined}
      data-active={active ? "" : undefined}
      role={mode === "none" ? "listitem" : "option"}
      aria-selected={mode === "none" ? undefined : !!selected}
      aria-label={ariaLabel}
      tabIndex={-1}
      className="fiori-vsd__item"
      onClick={onPress}
      onPointerDown={() => mode === "none" && setActive(true)}
      onPointerUp={() => setActive(false)}
      onPointerLeave={() => setActive(false)}
      onKeyDown={(e) => {
        if (e.key === " ") e.preventDefault()
        if (e.key === "Enter") onPress()
        if ((e.key === " " || e.key === "Enter") && mode === "none") setActive(true)
      }}
      onKeyUp={(e) => {
        setActive(false)
        if (e.key === " ") onPress()
      }}
    >
      {mode === "single" && (
        <span className="fiori-radio fiori-vsd__radio" data-state={selected ? "checked" : "unchecked"} aria-hidden>
          <span className="fiori-radio__inner">
            <svg className="fiori-radio__svg" focusable="false">
              <circle className="fiori-radio__outer" cx="50%" cy="50%" r="50%" />
              <circle className="fiori-radio__dot" cx="50%" cy="50%" />
            </svg>
          </span>
        </span>
      )}
      {mode === "multiple" && (
        <span className="fiori-checkbox fiori-vsd__checkbox" data-state={selected ? "checked" : "unchecked"} aria-hidden>
          <span className="fiori-checkbox__inner">
            <Icon icon={accept} className="fiori-checkbox__icon size-(--fiori-checkbox-icon-size)" />
          </span>
        </span>
      )}
      <span className="fiori-vsd__item-text">{children}</span>
      {additionalText && <span className="fiori-vsd__item-additional">{additionalText}</span>}
    </li>
  )
}

function ViewSettingsDialog(props: ViewSettingsDialogProps) {
  const {
    open: openProp,
    defaultOpen,
    onOpenChange,
    sortItems = [],
    filterItems = [],
    groupItems = [],
    resetEnabled,
    onConfirm,
    onCancel,
    onReset,
    portal = true,
    children,
    className,
  } = props
  const t = useFioriTexts<Required<ViewSettingsTexts>>(defaultTexts, defaultTextsKeys, props.texts)
  const [announcement, setAnnouncement] = React.useState({ text: "", sequence: 0 })
  const [innerOpen, setInnerOpen] = React.useState(!!defaultOpen)
  const open = openProp ?? innerOpen
  const setOpen = (o: boolean) => {
    if (openProp === undefined) setInnerOpen(o)
    onOpenChange?.(o)
  }
  const initial = React.useMemo(() => initialState(props), [JSON.stringify([props.sortItems, props.filterItems, props.groupItems, props.sortDescending, props.groupDescending])]) // eslint-disable-line react-hooks/exhaustive-deps
  const [confirmed, setConfirmed] = React.useState(initial)
  const [current, setCurrent] = React.useState(initial)
  React.useEffect(() => {
    setConfirmed(initial)
    setCurrent(initial)
  }, [initial])

  const modes: Mode[] = [...(sortItems.length ? ["sort" as const] : []), ...(filterItems.length ? ["filter" as const] : []), ...(groupItems.length ? ["group" as const] : [])]
  const defaultMode = modes[0] ?? "sort"
  const [mode, setMode] = React.useState<Mode>(defaultMode)
  const [filterIndex, setFilterIndex] = React.useState<number | null>(null)
  const pagination = modes.length > 1
  const stepTwo = mode === "filter" && filterIndex !== null
  const contentRef = React.useRef<HTMLDivElement>(null)

  const restore = (s: State) => {
    setCurrent(s)
    setMode(defaultMode)
    setFilterIndex(null)
  }
  const cancel = () => {
    restore(confirmed)
    onCancel?.(toSettings(confirmed, props))
    setOpen(false)
  }
  const confirm = () => {
    setConfirmed(current)
    onConfirm?.(toSettings(current, props))
    setOpen(false)
  }
  const focusFirstIn = () =>
    requestAnimationFrame(() => {
      const items = [...(contentRef.current?.querySelectorAll<HTMLElement>("[data-vsd-item]") ?? [])]
      ;(items.find((i) => i.getAttribute("aria-selected") === "true") ?? items[0])?.focus()
    })

  const sortAndGroup = (isSort: boolean) => {
    const order = isSort ? current.sortOrder : current.groupOrder
    const by = isSort ? current.sortBy : current.groupBy
    const items = isSort ? sortItems : groupItems
    return (
      <div className="fiori-vsd__sort">
        <VsdList label={isSort ? t.sortOrder : t.groupOrder} header={isSort ? t.sortOrder : t.groupOrder}>
          {[t.ascending, t.descending].map((text, i) => (
            <VsdItem
              key={text}
              mode="single"
              selected={order === (i === 1)}
              onPress={() => setCurrent((c) => ({ ...c, [isSort ? "sortOrder" : "groupOrder"]: i === 1 }))}
            >
              {text}
            </VsdItem>
          ))}
        </VsdList>
        <VsdList label={isSort ? t.sortBy : t.groupBy} header={isSort ? t.sortBy : t.groupBy}>
          {items.map((item, i) => (
            <VsdItem
              key={item.text}
              mode="single"
              selected={by === i}
              onPress={() => setCurrent((c) => ({ ...c, [isSort ? "sortBy" : "groupBy"]: i }))}
            >
              {item.text}
            </VsdItem>
          ))}
        </VsdList>
      </div>
    )
  }

  const filterPage = stepTwo ? (
    <VsdList label={`${t.filterBy}: ${filterItems[filterIndex!]?.text}`} multiselectable>
      {filterItems[filterIndex!].values.map((v, j) => (
        <VsdItem
          key={v.text}
          mode="multiple"
          selected={!!current.filters[filterIndex!]?.[j]}
          onPress={() =>
            setCurrent((c) => ({
              ...c,
              filters: c.filters.map((f, i) => (i === filterIndex ? f.map((s, k) => (k === j ? !s : s)) : f)),
            }))
          }
        >
          {v.text}
        </VsdItem>
      ))}
    </VsdList>
  ) : (
    <VsdList label={t.filterBy} header={t.filterBy} role="list">
      {filterItems.map((f, i) => {
        const count = current.filters[i]?.filter(Boolean).length ?? 0
        return (
          <VsdItem
            key={f.text}
            mode="none"
            additionalText={count ? String(count) : undefined}
            aria-label={count ? t.filterItemLabel(f.text, count) : undefined}
            onPress={() => {
              setFilterIndex(i)
              focusFirstIn()
            }}
          >
            {f.text}
          </VsdItem>
        )
      })}
    </VsdList>
  )

  const dirty = !sameState(current, initial)
  const title = stepTwo ? `${t.filterBy}: ${filterItems[filterIndex!]?.text ?? ""}` : t.title

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) cancel()
        else setOpen(true)
      }}
      modal={portal}
    >
      {children}
      <DialogContent
        portal={portal}
        className={cn("fiori-vsd", className)}
        aria-describedby={undefined}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          if (portal) focusFirstIn()
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault()
          cancel()
        }}
      >
        <DialogHeader className="fiori-vsd__header">
          <div className="fiori-vsd__header-container">
            <div className="fiori-vsd__header-start">
              {stepTwo && (
                <Button
                  variant="transparent"
                  size="icon"
                  className="fiori-vsd__back"
                  aria-label={t.back}
                  title={t.back}
                  onClick={() => {
                    const i = filterIndex
                    setFilterIndex(null)
                    requestAnimationFrame(() => contentRef.current?.querySelectorAll<HTMLElement>("[data-vsd-item]")[i ?? 0]?.focus())
                  }}
                >
                  <Icon icon={navBack} />
                </Button>
              )}
              <DialogTitle className="fiori-vsd__title">{title}</DialogTitle>
            </div>
            <Button
              variant="transparent"
              disabled={!resetEnabled && !dirty}
              onClick={() => {
                restore(initial)
                // ViewSettingsDialog.js/_onResetSettings announces through InvisibleMessageMode.Assertive.
                setAnnouncement(old => ({ text: t.resetAnnouncement, sequence: old.sequence + 1 }))
                onReset?.()
                focusFirstIn()
              }}
            >
              {t.reset}
            </Button>
          </div>
          {!stepTwo && pagination && (
            <div className="fiori-vsd__sub-header">
              <SegmentedButton value={mode} onValueChange={(v) => setMode(v as Mode)}>
                {modes.map((m) => {
                  const tip = { sort: t.sortTooltip, filter: t.filterTooltip, group: t.groupTooltip }[m]
                  return (
                    <SegmentedButtonItem
                      key={m}
                      value={m}
                      aria-label={tip}
                      title={tip}
                      icon={<Icon icon={{ sort: sortIcon, filter: filterIcon, group: group2 }[m]} />}
                    />
                  )
                })}
              </SegmentedButton>
            </div>
          )}
        </DialogHeader>
        <div ref={contentRef} className="fiori-popup__content fiori-vsd__body">
          <div className="fiori-vsd__content" data-expand={stepTwo || !pagination ? "" : undefined}>
            {mode === "sort" && sortAndGroup(true)}
            {mode === "filter" && filterPage}
            {mode === "group" && sortAndGroup(false)}
          </div>
        </div>
        <DialogFooter className="fiori-vsd__footer">
          <Button variant="emphasized" className="min-w-[calc(4rem+2*var(--sapButton_BorderWidth))]" onClick={confirm}>
            {t.ok}
          </Button>
          <Button variant="transparent" onClick={cancel}>
            {t.cancel}
          </Button>
        </DialogFooter>
        <span className="sr-only" role="status" aria-live="assertive" aria-atomic="true"><span key={announcement.sequence}>{announcement.text}</span></span>
      </DialogContent>
    </Dialog>
  )
}

export { ViewSettingsDialog, type ViewSettingsDialogProps, type ViewSettingsTexts, type ViewSettings, type SortItem, type FilterItem, type FilterOption }

// UI5 keys resolved at the existing rendered/announced text owner.
const defaultTextsKeys = {
  "title": "VSD_DIALOG_TITLE_SORT",
  "reset": "VSD_RESET_BUTTON",
  "ok": "VSD_SUBMIT_BUTTON",
  "cancel": "VSD_CANCEL_BUTTON",
  "sortOrder": "VSD_SORT_ORDER",
  "sortBy": "VSD_SORT_BY",
  "groupOrder": "VSD_GROUP_ORDER",
  "groupBy": "VSD_GROUP_BY",
  "filterBy": "VSD_FILTER_BY",
  "ascending": "VSD_ORDER_ASCENDING",
  "descending": "VSD_ORDER_DESCENDING",
  "sortTooltip": "VSD_SORT_TOOLTIP",
  "filterTooltip": "VSD_FILTER_TOOLTIP",
  "groupTooltip": "VSD_GROUP_TOOLTIP",
  "back": "MENU_BACK_BUTTON_ARIA_LABEL",
  resetAnnouncement: "VSD_RESET_BUTTON_ACTION",
  filterItemLabel: "VSD_FILTER_ITEM_LABEL_TEXT"
} as const
