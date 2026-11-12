import * as React from "react"

import { AdaptFiltersDialog, type FilterDefinition, type FilterValues } from "@/components/ui/adapt-filters-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { defineDemo } from "./types"

const initialVisibleKeys = ["name", "category", "supplier"]
const initialValues: FilterValues = {
  name: [{ operator: "EQ", values: ["Notebook"] }],
  category: [{ operator: "EQ", values: ["Office"] }],
}

const filters: FilterDefinition[] = [
  { key: "name", label: "Name", group: "basic", groupLabel: "Basic", required: true },
  { key: "category", label: "Category", group: "basic", groupLabel: "Basic" },
  { key: "supplier", label: "Supplier", group: "purchasing", groupLabel: "Purchasing" },
  { key: "country", label: "Country", group: "purchasing", groupLabel: "Purchasing", visibleInFilterBar: false },
  { key: "city", label: "City", group: "purchasing", groupLabel: "Purchasing", visibleInFilterBar: false },
].map((filter): FilterDefinition => ({
  ...filter,
  render: ({ id, conditions, onConditionsChange, required, valueState, valueStateMessage, disabled }) => (
    <Input
      id={id}
      aria-label={filter.label}
      required={required}
      disabled={disabled}
      value={String(conditions[0]?.values[0] ?? "")}
      onChange={(event) => onConditionsChange(event.target.value ? [{ operator: "EQ", values: [event.target.value] }] : [])}
      valueState={valueState}
      valueStateMessage={valueStateMessage}
    />
  ),
}))

function AdaptFiltersDialogDemo() {
  const [open, setOpen] = React.useState(false)
  const [values, setValues] = React.useState<FilterValues>(initialValues)
  const [visibleKeys, setVisibleKeys] = React.useState(initialVisibleKeys)
  const [applies, setApplies] = React.useState(0)
  const [p13nMode, setP13nMode] = React.useState<("item" | "value")[]>(["item", "value"])

  return (
    <div id="adapt-filters-dialog-demo" className="grid gap-2">
      <div className="flex gap-2">
        <Button id="adapt-filters-dialog-demo-open" onClick={() => setOpen(true)}>Open Adapt Filters</Button>
        <Button variant="transparent" onClick={() => setP13nMode(["item"])}>Items Only</Button>
        <Button variant="transparent" onClick={() => setP13nMode(["value"])}>Values Only</Button>
        <Button variant="transparent" onClick={() => setP13nMode(["item", "value"])}>Items and Values</Button>
      </div>
      <AdaptFiltersDialog
        id="adapt-filters-dialog-demo-dialog"
        open={open}
        onOpenChange={setOpen}
        filters={filters}
        values={values}
        visibleKeys={visibleKeys}
        initialValues={initialValues}
        initialVisibleKeys={initialVisibleKeys}
        p13nMode={p13nMode}
        onApply={(next) => {
          setValues(next.values)
          setVisibleKeys(next.visibleKeys)
          setApplies((count) => count + 1)
        }}
      />
      <output id="adapt-filters-dialog-demo-result" className="text-(--sapContent_LabelColor)">
        {JSON.stringify({ values, visibleKeys })}
      </output>
      <span id="adapt-filters-dialog-demo-applies" className="text-(--sapContent_LabelColor)">{`Applied ${applies} times`}</span>
    </div>
  )
}

export default defineDemo({
  category: "Overlays",
  docs: [{
    name: "adapt-filters-dialog",
    description: "Stage filter conditions, visibility and ordering before applying them to the host.",
    props: [
      { name: "AdaptFiltersDialog.open", type: "boolean", description: "Controlled dialog visibility." },
      { name: "AdaptFiltersDialog.onOpenChange", type: "(open: boolean) => void", description: "Update the controlled dialog state." },
      { name: "AdaptFiltersDialog.filters", type: "FilterDefinition[]", description: "Available fields and their shared render functions." },
      { name: "AdaptFiltersDialog.values / AdaptFiltersDialog.visibleKeys", type: "FilterValues / string[]", description: "Conditions and ordered visible fields when opening." },
      { name: "AdaptFiltersDialog.onApply", type: "(state: AdaptFiltersState) => void", description: "Commit the staged conditions and visible field order." },
      { name: "AdaptFiltersDialog.initialValues / initialVisibleKeys", type: "FilterValues / string[]", description: "Reset baseline from the initial state or selected variant." },
      { name: "AdaptFiltersDialog.p13nMode", type: "(item | value)[]", description: "Enable field personalization, value editing or both.", defaultValue: "[item, value]" },
    ],
  }],
  title: "AdaptFiltersDialog", order: 66.1, Demo: AdaptFiltersDialogDemo })
