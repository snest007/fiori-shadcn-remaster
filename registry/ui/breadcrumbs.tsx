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
  /** Accessible name of the overflow arrow (UI5: "Children"). */
  overflowLabel?: string
  /** Accessible name of the overflow surface and list. */
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

type ItemInternals = { index: number; position: number; size: number; overflow: boolean; current: "location" | "link" | false; separator: boolean }
const ItemContext = React.createContext<ItemInternals | null>(null)
const RovingContext = React.createContext<{ active: number; setActive: (i: number) => void; positionText: BreadcrumbsProps["positionText"] } | null>(null)

function Breadcrumbs({
  design = "standard",
  separators = "slash",
  positionText = (p, s) => `${p} of ${s}`,
  overflowLabel = "Children",
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
  const items = (React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<BreadcrumbsItemProps>[])
    .filter((item) => !item.props.hidden && React.Children.toArray(item.props.children).length > 0)
  const [active, setActive] = React.useState(0)
  const [overflowSize, setOverflowSize] = React.useState(0)
  const [innerOpen, setInnerOpen] = React.useState(defaultOverflowOpen)
  const listRef = React.useRef<HTMLOListElement>(null)
  const arrowRef = React.useRef<HTMLAnchorElement>(null)
  const previousOverflow = React.useRef(0)
  const size = items.length
  const overflow = Math.min(overflowSize, Math.max(0, size - 1))
  const open = overflow > 0 && (overflowOpen ?? innerOpen)
  const setOpen = React.useCallback((next: boolean) => {
    setInnerOpen(next)
    onOverflowOpenChange?.(next)
  }, [onOverflowOpenChange])
  const validActive = active === -1 ? overflow > 0 : active >= overflow && active < size
  const roving = { active: validActive ? active : overflow > 0 ? -1 : 0, setActive, positionText }

  React.useLayoutEffect(() => {
    const list = listRef.current
    const nav = list?.parentElement
    if (!list || !nav) return
    const update = () => {
      // Breadcrumbs.js _cacheWidths / _getElementWidth / _updateOverflow: ceil each item's
      // intrinsic width, reserve the arrow once needed, and never overflow the last visible item.
      // Temporarily expose existing nodes for measurement so hidden text, fonts and separators
      // can change without stale cached widths or a duplicate, accessible breadcrumb trail.
      const hiddenNodes = [...list.children].filter((node): node is HTMLElement => node instanceof HTMLElement && node.hidden)
      // Tailwind preflight makes [hidden] !important in its base layer. Remove the attribute
      // during measurement rather than fighting layer precedence; restore it before paint.
      hiddenNodes.forEach((node) => { node.hidden = false })
      nav.setAttribute("data-measuring", "")
      const widths = [...list.querySelectorAll<HTMLElement>(":scope > [data-slot=breadcrumbs-item]")]
        .map((node) => Math.ceil(node.getBoundingClientRect().width))
      const arrowWidth = Math.ceil(arrowRef.current?.closest("li")?.getBoundingClientRect().width ?? 0)
      nav.removeAttribute("data-measuring")
      hiddenNodes.forEach((node) => { node.hidden = true })
      const availableWidth = nav.offsetWidth
      let requiredWidth = widths.reduce((sum, width) => sum + width, 0)
      let count = 0
      if (requiredWidth > availableWidth) requiredWidth += arrowWidth
      while (requiredWidth >= availableWidth && count < widths.length - 1) {
        requiredWidth -= widths[count++]
      }
      setOverflowSize(count)
      if (count === 0 && previousOverflow.current > 0) setOpen(false)
      previousOverflow.current = count
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
              Home: "first",
              End: "last",
            }
            const step = keys[e.key]
            if (step === undefined || e.altKey || e.ctrlKey || e.metaKey) return
            const targets = [...(listRef.current?.querySelectorAll<HTMLElement>("[data-breadcrumbs-focus]") ?? [])]
              .filter((target) => !target.closest("[hidden]"))
            const current = targets.indexOf(e.target as HTMLElement)
            if (current === -1) return
            const next = step === "first" ? 0 : step === "last" ? targets.length - 1 : Math.min(Math.max(current + step, 0), targets.length - 1)
            e.preventDefault()
            targets[next].focus()
          }}
        >
          <li hidden={!overflow} className="fiori-breadcrumbs__overflow">
            <span className="inline-flex max-w-full">
              <PopoverTrigger asChild>
                <a
                  ref={arrowRef}
                  role="button"
                  aria-label={overflowLabel}
                  aria-haspopup="listbox"
                  aria-expanded={open}
                  data-breadcrumbs-focus={overflow ? "" : undefined}
                  tabIndex={overflow && roving.active === -1 ? 0 : -1}
                  className="fiori-breadcrumbs__link"
                  onFocus={() => setActive(-1)}
                  onClick={(e) => {
                    // BreadcrumbsTemplate.js uses _openRespPopover, rather than a click toggle.
                    e.preventDefault()
                    setOpen(true)
                  }}
                  onKeyDown={(e) => {
                    // Breadcrumbs.js _onkeydown uses isShow: F4 / Alt+Up / Alt+Down toggle.
                    if (e.key === "F4" || (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown"))) {
                      e.preventDefault()
                      setOpen(!open)
                    } else if (e.key === " ") e.preventDefault()
                    else if (e.key === "Enter") {
                      e.preventDefault()
                      setOpen(true)
                    }
                  }}
                  onKeyUp={(e) => {
                    if (e.key === " ") {
                      e.preventDefault()
                      setOpen(true)
                    }
                  }}
                >
                  <span className="fiori-breadcrumbs__overflow-icon"><Icon icon={slimArrowDown} /></span>
                </a>
              </PopoverTrigger>
            </span>
          </li>
          <RovingContext.Provider value={roving}>
            {items.map((item, index) => {
              const last = index === size - 1
              const current: ItemInternals["current"] = design === "standard" && last ? (item.props.href ? "link" : "location") : false
              return (
                <ItemContext.Provider key={item.key ?? index} value={{ index, position: index - overflow + 1, size: size - overflow, overflow: index < overflow, current, separator: !current }}>
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
        onKeyDown={(e) => {
          overflowContentProps?.onKeyDown?.(e)
          if (e.defaultPrevented) return
          if (e.key === "F4" || (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown"))) {
            e.preventDefault()
            setOpen(false)
          }
        }}
      >
        <List selectionMode="single" separators="none" accessibleRole="listbox" aria-label={overflowListLabel} onValueChange={(_, detail) => selectOverflow(detail.item)}>
          {/* Breadcrumbs.js _overflowItemsData reverses only the hidden leading items: nearest ancestor first. */}
          {items.slice(0, overflow).map((item, index) => ({ item, index })).reverse().map(({ item, index }) => (
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
      <li data-slot="breadcrumbs-item" data-breadcrumbs-index={item.index} hidden={item.overflow} className="flex-[1_1_auto] min-w-[1%] self-center text-[0px]">
        <span
          data-breadcrumbs-focus=""
          tabIndex={item.overflow ? -1 : tabIndex}
          aria-current="page"
          aria-label={label}
          onFocus={() => roving.setActive(item.index)}
          onClick={onClick as React.MouseEventHandler<HTMLSpanElement>}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              e.currentTarget.click()
            }
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
    <li data-slot="breadcrumbs-item" data-breadcrumbs-index={item.index} hidden={item.overflow} className="inline last:min-w-[1%]">
      {/* The outer span plays ui5-link's host (inline-flex), the <a> its root. */}
      <span className="inline-flex max-w-full">
        <a
          data-breadcrumbs-focus=""
          href={href}
          tabIndex={item.overflow ? -1 : tabIndex}
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
            if (e.key === " ") e.preventDefault()
            else if (e.key === "Enter" && !href) {
              e.preventDefault()
              e.currentTarget.click()
            }
          }}
          onKeyUp={(e) => {
            onKeyUp?.(e)
            if (e.key === " " && !e.defaultPrevented) e.currentTarget.click()
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
