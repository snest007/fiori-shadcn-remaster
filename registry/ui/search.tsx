import * as React from "react"
import { isF6NavigationKey } from "@/lib/fiori-f6"

// UI5 2.28 SearchPopoverTemplate.js renders an internal List (fastNavigation metadata).

import { decline, slimArrowDown, search as searchIcon, type FioriIconData } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { BusyIndicator } from "@/components/ui/busy-indicator"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { useIsPhone } from "@/lib/use-is-phone"
import { Input, InputIcon } from "@/components/ui/input"
import { List, ListItem } from "@/components/ui/list"
import { ResponsivePopover as Popover, ResponsivePopoverAnchor as PopoverAnchor, ResponsivePopoverContent as PopoverContent } from "@/components/ui/responsive-popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"

// Mirrors ui5-search / ui5-shellbar-search (Horizon): field with scope select, type-ahead, clear and
// search icons, and a suggestion popover (ui5-search-item, ui5-search-item-group).
// Keyboard (as UI5): typing opens the suggestions and completes the first match; ↓ moves into the
// list, ↑ from the first item returns to the field (restoring what was typed), Enter searches,
// Escape closes the list and restores the typed value. Focus leaving the field closes the list.
// Not ported: message area, illustration and "show more" item slots, phone message-area/illustration slots.

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
  /** Phone dialog cancellation. */
  cancel?: string
  /** Phone scope dialog close button. */
  scopeClose?: string
}

const defaultTexts: Required<SearchTexts> = {
  field: "Search Field",
  search: "Search",
  clear: "Clear Search",
  scope: "Select Scope",
  suggestions: "Suggestions",
  searchIn: (s) => `Search in: ${s}`,
  open: "Open Search",
  collapse: "Collapse Search",
  remove: "Remove Suggestion",
  cancel: "Cancel",
  scopeClose: "Decline",
}

// Popup.js/blockPageScrolling uses a Set so the final popup releases the html lock.
// Ordinary phone Search allows programmatic outer-input focus, so it cannot use
// Radix's strict modal FocusScope/RemoveScroll pair for this source behavior.
const phoneSearchScrollLocks = new Set<symbol>()
let phoneSearchOriginalOverflow = ""

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
  phone: boolean
  phoneTabStop?: string
  focusItem: (text: string) => void
} | null>(null)

type SearchProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onInput" | "onChange"> & {
  value?: string
  defaultValue?: string
  /** Fired with what the user typed (not with type-ahead completions). */
  onValueChange?: (value: string) => void
  placeholder?: string
  /** Names the field and its search landmark. Set it when a page has several searches. */
  accessibleName?: string
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
    accessibleName,
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
  const phone = useIsPhone()
  const mobileRef = React.useRef<HTMLInputElement>(null)
  const beforeOpen = React.useRef(valueProp ?? defaultValue)
  const escapedPhoneDialog = React.useRef(false)
  const texts = { ...defaultTexts, ...textsProp }
  const inputRef = React.useRef<HTMLInputElement>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const popRef = React.useRef<HTMLDivElement>(null)
  const [shown, setShown] = React.useState(valueProp ?? defaultValue)
  const [typed, setTyped] = React.useState("")
  const [matched, setMatched] = React.useState<string | undefined>()
  const [focused, setFocused] = React.useState(false)
  const [openState, setOpenState] = React.useState(false)
  const [scopeOpen, setScopeOpen] = React.useState(false)
  const [phoneItem, setPhoneItem] = React.useState<string>()
  const phoneBefore = React.useRef<HTMLDivElement>(null)
  const phoneAfter = React.useRef<HTMLDivElement>(null)
  const forwardingPhoneTab = React.useRef(false)
  // SearchFieldScopePopoverTemplate.js compares each option against scopeValue;
  // its phone list has no initial selection unless the caller supplies one.
  const [scopeState, setScopeState] = React.useState(phone ? undefined : scopes?.[0]?.value)
  const scopeValue = scopeProp ?? scopeState
  const open = openProp ?? openState
  const selectFrom = React.useRef<number | null>(null)
  const beforeArrows = React.useRef<string | undefined>(undefined)
  const texts_ = React.useMemo(() => itemTexts(children), [children])
  const hasContent = texts_.length > 0 || React.Children.count(children) > 0 || !!loading || !!action
  React.useEffect(() => {
    if (!phone || collapsedApi || !open) return
    const lock = Symbol()
    if (!phoneSearchScrollLocks.size) {
      phoneSearchOriginalOverflow = document.documentElement.style.overflow
      document.documentElement.style.overflow = "hidden"
    }
    phoneSearchScrollLocks.add(lock)
    return () => {
      phoneSearchScrollLocks.delete(lock)
      if (!phoneSearchScrollLocks.size) document.documentElement.style.overflow = phoneSearchOriginalOverflow
    }
  }, [phone, !!collapsedApi, open])

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
    if (o) beforeOpen.current = shown
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
    if (!phone) setOpen(v.length > 0 && hasContent)
  }

  const iconPress = () => {
    if (phone && !open) { setOpen(true); return }
    const value = inputRef.current?.value ?? shown
    fire(value, matched)
    if (phone) closeAndReset()
    else collapsedApi?.afterIconPress?.(value)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    inputProps?.onKeyDown?.(e)
    // Search.js/_onkeydown uses Keys.isDown; F6 aliases must reach document before focus changes.
    if (e.defaultPrevented || isF6NavigationKey(e)) return
    // SearchField.js/_onkeydown and Search.js/_handleDown use exact Keys predicates.
    if (phone && ["Enter", "ArrowDown", "ArrowUp", "Escape"].includes(e.key) && (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) return
    // Search.js/_onFocusOutSearch: Tab from the outer phone field reaches the
    // popup's shadow boundary (outside its light DOM) and closes ordinary Search.
    if (phone && !collapsedApi && open && e.key === "Tab" && !e.altKey && !e.ctrlKey && !e.metaKey && (!e.shiftKey || !scopes?.length)) { closeAndReset(); return }
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
      restoreTyped()
      // Not in UI5, whose Escape never collapses: an empty ShellBarSearch collapses, returning to its button.
      if (collapsedApi && !collapsedApi.collapsed && !e.currentTarget.value) {
        e.preventDefault()
        collapsedApi.collapse?.(true)
      }
    }
  }

  // Called from Radix's document-level Escape too: it closes the list before React sees the keydown.
  const restoreTyped = () => {
    setShown(beforeArrows.current ?? (typed || shown))
    beforeArrows.current = undefined
    setMatched(undefined)
  }

  const backToInput = (value?: string) => {
    if (value !== undefined) setShown(value)
    inputRef.current?.focus()
  }

  const itemCtx = {
    phone,
    phoneTabStop: matched ?? phoneItem ?? texts_[0],
    focusItem: (text: string) => { if (phone) setPhoneItem(text) },
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
      // Search.js/_onListItemKeyDown uses exact isUp/isDown modifier guards.
      if (isF6NavigationKey(e)) return
      if (phone && (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey && e.key !== "Tab")) { e.preventDefault(); return }
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
      } else if (e.key === "Tab") {
        e.preventDefault()
        if (phone) {
          // ListItemBase.js/_handleTabNext/_handleTabPrevious forwards to List's
          // focus area; Search.js/_onItemKeydown then cancels browser Tab.
          // Stop here so Radix's bubbling FocusScope does not reinterpret the
          // newly focused last area as a request to loop back to the header.
          e.stopPropagation()
          forwardingPhoneTab.current = true
          ;(e.shiftKey ? phoneBefore.current : phoneAfter.current)?.focus()
          if (!e.shiftKey) popRef.current?.querySelector<HTMLElement>('.fiori-search__action button')?.focus()
          return
        }
        closeAndReset()
        backToInput()
      }
    },
  }

  const effectivePlaceholder =
    placeholder ?? (scopes?.length && scopeValue ? texts.searchIn(scopes.find((s) => s.value === scopeValue)?.text ?? "") : undefined)

  const focusPhoneItem = () => {
    const rows = [...(popRef.current?.querySelectorAll<HTMLElement>('[data-slot="search-item"]') ?? [])]
    ;(rows.find((row) => row.dataset.searchText === (matched ?? phoneItem)) ?? rows[0])?.focus()
  }
  const phoneFocusArea = (side: "before" | "after") => <div ref={side === "before" ? phoneBefore : phoneAfter} role="none" tabIndex={0} data-slot={`search-list-${side}`} className="fiori-list__focusarea"
    onFocus={() => {
      if (forwardingPhoneTab.current) { forwardingPhoneTab.current = false; return }
      focusPhoneItem()
    }}
    // Search.js/_onItemKeydown also receives focus-area key events and prevents
    // every Tab even when no footer action exists; the area remains focused.
    onKeyDown={(event) => { if (event.key === "Tab") { event.preventDefault(); event.stopPropagation() } }} />

  const field = (
    <BusyIndicator active={fieldLoading} delay={0} className="fiori-search__busy">
      <div
        role="search"
        aria-label={accessibleName}
        className="fiori-search__root"
        onBlur={(e) => {
          const to = e.relatedTarget as Node | null
          if (to && (rootRef.current?.contains(to) || popRef.current?.contains(to))) return
          if (!phone || !collapsedApi) closeAndReset()
        }}
      >
        <div className="fiori-search__content">
          {!!scopes?.length && (
            <>
              {phone ? <Popover open={scopeOpen} onOpenChange={setScopeOpen}><PopoverAnchor asChild><Button variant="transparent" aria-label={scopeValue ? `${texts.scope}, ${scopes.find((scope) => scope.value === scopeValue)?.text ?? ""}` : texts.scope} title={scopeValue ? `${texts.scope}, ${scopes.find((scope) => scope.value === scopeValue)?.text ?? ""}` : texts.scope} aria-haspopup="dialog" aria-expanded={scopeOpen} className="fiori-search-phone__scope-button" onClick={() => setScopeOpen(true)}><Icon icon={slimArrowDown} /></Button></PopoverAnchor>
                {/* SearchFieldScopePopoverTemplate.js leaves List.selectionMode=None
                    while each item's selected property tracks scopeValue. */}
                <PopoverContent phoneField headerText="" closeLabel={texts.scopeClose} aria-label={texts.scope} phoneClassName="fiori-search-phone-scope"><List className="fiori-search-phone__scope-list" selectionMode="none" separators="none" value={scopeValue ? [scopeValue] : []} onItemClick={(value) => { if (scopeProp === undefined) setScopeState(value); onScopeChange?.(value); setScopeOpen(false) }}>{scopes.map((scope) => <ListItem key={scope.value} value={scope.value}>{scope.text}</ListItem>)}</List></PopoverContent>
              </Popover> : <Select
                value={scopeValue}
                onValueChange={(v) => {
                  if (scopeProp === undefined) setScopeState(v)
                  onScopeChange?.(v)
                }}
              >
                <SelectTrigger
                  aria-label={texts.scope}
                  title={texts.scope}
                  wrapperClassName="fiori-search__scope"
                  className="min-w-[calc(var(--fiori-input-min-width)+var(--fiori-input-icon-width))]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scopes.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>}
              <div className="fiori-search__separator" />
            </>
          )}
          <input
            {...inputProps}
            ref={inputRef}
            role="searchbox"
            aria-label={inputProps?.["aria-label"] ?? accessibleName ?? texts.field}
            aria-autocomplete="both"
            className="fiori-search__input"
            value={shown}
            placeholder={effectivePlaceholder}
            onChange={onInput}
            onClick={phone ? () => setOpen(true) : undefined}
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
      aria-modal={phone ? true : undefined}
      onKeyDownCapture={phone ? (event) => {
        // PopupTemplate.js's first boundary calls forwardToLast; List's last
        // focus area immediately forwards back to its selected/previous item.
        if (event.target === (collapsedApi ? inputRef.current : mobileRef.current) && (!collapsedApi || !scopes?.length) && event.key === "Tab" && event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) { event.preventDefault(); focusPhoneItem() }
      } : undefined}
      className={phone ? "fiori-search-phone" : "fiori-search__popover"}
      phoneField preventFocusRestore headerText={accessibleName ?? texts.field}
      phoneHeader={<div className="fiori-search-phone__header">{collapsedApi ? <div data-slot="search" className="fiori-search fiori-search-phone__shell-field">{field}</div> : <Input ref={mobileRef} aria-label={accessibleName ?? texts.field} value={shown} onChange={onInput} icon={showClearIcon && shown ? <InputIcon role="button" aria-label={texts.clear} title={texts.clear} onClick={() => { setShown(""); setTyped(""); setMatched(undefined); onValueChange?.(""); mobileRef.current?.focus() }}><Icon icon={decline} /></InputIcon> : undefined} wrapperClassName="fiori-search-phone__input" enterKeyHint="search"
        onKeyDown={(event) => { if (event.key === "Enter" && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) { event.preventDefault(); if (!fire(event.currentTarget.value, matched)) { closeAndReset(); inputRef.current?.blur() } } }} />}
        <Button variant="transparent" onClick={() => { /* Search.js/_handleCancel restores exactly the pre-open value. */ setShown(beforeOpen.current); setTyped(beforeOpen.current); setMatched(undefined); onValueChange?.(beforeOpen.current); closeAndReset() }}>{texts.cancel}</Button></div>}
      onOpenAutoFocus={(e) => { e.preventDefault(); if (phone) requestAnimationFrame(() => (collapsedApi ? inputRef.current : mobileRef.current)?.focus()) }}
      onCloseAutoFocus={(e) => {
        e.preventDefault()
        if (!phone || !escapedPhoneDialog.current) return
        escapedPhoneDialog.current = false
        if (collapsedApi) rootRef.current?.querySelector<HTMLButtonElement>("button")?.focus()
        else inputRef.current?.focus()
      }}
      onEscapeKeyDown={(event) => {
        if (phone) {
          // Search.js/_handleBeforeClose focuses the host on a genuine Escape;
          // Dialog uses Keys.isEscape, so modified aliases leave it open.
          if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) event.preventDefault()
          else escapedPhoneDialog.current = true
          return
        }
        restoreTyped()
        if (popRef.current?.contains(document.activeElement)) inputRef.current?.focus()
      }}
      onInteractOutside={(e) => {
        if (rootRef.current?.contains(e.target as Node)) e.preventDefault()
      }}
    >
      <SearchItemContext.Provider value={itemCtx}>
        <div className="fiori-search__popover-content" data-loading={loading ? "" : undefined}>
          {React.Children.count(children) > 0 && (
            <>{phone && phoneFocusArea("before")}<ul role="listbox" aria-label={texts.suggestions} className="fiori-search__list" data-sap-ui-fastnavgroup="true">
              {children}
            </ul>{phone && phoneFocusArea("after")}</>
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

  return { phone, rootRef, inputRef, rootProps, className, field, popover, open, setOpen, texts, fieldLoading, shown, iconPress, fire }
}

/** ui5-search: an always-expanded search field with suggestions. */
function Search(props: SearchProps) {
  const core = useSearchCore(props)
  return (
    // PopupTemplate.js traps Tab at boundary markers, while Search.js can focus
    // its outer input programmatically. Radix's strict modal FocusScope would
    // undo that native ArrowUp target; the full-screen surface retains aria-modal.
    <Popover modal={core.phone ? false : undefined} open={core.open} onOpenChange={core.setOpen}>
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
  // Only the user's own expand moves focus: the bar also expands the field by itself when it gets wider.
  const focusInput = React.useRef(false)
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
    } else if (focusInput.current) {
      core.inputRef.current?.focus()
    }
    refocusButton.current = false
    focusInput.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed])
  if (collapsed || core.phone) {
    const button = <div ref={core.phone ? core.rootRef : undefined} data-slot="search" data-collapsed="" className={cn("fiori-search", core.className)} {...core.rootProps}>
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
            if (core.phone) { core.setOpen(true); return }
            core.fire(core.shown)
            focusInput.current = true
            toggle()
          }}
        >
          <Icon icon={searchIcon} />
        </Button>
      </div>
    return core.phone ? <Popover open={core.open} onOpenChange={core.setOpen}><PopoverAnchor asChild>{button}</PopoverAnchor>{core.popover}</Popover> : button
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
      tabIndex={ctx?.phone && ctx.phoneTabStop === text ? 0 : -1}
      data-search-text={ctx?.phone ? text : undefined}
      aria-selected={ctx?.matched === text}
      data-selected={ctx?.matched === text ? "" : undefined}
      data-description={description ? "" : undefined}
      className={cn("fiori-search-item", className)}
      onFocus={(e) => {
        onFocus?.(e)
        if (e.target === e.currentTarget) { ctx?.focusItem(text); ctx?.preview(text) }
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
