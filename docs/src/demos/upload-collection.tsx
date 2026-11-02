import * as React from "react"

import { attachmentPhoto, document as documentIcon, pdfAttachment } from "@/lib/fiori-icons"
import { Icon } from "@/components/ui/icon"
import { Title } from "@/components/ui/title"
import { Toolbar, ToolbarSpacer } from "@/components/ui/toolbar"
import { FileUploader } from "@/components/ui/file-uploader"
import { Button } from "@/components/ui/button"
import { UploadCollection, UploadCollectionItem, type UploadState } from "@/components/ui/upload-collection"

import { defineDemo } from "./types"

type File_ = { id: number; name: string; state: UploadState; progress: number; icon: typeof documentIcon }

const initial: File_[] = [
  { id: 1, name: "Report.pdf", state: "complete", progress: 100, icon: pdfAttachment },
  { id: 2, name: "Photo.jpg", state: "uploading", progress: 40, icon: attachmentPhoto },
  { id: 3, name: "Notes.txt", state: "error", progress: 70, icon: documentIcon },
  { id: 4, name: "Draft.docx", state: "ready", progress: 0, icon: documentIcon },
]

function UploadCollectionDemo() {
  const [files, setFiles] = React.useState(initial)
  const [log, setLog] = React.useState("")
  const add = (list: File[]) =>
    setFiles((fs) => [...fs, ...list.map((f, i) => ({ id: Date.now() + i, name: f.name, state: "ready" as const, progress: 0, icon: documentIcon }))])
  return (
    <div className="grid gap-2">
      <UploadCollection
        id="upload-collection-demo"
        aria-label="Attachments"
        onDropFiles={add}
        header={
          <Toolbar>
            <Title level="H3" size="H5">{`Attachments (${files.length})`}</Title>
            <ToolbarSpacer />
            <FileUploader hideInput multiple aria-label="Upload" onFilesChange={add}>
              <Button>Upload</Button>
            </FileUploader>
          </Toolbar>
        }
      >
        {files.map((f) => (
          <UploadCollectionItem
            key={f.id}
            fileName={f.name}
            fileNameClickable={f.state === "complete"}
            onFileNameClick={() => setLog(`Open ${f.name}`)}
            uploadState={f.state}
            progress={f.progress}
            thumbnail={<Icon icon={f.icon} />}
            onDelete={() => {
              setFiles((fs) => fs.filter((x) => x.id !== f.id))
              setLog(`Deleted ${f.name}`)
            }}
            onRetry={() => setFiles((fs) => fs.map((x) => (x.id === f.id ? { ...x, state: "uploading", progress: 0 } : x)))}
            onTerminate={() => setFiles((fs) => fs.map((x) => (x.id === f.id ? { ...x, state: "error" } : x)))}
          >
            {f.state === "complete" ? "Uploaded by John Doe" : undefined}
          </UploadCollectionItem>
        ))}
      </UploadCollection>
      <span id="upload-collection-demo-log" className="text-(--sapContent_LabelColor)">{log}</span>
    </div>
  )
}

export default defineDemo({ title: "UploadCollection", order: 64, Demo: UploadCollectionDemo })
