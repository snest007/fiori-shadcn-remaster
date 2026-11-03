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

export default defineDemo({ title: "AdaptFiltersDialog", order: 66.1, Demo: AdaptFiltersDialogDemo })
