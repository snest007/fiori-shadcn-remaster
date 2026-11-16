import * as React from "react"
import { useFioriLocale, useFioriTexts } from "@/lib/fiori-locale"

// UI5 2.28 TabContainer fastNavigation metadata; UI5Element.onEnterDOM marks this root unless overridden.

import type { FioriIconData } from "@/lib/fiori-icons"
import { alert, error, slimArrowDown, sysEnter2 } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { List, ListItemCustom } from "@/components/ui/list"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"

// Mirrors ui5-tabcontainer / ui5-tab (Horizon): the IconTabBar.
// Keyboard (as UI5): the tab strip is one Tab stop; ←/→ (and ↑/↓) move focus between tabs without
// selecting, Home/End jump to the first/last tab, PageUp/PageDown move by 5; Enter (on key down) or
// Space (on key up) selects the focused tab. Disabled tabs stay focusable but can't be selected.
// Layout follows UI5: text-only tabs when no tab has an icon; with icons, tabs without one switch to
// "mixed mode". Header/content padding follows the container width (UI5's S/M/L/XL media ranges).
// Not yet implemented: sub-tabs and drag-and-drop reordering.
type TabDesign = "default" | "positive" | "negative" | "critical" | "neutral"

type TabsContextValue = {
  baseId: string
  value: string | undefined
  select: (value: string) => void
  /** Initial auto-selection (UI5 selects the first tab); does not fire onValueChange. */
  autoSelect: (value: string) => void
  focused: string | symbol | undefined
  setFocused: (value: string | symbol | undefined) => void
  overflowMode: "end" | "startAndEnd"
  overflowButton?: React.ReactNode
  startOverflowButton?: React.ReactNode
  moreText: string
  overflowMenuTitle: string
  overflowListAriaLabel: string
}
const TabsContext = React.createContext<TabsContextValue | null>(null)
const useTabs = (part: string) => {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error(`<${part}> must be used inside <Tabs>`)
  return ctx
}
const slug = (v: string) => v.replace(/[^\w-]/g, "_")

type TabsProps = Omit<React.ComponentProps<"div">, "defaultValue" | "dir"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Header background: "solid" (default), "transparent" or "translucent". */
  headerBackground?: "solid" | "transparent" | "translucent"
  /** Content background: "solid" (default), "transparent" or "translucent". */
  contentBackground?: "solid" | "transparent" | "translucent"
  overflowMode?: "end" | "startAndEnd"
  /** Custom focusable end/start overflow controls (for example a Button). */
  overflowButton?: React.ReactNode
  startOverflowButton?: React.ReactNode
  moreText?: string
  overflowMenuTitle?: string
  overflowListAriaLabel?: string
}

function Tabs({
  value: valueProp,
  defaultValue,
  onValueChange,
  headerBackground = "solid",
  contentBackground = "solid",
  overflowMode = "end",
  overflowButton,
  startOverflowButton,
  moreText: moreTextProp,
  overflowMenuTitle: overflowMenuTitleProp,
  overflowListAriaLabel = "Hidden tabs",
  className,
  ...props
}: TabsProps) {
  const { t } = useFioriLocale()
  const moreText = moreTextProp ?? t("TABCONTAINER_END_OVERFLOW", "More") // UI5 TABCONTAINER_END_OVERFLOW
  const overflowMenuTitle = overflowMenuTitleProp ?? t("TABCONTAINER_OVERFLOW_MENU_TITLE", "Overflow Menu") // UI5 TABCONTAINER_OVERFLOW_MENU_TITLE

  const baseId = React.useId()
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const value = valueProp ?? uncontrolled
  const [focused, setFocused] = React.useState<string | symbol | undefined>()
  const select = React.useCallback(
    (v: string) => {
      if (valueProp === undefined) setUncontrolled(v)
      onValueChange?.(v)
    },
    [valueProp, onValueChange]
  )
  const ctx = React.useMemo(
    () => ({ baseId, value, select, autoSelect: setUncontrolled, focused, setFocused, overflowMode, overflowButton, startOverflowButton, moreText, overflowMenuTitle, overflowListAriaLabel }),
    [baseId, value, select, focused, overflowMode, overflowButton, startOverflowButton, moreText, overflowMenuTitle, overflowListAriaLabel]
  )
  // UI5 pads header and content by the container's width range (S < 600px ≤ M < 1024px ≤ L < 1440px ≤ XL).
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [range, setRange] = React.useState<"S" | "M" | "L" | "XL">("S")
  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const update = () => {
      const w = Math.floor(el.offsetWidth)
      setRange(w < 600 ? "S" : w < 1024 ? "M" : w < 1440 ? "L" : "XL")
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <TabsContext.Provider value={ctx}>
      <div
        ref={rootRef}
        data-slot="tabs" data-sap-ui-fastnavgroup="true"
        data-media-range={range}
        data-header-background={headerBackground}
        data-content-background={contentBackground}
        className={cn("fiori-tabs", className)}
        {...props}
      />
    </TabsContext.Provider>
  )
}

