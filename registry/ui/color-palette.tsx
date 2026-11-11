import * as React from "react"

import { Button } from "@/components/ui/button"
import { updateRecentColors } from "@/lib/fiori-color"
import { cn } from "@/lib/utils"

type Area = "main" | "recent"
type Selection = { area: Area; key: string } | null
type PaletteState = ReturnType<typeof usePaletteState>

function usePaletteState() {
  const [recent, setRecent] = React.useState<string[]>([])
  const [selection, setSelection] = React.useState<Selection>(null)
  const [mainIndex, setMainIndex] = React.useState(0)
  const [recentIndex, setRecentIndex] = React.useState(0)
  const declarations = React.useRef<Map<string, boolean> | null>(null)
  const reopenTarget = React.useRef<Selection>(null)
  const focusRecent = React.useRef(false)
  return { recent, setRecent, selection, setSelection, mainIndex, setMainIndex, recentIndex, setRecentIndex, declarations, reopenTarget, focusRecent }
}

const StateContext = React.createContext<PaletteState | null>(null)

/** Keeps local palette history and item identity alive when a popover's surface unmounts. */
function ColorPaletteStateProvider({ children }: { children: React.ReactNode }) {
  const state = usePaletteState()
  return <StateContext.Provider value={state}>{children}</StateContext.Provider>
}

type ColorPaletteItemProps = Omit<React.ComponentProps<"div">, "children"> & {
  value?: string
  selected?: boolean
  tooltip?: string
  colorLabel?: string
  /** Position assigned by the owning palette. */
  index?: number
}

function ColorPaletteItem({ value = "", selected = false, tooltip, colorLabel = "Color", index, className, style, ...props }: ColorPaletteItemProps) {
  const label = `${colorLabel} - ${index}: ${tooltip || value}`
  return (
    <span data-slot="color-palette-item" data-selected={selected ? "" : undefined} data-disabled={!value ? "" : undefined}
      className={cn("fiori-color-palette-item", className)} style={{ ...(value ? { "--fiori-x-color-palette-item-background-color": value } : {}), ...style } as React.CSSProperties}>
      <div role="button" aria-label={label} aria-pressed={selected} title={label} tabIndex={-1} className="fiori-color-palette-item__inner" {...props} />
    </span>
  )
}

type ColorPaletteProps = React.ComponentProps<"div"> & {
  showDefaultColor?: boolean
  defaultColor?: string
  showRecentColors?: boolean
  /** Reserved for C2. No More Colors button or dialog is rendered yet. */
  showMoreColors?: boolean
  defaultColorText?: string
  containerLabel?: string
  colorLabel?: string
  accessibleName?: string
  accessibleNameRef?: string
  onItemClick?: (detail: { color: string }) => void
  /** Internal keyboard model used by ColorPalettePopover. */
  popupMode?: boolean
}

function itemChildren(children: React.ReactNode, path: string[] = []): React.ReactElement<ColorPaletteItemProps>[] {
  return React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement(child)) return []
    const itemPath = [...path, String(child.key)]
    if (child.type === React.Fragment) return itemChildren((child.props as { children?: React.ReactNode }).children, itemPath)
    // ColorPalette.js _ensureSingleSelectionOrDeselectAll uses distinct physical item identities.
    // Retain the complete Fragment path: sibling Fragments each start their local keys at ".0".
    return child.type === ColorPaletteItem ? [React.cloneElement(child as React.ReactElement<ColorPaletteItemProps>, { key: JSON.stringify(itemPath) })] : []
  })
}

