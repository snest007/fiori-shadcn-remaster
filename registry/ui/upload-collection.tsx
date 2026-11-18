// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

import { decline, refresh, stop, uploadToCloud } from "@/lib/fiori-icons"
import Tent from "@/lib/fiori-illustrations/Tent"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { IllustratedMessage } from "@/components/ui/illustrated-message"
import { Label } from "@/components/ui/label"
import { Link } from "@/components/ui/link"
import { ProgressIndicator } from "@/components/ui/progress-indicator"

// Mirrors ui5-upload-collection / ui5-upload-collection-item (Horizon, @ui5/webcomponents-fiori).
// The collection is a list (role="list", roledescription "Upload collection"); items are list items with a
// thumbnail, the file name (optionally a link), a description, and — unless Complete — a progress bar
// with the state text. Buttons: Retry (Error), Terminate (Uploading), Delete (always, unless hidden).
// Keyboard (as ui5-list): items form one Tab stop; ↑/↓ move between items, Home/End to the first/last;
// Tab moves into the focused item's buttons; Delete on a focused item requests its deletion (onDelete);
// Enter/Space activate the item (onClick).
// Drag & drop: while files are dragged over the page a dashed "Drag files here" overlay covers the
// collection; over the collection it turns solid ("Drop files to upload") and dropping calls onDropFiles.
// Upload transport, progress and state are the caller's job (props only).
// Not implemented: inline renaming.

type UploadState = "complete" | "error" | "ready" | "uploading"
type DndMode = "none" | "drag" | "drop"

const draggingFiles = (e: DragEvent | React.DragEvent) => !!e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")

type UploadCollectionProps = React.ComponentProps<"div"> & {
  /** Content above the list (UI5 `header` slot), e.g. a Toolbar with a title and an upload button. */
  header?: React.ReactNode
  /** Empty state title (default "No files found"). */
  noDataText?: React.ReactNode
  /** Empty state description (default: UI5's text, 'Drop files to upload them or use the "Upload" button'). */
  noDataDescription?: React.ReactNode
  /** Files dropped on the drop overlay. */
  onDropFiles?: (files: File[]) => void
  /** Don't show the drag & drop overlay. */
  hideDragOverlay?: boolean
  dragText?: string
  dropText?: string
  /** aria-roledescription of the region (default "Upload collection"). */
  roleDescription?: string
  /** Accessible name of the list. */
  "aria-label"?: string
}

