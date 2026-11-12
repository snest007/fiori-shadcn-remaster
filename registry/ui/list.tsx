import * as React from "react"

// UI5 2.28 List fastNavigation metadata; UI5Element.onEnterDOM marks this root unless overridden.

import { useFioriDragAndDrop, type FioriMoveHandlers } from "@/lib/fiori-drag-and-drop"

import { accept, decline, edit, slimArrowRight } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { BusyIndicator } from "@/components/ui/busy-indicator"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import type { FioriIconData } from "@/lib/fiori-icons"

// Mirrors ui5-list / ui5-li / ui5-li-custom / ui5-li-group (Horizon).
// The List owns selection, roving focus (UI5 ItemNavigation: ↑/↓, Home/End, PageUp/PageDown by 10,
// no wrap) and Tab forwarding: Tab from an item (or its last tabbable content) leaves the list,
// Shift+Tab from an item leaves it backwards, re-entering focuses the previously focused item.
// F2 moves focus between an item and its content. Styles: registry/styles/components/list.css.

type ListSelectionMode = "none" | "single" | "singleStart" | "singleEnd" | "singleAuto" | "multiple" | "delete"
type ListItemType = "active" | "inactive" | "inactiveSelectable" | "detail" | "navigation"
type ListItemHighlight = "none" | "negative" | "critical" | "positive" | "information"
type ListSeparators = "all" | "inner" | "none"
type ListGrowing = "none" | "button" | "scroll"
type ListAdditionalTextState = "none" | "negative" | "critical" | "positive" | "information"

const PAGE_SIZE = 10
const SINGLE_MODES: ListSelectionMode[] = ["single", "singleStart", "singleEnd", "singleAuto"]
const isSingle = (m: ListSelectionMode) => SINGLE_MODES.includes(m)
const TABBABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

type ListCore = {
  rootRef: React.RefObject<HTMLDivElement | null>
  mode: ListSelectionMode
  itemRole: "listitem" | "option" | "treeitem"
  isSelected: (value: string) => boolean
  /** source "component": the radio / check box was pressed (no item-click). */
  select: (value: string, selected: boolean) => void
  press: (value: string, type: ListItemType) => void
  remove: (value: string) => void
  currentKey: string | null
  setCurrentKey: (key: string) => void
  hasBorder: (key: string) => boolean
  forwardAfter: (e: React.KeyboardEvent) => void
  forwardBefore: () => void
  deleteText: string
  selectedText: string
  notSelectedText: string
}

const ListCoreContext = React.createContext<ListCore | null>(null)

function useListCore() {
  const ctx = React.useContext(ListCoreContext)
  if (!ctx) throw new Error("List items must be rendered inside <List> or <Tree>.")
  return ctx
}

/** Items the user navigates among, in DOM order (disabled ones are skipped, as in UI5). */
function navItems(root: HTMLElement | null) {
  if (!root) return []
  return [...root.querySelectorAll<HTMLElement>("[data-nav-key]")].filter(
    (el) => el.closest('[data-slot="list"], [data-slot="tree"]') === root && !el.hasAttribute("data-disabled")
  )
}

/** Tabbable content inside an item's own row (not the item itself, not nested tree items). */
function tabbablesIn(item: HTMLElement) {
  const row = item.querySelector<HTMLElement>(":scope > [data-li-row]") ?? item
  return [...row.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (el) => el !== item && el.closest("[data-nav-key]") === item && !el.closest("[data-li-selection]")
  )
}

type CoreOptions = {
  mode: ListSelectionMode
  itemRole: ListCore["itemRole"]
  separators: ListSeparators
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[], detail: { item: string; selected: boolean }) => void
  onItemClick?: (value: string) => void
  onItemDelete?: (value: string) => void
  deleteText: string
  selectedText: string
  notSelectedText: string
  growingButtonRef?: React.RefObject<HTMLDivElement | null>
}

