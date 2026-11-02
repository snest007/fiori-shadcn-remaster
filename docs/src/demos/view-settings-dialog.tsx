import * as React from "react"

import { Button } from "@/components/ui/button"
import { DialogTrigger } from "@/components/ui/dialog"
import { ViewSettingsDialog, type ViewSettings } from "@/components/ui/view-settings-dialog"

import { defineDemo } from "./types"

function ViewSettingsDialogDemo() {
  const [result, setResult] = React.useState<ViewSettings | null>(null)
  return (
    <div className="flex items-center gap-4">
      <ViewSettingsDialog
        sortItems={[{ text: "Name", selected: true }, { text: "Position" }, { text: "Company" }]}
        filterItems={[
          { text: "Position", values: [{ text: "CTO" }, { text: "CPO" }, { text: "VP" }] },
          { text: "Department", values: [{ text: "Sales" }, { text: "Management" }, { text: "PR" }] },
        ]}
        groupItems={[{ text: "Name" }, { text: "Position" }]}
        onConfirm={setResult}
      >
        <DialogTrigger asChild>
          <Button id="view-settings-dialog-demo-open">View settings</Button>
        </DialogTrigger>
      </ViewSettingsDialog>
      <code id="view-settings-dialog-demo-result" className="text-(--sapContent_LabelColor)">
        {result ? JSON.stringify(result) : "Not confirmed yet"}
      </code>
    </div>
  )
}

export default defineDemo({ title: "ViewSettingsDialog", order: 65, Demo: ViewSettingsDialogDemo })
