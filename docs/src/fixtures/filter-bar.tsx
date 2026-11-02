import { FilterBar, FilterBarItem } from "@/components/ui/filter-bar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Title } from "@/components/ui/title"

import { defineFixtures } from "../fixture-types"

type Props = { collapsed?: boolean }

// No UI5 Web Component exists for the filter bar (it is sap.ui.mdc / sap.ui.comp in SAPUI5): nothing to
// pixel-compare against, so the cells are for the docs grid and screenshot review only (checked against the
// Fiori design guideline's "Filter Bar Expanded" / "Collapsed" images, see tests/filter-bar.spec.ts).
export default defineFixtures<Props>({
  name: "filter-bar",
  cases: [
    { id: "filter-bar-expanded", props: {} },
    { id: "filter-bar-collapsed", props: { collapsed: true } },
  ],
  react: ({ collapsed }) => (
    <FilterBar
      className="w-[72rem]"
      variant={<Title level="H2" size="H3">Standard</Title>}
      expanded={!collapsed}
      activeFilters={["Editing Status", "Changed On"]}
    >
      <FilterBarItem label="Editing Status">
        <Select defaultValue="all">
          <SelectTrigger aria-label="Editing Status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="draft">Own Draft</SelectItem>
          </SelectContent>
        </Select>
      </FilterBarItem>
      <FilterBarItem label="Sales Order" fieldId="fb-fx-so">
        <Input id="fb-fx-so" />
      </FilterBarItem>
      <FilterBarItem label="Changed On" fieldId="fb-fx-changed">
        <Input id="fb-fx-changed" defaultValue="Dec 22, 2021" />
      </FilterBarItem>
    </FilterBar>
  ),
  skipCompare: ["filter-bar-expanded", "filter-bar-collapsed"],
})
