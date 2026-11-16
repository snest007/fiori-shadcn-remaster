import * as React from "react"
import { createPortal } from "react-dom"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// UI5 getEffectiveDir/ItemNavigation follows the nearest DOM direction. Radix otherwise
// writes dir=ltr even when its owner is RTL; observe ancestors to retain live inheritance.
function useInheritedDirection(owner: React.RefObject<HTMLElement | null>, explicit?: "ltr" | "rtl") {
  const [direction, setDirection] = React.useState<"ltr" | "rtl">("ltr")
  React.useLayoutEffect(() => {
    const node = owner.current?.parentElement
    if (!node) return
    const update = () => setDirection(getComputedStyle(node).direction === "rtl" ? "rtl" : "ltr")
    update()
    const observer = new MutationObserver(update)
    for (let ancestor: HTMLElement | null = node; ancestor; ancestor = ancestor.parentElement) {
      observer.observe(ancestor, { attributes: true, attributeFilter: ["dir", "style", "class"] })
    }
    return () => observer.disconnect()
  }, [owner])
  return explicit ?? direction
}

/**
 * @accessibility Name the root listbox with aria-label or aria-labelledby; each option uses its text or an icon-only aria-label.
 * @accessibility Tab enters one enabled item. Arrows, Home and End move focus without wrapping; Space or Enter select. Horizontal arrows follow inherited RTL direction.
 */
type SegmentedButtonTexts = {
  selected: string
  itemDescription: string
}
const defaultTexts: SegmentedButtonTexts = {
  selected: "Selected", // UI5 LIST_ITEM_SELECTED
  itemDescription: "Press SPACE or ENTER to select an item", // UI5 SEGMENTEDBUTTON_ARIA_DESCRIBEDBY
}

type Common = Omit<React.ComponentProps<"div">, "defaultValue" | "dir"> & {
  /** Native aria-label/aria-labelledby name the root listbox; aria-description/aria-describedby describe it. */
  texts?: Partial<SegmentedButtonTexts>
  dir?: "ltr" | "rtl"
  disabled?: boolean
  /** Items take their content width instead of sharing the width equally (ui5 `items-fit-content`). */
  itemsFitContent?: boolean
}
type SegmentedButtonProps =
  | (Common & {
      /** "single" (default): exactly one item is always selected. */
      selectionMode?: "single"
      value?: string
      defaultValue?: string
      onValueChange?: (value: string) => void
    })
  | (Common & {
      /** "multiple": any number of items can be selected. */
      selectionMode: "multiple"
      value?: string[]
      defaultValue?: string[]
      onValueChange?: (value: string[]) => void
    })

