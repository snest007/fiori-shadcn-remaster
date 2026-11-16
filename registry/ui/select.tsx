import * as React from "react"
import { createPortal } from "react-dom"
import { isF6NavigationKey } from "@/lib/fiori-f6"
import { Select as SelectPrimitive, Slot } from "radix-ui"

// UI5 2.28 SelectPopoverTemplate.js renders an internal List (fastNavigation metadata).

// UI5 2.28 Popup.js/onEnterDOM: every rendered Popup surface bounds F6, modal or otherwise.

import { useIsPhone } from "@/lib/use-is-phone"
import { Button } from "@/components/ui/button"
import { Title } from "@/components/ui/title"
import { ResponsivePopover, ResponsivePopoverContent } from "@/components/ui/responsive-popover"

import { slimArrowDown } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import { valueStateDefaultText, valueStateIcons, type ValueState } from "@/components/ui/input"

// Fiori keyboard model for a closed Select (ui5-select): Up/Down/Home/End change the selection
// in place without opening; Alt+Down, Alt+Up, F4, Space and Enter open the list.
type SelectContextValue = {
  register: (value: string, node: HTMLElement | null, disabled: boolean) => (() => void) | undefined
  count: number
  groupCount: number
  texts: SelectTexts
  registerGroup: (id: string, node: HTMLElement | null) => void
  announce: (value: string | undefined, open: boolean) => void
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
function SelectContentHost({ asChild, onKeyDown, aliasKeyDown, popupDialog, popupLabel, ...props }: React.ComponentProps<"div"> & {
  asChild?: boolean
  aliasKeyDown?: React.KeyboardEventHandler<HTMLDivElement>
  popupDialog?: boolean
  popupLabel?: string
}) {
  const Host = asChild ? Slot.Root : "div"
  const content = <Host {...props} onKeyDown={(event) => {
    if (isF6NavigationKey(event)) aliasKeyDown?.(event)
    else onKeyDown?.(event)
  }} />
  // UI5 SelectPopoverTemplate.js: ListBox inside PopupTemplate.js dialog/aria-modal.
  return popupDialog ? <div role="dialog" aria-modal="true" aria-label={popupLabel} className="flex min-h-0 flex-1 flex-col max-h-full">{content}</div> : content
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

type SelectTexts = {
  roleDescription: string
  optionsInGroups: (count: number, groups: number) => string
  itemPosition: (position: number, count: number) => string
}
type SelectProps = React.ComponentProps<typeof SelectPrimitive.Root> & {
  texts?: Partial<SelectTexts>
  /** Locale for numbers in the default group and position descriptions. */
  locale?: string
}

function Select({ value: valueProp, defaultValue, onValueChange, open: openProp, defaultOpen, onOpenChange, dir, texts, locale, ...props }: SelectProps) {
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
  const itemHosts = React.useRef(new Map<string, Map<HTMLElement, { node: HTMLElement; disabled: boolean }>>())
  const groups = React.useRef(new Map<string, HTMLElement>())
  const [revision, setRevision] = React.useState(0)
  const register = React.useCallback((v: string, node: HTMLElement | null, disabled: boolean) => {
    if (!node) return
    let hosts = itemHosts.current.get(v)
    if (!hosts) { hosts = new Map(); itemHosts.current.set(v, hosts) }
    const registeredHosts = hosts
    registeredHosts.set(node, { node, disabled })
    const reconcile = () => {
      const remaining = [...registeredHosts.values()].reverse()
      // The hidden Radix collection and visible phone option represent one
      // native Select option. Retain both host registrations; closing the
      // dialog must restore the closed-keyboard collection, not erase it.
      const next = remaining.find((item) => item.node.isConnected) ?? remaining[0]
      const prior = items.current.get(v)
      if (next) items.current.set(v, next)
      else { items.current.delete(v); itemHosts.current.delete(v) }
      if (prior?.node !== next?.node || prior?.disabled !== next?.disabled) setRevision((n) => n + 1)
    }
    reconcile()
    return () => { registeredHosts.delete(node); reconcile() }
  }, [])
  const registerGroup = React.useCallback((id: string, node: HTMLElement | null) => {
    if (node) { if (groups.current.get(id) === node) return; groups.current.set(id, node) }
    else if (!groups.current.delete(id)) return
    setRevision((n) => n + 1)
  }, [])
  const t = React.useMemo<SelectTexts>(() => {
    const number = new Intl.NumberFormat(locale ?? (typeof navigator === "undefined" ? "en" : navigator.language))
    return {
      roleDescription: "Listbox", // UI5 SELECT_ROLE_DESCRIPTION
      optionsInGroups: (count, groupCount) => `${number.format(count)} results are available in ${number.format(groupCount)} groups`, // UI5 SELECT_OPTIONS_IN_GROUPS
      itemPosition: (position, count) => `List item ${number.format(position)} of ${number.format(count)}`, // UI5 LIST_ITEM_POSITION
      ...texts,
    }
  }, [locale, texts])
  const [announcement, setAnnouncement] = React.useState({ text: "", sequence: 0 })
  const [announcementTarget, setAnnouncementTarget] = React.useState<HTMLElement | null>(null)
  const announce = React.useCallback((next: string | undefined, isOpen: boolean) => {
    const ordered = [...items.current.entries()].sort(([, a], [, b]) => (a.node.compareDocumentPosition(b.node) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    const index = ordered.findIndex(([key]) => key === next)
    if (index < 0) return
    const node = ordered[index][1].node
    const popup = node.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]')
    setAnnouncementTarget((isOpen ? popup : changeTarget.current?.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]')) ?? document.body)
    setAnnouncement((old) => ({ text: `${node.textContent ?? ""}${isOpen ? ` ${t.itemPosition(index + 1, ordered.length)}` : ""}`.trim(), sequence: old.sequence + 1 }))
  }, [t])
  const previousOpen = React.useRef(false)
  React.useLayoutEffect(() => {
    if (!open) { previousOpen.current = false; return }
    if (!previousOpen.current && items.current.get(value ?? "")?.node.isConnected) {
      previousOpen.current = true
      announce(value, true)
    }
  }, [open, value, revision, announce])
  React.useEffect(() => {
    if (!announcement.text) return
    // InvisibleMessage.js clears the last announcement after 3000 ms.
    const timer = setTimeout(() => setAnnouncement((old) => old.sequence === announcement.sequence ? { ...old, text: "" } : old), 3000)
    return () => clearTimeout(timer)
  }, [announcement])
  const ctx = React.useMemo<SelectContextValue>(
    () => ({
      register, registerGroup, count: items.current.size, groupCount: groups.current.size, texts: t, announce,
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
    [register, registerGroup, revision, t, announce]
  )

  return (
    <SelectContext.Provider value={ctx}>
      <SelectOpenContext.Provider value={{ open, setOpen, value, setValue, changeTarget, phone, phoneState, setPhoneState, phoneListId, direction }}>
        <SelectPrimitive.Root dir={direction} data-slot="select" value={value} onValueChange={setValue} open={!phone && open} onOpenChange={setOpen} {...props} />
      </SelectOpenContext.Provider>
      {/* Select.js:itemSelectionAnnounce uses Polite; Popup routes its region inside
          the dialog while open so modal accessibility scoping preserves it. */}
      {announcementTarget && createPortal(<span data-slot="select-announcement" className="sr-only" role="alert" aria-live="polite" aria-atomic="true"><span key={announcement.sequence}>{announcement.text}</span></span>, announcementTarget)}
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

function SelectGroup({ ref, ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) {
  const ctx = React.useContext(SelectContext)
  const id = React.useId()
  const register = ctx?.registerGroup
  const setRef = React.useCallback((node: HTMLDivElement | null) => {
    register?.(id, node)
    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node
  }, [register, id, ref])
  return <SelectPrimitive.Group data-slot="select-group" {...props} ref={setRef} />
}

function SelectValue(props: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

/**
 * @accessibility Label.htmlFor / aria-label / aria-labelledby name SelectTrigger's combobox button. aria-description and aria-describedby are merged with its owned value-state and group-count descriptions. The trigger owns aria-expanded, aria-controls and aria-haspopup=listbox; texts.roleDescription describes its role.
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
  "aria-describedby": descriptionRefs,
  "aria-description": description,
  "aria-roledescription": roleDescription,
  ...props
}: SelectTriggerProps) {
  const items = React.useContext(SelectContext)
  const state = React.useContext(SelectOpenContext)
  const messageId = React.useId()
  const descriptionId = React.useId()
  const groupCountId = React.useId()
  const hasState = valueState !== "none"
  const message = valueStateMessage === undefined && hasState ? valueStateDefaultText[valueState] : valueStateMessage
  const showMessage = hasState && message != null && !readOnly && !disabled

  React.useLayoutEffect(() => {
    const trigger = state?.changeTarget.current?.querySelector<HTMLElement>('[data-slot="select-trigger"]')
    if (!trigger) return
    // Select.js:ariaLabelText and AccessibilityTextsHelper.js resolve referenced
    // text before aria-label, then associated labels. Keep the header title
    // independent of this field name (Select.js:_headerTitleText).
    const update = () => {
      const refs = trigger.getAttribute("aria-labelledby")?.split(/\s+/).filter(Boolean)
      const referenced = refs?.map((id) => trigger.ownerDocument.getElementById(id)?.textContent ?? "").filter(Boolean).join(" ")
      const associated = trigger.id ? [...trigger.ownerDocument.querySelectorAll<HTMLLabelElement>("label[for]")].filter((label) => label.htmlFor === trigger.id).map((label) => label.textContent ?? "").filter(Boolean).join(" ") : ""
      const accessibleName = (refs?.length ? referenced : trigger.getAttribute("aria-label")) || associated || undefined
      const phoneMessage = showMessage ? (valueStateMessage === undefined && hasState ? `${valueStateTypeText?.[valueState] ?? ({ negative: "Value State Error", critical: "Value State Warning", positive: "Value State Success", information: "Value State Information" }[valueState])} ${message}` : message) : null
      state?.setPhoneState((previous) => previous.valueState === valueState && previous.accessibleName === accessibleName && previous.message === phoneMessage ? previous : { valueState, accessibleName, message: phoneMessage })
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(trigger.ownerDocument.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["id", "for", "aria-label", "aria-labelledby"] })
    return () => observer.disconnect()
  }, [valueState, message, showMessage, valueStateTypeText, props["aria-label"], props["aria-labelledby"], props.id])

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
        aria-describedby={cn(descriptionRefs, description && descriptionId, showMessage && messageId, items?.groupCount && groupCountId) || undefined}
        aria-roledescription={roleDescription ?? items?.texts.roleDescription}
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
            if (next !== undefined && next !== state.value) {
              state.setValue(next)
              // Select.js:_handleArrowNavigation announces the text without a
              // position while the trigger is focused and its picker is closed.
              items.announce(next, false)
            }
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
        tabIndex={state?.open ? -1 : props.tabIndex ?? (state?.phone ? 0 : undefined)}
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
      {description && <span hidden id={descriptionId}>{description}</span>}
      {!!items?.groupCount && <span hidden id={groupCountId}>{items.texts.optionsInGroups(items.count, items.groupCount)}</span>}
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
 * @accessibility aria-label / aria-labelledby name the desktop listbox content. On phones the resolved trigger name (aria-labelledby, aria-label, or Label.htmlFor) names the listbox; dialogLabel or dialogNamePrefix plus that name names the modal dialog. dialogTitle is the visible header and unnamed-list fallback. cancelText names its closing action.
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
  dialogTitle = "All Items", // UI5 SELECT_LISTBOX_LABEL
  cancelText = "Cancel", // UI5 SELECT_DIALOG_CANCEL_BUTTON
  dialogLabel,
  dialogNamePrefix = "Select:", // UI5 SELECT_POPOVER_ACCESSIBLE_NAME_PREFIX
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
        <SelectContentHost asChild={asChild} aliasKeyDown={onKeyDown} popupDialog={!state?.phone} popupLabel={state?.phone ? undefined : dialogLabel ?? (state?.phoneState.accessibleName ? `${dialogNamePrefix} ${state.phoneState.accessibleName}` : dialogTitle)}>
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
    <ResponsivePopoverContent {...props} ref={ref} className={className} aria-label={props["aria-label"] ?? dialogLabel ?? `${dialogNamePrefix} ${state.phoneState.accessibleName || dialogTitle}`} headerText={dialogTitle} phoneField phoneClassName="fiori-select-phone"
      // SelectPopoverTemplate.js uses Title's default H2 accessibility level.
      phoneHeader={<div className="fiori-responsive-popover__rows"><div className="fiori-responsive-popover__row"><Title wrappingType="None" className="w-full">{dialogTitle}</Title></div>
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
        <div ref={phoneList} id={state.phoneListId} role="listbox" aria-label={state.phoneState.accessibleName || dialogTitle} data-slot="select-phone-list" data-sap-ui-fastnavgroup="true">{children}</div>
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

function SelectItem({ className, children, value, disabled = false, asChild, ref: consumerRef, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  const ctx = React.useContext(SelectContext)
  const phoneItems = React.useContext(PhoneSelectItems)
  const ref = React.useCallback(
    (node: HTMLDivElement | null) => {
      const unregister = ctx?.register(value, node, disabled)
      const cleanup = typeof consumerRef === "function" ? consumerRef(node) : undefined
      if (consumerRef && typeof consumerRef !== "function") consumerRef.current = node
      return () => {
        unregister?.()
        if (typeof cleanup === "function") cleanup()
        else if (typeof consumerRef === "function") consumerRef(null)
        else if (consumerRef) consumerRef.current = null
      }
    },
    [ctx?.register, value, disabled, consumerRef]
  )
  const generatedId = React.useId()
  const custom = phoneItems && asChild ? React.Children.only(children) as React.ReactElement<React.ComponentProps<"div">> : undefined
  const customRef = custom?.props.ref
  const phoneRef = React.useCallback((node: HTMLDivElement | null) => {
    const cleanup = ref(node)
    const customCleanup = typeof customRef === "function" ? customRef(node) : undefined
    if (customRef && typeof customRef !== "function") customRef.current = node
    return () => {
      if (typeof cleanup === "function") cleanup(); else ref(null)
      if (typeof customCleanup === "function") customCleanup()
      else if (typeof customRef === "function") customRef(null)
      else if (customRef) customRef.current = null
    }
  }, [ref, customRef])
  if (phoneItems) {
    const phoneProps: React.ComponentProps<"div"> & { "data-slot": string; "data-value": string; "data-text-value"?: string; "data-state": string } = { ...props, ref: phoneRef, id: props.id ?? custom?.props.id ?? generatedId, "data-slot": "select-item", "data-value": value, "data-text-value": props.textValue, role: "option", "aria-selected": phoneItems.value === value, "aria-checked": undefined, "aria-pressed": undefined, "aria-disabled": disabled || undefined,
    tabIndex: !disabled && phoneItems.value === value ? 0 : -1, "data-state": phoneItems.value === value ? "checked" : "unchecked",
    className: cn("fiori-list-item", custom?.props.className, className), onMouseDown: (event) => { custom?.props.onMouseDown?.(event); props.onMouseDown?.(event); event.preventDefault() },
    onClick: (event) => { custom?.props.onClick?.(event); props.onClick?.(event); if (!event.defaultPrevented && !disabled) phoneItems.select(value) }, onKeyDown: (event) => {
      custom?.props.onKeyDown?.(event); props.onKeyDown?.(event)
      if (event.defaultPrevented || disabled || event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (event.key === " ") event.preventDefault()
      if (event.key === "Enter") { event.preventDefault(); phoneItems.select(value) }
    }, onKeyUp: (event) => {
      custom?.props.onKeyUp?.(event); props.onKeyUp?.(event)
      if (!event.defaultPrevented && !disabled && event.target === event.currentTarget && event.key === " " && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) phoneItems.select(value)
    } }
    // OptionTemplate.js/ListItemBaseTemplate.js own the option host. Slot lets
    // the child overwrite those props; reconstruct a valid custom host with
    // owned role/state/id/navigation channels applied last.
    return custom ? React.cloneElement(custom, phoneProps) : <div {...phoneProps}>{children}</div>
  }
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

export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue, type SelectProps, type SelectTexts }
