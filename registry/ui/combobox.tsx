import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

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

type ComboBoxProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "children" | "size"> & {
  /** <ComboBoxItem> elements (fragments and arrays are fine). */
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
  wrapperClassName?: string
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

function collectItems(children: React.ReactNode, out: ComboBoxItemProps[] = []) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    if (child.type === ComboBoxItem) out.push(child.props as ComboBoxItemProps)
    else if (child.type === React.Fragment) collectItems((child.props as { children?: React.ReactNode }).children, out)
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
  disabled,
  readOnly,
  id,
  onKeyDown,
  onKeyUp,
  onFocus,
  onBlur,
  "aria-describedby": ariaDescribedBy,
  ...props
}: ComboBoxProps) {
  const items = collectItems(children)
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const value = valueProp ?? uncontrolledValue
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = (openProp ?? uncontrolledOpen) && !disabled && !readOnly
  const [filterValue, setFilterValue] = React.useState("")
  /** Index (in the visible list) of the item that has virtual focus, -1 = the input has it. */
  const [active, setActive] = React.useState(-1)

  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const lastValue = React.useRef(value)
  const userTyped = React.useRef("")
  const pendingSelection = React.useRef<[number, number] | null>(null)

  const autoId = React.useId()
  const baseId = id ?? autoId
  const listId = `${baseId}-list`
  const optionId = (i: number) => `${baseId}-option-${i}`
  const messageId = `${baseId}-vsm`

  const visible = open ? items.filter((i) => filters[filter](filterValue, i.text)) : items
  const selected = visible.findIndex((i) => i.text.toLowerCase() === value.toLowerCase())

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
    }
  })

  React.useLayoutEffect(() => {
    const sel = pendingSelection.current
    if (sel && inputRef.current && document.activeElement === inputRef.current) inputRef.current.setSelectionRange(sel[0], sel[1])
    pendingSelection.current = null
  })
  React.useEffect(() => {
    if (open && active >= 0) document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active])

  const navigate = (index: number) => {
    const item = visible[index]
    if (!item) return
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
        if (!open && index === -1) return navigate(0)
        return navigate(index === last ? index : index + 1)
      case "ArrowUp":
        if (!open && index === -1) return navigate(last)
        if (index === 0) return setActive(-1)
        return navigate(index - 1)
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
    const sel = items.findIndex((i) => i.text.toLowerCase() === value.toLowerCase())
    if (sel >= 0) setActive(sel)
    else if (!value && items.length) {
      setActive(0)
      applyText(items[0].text, "")
    }
  }

  const choose = (index: number) => {
    const item = visible[index]
    if (!item) return
    pendingSelection.current = [item.text.length, item.text.length]
    setValue(item.text)
    commit(item.text)
    setOpen(false)
  }

  const hasState = valueState !== "none"
  const message = valueStateMessage === undefined && hasState ? valueStateDefaultText[valueState] : valueStateMessage
  const showMessage = hasState && message != null && !readOnly && !disabled
  const showHeader = open && showMessage && valueState !== "positive"

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(o) => !o && setOpen(false)}>
      <PopoverPrimitive.Anchor asChild>
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
            aria-haspopup="listbox"
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
                const starts = matches.filter((i) => i.text.toLowerCase().startsWith(typed.toLowerCase()))
                const item = starts.find((i) => i.text.toLowerCase() === typed.toLowerCase()) ?? starts[0]
                if (item) {
                  next = item.text
                  pendingSelection.current = [typed.length, item.text.length]
                }
              }
              setValue(next)
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
                if (open) {
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
              const isShow = (key === "F4" && !alt && !ctrl && !shift && !meta) || ((key === "ArrowDown" || key === "ArrowUp") && alt && !ctrl && !shift)
              if (isShow && !readOnly && !disabled) {
                e.preventDefault()
                toggle()
              }
            }}
            onKeyUp={(e) => {
              onKeyUp?.(e)
              userTyped.current = e.currentTarget.value.slice(0, e.currentTarget.selectionStart ?? 0)
            }}
            onFocus={(e) => {
              lastValue.current = e.currentTarget.value
              e.currentTarget.setSelectionRange(0, e.currentTarget.value.length)
              onFocus?.(e)
            }}
            onBlur={(e) => {
              if (listRef.current?.contains(e.relatedTarget as Node)) return
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
              data-value-state={valueState}
              className="fiori-value-state-message absolute start-0 top-full z-50 mt-1 hidden max-w-[22rem] group-focus-within/field:block group-data-open/field:hidden"
            >
              <Icon icon={valueStateIcons[valueState]} />
              {message}
            </div>
          )}
        </div>
      </PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          aria-label={listLabel}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (inputRef.current?.parentElement?.contains(e.target as Node)) e.preventDefault()
          }}
          className={cn(
            "fiori-popover fiori-combobox__popover z-50 flex max-h-(--radix-popover-content-available-height) min-w-(--radix-popover-trigger-width) max-w-[40rem] flex-col",
            !visible.length && !showHeader && "hidden"
          )}
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
              data-slot="combobox-list"
              role="listbox"
              aria-label={listLabel}
              className="overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()}
            >
              {visible.map((item, i) => (
                <div
                  key={`${item.text}-${i}`}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === selected}
                  data-state={i === selected ? "checked" : undefined}
                  data-highlighted={i === active ? "" : undefined}
                  className="fiori-list-item fiori-combobox__item"
                  onClick={() => choose(i)}
                >
                  <span className="fiori-combobox__item-text">{highlight(item.text, filterValue)}</span>
                  {item.additionalText && <span className="fiori-combobox__item-additional">{item.additionalText}</span>}
                </div>
              ))}
            </div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export { ComboBox, ComboBoxItem, type ComboBoxFilter, type ComboBoxItemProps, type ComboBoxProps }
