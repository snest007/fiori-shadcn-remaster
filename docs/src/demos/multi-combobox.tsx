import * as React from "react"

import { Label } from "@/components/ui/label"
import { MultiComboBox, MultiComboBoxItem, MultiComboBoxItemGroup } from "@/components/ui/multi-combobox"

import { defineDemo } from "./types"

const COUNTRIES = [
  ["Argentina", "AR"], ["Australia", "AU"], ["Austria", "AT"], ["Belgium", "BE"], ["Brazil", "BR"], ["Bulgaria", "BG"],
  ["Canada", "CA"], ["China", "CN"], ["France", "FR"], ["Germany", "DE"], ["India", "IN"], ["Italy", "IT"], ["Japan", "JP"],
]

function rangeGroups() {
  return <>
    <MultiComboBoxItemGroup headerText="Fruit">
      <MultiComboBoxItem text="Apple" />
      <MultiComboBoxItem text="Apricot" />
      <MultiComboBoxItem text="Avocado" />
    </MultiComboBoxItemGroup>
    <MultiComboBoxItemGroup headerText="Vegetables">
      <MultiComboBoxItem text="Asparagus" />
      <MultiComboBoxItem text="Broccoli" />
    </MultiComboBoxItemGroup>
  </>
}

function MultiComboBoxDemo() {
  const [rangeSelected, setRangeSelected] = React.useState(["Apricot", "Asparagus", "Broccoli"])
  const [mixedRangeSelected, setMixedRangeSelected] = React.useState(["Apricot", "Asparagus", "Broccoli"])
  const [rangeEvents, setRangeEvents] = React.useState(0)
  const [mixedRangeEvents, setMixedRangeEvents] = React.useState(0)
  const [groupSelected, setGroupSelected] = React.useState<string[]>([])
  const [selected, setSelected] = React.useState(["DE", "FR"])
  return (
    <div id="multi-combobox-demo">
      <div className="grid max-w-lg grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
        <Label htmlFor="multi-combobox-countries" showColon>Countries</Label>
        <MultiComboBox
          id="multi-combobox-countries"
          selectedValues={selected}
          onSelectionChange={setSelected}
          placeholder="Type or choose"
          showSelectAll
        >
          {COUNTRIES.map(([c, code]) => <MultiComboBoxItem key={code} value={code} text={c} additionalText={code} />)}
        </MultiComboBox>
        <Label htmlFor="multi-combobox-disabled" showColon>Disabled</Label>
        <MultiComboBox id="multi-combobox-disabled" disabled defaultSelectedValues={["Germany"]}>
          <MultiComboBoxItem text="Germany" />
        </MultiComboBox>
        <Label htmlFor="multi-combobox-groups" showColon>Grouped countries</Label>
        <MultiComboBox id="multi-combobox-groups" selectedValues={groupSelected} onSelectionChange={setGroupSelected} showSelectAll placeholder="Type or choose">
          <MultiComboBoxItemGroup headerText="Americas">
            {["Argentina", "Brazil", "Canada"].map((text) => <MultiComboBoxItem key={text} text={text} />)}
          </MultiComboBoxItemGroup>
          <MultiComboBoxItemGroup headerText="Europe">
            <>
              <MultiComboBoxItem text="Denmark" />
              <MultiComboBoxItem text="Estonia" />
              <MultiComboBoxItem text="France" />
            </>
          </MultiComboBoxItemGroup>
          <MultiComboBoxItemGroup headerText="Empty" />
          <MultiComboBoxItem text="Japan" />
        </MultiComboBox>
        <Label htmlFor="multi-combobox-ranges" showColon>Grouped ranges</Label>
        <MultiComboBox id="multi-combobox-ranges" selectedValues={rangeSelected} onSelectionChange={(values) => { setRangeSelected(values); setRangeEvents((count) => count + 1) }} filter="contains" noTypeahead>
          {rangeGroups()}
        </MultiComboBox>
        <Label htmlFor="multi-combobox-mixed-ranges" showColon>Mixed ranges</Label>
        <MultiComboBox id="multi-combobox-mixed-ranges" selectedValues={mixedRangeSelected} onSelectionChange={(values) => { setMixedRangeSelected(values); setMixedRangeEvents((count) => count + 1) }} filter="contains" noTypeahead>
          <MultiComboBoxItem text="Plum" />
          {rangeGroups()}
          <MultiComboBoxItem text="Radish" />
        </MultiComboBox>
      </div>
      <p className="mt-2 text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        Grouped selection: <span data-testid="multi-combobox-groups-selected">{groupSelected.join(", ") || "—"}</span>.
        Range selection: <span data-testid="multi-combobox-ranges-selected">{rangeSelected.join(", ") || "—"}</span>.
        Range events: <span data-testid="multi-combobox-ranges-events">{rangeEvents}</span>.
        Mixed range selection: <span data-testid="multi-combobox-mixed-ranges-selected">{mixedRangeSelected.join(", ") || "—"}</span>.
        Mixed range events: <span data-testid="multi-combobox-mixed-ranges-events">{mixedRangeEvents}</span>.
      </p>
      <p className="mt-4 text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        Typing filters the list and completes inline; Enter selects the match. F4 / Alt+↓ toggle the list and focus an item; Space
        toggles it, Enter toggles and closes, Ctrl+A toggles all. Clicking "n more" (or Ctrl+I on a token) shows only the selected
        items. Selected: <span data-testid="multi-combobox-selected">{selected.join(", ") || "—"}</span>
      </p>
    </div>
  )
}

export default defineDemo({ title: "MultiComboBox", order: 38, Demo: MultiComboBoxDemo })
