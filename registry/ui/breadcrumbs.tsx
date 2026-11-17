// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

import { cn } from "@/lib/utils"
import { slimArrowDown } from "@/lib/fiori-icons"
import { Icon } from "@/components/ui/icon"
import { List, ListItemStandard } from "@/components/ui/list"
import { Popover, PopoverContent, PopoverTrigger, type PopoverContentProps } from "@/components/ui/popover"

// Mirrors ui5-breadcrumbs (Horizon). The last item is the current location: plain text with
// aria-current="page" (design "standard"), unless it has an href, in which case it stays an
// (emphasized) link. design "no-current-page" renders every item as a link followed by a separator.
// Keyboard (as UI5): the trail is a single Tab stop; arrow keys (←/→ and ↑/↓) move between items,
// Home/End jump to the first/last; Enter or Space activates a link.
type BreadcrumbsSeparator = "slash" | "double-slash" | "back-slash" | "double-back-slash" | "greater-than" | "double-greater-than"

type BreadcrumbsProps = Omit<React.ComponentProps<"nav">, "children"> & {
  design?: "standard" | "no-current-page"
  separators?: BreadcrumbsSeparator
  children?: React.ReactNode
  /** Appended to each item's accessible name, like UI5's "2 of 4". `null` turns it off. */
  positionText?: ((position: number, size: number) => string) | null
  /** Accessible name of the overflow arrow (UI5: "More"). */
  overflowLabel?: string
  /** Accessible name of the overflow surface (the list keeps UI5's selection announcement). */
  overflowListLabel?: string
  /** Optional controlled overflow state; the popup is available only while items overflow. */
  overflowOpen?: boolean
  defaultOverflowOpen?: boolean
  onOverflowOpenChange?: (open: boolean) => void
  /** Placement / in-place rendering options for the reused Popover surface. */
  overflowContentProps?: Omit<PopoverContentProps, "children">
}

type BreadcrumbsItemProps = Omit<React.ComponentProps<"a">, "children"> & {
  href?: string
  children?: React.ReactNode
}

type ItemInternals = { index: number; position: number; size: number; overflow: boolean; visible: boolean; current: "location" | "link" | false; separator: boolean }
const ItemContext = React.createContext<ItemInternals | null>(null)
const RovingContext = React.createContext<{ active: number; setActive: (i: number) => void; positionText: BreadcrumbsProps["positionText"] } | null>(null)

