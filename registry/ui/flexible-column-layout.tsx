// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by shadcn-fiori: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

// UI5 2.28 FlexibleColumnLayout fastNavigation metadata; UI5Element.onEnterDOM marks this root unless overridden.

import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { slimArrowLeft, slimArrowRight, verticalGrip } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"

// Mirrors ui5-flexible-column-layout (UI5 Web Components 2.28, Horizon): up to three columns
// (list - detail - detail-detail) whose proportions depend on `layout` and on the component's own
// width (phone <= 599px: 1 column, tablet <= 1023px: 2 columns, desktop: 3 columns). Separators can be
// dragged (min column width 248px) or moved with the keyboard; the start separator of the three-column
// layouts carries an arrow that hides / reveals the start column. Column width changes animate like UI5.

// ---------------------------------------------------------------------------------------------
// Layout tables (fcl-utils/FCLLayout.js)

type FCLLayout =
  | "OneColumn"
  | "TwoColumnsStartExpanded"
  | "TwoColumnsMidExpanded"
  | "ThreeColumnsMidExpanded"
  | "ThreeColumnsEndExpanded"
  | "ThreeColumnsStartExpandedEndHidden"
  | "ThreeColumnsMidExpandedEndHidden"
  | "ThreeColumnsStartHiddenMidExpanded"
  | "ThreeColumnsStartHiddenEndExpanded"
  | "MidColumnFullScreen"
  | "EndColumnFullScreen"

type FCLMedia = "phone" | "tablet" | "desktop"

/** Column widths, e.g. ["25%", "50%", "25%"]; hidden columns are "0px" (or 0). */
type FCLColumnLayout = (string | number)[]

type SeparatorInfo = { visible: boolean; gripVisible?: boolean; arrowVisible?: boolean; arrowDirection?: "forward" | "backward" }
type LayoutInfo = { layout: FCLColumnLayout; separators: [SeparatorInfo, SeparatorInfo] }

const HIDDEN: SeparatorInfo = { visible: false }
const GRIP: SeparatorInfo = { visible: true, gripVisible: true }
const info = (layout: FCLColumnLayout, start: SeparatorInfo = HIDDEN, end: SeparatorInfo = HIDDEN): LayoutInfo => ({ layout, separators: [start, end] })

const DEFAULT_LAYOUTS: Record<FCLMedia, Record<FCLLayout, LayoutInfo>> = {
  desktop: {
    OneColumn: info(["100%", "0px", "0px"]),
    TwoColumnsStartExpanded: info(["67%", "33%", "0px"], GRIP),
    TwoColumnsMidExpanded: info(["33%", "67%", "0px"], GRIP),
    ThreeColumnsMidExpanded: info(["25%", "50%", "25%"], { visible: true, gripVisible: true, arrowVisible: true, arrowDirection: "backward" }, GRIP),
    ThreeColumnsEndExpanded: info(["25%", "25%", "50%"], { visible: true, gripVisible: false, arrowVisible: true, arrowDirection: "backward" }, GRIP),
    ThreeColumnsStartExpandedEndHidden: info(["67%", "33%", "0px"], GRIP),
    ThreeColumnsMidExpandedEndHidden: info(["33%", "67%", "0px"], GRIP, GRIP),
    ThreeColumnsStartHiddenMidExpanded: info(["0px", "67%", "33%"], { visible: true, gripVisible: true, arrowVisible: true, arrowDirection: "forward" }, GRIP),
    ThreeColumnsStartHiddenEndExpanded: info(["0px", "33%", "67%"], { visible: true, gripVisible: false, arrowVisible: true, arrowDirection: "forward" }, GRIP),
    MidColumnFullScreen: info(["0px", "100%", "0px"]),
    EndColumnFullScreen: info(["0px", "0px", "100%"]),
  },
  tablet: {
    OneColumn: info(["100%", "0px", "0px"]),
    TwoColumnsStartExpanded: info(["67%", "33%", "0px"], GRIP),
    TwoColumnsMidExpanded: info(["33%", "67%", "0px"], GRIP),
    ThreeColumnsMidExpanded: info(["0px", "67%", "33%"], GRIP, GRIP),
    ThreeColumnsEndExpanded: info(["0px", "33%", "67%"], HIDDEN, GRIP),
    ThreeColumnsStartExpandedEndHidden: info(["67%", "33%", "0px"], GRIP),
    ThreeColumnsMidExpandedEndHidden: info(["33%", "67%", "0px"], GRIP, GRIP),
    ThreeColumnsStartHiddenMidExpanded: info(["0px", "67%", "33%"], GRIP, GRIP),
    ThreeColumnsStartHiddenEndExpanded: info(["0px", "33%", "67%"], HIDDEN, GRIP),
    MidColumnFullScreen: info(["0px", "100%", "0px"]),
    EndColumnFullScreen: info(["0px", "0px", "100%"]),
  },
  phone: {
    OneColumn: info(["100%", "0px", "0px"]),
    TwoColumnsStartExpanded: info(["0px", "100%", "0px"]),
    TwoColumnsMidExpanded: info(["0px", "100%", "0px"]),
    ThreeColumnsMidExpanded: info(["0px", "0px", "100%"]),
    ThreeColumnsEndExpanded: info(["0px", "0px", "100%"]),
    ThreeColumnsStartExpandedEndHidden: info(["0px", "0px", "100%"]),
    ThreeColumnsMidExpandedEndHidden: info(["0px", "0px", "100%"]),
    ThreeColumnsStartHiddenMidExpanded: info(["0px", "0px", "100%"]),
    ThreeColumnsStartHiddenEndExpanded: info(["0px", "0px", "100%"]),
    MidColumnFullScreen: info(["0px", "100%", "0px"]),
    EndColumnFullScreen: info(["0px", "0px", "100%"]),
  },
}

