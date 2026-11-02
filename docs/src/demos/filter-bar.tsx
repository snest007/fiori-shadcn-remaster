import * as React from "react"

import { FilterBar, FilterBarItem } from "@/components/ui/filter-bar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Title } from "@/components/ui/title"

import { defineDemo } from "./types"

function FilterBarDemo() {
  const [status, setStatus] = React.useState("all")
  const [order, setOrder] = React.useState("")
  const [changed, setChanged] = React.useState("")
  const [runs, setRuns] = React.useState(0)
  const active = [status !== "all" && "Editing Status", order && "Sales Order", changed && "Changed On"].filter(Boolean) as string[]
  return (
    <div className="grid gap-2">
      <FilterBar
        id="filter-bar-demo"
        variant={<Title level="H3" size="H3">Standard</Title>}
        activeFilters={active}
        onGo={() => setRuns((n) => n + 1)}
      >
        <FilterBarItem label="Editing Status">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="filter-bar-demo-status" aria-label="Editing Status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Own Draft</SelectItem>
              <SelectItem value="locked">Locked by Another User</SelectItem>
            </SelectContent>
          </Select>
        </FilterBarItem>
        <FilterBarItem label="Sales Order" fieldId="filter-bar-demo-order">
          <Input id="filter-bar-demo-order" value={order} onChange={(e) => setOrder(e.target.value)} />
        </FilterBarItem>
        <FilterBarItem label="Changed On" fieldId="filter-bar-demo-changed">
          <Input id="filter-bar-demo-changed" value={changed} onChange={(e) => setChanged(e.target.value)} />
        </FilterBarItem>
      </FilterBar>
      <span id="filter-bar-demo-runs" className="text-(--sapContent_LabelColor)">{`Searched ${runs} times`}</span>
    </div>
  )
}

export default defineDemo({ title: "FilterBar", order: 66, Demo: FilterBarDemo })
