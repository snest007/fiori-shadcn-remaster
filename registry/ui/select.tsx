import * as React from "react"
import { isF6NavigationKey } from "@/lib/fiori-f6"
import { Select as SelectPrimitive, Slot } from "radix-ui"

// UI5 2.28 SelectPopoverTemplate.js renders an internal List (fastNavigation metadata).

// UI5 2.28 Popup.js/onEnterDOM: every rendered Popup surface bounds F6, modal or otherwise.

import { useIsPhone } from "@/lib/use-is-phone"
import { Button } from "@/components/ui/button"
import { ResponsivePopover, ResponsivePopoverContent } from "@/components/ui/responsive-popover"

import { slimArrowDown } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import { valueStateDefaultText, valueStateIcons, type ValueState } from "@/components/ui/input"

// Fiori keyboard model for a closed Select (ui5-select): Up/Down/Home/End change the selection
// in place without opening; Alt+Down, Alt+Up, F4, Space and Enter open the list.
type SelectContextValue = {
  register: (value: string, node: HTMLElement | null, disabled: boolean) => void
  step: (current: string | undefined, key: "ArrowUp" | "ArrowDown" | "Home" | "End") => string | undefined
}
const SelectContext = React.createContext<SelectContextValue | null>(null)

// Select.js/_onkeydown and List's ItemNavigation leave F6 aliases untouched. Radix's
// composed Trigger/Content handlers match raw arrows, so filter their callback at the
// public asChild host boundary without cancelling the native event or adding a DOM node.
function SelectTriggerHost({ asChild, onKeyDown, aliasKeyDown, ...props }: React.ComponentProps<"button"> & {
  asChild?: boolean
  aliasKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>
}) {
  const Host = asChild ? Slot.Root : "button"
  return <Host {...props} onKeyDown={(event) => {
    if (isF6NavigationKey(event)) aliasKeyDown?.(event)
    else onKeyDown?.(event)
  }} />
}
function SelectContentHost({ asChild, onKeyDown, aliasKeyDown, ...props }: React.ComponentProps<"div"> & {
  asChild?: boolean
  aliasKeyDown?: React.KeyboardEventHandler<HTMLDivElement>
}) {
  const Host = asChild ? Slot.Root : "div"
  return <Host {...props} onKeyDown={(event) => {
    if (isF6NavigationKey(event)) aliasKeyDown?.(event)
    else onKeyDown?.(event)
  }} />
}

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

type SelectProps = React.ComponentProps<typeof SelectPrimitive.Root>

