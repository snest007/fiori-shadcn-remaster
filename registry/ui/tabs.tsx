import * as React from "react"

import type { FioriIconData } from "@/lib/fiori-icons"
import { alert, error, sysEnter2 } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"

// Mirrors ui5-tabcontainer / ui5-tab (Horizon): the IconTabBar.
// Keyboard (as UI5): the tab strip is one Tab stop; ←/→ (and ↑/↓) move focus between tabs without
// selecting, Home/End jump to the first/last tab, PageUp/PageDown move by 5; Enter (on key down) or
// Space (on key up) selects the focused tab. Disabled tabs stay focusable but can't be selected.
// Layout follows UI5: text-only tabs when no tab has an icon; with icons, tabs without one switch to
// "mixed mode". Header/content padding follows the container width (UI5's S/M/L/XL media ranges).
// Not yet implemented: the overflow ("More") button, sub-tabs, drag-and-drop reordering.
type TabDesign = "default" | "positive" | "negative" | "critical" | "neutral"

type TabsContextValue = {
  baseId: string
  value: string | undefined
  select: (value: string) => void
  /** Initial auto-selection (UI5 selects the first tab); does not fire onValueChange. */
  autoSelect: (value: string) => void
  focused: string | undefined
  setFocused: (value: string | undefined) => void
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
}

function Tabs({
  value: valueProp,
  defaultValue,
  onValueChange,
  headerBackground = "solid",
  contentBackground = "solid",
  className,
  ...props
}: TabsProps) {
  const baseId = React.useId()
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const value = valueProp ?? uncontrolled
  const [focused, setFocused] = React.useState<string | undefined>()
  const select = React.useCallback(
    (v: string) => {
      if (valueProp === undefined) setUncontrolled(v)
      onValueChange?.(v)
    },
    [valueProp, onValueChange]
  )
  const ctx = React.useMemo(
    () => ({ baseId, value, select, autoSelect: setUncontrolled, focused, setFocused }),
    [baseId, value, select, focused]
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
        data-slot="tabs"
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

function TabsList({ className, children, onKeyDown, onKeyUp, onBlur, ...props }: React.ComponentProps<"div">) {
  const ctx = useTabs("TabsList")
  const listRef = React.useRef<HTMLDivElement>(null)
  // Container-wide layout, as UI5 derives it from all tabs: text-only (no icons), icons (tabs without
  // an icon then use "mixed mode"), and whether any tab has additional text.
  const [layout, setLayout] = React.useState({ icons: false, additional: false })
  React.useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const icons = !!list.querySelector(".fiori-tab--icon")
    const additional = !!list.querySelector("[data-additional-text]")
    if (icons !== layout.icons || additional !== layout.additional) setLayout({ icons, additional })
  })

  // No tab selected yet: select the first one (UI5 auto-selection).
  React.useLayoutEffect(() => {
    if (ctx.value !== undefined || !listRef.current) return
    const first = tabsIn(listRef.current)[0]?.dataset.value
    if (first !== undefined) ctx.autoSelect(first)
  }, [ctx])

  return (
    <div
      data-slot="tabs-header"
      data-layout={layout.icons ? "icons" : "text"}
      data-additional-text={layout.additional ? "" : undefined}
      className="fiori-tabs__header"
    >
      <div
        ref={listRef}
        data-slot="tabs-list"
        role="tablist"
        className={cn("fiori-tabs__strip", className)}
        onKeyDown={(e) => {
          onKeyDown?.(e)
          const tab = (e.target as HTMLElement).closest<HTMLElement>('[role="tab"]')
          if (e.defaultPrevented || !tab || e.altKey || e.ctrlKey || e.metaKey) return
          const value = tab.dataset.value!
          const disabled = tab.getAttribute("aria-disabled") === "true"
          if (e.key === "Enter") {
            if (!disabled) ctx.select(value)
            return
          }
          if (e.key === " ") {
            e.preventDefault() // no scrolling; selection happens on key up
            return
          }
          const tabs = tabsIn(e.currentTarget)
          const i = tabs.indexOf(tab)
          const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
          const last = tabs.length - 1
          const next = (
            {
              ArrowLeft: rtl ? i + 1 : i - 1,
              ArrowRight: rtl ? i - 1 : i + 1,
              ArrowUp: i - 1,
              ArrowDown: i + 1,
              Home: 0,
              End: last,
              PageUp: i - 5,
              PageDown: i + 5,
            } as Record<string, number>
          )[e.key]
          if (next === undefined) return
          e.preventDefault()
          const target = tabs[Math.min(Math.max(next, 0), last)]
          ctx.setFocused(target.dataset.value)
          target.focus()
        }}
        onKeyUp={(e) => {
          onKeyUp?.(e)
          const tab = (e.target as HTMLElement).closest<HTMLElement>('[role="tab"]')
          if (e.defaultPrevented || !tab || e.key !== " ") return
          e.preventDefault()
          if (tab.getAttribute("aria-disabled") !== "true") ctx.select(tab.dataset.value!)
        }}
        onBlur={(e) => {
          onBlur?.(e)
          // Focus leaves the strip: the next Tab entry lands on the selected tab again.
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) ctx.setFocused(undefined)
        }}
        {...props}
      >
        {children}
      </div>
    </div>
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

function TabsTrigger({
  value,
  icon,
  additionalText,
  design = "default",
  disabled,
  designLabel = defaultDesignLabel[design],
  className,
  children,
  onClick,
  onFocus,
  ...props
}: TabsTriggerProps) {
  const ctx = useTabs("TabsTrigger")
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
