import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { FileUploader, type FileUploaderProps } from "@/components/ui/file-uploader"
import { Button } from "@/components/ui/button"
import { fioriMeta } from "../_lib/meta"
import { DocsPage } from "../_lib/DocsPage"

const base = fioriMeta({ name: "file-uploader", component: FileUploader })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: function ComponentDocs() {
  const textKeys = [
  [
    "valueStateMessage (negative)",
    "VALUE_STATE_ERROR",
    "Invalid entry"
  ],
  [
    "valueStateMessage (critical)",
    "VALUE_STATE_WARNING",
    "Warning issued"
  ],
  [
    "valueStateMessage (positive)",
    "VALUE_STATE_SUCCESS",
    "Entry successfully validated"
  ],
  [
    "valueStateMessage (information)",
    "VALUE_STATE_INFORMATION",
    "Informative entry"
  ],
  [
    "placeholder (single)",
    "FILEUPLOADER_DEFAULT_PLACEHOLDER",
    "Browse or drop a file"
  ],
  [
    "placeholder (multiple)",
    "FILEUPLOADER_DEFAULT_MULTIPLE_PLACEHOLDER",
    "Browse or drop multiple files"
  ],
  [
    "inputTitle",
    "FILEUPLOADER_INPUT_TOOLTIP",
    "All files will be replaced on each upload"
  ],
  [
    "browseTitle",
    "FILEUPLOADER_VALUE_HELP_TOOLTIP",
    "Browse and replace all files"
  ],
  [
    "clearTitle",
    "FILEUPLOADER_CLEAR_ICON_TOOLTIP",
    "Remove all files"
  ],
  [
    "roleDescription",
    "FILEUPLOADER_ROLE_DESCRIPTION",
    "File Uploader"
  ]
] as const
  return <><DocsPage /><section aria-label="Localization text keys" className="sbdocs-content"><h2>Localization text keys</h2><p>Override these public text props in your application; CustomTexts demonstrates the supported API. Existing label props remain available.</p><table><thead><tr><th>Prop / key</th><th>UI5 key or source</th><th>English component default</th></tr></thead><tbody>{textKeys.map(([prop, key, value]) => <tr key={prop}><td><code>{prop}</code></td><td>{key}</td><td>{value}</td></tr>)}</tbody></table></section></>
} } },
  args: { multiple: false, disabled: false, required: false, hideInput: false, valueState: "none", "aria-label": "Purchase order attachment", onFilesChange: fn(), onFileSizeExceed: fn() },
  argTypes: { ...base.argTypes, multiple: { control: "boolean" }, disabled: { control: "boolean" }, required: { control: "boolean" }, hideInput: { control: "boolean" }, accept: { control: "text" }, name: { control: "text" }, maxFileSize: { control: "number" }, placeholder: { control: "text" }, valueState: { control: "select", options: ["none", "negative", "critical", "positive", "information"] }, valueStateMessage: { control: "text" }, inputTitle: { control: "text" }, browseTitle: { control: "text" }, clearTitle: { control: "text" }, roleDescription: { control: "text" }, inputRef: { control: false, table: { disable: true } }, onFilesChange: { control: false }, onFileSizeExceed: { control: false } },
  render: function PurchaseAttachment(args: FileUploaderProps) {
    const [files, setFiles] = React.useState<string[]>([])
    return <div className="grid max-w-lg gap-2"><FileUploader {...args} onFilesChange={(next) => { args.onFilesChange?.(next); setFiles(next.map((file) => file.name)) }}>{args.hideInput && <Button>Upload attachment</Button>}</FileUploader><output aria-live="polite">{files.length ? files.join(", ") : "No files selected"}</output></div>
  },
} satisfies Meta<typeof FileUploader>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Multiple: Story = { args: { multiple: true } }
export const Placeholder: Story = { args: { placeholder: "Choose a purchase order PDF" } }
export const None: Story = { args: { valueState: "none" } }
export const Negative: Story = { args: { valueState: "negative" } }
export const Critical: Story = { args: { valueState: "critical" } }
export const Positive: Story = { args: { valueState: "positive" } }
export const Information: Story = { args: { valueState: "information" } }
export const Disabled: Story = { args: { disabled: true } }
export const Required: Story = { args: { required: true } }
export const PDFOnly: Story = { args: { accept: ".pdf" } }
export const SizeLimit: Story = { args: { maxFileSize: 2 } }
export const ButtonOpener: Story = { args: { hideInput: true } }
export const CustomTexts: Story = { args: { inputTitle: "Attach a purchase order", browseTitle: "Browse purchase order files", clearTitle: "Clear the purchase order selection", roleDescription: "Purchase attachment selector", valueState: "information", valueStateMessage: "Choose the approved purchase order document." } }
export const RTL: Story = { globals: { dir: "rtl" } }