/** Shared by List and Tree: selection state, roving tab stop, separators and Tab forwarding. */
function useListCoreValue(opts: CoreOptions) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const beforeRef = React.useRef<HTMLDivElement>(null)
  const afterRef = React.useRef<HTMLDivElement>(null)
  const forwarding = React.useRef(false)
  const [inner, setInner] = React.useState<string[]>(opts.defaultValue ?? [])
  const selected = opts.value ?? inner
  const selectedRef = React.useRef(selected)
  selectedRef.current = selected
  const optsRef = React.useRef(opts)
  optsRef.current = opts
  const [currentKey, setCurrentKey] = React.useState<string | null>(null)
  const [lastKey, setLastKey] = React.useState<string | null>(null)

  // Keep one tab stop: the current item if it still exists, else the first selected item, else the first.
  React.useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const items = navItems(root)
    const keys = items.map((el) => el.dataset.navKey!)
    if (!currentKey || !keys.includes(currentKey)) {
      const sel = items.find((el) => el.hasAttribute("data-selected"))
      const next = sel?.dataset.navKey ?? keys[0] ?? null
      if (next !== currentKey) setCurrentKey(next)
    }
    const all = [...root.querySelectorAll<HTMLElement>("[data-nav-key]")].filter(
      (el) => el.closest('[data-slot="list"], [data-slot="tree"]') === root
    )
    const last = all.at(-1)?.dataset.navKey ?? null
    if (last !== lastKey) setLastKey(last)
  })

  const commit = React.useCallback((next: string[], item: string, isSel: boolean) => {
    if (optsRef.current.value === undefined) setInner(next)
    optsRef.current.onValueChange?.(next, { item, selected: isSel })
  }, [])

  const select = React.useCallback(
    (value: string, want: boolean) => {
      const { mode } = optsRef.current
      const cur = selectedRef.current
      if (isSingle(mode)) {
        if (cur.includes(value)) return // UI5 handleSingle: re-selecting is no change
        commit([value], value, true)
      } else if (mode === "multiple") {
        const has = cur.includes(value)
        if (has === want) return
        commit(want ? [...cur, value] : cur.filter((v) => v !== value), value, want)
      }
    },
    [commit]
  )

  const core: ListCore = {
    rootRef,
    mode: opts.mode,
    itemRole: opts.itemRole,
    isSelected: (v) => selected.includes(v),
    select,
    press: (value, type) => {
      if (type !== "inactiveSelectable") optsRef.current.onItemClick?.(value)
      if (optsRef.current.mode !== "delete" && optsRef.current.mode !== "none") select(value, !selectedRef.current.includes(value))
    },
    remove: (value) => optsRef.current.onItemDelete?.(value),
    currentKey,
    setCurrentKey,
    hasBorder: (key) => opts.separators === "all" || (opts.separators === "inner" && key !== lastKey),
    forwardAfter: (e) => {
      const growing = optsRef.current.growingButtonRef?.current
      if (growing) {
        e.preventDefault()
        growing.focus()
        return
      }
      // Focus the end marker without preventing Tab: the browser then moves on past the list.
      forwarding.current = true
      afterRef.current?.focus()
    },
    forwardBefore: () => {
      forwarding.current = true
      beforeRef.current?.focus()
    },
    deleteText: opts.deleteText,
    selectedText: opts.selectedText,
    notSelectedText: opts.notSelectedText,
  }

  const focusCurrent = () => {
    const items = navItems(rootRef.current)
    ;(items.find((el) => el.dataset.navKey === currentKey) ?? items[0])?.focus()
  }
  const focusArea = (which: "before" | "after") => (
    <div
      ref={which === "before" ? beforeRef : afterRef}
      tabIndex={0}
      className="fiori-list__focusarea"
      onFocus={() => {
        if (forwarding.current) {
          forwarding.current = false
          return
        }
        const growing = optsRef.current.growingButtonRef?.current
        if (which === "after" && growing) growing.focus()
        else focusCurrent()
      }}
    />
  )

  return { core, focusArea, focusCurrent }
}

