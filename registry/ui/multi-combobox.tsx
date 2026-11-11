import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { slimArrowDown } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Icon } from "@/components/ui/icon"
import { valueStateDefaultText, valueStateIcons, type ValueState } from "@/components/ui/input"
import { Token } from "@/components/ui/token"
import { Tokenizer, type TokenizerHandle } from "@/components/ui/tokenizer"

type MultiComboBoxFilter = "startsWithPerTerm" | "startsWith" | "contains" | "none"

type MultiComboBoxItemProps = {
  /** Text shown in the list and in the item's token. */
  text: string
  /** Secondary text, right-aligned in the list. */
  additionalText?: string
  /** Identifies the item in `selectedValues`. Defaults to `text`. */
  value?: string
}

/** Declares one entry of a <MultiComboBox>. Rendered by the MultiComboBox, not by itself. */
function MultiComboBoxItem(_props: MultiComboBoxItemProps): React.ReactNode {
  return null
}

type MultiComboBoxItemGroupProps = {
  /** Text of the nonselectable group header. An empty string omits the header. */
  headerText: string
  /** <MultiComboBoxItem> elements (fragments and arrays are fine). */
  children?: React.ReactNode
}

/** Declares a group of items, rendered by the MultiComboBox. */
function MultiComboBoxItemGroup(_props: MultiComboBoxItemGroupProps): React.ReactNode {
  return null
}

type MultiComboBoxProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "children" | "size"> & {
  /** <MultiComboBoxItem> and <MultiComboBoxItemGroup> elements (fragments and arrays are fine). */
  children?: React.ReactNode
  /** Values (item `value`, else `text`) of the selected items; each one shows as a token. */
  selectedValues?: string[]
  defaultSelectedValues?: string[]
  onSelectionChange?: (values: string[]) => void
  /** The text typed in the field. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Fires when the typed text is committed (Enter without a matching item, leaving the field), like UI5's `change`. */
  onCommit?: (value: string) => void
  /** How the list is filtered while typing. Default "startsWithPerTerm". */
  filter?: MultiComboBoxFilter
  /** Turns off inline autocomplete of the first matching item. */
  noTypeahead?: boolean
  /** Allows text that matches no item (by default it's flagged as an error and cleared on leaving the field). */
  noValidation?: boolean
  /** Shows a "Select All (x of y)" check box above the items. */
  showSelectAll?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  valueState?: ValueState
  /** Shown below the field while focused (and atop the list while open); defaults to SAP's standard text. `null` hides it. */
  valueStateMessage?: React.ReactNode | null
  /** Accessible name of the arrow button. */
  arrowLabel?: string
  /** Accessible name of the list. */
  listLabel?: string
  /** Text of the select-all check box. */
  selectAllText?: (selected: number, total: number) => string
  /** Value state message shown when Enter is pressed on an item that is already selected. */
  alreadySelectedText?: string
  /** Value state message shown while the text matches no item. */
  invalidText?: string
  /** "n more" text, see <Tokenizer nMoreText>. */
  nMoreText?: (count: number, allHidden: boolean) => string
  /** Screen-reader text for the token count. */
  tokensCountText?: (count: number) => string
  /** Render the list in place instead of in a portal on document.body. */
  portal?: boolean
  wrapperClassName?: string
}

type Item = MultiComboBoxItemProps & { key: string }

const SKIP_ITEMS = 10
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const filters: Record<MultiComboBoxFilter, (value: string, text: string) => boolean> = {
  startsWithPerTerm: (v, t) => new RegExp(`(^|\\s)${escapeRegExp(v.toLowerCase())}`).test(t.toLowerCase()),
  startsWith: (v, t) => t.toLowerCase().startsWith(v.toLowerCase()),
  contains: (v, t) => t.toLowerCase().includes(v.toLowerCase()),
  none: () => true,
}
const NO_AUTOCOMPLETE = new Set([
  "deleteWordBackward", "deleteWordForward", "deleteSoftLineBackward", "deleteSoftLineForward", "deleteEntireSoftLine",
  "deleteHardLineBackward", "deleteHardLineForward", "deleteByDrag", "deleteByCut", "deleteContent",
  "deleteContentBackward", "deleteContentForward", "historyUndo",
])
const defaultTokensCountText = (n: number) => (n === 0 ? "No Tokens" : n === 1 ? "Contains 1 token" : `Contains ${n} tokens`)
const defaultSelectAllText = (selected: number, total: number) => `Select All (${selected} of ${total})`