// ItemNavigation.js _handleUp/_handleDown: cyclic grids cross into the previous/next column.
function gridIndex(index: number, count: number, key: string, rtl: boolean): number {
  const horizontal = rtl ? ({ ArrowLeft: "ArrowRight", ArrowRight: "ArrowLeft" }[key] ?? key) : key
  if (horizontal === "ArrowLeft") return index ? index - 1 : count - 1
  if (horizontal === "ArrowRight") return index < count - 1 ? index + 1 : 0
  if (key === "ArrowUp") {
    if (index >= 5) return index - 5
    let next = (index % 5 === 0 ? 4 : index % 5 - 1) + (Math.ceil(count / 5) - 1) * 5
    if (next >= count) next -= 5
    return Math.max(0, next)
  }
  if (key === "ArrowDown") return index + 5 < count ? index + 5 : Math.min((index % 5 + 1) % 5, count - 1)
  if (key === "Home") return index - index % 5
  if (key === "End") {
    let next = index + 4 - index % 5
    while (next >= count) next -= 5 // ItemNavigation.js _getCurrentItem normalizes an incomplete row.
    return Math.max(0, next)
  }
  return index
}

function ColorPalette({ children, className, showDefaultColor = false, defaultColor = "", showRecentColors = false,
  showMoreColors: _showMoreColors, defaultColorText = "Default Color", containerLabel = "Color Palette - Predefined Colors",
  colorLabel = "Color", accessibleName, accessibleNameRef, onItemClick, popupMode = false, ref, ...props }: ColorPaletteProps) {
  const local = usePaletteState()
  const shared = React.useContext(StateContext)
  const state = shared ?? local
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const defaultRef = React.useRef<HTMLButtonElement | null>(null)
  const mainRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const recentRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const items = itemChildren(children)
  const keys = items.map((item, index) => String(item.key ?? index))
  // ColorPalette.js displayedColors filters empty values before applying the 15-item limit.
  const displayed = items.map((item, index) => ({ item, key: keys[index] })).filter(({ item }) => item.props.value).slice(0, 15)
  const declarations = new Map(items.map((item, index) => [keys[index], !!item.props.selected]))
  let selected = state.selection
  const previous = state.declarations.current
  // _ensureSingleSelectionOrDeselectAll scans ALL children, including hidden and empty items.
  if (!previous) {
    const key = [...keys].reverse().find((key) => declarations.get(key))
    selected = key === undefined ? null : { area: "main", key }
  } else {
    if (selected?.area === "main" && (!declarations.has(selected.key) || (previous.get(selected.key) && !declarations.get(selected.key)))) selected = null
    const newlySelected = keys.filter((key) => declarations.get(key) && !previous.get(key))
    if (selected?.area !== "recent" && newlySelected.length) {
      const candidates = new Set([...newlySelected, ...(selected ? [selected.key] : [])])
      selected = { area: "main", key: [...keys].reverse().find((key) => candidates.has(key))! }
    }
  }
  const selectedKey = selected ? `${selected.area}:${selected.key}` : ""
  React.useLayoutEffect(() => {
    state.declarations.current = declarations
    if ((state.selection ? `${state.selection.area}:${state.selection.key}` : "") !== selectedKey) state.setSelection(selected)
  })
  React.useLayoutEffect(() => {
    if (state.focusRecent.current && showRecentColors && state.recent.length) {
      recentRefs.current[0]?.focus()
      state.focusRecent.current = false
    }
  })
  const setRoot = (node: HTMLDivElement | null) => {
    rootRef.current = node
    if (typeof ref === "function") return ref(node)
    if (ref) ref.current = node
  }
  const focus = (area: Area, index: number): boolean => {
    const target = (area === "main" ? mainRefs : recentRefs).current[index]
    if (!target || (area === "recent" && (!showRecentColors || !state.recent[index]))) return false
    if (area === "main") state.setMainIndex(index)
    else state.setRecentIndex(index)
    target.focus()
    return true
  }
  const focusDefault = () => {
    if (!showDefaultColor || !defaultRef.current) return false
    defaultRef.current.focus()
    return true
  }
  const firstMain = () => focus("main", 0)
  const lastMain = () => focus("main", displayed.length - 1)
  const lastFull = () => focus("main", Math.floor(displayed.length / 5) * 5 - 1)
  const firstRecent = () => focus("recent", 0)
  const lastRecent = () => focus("recent", state.recent.length - 1)
  const firstAvailable = (...candidates: (() => boolean)[]) => candidates.some((candidate) => candidate())
  const emit = (color: string) => {
    state.setRecent((recent) => updateRecentColors(recent, color, showRecentColors))
    onItemClick?.({ color })
  }
  const chooseDefault = () => {
    if (!defaultColor) return
    emit(defaultColor)
    // _onDefaultColorClick clears the reopen hint only when a selectedItem existed.
    if (selected) {
      state.setSelection(null)
      state.reopenTarget.current = null
    }
  }
  const select = (area: Area, index: number, mark = true) => {
    const color = area === "main" ? displayed[index]?.item.props.value : state.recent[index]
    if (!color) return
    ;(area === "main" ? mainRefs : recentRefs).current[index]?.focus()
    if (area === "main") state.setMainIndex(index)
    emit(color)
    if (!mark) return // _onColorContainerKeyDown Tab calls selectColor, not handleSelection.
    const next: Selection = { area, key: area === "main" ? displayed[index].key : "0" }
    state.setSelection(next)
    state.reopenTarget.current = next
    if (area === "recent") state.focusRecent.current = true
  }
  const isPlain = (event: React.KeyboardEvent) => !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey
  const handleKey = (event: React.KeyboardEvent<HTMLDivElement>, area: Area, index: number) => {
    if (!isPlain(event)) return
    const key = event.key
    if (!popupMode && (key === "Home" || key === "End")) {
      event.preventDefault(); event.stopPropagation(); return
    }
    if (key === "Enter") { event.preventDefault(); select(area, index); return }
    if (key === " " || key === "Spacebar") { event.preventDefault(); return }
    if (popupMode && area === "main" && key === "Tab") { event.preventDefault(); select(area, index, false); return }
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(key)) return
    const previousKey = key === "ArrowLeft" || key === "ArrowUp"
    const nextKey = key === "ArrowRight" || key === "ArrowDown"
    const count = area === "main" ? displayed.length : state.recent.length
    const hint = state.reopenTarget.current
    if ((key === "ArrowUp" || key === "ArrowDown") && hint && (hint.area === "main" ? displayed.some(({ key }) => key === hint.key) : showRecentColors && !!state.recent[Number(hint.key)])) state.reopenTarget.current = null
    // ColorPalette.js _onColorContainerKeyDown / _onRecentColorsContainerKeyDown fallback order.
    let handled = false
    if (area === "main") {
      if (previousKey && index === 0) handled = firstAvailable(focusDefault, lastRecent, lastFull, lastMain)
      else if ((key === "ArrowRight" && index === count - 1) || (key === "ArrowDown" && (index === Math.floor(count / 5) * 5 - 1 || (count <= 5 && index === count - 1)))) handled = firstAvailable(firstRecent, focusDefault, firstMain)
      else if (key === "Home" && index % 5 === 0) handled = firstAvailable(focusDefault, firstMain)
      else if (key === "End" && ((index + 1) % 5 === 0 || index === count - 1)) handled = firstAvailable(focusDefault, lastMain)
      else if (key === "End" && count % 5 && index >= count - count % 5) handled = lastMain()
    } else {
      if (nextKey && index === count - 1) handled = firstAvailable(focusDefault, firstMain)
      else if (previousKey && index === 0) handled = firstAvailable(lastFull, lastMain, focusDefault)
      else if (key === "End") handled = lastRecent()
    }
    if (handled) { event.preventDefault(); event.stopPropagation(); return }
    // Delegates only navigate when their current item actually owns focus (_canNavigate).
    const current = area === "main" ? state.mainIndex : state.recentIndex
    if (current !== index) return
    event.preventDefault()
    const rtl = rootRef.current ? getComputedStyle(rootRef.current).direction === "rtl" : false
    focus(area, gridIndex(index, count, key, rtl))
  }
  const swatchProps = (area: Area, index: number) => ({
    ref: (node: HTMLDivElement | null) => { (area === "main" ? mainRefs : recentRefs).current[index] = node },
    "data-color-palette-area": area,
    "data-color-palette-key": area === "main" ? displayed[index].key : String(index),
    tabIndex: (area === "main" ? state.mainIndex : state.recentIndex) === index ? 0 : -1,
    onMouseDown: () => area === "main" ? state.setMainIndex(index) : state.setRecentIndex(index),
    onClick: (event: React.MouseEvent<HTMLDivElement>) => { if (!event.defaultPrevented) select(area, index) },
    onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => handleKey(event, area, index),
    onKeyUp: (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isPlain(event) && (event.key === " " || event.key === "Spacebar")) { event.preventDefault(); select(area, index) }
    },
  })
  const name = accessibleName ?? props["aria-label"] ?? (accessibleNameRef && typeof document !== "undefined" ? accessibleNameRef.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ").trim() : "")
  return (
    <div data-slot="color-palette" data-popup-mode={popupMode ? "" : undefined} ref={setRoot} className={cn("fiori-color-palette", className)} {...props}>
      <div className="fiori-color-palette__root">
        {showDefaultColor && <div className="fiori-color-palette__default-wrapper">
          <Button ref={defaultRef} variant="transparent" className="fiori-color-palette__default" onClick={chooseDefault}
            onKeyDown={(event) => {
              if (!isPlain(event)) return
              const key = event.key
              if ((popupMode && key === "Tab") || key === "Enter") { event.preventDefault(); chooseDefault() }
              if (key === " " || key === "Spacebar") event.preventDefault()
              if (key === "ArrowRight" || key === "ArrowDown") { event.preventDefault(); event.stopPropagation(); firstMain() }
              else if (key === "ArrowLeft") { event.preventDefault(); event.stopPropagation(); firstAvailable(lastRecent, lastMain) }
              else if (key === "ArrowUp") { event.preventDefault(); event.stopPropagation(); firstAvailable(lastRecent, lastFull, lastMain) }
              else if (key === "End") { event.preventDefault(); event.stopPropagation(); if (popupMode) lastMain() }
            }}
            onKeyUp={(event) => { if (isPlain(event) && (event.key === " " || event.key === "Spacebar")) { event.preventDefault(); chooseDefault() } }}>
            {defaultColorText}
          </Button><div className="fiori-color-palette__separator" />
        </div>}
        <div className="fiori-color-palette__items" role="group" aria-label={`${containerLabel}${name ? ` ${name}` : ""}`}>
          {displayed.map(({ item, key }, index) => {
            const handlers = swatchProps("main", index)
            return React.cloneElement(item, { ...handlers, key, index: index + 1,
              colorLabel: item.props.colorLabel ?? colorLabel, selected: selected?.area === "main" && selected.key === key,
              onClick: (event) => { item.props.onClick?.(event); handlers.onClick(event) },
              onMouseDown: (event) => { item.props.onMouseDown?.(event); handlers.onMouseDown() },
              onKeyDown: (event) => { item.props.onKeyDown?.(event); if (!event.defaultPrevented) handlers.onKeyDown(event) },
              onKeyUp: (event) => { item.props.onKeyUp?.(event); if (!event.defaultPrevented) handlers.onKeyUp(event) },
            })
          })}
        </div>
        {showRecentColors && <div className="fiori-color-palette__recent-wrapper">
          <div className="fiori-color-palette__separator" />
          <div className="fiori-color-palette__recent">
            {Array.from({ length: 5 }, (_, index) => <ColorPaletteItem key={index} value={state.recent[index] ?? ""} index={index + 1} colorLabel={colorLabel}
              selected={selected?.area === "recent" && selected.key === String(index)}
              {...(state.recent[index] ? swatchProps("recent", index) : { tabIndex: -1, "aria-disabled": true })} />)}
          </div>
        </div>}
      </div>
    </div>
  )
}

export { ColorPalette, ColorPaletteItem, ColorPaletteStateProvider, StateContext as ColorPaletteStateContext, type ColorPaletteProps, type ColorPaletteItemProps }
