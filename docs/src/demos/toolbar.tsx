import * as React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toolbar, ToolbarButton, ToolbarSeparator, ToolbarSpacer } from "@/components/ui/toolbar"

import { defineDemo } from "./types"

function ToolbarDemo() {
  const [last, setLast] = React.useState("none")
  return (
    <div className="grid gap-4">
      <Toolbar aria-label="Product actions" id="demo-toolbar">
        <Label>Products (12)</Label>
        <ToolbarSpacer />
        <Input aria-label="Filter products" placeholder="Filter" wrapperClassName="w-40" />
        <ToolbarButton onClick={() => setLast("Add")}>Add</ToolbarButton>
        <ToolbarButton onClick={() => setLast("Edit")}>Edit</ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton disabled>Copy</ToolbarButton>
        <ToolbarButton onClick={() => setLast("Delete")}>Delete</ToolbarButton>
      </Toolbar>
      <p className="text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        ←/→ move between items (a text field keeps them until the caret is at its edge), Home/End jump. Last action:{" "}
        <b id="demo-toolbar-last">{last}</b>
      </p>
    </div>
  )
}

export default defineDemo({ title: "Toolbar", order: 50, Demo: ToolbarDemo })
