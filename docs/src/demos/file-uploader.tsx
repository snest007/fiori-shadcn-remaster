import * as React from "react"

import { Button } from "@/components/ui/button"
import { FileUploader } from "@/components/ui/file-uploader"
import { Label } from "@/components/ui/label"

import { defineDemo } from "./types"

function FileUploaderDemo() {
  const [files, setFiles] = React.useState<string[]>([])
  return (
    <div className="grid max-w-xl grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
      <Label showColon>Attachment</Label>
      <FileUploader id="file-uploader-demo" aria-label="Attachment" multiple onFilesChange={(f) => setFiles(f.map((x) => x.name))} />
      <Label showColon>PDF only</Label>
      <FileUploader aria-label="PDF" accept=".pdf" valueState="information" valueStateMessage="Only PDF files are accepted" />
      <Label showColon>Button</Label>
      <FileUploader hideInput aria-label="Upload with button">
        <Button>Upload…</Button>
      </FileUploader>
      <span />
      <span id="file-uploader-demo-files" className="text-(--sapContent_LabelColor)">{files.length ? files.join(", ") : "No files selected"}</span>
    </div>
  )
}

export default defineDemo({
  category: "Forms",
  docs: [
    {
      name: "file-uploader",
      description: "File selection with native type filtering and size validation.",
      props: [
        { name: "FileUploader.accept", type: "string", description: "Native accepted extensions or MIME types." },
        { name: "FileUploader.multiple", type: "boolean", description: "Allow multiple selected files." },
        { name: "FileUploader.maxFileSize", type: "number", description: "Maximum size per file in MB." },
        { name: "FileUploader.onFilesChange", type: "(files: File[]) => void", description: "Receive the new selection, including an empty array after clearing." },
        { name: "FileUploader.onFileSizeExceed", type: "(files: FileSizeExceed[]) => void", description: "Receive files rejected by size validation." },
      ],
    },
  ],
 title: "FileUploader", order: 63, Demo: FileUploaderDemo })
