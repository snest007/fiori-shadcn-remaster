import * as React from "react"

import { browseFolder, decline } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import { valueStateDefaultText, valueStateIcons, type ValueState } from "@/components/ui/input"

type FileSizeExceed = { fileName: string; fileSize: number }

/**
 * @accessibility aria-label names the native file input. The component adds aria-haspopup=dialog and roleDescription; inputTitle, browseTitle and clearTitle override tooltips, and valueStateMessage supplies a linked validation description.
 * @accessibility Enter, Space, F4 or Alt+Up/Down opens the native file picker; Delete clears the selection. hideInput composes a visible Button while the native input remains the keyboard target.
 */
type FileUploaderProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  /** Form field name of the native file input. */
  name?: string
  /** Allowed types, as the native `accept` attribute (".pdf,image/*"). */
  accept?: string
  multiple?: boolean
  disabled?: boolean
  required?: boolean
  /** Max size per file in MB; larger selections are rejected and `onFileSizeExceed` fires. */
  maxFileSize?: number
  placeholder?: string
  valueState?: ValueState
  /** Shown below the field while it has focus; defaults to SAP's standard text. `null` hides it. */
  valueStateMessage?: React.ReactNode | null
  /** Fires with the new selection (an empty array after clearing). Upload transport is up to the caller. */
  onFilesChange?: (files: File[]) => void
  onFileSizeExceed?: (files: FileSizeExceed[]) => void
  /** Render only `children` (e.g. a Button) as the opener, without the input-styled field. */
  hideInput?: boolean
  /** Accessible name of the native input. */
  "aria-label"?: string
  /** Tooltips; UI5's defaults. */
  inputTitle?: string
  browseTitle?: string
  clearTitle?: string
  /** aria-roledescription (default "File Uploader"). */
  roleDescription?: string
  /** Advanced: the native input element. */
  inputRef?: React.Ref<HTMLInputElement>
}

