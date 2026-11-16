import * as React from "react"
import { isF6NavigationKey } from "@/lib/fiori-f6"
import { Popover as PopoverPrimitive } from "radix-ui"

// UI5 2.28 MultiComboBoxPopoverTemplate.js renders an internal List (fastNavigation metadata).

// UI5 2.28 Popup.js/onEnterDOM: every rendered Popup surface bounds F6, modal or otherwise.

import { useIsPhone } from "@/lib/use-is-phone"
import { ResponsivePopover, ResponsivePopoverAnchor, ResponsivePopoverContent } from "@/components/ui/responsive-popover"
import { Button } from "@/components/ui/button"
import { ToggleButton } from "@/components/ui/toggle-button"
import { Input } from "@/components/ui/input"

import { multiselectAll, slimArrowDown } from "@/lib/fiori-icons"
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

/**
 * @accessibility Native aria-label, aria-labelledby and aria-describedby reach the input combobox. arrowLabel and listLabel name its picker controls; tokensCountText describes its selected tokens.
 * @accessibility F4 or Alt+Up/Down opens options; Space toggles an option, Enter toggles and closes, and Ctrl+A changes all options. Tokens use roving focus and deletion. selectAllText, alreadySelectedText, invalidText, nMoreText and phone dialog strings override component text.
 */
type MultiComboBoxProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "children" | "size"> & {
  /** <MultiComboBoxItem> and <MultiComboBoxItemGroup> elements (fragments and arrays are fine). */
  children?: React.ReactNode
  /** Controlled UI5 `selectedValues` (item `value`, else `text`); only caller-approved values become tokens after a phone commit. */
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
  dialogTitle?: string
  okText?: string
  cancelText?: string
  showSelectedLabel?: string
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
  dialogTitle = "All Items",
  okText = "OK",
  cancelText = "Cancel",
  showSelectedLabel = "Show Selected Items Only",
  disabled,
  readOnly,
  placeholder,
  id,
  onKeyDown,
  onClick,
  onFocus,
  onBlur,
  onPaste,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  ...props
}: MultiComboBoxProps) {
  const phone = useIsPhone()
  const Root = phone ? ResponsivePopover : PopoverPrimitive.Root
  const Anchor = phone ? ResponsivePopoverAnchor : PopoverPrimitive.Anchor
  const Content = phone ? ResponsivePopoverContent : PopoverPrimitive.Content
  const phoneInputRef = React.useRef<HTMLInputElement>(null)
  const [phoneInputValue, setPhoneInputValue] = React.useState("")
  const entries = collectEntries(children)
  const items = entries.flatMap((entry) => isGroup(entry) ? entry.items : [entry])
  const [uncontrolledSelected, setUncontrolledSelected] = React.useState(defaultSelectedValues)
  const committedValues = selectedProp ?? uncontrolledSelected
  const [phoneSelected, setPhoneSelected] = React.useState(committedValues)
  const previousCommittedValues = React.useRef(committedValues)
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = (openProp ?? uncontrolledOpen) && !disabled
  // MultiComboBox.js/_syncSelection (called by onBeforeRendering) makes
  // selectedValues authoritative for value-bearing items. The phone List may
  // stage checkbox edits, but collapsed tokens always use the caller's array.
  const selectedValues = phone && open && committedValues === previousCommittedValues.current ? phoneSelected : committedValues
  const latestPhoneSelected = React.useRef(selectedValues)
  latestPhoneSelected.current = selectedValues
  const phoneSnapshot = React.useRef({ selected: committedValues, value: valueProp ?? defaultValue })
  const selectedSet = new Set(selectedValues)
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const value = valueProp ?? uncontrolledValue
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
  const setSelected = (next: string[], immediate = false) => {
    const ordered = items.map((i) => i.key).filter((k) => next.includes(k))
    if (phone) {
      latestPhoneSelected.current = ordered
      setPhoneSelected(immediate && selectedProp !== undefined ? committedValues : ordered)
    }
    if (phone && open && !immediate) return
    if (selectedProp === undefined) setUncontrolledSelected(ordered)
    onSelectionChange?.(ordered)
    // UI5 MultiComboBox.js/fireSelectionChange also emits for unchanged Shift ranges.
    fieldRef.current?.dispatchEvent(new Event("fiori-control-selection-change", { bubbles: true }))
  }
  const setOpen = (o: boolean) => {
    if (o === open) return
    if (phone && o) { setPhoneSelected(committedValues); phoneSnapshot.current = { selected: [...committedValues], value } }
    if (phone && !o && selectedProp === undefined) setUncontrolledSelected(latestPhoneSelected.current)
    if (openProp === undefined) setUncontrolledOpen(o)
    onOpenChange?.(o)
    if (!o) {
      setFilterSelected(false)
      setIconPressed(false)
    }
  }
  React.useLayoutEffect(() => {
    if (previousCommittedValues.current !== committedValues) {
      previousCommittedValues.current = committedValues
      setPhoneSelected(committedValues)
    }
  })
  const previousPhoneOpen = React.useRef(false)
  React.useLayoutEffect(() => {
    // MultiComboBox.js/_beforeOpen also snapshots when the public open property
    // changes, rather than only when the field itself requests the dialog.
    if (phone && open && !previousPhoneOpen.current) {
      setPhoneSelected(committedValues)
      phoneSnapshot.current = { selected: [...committedValues], value }
    }
    previousPhoneOpen.current = phone && open
  }, [phone, open, committedValues, value])
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
    const input = phone && open ? phoneInputRef.current : inputRef.current
    if (sel && input && document.activeElement === input) input.setSelectionRange(sel[0], sel[1])
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

  const toggleItem = (key: string, immediate = false) => {
    setSelected(selectedSet.has(key) ? selectedValues.filter((k) => k !== key) : [...selectedValues, key], immediate)
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
    // MultiComboBox.js/_onkeydown only navigates plain/Ctrl-only arrows, never F6 aliases.
    if (e.defaultPrevented || e.nativeEvent.isComposing || isF6NavigationKey(e)) return
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
    // MultiComboBox.js/_onkeydown deliberately forwards raw e.key === "Tab"
    // to _handleTab, unlike its exact-predicate row/select-all handlers.
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
    // MultiComboBox.js/_onItemKeydown: exact isShow/isUpCtrl/isDownCtrl leave F6 aliases to the feature.
    if (isF6NavigationKey(e)) return
    const els = optionEls()
    const index = els.indexOf(e.target as HTMLElement)
    const onSelectAll = (e.target as HTMLElement).dataset.slot === "multi-combobox-select-all"
    const { key, altKey: alt, shiftKey: shift } = e
    const ctrl = e.ctrlKey || e.metaKey
    // Phone MultiComboBoxItem -> ComboBoxItem -> ListItemBase rejects all
    // modified Enter/Space keys; desktop's existing selection model is retained.
    if (phone && (key === " " || key === "Enter") && (alt || ctrl || shift)) return
    // MultiComboBox.js/_onItemKeydown uses Keys.js/isShow: extra modifiers
    // neither close the phone list nor fall through to range selection.
    if (phone && alt && (ctrl || shift) && (key === "ArrowDown" || key === "ArrowUp")) return
    // UI5 Keys.js/isDownShift and isUpShift require Shift without Ctrl/Meta/Alt.
    // In grouped lists these modified arrows neither range-select nor toggle.
    if (shift && (ctrl || alt) && (key === "ArrowDown" || key === "ArrowUp") && entries.some(isGroup)) {
      e.preventDefault()
      return
    }
    // MultiComboBox.js/_onItemKeydown and _onListHeaderKeydown both call
    // _onItemTab only for Keys.js/isTabNext/isTabPrevious (no Ctrl/Alt/Meta).
    if (key === "Tab" && !alt && !ctrl) {
      inputRef.current?.focus()
      setOpen(false)
      return
    }
    // Both native handlers prevent the remaining list/header keys before
    // navigation, so a modified Tab also keeps browser focus on this surface.
    if (key === "Tab") { e.preventDefault(); return }
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
        if (phone) return // ListItemBase.js/_onkeyup presses Space only on release
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
    toggleItem(item.key, true)
    setOpen(false)
    setValue("")
    setTyped("")
    setFiltering(false)
    lastCommitted.current = ""
    if (!phone) inputRef.current?.focus()
  }

  const toggleAll = () => {
    if (readOnly) return
    if (filterSelected) {
      setSelected(allSelected ? [] : items.map((i) => i.key), phone)
      if (allSelected) setFilterSelected(false)
      return
    }
    const keys = filtered.map((i) => i.key)
    const all = keys.every((k) => selectedSet.has(k))
    setSelected(all ? selectedValues.filter((k) => !keys.includes(k)) : [...new Set([...selectedValues, ...keys])], phone)
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
        onKeyUp={phone ? (event) => {
          if (event.target !== event.currentTarget || event.key !== " " || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || readOnly) return
          toggleItem(item.key)
          if (isSelected && selectedItems.length === 1 && filterSelected) setFilterSelected(false)
        } : undefined}
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

  // MultiComboBox.js/_beforeOpen, handleCancel, handleOK and
  // _listSelectionChange: checkbox edits stay provisional; row press commits.
  const cancelPhone = () => {
    setPhoneSelected(phoneSnapshot.current.selected)
    if (selectedProp === undefined) setUncontrolledSelected(phoneSnapshot.current.selected)
    setValue(phoneSnapshot.current.value)
    // MultiComboBox.js/handleCancel restores the owning value. Its next
    // onBeforeRendering filters the restored source when the field reopens;
    // the dialog-local Input independently retains its previous edit text.
    setTyped(phoneSnapshot.current.value)
    if (openProp === undefined) setUncontrolledOpen(false)
    onOpenChange?.(false)
    setFilterSelected(false)
    setInvalid(false)
  }
  const acceptPhone = () => {
    setSelected(selectedValues, true)
    if (!noValidation) setValue("")
    setOpen(false)
    setInvalid(false)
  }
  const phoneProps = phone ? {
    headerText: dialogTitle, phoneField: true, phoneOwnerRef: inputRef, phoneClassName: "fiori-multi-combobox-phone",
    phoneHeader: <div className="fiori-responsive-popover__rows">
      <div className="fiori-responsive-popover__row"><h1>{dialogTitle}</h1></div>
      <div className="fiori-responsive-popover__row fiori-responsive-popover__row--input">
        {/* MultiComboBoxPopoverTemplate.js omits Input.value. _beforeOpen writes
            only the raw _innerInput, so a first external-open render leaves the
            header blank while retaining the source value and Cancel snapshot.
            Preserve the phone Input's own edit state across dialog openings. */}
        <Input ref={phoneInputRef} aria-label={dialogTitle} placeholder={placeholder} value={phoneInputValue} valueState={valueState} valueStateMessage={null}
          onChange={(e) => { const text = e.target.value; setPhoneInputValue(text); setValue(text); setTyped(text); setFiltering(true); setFilterSelected(false); setInvalid(!items.some((i) => filters[filter](text, i.text))) }}
          onKeyDown={(e) => {
            // MultiComboBox.js/_onMobileInputKeydown handles plain Enter only.
            // The embedded phone Input does not forward arrows to this List.
            if (e.key === "Enter" && !e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
              const matching = items.find((i) => i.text === phoneInputValue)
              if (matching) {
                // MultiComboBox.js/_onMobileInputKeydown fires selection-change
                // before toggling the matching item, unlike row selection.
                e.preventDefault()
                setSelected(selectedValues, true)
                // _syncSelection resets this post-event toggle for controlled
                // item.value/selectedValues; the flag-only uncontrolled path
                // retains it without emitting a second selection-change.
                if (selectedProp === undefined) toggleItem(matching.key)
                setValue("")
                setOpen(false)
              }
            }
          }} />
        <ToggleButton variant="transparent" pressed={filterSelected} disabled={!selectedItems.length} aria-label={showSelectedLabel}
          onPressedChange={(pressed) => { setFilterSelected(pressed); setFiltering(false) }}><Icon icon={multiselectAll} /></ToggleButton>
      </div>
    </div>,
    phoneFooter: <><Button variant="emphasized" onClick={acceptPhone}>{okText}</Button><Button variant="transparent" onClick={cancelPhone}>{cancelText}</Button></>,
    onOpenAutoFocus: (e: Event) => { e.preventDefault(); contentRef.current?.focus() },
    onEscapeKeyDown: () => setOpen(false),
    // MultiComboBox.js/_afterClose closes the phone keyboard; pointer-opened
    // dialogs leave focus on the document rather than reopening the field.
    onCloseAutoFocus: (e: Event) => { e.preventDefault(); phoneInputRef.current?.blur() },
  } : {}
  const listContent = (
    <Content data-sap-ui-fastnavgroup-container="true"
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
      className={phone ? undefined : cn(
        "fiori-popover fiori-multi-combobox__popover z-50 flex max-h-(--radix-popover-content-available-height) min-w-(--radix-popover-trigger-width) max-w-[40rem] flex-col",
        !visible.length && !showHeader && !showSelectAll && "hidden"
      )}
      {...phoneProps}
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
          data-slot="multi-combobox-list" data-sap-ui-fastnavgroup="true"
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
    </Content>
  )

  return (
    <Root open={open} onOpenChange={(o) => !o && setOpen(false)}>
      <Anchor asChild>
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
            expanded={!phone && (focused || open)}
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
              // MultiComboBox.js/_onTokenizerKeydown uses exact isShow, excluding F6 aliases.
              if (isF6NavigationKey(e)) return
              const els = [...e.currentTarget.querySelectorAll<HTMLElement>('[data-slot="token"]:not([data-overflows])')]
              const last = els[els.length - 1]
              const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
              if ((e.key === (rtl ? "ArrowLeft" : "ArrowRight") || e.key === "End") && !e.shiftKey && e.target === last) {
                e.preventDefault()
                setTimeout(() => inputRef.current?.focus())
              }
              const isShow = (e.key === "F4" || (e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp")))
                && (!phone || (!e.ctrlKey && !e.metaKey && !e.shiftKey && (e.key !== "F4" || !e.altKey)))
              if (isShow && !readOnly && !disabled) {
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
            aria-haspopup={phone ? "dialog" : "listbox"}
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
              if (!phone) setOpen(matches.length > 0 && !readOnly)
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
            onClick={(e) => {
              onClick?.(e)
              if (!e.defaultPrevented && phone && !disabled && !readOnly) {
                // The native phone source blurs before _click opens the dialog.
                // Touch browsers can omit focus on click, so apply the same
                // inputFocusOut value contract explicitly at this boundary.
                if (noValidation) commit()
                else if (value) { setValue(""); lastCommitted.current = "" }
                setOpen(true)
              }
            }}
            onFocus={(e) => {
              setFocused(true)
              // MultiComboBox.js/inputFocusIn blurs the phone source field.
              // Its ordinary blur path clears validated text or commits free
              // text before a field-click opens the dialog.
              if (phone && !readOnly) e.currentTarget.blur()
              if (!phone) e.currentTarget.setSelectionRange(0, e.currentTarget.value.length)
              tokenizer.current?.deselectAll()
              onFocus?.(e)
            }}
            onBlur={(e) => {
              const to = e.relatedTarget as Node | null
              if ((phone && open) || fieldRef.current?.contains(to) || contentRef.current?.contains(to)) return onBlur?.(e)
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
              data-sap-ui-fastnavgroup-container="true"
              data-value-state={valueState}
              className="fiori-value-state-message absolute start-0 top-full z-50 mt-1 hidden max-w-[22rem] group-focus-within/field:block group-data-open/field:hidden"
            >
              <Icon icon={valueStateIcons[valueState]} />
              {message}
            </div>
          )}
        </div>
      </Anchor>
      {!phone && portal ? <PopoverPrimitive.Portal>{listContent}</PopoverPrimitive.Portal> : listContent}
    </Root>
  )
}

export { MultiComboBox, MultiComboBoxItem, MultiComboBoxItemGroup, type MultiComboBoxItemGroupProps, type MultiComboBoxFilter, type MultiComboBoxItemProps, type MultiComboBoxProps }