function Select({ value: valueProp, defaultValue, onValueChange, open: openProp, defaultOpen, onOpenChange, dir, ...props }: SelectProps) {
  const phone = useIsPhone()
  const phoneListId = React.useId()
  const [phoneState, setPhoneState] = React.useState<{ valueState: ValueState; message: React.ReactNode; accessibleName?: string }>({ valueState: "none", message: null })
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const value = valueProp ?? uncontrolledValue
  const changeTarget = React.useRef<HTMLDivElement>(null)
  const direction = useInheritedDirection(changeTarget, dir)
  const setValue = React.useCallback(
    (v: string) => {
      if (valueProp === undefined) setUncontrolledValue(v)
      onValueChange?.(v)
      // UI5 Select.js/_fireChangeEvent emits committed change independently of forms.
      // Bubble this semantic event so ToolbarItem can hear opaque function wrappers.
      changeTarget.current?.dispatchEvent(new Event("fiori-control-change", { bubbles: true }))
    },
    [valueProp, onValueChange]
  )
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen ?? false)
  const open = openProp ?? uncontrolledOpen
  const setOpen = React.useCallback(
    (o: boolean) => {
      if (openProp === undefined) setUncontrolledOpen(o)
      onOpenChange?.(o)
    },
    [openProp, onOpenChange]
  )

  const items = React.useRef(new Map<string, { node: HTMLElement; disabled: boolean }>())
  const ctx = React.useMemo<SelectContextValue>(
    () => ({
      register(v, node, disabled) {
        if (node) items.current.set(v, { node, disabled })
        else items.current.delete(v)
      },
      step(current, key) {
        const ordered = [...items.current.entries()]
          .filter(([, i]) => !i.disabled)
          .sort(([, a], [, b]) => (a.node.compareDocumentPosition(b.node) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
          .map(([v]) => v)
        if (!ordered.length) return undefined
        if (key === "Home") return ordered[0]
        if (key === "End") return ordered[ordered.length - 1]
        const i = current === undefined ? -1 : ordered.indexOf(current)
        if (key === "ArrowDown") return ordered[Math.min(i + 1, ordered.length - 1)]
        return i <= 0 ? ordered[0] : ordered[i - 1]
      },
    }),
    []
  )

  return (
    <SelectContext.Provider value={ctx}>
      <SelectOpenContext.Provider value={{ open, setOpen, value, setValue, changeTarget, phone, phoneState, setPhoneState, phoneListId, direction }}>
        <SelectPrimitive.Root dir={direction} data-slot="select" value={value} onValueChange={setValue} open={!phone && open} onOpenChange={setOpen} {...props} />
      </SelectOpenContext.Provider>
    </SelectContext.Provider>
  )
}

const SelectOpenContext = React.createContext<{
  open: boolean
  setOpen: (o: boolean) => void
  value: string | undefined
  setValue: (v: string) => void
  changeTarget: React.RefObject<HTMLDivElement | null>
  phone: boolean
  phoneListId: string
  direction: "ltr" | "rtl"
  phoneState: { valueState: ValueState; message: React.ReactNode; accessibleName?: string }
  setPhoneState: React.Dispatch<React.SetStateAction<{ valueState: ValueState; message: React.ReactNode; accessibleName?: string }>>
} | null>(null)

function SelectGroup(props: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue(props: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

/**
 * @accessibility Label.htmlFor / aria-label / aria-labelledby name SelectTrigger's combobox button. The component owns aria-expanded, aria-controls and aria-haspopup=listbox. Native aria-describedby reaches this trigger; a caller-supplied value currently replaces the built-in value-state message id rather than merging with it.
 * @accessibility Closed Up/Down/Home/End change selection; Enter, Space, F4 and Alt+Up/Down open. Popup arrows move option focus; Enter selects, Escape closes and restores trigger focus. SelectItem owns role=option, aria-selected and roving tabindex.
 */
type SelectTriggerProps = React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  valueState?: ValueState
  /** Shown below the field while focused; defaults to SAP's standard text. `null` hides it. */
  valueStateMessage?: React.ReactNode | null
  /** UI5 Select.js/valueStateTypeMappings; prefix of the phone state message. */
  valueStateTypeText?: Partial<Record<Exclude<ValueState, "none">, string>>
  readOnly?: boolean
  wrapperClassName?: string
}

function SelectTrigger({
  className,
  wrapperClassName,
  children,
  valueState = "none",
  valueStateMessage,
  valueStateTypeText,
  readOnly,
  disabled,
  onKeyDown,
  onKeyUp,
  onPointerDown,
  onClick,
  asChild,
  ...props
}: SelectTriggerProps) {
  const items = React.useContext(SelectContext)
  const state = React.useContext(SelectOpenContext)
  const messageId = React.useId()
  const hasState = valueState !== "none"
  const message = valueStateMessage === undefined && hasState ? valueStateDefaultText[valueState] : valueStateMessage
  const showMessage = hasState && message != null && !readOnly && !disabled

  React.useLayoutEffect(() => { state?.setPhoneState({ valueState, accessibleName: props["aria-label"], message: showMessage ? (valueStateMessage === undefined && hasState ? `${valueStateTypeText?.[valueState] ?? ({ negative: "Value State Error", critical: "Value State Warning", positive: "Value State Success", information: "Value State Information" }[valueState])} ${message}` : message) : null }) }, [valueState, message, showMessage, valueStateTypeText, props["aria-label"]])

  return (
    <div
      ref={state?.changeTarget}
      data-slot="select-trigger-wrapper"
      data-value-state={hasState ? valueState : undefined}
      data-disabled={disabled ? "" : undefined}
      data-readonly={readOnly ? "" : undefined}
      data-open={state?.open ? "" : undefined}
      data-icons=""
      style={{ "--fiori-field-icons": 1 } as React.CSSProperties}
      className={cn("fiori-field fiori-select group/field my-(--fiori-input-margin-top-bottom)", wrapperClassName)}
    >
      <SelectPrimitive.Trigger
        data-slot="select-trigger"
        {...(state?.phone ? { "aria-expanded": state.open, "aria-controls": state.phoneListId, tabIndex: state.open ? -1 : 0 } : {})}
        disabled={disabled || readOnly}
        aria-readonly={readOnly || undefined}
        aria-invalid={valueState === "negative" || undefined}
        aria-describedby={showMessage ? messageId : undefined}
        className={cn(
          "flex min-w-0 flex-1 cursor-[inherit] items-stretch border-0 bg-transparent p-0 text-start text-inherit outline-none [font:inherit]",
          "rounded-(--fiori-input-border-radius) [background:var(--fiori-select-bottom-border-gradient)]",
          "group-data-[value-state]/field:[background:none] group-data-readonly/field:[background:none] group-hover/field:[background:none]",
          className
        )}
        onKeyDown={(e) => {
          onKeyDown?.(e)
          if (e.defaultPrevented || !items || !state || state.open) return
          // Select.js/_onkeydown/_onkeyup: phone Space opens only on release;
          // Keys.js/isEnter/isSpace/isShow reject every extra modifier.
          if (state.phone) {
            const plain = !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault() // also suppress Radix's raw-key opener for modified keys
              if (plain && e.key === "Enter" && !disabled && !readOnly) state.setOpen(true)
              return
            }
            if (!plain && !(e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && (e.key === "ArrowDown" || e.key === "ArrowUp"))) {
              if (["ArrowDown", "ArrowUp", "Home", "End", "F4"].includes(e.key)) e.preventDefault()
              return
            }
          }
          if ((e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp")) || e.key === "F4") {
            e.preventDefault()
            state.setOpen(true)
            return
          }
          if (!e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End")) {
            e.preventDefault()
            const next = items.step(state.value, e.key)
            if (next !== undefined && next !== state.value) state.setValue(next)
          }
        }}
        onKeyUp={(e) => {
          onKeyUp?.(e)
          if (!e.defaultPrevented && state?.phone && e.key === " " && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && !disabled && !readOnly) {
            e.preventDefault()
            state.setOpen(true)
          }
        }}
        onPointerDown={(e) => {
          onPointerDown?.(e)
          if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || disabled || readOnly) return
          // Select.js/_onclick opens on the completed click. Radix opens on mouse-down,
          // which paints the open field while the pointer is still held; defer its handler.
          e.preventDefault()
        }}
        onClick={(e) => {
          onClick?.(e)
          if (e.defaultPrevented || disabled || readOnly) return
          e.currentTarget.focus()
          state?.setOpen(!state.open)
          e.preventDefault()
        }}
        {...props}
        asChild
      >
        <SelectTriggerHost asChild={asChild} aliasKeyDown={onKeyDown}>
        <span className="fiori-select__value">{children}</span>
        {!readOnly && (
          <SelectPrimitive.Icon asChild>
            <span className="fiori-field__icon">
              <Icon icon={slimArrowDown} />
            </span>
          </SelectPrimitive.Icon>
        )}
        </SelectTriggerHost>
      </SelectPrimitive.Trigger>
      {showMessage && (
        <div
          id={messageId}
          role="status"
          data-popover=""
          data-sap-ui-fastnavgroup-container="true"
          data-value-state={valueState}
          className="fiori-value-state-message absolute start-0 top-full z-50 mt-1 hidden max-w-[22rem] group-focus-within/field:block group-data-open/field:hidden"
        >
          <Icon icon={valueStateIcons[valueState]} />
          {message}
        </div>
      )}
    </div>
  )
}

/**
 * @accessibility aria-label / aria-labelledby name the desktop listbox content. On phones, dialogTitle labels the listbox; dialogLabel or dialogNamePrefix plus the trigger's aria-label name the modal dialog. The fallback does not resolve Label.htmlFor / aria-labelledby; provide dialogLabel for those naming paths. cancelText names its closing action.
 */
type SelectContentProps = React.ComponentProps<typeof SelectPrimitive.Content> & {
  onOpenAutoFocus?: (event: Event) => void
  dialogTitle?: string
  cancelText?: string
  dialogLabel?: string
  dialogNamePrefix?: string
}
const PhoneSelectItems = React.createContext<{ value: string | undefined; select: (value: string, close?: boolean) => void } | null>(null)

function SelectContent({
  className,
  children,
  position = "popper",
  sideOffset = 4,
  onKeyDown,
  onOpenAutoFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
  ref,
  asChild,
  dialogTitle = "All Items",
  cancelText = "Cancel",
  dialogLabel,
  dialogNamePrefix = "Select",
  ...props
}: SelectContentProps) {
  const state = React.useContext(SelectOpenContext)
  const [draft, setDraft] = React.useState(state?.value)
  const phoneList = React.useRef<HTMLDivElement>(null)
  const typedChars = React.useRef("")
  const typingTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  React.useEffect(() => () => clearTimeout(typingTimer.current), [])
  React.useLayoutEffect(() => { if (state?.open) setDraft(state.value) }, [state?.open])
  const closePhone = (escape = false, selected = draft) => {
    typedChars.current = ""
    if (!escape && selected !== undefined && selected !== state?.value) state?.setValue(selected)
    state?.setOpen(false)
  }
  const desktop = (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        sideOffset={sideOffset}
        className={cn(
          "fiori-popover relative z-50 max-h-(--radix-select-content-available-height) min-w-[6.25rem] origin-(--radix-select-content-transform-origin)",
          position === "popper" && "w-(--radix-select-trigger-width)",
          className
        )}
        {...props} ref={state?.phone ? undefined : ref} onCloseAutoFocus={state?.phone ? undefined : onCloseAutoFocus} onEscapeKeyDown={state?.phone ? undefined : onEscapeKeyDown} data-sap-ui-fastnavgroup-container="true"
        onKeyDown={onKeyDown}
        asChild
      >
        <SelectContentHost asChild={asChild} aliasKeyDown={onKeyDown}>
        <SelectPrimitive.ScrollUpButton className="flex h-6 cursor-default items-center justify-center text-(--sapContent_IconColor)">
          <Icon icon={slimArrowDown} className="rotate-180" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport data-sap-ui-fastnavgroup="true">{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex h-6 cursor-default items-center justify-center text-(--sapContent_IconColor)">
          <Icon icon={slimArrowDown} />
        </SelectPrimitive.ScrollDownButton>
        </SelectContentHost>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
  if (!state?.phone) return desktop
  // Keep Radix's hidden item collection for SelectValue, form integration and
  // closed keyboard navigation; the real phone list lives in a stretch Dialog.
  return <>{desktop}<ResponsivePopover dir={state.direction} open={state.open} onOpenChange={(open) => !open && closePhone(true)}>
    <ResponsivePopoverContent {...props} ref={ref} className={className} aria-label={props["aria-label"] ?? dialogLabel ?? (state.phoneState.accessibleName ? `${dialogNamePrefix} ${state.phoneState.accessibleName}` : undefined)} headerText={dialogTitle} phoneField phoneClassName="fiori-select-phone"
      phoneHeader={<div className="fiori-responsive-popover__rows"><div className="fiori-responsive-popover__row"><h1>{dialogTitle}</h1></div>
        {state.phoneState.valueState !== "none" && state.phoneState.valueState !== "positive" && state.phoneState.message != null &&
          <div data-value-state={state.phoneState.valueState} className="fiori-value-state-message fiori-select-phone__message">{state.phoneState.message}</div>}
      </div>}
      phoneFooter={<Button variant="transparent" onClick={() => closePhone()}>{cancelText}</Button>}
      onOpenAutoFocus={(event) => { onOpenAutoFocus?.(event); if (event.defaultPrevented) return; event.preventDefault(); phoneList.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus() }}
      onCloseAutoFocus={(event) => { onCloseAutoFocus?.(event); if (event.defaultPrevented) return; event.preventDefault(); state.changeTarget.current?.querySelector<HTMLElement>('[data-slot="select-trigger"]')?.focus() }}
      onEscapeKeyDown={(event) => { onEscapeKeyDown?.(event); if (!event.defaultPrevented) closePhone(true) }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        // Select.js/_onkeydown, attached to ResponsivePopover in
        // SelectPopoverTemplate.js, closes for Keys.js/isTabNext/isTabPrevious
        // anywhere on the picker. Use the normal close path to commit its draft.
        if (event.key === "Tab" && !event.altKey && !event.ctrlKey && !event.metaKey) { closePhone(); return }
        if (!phoneList.current?.contains(event.target as Node)) return
        if ((event.key === "F4" && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) || ((event.key === "ArrowDown" || event.key === "ArrowUp") && event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey)) { event.preventDefault(); closePhone(); return }
        const allOptions = [...(phoneList.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])]
        const options = allOptions.filter((option) => option.getAttribute("aria-disabled") !== "true")
        // Select.js/_handleKeyboardNavigation/_searchNextItemByText: Shift is
        // allowed for printable text, repeated letters cycle, timeout is 1000ms.
        if (event.key.length === 1 && event.key !== " " && !event.altKey && !event.ctrlKey && !event.metaKey) {
          typedChars.current += event.key.toLowerCase()
          const text = /^(.)\1+$/i.test(typedChars.current) ? event.key.toLowerCase() : typedChars.current
          clearTimeout(typingTimer.current)
          typingTimer.current = setTimeout(() => { typedChars.current = "" }, 1000)
          const selected = allOptions.findIndex((option) => option.dataset.value === draft)
          const ordered = [...allOptions.slice(selected + 1), ...allOptions.slice(0, Math.max(selected, 0))]
          const next = ordered.find((option) => (option.dataset.textValue ?? option.textContent ?? "").toLowerCase().startsWith(text))
          // _changeSelectedItem changes selected/focused properties, but does
          // not move DOM focus. List's own ItemNavigation owns actual focus.
          if (next) { setDraft(next.dataset.value); next.scrollIntoView({ block: "nearest" }) }
          return
        }
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
        const index = options.indexOf(document.activeElement as HTMLElement)
        // List.js/ItemNavigation: Page keys skip ten enabled items and clamp.
        const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : event.key === "ArrowDown" ? Math.min(index + 1, options.length - 1) : event.key === "ArrowUp" ? Math.max(index - 1, 0) : event.key === "PageDown" ? Math.min(index + 10, options.length - 1) : event.key === "PageUp" ? Math.max(index - 10, 0) : -1
        if (index >= 0 && next >= 0) {
          event.preventDefault(); options[next]?.focus(); options[next]?.scrollIntoView({ block: "nearest" })
          // Select.js has no Page selection handler: those keys move List focus
          // only, and the focused row is committed later by Enter/Space.
          if (event.key !== "PageDown" && event.key !== "PageUp") {
            const selected = allOptions.findIndex((option) => option.dataset.value === draft)
            const selectedIndex = event.key === "Home" ? 0 : event.key === "End" ? allOptions.length - 1 : event.key === "ArrowDown" ? Math.min(selected + 1, allOptions.length - 1) : Math.max(selected - 1, 0)
            setDraft(allOptions[selectedIndex]?.dataset.value)
          }
        }
      }}>
      <PhoneSelectItems.Provider value={{ value: draft, select: (value, close = true) => { setDraft(value); if (close) closePhone(false, value) } }}>
        <div ref={phoneList} id={state.phoneListId} role="listbox" aria-label={dialogTitle} data-slot="select-phone-list" data-sap-ui-fastnavgroup="true">{children}</div>
      </PhoneSelectItems.Provider>
    </ResponsivePopoverContent>
  </ResponsivePopover></>
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "flex h-(--fiori-list-item-base-height) items-center px-4 font-(family-name:--sapFontBoldFamily) text-(length:--sapFontSize)",
        "border-b border-(--sapList_GroupHeaderBorderColor) bg-(--sapList_GroupHeaderBackground) text-(--sapList_GroupHeaderTextColor)",
        className
      )}
      {...props}
    />
  )
}