/** Arrow / Home / End / PageUp / PageDown between items (UI5 ItemNavigation, static behaviour). */
function handleNavigationKey(e: React.KeyboardEvent, core: ListCore, opts?: { growingButton?: HTMLElement | null }) {
  const root = core.rootRef.current
  const target = e.target as HTMLElement
  const item = target.closest<HTMLElement>("[data-nav-key]")
  if (!root || !item || e.altKey || e.ctrlKey || e.metaKey) return
  const items = navItems(root)
  const idx = items.indexOf(item)
  if (idx === -1) return
  const onItem = target === item
  if (!onItem) {
    // Focus is on content inside the item: ↑/↓ go to the same content element of the adjacent item.
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return
    const own = tabbablesIn(item)
    const at = own.indexOf(target)
    if (at === -1) return
    const withContent = items.filter((el) => tabbablesIn(el).length > 0)
    const next = withContent[withContent.indexOf(item) + (e.key === "ArrowUp" ? -1 : 1)]
    if (!next) return
    e.preventDefault()
    const f = tabbablesIn(next)
    f[Math.min(at, f.length - 1)].focus()
    return
  }
  const growing = opts?.growingButton
  let next = idx
  switch (e.key) {
    case "ArrowDown":
      if (growing && idx === items.length - 1) {
        e.preventDefault()
        growing.focus()
        return
      }
      next = Math.min(idx + 1, items.length - 1)
      break
    case "ArrowUp":
      next = Math.max(idx - 1, 0)
      break
    case "Home":
      next = 0
      break
    case "End":
      if (growing && idx === items.length - 1) {
        e.preventDefault()
        growing.focus()
        return
      }
      next = items.length - 1
      break
    case "PageUp":
      next = Math.max(idx - PAGE_SIZE, 0)
      break
    case "PageDown":
      next = Math.min(idx + PAGE_SIZE, items.length - 1)
      break
    default:
      return
  }
  e.preventDefault()
  items[next].focus()
}

// ---------------------------------------------------------------------------------------------
// List

type ListProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & FioriMoveHandlers & {
  selectionMode?: ListSelectionMode
  /** Values of the selected items (controlled). Every mode uses an array; single modes hold at most one. */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[], detail: { item: string; selected: boolean }) => void
  /** Fired when an item is activated (click, Enter, Space), unless its type is inactive / detail. */
  onItemClick?: (value: string) => void
  /** Delete mode: the item's delete button was pressed (or Delete pressed on the item). */
  onItemDelete?: (value: string) => void
  headerText?: string
  /** Custom header content; replaces `headerText`. */
  header?: React.ReactNode
  footerText?: string
  /** Shown when the list has no items. */
  noDataText?: string
  separators?: ListSeparators
  /** Adds 2rem padding around the list. */
  indent?: boolean
  stickyHeader?: boolean
  growing?: ListGrowing
  growingButtonText?: string
  onLoadMore?: () => void
  loading?: boolean
  loadingDelay?: number
  /** "listbox" renders options (aria-selected); "list" renders list items (default, as UI5). */
  accessibleRole?: "list" | "listbox"
  /** Tooltip of the delete buttons (default "Delete"). */
  deleteText?: string
  /** Screen-reader texts used to announce selection on list items. */
  selectedText?: string
  notSelectedText?: string
}

const modeLabel: Partial<Record<ListSelectionMode, string>> = {
  multiple: "Contains Multi-Selectable Items",
  delete: "Contains Deletable Items",
}