function UploadCollection({
  header,
  noDataText = "No files found",
  noDataDescription = 'Drop files to upload them or use the "Upload" button',
  onDropFiles,
  hideDragOverlay,
  dragText = "Drag files here",
  dropText = "Drop files to upload",
  roleDescription = "Upload collection",
  "aria-label": ariaLabel,
  className,
  children,
  ...props
}: UploadCollectionProps) {
  const [mode, setMode] = React.useState<DndMode>("none")
  const listRef = React.useRef<HTMLUListElement>(null)
  const empty = React.Children.toArray(children).filter(Boolean).length === 0

  // Page-level drag tracking (UI5's UploadCollectionBodyDnD).
  React.useEffect(() => {
    if (hideDragOverlay) return
    let last: EventTarget | null = null
    const enter = (e: DragEvent) => {
      if (!draggingFiles(e)) return
      last = e.target
      setMode((m) => (m === "drop" ? m : "drag"))
    }
    const leave = (e: DragEvent) => {
      if (last === e.target) setMode((m) => (m === "drop" ? m : "none"))
    }
    const drop = () => setMode("none")
    const over = (e: DragEvent) => e.preventDefault()
    document.body.addEventListener("dragenter", enter)
    document.body.addEventListener("dragleave", leave)
    document.body.addEventListener("drop", drop)
    document.body.addEventListener("dragover", over)
    return () => {
      document.body.removeEventListener("dragenter", enter)
      document.body.removeEventListener("dragleave", leave)
      document.body.removeEventListener("drop", drop)
      document.body.removeEventListener("dragover", over)
    }
  }, [hideDragOverlay])

  // Roving tab stop over the items.
  React.useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const items = [...list.querySelectorAll<HTMLElement>(":scope > [data-slot=upload-collection-item]")]
    if (items.length && !items.some((i) => i.tabIndex === 0)) items[0].tabIndex = 0
  })

  return (
    <div
      data-slot="upload-collection"
      role="region"
      aria-roledescription={roleDescription}
      className={cn("fiori-upload-collection", className)}
      onDrop={(e) => {
        if (hideDragOverlay) return
        if (!(e.target as HTMLElement).closest(".fiori-upload-collection__overlay")) e.stopPropagation()
        setMode("none")
      }}
      {...props}
    >
      {/* UI5 UploadCollectionTemplate renders a List (fastNavigation metadata) around header and items. */}
      <div className="fiori-upload-collection__content" data-sap-ui-fastnavgroup="true">
        {header}
        <ul
          ref={listRef}
          role="list"
          aria-label={ariaLabel}
          className="fiori-upload-collection__list"
          onKeyDown={(e) => {
            const item = (e.target as HTMLElement).closest<HTMLElement>("[data-slot=upload-collection-item]")
            if (!item || e.target !== item || e.altKey || e.ctrlKey || e.metaKey) return
            const items = [...e.currentTarget.querySelectorAll<HTMLElement>(":scope > [data-slot=upload-collection-item]")]
            const i = items.indexOf(item)
            const next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 }[e.key]
            if (next === undefined) return
            e.preventDefault()
            const target = items[Math.min(Math.max(next, 0), items.length - 1)]
            items.forEach((it) => (it.tabIndex = it === target ? 0 : -1))
            target.focus()
          }}
          onFocus={(e) => {
            const item = e.target as HTMLElement
            if (item.dataset.slot !== "upload-collection-item") return
            e.currentTarget
              .querySelectorAll<HTMLElement>(":scope > [data-slot=upload-collection-item]")
              .forEach((it) => (it.tabIndex = it === item ? 0 : -1))
          }}
        >
          {children}
          {empty && (
            <li className="fiori-upload-collection__no-data" data-dnd={mode !== "none" ? "" : undefined}>
              <IllustratedMessage illustration={Tent} titleText={noDataText} subtitleText={noDataDescription} titleWrappingType="None" />
            </li>
          )}
        </ul>
        {mode !== "none" && (
          <div
            data-slot="upload-collection-overlay"
            data-mode={mode}
            className="fiori-upload-collection__overlay"
            onDragEnter={(e) => {
              if (draggingFiles(e)) setMode("drop")
            }}
            onDragLeave={() => setMode("drag")}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              setMode("none")
              const files = [...(e.dataTransfer?.files ?? [])]
              if (files.length) onDropFiles?.(files)
            }}
          >
            <Icon icon={uploadToCloud} />
            <span className="fiori-upload-collection__overlay-text">{mode === "drag" ? dragText : dropText}</span>
          </div>
        )}
      </div>
    </div>
  )
}

type UploadCollectionItemProps = Omit<React.ComponentProps<"li">, "children"> & {
  fileName: string
  /** Render the file name as a link; fires onFileNameClick. */
  fileNameClickable?: boolean
  onFileNameClick?: () => void
  /** Icon (an <Icon>) or <img> shown at the start, 3rem square. */
  thumbnail?: React.ReactNode
  uploadState?: UploadState
  /** 0–100, shown unless the state is "complete". */
  progress?: number
  /** Description below the file name (UI5 default slot). */
  children?: React.ReactNode
  hideDeleteButton?: boolean
  disableDeleteButton?: boolean
  hideRetryButton?: boolean
  hideTerminateButton?: boolean
  onDelete?: () => void
  onRetry?: () => void
  onTerminate?: () => void
  disabled?: boolean
  /** Texts (UI5 defaults). */
  stateTexts?: Partial<Record<Exclude<UploadState, "complete">, string>>
  deleteText?: string
  retryText?: string
  terminateText?: string
}

const defaultStateTexts = { error: "Terminated", ready: "Pending", uploading: "Uploading" }

