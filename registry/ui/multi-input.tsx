import * as React from "react"
import { isF6NavigationKey } from "@/lib/fiori-f6"
import { Popover as PopoverPrimitive } from "radix-ui"

// UI5 2.28 MultiInputTemplate.js renders an internal List (fastNavigation metadata).

// UI5 2.28 Popup.js/onEnterDOM: every rendered Popup surface bounds F6, modal or otherwise.

import { valueHelp } from "@/lib/fiori-icons"
import { useIsPhone } from "@/lib/use-is-phone"
import { ResponsivePopover, ResponsivePopoverAnchor, ResponsivePopoverContent } from "@/components/ui/responsive-popover"
import { Button } from "@/components/ui/button"
import { ToggleButton } from "@/components/ui/toggle-button"
import { Input } from "@/components/ui/input"
import { multiselectAll, decline } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import { valueStateDefaultText, valueStateIcons, type ValueState } from "@/components/ui/input"
import { Token } from "@/components/ui/token"
import { Tokenizer, type TokenizerHandle } from "@/components/ui/tokenizer"

type SuggestionFilter = "startsWithPerTerm" | "startsWith" | "contains" | "none"

type SuggestionItemProps = {
  /** Text shown in the list and put into the field when the item is chosen. */
  text: string
  /** Secondary text, right-aligned in the list. */
  additionalText?: string
}

/** Declares one suggestion of a <MultiInput>. Rendered by the MultiInput, not by itself. */
function SuggestionItem(_props: SuggestionItemProps): React.ReactNode {
  return null
}

type MultiInputProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "children" | "size"> & {
  /** <Token> elements shown before the text. The MultiInput doesn't create or remove tokens itself. */
  tokens?: React.ReactNode
  /** <SuggestionItem> elements; when present, typing opens the suggestions list. */
  children?: React.ReactNode
  value?: string
  defaultValue?: string
  /** Fires on every change of the text (typing, autocomplete, navigating the suggestions). */
  onValueChange?: (value: string) => void
  /** Fires when the text is committed (Enter, leaving the field, choosing a suggestion), like UI5's `change`. Create the token here. */
  onCommit?: (value: string) => void
  /** Fires when a suggestion is chosen (Enter or click), like UI5's `selection-change`. */
  onSuggestionSelect?: (item: SuggestionItemProps) => void
  /** Fires with the values (Token `value`, else `text`) of the tokens the user deleted. */
  onTokenDelete?: (values: string[]) => void
  /** Shows the value-help icon at the end of the field. */
  showValueHelpIcon?: boolean
  /** Fires on value-help icon click and on F4 / Alt+↓ / Alt+↑. */
  onValueHelpTrigger?: () => void
  /** How suggestions are filtered while typing. Default "none" (like UI5: the app filters). */
  filter?: SuggestionFilter
  /** Turns off inline autocomplete of the first matching suggestion. */
  noTypeahead?: boolean
  valueState?: ValueState
  /** Shown below the field while focused (and atop the suggestions while open); defaults to SAP's standard text. `null` hides it. */
  valueStateMessage?: React.ReactNode | null
  /** Accessible name of the value-help icon. */
  valueHelpLabel?: string
  /** aria-roledescription of the field. */
  roleDescription?: string
  /** "n more" text, see <Tokenizer nMoreText>. */
  nMoreText?: (count: number, allHidden: boolean) => string
  /** Screen-reader text for the token count. */
  tokensCountText?: (count: number) => string
  wrapperClassName?: string
  dialogTitle?: string
  okText?: string
  cancelText?: string
  showTokensLabel?: string
  tokenDeleteLabel?: string
  suggestionsLabel?: string
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const filters: Record<SuggestionFilter, (value: string, text: string) => boolean> = {
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

function collectItems<P>(children: React.ReactNode, type: React.FC<P>, out: P[] = []) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    if (child.type === type) out.push(child.props as P)
    else if (child.type === React.Fragment) collectItems((child.props as { children?: React.ReactNode }).children, type, out)
  })
  return out
}

function countTokens(tokens: React.ReactNode): number {
  let n = 0
  React.Children.forEach(tokens, (c) => {
    if (!React.isValidElement(c)) return
    if (c.type === Token) n++
    else if (c.type === React.Fragment) n += countTokens((c.props as { children?: React.ReactNode }).children)
  })
  return n
}

