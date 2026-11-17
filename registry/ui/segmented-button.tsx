import * as React from "react"
import { useFioriLocale, useFioriTexts } from "@/lib/fiori-locale"
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
type Common = Omit<React.ComponentProps<"div">, "defaultValue" | "dir"> & {
  dir?: "ltr" | "rtl"
  disabled?: boolean
  /** Items take their content width instead of sharing the width equally (ui5 `items-fit-content`). */
  itemsFitContent?: boolean
  /** Assertive announcement emitted when an item is selected. */
  texts?: Partial<SegmentedButtonTexts>
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
type SegmentedButtonTexts = { selected: string }
const defaultSegmentedButtonTexts: SegmentedButtonTexts = { selected: "Selected" } // UI5 LIST_ITEM_SELECTED
const defaultSegmentedButtonTextsKeys = { selected: "LIST_ITEM_SELECTED" } as const

function SegmentedButton({ className, selectionMode = "single", itemsFitContent, children, style, value, defaultValue, onValueChange, dir, ref, texts, ...props }: SegmentedButtonProps) {
  const resolvedTexts = useFioriTexts(defaultSegmentedButtonTexts, defaultSegmentedButtonTextsKeys, texts)
  const [announcement, setAnnouncement] = React.useState({ text: "", sequence: 0 })
  const pendingActivation = React.useRef<string | undefined>(undefined)
  const [completedActivation, setCompletedActivation] = React.useState<{ value: string; sequence: number } | undefined>(undefined)
  const completeActivation = () => {
    const activated = pendingActivation.current
    pendingActivation.current = undefined
    if (activated !== undefined) setCompletedActivation(previous => ({ value: activated, sequence: (previous?.sequence ?? 0) + 1 }))
  }
  const owner = React.useRef<HTMLDivElement>(null)
  React.useImperativeHandle(ref, () => owner.current!, [])
  const direction = useInheritedDirection(owner, dir)
  const count = React.Children.toArray(children).filter(React.isValidElement).length
  const common = {
    ref: owner,
    dir: direction,
    "data-slot": "segmented-button",
    "data-fit-content": itemsFitContent ? "" : undefined,
    role: "listbox",
    "aria-multiselectable": selectionMode === "multiple",
    "aria-orientation": "horizontal" as const,
    loop: false,
    className: cn("fiori-segmented-button", className),
    style: { "--fiori-x-segmented-btn-items-count": count, ...style } as React.CSSProperties,
    children,
    ...props,
  }

  const [inner, setInner] = React.useState<string | string[]>(defaultValue ?? (selectionMode === "multiple" ? [] : ""))
  const current = value ?? inner
  const selected = Array.isArray(current) ? current : current ? [current] : []
  const set = (v: string | string[]) => {
    if (value === undefined) setInner(v)
    ;(onValueChange as ((v: string | string[]) => void) | undefined)?.(v)
    completeActivation()
  }
  React.useLayoutEffect(() => {
    // SegmentedButton.js/_selectItem fires selection-change before inspecting
    // target.selected. Wait for the callback's controlled value to commit, so a
    // rejected/reverted selection and multiple deselection cannot be announced.
    if (completedActivation && selected.includes(completedActivation.value)) setAnnouncement(previous => ({ text: resolvedTexts.selected, sequence: previous.sequence + 1 }))
  }, [completedActivation])

  return (
    <SegmentedButtonContext.Provider value={{ selected, activate: (value) => { pendingActivation.current = value } }}>
      {selectionMode === "multiple" ? (
        <ToggleGroupPrimitive.Root type="multiple" value={selected} onValueChange={set} {...common} />
      ) : (
        <ToggleGroupPrimitive.Root
          type="single"
          value={selected[0] ?? ""}
          // Single selection: ignore Radix's deselect (""), the selected item stays selected as in ui5.
          onValueChange={(v) => { if (v) set(v); else completeActivation() }}
          {...common}
        />
      )}
      {/* SegmentedButton.js/_selectItem announces LIST_ITEM_SELECTED assertively
          whenever the activated item is selected; deselection emits nothing.
          InvisibleMessage.js/createAnnouncementSpans supplies role=alert. */}
      <span data-slot="segmented-button-announcement" role="alert" aria-live="assertive" aria-atomic="true" className="sr-only"><span key={announcement.sequence}>{announcement.text}</span></span>
    </SegmentedButtonContext.Provider>
  )
}

const SegmentedButtonContext = React.createContext<{ selected: string[]; activate: (value: string) => void }>({ selected: [], activate: () => {} })

type SegmentedButtonItemProps = React.ComponentProps<typeof ToggleGroupPrimitive.Item> & {
  /** Leading icon (an <Icon />). With no text children the item becomes icon-only; give it an aria-label. */
  icon?: React.ReactNode
  selectionHint?: string
}

function SegmentedButtonItem({ className, icon, children, value, selectionHint, "aria-description": description, ...props }: SegmentedButtonItemProps) {
  const { t, hasProvider } = useFioriLocale()
  // UI5 SegmentedButtonItem.js/ariaDescriptionText appends the selection shortcut hint.
  const hint = selectionHint ?? (hasProvider ? t("SEGMENTEDBUTTON_ARIA_DESCRIBEDBY", "Press SPACE or ENTER to select an item") : undefined)
  const context = React.useContext(SegmentedButtonContext)
  const selected = context.selected.includes(value)
  const iconOnly = !!icon && (children == null || children === "")
  return (
    <ToggleGroupPrimitive.Item
      data-slot="segmented-button-item"
      aria-description={[description, hint].filter(Boolean).join(" ") || undefined}
      data-icon-only={iconOnly ? "" : undefined}
      // ui5 semantics are listbox/option, not Radix's radio / pressed-button ones.
      role="option"
      aria-selected={selected}
      aria-checked={undefined}
      aria-pressed={undefined}
      value={value}
      className={cn("fiori-segmented-button__item", className)}
      {...props}
      onClick={(event) => {
        props.onClick?.(event)
        if (!event.defaultPrevented && !props.disabled) context.activate(value)
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
      {icon}
      {!iconOnly && <span className="fiori-segmented-button__text">{children}</span>}
    </ToggleGroupPrimitive.Item>
  )
}

export { SegmentedButton, SegmentedButtonItem, type SegmentedButtonProps, type SegmentedButtonItemProps, type SegmentedButtonTexts }
