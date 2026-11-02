import { Search, SearchItem, SearchItemGroup, ShellBarSearch } from "@/components/ui/search"
import { history } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"
import { inPlace } from "./popover"

export const SEARCH_WIDTH = "24rem"
export const SEARCH_SCOPES = [
  { value: "all", text: "All" },
  { value: "apps", text: "Apps" },
]

type Props = { value?: string; placeholder?: string; clear?: boolean; scopes?: boolean; collapsed?: boolean; suggestions?: boolean }

export default defineFixtures<Props>({
  name: "search",
  cases: [
    { id: "search-placeholder", props: { placeholder: "Search" } },
    { id: "search-value", props: { value: "Laptop", clear: true } },
    { id: "search-scoped", props: { scopes: true } },
    { id: "search-shell-collapsed", props: { collapsed: true } },
    { id: "search-suggestions", props: { suggestions: true } },
  ],
  react: ({ value, placeholder, clear, scopes, collapsed, suggestions }) => {
    if (collapsed) return <ShellBarSearch defaultCollapsed />
    if (suggestions) {
      return (
        <div className={inPlace}>
          <Search open portal={false} defaultValue="Lap" noTypeahead style={{ width: SEARCH_WIDTH }}>
            <SearchItem text="Laptop" icon={history} />
            <SearchItem text="Lap desk" description="Office supplies" />
            <SearchItemGroup headerText="Products">
              <SearchItem text="Laptop bag" />
            </SearchItemGroup>
          </Search>
        </div>
      )
    }
    return <Search defaultValue={value} placeholder={placeholder} showClearIcon={clear} scopes={scopes ? SEARCH_SCOPES : undefined} style={{ width: SEARCH_WIDTH }} />
  },
  // UI5 highlights typed text only after input events and sizes its popover with a live --search_width in the top
  // layer, so the open list is checked visually and by tests/search.spec.ts rather than compared.
  skipCompare: ["search-suggestions"],
})
