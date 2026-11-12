import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

// UI5 2.28 ComboBoxPopoverTemplate.js renders an internal List (fastNavigation metadata).

// UI5 2.28 Popup.js/onEnterDOM: every rendered Popup surface bounds F6, modal or otherwise.

import { useIsPhone } from "@/lib/use-is-phone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ResponsivePopover, ResponsivePopoverAnchor, ResponsivePopoverContent } from "@/components/ui/responsive-popover"

import { slimArrowDown } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import { valueStateDefaultText, valueStateIcons, type ValueState } from "@/components/ui/input"

type ComboBoxFilter = "startsWithPerTerm" | "startsWith" | "contains" | "none"

type ComboBoxItemProps = {
  /** The text shown in the list and put into the field when the item is chosen. */
  text: string
  /** Secondary text, right-aligned in the list. */
  additionalText?: string
}

/** Declares one entry of a <ComboBox>. Rendered by the ComboBox, not by itself. */
function ComboBoxItem(_props: ComboBoxItemProps): React.ReactNode {
  return null
}

type ComboBoxItemGroupProps = {
  /** Text of the nonselectable group header. An empty string omits the header. */
  headerText: string
  /** <ComboBoxItem> elements (fragments and arrays are fine). */
  children?: React.ReactNode
}

/** Declares a group of items, rendered by the ComboBox. */
function ComboBoxItemGroup(_props: ComboBoxItemGroupProps): React.ReactNode {
  return null
}

type ComboBoxProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "children" | "size"> & {
  /** <ComboBoxItem> and <ComboBoxItemGroup> elements (fragments and arrays are fine). */
  children?: React.ReactNode
  /** The field's text. Free text: like UI5, it is not forced to match an item. */
  value?: string
  defaultValue?: string
  /** Fires on every change of the text (typing, autocomplete, keyboard navigation, selection). */
  onValueChange?: (value: string) => void
  /** Fires when the value is committed (Enter, blur, choosing an item), like UI5's `change`. */
  onCommit?: (value: string) => void
  /** Fires when the item matching the text changes (`null` when none matches). */
  onSelectionChange?: (item: ComboBoxItemProps | null) => void
  /** How the list is filtered while typing. Default "startsWithPerTerm" (any word starts with the text). */
  filter?: ComboBoxFilter
  /** Turns off inline autocomplete of the first matching item. */
  noTypeahead?: boolean
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
  /** Render the list in place instead of in a portal on document.body. */
  portal?: boolean
  wrapperClassName?: string
  /** Phone dialog title and action labels (UI5 ComboBoxPopoverTemplate). */
  dialogTitle?: string
  okText?: string
  cancelText?: string
}

const SKIP_ITEMS = 10
const NAV_KEYS = new Set(["ArrowDown", "ArrowUp", "PageUp", "PageDown", "Home", "End"])
const NO_AUTOCOMPLETE = new Set([
  "deleteWordBackward", "deleteWordForward", "deleteSoftLineBackward", "deleteSoftLineForward", "deleteEntireSoftLine",
  "deleteHardLineBackward", "deleteHardLineForward", "deleteByDrag", "deleteByCut", "deleteContent",
  "deleteContentBackward", "deleteContentForward", "historyUndo",
])

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const filters: Record<ComboBoxFilter, (value: string, text: string) => boolean> = {
  startsWithPerTerm: (v, t) => new RegExp(`(^|\\s)${escapeRegExp(v.toLowerCase())}`).test(t.toLowerCase()),
  startsWith: (v, t) => t.toLowerCase().startsWith(v.toLowerCase()),
  contains: (v, t) => t.toLowerCase().includes(v.toLowerCase()),
  none: () => true,
}

type Entry = ComboBoxItemProps | { headerText: string; items: ComboBoxItemProps[] }
const isGroup = (entry: Entry): entry is { headerText: string; items: ComboBoxItemProps[] } => "items" in entry

