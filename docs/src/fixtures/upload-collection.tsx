import { document as documentIcon } from "@/lib/fiori-icons"
import { Icon } from "@/components/ui/icon"
import { UploadCollection, UploadCollectionItem, type UploadState } from "@/components/ui/upload-collection"

import { defineFixtures } from "../fixture-types"

type Props = { state?: UploadState; progress?: number; clickable?: boolean; empty?: boolean; description?: string }

export default defineFixtures<Props>({
  name: "upload-collection",
  cases: [
    { id: "upload-collection-complete", props: { state: "complete", description: "Uploaded by John Doe" } },
    { id: "upload-collection-uploading", props: { state: "uploading", progress: 40 } },
    { id: "upload-collection-ready", props: { state: "ready", progress: 0 } },
    { id: "upload-collection-error", props: { state: "error", progress: 70 } },
    { id: "upload-collection-link", props: { state: "complete", clickable: true } },
    { id: "upload-collection-empty", props: { empty: true } },
  ],
  react: ({ state, progress, clickable, empty, description }) => (
    <UploadCollection style={{ width: "40rem" }} aria-label="Attachments">
      {!empty && (
        <UploadCollectionItem
          fileName="LaptopHT-1000.jpg"
          fileNameClickable={clickable}
          uploadState={state}
          progress={progress}
          thumbnail={<Icon icon={documentIcon} />}
        >
          {description}
        </UploadCollectionItem>
      )}
    </UploadCollection>
  ),
})