// Mirrors ui5-file-uploader (Horizon): an input-styled field showing the selected file names (as read-only
// tokens) with a clear icon and a browse icon; or, with `hideInput`, any opener passed as children.
// The native <input type="file"> keeps the focus (aria-haspopup="dialog", roledescription "File Uploader").
// Keyboard (as UI5): Enter (key down), Space / F4 / Alt+↑ / Alt+↓ (key up) open the file picker; Delete
// clears the selection. Clicking anywhere on the field opens the picker. Files can be dropped on it.
function FileUploader({
  name,
  accept,
  multiple,
  disabled,
  required,
  maxFileSize,
  placeholder,
  valueState = "none",
  valueStateMessage,
  onFilesChange,
  onFileSizeExceed,
  hideInput,
  inputTitle = "All files will be replaced on each upload",
  browseTitle = "Browse and replace all files",
  clearTitle = "Remove all files",
  roleDescription = "File Uploader",
  inputRef,
  className,
  style,
  children,
  "aria-label": ariaLabel,
  ...props
}: FileUploaderProps) {
  const nativeRef = React.useRef<HTMLInputElement>(null)
  React.useImperativeHandle(inputRef, () => nativeRef.current!, [])
  const [names, setNames] = React.useState<string[]>([])
  const messageId = React.useId()
  const hasState = valueState !== "none"
  const message = valueStateMessage === undefined && hasState ? valueStateDefaultText[valueState] : valueStateMessage
  const showMessage = hasState && message != null && !disabled && !hideInput
  const resolvedPlaceholder = placeholder ?? (multiple ? "Browse or drop multiple files" : "Browse or drop a file")

  const open = () => nativeRef.current?.click()
  const validate = (list: FileList) => {
    const files = [...list]
    if (!maxFileSize) return files
    const exceeded = files
      .map((f) => ({ fileName: f.name, fileSize: f.size / 1024 / 1024 }))
      .filter((f) => f.fileSize > maxFileSize)
    if (exceeded.length) {
      onFileSizeExceed?.(exceeded)
      return []
    }
    return files
  }
  const apply = (files: File[]) => {
    if (!names.length && !files.length) return
    // UI5 sorts the names by length (workaround for one of its incidents); kept for identical rendering.
    setNames(files.map((f) => f.name).sort((a, b) => a.length - b.length))
    onFilesChange?.(files)
  }
  const clear = () => {
    setNames([])
    if (nativeRef.current) nativeRef.current.value = ""
    onFilesChange?.([])
  }

  const native = (
    <input
      ref={nativeRef}
      type="file"
      className="fiori-file-uploader__native"
      name={name}
      multiple={multiple}
      accept={accept}
      disabled={disabled}
      required={required}
      title={inputTitle}
      aria-roledescription={roleDescription}
      aria-haspopup="dialog"
      aria-label={ariaLabel}
      aria-invalid={valueState === "negative" || undefined}
      aria-describedby={showMessage ? messageId : undefined}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => apply(validate(e.currentTarget.files ?? new DataTransfer().files))}
    />
  )

  return (
    <div
      data-slot="file-uploader"
      data-hide-input={hideInput ? "" : undefined}
      data-value-state={hasState && !hideInput ? valueState : undefined}
      data-disabled={disabled ? "" : undefined}
      data-icons=""
      style={{ "--fiori-field-icons": 1, ...style } as React.CSSProperties}
      className={cn(
        hideInput ? "fiori-file-uploader fiori-file-uploader--hidden-input" : "fiori-field fiori-file-uploader group/field",
        className
      )}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest("[data-slot=file-uploader-clear]")) return
        e.preventDefault()
        nativeRef.current?.focus()
      }}
      onClick={() => {
        if (!disabled) open()
      }}
      onKeyDown={(e) => {
        if (hideInput || e.target !== nativeRef.current) return
        if (e.key === "Enter") {
          e.preventDefault()
          open()
        }
        if (e.key === " ") e.preventDefault()
      }}
      onKeyUp={(e) => {
        if (hideInput || e.target !== nativeRef.current) return
        if (e.key === " " || e.key === "F4" || (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown"))) open()
        else if (e.key === "Delete" && names.length) clear()
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (disabled || !e.dataTransfer?.files) return
        const files = validate(e.dataTransfer.files)
        if (nativeRef.current) {
          const dt = new DataTransfer()
          files.forEach((f) => dt.items.add(f))
          nativeRef.current.files = dt.files
        }
        apply(files)
      }}
      {...props}
    >
      {native}
      {hideInput ? (
        children
      ) : (
        <>
          {names.length > 0 ? (
            <>
              <div className="fiori-file-uploader__tokens" title={inputTitle} aria-hidden>
                {names.map((n) => (
                  <span key={n} className="fiori-file-uploader__token">
                    {n}
                  </span>
                ))}
              </div>
              <span
                data-slot="file-uploader-clear"
                className="fiori-field__icon fiori-file-uploader__icon fiori-file-uploader__clear"
                title={clearTitle}
                onClick={(e) => {
                  e.stopPropagation()
                  clear()
                  nativeRef.current?.focus()
                }}
              >
                <Icon icon={decline} />
              </span>
            </>
          ) : (
            <input
              className="fiori-field__input fiori-file-uploader__display"
              tabIndex={-1}
              aria-hidden
              title={inputTitle}
              placeholder={resolvedPlaceholder}
              readOnly
            />
          )}
          <span className="fiori-field__icon fiori-file-uploader__icon" title={browseTitle}>
            <Icon icon={browseFolder} />
          </span>
          {showMessage && (
            <div
              id={messageId}
              role="status"
              data-popover=""
              data-value-state={valueState}
              className="fiori-value-state-message absolute start-0 top-full z-50 mt-1 hidden max-w-[22rem] group-focus-within/field:block"
            >
              <Icon icon={valueStateIcons[valueState]} />
              {message}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export { FileUploader, type FileUploaderProps }
