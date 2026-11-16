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
  cases: ([
    { id: "search-placeholder", props: { placeholder: "Search" } },
    { id: "search-value", props: { value: "Laptop", clear: true } },
    { id: "search-scoped", props: { scopes: true } },
    { id: "search-shell-collapsed", props: { collapsed: true } },
    { id: "search-suggestions", props: { suggestions: true } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "search-rtl" }] : [fixture]),
  react: ({ value, placeholder, clear, scopes, collapsed, suggestions }) => {
    if (collapsed) return <ShellBarSearch defaultCollapsed />
    if (suggestions) {
      return (
        // Only the suggestion surface is compared: the field is hidden on both pages (ui5-search's host is a fixed-height
        // flex box, so its in-place popup can't sit below the field). The field has its own cases above. It keeps its
        // width at zero height here, because the popover takes its width from the anchor.
        <div className={`${inPlace} [&_[data-slot=search]]:invisible [&_[data-slot=search]]:h-0!`}>
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
})
