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
        accessibleName="Product search"
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
      <Search id="search-demo-scoped" accessibleName="Scoped search" className="w-96" scopes={[{ value: "all", text: "All" }, { value: "apps", text: "Apps" }]} />
      <span id="search-demo-last" className="text-(--sapContent_LabelColor)">{`Last search: ${last}`}</span>
    </div>
  )
}

export default defineDemo({
  category: "Navigation",
  docs: [
    {
      name: "search",
      description: "Search fields with typeahead suggestions, scopes and cancellable search requests.",
      props: [
        { name: "Search.value", type: "string", description: "Controlled user-entered text." },
        { name: "Search.onValueChange", type: "(value: string) => void", description: "Receive typing changes without typeahead completions." },
        { name: "Search.onSearch", type: "(detail: { value: string; item?: string; preventDefault: () => void }) => void", description: "Receive Enter, search-icon and suggestion activation." },
        { name: "Search.scopes", type: "SearchScope[]", description: "Available search scopes." },
        { name: "Search.onScopeChange", type: "(value: string) => void", description: "Receive the selected scope value." },
        { name: "Search.open", type: "boolean", description: "Controlled suggestion popup state." },
        { name: "Search.onOpenChange", type: "(open: boolean) => void", description: "Receive suggestion popup changes." },
        { name: "Search.accessibleName", type: "string", description: "Name the field and its search landmark." },
      ],
    },
  ], title: "Search", order: 64, Demo: SearchDemo })