function List({
  selectionMode = "none",
  value,
  defaultValue,
  onValueChange,
  onItemClick,
  onItemDelete,
  onMoveOver,
  onMove,
  headerText,
  header,
  footerText,
  noDataText,
  separators = "all",
  indent,
  stickyHeader,
  growing = "none",
  growingButtonText = "More",
  onLoadMore,
  loading,
  loadingDelay = 1000,
  accessibleRole = "list",
  deleteText = "Delete",
  selectedText = "Selected",
  notSelectedText = "Not Selected",
  className,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  ...props
}: ListProps) {
  const id = React.useId()
  const growingRef = React.useRef<HTMLDivElement>(null)
  const { core, focusArea } = useListCoreValue({
    mode: selectionMode,
    itemRole: accessibleRole === "listbox" ? "option" : "listitem",
    separators,
    value,
    defaultValue,
    onValueChange,
    onItemClick,
    onItemDelete,
    deleteText,
    selectedText,
    notSelectedText,
    growingButtonRef: growing === "button" ? growingRef : undefined,
  })
  const dragAndDrop = useFioriDragAndDrop({
    rootRef: core.rootRef,
    kind: "list",
    // List._dragAndDropHandler uses top-level List.items; grouped children are represented by their group.
    getItems: () => [...(core.rootRef.current?.querySelectorAll<HTMLElement>('[data-slot="list-item"], [data-slot="list-item-group"], [data-slot="list-item-group-header"]') ?? [])].filter((item) => item.closest('[data-slot="list"]') === core.rootRef.current && !item.parentElement?.closest('[data-slot="list-item-group"]')),
    onMoveOver,
    onMove,
    dragHandlers: { onDragStart, onDragEnd, onDragEnter, onDragLeave, onDragOver, onDrop },
  })
  const hasData = React.Children.toArray(children).length > 0
  const headerId = `${id}-header`
  const modeId = `${id}-mode`
  const modeText = hasData ? (isSingle(selectionMode) ? "Contains Selectable Items" : modeLabel[selectionMode]) : undefined
  const labelledBy =
    ariaLabelledBy ?? (ariaLabel ? undefined : cn(modeText && modeId, !header && headerText && headerId) || undefined)

  // Scroll growing: load more when the end marker comes into view after the user has scrolled.
  const startRef = React.useRef<HTMLSpanElement>(null)
  const endRef = React.useRef<HTMLSpanElement>(null)
  const onLoadMoreRef = React.useRef(onLoadMore)
  onLoadMoreRef.current = onLoadMore
  React.useEffect(() => {
    if (growing !== "scroll" || !startRef.current || !endRef.current) return
    let startOut = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const start = new IntersectionObserver(([e]) => (startOut = !e.isIntersecting))
    const end = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      clearTimeout(timer)
      timer = setTimeout(() => startOut && onLoadMoreRef.current?.(), 250)
    })
    start.observe(startRef.current)
    end.observe(endRef.current)
    return () => {
      start.disconnect()
      end.disconnect()
      clearTimeout(timer)
    }
  }, [growing])

  const [moreActive, setMoreActive] = React.useState(false)
  const loadMore = () => onLoadMoreRef.current?.()

  const body = (
    <div className="fiori-list__container">
      {header}
      {!header && headerText && (
        <header id={headerId} className="fiori-list__header">
          {headerText}
        </header>
      )}
      <div className="fiori-list__scroll">
        <span ref={startRef} aria-hidden className="fiori-list__marker" />
        {hasData && focusArea("before")}
        {modeText && (
          <span id={modeId} className="sr-only">
            {modeText}
          </span>
        )}
        <ul
          role={accessibleRole}
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
          aria-multiselectable={accessibleRole === "listbox" && selectionMode === "multiple" ? true : undefined}
          className="fiori-list__ul"
          onKeyDown={(e) => {
            if (!e.defaultPrevented && !dragAndDrop.handleKeyDown(e)) handleNavigationKey(e, core, { growingButton: growingRef.current })
          }}
        >
          {children}
          {!hasData && noDataText && (
            <li tabIndex={0} role={accessibleRole === "listbox" ? "option" : "listitem"} className="fiori-list__nodata">
              <div className="fiori-list__nodata-text">{noDataText}</div>
            </li>
          )}
        </ul>
        {growing === "button" && (
          <div className="fiori-list__growing">
            <div
              ref={growingRef}
              id={`${id}-growing`}
              role="button"
              tabIndex={0}
              aria-labelledby={`${id}-growing-text`}
              data-active={moreActive ? "" : undefined}
              className="fiori-list__growing-inner"
              onClick={loadMore}
              onPointerDown={() => setMoreActive(true)}
              onPointerUp={() => setMoreActive(false)}
              onPointerLeave={() => setMoreActive(false)}
              onKeyDown={(e) => {
                if (e.key === " ") {
                  e.preventDefault()
                  setMoreActive(true)
                } else if (e.key === "Enter") {
                  e.preventDefault()
                  loadMore()
                  setMoreActive(true)
                } else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
                  e.preventDefault()
                  const items = navItems(core.rootRef.current)
                  if (e.key === "ArrowUp") items.at(-1)?.focus()
                  else (items.find((el) => el.dataset.navKey === core.currentKey) ?? items[0])?.focus()
                }
                // Plain Tab continues past the list (there is no end marker after the growing button).
              }}
              onKeyUp={(e) => {
                if (e.key === " ") loadMore()
                setMoreActive(false)
              }}
            >
              {loading && <BusyIndicator active delay={loadingDelay} size="M" className="fiori-list__growing-busy" />}
              <span id={`${id}-growing-text`} className="fiori-list__growing-text">
                {growingButtonText}
              </span>
            </div>
          </div>
        )}
        {footerText && <footer className="fiori-list__footer">{footerText}</footer>}
        {hasData && growing !== "button" && focusArea("after")}
        <span ref={endRef} aria-hidden className="fiori-list__marker" />
      </div>
    </div>
  )

  return (
    <ListCoreContext.Provider value={core}>
      <div
        ref={core.rootRef}
        data-slot="list" data-sap-ui-fastnavgroup="true"
        data-selection-mode={selectionMode}
        data-separators={separators}
        data-indent={indent ? "" : undefined}
        data-sticky-header={stickyHeader ? "" : undefined}
        data-growing={growing}
        className={cn("fiori-list", className)}
        {...dragAndDrop.handlers}
        {...props}
      >
        {loading && growing !== "button" ? (
          <BusyIndicator active delay={loadingDelay} className="fiori-list__busy">
            {body}
          </BusyIndicator>
        ) : (
          body
        )}
        {dragAndDrop.indicator}
      </div>
    </ListCoreContext.Provider>
  )
}