// Mirrors ui5-segmented-button: a listbox of options with one tab stop. Arrow keys / Home / End move
// focus without wrapping, Space or Enter select. In single mode the selected item can't be deselected.
function SegmentedButton({ className, selectionMode = "single", itemsFitContent, children, style, value, defaultValue, onValueChange, dir, ref, texts, disabled, ...props }: SegmentedButtonProps) {
  const owner = React.useRef<HTMLDivElement>(null)
  React.useImperativeHandle(ref, () => owner.current!, [])
  const direction = useInheritedDirection(owner, dir)
  const count = React.Children.toArray(children).filter(React.isValidElement).length
  const t = { ...defaultTexts, ...texts }
  const common = {
    ...props,
    disabled,
    ref: owner,
    dir: direction,
    "data-slot": "segmented-button",
    "data-fit-content": itemsFitContent ? "" : undefined,
    role: "listbox",
    // SegmentedButtonTemplate.js leaves its listbox nonfocusable. Radix's
    // internal tabindex=-1 is unnecessary; retain an explicitly supplied tabindex.
    tabIndex: props.tabIndex,
    "aria-multiselectable": selectionMode === "multiple",
    "aria-orientation": "horizontal" as const,
    // Own the item tab stop: Radix initializes every child at -1 and depends
    // on its focusable root, while SegmentedButtonTemplate.js has no root stop.
    rovingFocus: false,
    className: cn("fiori-segmented-button", className),
    style: { "--fiori-x-segmented-btn-items-count": count, ...style } as React.CSSProperties,
    children,
  }

  const [inner, setInner] = React.useState<string | string[]>(defaultValue ?? (selectionMode === "multiple" ? [] : ""))
  const current = value ?? inner
  const selected = Array.isArray(current) ? current : current ? [current] : []
  const [lastFocusedValue, setLastFocusedValue] = React.useState<string>()
  const itemProps = React.Children.toArray(children).filter(React.isValidElement).map((child) => child.props as SegmentedButtonItemProps)
  const enabledValues = disabled ? [] : itemProps.filter((item) => !item.disabled).map((item) => item.value)
  // SegmentedButton.js:_onfocusin enters the selected item on first focus and
  // subsequently preserves the last focused item through ItemNavigation.
  const tabStop = lastFocusedValue && enabledValues.includes(lastFocusedValue) ? lastFocusedValue
    : selected.find((item) => enabledValues.includes(item)) ?? enabledValues[0]
  const set = (v: string | string[]) => {
    if (value === undefined) setInner(v)
    ;(onValueChange as ((v: string | string[]) => void) | undefined)?.(v)
  }

  const [announcement, setAnnouncement] = React.useState({ text: "", sequence: 0 })
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null)
  React.useEffect(() => setPortalTarget(owner.current?.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]') ?? document.body), [])
  React.useEffect(() => {
    if (!announcement.text) return
    // InvisibleMessage.js clears the last message after 3000 ms so reading mode
    // does not encounter an old announcement. Repeated activation gets a new node.
    const timer = setTimeout(() => setAnnouncement((old) => old.sequence === announcement.sequence ? { ...old, text: "" } : old), 3000)
    return () => clearTimeout(timer)
  }, [announcement])
  const announceSelection = () => setAnnouncement((previous) => ({ text: t.selected, sequence: previous.sequence + 1 }))
  const itemValues = itemProps.map((item) => item.value)

  return (
    <SegmentedButtonContext.Provider value={{ selected, itemValues, tabStop, setTabStop: setLastFocusedValue, texts: t, disabled: !!disabled, multiple: selectionMode === "multiple", announceSelection }}>
      {selectionMode === "multiple" ? (
        <ToggleGroupPrimitive.Root type="multiple" value={selected} onValueChange={set} {...common} />
      ) : (
        <ToggleGroupPrimitive.Root
          type="single"
          value={selected[0] ?? ""}
          // Single selection: ignore Radix's deselect (""), the selected item stays selected as in ui5.
          onValueChange={(v) => v && set(v)}
          {...common}
        />
      )}
      {/* SegmentedButton.js:_selectItem announces LIST_ITEM_SELECTED assertively only
          when the activated item is selected. UI5's shared InvisibleMessage lives
          outside the listbox, so this region must not become a listbox child. */}
      {portalTarget && createPortal(<span data-slot="segmented-button-announcement" data-owner={props.id ?? props["aria-label"]} className="sr-only" role="alert" aria-live="assertive" aria-atomic="true"><span key={announcement.sequence}>{announcement.text}</span></span>, portalTarget)}
    </SegmentedButtonContext.Provider>
  )
}

const SegmentedButtonContext = React.createContext({ selected: [] as string[], itemValues: [] as string[], tabStop: undefined as string | undefined, setTabStop: (_value: string) => {}, texts: defaultTexts, disabled: false, multiple: false, announceSelection: () => {} })

type SegmentedButtonItemProps = React.ComponentProps<typeof ToggleGroupPrimitive.Item> & {
  /** Leading icon (an <Icon />). With no text children the item becomes icon-only; give it an aria-label. */
  icon?: React.ReactNode
  /** aria-label/aria-labelledby name the option host, including an asChild host.
   * aria-description/aria-describedby describe that host; UI5's selection hint is appended. */
  texts?: Partial<Pick<SegmentedButtonTexts, "itemDescription">>
}

