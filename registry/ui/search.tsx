import * as React from "react"

import { decline, search as searchIcon, type FioriIconData } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { BusyIndicator } from "@/components/ui/busy-indicator"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"

// Mirrors ui5-search / ui5-shellbar-search (Horizon): field with scope select, type-ahead, clear and
// search icons, and a suggestion popover (ui5-search-item, ui5-search-item-group).
// Keyboard (as UI5): typing opens the suggestions and completes the first match; ↓ moves into the
// list, ↑ from the first item returns to the field (restoring what was typed), Enter searches,
// Escape closes the list and restores the typed value. Focus leaving the field closes the list.
// Not ported: message area, illustration and "show more" item slots, phone full-screen dialog.

type SearchScope = { value: string; text: string }

type SearchTexts = {
  /** aria-label of the field (default "Search Field"). */
  field: string
  /** Tooltip of the search icon (default "Search"). */
  search: string
  /** Tooltip of the clear icon (default "Clear Search"). */
  clear: string
  /** Tooltip and name of the scope select (default "Select Scope"). */
  scope: string
  /** Name of the suggestions popover (default "Suggestions"). */
  suggestions: string
  /** Placeholder with scopes and no placeholder prop (default "Search in: {scope}"). */
  searchIn: (scope: string) => string
  /** Search button of a collapsed ShellBarSearch (default "Open Search"). */
  open: string
  /** Search icon of an expanded, empty ShellBarSearch (default "Collapse Search"). */
  collapse: string
  /** Tooltip of an item's delete button (default "Remove Suggestion"). */
  remove: string
}

const defaultTexts: SearchTexts = {
  field: "Search Field",
  search: "Search",
  clear: "Clear Search",
  scope: "Select Scope",
  suggestions: "Suggestions",
  searchIn: (s) => `Search in: ${s}`,
  open: "Open Search",
  collapse: "Collapse Search",
  remove: "Remove Suggestion",
}

/** Provided by ShellBar: drives ShellBarSearch's collapsed state, which the bar owns (show-search-field). */
const ShellBarSearchContext = React.createContext<{ expanded: boolean; toggle: () => void } | null>(null)

const SearchItemContext = React.createContext<{
  highlight: string
  matched: string | undefined
  removeText: string
  choose: (text: string, value: string | undefined) => void
  /** Keeps the field's value in step with the item the arrow keys are on. */
  preview: (text: string) => void
  onItemKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void
} | null>(null)

type SearchProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onInput" | "onChange"> & {
  value?: string
  defaultValue?: string
  /** Fired with what the user typed (not with type-ahead completions). */
  onValueChange?: (value: string) => void
  placeholder?: string
  showClearIcon?: boolean
  /** Turns off completing the first matching suggestion while typing. */
  noTypeahead?: boolean
  /** Busy indicator over the field. */
  fieldLoading?: boolean
  /** Busy indicator over the suggestions. */
  loading?: boolean
  scopes?: SearchScope[]
  scopeValue?: string
  onScopeChange?: (value: string) => void
  /** Suggestions list state (controlled). By default typing opens it. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Enter, the search icon or picking a suggestion. Call preventDefault to keep the list and value as they are. */
  onSearch?: (detail: { value: string; item?: string; preventDefault: () => void }) => void
  /** Footer content of the suggestion popover (ui5-search `action` slot). */
  action?: React.ReactNode
  /** Render the suggestions in place instead of in a portal on document.body. */
  portal?: boolean
  texts?: Partial<SearchTexts>
  inputProps?: Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "placeholder">
}

/** Text of every <SearchItem> among the children, looking through groups and fragments. */
function itemTexts(children: React.ReactNode): string[] {
  return React.Children.toArray(children).flatMap((c) => {
    if (!React.isValidElement<{ children?: React.ReactNode; text?: string }>(c)) return []
    if (c.type === SearchItem) return c.props.text ? [c.props.text] : []
    return itemTexts(c.props.children)
  })
}

