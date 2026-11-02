import * as React from "react"

import type { FioriIconData } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"

// Mirrors ui5-product-switch / ui5-product-switch-item (Horizon). 2 columns for up to 2 items, 3 up to 6, else 4;
// narrower windows reflow by media query, as in UI5 (3 columns at 900px, a single column at 600px).
// Keyboard (UI5 ItemNavigation, one tab stop): ←/→ by item, ↑/↓ by row and stopping at the edges, Home/End
// within the row (the whole list in one column), Enter / Space activate. A clicked item becomes selected.

const SwitchContext = React.createContext<{
  current: string | null
  setCurrent: (key: string) => void
  chosen: string | null
  choose: (key: string) => void
} | null>(null)

type ProductSwitchProps = React.ComponentProps<"div"> & {
  /** aria-label of the list (default "Products"). */
  accessibleName?: string
}

function ProductSwitch({ accessibleName = "Products", className, children, onKeyDown, ...props }: ProductSwitchProps) {
  const count = React.Children.toArray(children).filter(React.isValidElement).length
  const columns = count > 6 ? 4 : count <= 2 ? 2 : 3
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [current, setCurrent] = React.useState<string | null>(null)
  const [chosen, setChosen] = React.useState<string | null>(null)
  const ctx = React.useMemo(() => ({ current, setCurrent, chosen, choose: setChosen }), [current, chosen])

  const tiles = () => [...(rootRef.current?.querySelectorAll<HTMLElement>("[data-ps-key]") ?? [])]
  // One tab stop: the current tile if it still exists, else the first.
  React.useLayoutEffect(() => {
    const keys = tiles().map((el) => el.dataset.psKey!)
    if (!current || !keys.includes(current)) setCurrent(keys[0] ?? null)
  })

  const rowSize = () => {
    const width = document.body.clientWidth
    if (width <= 600) return 1
    if (count <= 2) return 2
    return width <= 900 || count <= 6 ? 3 : 4
  }

  return (
    <div
      ref={rootRef}
      data-slot="product-switch"
      data-columns={columns}
      role="list"
      aria-label={accessibleName}
      className={cn("fiori-product-switch", className)}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented) return
        const list = tiles()
        const i = list.indexOf(e.target as HTMLElement)
        if (i === -1) return
        const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
        const size = rowSize()
        const range = size > 1 ? size : list.length
        let next: number | undefined
        if (e.key === "ArrowRight") next = rtl ? i - 1 : i + 1
        else if (e.key === "ArrowLeft") next = rtl ? i + 1 : i - 1
        // UI5 quirk kept: when a full row lies exactly below the last row's end, Down lands on the last item.
        else if (e.key === "ArrowDown") next = i + size === list.length ? list.length - 1 : i + size
        else if (e.key === "ArrowUp") next = i - size
        else if (e.key === "Home") next = i - (i % range)
        else if (e.key === "End") next = Math.min(i + (range - 1 - (i % range)), list.length - 1)
        else return
        e.preventDefault()
        list[next]?.focus()
      }}
      {...props}
    >
      <SwitchContext.Provider value={ctx}>{children}</SwitchContext.Provider>
    </div>
  )
}

type ProductSwitchItemProps = Omit<React.ComponentProps<"div">, "onClick" | "title"> & {
  titleText?: string
  subtitleText?: string
  icon?: FioriIconData
  /** An <img> or <Avatar> shown instead of the icon. */
  image?: React.ReactNode
  /** Link target; renders the tile as a link. */
  targetSrc?: string
  target?: string
  /** Initially selected; a click moves the selection. */
  selected?: boolean
  onClick?: (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => void
}

function ProductSwitchItem({ titleText, subtitleText, icon, image, targetSrc, target, selected, onClick, className, ...props }: ProductSwitchItemProps) {
  const ctx = React.useContext(SwitchContext)
  const key = React.useId()
  const [active, setActive] = React.useState(false)
  const isSelected = ctx?.chosen != null ? ctx.chosen === key : selected
  React.useEffect(() => {
    if (!active) return
    const off = () => setActive(false)
    document.addEventListener("mouseup", off)
    return () => document.removeEventListener("mouseup", off)
  }, [active])

  const press = (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
    ctx?.choose(key)
    onClick?.(e)
  }
  const rootProps = {
    "data-ps-key": key,
    tabIndex: ctx?.current === key ? 0 : -1,
    className: "fiori-product-switch-item__root",
    onFocus: () => ctx?.setCurrent(key),
    onBlur: () => setActive(false),
    onMouseDown: () => setActive(true),
    onClick: press,
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === " " || e.key === "Enter") setActive(true)
      if (e.key === " ") e.preventDefault()
      // A link's native click follows on Enter.
      if (e.key === "Enter" && !targetSrc) press(e)
    },
    onKeyUp: (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === " " || e.key === "Enter") setActive(false)
      if (e.key === " ") {
        if (targetSrc) e.currentTarget.click()
        else press(e)
      }
    },
  }
  const body = (
    <>
      {image ? <span className="fiori-product-switch-item__image">{image}</span> : icon && <Icon icon={icon} className="fiori-product-switch-item__icon size-12" />}
      <span className="fiori-product-switch-item__text">
        {titleText && <span className="fiori-product-switch-item__title">{titleText}</span>}
        {subtitleText && <span className="fiori-product-switch-item__subtitle">{subtitleText}</span>}
      </span>
    </>
  )
  return (
    <div
      data-slot="product-switch-item"
      role="listitem"
      data-selected={isSelected ? "" : undefined}
      data-active={active ? "" : undefined}
      className={cn("fiori-product-switch-item", className)}
      {...props}
    >
      {targetSrc ? (
        <a href={targetSrc} target={target ?? "_self"} {...rootProps}>
          {body}
        </a>
      ) : (
        <div role="button" aria-pressed={!!isSelected} {...rootProps}>
          {body}
        </div>
      )}
    </div>
  )
}

export { ProductSwitch, ProductSwitchItem, type ProductSwitchProps, type ProductSwitchItemProps }
