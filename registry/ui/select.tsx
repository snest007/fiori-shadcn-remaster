import * as React from "react"
import { isF6NavigationKey } from "@/lib/fiori-f6"
import { Select as SelectPrimitive } from "radix-ui"

// UI5 2.28 SelectPopoverTemplate.js renders an internal List (fastNavigation metadata).

// UI5 2.28 Popup.js/onEnterDOM: every rendered Popup surface bounds F6, modal or otherwise.

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

type SelectProps = React.ComponentProps<typeof SelectPrimitive.Root>

function Select({ value: valueProp, defaultValue, onValueChange, open: openProp, defaultOpen, onOpenChange, ...props }: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const value = valueProp ?? uncontrolledValue
  const changeTarget = React.useRef<HTMLDivElement>(null)
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
      <SelectOpenContext.Provider value={{ open, setOpen, value, setValue, changeTarget }}>
        <SelectPrimitive.Root data-slot="select" value={value} onValueChange={setValue} open={open} onOpenChange={setOpen} {...props} />
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
} | null>(null)

function SelectGroup(props: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue(props: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

type SelectTriggerProps = React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  valueState?: ValueState
  /** Shown below the field while focused; defaults to SAP's standard text. `null` hides it. */
  valueStateMessage?: React.ReactNode | null
  readOnly?: boolean
  wrapperClassName?: string
}

function SelectTrigger({
  className,
  wrapperClassName,
  children,
  valueState = "none",
  valueStateMessage,
  readOnly,
  disabled,
  onKeyDown,
  onPointerDown,
  onClick,
  ...props
}: SelectTriggerProps) {
  const items = React.useContext(SelectContext)
  const state = React.useContext(SelectOpenContext)
  const messageId = React.useId()
  const hasState = valueState !== "none"
  const message = valueStateMessage === undefined && hasState ? valueStateDefaultText[valueState] : valueStateMessage
  const showMessage = hasState && message != null && !readOnly && !disabled

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
          // Select.js/_onkeydown ignores F6 aliases. Prevent only Radix's raw arrow opener; keep bubbling.
          if (isF6NavigationKey(e)) { if (e.key !== "F6" && e.keyCode !== 117) e.preventDefault(); return }
          if (e.defaultPrevented || !items || !state || state.open) return
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
      >
        <span className="fiori-select__value">{children}</span>
        {!readOnly && (
          <SelectPrimitive.Icon asChild>
            <span className="fiori-field__icon">
              <Icon icon={slimArrowDown} />
            </span>
          </SelectPrimitive.Icon>
        )}
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

function SelectContent({
  className,
  children,
  position = "popper",
  sideOffset = 4,
  onKeyDown,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
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
        {...props} data-sap-ui-fastnavgroup-container="true"
        onKeyDown={(event) => {
          onKeyDown?.(event)
          // UI5 List ItemNavigation ignores modified arrows; suppress Radix's deferred raw arrow focus.
          if (isF6NavigationKey(event) && event.key !== "F6" && event.keyCode !== 117) event.preventDefault()
        }}
      >
        <SelectPrimitive.ScrollUpButton className="flex h-6 cursor-default items-center justify-center text-(--sapContent_IconColor)">
          <Icon icon={slimArrowDown} className="rotate-180" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport data-sap-ui-fastnavgroup="true">{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex h-6 cursor-default items-center justify-center text-(--sapContent_IconColor)">
          <Icon icon={slimArrowDown} />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
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

function SelectItem({ className, children, value, disabled = false, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  const ctx = React.useContext(SelectContext)
  const ref = React.useCallback(
    (node: HTMLDivElement | null) => ctx?.register(value, node, disabled),
    [ctx, value, disabled]
  )
  return (
    <SelectPrimitive.Item
      ref={ref}
      data-slot="select-item"
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