type BreadcrumbsKeyEvent = Pick<React.KeyboardEvent, "key" | "keyCode" | "shiftKey" | "altKey" | "ctrlKey" | "metaKey">
// @ui5/webcomponents-base/dist/Keys.js: hasModifierKeys treats Ctrl and Meta alike;
// Enter, Space, navigation, F4 and Escape require no modifier, while show arrows require Alt alone.
const hasModifiers = (e: BreadcrumbsKeyEvent) => e.shiftKey || e.altKey || e.ctrlKey || e.metaKey
const matchesKey = (e: BreadcrumbsKeyEvent, keys: string[], code: number) => e.key ? keys.includes(e.key) : e.keyCode === code
const isEnterKey = (e: BreadcrumbsKeyEvent) => matchesKey(e, ["Enter"], 13) && !hasModifiers(e)
const isSpaceKey = (e: BreadcrumbsKeyEvent) => matchesKey(e, [" ", "Spacebar"], 32) && !hasModifiers(e)
const isEscapeKey = (e: BreadcrumbsKeyEvent) => matchesKey(e, ["Escape", "Esc"], 27) && !hasModifiers(e)
const isShowKey = (e: BreadcrumbsKeyEvent) => {
  const altOnly = e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey
  if (e.key) return (e.key === "F4" && !hasModifiers(e)) || (["ArrowUp", "Up", "ArrowDown", "Down"].includes(e.key) && altOnly)
  // Keys.js isShow's legacy keyCode branch supports F4 and Alt+Down (not Alt+Up).
  return (e.keyCode === 115 && !hasModifiers(e)) || (e.keyCode === 40 && altOnly)
}
const keyNames: Record<number, string> = { 13: "Enter", 27: "Escape", 32: " ", 33: "PageUp", 34: "PageDown", 35: "End", 36: "Home", 37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight", 40: "ArrowDown", 115: "F4" }
const managedKeys = new Set(["Enter", " ", "Spacebar", "ArrowLeft", "Left", "ArrowRight", "Right", "ArrowUp", "Up", "ArrowDown", "Down", "Home", "End", "PageUp", "PageDown", "F4", "Escape", "Esc"])
const isModifiedManagedKey = (e: BreadcrumbsKeyEvent) => hasModifiers(e) && !isShowKey(e) && managedKeys.has(e.key || keyNames[e.keyCode])
const isVisibleItem = (item: React.ReactElement<BreadcrumbsItemProps>) => !item.props.hidden && React.Children.toArray(item.props.children).some((child) => {
  if (typeof child === "string" || typeof child === "number") return String(child).trim().length > 0
  return React.isValidElement<{ hidden?: boolean }>(child) && !child.props.hidden
})

function Breadcrumbs({
  design = "standard",
  separators = "slash",
  positionText = (p, s) => `${p} of ${s}`,
  overflowLabel = "More",
  overflowListLabel = "Available Values",
  overflowOpen,
  defaultOverflowOpen = false,
  onOverflowOpenChange,
  overflowContentProps,
  className,
  children,
  "aria-label": ariaLabel = "Breadcrumb Trail",
  ...props
}: BreadcrumbsProps) {
  // Breadcrumbs.js _updateOverflow counts RAW item positions; _visibleItems filters afterward.
  // Keep native-hidden items in the array / DOM, even though their measured width is zero.
  const items = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<BreadcrumbsItemProps>[]
  const [active, setActive] = React.useState(0)
  const [overflowSize, setOverflowSize] = React.useState(0)
  const [innerOpen, setInnerOpen] = React.useState(defaultOverflowOpen)
  const listRef = React.useRef<HTMLOListElement>(null)
  const arrowRef = React.useRef<HTMLAnchorElement>(null)
  const previousOverflow = React.useRef(false)
  const size = items.length
  const maxOverflow = Math.max(0, items.filter(isVisibleItem).length - 1)
  const overflow = Math.min(overflowSize, maxOverflow)
  const visibleIndices = items.map((item, index) => ({ item, index })).filter(({ item, index }) => index >= overflow && isVisibleItem(item)).map(({ index }) => index)
  const overflowItems = items.map((item, index) => ({ item, index })).slice(0, overflow).filter(({ item }) => isVisibleItem(item)).reverse()
  const hasOverflow = overflowItems.length > 0
  const open = hasOverflow && (overflowOpen ?? innerOpen)
  const setOpen = React.useCallback((next: boolean) => {
    setInnerOpen(next)
    onOverflowOpenChange?.(next)
  }, [onOverflowOpenChange])
  const validActive = active === -1 ? hasOverflow : visibleIndices.includes(active)
  const roving = { active: validActive ? active : hasOverflow ? -1 : visibleIndices[0] ?? 0, setActive, positionText }

  React.useLayoutEffect(() => {
    const list = listRef.current
    const nav = list?.parentElement
    if (!list || !nav) return
    const update = () => {
      // Breadcrumbs.js _cacheWidths / _getElementWidth / _updateOverflow: ceil each item's
      // intrinsic width, reserve the arrow once needed, and never overflow the last visible item.
      // Temporarily expose existing nodes for measurement so hidden text, fonts and separators
      // can change without stale cached widths or a duplicate, accessible breadcrumb trail.
      const hiddenNodes = [...list.children].filter((node): node is HTMLElement => node instanceof HTMLElement && node.hidden && node.dataset.breadcrumbsVisible !== "false")
      // Tailwind preflight makes [hidden] !important in its base layer. Remove the attribute
      // during measurement rather than fighting layer precedence; restore it before paint.
      hiddenNodes.forEach((node) => { node.hidden = false })
      nav.setAttribute("data-measuring", "")
      const widths = [...list.querySelectorAll<HTMLElement>(":scope > [data-slot=breadcrumbs-item]")]
        .map((node) => node.dataset.breadcrumbsVisible === "false" ? 0 : Math.ceil(node.getBoundingClientRect().width))
      const arrowWidth = Math.ceil(arrowRef.current?.closest("li")?.getBoundingClientRect().width ?? 0)
      nav.removeAttribute("data-measuring")
      hiddenNodes.forEach((node) => { node.hidden = true })
      const availableWidth = nav.offsetWidth
      let requiredWidth = widths.reduce((sum, width) => sum + width, 0)
      let count = 0
      if (requiredWidth > availableWidth) requiredWidth += arrowWidth
      // _maxAllowedOverflowSize uses visible count minus one, but the loop consumes raw
      // indices, including zero-width native-hidden items. A hidden middle item can therefore
      // leave an earlier link visible at a narrow width; preserve this installed UI5 oddity.
      const maxAllowed = Math.max(0, items.filter(isVisibleItem).length - 1)
      while (requiredWidth >= availableWidth && count < maxAllowed) {
        requiredWidth -= widths[count++]
      }
      setOverflowSize(count)
      const nextHasOverflow = items.slice(0, count).some(isVisibleItem)
      if (!nextHasOverflow && previousOverflow.current) setOpen(false)
      previousOverflow.current = nextHasOverflow
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(nav)
    observer.observe(list)
    for (const node of list.children) observer.observe(node)
    document.fonts.addEventListener("loadingdone", update)
    return () => {
      observer.disconnect()
      document.fonts.removeEventListener("loadingdone", update)
    }
  }, [children, design, separators, setOpen])

  const selectOverflow = (value: string) => {
    // Breadcrumbs.js _onOverflowListItemSelect dispatches the item's click before following its
    // href (with no modifier keys). Dispatch on its real anchor to preserve React currentTarget,
    // href/target and browser navigation; a canceled item click keeps the popup open, as in UI5.
    const link = listRef.current?.querySelector<HTMLAnchorElement>(`[data-breadcrumbs-index="${value}"] a`)
    if (link?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))) setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <nav
        data-slot="breadcrumbs"
        data-separators={separators}
        aria-label={ariaLabel}
        className={cn("fiori-breadcrumbs block w-full whitespace-nowrap outline-none m-(--fiori-breadcrumbs-margin)", className)}
        {...props}
      >
        <ol
          ref={listRef}
          className="m-0 flex list-none p-0"
          onKeyDown={(e) => {
            if (e.defaultPrevented) return
            const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
            const keys: Record<string, number | "first" | "last"> = {
              ArrowLeft: rtl ? 1 : -1,
              ArrowRight: rtl ? -1 : 1,
              ArrowUp: -1,
              ArrowDown: 1,
              Left: rtl ? 1 : -1,
              Right: rtl ? -1 : 1,
              Up: -1,
              Down: 1,
              Home: "first",
              End: "last",
              // ItemNavigation.js _handlePageUp/DownFlat uses Home/End without a skip size.
              PageUp: "first",
              PageDown: "last",
            }
            const step = keys[e.key || keyNames[e.keyCode]]
            if (step === undefined || hasModifiers(e)) return
            const targets = [...(listRef.current?.querySelectorAll<HTMLElement>("[data-breadcrumbs-focus]") ?? [])]
              .filter((target) => !target.closest("[hidden]"))
            const current = targets.indexOf(e.target as HTMLElement)
            if (current === -1) return
            const next = step === "first" ? 0 : step === "last" ? targets.length - 1 : Math.min(Math.max(current + step, 0), targets.length - 1)
            e.preventDefault()
            targets[next].focus()
          }}
        >
          <li hidden={!hasOverflow} className="fiori-breadcrumbs__overflow">
            <span className="inline-flex max-w-full">
              <PopoverTrigger asChild>
                <a
                  ref={arrowRef}
                  role="button"
                  aria-label={overflowLabel}
                  aria-haspopup="listbox"
                  // Breadcrumbs.js linkAccessibilityAttributes supplies only hasPopup. Override
                  // Radix's injected expanded/controls with undefined so neither reaches the DOM.
                  aria-expanded={undefined}
                  aria-controls={undefined}
                  data-breadcrumbs-focus={hasOverflow ? "" : undefined}
                  tabIndex={hasOverflow && roving.active === -1 ? 0 : -1}
                  className="fiori-breadcrumbs__link"
                  onFocus={() => setActive(-1)}
                  onClick={(e) => {
                    // BreadcrumbsTemplate.js uses _openRespPopover, rather than a click toggle.
                    e.preventDefault()
                    setOpen(true)
                  }}
                  onKeyDown={(e) => {
                    // Breadcrumbs.js _onkeydown uses isShow: F4 / Alt+Up / Alt+Down toggle.
                    if (isShowKey(e)) {
                      e.preventDefault()
                      setOpen(!open)
                    } else if (isSpaceKey(e)) e.preventDefault()
                    else if (isEnterKey(e)) {
                      e.preventDefault()
                      setOpen(true)
                    }
                  }}
                  onKeyUp={(e) => {
                    if (isSpaceKey(e)) {
                      e.preventDefault()
                      setOpen(true)
                    }
                  }}
                >
                  <span className="fiori-breadcrumbs__overflow-icon" title={overflowLabel}><Icon icon={slimArrowDown} /></span>
                </a>
              </PopoverTrigger>
            </span>
          </li>
          <RovingContext.Provider value={roving}>
            {items.map((item, index) => {
              const last = index === size - 1
              const current: ItemInternals["current"] = design === "standard" && last ? (item.props.href ? "link" : "location") : false
              return (
                <ItemContext.Provider key={item.key ?? index} value={{ index, position: visibleIndices.indexOf(index) + 1, size: visibleIndices.length, overflow: index < overflow, visible: isVisibleItem(item), current, separator: !current }}>
                  {item}
                </ItemContext.Provider>
              )
            })}
          </RovingContext.Provider>
        </ol>
      </nav>
      <PopoverContent
        hideArrow
        side="bottom"
        align="start"
        aria-label={overflowListLabel}
        {...overflowContentProps}
        className={cn("fiori-breadcrumbs__popover", overflowContentProps?.className)}
        onOpenAutoFocus={(e) => {
          overflowContentProps?.onOpenAutoFocus?.(e)
          if (e.defaultPrevented) return
          e.preventDefault()
          const surface = e.target as HTMLElement
          surface.querySelector<HTMLElement>("[data-slot=list-item]")?.focus()
        }}
        onEscapeKeyDown={(e) => {
          overflowContentProps?.onEscapeKeyDown?.(e)
          // Radix listens on document capture before React handlers; veto modified Escape here.
          if (hasModifiers(e)) e.preventDefault()
        }}
        onKeyDownCapture={(e) => {
          overflowContentProps?.onKeyDownCapture?.(e)
          // Local capture guards keep reused List's broader key handlers from accepting
          // modified activation/navigation. Do not cancel native browser modifier behavior.
          if (isModifiedManagedKey(e)) e.stopPropagation()
        }}
        onKeyUpCapture={(e) => {
          overflowContentProps?.onKeyUpCapture?.(e)
          if (isModifiedManagedKey(e)) e.stopPropagation()
        }}
        onKeyDown={(e) => {
          overflowContentProps?.onKeyDown?.(e)
          if (e.defaultPrevented) return
          if (isShowKey(e) || isEscapeKey(e)) {
            e.preventDefault()
            setOpen(false)
          }
        }}
      >
        {/* BreadcrumbsPopoverTemplate.js leaves List's role="list" and accessibleName unset;
            List.js ariaLabelledBy names a Single list with its generated selection announcement. */}
        <List selectionMode="single" separators="none" onValueChange={(_, detail) => selectOverflow(detail.item)}>
          {/* Breadcrumbs.js _overflowItemsData reverses only the hidden leading items: nearest ancestor first. */}
          {overflowItems.map(({ item, index }) => (
            <ListItemStandard key={item.key ?? index} value={String(index)} aria-label={item.props["aria-label"]}>{item.props.children}</ListItemStandard>
          ))}
        </List>
      </PopoverContent>
    </Popover>
  )
}

