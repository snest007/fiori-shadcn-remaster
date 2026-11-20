import { FileUploader } from "@/components/ui/file-uploader"
import type { ValueState } from "@/components/ui/input"

import { defineFixtures } from "../fixture-types"

type Props = { multiple?: boolean; placeholder?: string; valueState?: ValueState; disabled?: boolean }
const states = ["negative", "critical", "positive", "information"] as const

export default defineFixtures<Props>({
  name: "file-uploader",
  cases: [
    { id: "file-uploader", props: {} },
    { id: "file-uploader-multiple", props: { multiple: true } },
    { id: "file-uploader-placeholder", props: { placeholder: "Choose a PDF" } },
    ...states.map((valueState) => ({ id: `file-uploader-${valueState}`, props: { valueState } })),
    { id: "file-uploader-disabled", props: { disabled: true } },
  ],
  react: (p) => <FileUploader aria-label="Attachment" valueStateMessage={null} {...p} />,
})