/** Bold every occurrence of `match` (UI5's generateHighlightedMarkup). */
function highlightAll(text: string, match: string) {
  if (!match) return text
  const parts = text.split(new RegExp(`(${escapeRegExp(match)})`, "gi"))
  return parts.map((p, i) => (i % 2 ? <b key={i}>{p}</b> : p))
}

// Mirrors ui5-multi-input (Horizon, desktop): an Input whose tokens sit in a Tokenizer before the text.
// Backspace in an empty field, ← at the start or Home at the start move into the tokens; → / End on the
// last token come back. When the field isn't focused the tokens collapse to "n more" (opens a list of all
// tokens). F4 / Alt+↓ / Alt+↑ and the value-help icon fire onValueHelpTrigger. Suggestions: typing opens
// them, ↑/↓ walk them (the text previews the item), Enter / click choose, Escape restores the typed text.
function MultiInput({
  tokens,
  children,
  className,
  wrapperClassName,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onCommit,
  onSuggestionSelect,
  onTokenDelete,
  showValueHelpIcon,
  onValueHelpTrigger,
  filter = "none",
  noTypeahead,
  valueState = "none",
  valueStateMessage,
  valueHelpLabel = "Show Value Help",
  roleDescription = "Multi Value Input",
  nMoreText,
  tokensCountText = defaultTokensCountText,
  dialogTitle = "All Items",
  okText = "OK",
  cancelText = "Cancel",
  showTokensLabel = "Show selected tokens",
  tokenDeleteLabel = "Delete",
  suggestionsLabel = "Suggestions",
  disabled,
  readOnly,
  placeholder,
  id,
  onKeyDown,
  onMouseDown,
  onClick,
  onFocus,
  onBlur,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  ...props
}: MultiInputProps) {
  const phone = useIsPhone()
  const Root = phone ? ResponsivePopover : PopoverPrimitive.Root
  const Anchor = phone ? ResponsivePopoverAnchor : PopoverPrimitive.Anchor
  const Content = phone ? ResponsivePopoverContent : PopoverPrimitive.Content
  const phoneInputRef = React.useRef<HTMLInputElement>(null)
  const phoneSuggestionSelected = React.useRef(false)
  const phoneBeforeOpen = React.useRef(valueProp ?? defaultValue)
  const [showPhoneTokens, setShowPhoneTokens] = React.useState(false)
  const tokenItems = collectItems(tokens, Token)
  const items = collectItems(children, SuggestionItem)
  const tokenCount = countTokens(tokens)
  const hasTokens = tokenCount > 0
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const value = valueProp ?? uncontrolledValue
  const [open, setOpenState] = React.useState(false)
  const [typed, setTyped] = React.useState("")
  /** Index (in the visible list) of the navigated suggestion, -1 = none. */
  const [active, setActive] = React.useState(-1)
  const [focused, setFocused] = React.useState(false)
  const [tokensPopoverOpen, setTokensPopoverOpen] = React.useState(false)

  const fieldRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const tokenizer = React.useRef<TokenizerHandle>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const lastCommitted = React.useRef(value)
  const valueOnFocus = React.useRef(value)
  const matched = React.useRef<SuggestionItemProps | null>(null)
  const pendingSelection = React.useRef<[number, number] | null>(null)

  const autoId = React.useId()
  const baseId = id ?? autoId
  const listId = `${baseId}-suggestions`
  const optionId = (i: number) => `${baseId}-suggestion-${i}`
  const countId = `${baseId}-tokens-count`
  const vhId = `${baseId}-value-help`
  const suggestionsTextId = `${baseId}-suggestions-text`
  const messageId = `${baseId}-vsm`

  const showSuggestions = items.length > 0
  const visible = items.filter((i) => filters[filter](typed, i.text))
  const isOpen = open && showSuggestions && (phone || visible.length > 0) && !disabled && !readOnly

  const setValue = (v: string) => {
    if (valueProp === undefined) setUncontrolledValue(v)
    if (v !== value) onValueChange?.(v)
  }
  const setOpen = (o: boolean) => {
    if (phone && o && !open) { phoneBeforeOpen.current = value; setShowPhoneTokens(tokenCount > 0) }
    setOpenState(o)
    if (!o) setActive(-1)
  }
  const commit = (v = value) => {
    if (v !== lastCommitted.current) {
      lastCommitted.current = v
      onCommit?.(v)
    }
  }

  React.useLayoutEffect(() => {
    const sel = pendingSelection.current
    const input = phone && isOpen ? phoneInputRef.current : inputRef.current
    if (sel && input && document.activeElement === input) input.setSelectionRange(sel[0], sel[1])
    pendingSelection.current = null
  })
  React.useEffect(() => {
    if (isOpen && active >= 0) document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, active])

  const choose = (item: SuggestionItemProps) => {
    if (phone) phoneSuggestionSelected.current = true
    pendingSelection.current = [item.text.length, item.text.length]
    setValue(item.text)
    onSuggestionSelect?.(item)
    commit(item.text)
    setOpen(false)
    matched.current = null
  }

  const navigate = (index: number) => {
    const item = visible[index]
    if (!item) return
    setActive(index)
    const starts = typed && item.text.toLowerCase().startsWith(typed.toLowerCase())
    pendingSelection.current = [starts ? typed.length : 0, item.text.length]
    setValue(item.text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || e.nativeEvent.isComposing) return
    const { key, altKey: alt, ctrlKey: ctrl, shiftKey: shift, metaKey: meta } = e
    const plain = !alt && !ctrl && !shift && !meta
    const input = e.currentTarget
    const caretAtStart = input.selectionStart === 0 && input.selectionEnd === 0
    if (key === "Home" && plain && input.selectionStart === 0 && hasTokens) {
      e.preventDefault()
      tokenizer.current?.focusFirst()
      return
    }
    if (key === "ArrowLeft" && plain && caretAtStart && hasTokens) {
      e.preventDefault()
      tokenizer.current?.focusLast()
      return
    }
    if (key === "Backspace" && !value && hasTokens) {
      e.preventDefault()
      tokenizer.current?.focusLast()
      return
    }
    if ((key === "ArrowDown" || key === "ArrowUp") && plain) {
      if (!isOpen) return
      e.preventDefault()
      if (key === "ArrowDown") return navigate(active === -1 ? 0 : Math.min(active + 1, visible.length - 1))
      if (active <= 0) {
        // Back from the first item to the typed text.
        setActive(-1)
        pendingSelection.current = [typed.length, typed.length]
        return setValue(typed)
      }
      return navigate(active - 1)
    }
    if ((key === "PageDown" || key === "PageUp") && plain) {
      e.preventDefault()
      if (isOpen && active >= 0) navigate(key === "PageDown" ? Math.min(active + 10, visible.length - 1) : Math.max(active - 10, 0))
      return
    }
    if ((key === "Home" || key === "End") && plain && isOpen && active >= 0) {
      e.preventDefault()
      return navigate(key === "Home" ? 0 : visible.length - 1)
    }
    if (key === "Enter") {
      const item = (isOpen && active >= 0 ? visible[active] : null) ?? matched.current ?? items.find((i) => i.text.toLowerCase() === value.toLowerCase())
      if (item && (isOpen || matched.current)) return choose(item)
      commit()
      setOpen(false)
      return
    }
    if (key === "Escape") {
      if (isOpen) {
        e.preventDefault()
        const autocompleted = (input.selectionEnd ?? 0) - (input.selectionStart ?? 0) > 0
        if (active >= 0 || autocompleted) {
          pendingSelection.current = [typed.length, typed.length]
          setValue(typed)
        }
        matched.current = null
        setOpen(false)
      } else if (value !== lastCommitted.current || value !== valueOnFocus.current) {
        e.preventDefault()
        setValue(lastCommitted.current !== value ? lastCommitted.current : valueOnFocus.current)
      }
      return
    }
    if (key === "Tab" && isOpen) {
      const item = active >= 0 ? visible[active] : null
      if (item) onSuggestionSelect?.(item)
      setOpen(false)
    }
    const isShow = (key === "F4" && plain) || ((key === "ArrowDown" || key === "ArrowUp") && alt && !ctrl && !shift && !meta)
    if (isShow && !disabled) {
      e.preventDefault()
      onValueHelpTrigger?.()
    }
  }

  const hasState = valueState !== "none"
  const message = valueStateMessage === undefined && hasState ? valueStateDefaultText[valueState] : valueStateMessage
  const showMessage = hasState && message != null && !readOnly && !disabled
  const showHeader = isOpen && showMessage && valueState !== "positive"
  const iconCount = showValueHelpIcon ? 1 : 0

  // Input.js/_afterOpenPicker, _confirmMobileValue, _cancelMobileValue and
  // MultiInputTemplate.js/mobileHeader: token view starts selected on phones.
  const cancelPhone = () => { setValue(phoneBeforeOpen.current); setOpen(false) }
  const acceptPhone = () => { commit(); setOpen(false) }
  const phoneProps = phone ? {
    headerText: dialogTitle, phoneField: true, phoneOwnerRef: inputRef, preventFocusRestore: true,
    phoneClassName: "fiori-multi-input-phone",
    phoneHeader: <div className="fiori-responsive-popover__rows">
      <div className="fiori-responsive-popover__row"><h1>{dialogTitle}</h1></div>
      <div className="fiori-responsive-popover__row fiori-responsive-popover__row--input">
        <Input ref={phoneInputRef} wrapperClassName="fiori-multi-input-phone__input my-0" aria-label={dialogTitle} placeholder={placeholder} value={value}
          // InputSuggestionsTemplate.js supplies no suggestions to this Input.
          // Enter/arrows leave the owning dialog alone; Dialog handles Escape.
          onChange={(e) => { const text = e.target.value; setTyped(text); setValue(text); setActive(-1) }} />
        <ToggleButton variant="transparent" aria-label={showTokensLabel} disabled={!tokenCount} pressed={showPhoneTokens && tokenCount > 0}
          onPressedChange={setShowPhoneTokens}><Icon icon={multiselectAll} /></ToggleButton>
      </div>
      {showHeader && <div data-value-state={valueState} className="fiori-value-state-message"><Icon icon={valueStateIcons[valueState]} />{message}</div>}
    </div>,
    phoneFooter: <><Button variant="emphasized" onClick={acceptPhone}>{okText}</Button><Button variant="transparent" onClick={cancelPhone}>{cancelText}</Button></>,
    onOpenAutoFocus: (e: Event) => { e.preventDefault(); phoneInputRef.current?.focus() },
    onEscapeKeyDown: () => setOpen(false),
    onCloseAutoFocus: (e: Event) => { e.preventDefault(); if (phoneSuggestionSelected.current) { phoneSuggestionSelected.current = false; inputRef.current?.focus() } },
  } : {}
  return (
    <Root open={isOpen} onOpenChange={(o) => !o && setOpen(false)}>
      <Anchor asChild>
        <div
          ref={fieldRef}
          data-slot="multi-input"
          data-value-state={hasState ? valueState : undefined}
          data-disabled={disabled ? "" : undefined}
          data-readonly={readOnly ? "" : undefined}
          data-open={isOpen ? "" : undefined}
          data-icons={iconCount ? "" : undefined}
          data-tokens={hasTokens ? "" : undefined}
          data-focused={focused ? "" : undefined}
          style={{ "--fiori-field-icons": iconCount } as React.CSSProperties}
          className={cn("fiori-field fiori-tokenized-field group/field my-(--fiori-input-margin-top-bottom)", wrapperClassName)}
          onBlur={(e) => {
            if (fieldRef.current?.contains(e.relatedTarget as Node) || listRef.current?.contains(e.relatedTarget as Node)) return
            tokenizer.current?.deselectAll()
            setFocused(false)
          }}
        >
          <span id={countId} hidden>{tokensCountText(tokenCount)}</span>
          {showValueHelpIcon && <span id={vhId} hidden>Value help available</span>}
          {showSuggestions && <span id={suggestionsTextId} hidden>Suggestions Available</span>}
          <Tokenizer
            handleRef={tokenizer}
            className="fiori-tokenized-field__tokenizer"
            readOnly={readOnly}
            disabled={disabled}
            expanded={focused}
            preventInitialFocus
            hidePopoverArrow
            popoverAnchor={fieldRef}
            nMoreText={nMoreText}
            aria-label={ariaLabel ? `${ariaLabel} tokens` : undefined}
            onTokenDelete={(values) => !readOnly && onTokenDelete?.(values)}
            onFocusExhausted={() => inputRef.current?.focus()}
            onPopoverOpenChange={setTokensPopoverOpen}
            onKeyDown={(e) => {
              // MultiInput.js/_onTokenizerKeydown uses exact keys; aliases must not schedule input focus.
              if (isF6NavigationKey(e)) return
              const els = [...e.currentTarget.querySelectorAll<HTMLElement>('[data-slot="token"]')]
              const last = els[els.length - 1]
              // UI5 MultiInput.js _onTokenizerKeydown keeps ArrowRight as an exit
              // key, but requires the last token to remain focused after ItemNavigation.
              // RTL Right moves to the preceding token, so Down/End exit from the last.
              const toInput = e.key === "ArrowDown" || e.key === "End" || e.key === "ArrowRight"
              if (toInput && !e.shiftKey && e.target === last && document.activeElement === last) {
                e.preventDefault()
                setTimeout(() => inputRef.current?.focus())
              }
              if ((e.key === "F4" || (e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp"))) && !disabled) {
                e.preventDefault()
                onValueHelpTrigger?.()
              }
            }}
          >
            {tokens}
          </Tokenizer>
          <input
            ref={inputRef}
            id={id}
            role={showSuggestions ? "combobox" : undefined}
            autoComplete="off"
            aria-label={ariaLabel}
            aria-roledescription={roleDescription}
            aria-autocomplete={showSuggestions ? "list" : undefined}
            aria-haspopup={showSuggestions ? (phone ? "dialog" : "listbox") : undefined}
            aria-expanded={showSuggestions ? isOpen : undefined}
            aria-controls={isOpen ? listId : undefined}
            aria-activedescendant={isOpen && active >= 0 ? optionId(active) : undefined}
            aria-invalid={valueState === "negative" || undefined}
            aria-describedby={cn(countId, showSuggestions && suggestionsTextId, showMessage && messageId, showValueHelpIcon && vhId, ariaDescribedBy) || undefined}
            disabled={disabled}
            readOnly={readOnly}
            value={value}
            placeholder={hasTokens ? undefined : placeholder}
            className={cn("fiori-field__input", className)}
            onChange={(e) => {
              const t = e.target.value
              const ne = e.nativeEvent as InputEvent
              setTyped(t)
              setActive(-1)
              matched.current = null
              let next = t
              if (showSuggestions && !noTypeahead && !ne.isComposing && t && !NO_AUTOCOMPLETE.has(ne.inputType)) {
                const item = items.find((i) => i.text.toLowerCase().startsWith(t.toLowerCase()))
                if (item) {
                  next = item.text
                  matched.current = item
                  pendingSelection.current = [t.length, item.text.length]
                }
              }
              setValue(next)
              if (!phone) setOpen(!!t)
            }}
            onMouseDown={(e) => {
              onMouseDown?.(e)
              // Input.js/_click blurs the phone field before opening. Keep early
              // pointer focus from expanding tokens and moving this click target.
              if (phone && e.button === 0 && !disabled && !readOnly) e.preventDefault()
            }}
            onClick={(e) => { onClick?.(e); if (!e.defaultPrevented && phone && !disabled && !readOnly) setOpen(true) }}
            onKeyDown={handleKeyDown}
            onFocus={(e) => {
              setFocused(true)
              valueOnFocus.current = e.currentTarget.value
              tokenizer.current?.deselectAll()
              tokenizer.current?.closePopover()
              onFocus?.(e)
            }}
            onBlur={(e) => {
              const to = e.relatedTarget as Node | null
              if ((phone && isOpen) || listRef.current?.contains(to)) return
              setFocused(!!fieldRef.current?.contains(to))
              // Moving into the tokens doesn't commit (UI5 skips change while focus is in the tokenizer).
              if (!fieldRef.current?.contains(to)) {
                commit()
                setOpen(false)
              }
              onBlur?.(e)
            }}
            {...props}
          />
          {showValueHelpIcon && (
            <span
              data-slot="multi-input-value-help"
              role="button"
              aria-label={valueHelpLabel}
              title={valueHelpLabel}
              className="fiori-field__icon fiori-tokenized-field__icon"
              onMouseDown={(e) => {
                e.preventDefault()
                inputRef.current?.focus()
                tokenizer.current?.closePopover()
              }}
              onClick={() => !disabled && !readOnly && onValueHelpTrigger?.()}
            >
              <Icon icon={valueHelp} />
            </span>
          )}
          {showMessage && (
            <div
              id={messageId}
              role="status"
              data-popover=""
              data-sap-ui-fastnavgroup-container="true"
              data-value-state={valueState}
              className={cn(
                "fiori-value-state-message absolute start-0 top-full z-50 mt-1 hidden max-w-[22rem]",
                !tokensPopoverOpen && "group-focus-within/field:block group-data-open/field:hidden"
              )}
            >
              <Icon icon={valueStateIcons[valueState]} />
              {message}
            </div>
          )}
        </div>
      </Anchor>
      <PhoneSuggestionPortal phone={phone}>
        <Content data-sap-ui-fastnavgroup-container="true"
          align="start"
          sideOffset={4}
          aria-label={suggestionsLabel}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          // Radix catches Escape on the document before the input sees it: restore the typed text here.
          onEscapeKeyDown={() => {
            const input = inputRef.current
            const autocompleted = !!input && (input.selectionEnd ?? 0) - (input.selectionStart ?? 0) > 0
            if (active >= 0 || autocompleted) {
              pendingSelection.current = [typed.length, typed.length]
              setValue(typed)
            }
            matched.current = null
            setOpen(false)
          }}
          onInteractOutside={(e) => {
            if (fieldRef.current?.contains(e.target as Node)) e.preventDefault()
          }}
          className={phone ? undefined : "fiori-popover fiori-suggestions z-50 flex max-h-(--radix-popover-content-available-height) min-w-(--radix-popover-trigger-width) max-w-[40rem] flex-col"}
          {...phoneProps}
        >
          {!phone && showHeader && (
            <div data-value-state={valueState} className="fiori-value-state-message fiori-suggestions__header">
              <Icon icon={valueStateIcons[valueState]} />
              {message}
            </div>
          )}
          <div
            ref={listRef}
            id={listId}
            data-slot="multi-input-suggestions" data-sap-ui-fastnavgroup="true"
            role="listbox"
            aria-label={suggestionsLabel}
            className="overflow-y-auto"
            onMouseDown={(e) => e.preventDefault()}
            // Input.js/onAfterRendering disables its List's ItemNavigation,
            // including MultiInput's phone token view. Rows do not receive arrows.
            onKeyDown={phone && showPhoneTokens && tokenCount > 0 ? (e) => {
              // List.js/_onkeydown + _navigateToAdjacentItem still move between
              // internal Delete buttons independently of row ItemNavigation.
              if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return
              const row = (e.target as HTMLElement).closest<HTMLElement>(".fiori-multi-input-phone__token")
              if (!row || document.activeElement === row) return
              const rows = [...e.currentTarget.querySelectorAll<HTMLElement>(".fiori-multi-input-phone__token")]
              const next = rows[rows.indexOf(row) + (e.key === "ArrowDown" ? 1 : -1)]?.querySelector<HTMLButtonElement>("button")
              if (next) { e.preventDefault(); next.focus(); next.scrollIntoView({ block: "nearest" }) }
            } : undefined}
          >
            {phone && showPhoneTokens && tokenCount > 0 ? <>
              {/* ListTemplate.js keeps before/after tab stops even when Input.js
                  disables ItemNavigation and token rows have no roving tabindex. */}
              <div data-slot="multi-input-token-before" role="none" tabIndex={0} className="fixed" />
              {tokenItems.map((token, index) => <div key={index} role="option" className="fiori-list-item fiori-multi-input-phone__token"
              // ListItem.js/_onkeyup fires deletion when Delete is released.
              onKeyUp={(e) => { if (e.key === "Delete" && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) onTokenDelete?.([token.value ?? token.text ?? ""]) }}>
              <span>{token.text}</span><Button variant="transparent" aria-label={tokenDeleteLabel} onClick={() => onTokenDelete?.([token.value ?? token.text ?? ""])}><Icon icon={decline} /></Button>
              </div>)}
              <div data-slot="multi-input-token-after" role="none" tabIndex={0} className="fixed" />
            </> : visible.map((item, i) => (
              <div
                key={`${item.text}-${i}`}
                id={optionId(i)}
                role="option"
                tabIndex={phone ? (i === 0 ? 0 : -1) : undefined}
                aria-selected={i === active}
                data-state={i === active ? "checked" : undefined}
                data-highlighted={i === active ? "" : undefined}
                className="fiori-list-item fiori-suggestions__item"
                onClick={() => choose(item)}
                // ListItemBase.js activates Enter on keydown, Space on keyup.
                onKeyDown={phone ? (e) => {
                  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
                  if (e.key === "Enter" || e.key === " ") e.preventDefault()
                  if (e.key === "Enter") choose(item)
                } : undefined}
                onKeyUp={phone ? (e) => { if (e.key === " " && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) choose(item) } : undefined}
              >
                <span className="fiori-suggestions__text">{highlightAll(item.text, typed)}</span>
                {item.additionalText && <span className="fiori-suggestions__additional">{item.additionalText}</span>}
              </div>
            ))}
          </div>
        </Content>
      </PhoneSuggestionPortal>
    </Root>
  )
}

function PhoneSuggestionPortal({ phone, children }: { phone: boolean; children: React.ReactNode }) {
  return phone ? <>{children}</> : <PopoverPrimitive.Portal>{children}</PopoverPrimitive.Portal>
}

export { MultiInput, SuggestionItem, type MultiInputProps, type SuggestionFilter, type SuggestionItemProps }