const tabsIn = (list: HTMLElement) => [...list.querySelectorAll<HTMLElement>('[role="tab"]')].filter((t) => !t.hidden)

const overflowFocus = { start: Symbol("tabs-overflow-start"), end: Symbol("tabs-overflow-end") }

type OverflowState = { needed: boolean; start: number[]; end: number[]; startVisible: boolean; endVisible: boolean }
const sameIndexes = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i])
const stripItems = (list: HTMLElement) => [...list.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"], [data-slot="tabs-separator"]')]
const itemWidth = (item: HTMLElement) => {
  const style = getComputedStyle(item)
  return item.offsetWidth + (Number.parseInt(style.marginLeft) || 0) + (Number.parseInt(style.marginRight) || 0)
}

const TabsStripContext = React.createContext<((props: TabsTriggerProps) => () => void) | null>(null)

function TabsList({ className, children, onKeyDown, onKeyUp, onBlur, ...props }: React.ComponentProps<"div">) {
  const ctx = useTabs("TabsList")
  const headerRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const startRef = React.useRef<HTMLDivElement>(null)
  const endRef = React.useRef<HTMLDivElement>(null)
  const [layout, setLayout] = React.useState({ icons: false, additional: false })
  const [overflow, setOverflow] = React.useState<OverflowState>({ needed: false, start: [], end: [], startVisible: false, endVisible: false })
  const [open, setOpen] = React.useState<"start" | "end" | undefined>()
  const lastOpenSide = React.useRef<"start" | "end">("end")
  if (open) lastOpenSide.current = open
  const focusAfterClose = React.useRef<string | undefined>(undefined)
  const updateRef = React.useRef<() => void>(() => {})
  const [tabProps, setTabProps] = React.useState(new Map<string, TabsTriggerProps>())
  const registerTab = React.useCallback((tab: TabsTriggerProps) => {
    setTabProps((old) => {
      const previous = old.get(tab.value)
      if (previous && Object.keys(tab).every((key) => previous[key as keyof TabsTriggerProps] === tab[key as keyof TabsTriggerProps])) return old
      return new Map(old).set(tab.value, tab)
    })
    return () => setTabProps((old) => {
      if (!old.has(tab.value)) return old
      const next = new Map(old)
      next.delete(tab.value)
      return next
    })
  }, [])

  React.useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const icons = !!list.querySelector(".fiori-tab--icon")
    const additional = !!list.querySelector("[data-additional-text]")
    if (icons !== layout.icons || additional !== layout.additional) setLayout({ icons, additional })
    if (ctx.value === undefined) {
      const first = tabsIn(list)[0]?.dataset.value
      if (first !== undefined) ctx.autoSelect(first)
    }
  })

  // Port of TabContainer.js _setItemsForStrip/_updateEndOverflow/_updateStartAndEndOverflow.
  // Reserve the selected tab and its preceding separator before filling the remaining strip; End
  // may therefore expose a later selected tab, while StartAndEnd keeps a contiguous ordered window.
  updateRef.current = () => {
    const list = listRef.current
    if (!list) return
    const all = stripItems(list)
    const selected = all.find((item) => item.dataset.value === ctx.value)
    const previousVisible = all.filter((item) => !item.hidden)
    const preserveStart = ctx.overflowMode === "startAndEnd" && previousVisible.length !== all.length && selected && previousVisible.includes(selected) && previousVisible.reduce((sum, item) => sum + itemWidth(item), 0) < list.offsetWidth && itemWidth(selected) < list.offsetWidth
    let firstVisible = preserveStart ? all.indexOf(previousVisible[0]) : undefined
    all.forEach((item) => {
      item.hidden = false
      item.removeAttribute("data-overflow")
    })
    if (startRef.current) startRef.current.hidden = true
    if (endRef.current) endRef.current.hidden = true
    const total = all.reduce((sum, item) => sum + itemWidth(item), 0)
    if (total <= list.offsetWidth) {
      // TabContainer.js onAfterRendering restores the selected tab's navigation entry after an
      // overflow control disappears. Symbols keep control focus distinct from arbitrary tab values.
      if (ctx.focused === overflowFocus.start || ctx.focused === overflowFocus.end) ctx.setFocused(undefined)
      setOverflow((old) => old.needed ? { needed: false, start: [], end: [], startVisible: false, endVisible: false } : old)
      setOpen(undefined)
      return
    }
    if (!overflow.needed) {
      setOverflow({ needed: true, start: [], end: [], startVisible: false, endVisible: false })
      return
    }
    const items = [...all]
    let selectedIndex = selected ? items.indexOf(selected) : 0
    let selectedWidth = selected?.offsetWidth ?? 0
    if (selected) {
      const separator = items[selectedIndex - 1]?.dataset.slot === "tabs-separator" ? items[selectedIndex - 1] : undefined
      items.splice(selectedIndex, 1)
      if (separator) {
        selectedWidth += itemWidth(separator)
        items.splice(--selectedIndex, 1)
      }
    }
    const lastThatFits = (width: number, start = 0) => {
      let used = selectedWidth
      let i = start
      for (; i < items.length; i++) {
        const next = itemWidth(items[i])
        if (width < used + next) break
        used += next
      }
      return i - (items[i - 1]?.dataset.slot === "tabs-separator" ? 2 : 1)
    }
    const firstThatFits = (width: number, start = items.length - 1) => {
      let used = selectedWidth
      let i = start
      for (; i >= 0; i--) {
        const next = itemWidth(items[i])
        if (width < used + next) break
        used += next
      }
      return i + 1
    }
    const hiddenStart: HTMLElement[] = []
    const hiddenEnd: HTMLElement[] = []
    if (ctx.overflowMode === "end") {
      endRef.current!.hidden = false
      hiddenEnd.push(...items.slice(lastThatFits(list.offsetWidth) + 1))
    } else {
      let width = list.offsetWidth
      const leftWidth = items.slice(0, selectedIndex).reduce((sum, item) => sum + itemWidth(item), 0)
      // TabContainer.js _hasStartOverflow compares the shadow wrapper's textContent to "+0".
      // A custom slot has no shadow text, so its start control remains present even with zero items.
      let hasStart = ctx.startOverflowButton != null || overflow.start.some((i) => all[i]?.dataset.slot === "tabs-trigger") || (selectedIndex !== 0 && width < leftWidth + selectedWidth)
      if (!hasStart && selectedIndex !== 0) {
        endRef.current!.hidden = false
        hasStart = list.offsetWidth < leftWidth + selectedWidth
        endRef.current!.hidden = true
      }
      const rightWidth = items.slice(selectedIndex).reduce((sum, item) => sum + itemWidth(item), 0)
      let hasEnd = selectedIndex < items.length && width < rightWidth + selectedWidth
      if (!hasEnd) {
        startRef.current!.hidden = false
        hasEnd = list.offsetWidth < rightWidth + selectedWidth
        startRef.current!.hidden = true
      }
      if (!hasStart) {
        endRef.current!.hidden = false
        hiddenEnd.push(...items.slice(lastThatFits(list.offsetWidth) + 1))
      } else if (!hasEnd) {
        startRef.current!.hidden = false
        firstVisible ||= firstThatFits(list.offsetWidth)
        hiddenStart.push(...items.slice(0, firstVisible))
      } else {
        startRef.current!.hidden = false
        endRef.current!.hidden = false
        width = list.offsetWidth
        firstVisible ||= firstThatFits(width, selectedIndex - 1)
        hiddenStart.push(...items.slice(0, firstVisible))
        hiddenEnd.push(...items.slice(lastThatFits(width, firstVisible) + 1))
      }
    }
    hiddenStart.forEach((item) => { item.hidden = true; item.dataset.overflow = "start" })
    hiddenEnd.forEach((item) => { item.hidden = true; item.dataset.overflow = "end" })
    if ([...hiddenStart, ...hiddenEnd].some((item) => item.dataset.value === ctx.focused) || (ctx.focused === overflowFocus.start && startRef.current!.hidden) || (ctx.focused === overflowFocus.end && endRef.current!.hidden)) ctx.setFocused(undefined)
    const next = { needed: true, start: hiddenStart.map((item) => all.indexOf(item)), end: hiddenEnd.map((item) => all.indexOf(item)), startVisible: !startRef.current!.hidden, endVisible: !endRef.current!.hidden }
    setOverflow((old) => sameIndexes(old.start, next.start) && sameIndexes(old.end, next.end) && old.startVisible === next.startVisible && old.endVisible === next.endVisible ? old : next)
    if (open && next[open].length === 0) setOpen(undefined)
  }
  React.useLayoutEffect(() => updateRef.current())
  React.useLayoutEffect(() => {
    const update = () => updateRef.current()
    let previousWidth = headerRef.current?.offsetWidth
    let previousHeight = headerRef.current?.offsetHeight
    const resize = new ResizeObserver(() => {
      const width = headerRef.current?.offsetWidth
      const height = headerRef.current?.offsetHeight
      // TabContainer.js _handleResize closes the menu before recalculating the strip.
      if (width !== previousWidth || height !== previousHeight) setOpen(undefined)
      previousWidth = width
      previousHeight = height
      update()
    })
    if (headerRef.current) resize.observe(headerRef.current)
    document.fonts.ready.then(update)
    return () => resize.disconnect()
  }, [])

  const control = (side: "start" | "end") => {
    if (!overflow.needed) return null
    const custom = side === "start" ? ctx.startOverflowButton : ctx.overflowButton
    const count = overflow[side].filter((i) => stripItems(listRef.current!)[i]?.dataset.slot === "tabs-trigger").length
    const key = overflowFocus[side]
    const controlProps = {
      "data-tabs-overflow-button": side,
      "aria-haspopup": "menu" as const,
      "aria-expanded": open === side,
      title: ctx.overflowMenuTitle,
      tabIndex: ctx.focused === key ? 0 : -1,
      onFocus: () => ctx.setFocused(key),
      onClick: () => { focusAfterClose.current = undefined; setOpen(open === side ? undefined : side) },
    }
    const button = React.isValidElement<Record<string, unknown>>(custom) ? React.cloneElement(custom, {
      ...controlProps,
      // A custom button keeps its own tooltip (ui5-tabcontainer leaves slotted overflow buttons untouched).
      title: (custom.props.title as string | undefined) ?? controlProps.title,
      onFocus: (e: React.FocusEvent<HTMLElement>) => { (custom.props.onFocus as React.FocusEventHandler<HTMLElement> | undefined)?.(e); controlProps.onFocus() },
      onClick: (e: React.MouseEvent<HTMLElement>) => { (custom.props.onClick as React.MouseEventHandler<HTMLElement> | undefined)?.(e); if (!e.defaultPrevented) controlProps.onClick() },
    }) : <Button {...controlProps} className="fiori-tabs__overflow-button">{custom ?? (ctx.overflowMode === "end" ? ctx.moreText : `+${count}`)}<Icon icon={slimArrowDown} /></Button>
    return (
      <div ref={side === "start" ? startRef : endRef} data-slot={`tabs-overflow-${side}`} hidden={!(side === "start" ? overflow.startVisible : overflow.endVisible)} className={cn("fiori-tabs__overflow", `fiori-tabs__overflow--${side}`)}>
        {/* Only the active opener registers as an anchor; two simultaneous anchors would position
            the start menu at the end control (TabContainer.js _showPopoverAt uses the actual opener). */}
        {side === (open ?? lastOpenSide.current) ? <PopoverAnchor asChild>{button}</PopoverAnchor> : button}
      </div>
    )
  }
  const all = listRef.current ? stripItems(listRef.current) : []
  const entries = open ? overflow[open].map((i) => all[i]).filter(Boolean) : []
  const semantic = entries.some((item) => semanticIcons[tabProps.get(item.dataset.value!)?.design ?? "default"])

  return (
    <Popover open={!!open} onOpenChange={(show) => { if (!show) setOpen(undefined) }}>
      <div
        ref={headerRef}
        data-slot="tabs-header"
        data-layout={layout.icons ? "icons" : "text"}
        data-additional-text={layout.additional ? "" : undefined}
        className="fiori-tabs__header"
        onKeyDown={(e) => {
          const target = (e.target as HTMLElement).closest<HTMLElement>('[role="tab"], [data-tabs-overflow-button]')
          if (e.defaultPrevented || !target || e.altKey || e.ctrlKey || e.metaKey) return
          const side = target.dataset.tabsOverflowButton as "start" | "end" | undefined
          if (side && (e.key === "ArrowDown" || (side === "start" && e.key === "ArrowLeft") || (side === "end" && e.key === "ArrowRight"))) {
            // TabContainer.js _onOverflowKeyDown: the outer arrow opens the menu.
            e.preventDefault()
            setOpen(side)
            return
          }
          if (!side && e.key === "Enter") {
            if (target.getAttribute("aria-disabled") !== "true") ctx.select(target.dataset.value!)
            return
          }
          if (e.key === " ") { if (!side) e.preventDefault(); return }
          const nav = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"], [data-tabs-overflow-button]')].filter((item) => !item.hidden && !item.closest("[hidden]"))
          const i = nav.indexOf(target)
          const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
          const last = nav.length - 1
          const next = ({ ArrowLeft: rtl ? i + 1 : i - 1, ArrowRight: rtl ? i - 1 : i + 1, ArrowUp: i - 1, ArrowDown: i + 1, Home: 0, End: last, PageUp: i - 5, PageDown: i + 5 } as Record<string, number>)[e.key]
          if (next === undefined) return
          e.preventDefault()
          const item = nav[Math.min(Math.max(next, 0), last)]
          ctx.setFocused(item.dataset.value ?? overflowFocus[item.dataset.tabsOverflowButton as "start" | "end"])
          item.focus()
        }}
        onKeyUp={(e) => {
          const tab = (e.target as HTMLElement).closest<HTMLElement>('[role="tab"]')
          if (e.defaultPrevented || !tab || e.key !== " ") return
          e.preventDefault()
          if (tab.getAttribute("aria-disabled") !== "true") ctx.select(tab.dataset.value!)
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) ctx.setFocused(undefined)
        }}
      >
        {control("start")}
        <div ref={listRef} data-slot="tabs-list" role="tablist" className={cn("fiori-tabs__strip", className)} onKeyDown={onKeyDown} onKeyUp={onKeyUp} onBlur={onBlur} {...props}><TabsStripContext.Provider value={registerTab}>{children}</TabsStripContext.Provider></div>
        {control("end")}
      </div>
      <PopoverContent
        side="bottom" align="end" hideArrow className="fiori-tabs__popover"
        aria-label={ctx.overflowListAriaLabel}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          const content = e.currentTarget as HTMLElement
          content.querySelector<HTMLElement>('.fiori-tabs__overflow-item')?.focus()
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          // TabContainer.js _onOverflowListItemClick restores focus to the selected tab, not the opener.
          const value = focusAfterClose.current
          const header = headerRef.current
          if (value !== undefined) header?.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`)?.focus()
          else header?.querySelector<HTMLElement>(`[data-tabs-overflow-button="${lastOpenSide.current}"]`)?.focus()
          focusAfterClose.current = undefined
        }}
      >
        <div className="fiori-tabs__overflow-list"><List selectionMode="single" value={ctx.value !== undefined ? [ctx.value] : []} separators="none" aria-label={ctx.overflowListAriaLabel}
          onItemClick={(value) => { ctx.select(value); focusAfterClose.current = value; setOpen(undefined) }}>
          {entries.map((item, index) => {
            const tab = tabProps.get(item.dataset.value!)
            if (!tab) return <ListItemCustom key={`separator-${index}`} disabled aria-hidden className="fiori-tabs__overflow-separator" />
            const design = tab.design ?? "default"
            const semanticIcon = semanticIcons[design]
            const label = tab.designLabel ?? defaultDesignLabel[design]
            return <ListItemCustom key={tab.value} value={tab.value} disabled={tab.disabled} type={tab.disabled ? "inactive" : "active"} data-design={design} className="fiori-tabs__overflow-item" aria-label={tab["aria-label"]}>
              <div className="fiori-tabs__overflow-wrapper" data-semantic={semantic ? "" : undefined}>
                <div className="fiori-tabs__overflow-content">
                  {semanticIcon && <Icon icon={semanticIcon} className="fiori-tabs__overflow-semantic" />}
                  {tab.icon && <Icon icon={tab.icon} className="fiori-tabs__overflow-icon" />}
                  {tab.children}{tab.additionalText != null && tab.additionalText !== "" && <>{"\u00a0("}{tab.additionalText}{")"}</>}
                  {label && <span className="sr-only"> {label}</span>}
                </div>
              </div>
            </ListItemCustom>
          })}
        </List></div>
      </PopoverContent>
    </Popover>
  )
}

type TabsTriggerProps = Omit<React.ComponentProps<"div">, "children"> & {
  value: string
  /** Icon in the circle (icon tabs). */
  icon?: FioriIconData
  /** Count or short extra text: above the text for icon tabs, before it in mixed mode. */
  additionalText?: React.ReactNode
  design?: TabDesign
  disabled?: boolean
  /** Spoken after the text for semantic designs. Defaults to the design name ("Positive", ...). */
  designLabel?: string
  texts?: Partial<Record<Exclude<TabDesign, "default">, string>>
  children?: React.ReactNode
}

const semanticIcons: Partial<Record<TabDesign, FioriIconData>> = { positive: sysEnter2, negative: error, critical: alert }
const defaultDesignLabel: Record<TabDesign, string | undefined> = {
  default: undefined,
  positive: "Positive",
  negative: "Negative",
  critical: "Critical",
  neutral: "Neutral",
}

// Tab.js/semanticColorText reads these four keys at the tab's spoken design label.
const defaultDesignLabelKeys = { positive: "TAB_ARIA_DESIGN_POSITIVE", negative: "TAB_ARIA_DESIGN_NEGATIVE", critical: "TAB_ARIA_DESIGN_CRITICAL", neutral: "TAB_ARIA_DESIGN_NEUTRAL" } as const

function TabsTrigger({
  value,
  icon,
  additionalText,
  design = "default",
  disabled,
  designLabel: designLabelProp,
  texts: textsProp,
  className,
  children,
  onClick,
  onFocus,
  ...props
}: TabsTriggerProps) {
  const labels = useFioriTexts(defaultDesignLabel, defaultDesignLabelKeys, textsProp)
  const designLabel = designLabelProp ?? labels[design]
  const ctx = useTabs("TabsTrigger")
  const registerTab = React.useContext(TabsStripContext)
  const accessibleLabel = props["aria-label"] ?? (children == null && (additionalText == null || additionalText === "") ? icon?.name : undefined)
  React.useLayoutEffect(() => registerTab?.({ value, icon, additionalText, design, disabled, designLabel, children, "aria-label": accessibleLabel }), [registerTab, value, icon, additionalText, design, disabled, designLabel, children, accessibleLabel])
  const selected = ctx.value === value
  const id = `${ctx.baseId}-tab-${slug(value)}`
  const hasAdditional = additionalText != null && additionalText !== ""
  const semanticIcon = semanticIcons[design]
  // UI5 announces text, additional text, design. We keep the visual order (additional text first) so the
  // accessible name contains the visible label (WCAG 2.5.3); icon-only tabs fall back to the icon name.
  const labelledBy = [hasAdditional && `${id}-additional`, children != null && `${id}-text`, designLabel && `${id}-design`]
    .filter(Boolean)
    .join(" ")
  const ariaLabel = props["aria-label"] ?? (children == null && !hasAdditional ? icon?.name : undefined)
  const tabIndex = (ctx.focused ?? ctx.value) === value ? 0 : -1

  return (
    <div
      id={id}
      data-slot="tabs-trigger"
      data-value={value}
      data-state={selected ? "active" : "inactive"}
      data-design={design}
      data-disabled={disabled ? "" : undefined}
      data-additional-text={hasAdditional ? "" : undefined}
      role="tab"
      tabIndex={tabIndex}
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      aria-controls={`${ctx.baseId}-panel-${slug(value)}`}
      aria-labelledby={ariaLabel ? undefined : labelledBy || undefined}
      aria-label={ariaLabel}
      className={cn("fiori-tab", icon ? "fiori-tab--icon" : "fiori-tab--text", className)}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented && !disabled) ctx.select(value)
      }}
      onFocus={(e) => {
        onFocus?.(e)
        ctx.setFocused(value)
      }}
      {...props}
    >
      {icon && (
        <div className="fiori-tab__icon-outer">
          <Icon icon={icon} className="fiori-tab__icon size-(--fiori-tc-item-icon-size)" />
        </div>
      )}
      {designLabel && (
        <span id={`${id}-design`} hidden>
          {designLabel}
        </span>
      )}
      <div className="fiori-tab__content">
        {hasAdditional ? (
          <span id={`${id}-additional`} className="fiori-tab__additional">
            {additionalText}
          </span>
        ) : (
          icon && <span className="fiori-tab__additional-placeholder" />
        )}
        {/* Word break for the accessible name ("120 Inbox"); whitespace in a flex container isn't rendered. */}
        {" "}
        {children != null && (
          <span id={`${id}-text`} className="fiori-tab__text">
            {semanticIcon && (
              <Icon
                icon={semanticIcon}
                className="fiori-tab__semantic-icon me-2 size-(--fiori-tc-headeritemsemanticicon-size) [display:var(--fiori-tc-headeritemsemanticicon-display)]"
              />
            )}
            {children}
          </span>
        )}
      </div>
    </div>
  )
}

function TabsSeparator({ className, ...props }: React.ComponentProps<"div">) {
  // Decorative (a tablist may only contain tabs), unlike UI5's role="separator".
  return <div data-slot="tabs-separator" aria-hidden className={cn("fiori-tabs__separator", className)} {...props} />
}

type TabsContentProps = React.ComponentProps<"div"> & { value: string }

function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const ctx = useTabs("TabsContent")
  const selected = ctx.value === value
  // Unselected panels stay in the DOM (hidden, children unmounted) so every tab's aria-controls resolves.
  return (
    <div data-slot="tabs-content" data-state={selected ? "active" : "inactive"} hidden={!selected} className={cn("fiori-tabs__content", className)}>
      <div
        id={`${ctx.baseId}-panel-${slug(value)}`}
        role="tabpanel"
        aria-labelledby={`${ctx.baseId}-tab-${slug(value)}`}
        className="fiori-tabs__panel"
        {...props}
      >
        {selected && children}
      </div>
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsSeparator, TabsContent, type TabsProps, type TabsTriggerProps, type TabsContentProps, type TabDesign }