type Entry = Item | { headerText: string; items: Item[] }
const isGroup = (entry: Entry): entry is { headerText: string; items: Item[] } => "items" in entry

// UI5 MultiComboBox.js/_getItems and _filterItems separate group containers from
// selectable items. List.js/_getItems includes group headers in open navigation;
// MultiComboBox.js/_navigateToNextItem skips them while closed. They never select.
function collectEntries(children: React.ReactNode, out: Entry[] = []) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    if (child.type === MultiComboBoxItem) {
      const p = child.props as MultiComboBoxItemProps
      out.push({ ...p, key: p.value ?? p.text })
    } else if (child.type === MultiComboBoxItemGroup) {
      const p = child.props as MultiComboBoxItemGroupProps
      const nested = collectEntries(p.children).flatMap((entry) => isGroup(entry) ? entry.items : [entry])
      out.push({ headerText: p.headerText, items: nested })
    } else if (child.type === React.Fragment) collectEntries((child.props as { children?: React.ReactNode }).children, out)
  })
  return out
}

/** Bold the first word that starts with `match` (UI5's generateHighlightedMarkupFirstMatch). */
function highlight(text: string, match: string) {
  if (!match) return text
  const i = text.toLowerCase().search(new RegExp(`(^|\\s)${escapeRegExp(match.toLowerCase())}`))
  if (i === -1) return text
  const start = text[i] === " " ? i + 1 : i
  return (
    <>
      {text.slice(0, start)}
      <b>{text.slice(start, start + match.length)}</b>
      {text.slice(start + match.length)}
    </>
  )
}

