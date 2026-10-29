import * as React from "react"

import { Label } from "@/components/ui/label"
import { MultiComboBox, MultiComboBoxItem } from "@/components/ui/multi-combobox"

import { defineDemo } from "./types"

const COUNTRIES = [
  ["Argentina", "AR"], ["Australia", "AU"], ["Austria", "AT"], ["Belgium", "BE"], ["Brazil", "BR"], ["Bulgaria", "BG"],
  ["Canada", "CA"], ["China", "CN"], ["France", "FR"], ["Germany", "DE"], ["India", "IN"], ["Italy", "IT"], ["Japan", "JP"],
]

function MultiComboBoxDemo() {
  const [selected, setSelected] = React.useState(["DE", "FR"])
  return (
    <>
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
      </div>
      <p className="mt-4 text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        Typing filters the list and completes inline; Enter selects the match. F4 / Alt+↓ toggle the list and focus an item; Space
        toggles it, Enter toggles and closes, Ctrl+A toggles all. Clicking "n more" (or Ctrl+I on a token) shows only the selected
        items. Selected: <span data-testid="multi-combobox-selected">{selected.join(", ") || "—"}</span>
      </p>
    </>
  )
}

export default defineDemo({ title: "MultiComboBox", order: 38, Demo: MultiComboBoxDemo })
