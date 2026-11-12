import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

// UI5 2.28 Popup.js/onEnterDOM: every rendered Popup surface bounds F6, modal or otherwise.

import type { FioriIconData } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import { valueStateDefaultText, valueStateIcons, type ValueState } from "@/components/ui/input"
import { usePopupMediaRange } from "@/components/ui/popover"

// The field + value-help popover that ui5-date-picker, ui5-daterange-picker, ui5-datetime-picker and
// ui5-time-picker share: a ui5-input (DateTimeInput) with a value-help icon, and a ResponsivePopover
// below it (no arrow, overlapping the field's bottom edge, the value state message as its header).
// F4 / Alt+↓ / Alt+↑ open it (F4 doesn't close it again: inside, F4 belongs to the calendar),
// Alt+↓ / Alt+↑ / Escape close it, Tab out of the field closes it. On close focus returns to the field.

type PickerFieldProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "size" | "children"> & {
  /** The text in the field. */
  value: string
  /** Live typing. */
  onTextChange?: (text: string) => void
  /** Enter, or leaving the field with changed text (UI5's change). */
  onCommit?: (text: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  valueState?: ValueState
  valueStateMessage?: React.ReactNode | null
  /** Value-help icon. */
  icon: FioriIconData
  /** Accessible names of the value-help icon, closed / open. */
  openIconLabel?: string
  closeIconLabel?: string
  /** aria-roledescription of the input ("Date Input", "Time Input" ...). */
  roleDescription?: string
  /** Accessible name of the popover. */
  pickerLabel?: string
  /** Popover content. */
  children?: React.ReactNode
  /** Popover footer (buttons). */
  footer?: React.ReactNode
  popoverClassName?: string
  wrapperClassName?: string
  /** Keys pressed in the field or the popover. Call preventDefault() to stop the default handling. */
  onPickerKeyDown?: (e: React.KeyboardEvent<HTMLElement>, inPopover: boolean) => void
  inputRef?: React.Ref<HTMLInputElement>
  /** F4 also closes the open popover (TimePicker). Off for the date pickers, where F4 is the calendar's. */
  f4Closes?: boolean
}

// UI5 Keys.js/isShowByArrows is Alt-only; Meta+Alt belongs to F6 navigation.
const isShowKey = (e: React.KeyboardEvent) =>
  (e.key === "F4" && !e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey) ||
  ((e.key === "ArrowDown" || e.key === "ArrowUp") && e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey)

function PickerField({
  value,
  onTextChange,
  onCommit,
  open: openProp,
  onOpenChange,
  valueState = "none",
  valueStateMessage,
  icon,
  openIconLabel = "Open Picker",
  closeIconLabel = "Close Picker",
  roleDescription,
  pickerLabel,
  children,
  footer,
  popoverClassName,
  wrapperClassName,
  className,
  onPickerKeyDown,
  inputRef: inputRefProp,
  f4Closes,
  disabled,
  readOnly,
  id,
  onKeyDown,
  onBlur,
  onFocus,
  "aria-describedby": ariaDescribedBy,
  ...props
}: PickerFieldProps) {
  const open = openProp && !disabled && !readOnly
  const inputRef = React.useRef<HTMLInputElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  React.useImperativeHandle(inputRefProp, () => inputRef.current!)
  const lastValue = React.useRef(value)
  const autoId = React.useId()
  const baseId = id ?? autoId
  const messageId = `${baseId}-vsm`

  const hasState = valueState !== "none"
  const message = valueStateMessage === undefined && hasState ? valueStateDefaultText[valueState] : valueStateMessage
  const showMessage = hasState && message != null && !readOnly && !disabled
  const showHeader = showMessage && valueState !== "positive"

  const commit = (text: string) => {
    if (text !== lastValue.current) {
      lastValue.current = text
      onCommit?.(text)
    }
  }
  React.useEffect(() => {
    lastValue.current = value
    // Only external changes reset the "last committed" text; typing goes through commit().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setOpen = (o: boolean) => {
    if (o === open) return
    onOpenChange(o)
  }
  // Closing (by any means) returns focus to the field when it was inside the popover (UI5 focuses the input).
  const wasOpen = React.useRef(open)
  React.useEffect(() => {
    const active = document.activeElement
    if (wasOpen.current && !open && (!active || active === document.body || contentRef.current?.contains(active))) inputRef.current?.focus()
    wasOpen.current = open
  }, [open])
  const close = () => {
    setOpen(false)
    inputRef.current?.focus()
  }

  const handleKey = (e: React.KeyboardEvent<HTMLElement>, inPopover: boolean) => {
    onPickerKeyDown?.(e, inPopover)
    if (e.defaultPrevented) return
    if (isShowKey(e)) {
      if (open && e.key === "F4" && !f4Closes) return // F4 inside the popover is the calendar's month picker shortcut
      e.preventDefault()
      if (open) close()
      else if (!readOnly && !disabled) {
        commit(inputRef.current?.value ?? value)
        setOpen(true)
      }
    }
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(o) => !o && setOpen(false)}>
      <PopoverPrimitive.Anchor asChild>
        <div
          data-slot="picker-field"
          data-value-state={hasState ? valueState : undefined}
          data-disabled={disabled ? "" : undefined}
          data-readonly={readOnly ? "" : undefined}
          data-open={open ? "" : undefined}
          data-icons={readOnly ? undefined : ""}
          style={{ "--fiori-field-icons": readOnly ? 0 : 1 } as React.CSSProperties}
          className={cn("fiori-field fiori-picker-field group/field my-(--fiori-input-margin-top-bottom)", wrapperClassName)}
        >
          <input
            ref={inputRef}
            id={id}
            type="text"
            autoComplete="off"
            aria-roledescription={roleDescription}
            aria-haspopup="grid"
            aria-invalid={valueState === "negative" || undefined}
            aria-describedby={cn(ariaDescribedBy, showMessage && messageId) || undefined}
            disabled={disabled}
            readOnly={readOnly}
            value={value}
            className={cn("fiori-field__input", className)}
            onChange={(e) => onTextChange?.(e.target.value)}
            onKeyDown={(e) => {
              onKeyDown?.(e)
              if (e.defaultPrevented) return
              if (e.key === "Enter") commit(e.currentTarget.value)
              if (e.key === "Tab" && open) setOpen(false)
              handleKey(e, false)
            }}
            onFocus={(e) => {
              lastValue.current = e.currentTarget.value
              onFocus?.(e)
            }}
            onBlur={(e) => {
              if (contentRef.current?.contains(e.relatedTarget as Node)) return
              commit(e.currentTarget.value)
              onBlur?.(e)
            }}
            {...props}
          />
          {!readOnly && (
            <span className="fiori-picker-field__icon-root">
            <span
              data-slot="picker-field-icon"
              role="button"
              aria-label={open ? closeIconLabel : openIconLabel}
              title={open ? closeIconLabel : openIconLabel}
              aria-hidden={disabled || undefined}
              data-pressed={open ? "" : undefined}
              className="fiori-picker-field__icon"
              onMouseDown={(e) => {
                e.preventDefault()
                if (!disabled) inputRef.current?.focus()
              }}
              onClick={() => {
                if (disabled) return
                if (!open) commit(inputRef.current?.value ?? value)
                setOpen(!open)
              }}
            >
              <Icon icon={icon} />
            </span>
            </span>
          )}
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
      </PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content data-sap-ui-fastnavgroup-container="true"
          ref={contentRef}
          data-slot="picker-popover"
          side="bottom"
          align="start"
          sideOffset={0}
          collisionPadding={10}
          aria-label={pickerLabel}
          role="dialog"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            e.preventDefault()
            close()
          }}
          onInteractOutside={(e) => {
            if (inputRef.current?.parentElement?.contains(e.target as Node)) e.preventDefault()
          }}
          onFocusOutside={(e) => {
            // Focus moving back to our own field doesn't close the popover.
            if (inputRef.current?.parentElement?.contains(e.target as Node)) e.preventDefault()
          }}
          onKeyDown={(e) => handleKey(e, true)}
          className={cn("fiori-popover fiori-picker-popover z-50 flex max-h-(--radix-popover-content-available-height) flex-col", popoverClassName)}
        >
          <PickerPopoverBody valueState={showHeader ? valueState : "none"} message={message} footer={footer}>
            {children}
          </PickerPopoverBody>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

type PickerPopoverBodyProps = {
  /** Shown as the header when not "none" / "positive". */
  valueState?: ValueState
  message?: React.ReactNode
  footer?: React.ReactNode
  children?: React.ReactNode
}

/** What the picker popover shows: value state header, content, footer. */
function PickerPopoverBody({ valueState = "none", message, footer, children }: PickerPopoverBodyProps) {
  // The footer's side padding follows the popup's media range (S / M-L / XL), like every UI5 popup.
  const [footerRef, range] = usePopupMediaRange<HTMLDivElement>()
  const header = valueState !== "none" && valueState !== "positive"
  return (
    <>
      {header && (
        <div data-value-state={valueState} className="fiori-value-state-message fiori-picker-popover__header">
          <Icon icon={valueStateIcons[valueState]} />
          {message ?? valueStateDefaultText[valueState]}
        </div>
      )}
      <div className="fiori-picker-popover__content">{children}</div>
      {footer && (
        <div ref={footerRef} data-media-range={range} className="fiori-picker-popover__footer">
          {footer}
        </div>
      )}
    </>
  )
}

/** Placeholder text UI5 shows when none is given: "e.g. " + an example value. */
const examplePlaceholder = (example: string, prefix = "e.g.") => `${prefix} ${example}`

export { PickerField, PickerPopoverBody, examplePlaceholder, type PickerFieldProps, type PickerPopoverBodyProps }
