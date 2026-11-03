import * as React from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ComboBox, ComboBoxItem } from "@/components/ui/combobox"
import { MultiComboBox, MultiComboBoxItem } from "@/components/ui/multi-combobox"
import { DatePicker } from "@/components/ui/date-picker"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toolbar, ToolbarButton, ToolbarItem, ToolbarSeparator, ToolbarSpacer } from "@/components/ui/toolbar"

import { defineDemo } from "./types"

function WrappedToolbarAction({ onClick, children = "Custom wrapped action" }: { onClick: () => void; children?: string }) {
  return <span><Button onClick={onClick}>{children}</Button></span>
}

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
      <Toolbar id="toolbar-controls-demo" aria-label="Wrapped control overflow" alignContent="start" style={{ width: "40rem" }} overflowPopoverLabel="Wrapped controls">
        <ToolbarButton overflowPriority="neverOverflow">Keep</ToolbarButton>
        <ToolbarItem overflowPriority="alwaysOverflow"><ComboBox aria-label="Overflow category" defaultValue="Hardware" noTypeahead onCommit={(value) => setLast(value)}>
          <ComboBoxItem text="Hardware" /><ComboBoxItem text="Software" />
        </ComboBox></ToolbarItem>
        <ToolbarItem overflowPriority="alwaysOverflow"><MultiComboBox aria-label="Overflow tags" onSelectionChange={(values) => setLast(values.join(","))}>
          <MultiComboBoxItem text="Hardware" /><MultiComboBoxItem text="Software" />
        </MultiComboBox></ToolbarItem>
        <ToolbarItem overflowPriority="alwaysOverflow"><DatePicker aria-label="Overflow date" formatPattern="yyyy-MM-dd" onValueChange={(value) => setLast(value)} /></ToolbarItem>
        <ToolbarItem overflowPriority="alwaysOverflow"><Switch aria-label="Overflow enabled" onCheckedChange={(value) => setLast(String(value))} /></ToolbarItem>
        <ToolbarItem overflowPriority="alwaysOverflow"><Checkbox aria-label="Overflow checked" /></ToolbarItem>
        <ToolbarItem overflowPriority="alwaysOverflow"><Button onClick={() => setLast("Wrapped action")}>Wrapped action</Button></ToolbarItem>
      </Toolbar>
      <Toolbar id="toolbar-wrappers-demo" aria-label="Button wrapper overflow" alignContent="start" style={{ width: "20rem" }} overflowPopoverLabel="Button wrappers">
        <ToolbarItem overflowPriority="alwaysOverflow"><WrappedToolbarAction onClick={() => setLast("Custom wrapped action")} /></ToolbarItem>
        <ToolbarItem overflowPriority="alwaysOverflow"><Button onClick={() => setLast("First wrapped action")}>First wrapped action</Button><Button onClick={() => setLast("Second wrapped action")}>Second wrapped action</Button></ToolbarItem>
        <ToolbarItem overflowPriority="alwaysOverflow" preventOverflowClosing><WrappedToolbarAction onClick={() => setLast("Pinned wrapped action")}>Pinned wrapped action</WrappedToolbarAction></ToolbarItem>
      </Toolbar>
      <Toolbar id="toolbar-scroll-demo" aria-label="Long overflow actions" alignContent="start" style={{ width: "8rem" }} overflowPopoverLabel="Long actions">
        {Array.from({ length: 12 }, (_, index) => <ToolbarButton key={index} overflowPriority="alwaysOverflow" onClick={() => setLast(`Long action ${index + 1}`)}>Long action {index + 1}</ToolbarButton>)}
      </Toolbar>
      <p className="text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        ←/→ move between items (a text field keeps them until the caret is at its edge), Home/End jump. Last action:{" "}
        <b id="demo-toolbar-last">{last}</b>
      </p>
      <Toolbar id="toolbar-overflow-demo" aria-label="Overflow actions" alignContent="start" style={{ width: "30rem" }}>
        <ToolbarButton overflowPriority="neverOverflow" onClick={() => setLast("Keep")}>Keep</ToolbarButton>
        <ToolbarItem><Input aria-label="Overflow filter" defaultValue="preserved" wrapperClassName="w-40" /></ToolbarItem>
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