function useSearchCore(props: SearchProps, collapsedApi?: { collapsed: boolean; collapse?: (focusButton: boolean) => void; afterIconPress?: (value: string) => void }) {
  const {
    value: valueProp,
    defaultValue = "",
    onValueChange,
    placeholder,
    showClearIcon,
    noTypeahead,
    fieldLoading,
    loading,
    scopes,
    scopeValue: scopeProp,
    onScopeChange,
    open: openProp,
    onOpenChange,
    onSearch,
    action,
    portal = true,
    texts: textsProp,
    inputProps,
    children,
    className,
    ...rootProps
  } = props
  const texts = { ...defaultTexts, ...textsProp }
  const inputRef = React.useRef<HTMLInputElement>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const popRef = React.useRef<HTMLDivElement>(null)
  const [shown, setShown] = React.useState(valueProp ?? defaultValue)
  const [typed, setTyped] = React.useState("")
  const [matched, setMatched] = React.useState<string | undefined>()
  const [focused, setFocused] = React.useState(false)
  const [openState, setOpenState] = React.useState(false)
  const [scopeState, setScopeState] = React.useState(scopes?.[0]?.value)
  const scopeValue = scopeProp ?? scopeState
  const open = openProp ?? openState
  const selectFrom = React.useRef<number | null>(null)
  const beforeArrows = React.useRef<string | undefined>(undefined)
  const texts_ = React.useMemo(() => itemTexts(children), [children])
  const hasContent = texts_.length > 0 || React.Children.count(children) > 0 || !!loading || !!action

  // The controlled value wins whenever it changes from outside.
  React.useEffect(() => {
    // (Unless it is what the user typed and the field shows its type-ahead completion.)
    if (valueProp === undefined || (matched === shown && shown.toLowerCase().startsWith(valueProp.toLowerCase()))) return
    setShown(valueProp)
    setTyped(valueProp)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueProp])

  // Type-ahead: the completed part stays selected, so the next keystroke replaces it.
  React.useLayoutEffect(() => {
    const from = selectFrom.current
    if (from !== null && inputRef.current) inputRef.current.setSelectionRange(from, inputRef.current.value.length)
    selectFrom.current = null
  })

  const setOpen = (o: boolean) => {
    if (o === open) return
    if (openProp === undefined) setOpenState(o)
    onOpenChange?.(o)
  }
  const closeAndReset = () => {
    setOpen(false)
    beforeArrows.current = undefined
  }
  const fire = (value: string, item?: string) => {
    let prevented = false
    onSearch?.({ value, item, preventDefault: () => (prevented = true) })
    return prevented
  }

  const onInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const v = input.value
    const inputType = (e.nativeEvent as InputEvent).inputType ?? ""
    setTyped(v)
    onValueChange?.(v)
    beforeArrows.current = undefined
    const match =
      !noTypeahead && !inputType.startsWith("delete") && !inputType.startsWith("history") && v
        ? texts_.find((t) => t.toLowerCase().startsWith(v.toLowerCase()))
        : undefined
    setMatched(match)
    if (match) {
      selectFrom.current = v.length
      setShown(match)
    } else {
      setShown(v)
    }
    setOpen(v.length > 0 && hasContent)
  }

  const iconPress = () => {
    const value = inputRef.current?.value ?? shown
    fire(value, matched)
    collapsedApi?.afterIconPress?.(value)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    inputProps?.onKeyDown?.(e)
    if (e.defaultPrevented) return
    if (e.key === "Enter") {
      e.preventDefault()
      const input = e.currentTarget
      if (!input.value && collapsedApi && !collapsedApi.collapsed) {
        // ShellBarSearch: Enter on an empty field collapses it.
        fire("")
        collapsedApi.collapse?.(true)
        return
      }
      if (fire(input.value, matched)) return
      input.setSelectionRange(input.value.length, input.value.length)
      closeAndReset()
    } else if (e.key === "ArrowDown" && open) {
      e.preventDefault()
      beforeArrows.current = typed || shown
      setShown(typed || shown)
      setMatched(undefined)
      popRef.current?.querySelector<HTMLElement>('[role="option"]')?.focus()
    } else if (e.key === "Escape") {
      if (open) {
        // Radix closes the list; only the value is restored here.
        const back = beforeArrows.current ?? (typed || shown)
        setShown(back)
        beforeArrows.current = undefined
        setMatched(undefined)
      } else if (collapsedApi && !collapsedApi.collapsed && !e.currentTarget.value) {
        // Not in UI5, whose Escape never collapses: an empty ShellBarSearch collapses, returning to its button.
        e.preventDefault()
        collapsedApi.collapse?.(true)
      }
    }
  }

  const backToInput = (value?: string) => {
    if (value !== undefined) setShown(value)
    inputRef.current?.focus()
  }

  const itemCtx = {
    highlight: typed,
    matched,
    removeText: texts.remove,
    preview: (text: string) => {
      if (beforeArrows.current !== undefined) setShown(text)
    },
    choose: (text: string, value: string | undefined) => {
      if (fire(text, value ?? text)) return
      setShown(text)
      setTyped(text)
      setMatched(undefined)
      closeAndReset()
      onValueChange?.(text)
      inputRef.current?.focus()
    },
    onItemKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      const list = [...(popRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])]
      const i = list.indexOf(e.currentTarget)
      if (e.key === "ArrowDown") {
        e.preventDefault()
        list[i + 1]?.focus()
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        if (i > 0) list[i - 1].focus()
        else {
          const back = beforeArrows.current
          beforeArrows.current = undefined
          backToInput(back)
        }
      } else if (e.key === "Escape") {
        const back = beforeArrows.current
        beforeArrows.current = undefined
        if (back !== undefined) setShown(back)
      } else if (e.key === "Tab") {
        e.preventDefault()
        closeAndReset()
        backToInput()
      }
    },
  }

  const effectivePlaceholder =
    placeholder ?? (scopes?.length && scopeValue ? texts.searchIn(scopes.find((s) => s.value === scopeValue)?.text ?? "") : undefined)

  const field = (
    <BusyIndicator active={fieldLoading} delay={0} className="fiori-search__busy">
      <div
        role="search"
        className="fiori-search__root"
        onBlur={(e) => {
          const to = e.relatedTarget as Node | null
          if (to && (rootRef.current?.contains(to) || popRef.current?.contains(to))) return
          closeAndReset()
        }}
      >
        <div className="fiori-search__content">
          {!!scopes?.length && (
            <>
              <Select
                value={scopeValue}
                onValueChange={(v) => {
                  if (scopeProp === undefined) setScopeState(v)
                  onScopeChange?.(v)
                }}
              >
                <SelectTrigger aria-label={texts.scope} title={texts.scope} wrapperClassName="fiori-search__scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scopes.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="fiori-search__separator" />
            </>
          )}
          <input
            {...inputProps}
            ref={inputRef}
            role="searchbox"
            aria-label={inputProps?.["aria-label"] ?? texts.field}
            aria-autocomplete="both"
            className="fiori-search__input"
            value={shown}
            placeholder={effectivePlaceholder}
            onChange={onInput}
            onKeyDown={onKeyDown}
            onFocus={(e) => {
              inputProps?.onFocus?.(e)
              setFocused(true)
            }}
            onBlur={(e) => {
              inputProps?.onBlur?.(e)
              setFocused(false)
            }}
          />
          {showClearIcon && !!shown && (
            <span
              role="button"
              tabIndex={-1}
              title={texts.clear}
              aria-label={texts.clear}
              className="fiori-search__icon"
              onClick={() => {
                setShown("")
                setTyped("")
                setMatched(undefined)
                beforeArrows.current = undefined
                onValueChange?.("")
                setOpen(false)
                inputRef.current?.focus()
              }}
            >
              <Icon icon={decline} />
            </span>
          )}
          <span
            role="button"
            tabIndex={-1}
            title={collapsedApi && !shown ? texts.collapse : texts.search}
            aria-label={collapsedApi && !shown ? texts.collapse : texts.search}
            className="fiori-search__icon"
            data-search-icon={shown && focused ? "" : undefined}
            onMouseDown={(e) => e.preventDefault()}
            onClick={iconPress}
          >
            <Icon icon={searchIcon} />
          </span>
        </div>
      </div>
    </BusyIndicator>
  )

  const popover = (
    <PopoverContent
      ref={popRef}
      portal={portal}
      hideArrow
      side="bottom"
      align="start"
      sideOffset={4}
      aria-label={texts.suggestions}
      className="fiori-search__popover"
      onOpenAutoFocus={(e) => e.preventDefault()}
      onCloseAutoFocus={(e) => e.preventDefault()}
      onEscapeKeyDown={() => {
        setOpen(false)
        if (popRef.current?.contains(document.activeElement)) inputRef.current?.focus()
      }}
      onInteractOutside={(e) => {
        if (rootRef.current?.contains(e.target as Node)) e.preventDefault()
      }}
    >
      <SearchItemContext.Provider value={itemCtx}>
        <div className="fiori-search__popover-content" data-loading={loading ? "" : undefined}>
          {React.Children.count(children) > 0 && (
            <ul role="listbox" aria-label={texts.suggestions} className="fiori-search__list">
              {children}
            </ul>
          )}
          {loading && (
            <div className="fiori-search__popover-busy">
              <BusyIndicator active delay={0} />
            </div>
          )}
        </div>
        {action && <div className="fiori-search__action">{action}</div>}
      </SearchItemContext.Provider>
    </PopoverContent>
  )

  return { rootRef, inputRef, rootProps, className, field, popover, open, setOpen, texts, fieldLoading, shown, iconPress, fire }
}

