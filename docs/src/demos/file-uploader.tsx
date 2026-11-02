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

export default defineDemo({ title: "FileUploader", order: 63, Demo: FileUploaderDemo })