const NEXT_LAYOUT_BY_ARROW: Partial<Record<FCLLayout, FCLLayout>> = {
  ThreeColumnsMidExpanded: "ThreeColumnsStartHiddenMidExpanded",
  ThreeColumnsEndExpanded: "ThreeColumnsStartHiddenEndExpanded",
  ThreeColumnsStartHiddenMidExpanded: "ThreeColumnsMidExpanded",
  ThreeColumnsStartHiddenEndExpanded: "ThreeColumnsEndExpanded",
}

const BREAKPOINTS = { PHONE: 599, TABLET: 1023 }
const COLUMN_MIN_WIDTH = 248
const ANIMATION_DURATION = 560
const SEPARATOR_DEFAULT_VALUES = { START: 50, END: 75 }
const START = 0
const MID = 1
const END = 2

const mediaFor = (width: number): FCLMedia => (width <= BREAKPOINTS.PHONE ? "phone" : width <= BREAKPOINTS.TABLET ? "tablet" : "desktop")
const isHidden = (w: string | number | undefined) => w === 0 || w === "0px"
const maxColumnsFor = (media: FCLMedia) => (media === "phone" ? 1 : media === "tablet" ? 2 : 3)

// ---------------------------------------------------------------------------------------------
// Public types

type FCLLayoutsConfiguration = Partial<Record<"tablet" | "desktop", Partial<Record<FCLLayout, { layout: FCLColumnLayout }>>>>

type FCLAreaAttributes = { role?: "none" | "complementary" | "contentinfo" | "main" | "region"; name?: string }
type FCLSeparatorAttributes = { role?: string; name?: string }

type FCLAccessibilityAttributes = {
  startColumn?: FCLAreaAttributes
  midColumn?: FCLAreaAttributes
  endColumn?: FCLAreaAttributes
  startSeparator?: FCLSeparatorAttributes
  endSeparator?: FCLSeparatorAttributes
  /** Tooltip / accessible name of the start separator's arrow (UI5 falls back to startSeparator.name). */
  startArrow?: { name?: string }
}

type FCLLayoutChangeDetail = {
  layout: FCLLayout
  columnLayout: FCLColumnLayout
  startColumnVisible: boolean
  midColumnVisible: boolean
  endColumnVisible: boolean
  /** The layout was changed by the separators (drag, keyboard or arrow). */
  separatorsUsed: boolean
  /** The layout was changed by resizing the whole component. */
  resized: boolean
  media: FCLMedia
  /** 1 (phone), 2 (tablet) or 3 (desktop). */
  maxColumnsCount: number
}

type FCLLayoutConfigurationChangeDetail = { layout: FCLLayout; media: FCLMedia; columnLayout: FCLColumnLayout }

type FlexibleColumnLayoutProps = Omit<React.ComponentProps<"div">, "children"> & {
  layout?: FCLLayout
  defaultLayout?: FCLLayout
  onLayoutChange?: (detail: FCLLayoutChangeDetail) => void
  startColumn?: React.ReactNode
  midColumn?: React.ReactNode
  endColumn?: React.ReactNode
  /** Disables separator dragging / keyboard resizing and hides grips and the arrow. */
  disableResizing?: boolean
  /** Custom column proportions per media and layout (user drags are stored here too). */
  layoutsConfiguration?: FCLLayoutsConfiguration
  onLayoutConfigurationChange?: (detail: FCLLayoutConfigurationChangeDetail) => void
  /** Fired on mount and whenever the width crosses a breakpoint. */
  onMediaChange?: (media: FCLMedia, maxColumnsCount: number) => void
  accessibilityAttributes?: FCLAccessibilityAttributes
  /** Turns off the column width animation (UI5 AnimationMode "None"). */
  disableAnimation?: boolean
}

const DEFAULT_TEXTS = {
  startColumn: "First column",
  midColumn: "Middle column",
  endColumn: "Last column",
  startSeparator: "Resize between start and mid columns",
  endSeparator: "Resize between mid and end columns",
  startArrow: "Switch between start and middle column layouts",
}

// ---------------------------------------------------------------------------------------------
// Engine: the column layout math of FlexibleColumnLayout.js, on a plain mutable object.