/** ui5-search: an always-expanded search field with suggestions. */
function Search(props: SearchProps) {
  const core = useSearchCore(props)
  return (
    <Popover open={core.open} onOpenChange={core.setOpen}>
      <PopoverAnchor asChild>
        <div ref={core.rootRef} data-slot="search" className={cn("fiori-search", core.className)} {...core.rootProps}>
          {core.field}
        </div>
      </PopoverAnchor>
      {core.popover}
    </Popover>
  )
}

type ShellBarSearchProps = SearchProps & {
  /** Standalone use only; inside a ShellBar the bar owns this state (`searchExpanded`). */
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

/** ui5-shellbar-search: collapses to a search button. Put it in ShellBar's `search` prop. */
function ShellBarSearch({ collapsed: collapsedProp, defaultCollapsed = false, onCollapsedChange, ...props }: ShellBarSearchProps) {
  const bar = React.useContext(ShellBarSearchContext)
  const [state, setState] = React.useState(defaultCollapsed)
  const collapsed = bar ? !bar.expanded : (collapsedProp ?? state)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const refocusButton = React.useRef(false)
  const wasCollapsed = React.useRef(collapsed)
  const toggle = () => {
    if (bar) bar.toggle()
    else {
      if (collapsedProp === undefined) setState(!collapsed)
      onCollapsedChange?.(!collapsed)
    }
  }
  const core = useSearchCore(props, {
    collapsed,
    collapse: (focusButton) => {
      refocusButton.current = focusButton
      if (!collapsed) toggle()
    },
    // The search icon collapses an expanded, empty field.
    afterIconPress: (value) => {
      if (!value && !collapsed) {
        refocusButton.current = true
        toggle()
      }
    },
  })
  React.useLayoutEffect(() => {
    if (collapsed) {
      core.setOpen(false)
      if (refocusButton.current) buttonRef.current?.focus()
    } else if (wasCollapsed.current) {
      core.inputRef.current?.focus()
    }
    refocusButton.current = false
    wasCollapsed.current = collapsed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed])
  if (collapsed) {
    return (
      <div data-slot="search" data-collapsed="" className={cn("fiori-search", core.className)} {...core.rootProps}>
        <Button
          ref={buttonRef}
          variant="transparent"
          size="icon"
          title={core.texts.open}
          aria-label={core.texts.open}
          aria-expanded={false}
          disabled={core.fieldLoading}
          className="fiori-search__button h-(--fiori-search-icon-size-default) w-9 min-w-(--fiori-search-icon-size-default) rounded-(--fiori-shellbar-button-border-radius) bg-(--fiori-x-search-elements-background) text-(--sapShell_InteractiveTextColor) hover:border-(--sapButton_Lite_Hover_BorderColor) hover:bg-(--sapShell_Hover_Background) hover:text-(--sapShell_InteractiveTextColor)"
          onClick={() => {
            core.fire(core.shown)
            toggle()
          }}
        >
          <Icon icon={searchIcon} />
        </Button>
      </div>
    )
  }
  return (
    <Popover open={core.open} onOpenChange={core.setOpen}>
      <PopoverAnchor asChild>
        <div ref={core.rootRef} data-slot="search" className={cn("fiori-search", core.className)} {...core.rootProps}>
          {core.field}
        </div>
      </PopoverAnchor>
      {core.popover}
    </Popover>
  )
}

/** The typed text is bolded wherever it occurs in the suggestion (UI5 generateHighlightedMarkup). */
function highlighted(text: string, needle: string) {
  if (!needle) return text
  const lower = text.toLowerCase()
  const n = needle.toLowerCase()
  const parts: React.ReactNode[] = []
  let from = 0
  for (let at = lower.indexOf(n); at !== -1; at = lower.indexOf(n, from)) {
    if (at > from) parts.push(text.slice(from, at))
    parts.push(<b key={at}>{text.slice(at, at + n.length)}</b>)
    from = at + n.length
  }
  parts.push(text.slice(from))
  return parts
}

type SearchItemProps = Omit<React.ComponentProps<"li">, "value" | "onSelect"> & {
  text: string
  description?: string
  icon?: FioriIconData
  /** Image / avatar shown instead of an icon. */
  image?: React.ReactNode
  /** Scope name, drawn as a tag before the text. */
  scopeName?: string
  /** Identifies the item in `onSearch` (default: its text). */
  value?: string
  /** Shows a remove button on hover and focus. */
  deletable?: boolean
  onDelete?: () => void
  /** Extra buttons at the end of the item. */
  actions?: React.ReactNode
}

/** ui5-search-item */
function SearchItem({ text, description, icon, image, scopeName, value, deletable, onDelete, actions, className, onFocus, onClick, onKeyDown, onKeyUp, ...props }: SearchItemProps) {
  const ctx = React.useContext(SearchItemContext)
  return (
    <li
      data-slot="search-item"
      role="option"
      tabIndex={-1}
      aria-selected={ctx?.matched === text}
      data-selected={ctx?.matched === text ? "" : undefined}
      data-description={description ? "" : undefined}
      className={cn("fiori-search-item", className)}
      onFocus={(e) => {
        onFocus?.(e)
        if (e.target === e.currentTarget) ctx?.preview(text)
      }}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented && !(e.target as HTMLElement).closest("button")) ctx?.choose(text, value)
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented || e.target !== e.currentTarget) return
        ctx?.onItemKeyDown(e)
        if (e.key === "Enter") {
          e.preventDefault()
          ctx?.choose(text, value)
        } else if (e.key === " ") {
          e.preventDefault()
        }
      }}
      onKeyUp={(e) => {
        onKeyUp?.(e)
        if (!e.defaultPrevented && e.target === e.currentTarget && e.key === " ") ctx?.choose(text, value)
      }}
      {...props}
    >
      <div className="fiori-search-item__begin">
        {!icon && image}
        {icon && <Icon icon={icon} className="fiori-search-item__icon" />}
        {scopeName && (
          <Tag design="set2" colorScheme={10}>
            {scopeName}
          </Tag>
        )}
        <div className="fiori-search-item__titles">
          <span className="fiori-search-item__text">{highlighted(text, ctx?.highlight ?? "")}</span>
          {description && <span className="fiori-search-item__description">{description}</span>}
        </div>
        <div className="fiori-search-item__actions">
          {actions}
          {deletable && (
            <Button
              variant="transparent"
              size="icon"
              tabIndex={-1}
              title={ctx?.removeText ?? defaultTexts.remove}
              aria-label={ctx?.removeText ?? defaultTexts.remove}
              className="fiori-search-item__delete"
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.()
              }}
            >
              <Icon icon={decline} />
            </Button>
          )}
        </div>
      </div>
    </li>
  )
}

type SearchItemGroupProps = React.ComponentProps<"li"> & { headerText: string }

/** ui5-search-item-group: a header followed by its items. */
function SearchItemGroup({ headerText, className, children, ...props }: SearchItemGroupProps) {
  const id = React.useId()
  return (
    <li data-slot="search-item-group" role="group" aria-labelledby={id} className={cn("fiori-search-group", className)} {...props}>
      <div id={id} role="presentation" className="fiori-search-group__header">
        {headerText}
      </div>
      <ul role="none" className="fiori-search__list">
        {children}
      </ul>
    </li>
  )
}

export {
  Search,
  SearchItem,
  SearchItemGroup,
  ShellBarSearch,
  ShellBarSearchContext,
  type SearchProps,
  type SearchItemProps,
  type SearchItemGroupProps,
  type SearchScope,
  type SearchTexts,
  type ShellBarSearchProps,
}