// ---------------------------------------------------------------------------------------------
// Items

type ItemBehaviourOptions = {
  value?: string
  type: ListItemType
  disabled?: boolean
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>
  onKeyUp?: React.KeyboardEventHandler<HTMLElement>
  onClick?: React.MouseEventHandler<HTMLElement>
  onFocus?: React.FocusEventHandler<HTMLElement>
  onPointerDown?: React.PointerEventHandler<HTMLElement>
}

/** Behaviour shared by every selectable item (list items and tree items). */
function useListItemBehaviour(opts: ItemBehaviourOptions) {
  const core = useListCore()
  const autoId = React.useId()
  const value = opts.value ?? autoId
  const selected = core.isSelected(value)
  const [active, setActive] = React.useState(false)
  const pressable = opts.type === "active" || opts.type === "navigation"
  const inactive = opts.type === "inactive" || opts.type === "detail"
  const actionable = pressable && core.mode !== "delete"

  React.useEffect(() => {
    if (!active) return
    const off = () => setActive(false)
    document.addEventListener("pointerup", off)
    document.addEventListener("keyup", off)
    return () => {
      document.removeEventListener("pointerup", off)
      document.removeEventListener("keyup", off)
    }
  }, [active])

  const press = () => {
    if (opts.disabled || inactive) return
    core.press(value, opts.type)
  }
  // The item's own element: events coming from nested tree items are ignored.
  const own = (e: React.SyntheticEvent<HTMLElement>) => (e.target as HTMLElement).closest("[data-nav-key]") === e.currentTarget
  const contentFocused = (e: React.SyntheticEvent<HTMLElement>) => e.target !== e.currentTarget

  const handlers = {
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      opts.onFocus?.(e)
      if (!own(e)) return
      core.setCurrentKey(value)
      if (contentFocused(e)) setActive(false)
      else if (core.mode === "singleAuto" && opts.type !== "inactiveSelectable" && !opts.disabled) core.select(value, true)
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      opts.onKeyDown?.(e)
      if (e.defaultPrevented || !own(e)) return
      const item = e.currentTarget
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (!contentFocused(e)) core.forwardBefore()
        } else {
          const t = tabbablesIn(item)
          if (t.length === 0 || t.at(-1) === document.activeElement) core.forwardAfter(e)
        }
        return
      }
      if (e.key === "F2") {
        e.preventDefault()
        if (!contentFocused(e)) tabbablesIn(item)[0]?.focus()
        else item.focus()
        return
      }
      if (contentFocused(e)) return
      if (e.key === " ") e.preventDefault()
      if (e.key === "Enter") {
        e.preventDefault()
        press()
      }
      if ((e.key === " " || e.key === "Enter") && pressable && !opts.disabled) setActive(true)
    },
    onKeyUp: (e: React.KeyboardEvent<HTMLElement>) => {
      opts.onKeyUp?.(e)
      if (!own(e) || contentFocused(e)) return
      if (e.key === " ") press()
      if (e.key === " " || e.key === "Enter") setActive(false)
      if (core.mode === "delete" && e.key === "Delete" && !opts.disabled) core.remove(value)
    },
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      opts.onPointerDown?.(e)
      if (!own(e) || opts.disabled) return
      if (pressable && !(e.target as HTMLElement).closest("button, a, input, select, textarea")) setActive(true)
    },
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      opts.onClick?.(e)
      if (e.defaultPrevented || !own(e)) return
      const t = e.target as HTMLElement
      const interactive = t.closest("button, a, input, select, textarea, [role=button], [data-li-selection]")
      if (interactive && e.currentTarget.contains(interactive)) return
      press()
      if (document.activeElement !== e.currentTarget && !e.currentTarget.contains(document.activeElement)) e.currentTarget.focus()
    },
  }

  return { core, value, selected, active, actionable, inactive, handlers }
}