type Engine = {
  width: number
  /** Width of a separator (1rem). */
  sepWidth: number
  layout: FCLLayout
  /** Layout while a separator is being moved (UI5 separatorMovementSession.tmpFCLLayout). */
  tmpLayout: FCLLayout | null
  columnLayout: FCLColumnLayout | null
  config: FCLLayoutsConfiguration
  rtl: boolean
}

const effectiveLayout = (e: Engine) => e.tmpLayout ?? e.layout
const media = (e: Engine) => mediaFor(e.width)
const separatorsInfo = (e: Engine) => DEFAULT_LAYOUTS[media(e)][effectiveLayout(e)].separators

function availableWidth(e: Engine) {
  const [s, en] = separatorsInfo(e)
  return e.width - (s.visible ? e.sepWidth : 0) - (en.visible ? e.sepWidth : 0)
}

function toPx(e: Engine, w: string | number) {
  if (typeof w === "number") return w
  const v = parseFloat(w)
  return w.endsWith("%") ? (availableWidth(e) / 100) * v : v
}

function toRel(e: Engine, px: string | number): string {
  if (typeof px === "string") return px
  if (px === 0) return "0px"
  return `${(px / availableWidth(e)) * 100}%`
}

function adjustColumnsToMinimumWidth(px: number[]) {
  const adjusted = [...px]
  let deficit = 0
  adjusted.forEach((w, i) => {
    if (!isHidden(w) && Math.ceil(w) < COLUMN_MIN_WIDTH) {
      deficit += COLUMN_MIN_WIDTH - w
      adjusted[i] = COLUMN_MIN_WIDTH
    }
  })
  if (deficit === 0) return adjusted
  const above = px.map((w) => (w > COLUMN_MIN_WIDTH ? w - COLUMN_MIN_WIDTH : 0))
  const total = above.reduce((a, b) => a + b, 0)
  const proportions = total === 0 ? above : above.map((w) => w / total)
  adjusted.forEach((w, i) => {
    if (w > 0 && proportions[i] > 0) adjusted[i] -= deficit * proportions[i]
  })
  return adjusted
}

function verifyColumnWidthsMatchLayout(e: Engine, px: number[]) {
  const [start, mid, end] = px
  const startPercent = parseInt(toRel(e, start))
  const m = media(e)
  switch (e.layout) {
    case "TwoColumnsStartExpanded":
      return start >= mid
    case "TwoColumnsMidExpanded":
      return mid > start
    case "ThreeColumnsEndExpanded":
      return end > mid && startPercent < 33
    case "ThreeColumnsStartExpandedEndHidden":
      return start >= mid && end === 0
    case "ThreeColumnsMidExpanded":
      return mid >= end && ((m === "desktop" && startPercent < 33) || (m === "tablet" && startPercent === 0))
    case "ThreeColumnsMidExpandedEndHidden":
      return mid > start && end === 0 && ((m === "desktop" && startPercent >= 33) || (m === "tablet" && start >= COLUMN_MIN_WIDTH))
  }
  return false
}

function customColumnLayout(e: Engine, layout: FCLLayout) {
  const m = media(e)
  if (m === "phone") return undefined
  const custom = e.config[m]?.[layout]?.layout
  if (!custom) return undefined
  const compliant = adjustColumnsToMinimumWidth(custom.map((w) => toPx(e, w))).map((w) => toRel(e, w))
  const px = compliant.map((w) => toPx(e, w))
  if (Math.round(px.reduce((a, b) => a + b, 0)) !== Math.round(availableWidth(e))) return undefined
  return verifyColumnWidthsMatchLayout(e, px) ? compliant : undefined
}

const nextColumnLayout = (e: Engine, layout: FCLLayout): FCLColumnLayout =>
  customColumnLayout(e, layout) ?? [...DEFAULT_LAYOUTS[media(e)][layout].layout]

function calculateNewColumnWidth(e: Engine, column: number, delta: number) {
  const px = e.columnLayout!.map((w) => toPx(e, w))
  const newWidth = px[column] + delta
  const adjacentNewWidth = px[MID] - delta
  if (newWidth < COLUMN_MIN_WIDTH) return COLUMN_MIN_WIDTH
  if (adjacentNewWidth < COLUMN_MIN_WIDTH) return newWidth - (COLUMN_MIN_WIDTH - adjacentNewWidth)
  return newWidth
}

function adjustColumnLayout(e: Engine, column: number, size: number) {
  const px = e.columnLayout!.map((w) => toPx(e, w))
  px[column] = size
  px[MID] = availableWidth(e) - px[START] - px[END]
  return px.map((w) => toRel(e, w))
}