// UI5 ComboBox.js/_filterItems and _startsWithMatchingItems filter only children,
// while ComboBoxItemGroupTemplate.js retains groups with visible children.
// Native open navigation includes headers; closed navigation skips them (despite
// the B3 card saying to skip headers in every state). Headers never select items.
function collectEntries(children: React.ReactNode, out: Entry[] = []) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    if (child.type === ComboBoxItem) {
      out.push(child.props as ComboBoxItemProps)
    } else if (child.type === ComboBoxItemGroup) {
      const p = child.props as ComboBoxItemGroupProps
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

// Mirrors ui5-combobox (Horizon, desktop): type-ahead filtering with inline autocomplete,
// F4 / Alt+↓ / Alt+↑ toggle the list, ↑/↓/PageUp/PageDown/Home/End walk the items whether
// the list is open or closed, Enter commits, Escape closes the list or restores the value
// the field had when focused. DOM focus stays in the input; the list uses aria-activedescendant.
function ComboBox({
  children,
  className,
  wrapperClassName,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onCommit,
  onSelectionChange,
  filter = "startsWithPerTerm",
  noTypeahead,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  valueState = "none",
  valueStateMessage,
  arrowLabel = "Select Options",
  listLabel = "Available Options",
  portal = true,
  dialogTitle = "All Items",
  okText = "OK",
  cancelText = "Cancel",
  disabled,
  readOnly,
  id,
  onKeyDown,
  onClick,
  onKeyUp,
  onFocus,
  onBlur,
  ref,
  "aria-describedby": ariaDescribedBy,
  ...props
}: ComboBoxProps) {
  const phone = useIsPhone()
  const Root = phone ? ResponsivePopover : PopoverPrimitive.Root
  const Anchor = phone ? ResponsivePopoverAnchor : PopoverPrimitive.Anchor
  const Content = phone ? ResponsivePopoverContent : PopoverPrimitive.Content
  const phoneInputRef = React.useRef<HTMLInputElement>(null)
  const entries = collectEntries(children)
  const items = entries.flatMap((entry) => isGroup(entry) ? entry.items : [entry])
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const value = valueProp ?? uncontrolledValue
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = (openProp ?? uncontrolledOpen) && !disabled && !readOnly
  const [filterValue, setFilterValue] = React.useState("")
  /** Index (in the visible list) of the item that has virtual focus, -1 = the input has it. */
  const [active, setActive] = React.useState(-1)
  const [phoneFocused, setPhoneFocused] = React.useState(0)

  const inputRef = React.useRef<HTMLInputElement>(null)
  React.useImperativeHandle(ref, () => inputRef.current!, [])
  const listRef = React.useRef<HTMLDivElement>(null)
  const lastValue = React.useRef(value)
  const userTyped = React.useRef("")
  const pendingSelection = React.useRef<[number, number] | null>(null)

  const autoId = React.useId()
  const baseId = id ?? autoId
  const listId = `${baseId}-list`
  const optionId = (i: number) => `${baseId}-option-${i}`
  const messageId = `${baseId}-vsm`

  const visibleItems = open ? items.filter((i) => filters[filter](filterValue, i.text)) : items
  // UI5 ComboBox.js/_filterItems places matching groups before standalone items.
  const orderedEntries = open ? [...entries.filter(isGroup), ...entries.filter((entry) => !isGroup(entry))] : entries
  const rowsFor = (shown: ComboBoxItemProps[], opened = open) => (opened ? [...entries.filter(isGroup), ...entries.filter((entry) => !isGroup(entry))] : entries).flatMap((entry): Entry[] => {
    if (!isGroup(entry)) return shown.includes(entry) ? [entry] : []
    const groupItems = entry.items.filter((item) => shown.includes(item))
    return groupItems.length ? [...(entry.headerText ? [entry] : []), ...groupItems] : []
  })
  const visible = rowsFor(visibleItems)
  const selected = visible.findIndex((i) => !isGroup(i) && i.text.toLowerCase() === value.toLowerCase())

  const setValue = (v: string) => {
    if (valueProp === undefined) setUncontrolledValue(v)
    if (v !== value) onValueChange?.(v)
  }
  const setOpen = (o: boolean) => {
    if (o === open) return
    if (openProp === undefined) setUncontrolledOpen(o)
    onOpenChange?.(o)
    if (!o) {
      setFilterValue("")
      setActive(-1)
    }
  }
  const commit = (v = value) => {
    if (v !== lastValue.current) {
      lastValue.current = v
      onCommit?.(v)
      // UI5 ComboBox.js/_fireChangeEvent emits a committed change, not each input.
      inputRef.current?.dispatchEvent(new Event("fiori-control-change", { bubbles: true }))
    }
  }
  /** Put `text` in the field and select it from `from` to the end (UI5's atomic value + selection). */
  const applyText = (text: string, typed: string) => {
    const from = typed && text.toLowerCase().startsWith(typed.toLowerCase()) ? typed.length : 0
    pendingSelection.current = [from, text.length]
    setValue(text)
  }

  // Selection changes are reported for the item whose text matches the value.
  const selectedItem = items.find((i) => i.text.toLowerCase() === value.toLowerCase()) ?? null
  const prevSelected = React.useRef(selectedItem)
  React.useEffect(() => {
    if (prevSelected.current?.text !== selectedItem?.text) {
      prevSelected.current = selectedItem
      onSelectionChange?.(selectedItem)
      // UI5 ComboBox.js/_selectMatchingItem also emits selection-change during
      // interaction, which a ToolbarItem with a first MultiComboBox listens for.
      if (open || inputRef.current?.matches(":focus")) inputRef.current?.dispatchEvent(new Event("fiori-control-selection-change", { bubbles: true }))
    }
  })

  React.useLayoutEffect(() => {
    const sel = pendingSelection.current
    const input = phone && open ? phoneInputRef.current : inputRef.current
    if (sel && input && document.activeElement === input) input.setSelectionRange(sel[0], sel[1])
    pendingSelection.current = null
  })
  React.useEffect(() => {
    if (open && active >= 0) document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active])

  const navigate = (index: number, forward = true) => {
    let item = visible[index]
    if (!item) return
    // UI5 ComboBox.js/_handleItemNavigation: open header focus clears the text
    // and selection, returns before autocomplete/input, and leaves Enter open.
    if (isGroup(item)) {
      if (open) {
        setActive(index)
        pendingSelection.current = [0, 0]
        setValue("")
        return
      }
      item = visible[index + (forward ? 1 : -1)]
      if (!item || isGroup(item)) return
    }
    setActive(open ? index : -1)
    applyText(item.text, open ? userTyped.current : "")
  }

  const handleNavKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const inputFocused = active === -1
    if (inputFocused && (e.key === "Home" || e.key === "End") && value) return
    e.preventDefault()
    if (inputFocused && open && (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "PageDown")) return
    const candidates = [active, selected].filter((i) => i >= 0)
    const index = candidates.length ? Math.min(...candidates) : -1
    const last = visible.length - 1
    switch (e.key) {
      case "ArrowDown":
        if (visible.length && index === last && (!open || active === index)) return
        if (!open && index === -1) return navigate(visible.findIndex((item) => !isGroup(item)))
        return navigate(index === last ? index : index + 1)
      case "ArrowUp":
        if (!open && index === -1) return navigate(last)
        if (index === 0) return setActive(-1)
        return navigate(index - 1, false)
      case "PageUp":
        return navigate(Math.max(index - SKIP_ITEMS, 0))
      case "PageDown":
        return navigate(index + SKIP_ITEMS < visible.length ? index + SKIP_ITEMS : last)
      case "Home":
        return navigate(0)
      case "End":
        return navigate(last)
    }
  }

  const toggle = () => {
    if (open) return setOpen(false)
    setFilterValue("")
    userTyped.current = ""
    pendingSelection.current = [0, value.length]
    setOpen(true)
    if (phone) return
    const allRows = rowsFor(items, true)
    const sel = allRows.findIndex((i) => !isGroup(i) && i.text.toLowerCase() === value.toLowerCase())
    if (sel >= 0) setActive(sel)
    else if (!value && items.length) {
      // UI5 ComboBox.js/_resetFilter + _keydown select the first non-group
      // item after _filterItems has moved groups ahead of standalone items.
      const first = allRows.find((item): item is ComboBoxItemProps => !isGroup(item))
      if (first) {
        setActive(allRows.indexOf(first))
        applyText(first.text, "")
      }
    }
  }

  const choose = (index: number) => {
    const item = visible[index]
    if (!item || isGroup(item)) return
    pendingSelection.current = [item.text.length, item.text.length]
    setValue(item.text)
    // ComboBox.js/_selectItem reports selection-change before _fireChangeEvent.
    // Report synchronously on phones and mark it reported to avoid effect echo.
    if (phone && prevSelected.current?.text !== item.text) {
      prevSelected.current = item
      onSelectionChange?.(item)
      inputRef.current?.dispatchEvent(new Event("fiori-control-selection-change", { bubbles: true }))
    }
    commit(item.text)
    setOpen(false)
  }

  const hasState = valueState !== "none"
  const message = valueStateMessage === undefined && hasState ? valueStateDefaultText[valueState] : valueStateMessage
  const showMessage = hasState && message != null && !readOnly && !disabled
  const showHeader = open && showMessage && valueState !== "positive"

  const renderItem = (item: ComboBoxItemProps, i: number) => (
    <div
      key={`${item.text}-${i}`}
      id={optionId(i)}
      role="option"
      tabIndex={phone ? (i === phoneFocused || i === selected ? 0 : -1) : undefined}
      aria-selected={i === selected}
      data-state={i === selected ? "checked" : undefined}
      data-highlighted={i === active ? "" : undefined}
      className="fiori-list-item fiori-combobox__item"
      onClick={() => choose(i)}
      onFocus={phone ? () => setPhoneFocused(i) : undefined}
      onKeyDown={phone ? (event) => {
        // ComboBoxItem.js inherits ListItemBase's exact-key activation phases.
        if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
        if (event.key === " ") event.preventDefault()
        if (event.key === "Enter") { event.preventDefault(); choose(i) }
      } : undefined}
      onKeyUp={phone ? (event) => {
        if (event.target === event.currentTarget && event.key === " " && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) choose(i)
      } : undefined}
    >
      <span className="fiori-combobox__item-text">{highlight(item.text, filterValue)}</span>
      {item.additionalText && <span className="fiori-combobox__item-additional">{item.additionalText}</span>}
    </div>
  )

  // ComboBox.js/_handleMobileInput edits live; Cancel/Escape restore _lastValue,
  // OK commits, and selecting a row commits and closes immediately.
  const closePhone = (cancel = false) => {
    const next = cancel ? lastValue.current : value
    if (cancel) setValue(next)
    else commit(next)
    setOpen(false)
    phoneInputRef.current?.blur()
  }
  const phoneProps = phone ? {
    headerText: dialogTitle, phoneField: true, phoneOwnerRef: inputRef, preventFocusRestore: true,
    phoneClassName: "fiori-combobox-phone",
    phoneHeader: <div className="fiori-responsive-popover__rows">
      <div className="fiori-responsive-popover__row"><h1>{dialogTitle}</h1></div>
      <div className="fiori-responsive-popover__row fiori-responsive-popover__row--input">
        <Input ref={phoneInputRef} aria-label={dialogTitle} placeholder={props.placeholder} value={value} valueState={valueState} valueStateMessage={null}
          role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="both" aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          onChange={(e) => { setValue(e.target.value); setFilterValue(e.target.value); userTyped.current = e.target.value; setActive(-1) }}
          onKeyDown={(e) => {
            if (e.key === "Escape") { e.preventDefault(); closePhone(true) }
            // ComboBox.js/_handleMobileKeydown handles only Escape. Its phone
            // Input's Enter/change does not close or commit the owning dialog.
            // The embedded phone Input does not navigate the owning list from
            // its arrow keys (ComboBoxPopoverTemplate.js has no key forwarding).
          }} />
      </div>
    </div>,
    phoneFooter: <><Button variant="emphasized" onClick={() => closePhone()}>{okText}</Button><Button variant="transparent" onClick={() => closePhone(true)}>{cancelText}</Button></>,
    onOpenAutoFocus: (e: Event) => { e.preventDefault(); phoneInputRef.current?.focus() },
    onEscapeKeyDown: () => closePhone(true),
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => { if (e.key === "Tab" && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) closePhone() },
  } : {}
  const listContent = (
    <Content data-sap-ui-fastnavgroup-container="true"
      data-slot="combobox-popover"
      align="start"
      sideOffset={4}
      aria-label={listLabel}
      onOpenAutoFocus={(e) => e.preventDefault()}
      onCloseAutoFocus={(e) => e.preventDefault()}
      onInteractOutside={(e) => {
        if (inputRef.current?.parentElement?.contains(e.target as Node)) e.preventDefault()
      }}
      className={phone ? undefined : cn(
        "fiori-popover fiori-combobox__popover z-50 flex max-h-(--radix-popover-content-available-height) min-w-(--radix-popover-trigger-width) max-w-[40rem] flex-col",
        !visible.length && !showHeader && "hidden"
      )}
      {...phoneProps}
    >
      {showHeader && (
        <div data-value-state={valueState} className="fiori-value-state-message fiori-combobox__header">
          <Icon icon={valueStateIcons[valueState]} />
          {message}
        </div>
      )}
      {visible.length > 0 && (
        <div
          ref={listRef}
          id={listId}
          data-slot="combobox-list" data-sap-ui-fastnavgroup="true"
          role="listbox"
          aria-label={listLabel}
          className="overflow-y-auto"
          onMouseDown={(e) => e.preventDefault()}
          onKeyDown={phone ? (event) => {
            if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
            const rows = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="option"], [data-slot="combobox-group-header"]') ?? [])]
            const index = rows.indexOf(event.target as HTMLElement)
            if (index < 0) return
            // List.js/ItemNavigation uses actual row focus, a ten-item Page step,
            // and static boundaries. List Tab forwards around every row.
            if (event.key === "Tab" && event.shiftKey) {
              // List.js/onForwardBefore stops propagation after forwarding.
              // Otherwise Dialog's FocusScope sees the newly focused first
              // control and wraps the same Shift+Tab to its last footer button.
              event.preventDefault(); event.stopPropagation(); phoneInputRef.current?.focus(); return
            }
            if (event.shiftKey) return
            const next = event.key === "ArrowDown" ? Math.min(index + 1, rows.length - 1) : event.key === "ArrowUp" ? Math.max(index - 1, 0) : event.key === "Home" ? 0 : event.key === "End" ? rows.length - 1 : event.key === "PageDown" ? Math.min(index + SKIP_ITEMS, rows.length - 1) : event.key === "PageUp" ? Math.max(index - SKIP_ITEMS, 0) : -1
            if (next >= 0) { event.preventDefault(); rows[next]?.focus(); rows[next]?.scrollIntoView({ block: "nearest" }) }
          } : undefined}
        >
          {orderedEntries.map((entry, index) => {
            if (!isGroup(entry)) return visible.includes(entry) ? renderItem(entry, visible.indexOf(entry)) : null
            const groupItems = entry.items.filter((item) => visible.includes(item))
            if (!groupItems.length) return null
            return (
              <div key={`group-${index}`} data-slot="combobox-item-group" role="group">
                {entry.headerText && (
                  <div id={optionId(visible.indexOf(entry))} data-slot="combobox-group-header" role="group" aria-label={entry.headerText}
                    tabIndex={phone ? (visible.indexOf(entry) === phoneFocused ? 0 : -1) : undefined} onFocus={phone ? () => setPhoneFocused(visible.indexOf(entry)) : undefined}
                    data-highlighted={active === visible.indexOf(entry) ? "" : undefined} className="fiori-combobox__group-header">
                    <span>{entry.headerText}</span>
                  </div>
                )}
                {groupItems.map((item) => renderItem(item, visible.indexOf(item)))}
              </div>
            )
          })}
        </div>
      )}
    </Content>
  )

  return (
    <Root open={open} onOpenChange={(o) => !o && setOpen(false)}>
      <Anchor asChild>
        <div
          data-slot="combobox"
          data-value-state={hasState ? valueState : undefined}
          data-disabled={disabled ? "" : undefined}
          data-readonly={readOnly ? "" : undefined}
          data-open={open ? "" : undefined}
          data-icons={readOnly ? undefined : ""}
          style={{ "--fiori-field-icons": readOnly ? 0 : 1 } as React.CSSProperties}
          className={cn("fiori-field fiori-combobox group/field my-(--fiori-input-margin-top-bottom)", wrapperClassName)}
        >
          <input
            ref={inputRef}
            id={id}
            role="combobox"
            autoComplete="off"
            aria-autocomplete="both"
            aria-haspopup={phone ? "dialog" : "listbox"}
            aria-expanded={open}
            aria-controls={open ? listId : undefined}
            aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
            aria-invalid={valueState === "negative" || undefined}
            aria-describedby={cn(ariaDescribedBy, showMessage && messageId) || undefined}
            disabled={disabled}
            readOnly={readOnly}
            value={value}
            className={cn("fiori-field__input", className)}
            onChange={(e) => {
              const typed = e.target.value
              const inputType = (e.nativeEvent as InputEvent).inputType
              setFilterValue(typed)
              setActive(-1)
              let next = typed
              const matches = items.filter((i) => filters[filter](typed, i.text))
              const composing = (e.nativeEvent as InputEvent).isComposing
              if (!noTypeahead && !composing && typed && !NO_AUTOCOMPLETE.has(inputType)) {
                const starts = rowsFor(matches, true).filter((i): i is ComboBoxItemProps => !isGroup(i) && i.text.toLowerCase().startsWith(typed.toLowerCase()))
                const item = starts.find((i) => i.text.toLowerCase() === typed.toLowerCase()) ?? starts[0]
                if (item) {
                  next = item.text
                  pendingSelection.current = [typed.length, item.text.length]
                }
              }
              setValue(next)
              if (phone) return
              if (!matches.length || typed === "") setOpen(false)
              else setOpen(true)
            }}
            onKeyDown={(e) => {
              onKeyDown?.(e)
              if (e.defaultPrevented || e.nativeEvent.isComposing) return
              const { key, altKey: alt, ctrlKey: ctrl, shiftKey: shift, metaKey: meta } = e
              if (NAV_KEYS.has(key) && !alt && !ctrl && !shift && !meta && !readOnly) handleNavKey(e)
              if (key === "Enter") {
                commit()
                if (open && !(active >= 0 && isGroup(visible[active]))) {
                  pendingSelection.current = [value.length, value.length]
                  setOpen(false)
                }
              }
              if (key === "Escape") {
                // While open, Radix's dismissable layer closes the list first (and marks the event
                // handled, so we never get here); a second Escape restores the value from focus.
                if (open) {
                  e.preventDefault()
                  setOpen(false)
                } else if (value !== lastValue.current) {
                  e.preventDefault()
                  setValue(lastValue.current)
                }
              }
              if (key === "Tab" && open) setOpen(false)
              // ComboBox.js/_keydown uses Keys.isShow: Alt-only arrows exclude both Ctrl and Meta.
              const isShow = (key === "F4" && !alt && !ctrl && !shift && !meta) || ((key === "ArrowDown" || key === "ArrowUp") && alt && !ctrl && !shift && !meta)
              if (isShow && !readOnly && !disabled) {
                e.preventDefault()
                toggle()
              }
            }}
            onKeyUp={(e) => {
              onKeyUp?.(e)
              userTyped.current = e.currentTarget.value.slice(0, e.currentTarget.selectionStart ?? 0)
            }}
            onClick={(e) => { onClick?.(e); if (!e.defaultPrevented && phone && !disabled && !readOnly) { lastValue.current = value; setOpen(true) } }}
            onFocus={(e) => {
              lastValue.current = e.currentTarget.value
              if (!phone) e.currentTarget.setSelectionRange(0, e.currentTarget.value.length)
              onFocus?.(e)
            }}
            onBlur={(e) => {
              if ((phone && open) || listRef.current?.contains(e.relatedTarget as Node)) return
              commit()
              setOpen(false)
              onBlur?.(e)
            }}
            {...props}
          />
          {!readOnly && (
            <span
              data-slot="combobox-arrow"
              role="button"
              aria-label={arrowLabel}
              aria-hidden={disabled || undefined}
              data-pressed={open ? "" : undefined}
              className="fiori-field__icon fiori-combobox__arrow"
              onMouseDown={(e) => {
                e.preventDefault()
                inputRef.current?.focus()
              }}
              onClick={() => !disabled && toggle()}
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

export { ComboBox, ComboBoxItem, ComboBoxItemGroup, type ComboBoxItemGroupProps, type ComboBoxFilter, type ComboBoxItemProps, type ComboBoxProps }
