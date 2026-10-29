import * as React from "react"

import { cn } from "@/lib/utils"

// Mirrors ui5-breadcrumbs (Horizon). The last item is the current location: plain text with
// aria-current="page" (design "standard"), unless it has an href, in which case it stays an
// (emphasized) link. design "no-current-page" renders every item as a link followed by a separator.
// Keyboard (as UI5): the trail is a single Tab stop; arrow keys (←/→ and ↑/↓) move between items,
// Home/End jump to the first/last; Enter or Space activates a link.
// Not yet implemented: collapsing leading items into the overflow ("More") dropdown.
type BreadcrumbsSeparator = "slash" | "double-slash" | "back-slash" | "double-back-slash" | "greater-than" | "double-greater-than"

type BreadcrumbsProps = Omit<React.ComponentProps<"nav">, "children"> & {
  design?: "standard" | "no-current-page"
  separators?: BreadcrumbsSeparator
  children?: React.ReactNode
  /** Appended to each item's accessible name, like UI5's "2 of 4". `null` turns it off. */
  positionText?: ((position: number, size: number) => string) | null
}

type BreadcrumbsItemProps = Omit<React.ComponentProps<"a">, "children"> & {
  href?: string
  children?: React.ReactNode
}

type ItemInternals = { index: number; size: number; current: "location" | "link" | false; separator: boolean }
const ItemContext = React.createContext<ItemInternals | null>(null)
const RovingContext = React.createContext<{ active: number; setActive: (i: number) => void; positionText: BreadcrumbsProps["positionText"] } | null>(null)

function Breadcrumbs({
  design = "standard",
  separators = "slash",
  positionText = (p, s) => `${p} of ${s}`,
  className,
  children,
  "aria-label": ariaLabel = "Breadcrumb Trail",
  ...props
}: BreadcrumbsProps) {
  const items = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<BreadcrumbsItemProps>[]
  const [active, setActive] = React.useState(0)
  const listRef = React.useRef<HTMLOListElement>(null)
  const size = items.length
  const roving = React.useMemo(() => ({ active: Math.min(active, size - 1), setActive, positionText }), [active, size, positionText])

  return (
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
          const current = targets.indexOf(e.target as HTMLElement)
          if (current === -1) return
          const next = step === "first" ? 0 : step === "last" ? targets.length - 1 : Math.min(Math.max(current + step, 0), targets.length - 1)
          e.preventDefault()
          setActive(next)
          targets[next].focus()
        }}
      >
        <RovingContext.Provider value={roving}>
          {items.map((item, index) => {
            const last = index === size - 1
            const current: ItemInternals["current"] = design === "standard" && last ? (item.props.href ? "link" : "location") : false
            return (
              <ItemContext.Provider key={item.key ?? index} value={{ index, size, current, separator: !current }}>
                {item}
              </ItemContext.Provider>
            )
          })}
        </RovingContext.Provider>
      </ol>
    </nav>
  )
}

function BreadcrumbsItem({ href, children, className, onKeyDown, onKeyUp, onClick, onFocus, "aria-label": ariaLabel, ...props }: BreadcrumbsItemProps) {
  const item = React.useContext(ItemContext)
  const roving = React.useContext(RovingContext)
  if (!item || !roving) throw new Error("<BreadcrumbsItem> must be used inside <Breadcrumbs>")
  const tabIndex = roving.active === item.index ? 0 : -1
  const text = typeof children === "string" ? children : undefined
  const position = roving.positionText ? roving.positionText(item.index + 1, item.size) : undefined
  const label = ariaLabel ?? (text && position ? `${text} ${position}` : undefined)

  if (item.current === "location") {
    return (
      <li data-slot="breadcrumbs-item" className="flex-[1_1_auto] min-w-[1%] self-center text-[0px]">
        <span
          data-breadcrumbs-focus=""
          tabIndex={tabIndex}
          aria-current="page"
          aria-label={label}
          onFocus={() => roving.setActive(item.index)}
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
    <li data-slot="breadcrumbs-item" className="inline last:min-w-[1%]">
      {/* The outer span plays ui5-link's host (inline-flex), the <a> its root. */}
      <span className="inline-flex max-w-full">
        <a
          data-breadcrumbs-focus=""
          href={href}
          tabIndex={tabIndex}
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
