import * as React from "react"

import { Search, SearchItem, SearchItemGroup } from "@/components/ui/search"
import { history } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

function SearchDemo() {
  const [last, setLast] = React.useState("none")
  return (
    <div className="grid justify-items-start gap-3">
      <Search
        id="search-demo"
        placeholder="Search"
        showClearIcon
        className="w-96"
        onSearch={({ value, item }) => setLast(`${value}${item ? ` (${item})` : ""}`)}
      >
        <SearchItem text="Laptop" icon={history} />
        <SearchItem text="Lap desk" description="Office supplies" />
        <SearchItemGroup headerText="Products">
          <SearchItem text="Monitor" />
        </SearchItemGroup>
      </Search>
      <Search id="search-demo-scoped" className="w-96" scopes={[{ value: "all", text: "All" }, { value: "apps", text: "Apps" }]} />
      <span id="search-demo-last" className="text-(--sapContent_LabelColor)">{`Last search: ${last}`}</span>
    </div>
  )
}

export default defineDemo({ title: "Search", order: 64, Demo: SearchDemo })
