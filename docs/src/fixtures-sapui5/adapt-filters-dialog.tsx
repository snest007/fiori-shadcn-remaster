import { AdaptFiltersDialog, type FilterDefinition, type FilterRenderProps, type FilterValues } from "@/components/ui/adapt-filters-dialog"
import { Input } from "@/components/ui/input"
import { defineFixtures } from "../fixture-types"

type Props = { view: "list" | "group"; mode: "edit" | "sort"; search?: string; reset?: boolean }

const values: FilterValues = {
  name: [{ operator: "EQ", values: ["Ada"] }],
  country: [{ operator: "EQ", values: ["Germany"] }],
  city: [],
}
const filters: FilterDefinition[] = [
  { key: "name", label: "Name", group: "person", groupLabel: "Person", required: true },
  { key: "country", label: "Country", group: "location", groupLabel: "Location" },
  { key: "city", label: "City", group: "location", groupLabel: "Location", visibleInFilterBar: false },
].map((filter) => ({
  ...filter,
  render: ({ id, conditions, onConditionsChange, valueState, valueStateMessage, disabled }: FilterRenderProps) => (
    <Input id={id} aria-label={filter.label} value={String(conditions[0]?.values[0] ?? "")}
      valueState={valueState} valueStateMessage={valueStateMessage} disabled={disabled}
      onChange={(event) => onConditionsChange(event.target.value ? [{ operator: "EQ", values: [event.target.value] }] : [])} />
  ),
}))

export default defineFixtures<Props>({
  name: "adapt-filters-dialog",
  cases: [
    { id: "adapt-filters-dialog-list-edit", props: { view: "list", mode: "edit" } },
    { id: "adapt-filters-dialog-list-sort", props: { view: "list", mode: "sort" } },
    { id: "adapt-filters-dialog-group-two-groups", props: { view: "group", mode: "edit" } },
    { id: "adapt-filters-dialog-no-results", props: { view: "list", mode: "edit", search: "Unknown filter" } },
    { id: "adapt-filters-dialog-reset-confirmation", props: { view: "list", mode: "edit", reset: true } },
  ],
  react: ({ view, mode, search, reset }) => (
    <AdaptFiltersDialog open onOpenChange={() => {}} filters={filters} values={values}
      visibleKeys={["name", "country"]} onApply={() => {}}
      initialValues={reset ? {} : values} initialVisibleKeys={["name", "country"]}
      defaultView={view} defaultMode={mode} defaultSearch={search} defaultResetConfirmation={reset}
      contentWidth="60rem" contentHeight="35rem" portal={false} modal={false} />
  ),
})
