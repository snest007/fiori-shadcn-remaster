import * as React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toolbar, ToolbarButton, ToolbarItem, ToolbarSeparator, ToolbarSpacer } from "@/components/ui/toolbar"

import { defineDemo } from "./types"

function ToolbarDemo() {
  const [last, setLast] = React.useState("none")
  return (
    <div className="grid gap-4" id="toolbar-demo">
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
      <Toolbar id="toolbar-select-demo" aria-label="Select overflow actions" alignContent="start" style={{ width: "24rem" }}>
        <ToolbarButton overflowPriority="neverOverflow">Keep</ToolbarButton>
        <ToolbarItem><Select defaultValue="all" onValueChange={(value) => setLast(value)}>
          <SelectTrigger aria-label="Overflow view" wrapperClassName="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All products</SelectItem><SelectItem value="mine">My products</SelectItem></SelectContent>
        </Select></ToolbarItem>
      </Toolbar>
      <p className="text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        ←/→ move between items (a text field keeps them until the caret is at its edge), Home/End jump. Last action:{" "}
        <b id="demo-toolbar-last">{last}</b>
      </p>
      <Toolbar id="toolbar-overflow-demo" aria-label="Overflow actions" alignContent="start" style={{ width: "30rem" }}>
        <ToolbarButton overflowPriority="neverOverflow" onClick={() => setLast("Keep")}>Keep</ToolbarButton>
        <ToolbarItem preventOverflowClosing><Input aria-label="Overflow filter" defaultValue="preserved" wrapperClassName="w-40" /></ToolbarItem>
        <ToolbarButton onClick={() => setLast("Copy")}>Copy</ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton onClick={() => setLast("Paste")}>Paste</ToolbarButton>
        <ToolbarButton preventOverflowClosing onClick={() => setLast("Pin")}>Pin</ToolbarButton>
        <ToolbarButton overflowPriority="alwaysOverflow" onClick={() => setLast("Always")}>Always</ToolbarButton>
      </Toolbar>
    </div>
  )
}

export default defineDemo({ title: "Toolbar", order: 50, Demo: ToolbarDemo })
