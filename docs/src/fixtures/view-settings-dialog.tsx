import { ViewSettingsDialog, type FilterItem, type SortItem } from "@/components/ui/view-settings-dialog"

import { defineFixtures } from "../fixture-types"

type Props = { sort?: boolean; filter?: boolean; group?: boolean; descending?: boolean }

export const vsdSortItems: SortItem[] = [{ text: "Name", selected: true }, { text: "Position" }, { text: "Company" }]
export const vsdFilterItems: FilterItem[] = [
  { text: "Position", values: [{ text: "CTO", selected: true }, { text: "CPO" }, { text: "VP" }] },
  { text: "Department", values: [{ text: "Sales" }, { text: "Management" }] },
]
export const vsdGroupItems: SortItem[] = [{ text: "Name" }, { text: "Position", selected: true }]

// Rendered in place (like the dialog fixtures): open, non-modal, not portaled. UI5's side shows the
// ui5-dialog inside the view settings dialog's shadow root, see view-settings-dialog.ui5.ts.
export default defineFixtures<Props>({
  name: "view-settings-dialog",
  cases: [
    { id: "view-settings-dialog-sort", props: { sort: true, filter: true, group: true } },
    { id: "view-settings-dialog-descending", props: { sort: true, group: true, descending: true } },
    { id: "view-settings-dialog-filter-only", props: { filter: true } },
    { id: "view-settings-dialog-group-only", props: { group: true } },
  ],
  react: ({ sort, filter, group, descending }) => (
    <div className="overflow-hidden p-3">
      <ViewSettingsDialog
        open
        portal={false}
        sortItems={sort ? vsdSortItems : undefined}
        filterItems={filter ? vsdFilterItems : undefined}
        groupItems={group ? vsdGroupItems : undefined}
        sortDescending={descending}
      />
    </div>
  ),
})
