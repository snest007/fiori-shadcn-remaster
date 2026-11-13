import * as React from "react"

import { ComboBox, ComboBoxItem, ComboBoxItemGroup } from "@/components/ui/combobox"
import { Label } from "@/components/ui/label"

import { defineDemo } from "./types"

const COUNTRIES = [
  ["Argentina", "AR"], ["Australia", "AU"], ["Austria", "AT"], ["Belgium", "BE"], ["Brazil", "BR"],
  ["Bulgaria", "BG"], ["Canada", "CA"], ["China", "CN"], ["France", "FR"], ["Germany", "DE"],
  ["India", "IN"], ["Italy", "IT"], ["Japan", "JP"], ["New Zealand", "NZ"], ["South Africa", "ZA"],
  ["Spain", "ES"], ["United Kingdom", "GB"], ["United States", "US"],
]

function ComboBoxDemo() {
  const [groupCommitted, setGroupCommitted] = React.useState("")
  const [groupSelection, setGroupSelection] = React.useState("")
  const [country, setCountry] = React.useState("")
  const [committed, setCommitted] = React.useState("")
  const known = COUNTRIES.some(([c]) => c.toLowerCase() === committed.toLowerCase())
  return (
    <div id="combobox-demo">
      <div className="grid max-w-md grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
        <Label htmlFor="cb-country" showColon>Country</Label>
        <ComboBox
          id="cb-country"
          value={country}
          onValueChange={setCountry}
          onCommit={setCommitted}
          placeholder="Type or choose"
          valueState={committed && !known ? "critical" : "none"}
          valueStateMessage={committed && !known ? "Not in the list; free text is kept." : undefined}
        >
          {COUNTRIES.map(([c, code]) => <ComboBoxItem key={code} text={c} additionalText={code} />)}
        </ComboBox>
        <Label htmlFor="combo-disabled" showColon>Disabled</Label>
        <ComboBox id="combo-disabled" disabled defaultValue="Germany">
          <ComboBoxItem text="Germany" />
        </ComboBox>
        <Label htmlFor="combobox-ordering" showColon>Standalone before group</Label>
        <ComboBox id="combobox-ordering" placeholder="Type or choose">
          <ComboBoxItem text="Japan" />
          <ComboBoxItemGroup headerText="Americas">
            <ComboBoxItem text="Argentina" />
          </ComboBoxItemGroup>
        </ComboBox>
        <Label htmlFor="combobox-groups" showColon>Grouped countries</Label>
        <ComboBox id="combobox-groups" onCommit={setGroupCommitted} onSelectionChange={(item) => setGroupSelection(item?.text ?? "")} placeholder="Type or choose">
          <ComboBoxItemGroup headerText="Americas">
            {["Argentina", "Brazil", "Canada"].map((text) => <ComboBoxItem key={text} text={text} />)}
          </ComboBoxItemGroup>
          <ComboBoxItemGroup headerText="Europe">
            <>
              <ComboBoxItem text="Denmark" />
              <ComboBoxItem text="Estonia" />
              <ComboBoxItem text="France" />
            </>
          </ComboBoxItemGroup>
          <ComboBoxItemGroup headerText="Empty" />
          <ComboBoxItem text="Japan" />
        </ComboBox>
      </div>
      <p className="mt-2 text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        Grouped selection: <span data-testid="combobox-groups-selection">{groupSelection || "—"}</span>.
        Committed: <span data-testid="combobox-groups-committed">{groupCommitted || "—"}</span>.
      </p>
      <p className="mt-4 text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        Typing filters the list and completes the first match inline. F4 or Alt+↓ toggle the list; ↑/↓, PageUp/PageDown and
        Home/End walk the items even while it is closed; Enter commits; Escape closes the list, then restores the value.
        Committed: <span data-testid="cb-committed">{committed || "—"}</span>
      </p>
    </div>
  )
}

export default defineDemo({
  category: "Forms",
  docs: [
    {
      name: "combobox",
      description: "An editable choice with filtering, autocomplete and free text.",
      props: [
        { name: "ComboBox.value", type: "string", description: "Controlled field text." },
        { name: "ComboBox.onValueChange", type: "(value: string) => void", description: "Receive typing, autocomplete and navigation changes." },
        { name: "ComboBox.onCommit", type: "(value: string) => void", description: "Receive committed text on Enter, blur or selection." },
        { name: "ComboBox.onSelectionChange", type: "(item: ComboBoxItemProps | null) => void", description: "Receive the matching item or null." },
        { name: "ComboBox.filter", type: "startsWithPerTerm | startsWith | contains | none", description: "Filtering strategy.", defaultValue: "startsWithPerTerm" },
        { name: "ComboBox.dialogTitle / okText / cancelText", type: "string", description: "Override the phone dialog title and actions. Cancel/Escape restores the last committed text; OK or a row commits it.", defaultValue: "All Items / OK / Cancel" },
      ],
    },
  ],
 title: "ComboBox", order: 31, Demo: ComboBoxDemo })