/** The radio button / check box / delete button UI5 places before or after an item's content. */
function SelectionElement({
  core,
  value,
  selected,
  inactive,
  disabled,
}: {
  core: ListCore
  value: string
  selected: boolean
  inactive: boolean
  disabled?: boolean
}) {
  const mode = core.mode
  const off = inactive || disabled
  if (isSingle(mode) && mode !== "single" && mode !== "singleAuto") {
    // Drawn like ui5-radio-button but not focusable: the item is the focus stop (UI5 tabindex -1).
    return (
      <span
        aria-hidden
        data-li-selection=""
        data-state={selected ? "checked" : "unchecked"}
        data-disabled={off ? "" : undefined}
        className="fiori-radio fiori-li__selection"
        onClick={(e) => {
          e.stopPropagation()
          if (!off) core.select(value, true)
        }}
      >
        <span className="fiori-radio__inner">
          <svg className="fiori-radio__svg" focusable="false" aria-hidden="true">
            <circle className="fiori-radio__outer" cx="50%" cy="50%" r="50%" />
            <circle className="fiori-radio__dot" cx="50%" cy="50%" />
          </svg>
        </span>
      </span>
    )
  }
  if (mode === "multiple") {
    return (
      <span
        aria-hidden
        data-li-selection=""
        data-state={selected ? "checked" : "unchecked"}
        data-disabled={off ? "" : undefined}
        className="fiori-checkbox fiori-li__selection"
        onClick={(e) => {
          e.stopPropagation()
          if (!off) core.select(value, !selected)
        }}
      >
        <span className="fiori-checkbox__inner">
          <Icon icon={accept} className="fiori-checkbox__icon size-(--fiori-checkbox-icon-size)" />
        </span>
      </span>
    )
  }
  if (mode === "delete") {
    return (
      <div className="fiori-li__deletebtn">
        <Button
          variant="transparent"
          size="icon"
          title={core.deleteText}
          aria-label={core.deleteText}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation()
            core.remove(value)
          }}
        >
          <Icon icon={decline} />
        </Button>
      </div>
    )
  }
  return null
}

type ListItemBaseProps = Omit<React.ComponentProps<"li">, "value" | "type" | "content"> & {
  /** Identifies the item for selection, click and delete callbacks. */
  value?: string
  type?: ListItemType
  highlight?: ListItemHighlight
  /** Shows the navigation indicator at the end of the item. */
  navigated?: boolean
  disabled?: boolean
  /** Allows mouse dragging and Ctrl/Cmd+Arrow or Home/End move requests. */
  movable?: boolean
  /** Fired by the edit button of `type="detail"` items. */
  onDetailClick?: () => void
  /** Tooltip / accessible description of the detail button (default "Edit"). */
  detailText?: string
}

type ItemRenderOptions = ListItemBaseProps & {
  /** data-* layout flags for the root (UI5 host attributes). */
  flags: Record<string, string | undefined>
  content: React.ReactNode
  /** Content rendered after `.fiori-li__content` (icon at the end). */
  afterContent?: React.ReactNode
  /** Pads the selection-element side (ui5-li / ui5-li-custom do, tree items don't). */
  padSelection: boolean
  /** Hides the radio / check box (ui5-tree-item-custom hide-selection-element). */
  hideSelectionElement?: boolean
}