function UploadCollectionItem({
  fileName,
  fileNameClickable,
  onFileNameClick,
  thumbnail,
  uploadState = "ready",
  progress = 0,
  children,
  hideDeleteButton,
  disableDeleteButton,
  hideRetryButton,
  hideTerminateButton,
  onDelete,
  onRetry,
  onTerminate,
  disabled,
  stateTexts,
  deleteText = "Delete",
  retryText = "Retry",
  terminateText = "Terminate",
  className,
  onKeyUp,
  onKeyDown,
  ...props
}: UploadCollectionItemProps) {
  const [active, setActive] = React.useState(false)
  const texts = { ...defaultStateTexts, ...stateTexts }
  const progressState = uploadState === "error" ? "negative" : uploadState === "complete" ? "none" : "information"
  return (
    <li
      data-slot="upload-collection-item"
      data-upload-state={uploadState}
      data-active={active ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      className={cn("fiori-upload-collection-item", className)}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.target !== e.currentTarget || e.defaultPrevented) return
        if (e.key === " " || e.key === "Enter") {
          if (e.key === " ") e.preventDefault()
          setActive(true)
        }
      }}
      onKeyUp={(e) => {
        onKeyUp?.(e)
        setActive(false)
        if (e.target !== e.currentTarget || e.defaultPrevented) return
        if ((e.key === " " || e.key === "Enter") && !disabled) e.currentTarget.click()
        if (e.key === "Delete" && !disableDeleteButton && !hideDeleteButton && !disabled) onDelete?.()
      }}
      onPointerDown={(e) => {
        if (!(e.target as HTMLElement).closest("button, a")) setActive(true)
      }}
      onPointerUp={() => setActive(false)}
      onPointerLeave={() => setActive(false)}
      {...props}
    >
      <div className="fiori-upload-collection-item__content">
        <div className="fiori-upload-collection-item__main">
          {thumbnail && <div className="fiori-upload-collection-item__thumbnail [&>:is(svg,img)]:size-(--fiori-upload-collection-thumbnail-size)">
              {thumbnail}
            </div>}
          <div className="fiori-upload-collection-item__text-and-progress">
            <div className="fiori-upload-collection-item__text">
              {fileNameClickable ? (
                <Link
                  wrappingType="none"
                  className="fiori-upload-collection-item__file-name"
                  onClick={(e) => {
                    e.stopPropagation()
                    onFileNameClick?.()
                  }}
                >
                  {fileName}
                </Link>
              ) : (
                <span className="fiori-upload-collection-item__file-name fiori-upload-collection-item__file-name-text">{fileName}</span>
              )}
              <div className="fiori-upload-collection-item__description">{children}</div>
            </div>
            {uploadState !== "complete" && (
              <div className="fiori-upload-collection-item__progress-box">
                <ProgressIndicator
                  className="fiori-upload-collection-item__progress"
                  hideValue
                  value={progress}
                  valueState={progressState}
                  aria-label={fileName}
                />
                <div className="fiori-upload-collection-item__progress-labels">
                  <Label showColon truncate>{texts[uploadState]}</Label>
                  <Label>{progress}%</Label>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="fiori-upload-collection-item__buttons">
          {uploadState === "error" && !hideRetryButton && (
            <Button
              variant="transparent"
              size="icon"
              title={retryText}
              aria-label={retryText}
              onClick={(e) => {
                e.stopPropagation()
                onRetry?.()
              }}
            >
              <Icon icon={refresh} />
            </Button>
          )}
          {uploadState === "uploading" && !hideTerminateButton && (
            <Button
              variant="transparent"
              size="icon"
              title={terminateText}
              aria-label={terminateText}
              onClick={(e) => {
                e.stopPropagation()
                onTerminate?.()
              }}
            >
              <Icon icon={stop} />
            </Button>
          )}
          {!hideDeleteButton && (
            <Button
              variant="transparent"
              size="icon"
              title={deleteText}
              aria-label={deleteText}
              disabled={disableDeleteButton}
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.()
              }}
            >
              <Icon icon={decline} />
            </Button>
          )}
        </div>
      </div>
    </li>
  )
}

export { UploadCollection, UploadCollectionItem, type UploadCollectionProps, type UploadCollectionItemProps, type UploadState }