function nextLayoutOnSeparatorMovement(e: Engine, separator: "start" | "end", forward: boolean, before: FCLLayout, after: FCLColumnLayout): FCLLayout {
  const moved = (sep: "start" | "end", from: FCLLayout, fwd: boolean) => from === before && sep === separator && fwd === forward
  const [start, mid, end] = after.map((w) => toPx(e, w))
  const startPercent = (start / e.width) * 100
  const tablet = media(e) === "tablet"
  if (moved("start", "TwoColumnsMidExpanded", true) && start >= mid) return "TwoColumnsStartExpanded"
  if (moved("start", "TwoColumnsStartExpanded", false) && start < mid) return "TwoColumnsMidExpanded"
  if (moved("start", "ThreeColumnsMidExpanded", true) && startPercent >= 33) return "ThreeColumnsMidExpandedEndHidden"
  if (moved("start", "ThreeColumnsMidExpandedEndHidden", false) && !tablet && startPercent < 33) return "ThreeColumnsMidExpanded"
  if (moved("start", "ThreeColumnsStartHiddenMidExpanded", true) && !tablet && Math.ceil(start) >= COLUMN_MIN_WIDTH) return "ThreeColumnsMidExpanded"
  if (moved("end", "ThreeColumnsStartHiddenMidExpanded", false) && mid < end) return "ThreeColumnsStartHiddenEndExpanded"
  if (moved("end", "ThreeColumnsStartHiddenEndExpanded", true) && mid >= end) return "ThreeColumnsStartHiddenMidExpanded"
  if (moved("end", "ThreeColumnsMidExpandedEndHidden", false) && Math.ceil(end) >= COLUMN_MIN_WIDTH) return "ThreeColumnsMidExpanded"
  if (moved("end", "ThreeColumnsMidExpanded", false) && mid < end) return "ThreeColumnsEndExpanded"
  if (moved("end", "ThreeColumnsEndExpanded", true) && mid >= end) return "ThreeColumnsMidExpanded"
  if (moved("start", "ThreeColumnsMidExpandedEndHidden", true) && start >= mid) return "ThreeColumnsStartExpandedEndHidden"
  if (moved("start", "ThreeColumnsStartExpandedEndHidden", false) && start < mid) return "ThreeColumnsMidExpandedEndHidden"
  if (moved("start", "ThreeColumnsMidExpanded", true) && tablet && Math.ceil(start) >= COLUMN_MIN_WIDTH) return "ThreeColumnsMidExpandedEndHidden"
  if (moved("end", "ThreeColumnsMidExpandedEndHidden", false) && tablet && Math.ceil(end) >= COLUMN_MIN_WIDTH) return "ThreeColumnsMidExpanded"
  return before
}

/** Moves a separator by offsetX pixels (start-to-end positive); returns the layout after the move. */
function moveSeparator(e: Engine, separator: "start" | "end", offsetX: number, before: FCLLayout): FCLLayout {
  if (e.rtl) offsetX = -offsetX
  const column = separator === "start" ? START : END
  const delta = separator === "start" ? offsetX : -offsetX
  const newWidth = calculateNewColumnWidth(e, column, delta)
  const newColumnLayout = adjustColumnLayout(e, column, newWidth)
  const next = nextLayoutOnSeparatorMovement(e, separator, offsetX > 0, before, newColumnLayout)
  if (next !== before) {
    e.tmpLayout = next
    e.columnLayout = nextColumnLayout(e, next)
  }
  e.columnLayout = adjustColumnLayout(e, column, newWidth)
  return next
}

// ---------------------------------------------------------------------------------------------
// Component

type ColumnState = { width?: string; collapsing: boolean }