function SelectItem({ className, children, value, disabled = false, asChild, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  const ctx = React.useContext(SelectContext)
  const phoneItems = React.useContext(PhoneSelectItems)
  const ref = React.useCallback(
    (node: HTMLDivElement | null) => ctx?.register(value, node, disabled),
    [ctx, value, disabled]
  )
  const PhoneHost = asChild ? Slot.Root : "div"
  if (phoneItems) return <PhoneHost {...props} data-slot="select-item" data-value={value} data-text-value={props.textValue} role="option" aria-selected={phoneItems.value === value} aria-disabled={disabled || undefined}
    tabIndex={!disabled && phoneItems.value === value ? 0 : -1} data-state={phoneItems.value === value ? "checked" : "unchecked"}
    className={cn("fiori-list-item", className)} onMouseDown={(event) => { props.onMouseDown?.(event); event.preventDefault() }}
    onClick={(event) => { props.onClick?.(event); if (!event.defaultPrevented && !disabled) phoneItems.select(value) }} onKeyDown={(event) => {
      props.onKeyDown?.(event)
      // Option.js inherits ListItemBase: Enter presses on keydown; plain Space
      // only prevents scrolling here and presses on keyup.
      if (event.defaultPrevented || disabled || event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (event.key === " ") event.preventDefault()
      if (event.key === "Enter") { event.preventDefault(); phoneItems.select(value) }
    }} onKeyUp={(event) => {
      props.onKeyUp?.(event)
      if (!event.defaultPrevented && !disabled && event.target === event.currentTarget && event.key === " " && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) phoneItems.select(value)
    }}>{children}</PhoneHost>
  return (
    <SelectPrimitive.Item
      ref={ref}
      data-slot="select-item"
      asChild={asChild}
      value={value}
      disabled={disabled}
      className={cn("fiori-list-item", className)}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator data-slot="select-separator" className={cn("h-px bg-(--sapList_BorderColor)", className)} {...props} />
}

export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue }
