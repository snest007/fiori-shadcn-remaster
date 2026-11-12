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
  return <span data-slot="custom-toolbar-action"><Button onClick={onClick}>{children}</Button></span>
}

function WrappedToolbarSelect({ onCommit, label }: { onCommit: (value: string) => void; label: string }) {
  const [value, setValue] = React.useState("all")
  return <span data-slot="custom-toolbar-select"><Select value={value} onValueChange={(next) => { setValue(next); onCommit(next) }}>
    <SelectTrigger aria-label={label} wrapperClassName="w-40"><SelectValue /></SelectTrigger>
    <SelectContent><SelectItem value="all">All products</SelectItem><SelectItem value="mine">My products</SelectItem></SelectContent>
  </Select></span>
}

function WrappedToolbarControl({ kind, label, onCommit, initialValue }: {
  kind: "combo" | "multi" | "date" | "switch"
  label: string
  onCommit: (value: string) => void
  initialValue?: string
}) {
  const [value, setValue] = React.useState(initialValue ?? (kind === "combo" ? "Hardware" : ""))
  const [selected, setSelected] = React.useState<string[]>([])
  const [checked, setChecked] = React.useState(false)
  const [commits, setCommits] = React.useState(0)
  const commit = (next: string) => { setCommits((count) => count + 1); onCommit(next) }
  return <span data-slot="custom-toolbar-control">
    {kind === "combo" && <ComboBox aria-label={label} value={value} noTypeahead onValueChange={setValue} onCommit={commit}>
      <ComboBoxItem text="Hardware" /><ComboBoxItem text="Software" />
    </ComboBox>}
    {kind === "multi" && <MultiComboBox aria-label={label} selectedValues={selected} value={value} noTypeahead noValidation onValueChange={setValue} onCommit={commit} onSelectionChange={(next) => { setSelected(next); commit(next.join(",")) }}>
      <MultiComboBoxItem text="Hardware" /><MultiComboBoxItem text="Software" />
    </MultiComboBox>}
    {kind === "date" && <DatePicker aria-label={label} formatPattern="yyyy-MM-dd" value={value} onValueChange={(next) => { setValue(next); commit(next) }} />}
    {kind === "switch" && <Switch aria-label={label} checked={checked} onCheckedChange={(next) => { setChecked(next); commit(String(next)) }} />}
    <output className="sr-only" data-testid={`${label}-commits`}>{commits}</output>
  </span>
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
      <Toolbar id="toolbar-select-wrappers-demo" aria-label="Select wrapper overflow" alignContent="start" style={{ width: "20rem" }} overflowPopoverLabel="Select wrappers">
        <ToolbarItem overflowPriority="alwaysOverflow">
          <Select defaultValue="all" onValueChange={(value) => setLast(`First select: ${value}`)}>
            <SelectTrigger aria-label="First wrapped select" wrapperClassName="w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All products</SelectItem><SelectItem value="mine">My products</SelectItem></SelectContent>
          </Select>
          <Select defaultValue="all" onValueChange={(value) => setLast(`Second select: ${value}`)}>
            <SelectTrigger aria-label="Second wrapped select" wrapperClassName="w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All products</SelectItem><SelectItem value="mine">My products</SelectItem></SelectContent>
          </Select>
        </ToolbarItem>
        <ToolbarItem overflowPriority="alwaysOverflow"><WrappedToolbarSelect label="Function wrapped select" onCommit={(value) => setLast(`Function select: ${value}`)} /></ToolbarItem>
        <ToolbarItem overflowPriority="alwaysOverflow" preventOverflowClosing><WrappedToolbarSelect label="Pinned function select" onCommit={(value) => setLast(`Pinned select: ${value}`)} /></ToolbarItem>
        <ToolbarItem overflowPriority="alwaysOverflow"><Input aria-label="Nonclosing first input" wrapperClassName="w-40" /><WrappedToolbarSelect label="Select after input" onCommit={(value) => setLast(`Input first: ${value}`)} /></ToolbarItem>
      </Toolbar>
      <Toolbar id="toolbar-function-controls-demo" aria-label="Function control overflow" alignContent="start" style={{ width: "20rem" }} overflowPopoverLabel="Function controls">
        {(["combo", "multi", "date", "switch"] as const).map((kind) => <ToolbarItem key={kind} overflowPriority="alwaysOverflow"><WrappedToolbarControl kind={kind} label={`Function ${kind}`} onCommit={(value) => setLast(`Function ${kind}: ${value}`)} /></ToolbarItem>)}
        {(["combo", "multi", "date", "switch"] as const).map((kind) => <ToolbarItem key={`pinned-${kind}`} overflowPriority="alwaysOverflow" preventOverflowClosing><WrappedToolbarControl kind={kind} label={`Pinned ${kind}`} onCommit={(value) => setLast(`Pinned ${kind}: ${value}`)} /></ToolbarItem>)}
      </Toolbar>
      <Toolbar id="toolbar-same-date-demo" aria-label="Same date overflow" alignContent="start" overflowPopoverLabel="Same date controls">
        <ToolbarItem overflowPriority="alwaysOverflow"><WrappedToolbarControl kind="date" label="Toolbar same date default" initialValue="2026-11-03" onCommit={(value) => setLast(value)} /></ToolbarItem>
        <ToolbarItem overflowPriority="alwaysOverflow" preventOverflowClosing><WrappedToolbarControl kind="date" label="Toolbar same date pinned" initialValue="2026-11-03" onCommit={(value) => setLast(value)} /></ToolbarItem>
      </Toolbar>
      <Toolbar id="toolbar-mixed-controls-demo" aria-label="Mixed control overflow" alignContent="start" style={{ width: "20rem" }} overflowPopoverLabel="Mixed controls">
        <ToolbarItem overflowPriority="alwaysOverflow"><MultiComboBox aria-label="First selection control"><MultiComboBoxItem text="Hardware" /></MultiComboBox><WrappedToolbarControl kind="combo" label="Combo after multi" onCommit={(value) => setLast(`Mixed combo: ${value}`)} /></ToolbarItem>
        <ToolbarItem overflowPriority="alwaysOverflow"><Select defaultValue="all"><SelectTrigger aria-label="First change control" wrapperClassName="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All products</SelectItem></SelectContent></Select><WrappedToolbarControl kind="multi" label="Multi after select" onCommit={(value) => setLast(`Mixed multi: ${value}`)} /></ToolbarItem>
        <ToolbarItem overflowPriority="alwaysOverflow"><Input aria-label="First nonclosing control" /><WrappedToolbarControl kind="multi" label="Multi after input" onCommit={(value) => setLast(`Nonclosing multi: ${value}`)} /></ToolbarItem>
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

export default defineDemo({
  category: "Navigation",
  docs: [
    {
      name: "toolbar",
      description: "Keyboard-navigable toolbars with stable controls and responsive action overflow.",
      props: [
        { name: "Toolbar.alignContent", type: "start | end", description: "Content alignment.", defaultValue: "end" },
        { name: "Toolbar.design", type: "solid | transparent", description: "Toolbar presentation.", defaultValue: "solid" },
        { name: "Toolbar.overflowButtonLabel", type: "string", description: "Accessible name of the overflow opener.", defaultValue: "Additional Options" },
        { name: "ToolbarButton.overflowPriority", type: "default | neverOverflow | alwaysOverflow", description: "How the action participates in overflow.", defaultValue: "default" },
        { name: "ToolbarButton.preventOverflowClosing", type: "boolean", description: "Keep the overflow popup open after activation.", defaultValue: "false" },
        { name: "ToolbarButton.onClick", type: "React.MouseEventHandler<HTMLButtonElement>", description: "Receive activation in either toolbar or overflow." },
        { name: "ToolbarItem.overflowPriority", type: "default | neverOverflow | alwaysOverflow", description: "Overflow policy for a wrapped arbitrary control.", defaultValue: "default" },
      ],
    },
  ], title: "Toolbar", order: 50, Demo: ToolbarDemo })