function ListItemRoot({
  value: valueProp,
  type = "active",
  highlight = "none",
  navigated,
  disabled,
  movable = false,
  onDetailClick,
  detailText = "Edit",
  flags,
  content,
  afterContent,
  padSelection,
  className,
  onKeyDown,
  onKeyUp,
  onClick,
  onFocus,
  onPointerDown,
  ...props
}: ItemRenderOptions) {
  const { core, value, selected, active, actionable, inactive, handlers } = useListItemBehaviour({
    value: valueProp,
    type,
    disabled,
    onKeyDown,
    onKeyUp,
    onClick,
    onFocus,
    onPointerDown,
  })
  const contentId = React.useId()
  const descId = React.useId()
  const mode = core.mode
  // UI5: only Multiple / Single / SingleStart / SingleEnd announce selection (not SingleAuto).
  const ariaSelected = mode === "multiple" || (isSingle(mode) && mode !== "singleAuto") ? selected : undefined
  const before = mode === "multiple" || mode === "singleStart"
  const after = mode === "singleEnd" || mode === "delete"
  const sel = <SelectionElement core={core} value={value} selected={selected} inactive={inactive} disabled={disabled} />
  return (
    <li
      data-slot="list-item"
      // UI5 ListItemTemplate uses movable independently of disabled; List._moveItem accepts programmatic focus moves.
      data-movable={movable ? "" : undefined}
      draggable={movable}
      data-nav-key={value}
      data-li-row=""
      data-selected={selected ? "" : undefined}
      data-actionable={actionable && !disabled ? "" : undefined}
      data-active={active && actionable ? "" : undefined}
      data-has-border={core.hasBorder(value) ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-highlight={highlight !== "none" ? highlight : undefined}
      data-mode={mode}
      data-pad-selection={padSelection ? "" : undefined}
      {...flags}
      role={core.itemRole}
      tabIndex={disabled ? -1 : core.currentKey === value ? 0 : -1}
      aria-selected={core.itemRole === "option" ? ariaSelected : undefined}
      aria-disabled={disabled || undefined}
      aria-describedby={ariaSelected !== undefined && core.itemRole === "listitem" ? descId : undefined}
      className={cn("fiori-li", className)}
      {...handlers}
      {...props}
    >
      {before && sel}
      {highlight !== "none" && <div className="fiori-li__highlight" />}
      <div id={contentId} className="fiori-li__content">
        {content}
      </div>
      {afterContent}
      {type === "detail" && (
        <div className="fiori-li__detailbtn">
          <Button
            variant="transparent"
            size="icon"
            aria-label={detailText}
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation()
              onDetailClick?.()
            }}
          >
            <Icon icon={edit} />
          </Button>
        </div>
      )}
      {type === "navigation" && <Icon icon={slimArrowRight} className="fiori-li__nav-icon" />}
      {navigated && <div className="fiori-li__navigated" />}
      {after && sel}
      {ariaSelected !== undefined && core.itemRole === "listitem" && (
        <span id={descId} className="sr-only">
          {selected ? core.selectedText : core.notSelectedText}
        </span>
      )}
    </li>
  )
}

type ListItemStandardProps = Omit<ListItemBaseProps, "children"> & {
  /** Title. `children` is used when omitted. */
  text?: React.ReactNode
  children?: React.ReactNode
  description?: React.ReactNode
  icon?: FioriIconData
  /** Shows `icon` at the end of the item instead of the beginning. */
  iconEnd?: boolean
  additionalText?: React.ReactNode
  additionalTextState?: ListAdditionalTextState
  /** An <Avatar> or <img> shown at the start (UI5 `image` slot). */
  image?: React.ReactNode
}

function AdditionalText({ text, state }: { text: React.ReactNode; state: ListAdditionalTextState }) {
  return (
    <span className="fiori-li__additional-text" data-state={state !== "none" ? state : undefined}>
      {text}
    </span>
  )
}

