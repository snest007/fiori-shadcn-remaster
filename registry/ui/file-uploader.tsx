// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { useFioriLocale, useFioriTexts } from "@/lib/fiori-locale"

import { browseFolder, decline } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import { useValueStateTexts, valueStateIcons, type ValueState } from "@/components/ui/input"

// UI5 FileUploader.js _onfocusin / generated/themes/FileUploader.css.js paints pointer focus too.
// AGENTS rule 5 requires keyboard origin, including focus in a newly mounted popup.
const fileuploaderFocusModality = new WeakMap<Document, { keyboard: boolean }>()
function getFileUploaderFocusModality(owner: Document) {
  let state = fileuploaderFocusModality.get(owner)
  if (!state) {
    state = { keyboard: true }
    const current = state
    owner.addEventListener("keydown", () => { current.keyboard = true }, true)
    owner.addEventListener("pointerdown", () => { current.keyboard = false }, true)
    fileuploaderFocusModality.set(owner, current)
  }
  return state
}
if (typeof document !== "undefined") getFileUploaderFocusModality(document)

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
  texts?: Partial<FileUploaderTexts>
  locale?: string
}
type FileUploaderTexts = { placeholder: string; multiplePlaceholder: string; valueMissing: string }
const defaultTexts: FileUploaderTexts = {
  placeholder: "Browse or drop a file", // UI5 FILEUPLOADER_DEFAULT_PLACEHOLDER
  multiplePlaceholder: "Browse or drop multiple files", // UI5 FILEUPLOADER_DEFAULT_MULTIPLE_PLACEHOLDER
  valueMissing: "Select or drag and drop a file to upload.", // UI5 FILEUPLOAER_VALUE_MISSING (native spelling)
}
const defaultTextsKeys = { placeholder: "FILEUPLOADER_DEFAULT_PLACEHOLDER", multiplePlaceholder: "FILEUPLOADER_DEFAULT_MULTIPLE_PLACEHOLDER", valueMissing: "FILEUPLOAER_VALUE_MISSING" } as const

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
  inputTitle: inputTitleProp,
  browseTitle: browseTitleProp,
  clearTitle: clearTitleProp,
  roleDescription: roleDescriptionProp,
  inputRef,
  texts: textsProp,
  locale: localeProp,
  className,
  style,
  children,
  onPointerDownCapture,
  onFocusCapture,
  onKeyDownCapture,
  onBlurCapture,
  "aria-label": ariaLabel,
  ...props
}: FileUploaderProps) {
  const valueStateTexts = useValueStateTexts()

  const { t, localized, hasProvider } = useFioriLocale(localeProp)
  const texts = useFioriTexts(defaultTexts, defaultTextsKeys, textsProp, localeProp)
  const inputTitle = inputTitleProp ?? t("FILEUPLOADER_INPUT_TOOLTIP", "All files will be replaced on each upload") // UI5 FILEUPLOADER_INPUT_TOOLTIP
  const browseTitle = browseTitleProp ?? t("FILEUPLOADER_VALUE_HELP_TOOLTIP", "Browse and replace all files") // UI5 FILEUPLOADER_VALUE_HELP_TOOLTIP
  const clearTitle = clearTitleProp ?? t("FILEUPLOADER_CLEAR_ICON_TOOLTIP", "Remove all files") // UI5 FILEUPLOADER_CLEAR_ICON_TOOLTIP
  const roleDescription = roleDescriptionProp ?? t("FILEUPLOADER_ROLE_DESCRIPTION", "File Uploader") // UI5 FILEUPLOADER_ROLE_DESCRIPTION

  const nativeRef = React.useRef<HTMLInputElement>(null)
  React.useImperativeHandle(inputRef, () => nativeRef.current!, [])
  const [names, setNames] = React.useState<string[]>([])
  const messageId = React.useId()
  const hasState = valueState !== "none"
  const message = valueStateMessage === undefined && hasState ? valueStateTexts[valueState] : valueStateMessage
  const showMessage = hasState && message != null && !disabled && !hideInput
  const resolvedPlaceholder = placeholder ?? (multiple ? texts.multiplePlaceholder : texts.placeholder)
  React.useLayoutEffect(() => {
    // FileUploader.js/formValidityMessage: required text belongs to the native file input.
    nativeRef.current?.setCustomValidity((localized || hasProvider || textsProp) && required && !names.length ? texts.valueMissing : "")
  }, [localized, hasProvider, textsProp, required, names, texts])

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
      onPointerDownCapture={(event) => {
        event.currentTarget.setAttribute("data-pointer-focus", "")
        onPointerDownCapture?.(event)
      }}
      onFocusCapture={(event) => {
        if (getFileUploaderFocusModality(event.currentTarget.ownerDocument).keyboard) event.currentTarget.removeAttribute("data-pointer-focus")
        else event.currentTarget.setAttribute("data-pointer-focus", "")
        onFocusCapture?.(event)
      }}
      onKeyDownCapture={(event) => {
        event.currentTarget.removeAttribute("data-pointer-focus")
        onKeyDownCapture?.(event)
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.removeAttribute("data-pointer-focus")
        onBlurCapture?.(event)
      }}
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

export { FileUploader, type FileUploaderProps, type FileUploaderTexts }
