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

export default defineDemo({
  category: "Overlays",
  docs: [{
    name: "view-settings-dialog",
    description: "Configure sorting, filtering and grouping through a staged dialog.",
    props: [
      { name: "ViewSettingsDialog.open", type: "boolean", description: "Controlled dialog visibility." },
      { name: "ViewSettingsDialog.onOpenChange", type: "(open: boolean) => void", description: "Receive visibility changes." },
      { name: "ViewSettingsDialog.sortItems / ViewSettingsDialog.groupItems", type: "SortItem[]", description: "Sort and group criteria with initial selections." },
      { name: "ViewSettingsDialog.filterItems", type: "FilterItem[]", description: "Filter criteria and their selectable values." },
      { name: "ViewSettingsDialog.onConfirm", type: "(settings: ViewSettings) => void", description: "Receive the confirmed view settings." },
      { name: "ViewSettingsDialog.onCancel", type: "(settings: ViewSettings) => void", description: "Receive the restored settings on cancellation." },
      { name: "ViewSettingsDialog.texts", type: "Partial<ViewSettingsTexts>", description: "Override labels and tooltips." },
    ],
  }],
  title: "ViewSettingsDialog", order: 65, Demo: ViewSettingsDialogDemo })
