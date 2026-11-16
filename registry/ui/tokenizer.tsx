import * as React from "react"
import { isF6NavigationKey } from "@/lib/fiori-f6"

// UI5 2.28 TokenizerPopoverTemplate.js renders an internal List (fastNavigation metadata).

import { decline } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { Token, type TokenProps } from "@/components/ui/token"

type TokenizerHandle = {
  /** Focus the first / last (visible) token. Returns false when there is none. */
  focusFirst: () => boolean
  focusLast: () => boolean
  deselectAll: () => void
  openPopover: () => void
  closePopover: () => void
  /** The token list container (for focus checks). */
  element: HTMLDivElement | null
}

/**
 * @accessibility aria-label names the inner listbox. Tokens retain role=option, aria-selected and one roving tab stop; nMoreText names the overflow indicator and deleteLabel names popup delete buttons.
 * @accessibility Arrows and Home/End move between tokens; Space toggles, Shift+arrows extend and Ctrl+A toggles selection. Delete/Backspace request deletion and move to a neighbour. Ctrl+I opens all tokens; Escape closes and restores focus. Horizontal arrows mirror in RTL.
 */
type TokenizerProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** <Token> elements (fragments and arrays are fine). */
  children?: React.ReactNode
  /** Fires with the values (Token `value`, else `text`) of the tokens the user deleted. Remove them yourself. */
  onTokenDelete?: (values: string[]) => void
  /** Fires when the user changes which tokens are selected. */
  onSelectionChange?: (values: string[]) => void
  readOnly?: boolean
  disabled?: boolean
  /** Text of the "n more" indicator. `allHidden` is true when no token fits ("{n} Items"). */
  nMoreText?: (count: number, allHidden: boolean) => string
  /** Accessible name of the token list. */
  "aria-label"?: string
  /** Tooltip of the delete buttons in the "n more" popover. */
  deleteLabel?: string

  // ---- Used by MultiInput / MultiComboBox ----
  /** Shows every token (scrollable) instead of collapsing into "n more", e.g. while the owning field is focused. */
  expanded?: boolean
  /** Keeps the tokens out of the tab chain until one is focused programmatically. */
  preventInitialFocus?: boolean
  /** Replaces the default "n more" click / Ctrl+I behaviour (opening the popover of all tokens). */
  onShowAll?: () => void
  /** Element the "n more" popover is aligned to (and whose width it takes at least). Defaults to the tokenizer. */
  popoverAnchor?: React.RefObject<HTMLElement | null>
  hidePopoverArrow?: boolean
  /** Fires when the "n more" popover opens or closes. */
  onPopoverOpenChange?: (open: boolean) => void
  /** Called after a deletion when no token is left to take the focus. */
  onFocusExhausted?: () => void
  handleRef?: React.Ref<TokenizerHandle>
  contentClassName?: string
}

type TokenData = TokenProps & { key: string }

function collectTokens(children: React.ReactNode, out: TokenData[] = []) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    if (child.type === Token) {
      const p = child.props as TokenProps
      out.push({ ...p, key: p.value ?? p.text })
    } else if (child.type === React.Fragment) collectTokens((child.props as { children?: React.ReactNode }).children, out)
  })
  return out
}

const defaultNMoreText = (count: number, allHidden: boolean) => (allHidden ? `${count} Items` : `${count} more`)
const round = (n: number) => Number(n.toFixed(2))

