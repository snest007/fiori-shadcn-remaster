import * as React from "react"

import { FilterBar, type FilterDefinition, type FilterValues } from "@/components/ui/filter-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Title } from "@/components/ui/title"

import { defineDemo } from "./types"

const filters: FilterDefinition[] = [
  {
    key: "status", label: "Editing Status", group: "general", groupLabel: "General",
    render: ({ id, conditions, onConditionsChange, disabled, valueState, valueStateMessage }) => (
      <Select value={String(conditions[0]?.values[0] ?? "all")} onValueChange={(value) => onConditionsChange(value === "all" ? [] : [{ operator: "EQ", values: [value] }])}>
        <SelectTrigger id={id} aria-label="Editing Status" disabled={disabled} valueState={valueState} valueStateMessage={valueStateMessage}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="draft">Own Draft</SelectItem>
          <SelectItem value="locked">Locked by Another User</SelectItem>
        </SelectContent>
      </Select>
    ),
  },
  ...[
    { key: "order", label: "Sales Order", group: "general", groupLabel: "General" },
    { key: "changed", label: "Changed On", group: "dates", groupLabel: "Dates" },
    { key: "created", label: "Created On", group: "dates", groupLabel: "Dates", visibleInFilterBar: false },
  ].map((filter): FilterDefinition => ({
    ...filter,
    render: ({ id, conditions, onConditionsChange, required, valueState, valueStateMessage, disabled }) => (
      <Input id={id} disabled={disabled} aria-label={filter.label} required={required} valueState={valueState} valueStateMessage={valueStateMessage}
        value={String(conditions[0]?.values[0] ?? "")}
        onChange={(e) => onConditionsChange(e.target.value ? [{ operator: "Contains", values: [e.target.value] }] : [])} />
    ),
  })),
]

function FilterBarDemo() {
  const [values, setValues] = React.useState<FilterValues>({})
  const [runs, setRuns] = React.useState(0)
  const [liveMode, setLiveMode] = React.useState(false)
  return (
    <div className="grid gap-2">
      <FilterBar
        id="filter-bar-demo"
        aria-label="Sales Order Filters"
        variant={<Title level="H3" size="H3">Standard</Title>}
        filters={filters} values={values} onValuesChange={setValues}
        liveMode={liveMode} onGo={() => setRuns((n) => n + 1)}
      />
      <div><Button id="filter-bar-demo-live" aria-pressed={liveMode} onClick={() => setLiveMode((live) => !live)}>{liveMode ? "Disable Live Mode" : "Enable Live Mode"}</Button></div>
      <span id="filter-bar-demo-runs" className="text-(--sapContent_LabelColor)">{`Searched ${runs} times`}</span>
      <RequiredFilterDemo />
      <OverrideFilterDemo />
    </div>
  )
}

const requiredFilters: FilterDefinition[] = [{
  key: "company", label: "Company Code", required: true,
  render: ({ id, conditions, onConditionsChange, required, valueState, valueStateMessage, disabled }) => (
    <Input id={id} disabled={disabled} aria-label="Company Code" required={required} valueState={valueState} valueStateMessage={valueStateMessage}
      value={String(conditions[0]?.values[0] ?? "")}
      onChange={(event) => onConditionsChange(event.target.value ? [{ operator: "EQ", values: [event.target.value] }] : [])} />
  ),
}]

function RequiredFilterDemo() {
  const [runs, setRuns] = React.useState(0)
  return (
    <div>
      <FilterBar id="filter-bar-required-demo" aria-label="Required Company Filters" variant="Required filter" search={false} filters={requiredFilters}
        defaultVisibleKeys={[]} onGo={() => setRuns((count) => count + 1)} />
      <output id="filter-bar-required-demo-runs">{`Searched ${runs} times`}</output>
    </div>
  )
}

function OverrideFilterDemo() {
  const [opens, setOpens] = React.useState(0)
  return (
    <div>
      <FilterBar id="filter-bar-override-demo" aria-label="Custom Personalization Filters" variant="Custom personalization hook" search={false} filters={filters}
        showToggle={false} onAdaptFilters={() => setOpens((count) => count + 1)} />
      <output id="filter-bar-override-demo-opens">{`Custom editor opened ${opens} times`}</output>
    </div>
  )
}

export default defineDemo({
  category: "Navigation",
  docs: [{
    name: "filter-bar",
    description: "Business filters with basic search, saved variants and an Adapt Filters dialog.",
    props: [
      { name: "FilterBar.filters", type: "FilterDefinition[]", description: "Field definitions shared with Adapt Filters." },
      { name: "FilterBar.state", type: "FilterBarState", description: "Complete controlled filter and basic-search state." },
      { name: "FilterBar.onStateChange", type: "(state: FilterBarState) => void", description: "Receive committed changes to the complete state." },
      { name: "FilterBar.initialState", type: "FilterBarState", description: "Reset baseline of the selected saved view." },
      { name: "FilterBar.variantManagement", type: "ReactNode", description: "Saved-view control placed in the header." },
      { name: "FilterBar.onGo", type: "() => void", description: "Execute search after Go or the keyboard shortcut." },
      { name: "FilterBar.liveMode", type: "boolean", description: "Search after every committed condition change.", defaultValue: "false" },
      { name: "FilterBar.onAdaptFilters", type: "() => void", description: "Override the built-in Adapt Filters editor." },
    ],
  }],
  title: "FilterBar", order: 66, Demo: FilterBarDemo })