function BreadcrumbsItem({ href, children, className, onKeyDown, onKeyUp, onClick, onFocus, "aria-label": ariaLabel, ...props }: BreadcrumbsItemProps) {
  const item = React.useContext(ItemContext)
  const roving = React.useContext(RovingContext)
  if (!item || !roving) throw new Error("<BreadcrumbsItem> must be used inside <Breadcrumbs>")
  const tabIndex = roving.active === item.index ? 0 : -1
  const text = typeof children === "string" ? children : undefined
  const position = roving.positionText ? roving.positionText(item.position, item.size) : undefined
  const label = ariaLabel ?? (text && position ? `${text} ${position}` : undefined)

  if (item.current === "location") {
    return (
      <li data-slot="breadcrumbs-item" data-breadcrumbs-index={item.index} data-breadcrumbs-visible={item.visible ? "true" : "false"} hidden={item.overflow || !item.visible} className="flex-[1_1_auto] min-w-[1%] self-center text-[0px]">
        <span
          data-breadcrumbs-focus=""
          tabIndex={item.overflow || !item.visible ? -1 : tabIndex}
          aria-current="page"
          aria-label={label}
          onFocus={() => roving.setActive(item.index)}
          onClick={onClick as React.MouseEventHandler<HTMLSpanElement>}
          onKeyDown={(e) => {
            onKeyDown?.(e as unknown as React.KeyboardEvent<HTMLAnchorElement>)
            if (!e.defaultPrevented && (isEnterKey(e) || isSpaceKey(e))) e.currentTarget.click()
          }}
          className={cn("fiori-breadcrumbs__current", className)}
        >
          <span className="inline-flex max-w-full font-(family-name:--sapFontFamily) text-(length:--sapFontSize) leading-[normal] whitespace-nowrap text-(--fiori-breadcrumbs-current-location-color)">
            <span className="inline-block min-w-0 flex-[0_1_auto] overflow-hidden pe-[0.075rem] align-top text-ellipsis">{children}</span>
          </span>
        </span>
      </li>
    )
  }

  return (
    <li data-slot="breadcrumbs-item" data-breadcrumbs-index={item.index} data-breadcrumbs-visible={item.visible ? "true" : "false"} hidden={item.overflow || !item.visible} className="inline last:min-w-[1%]">
      {/* The outer span plays ui5-link's host (inline-flex), the <a> its root. */}
      <span className="inline-flex max-w-full">
        <a
          data-breadcrumbs-focus=""
          href={href}
          tabIndex={item.overflow || !item.visible ? -1 : tabIndex}
          aria-current={item.current === "link" ? "page" : undefined}
          aria-label={label}
          data-emphasized={item.current === "link" ? "" : undefined}
          className={cn("fiori-breadcrumbs__link", className)}
          onFocus={(e) => {
            roving.setActive(item.index)
            onFocus?.(e)
          }}
          onClick={onClick}
          // ui5-link: Enter activates on key down, Space on key up (and never scrolls the page).
          onKeyDown={(e) => {
            onKeyDown?.(e)
            if (e.defaultPrevented) return
            if (isSpaceKey(e)) e.preventDefault()
            else if (isEnterKey(e) && !href) {
              e.preventDefault()
              e.currentTarget.click()
            }
          }}
          onKeyUp={(e) => {
            onKeyUp?.(e)
            if (isSpaceKey(e) && !e.defaultPrevented) e.currentTarget.click()
          }}
          {...props}
        >
          <span className="overflow-hidden text-ellipsis">{children}</span>
        </a>
      </span>
      {item.separator && <span aria-hidden className="fiori-breadcrumbs__separator" />}
    </li>
  )
}

export { Breadcrumbs, BreadcrumbsItem, type BreadcrumbsProps, type BreadcrumbsItemProps, type BreadcrumbsSeparator }
