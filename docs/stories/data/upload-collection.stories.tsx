import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { UploadCollection, UploadCollectionItem, type UploadCollectionProps, type UploadCollectionItemProps, type UploadState } from "@/components/ui/upload-collection"
import { Icon } from "@/components/ui/icon"
import { Toolbar, ToolbarSpacer } from "@/components/ui/toolbar"
import { Title } from "@/components/ui/title"
import { FileUploader } from "@/components/ui/file-uploader"
import { Button } from "@/components/ui/button"
import { document as documentIcon } from "@/lib/fiori-icons"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"

type Args = UploadCollectionProps & Omit<UploadCollectionItemProps, "children"> & { empty?: boolean; description?: string }
const base = fioriMeta({ name: "upload-collection", component: UploadCollection })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: S2DocsPage } },
  args: { "aria-label": "Attachments", fileName: "LaptopHT-1000.jpg", uploadState: "complete", progress: 100, fileNameClickable: false, hideDragOverlay: false, hideDeleteButton: false, disableDeleteButton: false, hideRetryButton: false, hideTerminateButton: false, disabled: false, empty: false, description: "Uploaded by John Doe", onDropFiles: fn(), onFileNameClick: fn(), onDelete: fn(), onRetry: fn(), onTerminate: fn() },
  argTypes: {
    ...base.argTypes,
    fileName: { control: "text" }, uploadState: { control: "select", options: ["complete", "ready", "uploading", "error"] }, progress: { control: { type: "range", min: 0, max: 100 } }, fileNameClickable: { control: "boolean" }, description: { control: "text" },
    hideDragOverlay: { control: "boolean" }, hideDeleteButton: { control: "boolean" }, disableDeleteButton: { control: "boolean" }, hideRetryButton: { control: "boolean" }, hideTerminateButton: { control: "boolean" }, disabled: { control: "boolean" }, empty: { control: "boolean" },
    noDataText: { control: "text" }, noDataDescription: { control: "text" }, dragText: { control: "text" }, dropText: { control: "text" }, roleDescription: { control: "text" }, deleteText: { control: "text" }, retryText: { control: "text" }, terminateText: { control: "text" }, stateTexts: { control: "object" }, header: { control: false }, thumbnail: { control: false },
    onDropFiles: { control: false }, onFileNameClick: { control: false }, onDelete: { control: false }, onRetry: { control: false }, onTerminate: { control: false },
  },
  render: function AttachmentCollection(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const { fileName, uploadState, progress, fileNameClickable, description, hideDeleteButton, disableDeleteButton, hideRetryButton, hideTerminateButton, disabled, stateTexts, deleteText, retryText, terminateText, onFileNameClick, onDelete, onRetry, onTerminate, thumbnail, empty, ...collection } = args
    return <UploadCollection {...collection} onDropFiles={(files) => { args.onDropFiles?.(files); if (files[0]) updateArgs({ fileName: files[0].name, uploadState: "ready", progress: 0, empty: false }) }}>
      {!empty && <UploadCollectionItem fileName={fileName} fileNameClickable={fileNameClickable} uploadState={uploadState} progress={progress} thumbnail={thumbnail ?? <Icon icon={documentIcon} />} disabled={disabled} hideDeleteButton={hideDeleteButton} disableDeleteButton={disableDeleteButton} hideRetryButton={hideRetryButton} hideTerminateButton={hideTerminateButton} stateTexts={stateTexts} deleteText={deleteText} retryText={retryText} terminateText={terminateText} onFileNameClick={onFileNameClick} onDelete={() => { onDelete?.(); updateArgs({ empty: true }) }} onRetry={() => { onRetry?.(); updateArgs({ uploadState: "uploading", progress: 0 }) }} onTerminate={() => { onTerminate?.(); updateArgs({ uploadState: "error" }) }}>{description}</UploadCollectionItem>}
    </UploadCollection>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Complete: Story = {}
export const Ready: Story = { args: { uploadState: "ready", progress: 0, description: undefined } }
export const Uploading: Story = { args: { uploadState: "uploading", progress: 40, description: undefined } }
export const Error: Story = { args: { uploadState: "error", progress: 70, description: undefined } }
export const ClickableFileName: Story = { args: { fileNameClickable: true } }
export const Empty: Story = { args: { empty: true } }
export const Disabled: Story = { args: { disabled: true } }
export const DeleteDisabled: Story = { args: { disableDeleteButton: true } }
export const NoDeleteButton: Story = { args: { hideDeleteButton: true } }
export const NoRetryButton: Story = { args: { uploadState: "error", hideRetryButton: true } }
export const NoTerminateButton: Story = { args: { uploadState: "uploading", hideTerminateButton: true } }
export const LongFileName: Story = { args: { fileName: "Quarterly procurement report with supplier attachments and delivery estimates.pdf", className: "max-w-md" } }
export const CustomTexts: Story = { args: { uploadState: "error", stateTexts: { ready: "Awaiting transfer", uploading: "Transfer in progress", error: "Transfer failed" }, deleteText: "Remove attachment", retryText: "Try transfer again", terminateText: "Stop transfer", dragText: "Drag attachments here", dropText: "Drop attachments to add them", roleDescription: "Order attachments" } }
export const RTL: Story = { globals: { dir: "rtl" } }
export const WithUploadToolbar: Story = { render: function ManagedAttachments() {
  type Attachment = { id: number; name: string; state: UploadState; progress: number }
  const [files, setFiles] = React.useState<Attachment[]>([{ id: 1, name: "Report.pdf", state: "complete", progress: 100 }, { id: 2, name: "Notes.txt", state: "error", progress: 70 }])
  const nextId = React.useRef(3)
  const add = (list: File[]) => setFiles((current) => [...current, ...list.map((file) => ({ id: nextId.current++, name: file.name, state: "ready" as const, progress: 0 }))])
  return <UploadCollection aria-label="Order attachments" onDropFiles={add} header={<Toolbar aria-label="Attachment actions"><Title level="H2" size="H5">Attachments ({files.length})</Title><ToolbarSpacer /><FileUploader hideInput multiple aria-label="Choose attachment files" onFilesChange={add}><Button>Upload</Button></FileUploader></Toolbar>}>
    {files.map((file) => <UploadCollectionItem key={file.id} fileName={file.name} uploadState={file.state} progress={file.progress} thumbnail={<Icon icon={documentIcon} />} onDelete={() => setFiles((current) => current.filter((item) => item.id !== file.id))} onRetry={() => setFiles((current) => current.map((item) => item.id === file.id ? { ...item, state: "uploading", progress: 0 } : item))} onTerminate={() => setFiles((current) => current.map((item) => item.id === file.id ? { ...item, state: "error" } : item))} />)}
  </UploadCollection>
} }

// Current defaults are read from registry/ui/upload-collection.tsx and its shared calendar/input/clock primitives.
// UI5 keys come from the installed 2.28 English i18n defaults; non-identical wording is identified explicitly.
function S2DocsPage() {
  const textKeys = [
  {
    "prop": "noDataText",
    "text": "No files found",
    "key": "UPLOADCOLLECTION_NO_DATA_TEXT"
  },
  {
    "prop": "noDataDescription",
    "text": "Drop files to upload them or use the \"Upload\" button",
    "key": "UPLOADCOLLECTION_NO_DATA_DESCRIPTION"
  },
  {
    "prop": "dragText",
    "text": "Drag files here",
    "key": "UPLOADCOLLECTION_DRAG_FILE_INDICATOR"
  },
  {
    "prop": "dropText",
    "text": "Drop files to upload",
    "key": "Application text; no identical UI5 2.28 default"
  },
  {
    "prop": "roleDescription",
    "text": "Upload collection",
    "key": "Application text; no identical UI5 2.28 default"
  },
  {
    "prop": "deleteText",
    "text": "Delete",
    "key": "DELETE, TOKEN_ARIA_DELETE"
  },
  {
    "prop": "retryText",
    "text": "Retry",
    "key": "UPLOADCOLLECTIONITEM_RETRY_BUTTON_TEXT"
  },
  {
    "prop": "terminateText",
    "text": "Terminate",
    "key": "UPLOADCOLLECTIONITEM_TERMINATE_BUTTON_TEXT"
  },
  {
    "prop": "stateTexts.error",
    "text": "Terminated",
    "key": "UPLOADCOLLECTIONITEM_ERROR_STATE"
  },
  {
    "prop": "stateTexts.ready",
    "text": "Pending",
    "key": "UPLOADCOLLECTIONITEM_READY_STATE"
  },
  {
    "prop": "stateTexts.uploading",
    "text": "Uploading",
    "key": "UPLOADCOLLECTIONITEM_UPLOADING_STATE"
  }
]
  return <><DocsPage /><section aria-label="Localization text keys"><h2>Localization text keys</h2><p>Override these props to translate built-in labels and announcements. English defaults below describe the current component API.</p><table><thead><tr><th>Text prop / key</th><th>UI5 reference key</th><th>English default</th></tr></thead><tbody>{textKeys.map((text) => <tr key={text.prop}><td><code>{text.prop}</code></td><td>{text.key}</td><td>{text.text}</td></tr>)}</tbody></table></section></>
}