// Mirrors ui5-tokenizer (Horizon, desktop). Tokens form a listbox with roving focus: ←/→/↑/↓ move,
// Home/End jump, Ctrl+arrows move without selecting, Shift+arrows / Shift+Home/End extend the selection,
// Space toggles, Ctrl+A toggles all, Escape deselects, Backspace/Delete remove the selected tokens (or the
// focused one) and move focus to a neighbour, Ctrl+C / Ctrl+X copy / cut the texts, Ctrl+I opens the list
// of all tokens. When not focused, the tokens that don't fit collapse into an "n more" link that opens a
// popover listing every token with a delete button.
function Tokenizer({
  children,
  className,
  contentClassName,
  onTokenDelete,
  onSelectionChange,
  readOnly,
  disabled,
  nMoreText = defaultNMoreText,
  "aria-label": ariaLabel = "Tokenizer",
  deleteLabel = "Delete",
  expanded: expandedProp,
  preventInitialFocus,
  onShowAll,
  popoverAnchor,
  hidePopoverArrow,
  onFocusExhausted,
  onPopoverOpenChange,
  handleRef,
  ...props
}: TokenizerProps) {
  const tokens = collectTokens(children)
  const keys = tokens.map((t) => t.key)
  const keysSig = keys.join("\u0000")

  const rootRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const moreRef = React.useRef<HTMLSpanElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)

  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(tokens.filter((t) => t.selected ?? t.defaultSelected).map((t) => t.key))
  )
  const [focusWithin, setFocusWithin] = React.useState(false)
  const [current, setCurrent] = React.useState(-1)
  const [popoverOpen, setPopoverOpenState] = React.useState(false)
  const setPopoverOpen = (o: boolean) => {
    setPopoverOpenState(o)
    if (o !== popoverOpen) onPopoverOpenChange?.(o)
  }
  const [popoverGeom, setPopoverGeom] = React.useState<{ width?: number; side: number; align: number }>({ side: 0, align: 0 })
  const [nMore, setNMore] = React.useState(0)
  const prevNMore = React.useRef(-1)
  const anchor = React.useRef<string | null>(null)
  const focusBeforePopover = React.useRef<HTMLElement | null>(null)

  const expanded = !disabled && (!!expandedProp || focusWithin || popoverOpen)
  const visibleCount = expanded ? tokens.length : tokens.length - nMore

  // Drop selection of tokens that are gone.
  React.useEffect(() => {
    setSelected((prev) => {
      const next = new Set([...prev].filter((k) => keys.includes(k)))
      return next.size === prev.size ? prev : next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysSig])

  const tokenEls = () => [...(contentRef.current?.querySelectorAll<HTMLElement>('[data-slot="token"]') ?? [])]
  const visibleEls = () => (disabled ? [] : tokenEls().slice(0, visibleCount))

  const updateSelection = (next: Set<string>) => {
    setSelected(next)
    onSelectionChange?.(keys.filter((k) => next.has(k)))
  }

  // ---- "n more": which tokens overflow (UI5 overflownTokens: a token shows only if it and the
  // indicator both fit; the last token only needs to fit itself). Tokens are measured unhidden.
  const measure = React.useCallback(() => {
    const content = contentRef.current
    if (!content) return
    const els = tokenEls()
    if (expanded || !els.length) {
      if (nMore !== 0) setNMore(0)
      return
    }
    els.forEach((t) => t.removeAttribute("data-overflows"))
    const parent = content.getBoundingClientRect()
    const moreWidth = moreRef.current?.getBoundingClientRect().width ?? 0
    let first = -1
    els.forEach((t, i) => {
      const r = t.getBoundingClientRect()
      const end = i === els.length - 1 ? round(parent.right) : round(parent.right - moreWidth)
      if (first === -1 && (round(r.left) < round(parent.left) || round(r.right) > end)) first = i
    })
    let count = first === -1 ? 0 : els.length - first
    // Guard against flip-flopping at the "{n} Items" boundary (same as UI5).
    if (nMore === els.length && count === els.length - 1 && prevNMore.current === count) count = nMore
    const firstHidden = els.length - count
    els.forEach((t, i) => t.toggleAttribute("data-overflows", count > 0 && i >= firstHidden))
    if (count !== nMore) {
      prevNMore.current = nMore
      setNMore(count)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, nMore, keysSig])

  React.useLayoutEffect(measure)
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ro = new ResizeObserver(() => measure())
    ro.observe(root)
    return () => ro.disconnect()
  }, [measure])

  // Collapsed: show the beginning. Expanded without a focused token: show the end (where the input is).
  React.useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) return
    if (!expanded) content.scrollLeft = 0
    else if (!content.contains(document.activeElement)) content.scrollLeft = getComputedStyle(content).direction === "rtl" ? -content.scrollWidth : content.scrollWidth
  }, [expanded, keysSig])

  const scrollToToken = (el: HTMLElement | undefined) => {
    const content = contentRef.current
    if (!content || !el) return
    const els = tokenEls()
    if (els.indexOf(el) === els.length - 1) {
      content.scrollLeft = content.scrollWidth
      return
    }
    const t = el.getBoundingClientRect()
    const c = content.getBoundingClientRect()
    if (t.left < c.left) content.scrollLeft -= c.left - t.left + 5
    else if (t.right > c.right) content.scrollLeft += t.right - c.right + 5
  }

  const focusToken = (index: number) => {
    const el = visibleEls()[index]
    if (!el) return false
    setCurrent(index)
    el.focus()
    scrollToToken(el)
    return true
  }

  React.useImperativeHandle(handleRef, () => ({
    focusFirst: () => {
      setFocusWithin(true)
      return focusToken(0)
    },
    focusLast: () => {
      // The tokenizer expands on focus; focus after the expansion renders every token.
      const last = tokens.length - 1
      if (last < 0 || disabled) return false
      setFocusWithin(true)
      setCurrent(last)
      requestAnimationFrame(() => {
        const el = tokenEls()[last]
        el?.focus()
        scrollToToken(el)
      })
      return true
    },
    deselectAll: () => selected.size && updateSelection(new Set()),
    openPopover: () => openPopover(),
    closePopover: () => setPopoverOpen(false),
    element: contentRef.current,
  }))

  // ---- deletion
  const afterDelete = (nextKey: string | undefined) => {
    setTimeout(() => {
      const el = nextKey === undefined ? undefined : tokenEls().find((t) => t.dataset.value === nextKey)
      if (el) {
        el.focus()
        setCurrent(tokenEls().indexOf(el))
      } else onFocusExhausted?.()
    })
  }

  const deleteByClick = (index: number) => {
    if (readOnly) return
    const next = tokens[index === tokens.length - 1 ? index - 1 : index + 1]
    onTokenDelete?.([tokens[index].key])
    afterDelete(next?.key)
    setPopoverOpen(false)
  }

  const deleteByKey = (index: number, backspace: boolean) => {
    if (readOnly) return
    const notSelected = tokens.filter((t) => !selected.has(t.key))
    let nextIndex = backspace ? (index === 0 ? 1 : index - 1) : index === tokens.length - 1 ? index - 1 : index + 1
    let next: TokenData | undefined = tokens[nextIndex]
    if (notSelected.length > 1) {
      while (next && selected.has(next.key)) {
        nextIndex = backspace ? nextIndex - 1 : nextIndex + 1
        next = tokens[nextIndex]
        if (nextIndex < 0) next = notSelected[0]
        if (nextIndex > notSelected.length) next = notSelected[notSelected.length - 1]
      }
    } else next = notSelected[0]
    const toDelete = selected.size ? keys.filter((k) => selected.has(k)) : [tokens[index].key]
    if (next && toDelete.includes(next.key)) next = undefined
    onTokenDelete?.(toDelete)
    afterDelete(next?.key)
  }

  // ---- popover
  const openPopover = () => {
    if (disabled || !tokens.length) return
    focusBeforePopover.current = document.activeElement as HTMLElement | null
    const a = popoverAnchor?.current ?? rootRef.current
    // UI5: margin-top = --fiori-tokenizer-popover-offset, margin-inline-start = -padding, min-width = opener width.
    const cs = rootRef.current ? getComputedStyle(rootRef.current) : null
    const px = (v?: string) => (v ? parseFloat(v) * (v.trim().endsWith("rem") ? parseFloat(getComputedStyle(document.documentElement).fontSize) : 1) : 0)
    setPopoverGeom({
      width: a?.getBoundingClientRect().width,
      side: px(cs?.getPropertyValue("--fiori-tokenizer-popover-offset")),
      align: -px(cs?.getPropertyValue("--fiori-tokenizer-padding")),
    })
    setPopoverOpen(true)
  }
  const closePopoverAndRestore = () => {
    setPopoverOpen(false)
    const prev = focusBeforePopover.current
    if (prev && prev.isConnected && prev !== document.body) prev.focus()
    else focusToken(tokens.length - 1)
  }

  const indexOfTarget = (target: EventTarget) => {
    const el = (target as HTMLElement).closest?.('[data-slot="token"]') as HTMLElement | null
    return el ? tokenEls().indexOf(el) : -1
  }

  const copy = (texts: string[]) => {
    navigator.clipboard?.writeText(texts.join("\r\n")).catch(() => {})
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const index = indexOfTarget(e.target)
    if (index === -1) return
    const { key, shiftKey: shift, altKey: alt } = e
    const ctrl = e.ctrlKey || e.metaKey
    const lower = key.toLowerCase()
    const visible = visibleEls()
    if (key === "Escape") {
      if (selected.size) updateSelection(new Set())
      return
    }
    if ((ctrl && (lower === "c" || lower === "x")) || (shift && key === "Delete") || (ctrl && key === "Insert")) {
      e.preventDefault()
      const sel = tokens.filter((t) => selected.has(t.key))
      const list = sel.length ? sel : [tokens[index]]
      copy(list.map((t) => t.text))
      if ((lower === "x" || key === "Delete") && !readOnly) deleteByKey(tokens.indexOf(list[0]), false)
      return
    }
    if (ctrl && lower === "i") {
      e.preventDefault()
      if (onShowAll) onShowAll()
      else openPopover()
      return
    }
    if (key === " " && shift) {
      e.preventDefault()
      return
    }
    if ((key === "Home" || key === "PageUp") && shift) {
      e.preventDefault()
      updateSelection(new Set([...selected, ...keys.slice(0, index + 1)]))
      focusToken(0)
      return
    }
    if ((key === "End" || key === "PageDown") && shift) {
      e.preventDefault()
      updateSelection(new Set([...selected, ...keys.slice(index)]))
      focusToken(visible.length - 1)
      return
    }
    const arrow = key === "ArrowLeft" || key === "ArrowRight" || key === "ArrowUp" || key === "ArrowDown"
    if (!arrow && key !== "Home" && key !== "End" && !(ctrl && lower === "a")) return
    if (alt) return
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
    const forward = key === "ArrowDown" || (key === "ArrowRight" ? !rtl : key === "ArrowLeft" ? rtl : false)
    const next = Math.max(0, Math.min(visible.length - 1, forward ? index + 1 : index - 1))
    e.preventDefault()
    if (arrow && shift) {
      const target = forward ? index + 1 : index - 1
      if (target < 0 || target >= visible.length) return
      updateSelection(new Set([...selected, keys[index], keys[target]]))
      focusToken(target)
      return
    }
    if (key === "Home" || key === "End") return void focusToken(key === "End" ? visible.length - 1 : 0)
    if (ctrl && lower === "a") {
      const all = keys.slice(0, visible.length)
      const allSelected = all.every((k) => selected.has(k))
      updateSelection(allSelected ? new Set([...selected].filter((k) => !all.includes(k))) : new Set([...selected, ...all]))
      return
    }
    focusToken(next)
  }

  const handleTokenClick = (index: number) => (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault() // the tokenizer owns selection (Token would toggle itself)
    if (disabled) return
    const key = keys[index]
    const ctrl = e.ctrlKey || e.metaKey
    if (ctrl) {
      const next = new Set(selected)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return updateSelection(next)
    }
    if (e.shiftKey && anchor.current !== null && keys.includes(anchor.current)) {
      const a = keys.indexOf(anchor.current)
      const [from, to] = [Math.min(a, index), Math.max(a, index)]
      return updateSelection(new Set(keys.slice(from, to + 1)))
    }
    anchor.current = key
    updateSelection(selected.has(key) ? new Set() : new Set([key]))
  }

  const tabStop = current >= 0 && current < visibleCount ? current : preventInitialFocus ? -1 : 0
  const showNMore = !expanded && nMore > 0
  // UI5 counts no visible token while disabled, hence "{n} Items" there too.
  const allHidden = disabled || tokens.length - nMore === 0
  const isSingle = tokens.length === 1

  return (
    <Popover open={popoverOpen} onOpenChange={(o) => !o && setPopoverOpen(false)}>
      <div
        ref={rootRef}
        data-slot="tokenizer"
        data-expanded={expanded ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        data-readonly={readOnly ? "" : undefined}
        data-empty={tokens.length ? undefined : ""}
        className={cn("fiori-tokenizer", className)}
        {...props}
      >
        <div
          ref={contentRef}
          className={cn("fiori-tokenizer__content", contentClassName)}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => {
            const i = indexOfTarget(e.target)
            if (i >= 0) setCurrent(i)
          }}
          onFocus={(e) => {
            const i = indexOfTarget(e.target)
            if (i === -1) return
            setFocusWithin(true)
            setCurrent(i)
            setPopoverOpen(false)
          }}
          onBlur={(e) => {
            if (contentRef.current?.contains(e.relatedTarget as Node)) return
            setFocusWithin(false)
            setCurrent(-1)
          }}
        >
          <div
            role="listbox"
            aria-label={ariaLabel}
            aria-description={ariaLabel !== "Tokenizer" ? "Tokenizer" : undefined}
            aria-disabled={disabled || undefined}
            aria-readonly={readOnly || undefined}
            className="contents"
          >
            {tokens.map(({ key, ...t }, i) => (
              <Token
                key={key}
                {...t}
                data-value={key}
                data-overflows={!expanded && nMore > 0 && i >= tokens.length - nMore ? "" : undefined}
                data-last-visible={!expanded && nMore > 0 && i === tokens.length - nMore - 1 ? "" : undefined}
                data-single={isSingle ? "" : undefined}
                readOnly={readOnly || t.readOnly}
                selected={selected.has(key)}
                tabIndex={i === tabStop && !disabled ? 0 : -1}
                onSelectedChange={(s) => {
                  const next = new Set(selected)
                  if (s) next.add(key)
                  else next.delete(key)
                  updateSelection(next)
                }}
                onClick={handleTokenClick(i)}
                onDelete={(via) => {
                  t.onDelete?.(via)
                  if (via === "click") deleteByClick(i)
                  else deleteByKey(i, via === "backspace")
                }}
              />
            ))}
          </div>
        </div>
        {showNMore && (
          <span
            ref={moreRef}
            role="button"
            aria-haspopup="dialog"
            className="fiori-tokenizer__more"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (disabled) return
              if (onShowAll) onShowAll()
              else openPopover()
            }}
          >
            {nMoreText(nMore, allHidden)}
          </span>
        )}
      </div>
      <PopoverAnchor virtualRef={(popoverAnchor ?? rootRef) as React.RefObject<HTMLElement>} />
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={popoverGeom.side}
        alignOffset={popoverGeom.align}
        hideArrow={hidePopoverArrow}
        aria-label={ariaLabel}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          listRef.current?.querySelector<HTMLElement>("li")?.focus()
        }}
        onCloseAutoFocus={(e) => e.preventDefault()}
        // Radix catches Escape on the document; close here so the focus goes back (UI5 _onPopoverListKeydown).
        onEscapeKeyDown={(e) => {
          e.preventDefault()
          closePopoverAndRestore()
        }}
        onInteractOutside={(e) => {
          if (rootRef.current?.contains(e.target as Node)) e.preventDefault()
        }}
        className="fiori-tokenizer__popover"
        style={{ minWidth: popoverGeom.width }}
      >
        <ul
          ref={listRef}
          role="list"
          className="fiori-tokenizer__list" data-sap-ui-fastnavgroup="true"
          onKeyDown={(e) => {
            // TokenizerPopoverTemplate renders a List; ItemNavigation ignores F6 aliases.
            if (isF6NavigationKey(e)) return
            const items = [...(listRef.current?.querySelectorAll<HTMLElement>("li") ?? [])]
            const i = items.indexOf(e.target as HTMLElement)
            const ctrl = e.ctrlKey || e.metaKey
            if ((ctrl && e.key.toLowerCase() === "i") || e.key === "Escape") {
              e.preventDefault()
              e.stopPropagation()
              return closePopoverAndRestore()
            }
            if (i === -1) return
            if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
              e.preventDefault()
              const n = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : Math.max(0, Math.min(items.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))
              items[n]?.focus()
            }
            if (e.key === "Delete" && !readOnly && !disabled) {
              e.preventDefault()
              popoverDelete(i)
            }
          }}
        >
          {tokens.map((t, i) => (
            <li key={t.key} tabIndex={i === 0 ? 0 : -1} className="fiori-list-item fiori-tokenizer__list-item">
              <span className="fiori-tokenizer__list-text">{t.text}</span>
              {!readOnly && !disabled && (
                <span className="fiori-tokenizer__list-delete">
                  <Button
                    variant="transparent"
                    size="icon"
                    tabIndex={-1}
                    title={deleteLabel}
                    aria-label={deleteLabel}
                    onClick={() => popoverDelete(i)}
                  >
                    <Icon icon={decline} />
                  </Button>
                </span>
              )}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )

  function popoverDelete(i: number) {
    const items = [...(listRef.current?.querySelectorAll<HTMLElement>("li") ?? [])]
    if (tokens.length === 1) {
      setPopoverOpen(false)
      onTokenDelete?.([tokens[i].key])
      afterDelete(undefined)
      return
    }
    onTokenDelete?.([tokens[i].key])
    const focusIndex = i + 1 < items.length ? i : i - 1
    setTimeout(() => {
      const li = [...(listRef.current?.querySelectorAll<HTMLElement>("li") ?? [])]
      ;(li[focusIndex] ?? li[li.length - 1])?.focus()
    })
  }
}

export { Tokenizer, type TokenizerHandle, type TokenizerProps }