/** ui5-li */
function ListItemStandard({
  text,
  children,
  description,
  icon,
  iconEnd,
  additionalText,
  additionalTextState = "none",
  image,
  ...props
}: ListItemStandardProps) {
  const title = text ?? children
  const hasTitle = title != null && title !== ""
  const additional = additionalText ? <AdditionalText text={additionalText} state={additionalTextState} /> : null
  return (
    <ListItemRoot
      {...props}
      padSelection
      flags={{
        "data-description": description ? "" : undefined,
        "data-has-title": hasTitle ? "" : undefined,
        "data-image": image ? "" : undefined,
        "data-icon-end": icon && iconEnd ? "" : undefined,
      }}
      content={
        <>
          {image && <div className="fiori-li__image">{image}</div>}
          {icon && !iconEnd && <Icon icon={icon} className="fiori-li__icon" />}
          <div className="fiori-li__text-wrapper">
            <span className="fiori-li__title">{title}</span>
            {description && (
              <div className="fiori-li__description-wrapper">
                <span className="fiori-li__desc">{description}</span>
                {additional}
              </div>
            )}
          </div>
          {!description && additional}
        </>
      }
      afterContent={icon && iconEnd ? <Icon icon={icon} className="fiori-li__icon" /> : undefined}
    />
  )
}

type ListItemCustomProps = ListItemBaseProps

/** ui5-li-custom: any content. Tab moves into the content; F2 toggles between item and content. */
function ListItemCustom({ children, ...props }: ListItemCustomProps) {
  return <ListItemRoot {...props} padSelection flags={{ "data-custom": "" }} content={children} />
}

type ListItemGroupHeaderProps = Omit<React.ComponentProps<"li">, "value"> & {
  /** Identifies the header for keyboard navigation. */
  value?: string
}

/** ui5-li-group-header: focusable in the arrow-key order, never selectable. */
function ListItemGroupHeader({ value: valueProp, className, children, onFocus, ...props }: ListItemGroupHeaderProps) {
  const core = useListCore()
  const autoId = React.useId()
  const key = valueProp ?? autoId
  return (
    <li
      data-slot="list-item-group-header"
      data-nav-key={key}
      data-has-border={core.hasBorder(key) ? "" : undefined}
      role={core.itemRole === "option" ? undefined : "listitem"}
      aria-roledescription="Group Header"
      tabIndex={core.currentKey === key ? 0 : -1}
      className={cn("fiori-li-group-header", className)}
      onFocus={(e) => {
        onFocus?.(e)
        core.setCurrentKey(key)
      }}
      onKeyDown={(e) => {
        props.onKeyDown?.(e)
        if (e.defaultPrevented || e.key !== "Tab") return
        if (e.shiftKey) core.forwardBefore()
        else core.forwardAfter(e)
      }}
      {...props}
    >
      <div className="fiori-li-group-header__content">
        <span className="fiori-li-group-header__title">{children}</span>
      </div>
    </li>
  )
}

type ListItemGroupProps = Omit<React.ComponentProps<"li">, "value"> & {
  headerText?: string
  /** Custom header content; replaces `headerText`. */
  header?: React.ReactNode
}

/** ui5-li-group: a header followed by its items. */
function ListItemGroup({ headerText, header, className, children, ...props }: ListItemGroupProps) {
  const core = useListCore()
  const headerId = React.useId()
  const listbox = core.itemRole === "option"
  const hasHeader = !!(header ?? headerText)
  return (
    <li
      data-slot="list-item-group"
      role={listbox ? "group" : "none"}
      aria-labelledby={listbox && hasHeader ? headerId : undefined}
      className={cn("fiori-li-group", className)}
      {...props}
    >
      <ul role="none" className="fiori-li-group__ul">
        {hasHeader && <ListItemGroupHeader id={headerId}>{header ?? headerText}</ListItemGroupHeader>}
        {children}
      </ul>
    </li>
  )
}

export {
  List,
  ListItemStandard,
  ListItemStandard as ListItem,
  ListItemCustom,
  ListItemGroup,
  ListItemGroupHeader,
  // Shared with Tree (registry/ui/tree.tsx); not meant for direct use.
  ListCoreContext,
  useListCoreValue,
  useListItemBehaviour,
  handleNavigationKey,
  SelectionElement,
  AdditionalText,
  isSingle,
  navItems,
  type ListProps,
  type ListItemStandardProps,
  type ListItemCustomProps,
  type ListItemGroupProps,
  type ListItemGroupHeaderProps,
  type ListSelectionMode,
  type ListItemType,
  type ListItemHighlight,
  type ListSeparators,
  type ListGrowing,
  type ListAdditionalTextState,
  type ListCore,
}