function SegmentedButtonItem({ className, icon, children, value, asChild, texts, disabled, id, "aria-description": description, "aria-describedby": descriptionRef, ...props }: SegmentedButtonItemProps) {
  const context = React.useContext(SegmentedButtonContext)
  const selected = context.selected.includes(value)
  const generatedId = React.useId()
  const itemId = id ?? generatedId
  const hintId = `${itemId}-hint`
  const effectiveDisabled = disabled || context.disabled
  const hint = texts?.itemDescription ?? context.texts.itemDescription
  const owned = {
    id: itemId, role: "option", "aria-selected": selected, "aria-checked": undefined, "aria-pressed": undefined,
    tabIndex: !effectiveDisabled && context.tabStop === value ? 0 : -1,
    "aria-posinset": context.itemValues.indexOf(value) + 1, "aria-setsize": context.itemValues.length,
    "aria-disabled": !!effectiveDisabled, "aria-description": [description, hint].filter(Boolean).join(" "),
    "aria-describedby": descriptionRef ? `${descriptionRef} ${hintId}` : undefined,
  }
  const handleFocus: React.FocusEventHandler<HTMLButtonElement> = (event) => {
    context.setTabStop(value)
    props.onFocus?.(event)
  }
  // Slot merges the child's props last. Rebuild the asChild host with owned
  // semantics and tabindex, preserving consumer focus callbacks exactly once.
  const custom = asChild ? React.Children.only(children) : undefined
  let customHost: React.ReactNode
  if (React.isValidElement<Record<string, unknown>>(custom)) {
    const childProps = { ...custom.props }
    for (const key of ["tabIndex", "role", "aria-selected", "aria-checked", "aria-pressed", "aria-posinset", "aria-setsize", "aria-disabled", "aria-description", "aria-describedby", "id"]) delete childProps[key]
    customHost = React.createElement(custom.type, { ...childProps, ...owned, disabled: effectiveDisabled,
      onFocus: (event: React.FocusEvent<HTMLButtonElement>) => { handleFocus(event); (custom.props.onFocus as React.FocusEventHandler<HTMLButtonElement> | undefined)?.(event) },
    }, custom.props.children as React.ReactNode, descriptionRef && <span hidden id={hintId}>{hint}</span>)
  }
  const iconOnly = !!icon && (children == null || children === "")
  return (
    <ToggleGroupPrimitive.Item
      {...props}
      {...owned}
      asChild={asChild}
      disabled={effectiveDisabled}
      data-slot="segmented-button-item"
      data-icon-only={iconOnly ? "" : undefined}
      // SegmentedButtonItemTemplate.js owns option role, position, disabled,
      // selected and ariaDescriptionText regardless of custom content.
      value={value}
      className={cn("fiori-segmented-button__item", className)}
      onFocus={asChild ? undefined : handleFocus}
      onClick={(event) => {
        props.onClick?.(event)
        if (!event.defaultPrevented && !effectiveDisabled && (!context.multiple || !selected)) context.announceSelection()
      }}
      onKeyDown={(e) => {
        props.onKeyDown?.(e)
        if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
        // ui5 ItemNavigation (static): all four arrows, Home/End, no wrap, disabled items skipped.
        // Done synchronously here (preventDefault skips Radix's deferred roving focus) so a key
        // pressed right after an arrow acts on the newly focused item.
        const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
        const steps: Record<string, number> = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: 1, ArrowUp: -1 }
        if (!(e.key in steps) && e.key !== "Home" && e.key !== "End") return
        e.preventDefault()
        const root = e.currentTarget.closest('[data-slot="segmented-button"]')
        const items = [...(root?.querySelectorAll<HTMLButtonElement>('[data-slot="segmented-button-item"]') ?? [])].filter((i) => !i.disabled)
        const i = items.indexOf(e.currentTarget)
        const target =
          e.key === "Home" ? items[0] : e.key === "End" ? items[items.length - 1] : items[Math.min(Math.max(i + steps[e.key], 0), items.length - 1)]
        target?.focus()
      }}
    >
      {asChild ? customHost : <>{icon}{!iconOnly && <span className="fiori-segmented-button__text">{children}</span>}{descriptionRef && <span hidden id={hintId}>{hint}</span>}</>}
    </ToggleGroupPrimitive.Item>
  )
}

export { SegmentedButton, SegmentedButtonItem, type SegmentedButtonProps, type SegmentedButtonItemProps, type SegmentedButtonTexts }