// Mirrors ui5-multi-combobox (Horizon, desktop). Selected items show as tokens before the text.
// Typing filters the list and completes the first unselected match inline; Enter selects the matching
// item (an already selected one flags "already selected" for 2s). F4 / Alt+↓ / Alt+↑ toggle the list
// and move focus to an item; ↓ from the open field enters the list; ↑ on the first item returns.
// In the list: Space toggles (stays open), Enter / click toggle and close, Shift+↑/↓ extend, Ctrl+A
// toggles all, Escape / Tab close. While closed, ↑/↓ walk the unselected items in the field. Clicking
// "n more" (or Ctrl+I on a token) opens the list showing only the selected items. Ctrl+I in the field
// toggles the list. Without `noValidation`, text matching no item is flagged and cleared on blur.
function MultiComboBox({
  children,
  className,
  wrapperClassName,
  selectedValues: selectedProp,
  defaultSelectedValues = [],
  onSelectionChange,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onCommit,
  filter = "startsWithPerTerm",
  noTypeahead,
  noValidation,
  showSelectAll,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  valueState: valueStateProp = "none",
  valueStateMessage,
  arrowLabel = "Select Options",
  listLabel = "Available Options",
  selectAllText = defaultSelectAllText,
  alreadySelectedText = "This value is already selected.",
  invalidText,
  nMoreText,
  tokensCountText = defaultTokensCountText,
  portal = true,
  disabled,
  readOnly,
  placeholder,
  id,
  onKeyDown,
  onFocus,
  onBlur,
  onPaste,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  ...props
}: MultiComboBoxProps) {
  const entries = collectEntries(children)
  const items = entries.flatMap((entry) => isGroup(entry) ? entry.items : [entry])
  const [uncontrolledSelected, setUncontrolledSelected] = React.useState(defaultSelectedValues)
  const selectedValues = selectedProp ?? uncontrolledSelected
  const selectedSet = new Set(selectedValues)
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const value = valueProp ?? uncontrolledValue
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = (openProp ?? uncontrolledOpen) && !disabled
  const [typed, setTyped] = React.useState("")
  const [filtering, setFiltering] = React.useState(false)
  const [filterSelected, setFilterSelected] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const [invalid, setInvalid] = React.useState(false)
  const [alreadySelected, setAlreadySelected] = React.useState(false)
  const [iconPressed, setIconPressed] = React.useState(false)

  const fieldRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const tokenizer = React.useRef<TokenizerHandle>(null)
  const lastCommitted = React.useRef(value)
  const navIndex = React.useRef(-1)
  const pendingSelection = React.useRef<[number, number] | null>(null)
  const focusOnOpen = React.useRef<number | "select-all" | null>(null)
  const alreadyTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined)

  const autoId = React.useId()
  const baseId = id ?? autoId
  const listId = `${baseId}-list`
  const countId = `${baseId}-tokens-count`
  const messageId = `${baseId}-vsm`

  const selectedItems = items.filter((i) => selectedSet.has(i.key))
  const filtered = filtering ? items.filter((i) => filters[filter](typed, i.text)) : items
  const visible = filterSelected ? selectedItems : filtered
  const rowsFor = (shown: Item[]) => entries.flatMap((entry): Entry[] => {
    if (!isGroup(entry)) return shown.includes(entry) ? [entry] : []
    const groupItems = entry.items.filter((item) => shown.includes(item))
    return groupItems.length ? [...(entry.headerText ? [entry] : []), ...groupItems] : []
  })
  const visibleRows = rowsFor(visible)
  const allSelected = items.length > 0 && selectedItems.length === items.length

  const valueState: ValueState = alreadySelected || (invalid && !noValidation) ? "negative" : valueStateProp
  const hasState = valueState !== "none"
  const internalError = alreadySelected || (invalid && !noValidation && valueStateProp !== "negative")
  const message: React.ReactNode = alreadySelected
    ? alreadySelectedText
    : internalError
      ? (invalidText ?? valueStateDefaultText.negative)
      : valueStateMessage === undefined && valueState !== "none"
        ? valueStateDefaultText[valueState]
        : valueStateMessage
  const showMessage = hasState && message != null && !readOnly && !disabled
  const showHeader = open && showMessage && valueState !== "positive"

  React.useEffect(() => () => clearTimeout(alreadyTimer.current), [])

  const setValue = (v: string) => {
    if (valueProp === undefined) setUncontrolledValue(v)
    if (v !== value) onValueChange?.(v)
  }
  const setSelected = (next: string[]) => {
    const ordered = items.map((i) => i.key).filter((k) => next.includes(k))
    if (selectedProp === undefined) setUncontrolledSelected(ordered)
    onSelectionChange?.(ordered)
    // UI5 MultiComboBox.js/fireSelectionChange also emits for unchanged Shift ranges.
    fieldRef.current?.dispatchEvent(new Event("fiori-control-selection-change", { bubbles: true }))
  }
  const setOpen = (o: boolean) => {
    if (o === open) return
    if (openProp === undefined) setUncontrolledOpen(o)
    onOpenChange?.(o)
    if (!o) {
      setFilterSelected(false)
      setIconPressed(false)
    }
  }
  const commit = (v = value) => {
    if (v !== lastCommitted.current) {
      lastCommitted.current = v
      onCommit?.(v)
      // UI5 MultiComboBox.js/_inputChange emits change for committed input text;
      // another first control can give ToolbarItem that closing event type.
      fieldRef.current?.dispatchEvent(new Event("fiori-control-change", { bubbles: true }))
    }
  }

  React.useLayoutEffect(() => {
    const sel = pendingSelection.current
    if (sel && inputRef.current && document.activeElement === inputRef.current) inputRef.current.setSelectionRange(sel[0], sel[1])
    pendingSelection.current = null
  })

  const optionEls = () => [...(listRef.current?.querySelectorAll<HTMLElement>('[role="option"], [data-slot="multi-combobox-group-header"]') ?? [])]
  const focusOption = (index: number) => {
    const els = optionEls()
    const el = els[Math.max(0, Math.min(index, els.length - 1))]
    el?.focus()
    el?.scrollIntoView({ block: "nearest" })
  }
  const selectAllEl = () => contentRef.current?.querySelector<HTMLElement>("[data-slot=multi-combobox-select-all]")

  // Move focus into the list once it has rendered (keyboard opening).
  React.useEffect(() => {
    if (!open || focusOnOpen.current === null) return
    const target = focusOnOpen.current
    focusOnOpen.current = null
    requestAnimationFrame(() => (target === "select-all" ? selectAllEl()?.focus() : focusOption(target)))
  })

  const toggleItem = (key: string) => {
    setSelected(selectedSet.has(key) ? selectedValues.filter((k) => k !== key) : [...selectedValues, key])
    if (invalid) setInvalid(false)
  }

  /** F4 / Alt+arrows: toggle the list showing all items, focusing the matching / first selected / first item. */
  const toggleByKeyboard = (focusedTokenText?: string) => {
    if (readOnly) return
    if (open) return setOpen(false)
    setFiltering(false)
    setFilterSelected(false)
    const match = items.findIndex((i) => i.text.localeCompare(value, undefined, { sensitivity: "base" }) === 0)
    const fromToken = focusedTokenText !== undefined ? items.findIndex((i) => i.text === focusedTokenText) : -1
    const firstSelected = items.findIndex((i) => selectedSet.has(i.key))
    const itemIndex = fromToken >= 0 ? fromToken : match >= 0 ? match : firstSelected >= 0 ? firstSelected : 0
    focusOnOpen.current = rowsFor(items).indexOf(items[itemIndex])
    setOpen(true)
  }

  /** ↑/↓ while closed: put the next / previous unselected item's text in the field. */
  const navigateClosed = (forward: boolean) => {
    if (readOnly || !items.length) return
    let i = navIndex.current
    if (i > -1 && items[i]?.text !== value) i = -1
    if (forward) {
      for (let n = i + 1; n < items.length; n++)
        if (!selectedSet.has(items[n].key)) {
          i = n
          break
        }
      if (i === navIndex.current && items[i]?.text === value) return
    } else {
      const from = i === -1 ? items.length : i
      let found = -1
      for (let n = from - 1; n >= 0; n--)
        if (!selectedSet.has(items[n].key)) {
          found = n
          break
        }
      if (found === -1) return
      i = found
    }
    if (i < 0 || selectedSet.has(items[i].key)) return
    navIndex.current = i
    pendingSelection.current = [0, items[i].text.length]
    setValue(items[i].text)
  }

  const flagAlreadySelected = () => {
    clearTimeout(alreadyTimer.current)
    setAlreadySelected(true)
    alreadyTimer.current = setTimeout(() => {
      setAlreadySelected(false)
      inputRef.current?.focus()
    }, 2000)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || e.nativeEvent.isComposing) return
    const { key, altKey: alt, shiftKey: shift } = e
    const ctrl = e.ctrlKey || e.metaKey
    const input = e.currentTarget
    const isShow = (key === "F4" && !alt && !ctrl && !shift) || ((key === "ArrowDown" || key === "ArrowUp") && alt && !ctrl && !shift)
    if (isShow) {
      e.preventDefault()
      if (!disabled) toggleByKeyboard()
      return
    }
    if ((key === "ArrowDown" || key === "ArrowUp") && shift) return e.preventDefault()
    if (key === "ArrowDown" || key === "ArrowUp") {
      e.preventDefault()
      if (key === "ArrowDown" && open) {
        if (showSelectAll && !filterSelected) return selectAllEl()?.focus()
        if (typed && value !== typed) setValue(typed)
        return focusOption(0)
      }
      if (!open) navigateClosed(key === "ArrowDown")
      return
    }
    if (ctrl && key.toLowerCase() === "i" && selectedItems.length) {
      e.preventDefault()
      setFilterSelected(false)
      setOpen(!open)
      return
    }
    if (key === " " && shift) return e.preventDefault()
    const rtl = getComputedStyle(input).direction === "rtl"
    const noSelection = input.selectionStart === 0 && input.selectionEnd === 0
    if (key === (rtl ? "ArrowRight" : "ArrowLeft") && !ctrl && !shift && !alt && noSelection && selectedItems.length) {
      e.preventDefault()
      tokenizer.current?.focusLast()
      return
    }
    if (key === "Backspace" && input.value === "" && selectedItems.length) {
      e.preventDefault()
      tokenizer.current?.focusLast()
      return
    }
    if (key === "Home" && input.selectionStart === 0 && selectedItems.length && !shift) {
      e.preventDefault()
      tokenizer.current?.focusFirst()
      return
    }
    if (key === "PageUp" || key === "PageDown") return e.preventDefault()
    if (key === "Tab") return setOpen(false)
    if (key === "Enter") {
      const match = items.find((i) => i.text.toLowerCase() === value.toLowerCase())
      if (match) {
        if (selectedSet.has(match.key)) flagAlreadySelected()
        else {
          setSelected([...selectedValues, match.key])
          setInvalid(false)
          setValue("")
          setTyped("")
          setFiltering(false)
          lastCommitted.current = ""
        }
        setOpen(false)
      } else {
        commit()
      }
      return
    }
    if (key === "Escape") {
      // While open, Radix closes the list first (and marks the event handled); see onEscapeKeyDown below.
      escapeValue(input)
    }
  }

  const escapeValue = (input: HTMLInputElement) => {
    const autocompleted = (input.selectionEnd ?? 0) - (input.selectionStart ?? 0) > 0
    let v = value
    if (autocompleted) v = typed
    if (!noValidation || (!open && noValidation)) v = lastCommitted.current
    if (v !== value) {
      setValue(v)
      setTyped(v)
      setFiltering(!!v)
      if (!v) setInvalid(false)
    }
  }

  const handleListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const els = optionEls()
    const index = els.indexOf(e.target as HTMLElement)
    const onSelectAll = (e.target as HTMLElement).dataset.slot === "multi-combobox-select-all"
    const { key, altKey: alt, shiftKey: shift } = e
    const ctrl = e.ctrlKey || e.metaKey
    // UI5 Keys.js/isDownShift and isUpShift require Shift without Ctrl/Meta/Alt.
    // In grouped lists these modified arrows neither range-select nor toggle.
    if (shift && (ctrl || alt) && (key === "ArrowDown" || key === "ArrowUp") && entries.some(isGroup)) {
      e.preventDefault()
      return
    }
    if (key === "Tab") {
      inputRef.current?.focus()
      setOpen(false)
      return
    }
    if ((key === "F4" && !alt && !ctrl && !shift) || ((key === "ArrowDown" || key === "ArrowUp") && alt)) {
      e.preventDefault()
      setOpen(false)
      inputRef.current?.focus()
      return
    }
    if (onSelectAll) {
      if (key === "ArrowDown") {
        e.preventDefault()
        focusOption(0)
      } else if (key === "ArrowUp") {
        e.preventDefault()
        inputRef.current?.focus()
      } else if (key === " " || key === "Enter") {
        e.preventDefault()
        toggleAll()
      }
      return
    }
    if (index === -1) return
    const item = visibleRows[index]
    if (shift && (key === "ArrowDown" || key === "ArrowUp")) {
      // UI5 2.28 MultiComboBox.js/_handleItemRangeSelection indexes rendered
      // top-level list slots against all flattened entries. Preserve its successful
      // mappings and callbacks, but guard the missing source of grouped Shift+Down
      // and writes to MultiComboBoxItemGroup.js's getter-only `selected` property.
      e.preventDefault()
      if (readOnly) return
      const slots = entries.filter((entry) => isGroup(entry) ? entry.items.some((child) => visible.includes(child)) : visible.includes(entry))
      const all = entries.flatMap((entry) => isGroup(entry) ? [entry, ...entry.items] : [entry])
      const currentIndex = slots.indexOf(item)
      const source = all[currentIndex]
      const next = all[currentIndex + (key === "ArrowDown" ? 1 : -1)]
      let nextValues = selectedValues
      if (next) {
        if (!source || isGroup(next)) return
        const wanted = !isGroup(source) && selectedSet.has(source.key)
        nextValues = wanted ? [...selectedValues, next.key] : selectedValues.filter((k) => k !== next.key)
        // A filtered-out destination has no rendered focus target; UI5 leaves
        // focus where it is. Do not clamp its absent row index to the first row.
        const target = els[visibleRows.indexOf(next)]
        target?.focus()
        target?.scrollIntoView({ block: "nearest" })
      }
      setSelected(nextValues)
      return
    }
    if (ctrl && key.toLowerCase() === "a") {
      e.preventDefault()
      return toggleAll()
    }
    switch (key) {
      case "ArrowDown":
        e.preventDefault()
        return focusOption(index + 1)
      case "ArrowUp":
        e.preventDefault()
        if (index > 0) return focusOption(index - 1)
        if (showSelectAll && !filterSelected) return selectAllEl()?.focus()
        return inputRef.current?.focus()
      case "Home":
      case "End":
        e.preventDefault()
        return focusOption(key === "Home" ? 0 : els.length - 1)
      case "PageUp":
      case "PageDown":
        e.preventDefault()
        return focusOption(key === "PageUp" ? Math.max(index - SKIP_ITEMS, 0) : Math.min(index + SKIP_ITEMS, els.length - 1))
      case " ":
        e.preventDefault()
        if (readOnly || isGroup(item)) return
        toggleItem(item.key)
        if (!selectedSet.has(item.key) || selectedItems.length > 1 || !filterSelected) return
        return setFilterSelected(false)
      case "Enter":
        e.preventDefault()
        if (!isGroup(item)) return pressItem(item)
    }
  }

  /** Click on the row / Enter: toggle, close, clear the text (UI5 non-checkbox item press). */
  const pressItem = (item: Item) => {
    if (readOnly) return
    toggleItem(item.key)
    setOpen(false)
    setValue("")
    setTyped("")
    setFiltering(false)
    lastCommitted.current = ""
    inputRef.current?.focus()
  }

  const toggleAll = () => {
    if (readOnly) return
    if (filterSelected) {
      setSelected(allSelected ? [] : items.map((i) => i.key))
      if (allSelected) setFilterSelected(false)
      return
    }
    const keys = filtered.map((i) => i.key)
    const all = keys.every((k) => selectedSet.has(k))
    setSelected(all ? selectedValues.filter((k) => !keys.includes(k)) : [...new Set([...selectedValues, ...keys])])
  }

  const iconCount = readOnly ? 0 : 1

  const renderItem = (item: Item) => {
    const isSelected = selectedSet.has(item.key)
    return (
      <div
        key={item.key}
        role="option"
        aria-selected={isSelected}
        tabIndex={visibleRows.indexOf(item) === 0 ? 0 : -1}
        data-state={isSelected ? "checked" : undefined}
        className="fiori-list-item fiori-multi-combobox__item"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => pressItem(item)}
      >
        <Checkbox
          tabIndex={-1}
          aria-hidden
          checked={isSelected}
          disabled={readOnly}
          className="fiori-multi-combobox__checkbox"
          onClick={(e) => {
            // The check box toggles and keeps the list open (UI5 selectionComponentPressed).
            e.preventDefault()
            e.stopPropagation()
            if (readOnly) return
            toggleItem(item.key)
            ;(e.currentTarget.closest('[role="option"]') as HTMLElement | null)?.focus()
          }}
        />
        <span className="fiori-multi-combobox__item-text">{filtering && !filterSelected ? highlight(item.text, typed) : item.text}</span>
        {item.additionalText && <span className="fiori-multi-combobox__item-additional">{item.additionalText}</span>}
      </div>
    )
  }

  const listContent = (
    <PopoverPrimitive.Content
      ref={contentRef}
      data-slot="multi-combobox-popover"
      align="start"
      sideOffset={4}
      aria-label={listLabel}
      onOpenAutoFocus={(e) => e.preventDefault()}
      onCloseAutoFocus={(e) => e.preventDefault()}
      onEscapeKeyDown={() => {
        if (inputRef.current) escapeValue(inputRef.current)
        inputRef.current?.focus()
      }}
      onInteractOutside={(e) => {
        if (fieldRef.current?.contains(e.target as Node)) e.preventDefault()
      }}
      onFocusOutside={(e) => {
        if (fieldRef.current?.contains(e.target as Node)) e.preventDefault()
      }}
      className={cn(
        "fiori-popover fiori-multi-combobox__popover z-50 flex max-h-(--radix-popover-content-available-height) min-w-(--radix-popover-trigger-width) max-w-[40rem] flex-col",
        !visible.length && !showHeader && !showSelectAll && "hidden"
      )}
    >
      {showHeader && (
        <div data-value-state={valueState} className="fiori-value-state-message fiori-multi-combobox__header">
          <Icon icon={valueStateIcons[valueState]} />
          {message}
        </div>
      )}
      <div className="overflow-y-auto" onKeyDown={handleListKeyDown} onMouseDown={(e) => e.target === e.currentTarget && e.preventDefault()}>
        {showSelectAll && (
          <div
            data-slot="multi-combobox-select-all"
            tabIndex={0}
            className="fiori-multi-combobox__select-all"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleAll()}
          >
            <Checkbox
              tabIndex={-1}
              aria-hidden
              checked={allSelected}
              disabled={readOnly}
              text={selectAllText(selectedItems.length, items.length)}
              className="fiori-multi-combobox__select-all-checkbox"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleAll()
              }}
            />
          </div>
        )}
        <div
          ref={listRef}
          id={listId}
          data-slot="multi-combobox-list"
          role="listbox"
          aria-label={listLabel}
          aria-multiselectable
        >
          {entries.map((entry, index) => {
            if (!isGroup(entry)) return visible.includes(entry) ? renderItem(entry) : null
            const groupItems = entry.items.filter((item) => visible.includes(item))
            if (!groupItems.length) return null
            return (
              <div key={`group-${index}`} data-slot="multi-combobox-item-group" role="group">
                {entry.headerText && (
                  <div data-slot="multi-combobox-group-header" role="group" aria-label={entry.headerText}
                    tabIndex={visibleRows.indexOf(entry) === 0 ? 0 : -1} className="fiori-multi-combobox__group-header">
                    <span>{entry.headerText}</span>
                  </div>
                )}
                {groupItems.map((item) => renderItem(item))}
              </div>
            )
          })}
        </div>
      </div>
    </PopoverPrimitive.Content>
  )

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(o) => !o && setOpen(false)}>
      <PopoverPrimitive.Anchor asChild>
        <div
          ref={fieldRef}
          data-slot="multi-combobox"
          data-value-state={hasState ? valueState : undefined}
          data-disabled={disabled ? "" : undefined}
          data-readonly={readOnly ? "" : undefined}
          data-open={open ? "" : undefined}
          data-icons={iconCount ? "" : undefined}
          data-tokens={selectedItems.length ? "" : undefined}
          style={{ "--fiori-field-icons": iconCount } as React.CSSProperties}
          className={cn("fiori-field fiori-tokenized-field fiori-multi-combobox group/field my-(--fiori-input-margin-top-bottom)", wrapperClassName)}
          onBlur={(e) => {
            const to = e.relatedTarget as Node | null
            if (fieldRef.current?.contains(to) || contentRef.current?.contains(to)) return
            tokenizer.current?.deselectAll()
            setFocused(false)
          }}
        >
          <span id={countId} hidden>{tokensCountText(selectedItems.length)}</span>
          <Tokenizer
            handleRef={tokenizer}
            className="fiori-tokenized-field__tokenizer"
            readOnly={readOnly}
            disabled={disabled}
            expanded={focused || open}
            preventInitialFocus
            hidePopoverArrow
            popoverAnchor={fieldRef}
            nMoreText={nMoreText}
            aria-label={ariaLabel ? `${ariaLabel} tokens` : undefined}
            onShowAll={
              readOnly
                ? undefined
                : () => {
                    setFilterSelected(true)
                    setOpen(true)
                  }
            }
            onTokenDelete={(values) => {
              if (readOnly) return
              setSelected(selectedValues.filter((k) => !values.includes(k)))
            }}
            onFocusExhausted={() => inputRef.current?.focus()}
            onFocus={() => setFocused(true)}
            onKeyDown={(e) => {
              const els = [...e.currentTarget.querySelectorAll<HTMLElement>('[data-slot="token"]:not([data-overflows])')]
              const last = els[els.length - 1]
              const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
              if ((e.key === (rtl ? "ArrowLeft" : "ArrowRight") || e.key === "End") && !e.shiftKey && e.target === last) {
                e.preventDefault()
                setTimeout(() => inputRef.current?.focus())
              }
              if ((e.key === "F4" || (e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp"))) && !readOnly && !disabled) {
                e.preventDefault()
                toggleByKeyboard((e.target as HTMLElement).querySelector(".fiori-token__text")?.textContent ?? undefined)
              }
            }}
          >
            {selectedItems.map((i) => <Token key={i.key} value={i.key} text={i.text} />)}
          </Tokenizer>
          <input
            ref={inputRef}
            id={id}
            role="combobox"
            autoComplete="off"
            aria-label={ariaLabel}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-autocomplete="both"
            aria-controls={open ? listId : undefined}
            aria-invalid={valueState === "negative" || undefined}
            aria-describedby={cn(countId, showMessage && messageId, ariaDescribedBy) || undefined}
            disabled={disabled}
            readOnly={readOnly}
            value={value}
            placeholder={selectedItems.length ? undefined : placeholder}
            className={cn("fiori-field__input", className)}
            onChange={(e) => {
              const t = e.target.value
              const ne = e.nativeEvent as InputEvent
              const matches = items.filter((i) => filters[filter](t, i.text))
              setTyped(t)
              setFiltering(!!t)
              setFilterSelected(false)
              navIndex.current = -1
              setInvalid(!ne.isComposing && !matches.length && !!t)
              let next = t
              if (!noTypeahead && !ne.isComposing && t && matches.length && !NO_AUTOCOMPLETE.has(ne.inputType)) {
                const item = items.find((i) => !selectedSet.has(i.key) && i.text.toLowerCase().startsWith(t.toLowerCase()))
                if (item) {
                  next = item.text
                  pendingSelection.current = [t.length, item.text.length]
                }
              }
              setValue(next)
              setOpen(matches.length > 0 && !readOnly)
            }}
            onPaste={(e) => {
              onPaste?.(e)
              if (readOnly || e.defaultPrevented) return
              const parts = e.clipboardData.getData("text/plain").split(/\r\n|\r|\n|\t/g).filter(Boolean)
              const matching = items.filter((i) => !selectedSet.has(i.key) && parts.includes(i.text))
              if (matching.length > 1) {
                e.preventDefault()
                setSelected([...selectedValues, ...matching.map((i) => i.key)])
              }
            }}
            onKeyDown={handleInputKeyDown}
            onFocus={(e) => {
              setFocused(true)
              e.currentTarget.setSelectionRange(0, e.currentTarget.value.length)
              tokenizer.current?.deselectAll()
              onFocus?.(e)
            }}
            onBlur={(e) => {
              const to = e.relatedTarget as Node | null
              if (fieldRef.current?.contains(to) || contentRef.current?.contains(to)) return onBlur?.(e)
              if (!noValidation && value) {
                setValue("")
                setTyped("")
                setFiltering(false)
                lastCommitted.current = ""
              } else commit()
              setInvalid(false)
              setOpen(false)
              onBlur?.(e)
            }}
            {...props}
          />
          {!readOnly && (
            <span
              data-slot="multi-combobox-arrow"
              role="button"
              aria-label={arrowLabel}
              aria-hidden={disabled || undefined}
              data-pressed={open && iconPressed ? "" : undefined}
              className="fiori-field__icon fiori-tokenized-field__icon"
              onMouseDown={(e) => {
                e.preventDefault()
                setIconPressed(true)
                inputRef.current?.focus()
              }}
              onClick={() => {
                if (disabled) return
                setFiltering(false)
                setFilterSelected(false)
                setOpen(!open)
              }}
            >
              <Icon icon={slimArrowDown} />
            </span>
          )}
          {showMessage && (
            <div
              id={messageId}
              role="status"
              data-popover=""
              data-value-state={valueState}
              className="fiori-value-state-message absolute start-0 top-full z-50 mt-1 hidden max-w-[22rem] group-focus-within/field:block group-data-open/field:hidden"
            >
              <Icon icon={valueStateIcons[valueState]} />
              {message}
            </div>
          )}
        </div>
      </PopoverPrimitive.Anchor>
      {portal ? <PopoverPrimitive.Portal>{listContent}</PopoverPrimitive.Portal> : listContent}
    </PopoverPrimitive.Root>
  )
}

export { MultiComboBox, MultiComboBoxItem, MultiComboBoxItemGroup, type MultiComboBoxItemGroupProps, type MultiComboBoxFilter, type MultiComboBoxItemProps, type MultiComboBoxProps }