function FlexibleColumnLayout({
  layout: layoutProp,
  defaultLayout = "OneColumn",
  onLayoutChange,
  startColumn,
  midColumn,
  endColumn,
  disableResizing = false,
  layoutsConfiguration,
  onLayoutConfigurationChange,
  onMediaChange,
  accessibilityAttributes = {},
  disableAnimation = false,
  className,
  ...props
}: FlexibleColumnLayoutProps) {
  const [innerLayout, setInnerLayout] = React.useState(defaultLayout)
  const layout = layoutProp ?? innerLayout
  const rootRef = React.useRef<HTMLDivElement>(null)
  const engine = React.useRef<Engine>({ width: 0, sepWidth: 16, layout, tmpLayout: null, columnLayout: null, config: structuredClone(layoutsConfiguration ?? {}), rtl: false })
  const [, rerender] = React.useReducer((n: number) => n + 1, 0)
  const [columns, setColumns] = React.useState<ColumnState[]>([{ collapsing: false }, { collapsing: false }, { collapsing: false }])
  const [resizing, setResizing] = React.useState<"start" | "end" | null>(null)
  const initial = React.useRef(true)
  const prevLayout = React.useRef<FCLLayout | null>(null)
  const prevConfig = React.useRef(layoutsConfiguration)
  const prevMedia = React.useRef<FCLMedia | null>(null)
  const session = React.useRef<{ separator: "start" | "end"; cursorX: number; pointerId?: number } | null>(null)
  const timers = React.useRef<number[]>([])
  const separatorRefs = { start: React.useRef<HTMLDivElement>(null), end: React.useRef<HTMLDivElement>(null) }
  const columnRefs = [React.useRef<HTMLDivElement>(null), React.useRef<HTMLDivElement>(null), React.useRef<HTMLDivElement>(null)]

  const callbacks = React.useRef({ onLayoutChange, onLayoutConfigurationChange, onMediaChange, setInnerLayout, controlled: layoutProp !== undefined })
  callbacks.current = { onLayoutChange, onLayoutConfigurationChange, onMediaChange, setInnerLayout, controlled: layoutProp !== undefined }
  const animated = !disableAnimation

  /** UI5 toggleColumns: applies engine.columnLayout to the column DOM state (collapse animates). */
  const toggleColumns = React.useCallback(() => {
    const cl = engine.current.columnLayout!
    const animate = animated && !initial.current
    setColumns((prev) => {
      const next = prev.map((c, i): ColumnState => {
        const w = cl[i]
        const wStr = typeof w === "number" ? `${w}px` : w
        const wasHidden = c.width === undefined || isHidden(c.width)
        if (isHidden(w) && wasHidden) return c.width === undefined ? { width: "0px", collapsing: false } : c
        if (isHidden(w)) {
          // Fallback in case transitionend never fires.
          if (animate) timers.current.push(window.setTimeout(() => setColumns((p) => p.map((x, j) => (j === i && x.collapsing && isHidden(x.width) ? { ...x, collapsing: false } : x))), ANIMATION_DURATION + 100))
          return { width: "0px", collapsing: animate }
        }
        return c.width === wStr && !c.collapsing ? c : { width: wStr, collapsing: false }
      })
      return next.every((c, i) => c === prev[i]) ? prev : next
    })
  }, [animated]) // eslint-disable-line react-hooks/exhaustive-deps

  const detail = React.useCallback((separatorsUsed: boolean, resized: boolean): FCLLayoutChangeDetail => {
    const e = engine.current
    const cl = [...(e.columnLayout ?? [])]
    const m = media(e)
    return {
      layout: e.layout,
      columnLayout: cl,
      startColumnVisible: !isHidden(cl[0]),
      midColumnVisible: !isHidden(cl[1]),
      endColumnVisible: !isHidden(cl[2]),
      separatorsUsed,
      resized,
      media: m,
      maxColumnsCount: maxColumnsFor(m),
    }
  }, [])

  const updateLayout = React.useCallback(() => {
    const e = engine.current
    e.columnLayout = nextColumnLayout(e, effectiveLayout(e))
    toggleColumns()
    rerender()
  }, [toggleColumns])

  const measure = React.useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const e = engine.current
    e.width = root.getBoundingClientRect().width
    e.sepWidth = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    e.rtl = getComputedStyle(root).direction === "rtl"
    const m = media(e)
    if (prevMedia.current !== m) {
      prevMedia.current = m
      callbacks.current.onMediaChange?.(m, maxColumnsFor(m))
    }
  }, [])

  // Initial rendering + layout / configuration sync (UI5 onAfterRendering).
  React.useLayoutEffect(() => {
    const e = engine.current
    e.layout = layout
    if (layoutsConfiguration !== prevConfig.current) {
      prevConfig.current = layoutsConfiguration
      e.config = structuredClone(layoutsConfiguration ?? {})
      if (!initial.current && !session.current && nextColumnLayout(e, layout).join() !== e.columnLayout?.join()) updateLayout()
    }
    if (initial.current) {
      measure()
      prevLayout.current = layout
      updateLayout()
      initial.current = false
      return
    }
    if (prevLayout.current !== layout) {
      prevLayout.current = layout
      if (!session.current) updateLayout()
    }
  }, [layout, layoutsConfiguration, measure, updateLayout])

  // Container resize (UI5 handleResize).
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ro = new ResizeObserver(() => {
      if (initial.current) return
      const e = engine.current
      const before = e.columnLayout?.join()
      measure()
      updateLayout()
      if (before !== e.columnLayout?.join()) callbacks.current.onLayoutChange?.(detail(false, true))
    })
    ro.observe(root)
    return () => ro.disconnect()
  }, [measure, updateLayout, detail])

  React.useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const commitLayout = (next: FCLLayout) => {
    const e = engine.current
    e.layout = next
    prevLayout.current = next
    if (!callbacks.current.controlled) callbacks.current.setInnerLayout(next)
  }

  // --- Separator movement session -----------------------------------------------------------

  const startSession = (separator: "start" | "end", cursorX: number) => {
    session.current = { separator, cursorX }
    engine.current.tmpLayout = engine.current.layout
    setResizing(separator)
  }

  const endSession = () => {
    const s = session.current
    if (!s) return
    const e = engine.current
    const newLayout = e.tmpLayout ?? e.layout
    const newColumnLayout = [...(e.columnLayout ?? [])]
    const m = media(e)
    const old = customColumnLayout({ ...e, tmpLayout: null }, newLayout)
    e.tmpLayout = null
    if (e.layout !== newLayout) {
      commitLayout(newLayout)
      callbacks.current.onLayoutChange?.(detail(true, false))
    }
    if (old?.join() !== newColumnLayout.join()) {
      if (m !== "phone") {
        const cfg = (e.config[m] ??= {})
        cfg[newLayout] = { layout: newColumnLayout }
      }
      callbacks.current.onLayoutConfigurationChange?.({ layout: newLayout, media: m, columnLayout: newColumnLayout })
    }
    session.current = null
    setResizing(null)
    separatorRefs[s.separator].current?.focus({ preventScroll: true })
    rerender()
  }

  const move = (separator: "start" | "end", offsetX: number) => {
    const e = engine.current
    const before = e.tmpLayout ?? e.layout
    e.tmpLayout = moveSeparator(e, separator, offsetX, before)
    toggleColumns()
    rerender()
  }

  const showGrip = (sep: "start" | "end") => !disableResizing && !!engine.current.columnLayout && !!separatorsInfo(engine.current)[sep === "start" ? 0 : 1].gripVisible

  const onSeparatorPointerDown = (sep: "start" | "end") => (ev: React.PointerEvent<HTMLDivElement>) => {
    if ((ev.target as HTMLElement).closest("[data-slot=button]")) return
    if (ev.button !== 0 || !showGrip(sep)) return
    ev.currentTarget.setPointerCapture?.(ev.pointerId)
    startSession(sep, ev.pageX)
    session.current!.pointerId = ev.pointerId
  }

  const onSeparatorPointerMove = (ev: React.PointerEvent<HTMLDivElement>) => {
    const s = session.current
    if (!s || s.pointerId !== ev.pointerId) return
    ev.preventDefault()
    const delta = ev.pageX - s.cursorX
    if (!delta) return
    const sepX = ev.currentTarget.getBoundingClientRect().x + window.scrollX
    const forward = delta > 0
    // The separator was re-laid-out away from the cursor (layout switched): wait for the cursor to catch up.
    if (forward ? sepX > ev.pageX : sepX < ev.pageX) {
      s.cursorX = ev.pageX
      return
    }
    move(s.separator, delta)
    s.cursorX = ev.pageX
  }

  const onSeparatorPointerUp = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (session.current?.pointerId === ev.pointerId) endSession()
  }

  const onSeparatorKeyDown = (sep: "start" | "end") => (ev: React.KeyboardEvent<HTMLDivElement>) => {
    if (ev.target !== ev.currentTarget || !showGrip(sep)) return
    const e = engine.current
    const step = 2
    const big = e.width
    const mods = ev.ctrlKey || ev.altKey || ev.metaKey
    let offset = 0
    if (mods) return
    if (ev.key === "ArrowLeft") offset = ev.shiftKey ? -step : -step * 10
    else if (ev.key === "ArrowRight") offset = ev.shiftKey ? step : step * 10
    else if (ev.key === "Home" && !ev.shiftKey) offset = e.rtl ? big : -big
    else if (ev.key === "End" && !ev.shiftKey) offset = e.rtl ? -big : big
    if (!offset) return
    ev.preventDefault()
    if (!session.current) startSession(sep, 0)
    move(sep, offset)
  }

  const onSeparatorKeyUp = () => {
    if (session.current && session.current.pointerId === undefined) endSession()
  }

  const onArrowClick = () => {
    const e = engine.current
    const next = NEXT_LAYOUT_BY_ARROW[e.layout]
    if (!next || next === e.layout) return
    commitLayout(next)
    e.columnLayout = nextColumnLayout(e, next)
    toggleColumns()
    rerender()
    callbacks.current.onLayoutChange?.(detail(true, false))
  }

  // --- Render -------------------------------------------------------------------------------

  const e = engine.current
  const ready = e.columnLayout !== null
  const seps = ready ? separatorsInfo(e) : [HIDDEN, HIDDEN]
  const cl = e.columnLayout ?? ["100%", "0px", "0px"]
  const visible = cl.map((w) => !isHidden(w))
  const a = accessibilityAttributes
  const startGrip = !disableResizing && !!seps[0].gripVisible
  const endGrip = !disableResizing && !!seps[1].gripVisible
  const startArrow = !disableResizing && !!seps[0].arrowVisible
  const startValue = typeof cl[0] === "string" && cl[0].endsWith("%") ? parseInt(cl[0]) : SEPARATOR_DEFAULT_VALUES.START
  const endValue =
    typeof cl[0] === "string" && cl[0].endsWith("%") && typeof cl[1] === "string" && cl[1].endsWith("%")
      ? parseInt(cl[0]) + parseInt(cl[1])
      : SEPARATOR_DEFAULT_VALUES.END

  const areas = [
    { key: "start", attrs: a.startColumn, text: DEFAULT_TEXTS.startColumn, content: startColumn },
    { key: "mid", attrs: a.midColumn, text: DEFAULT_TEXTS.midColumn, content: midColumn },
    { key: "end", attrs: a.endColumn, text: DEFAULT_TEXTS.endColumn, content: endColumn },
  ] as const

  const column = (i: number) => {
    const area = areas[i]
    const st = columns[i]
    const hidden = !visible[i]
    const role = area.attrs?.role ?? "region"
    // During a drag the columns next to the moved separator don't animate (UI5 toggleSideAnimations).
    const sideOfDrag = resizing === "start" ? i <= MID : resizing === "end" ? i >= MID : false
    return (
      <div
        ref={columnRefs[i]}
        data-slot={`flexible-column-layout-${area.key}-column`}
        className="fiori-fcl__column"
        role={hidden ? undefined : role}
        aria-label={hidden || role === "none" ? undefined : (area.attrs?.name ?? area.text)}
        aria-hidden={hidden || undefined}
        inert={hidden || undefined}
        data-animated={animated && !sideOfDrag ? "" : undefined}
        data-collapsing={st.collapsing ? "" : undefined}
        data-hidden={hidden && !st.collapsing ? "" : undefined}
        style={st.width !== undefined ? { width: st.width } : undefined}
        onTransitionEnd={(ev) => {
          if (ev.target === ev.currentTarget && ev.propertyName === "width" && st.collapsing)
            setColumns((p) => p.map((x, j) => (j === i ? { ...x, collapsing: false } : x)))
        }}
      >
        {area.content}
      </div>
    )
  }

  const grip = (shown: boolean) => (
    <div className="fiori-fcl__grip" style={{ display: shown ? "flex" : "none" }}>
      <Icon icon={verticalGrip} className="fiori-fcl__grip-icon" />
    </div>
  )

  const separatorProps = (sep: "start" | "end", shown: boolean, gripShown: boolean, value: number) => {
    const attrs = sep === "start" ? a.startSeparator : a.endSeparator
    const defaultName = sep === "start" ? DEFAULT_TEXTS.startSeparator : DEFAULT_TEXTS.endSeparator
    return {
      ref: separatorRefs[sep],
      "data-slot": `flexible-column-layout-${sep}-separator`,
      className: cn("fiori-fcl__separator", gripShown && "touch-none"),
      role: attrs?.role ?? "separator",
      // UI5 names the start separator only while it can be resized; the end separator always.
      "aria-label": attrs?.name ?? (sep === "end" || gripShown ? defaultName : undefined),
      "aria-valuenow": gripShown ? value : undefined,
      "aria-orientation": "vertical" as const,
      tabIndex: gripShown ? 0 : undefined,
      style: { display: shown ? "flex" : "none" },
      onPointerDown: onSeparatorPointerDown(sep),
      onPointerMove: onSeparatorPointerMove,
      onPointerUp: onSeparatorPointerUp,
      onPointerCancel: onSeparatorPointerUp,
      onKeyDown: onSeparatorKeyDown(sep),
      onKeyUp: onSeparatorKeyUp,
    }
  }

  const arrowText = a.startArrow?.name ?? a.startSeparator?.name ?? DEFAULT_TEXTS.startArrow

  return (
    <div
      ref={rootRef}
      data-slot="flexible-column-layout" data-sap-ui-fastnavgroup="true"
      data-layout={layout}
      data-media={ready ? media(e) : undefined}
      data-resizing={resizing ? "" : undefined}
      className={cn("fiori-fcl", className)}
      {...props}
    >
      <div className="fiori-fcl__root">
        {column(START)}
        <div {...separatorProps("start", seps[0].visible, startGrip, startValue)}>
          {startArrow && (
            <Button
              variant="transparent"
              size="icon"
              className="fiori-fcl__arrow absolute top-4 z-10 size-6 min-w-6 will-change-transform"
              aria-label={arrowText}
              title={arrowText}
              onClick={onArrowClick}
            >
              <Icon icon={seps[0].arrowDirection === "backward" ? slimArrowLeft : slimArrowRight} />
            </Button>
          )}
          {grip(startGrip)}
        </div>
        {column(MID)}
        <div {...separatorProps("end", seps[1].visible, endGrip, endValue)}>{grip(endGrip)}</div>
        {column(END)}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// useFlexibleColumnLayout: Fiori navigation semantics (SAPUI5 FlexibleColumnLayoutSemanticHelper).

type FCLColumnActions = {
  /** Present when the column can go full screen. */
  fullScreen?: () => void
  /** Present when the column is full screen. */
  exitFullScreen?: () => void
  /** Present when the column can be closed. */
  closeColumn?: () => void
}

type UseFlexibleColumnLayoutOptions = {
  initialLayout?: FCLLayout
  /** Layout used when navigating to level 1 (default TwoColumnsStartExpanded, as SAPUI5). */
  defaultTwoColumnLayout?: "TwoColumnsStartExpanded" | "TwoColumnsMidExpanded"
  /** Layout used when navigating to level 2 (default ThreeColumnsMidExpanded). */
  defaultThreeColumnLayout?: "ThreeColumnsMidExpanded" | "ThreeColumnsEndExpanded"
  /** Caps the number of columns (1-3); the component's width caps it further. */
  maxColumnsCount?: number
}

const TWO_COLUMN_LAYOUTS: FCLLayout[] = ["TwoColumnsStartExpanded", "TwoColumnsMidExpanded"]
const THREE_COLUMN_LAYOUTS: FCLLayout[] = [
  "ThreeColumnsMidExpanded",
  "ThreeColumnsEndExpanded",
  "ThreeColumnsStartExpandedEndHidden",
  "ThreeColumnsMidExpandedEndHidden",
  "ThreeColumnsStartHiddenMidExpanded",
  "ThreeColumnsStartHiddenEndExpanded",
]

/** Navigation level a layout represents: 0 = list only, 1 = list + detail, 2 = detail-detail. */
function levelOf(layout: FCLLayout) {
  if (layout === "OneColumn") return 0
  if (TWO_COLUMN_LAYOUTS.includes(layout) || layout === "MidColumnFullScreen") return 1
  return 2
}

function useFlexibleColumnLayout({
  initialLayout = "OneColumn",
  defaultTwoColumnLayout = "TwoColumnsStartExpanded",
  defaultThreeColumnLayout = "ThreeColumnsMidExpanded",
  maxColumnsCount = 3,
}: UseFlexibleColumnLayoutOptions = {}) {
  const [layout, setLayout] = React.useState<FCLLayout>(initialLayout)
  const [mediaColumns, setMediaColumns] = React.useState(3)
  const [visibility, setVisibility] = React.useState<{ start: boolean; mid: boolean; end: boolean } | null>(null)
  // Remembered so "exit full screen" returns to the layout the user came from.
  const lastTwo = React.useRef<FCLLayout>(defaultTwoColumnLayout)
  const lastThree = React.useRef<FCLLayout>(defaultThreeColumnLayout)
  if (TWO_COLUMN_LAYOUTS.includes(layout)) lastTwo.current = layout
  if (THREE_COLUMN_LAYOUTS.includes(layout)) lastThree.current = layout

  const maxColumns = Math.max(1, Math.min(maxColumnsCount, mediaColumns))

  /** SAPUI5 getNextUIState(level).layout */
  const layoutForLevel = React.useCallback(
    (level: number, current: FCLLayout): FCLLayout => {
      if (level <= 0) return "OneColumn"
      if (level === 1) {
        if (maxColumns === 1) return "MidColumnFullScreen"
        if (current === "MidColumnFullScreen" || current === "EndColumnFullScreen") return "MidColumnFullScreen"
        return TWO_COLUMN_LAYOUTS.includes(current) ? current : defaultTwoColumnLayout
      }
      if (level === 2 && (current === "MidColumnFullScreen" || current === "EndColumnFullScreen")) return "EndColumnFullScreen"
      if (level === 2 && maxColumns >= 2) {
        return THREE_COLUMN_LAYOUTS.includes(current) ? current : defaultThreeColumnLayout
      }
      return "EndColumnFullScreen"
    },
    [maxColumns, defaultTwoColumnLayout, defaultThreeColumnLayout]
  )

  const navigate = React.useCallback((level: number) => setLayout((cur) => layoutForLevel(level, cur)), [layoutForLevel])

  const isFullScreen = layout === "MidColumnFullScreen" || layout === "EndColumnFullScreen"
  const level = levelOf(layout)
  const multi = maxColumns > 1
  const midColumn: FCLColumnActions = {}
  const endColumn: FCLColumnActions = {}
  if (multi) {
    if (TWO_COLUMN_LAYOUTS.includes(layout)) midColumn.fullScreen = () => setLayout("MidColumnFullScreen")
    if (layout === "MidColumnFullScreen") midColumn.exitFullScreen = () => setLayout(lastTwo.current)
    if (THREE_COLUMN_LAYOUTS.includes(layout)) endColumn.fullScreen = () => setLayout("EndColumnFullScreen")
    if (layout === "EndColumnFullScreen") endColumn.exitFullScreen = () => setLayout(lastThree.current)
  }
  if (level === 1) midColumn.closeColumn = () => setLayout("OneColumn")
  if (level === 2) endColumn.closeColumn = () => setLayout(multi && layout !== "EndColumnFullScreen" ? lastTwo.current : "MidColumnFullScreen")

  const layoutProps = {
    layout,
    onLayoutChange: (d: FCLLayoutChangeDetail) => {
      setLayout(d.layout)
      setVisibility({ start: d.startColumnVisible, mid: d.midColumnVisible, end: d.endColumnVisible })
    },
    onMediaChange: (_m: FCLMedia, n: number) => setMediaColumns(n),
  }

  return {
    layout,
    setLayout,
    /** 0, 1 or 2 (see levelOf). */
    level,
    navigate,
    /** The layout navigate(level) would switch to. */
    nextLayout: (lvl: number) => layoutForLevel(lvl, layout),
    maxColumnsCount: maxColumns,
    isFullScreen,
    /** Last visibility reported by the component (null until it reports one). */
    columnsVisibility: visibility,
    actions: { midColumn, endColumn },
    /** Spread into <FlexibleColumnLayout {...fcl.layoutProps} />. */
    layoutProps,
  }
}

export {
  FlexibleColumnLayout,
  useFlexibleColumnLayout,
  type FlexibleColumnLayoutProps,
  type FCLLayout,
  type FCLMedia,
  type FCLColumnLayout,
  type FCLLayoutsConfiguration,
  type FCLAccessibilityAttributes,
  type FCLLayoutChangeDetail,
  type FCLLayoutConfigurationChangeDetail,
  type FCLColumnActions,
  type UseFlexibleColumnLayoutOptions,
}
