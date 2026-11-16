import { ValueHelpDialog } from "@/components/ui/value-help-dialog"

import { defineFixtures } from "../fixture-types"
import { productColumns, products } from "./vhd-data"

type Props = { single?: boolean }

// No UI5 Web Component exists for the value help dialog (it is sap.ui.comp / sap.ui.mdc in SAPUI5), so there
// is no reference to pixel-compare against: these cells are for the docs grid and screenshot review only.
// The layout was checked by screenshot against the Fiori design guideline images (multi selection with
// tabs, single selection without), see tests/value-help-dialog.spec.ts.
export default defineFixtures<Props>({
  name: "value-help-dialog",
  cases: ([
    { id: "value-help-dialog-multi", props: {} },
    { id: "value-help-dialog-single", props: { single: true } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "value-help-dialog-rtl" }] : [fixture]),
  react: ({ single }) => (
    <div className="overflow-hidden p-3">
      <ValueHelpDialog
        open
        portal={false}
        title={single ? "Select: Product" : "Product"}
        columns={productColumns}
        items={products}
        keyField="id"
        descriptionField="name"
        selectionMode={single ? "single" : "multiple"}
        filters={productColumns}
        defaultValue={single ? undefined : { keys: ["HT 1000"], conditions: [{ operator: "StartsWith", values: ["H"] }, { operator: "Contains", values: ["100"] }] }}
        className="w-[60rem]"
      />
    </div>
  ),
  skipCompare: ["value-help-dialog-multi", "value-help-dialog-single"],
})
