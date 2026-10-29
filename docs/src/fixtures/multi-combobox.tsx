import type { ValueState } from "@/components/ui/input"
import { MultiComboBox, MultiComboBoxItem } from "@/components/ui/multi-combobox"

import { defineFixtures, FIELD_WIDTH } from "../fixture-types"
import { inPlace } from "./popover"

type Props = {
  selected?: string[]
  placeholder?: string
  valueState?: ValueState
  disabled?: boolean
  readOnly?: boolean
  width?: string
  /** Render the open list only, in place (the field itself is covered by the other cases). */
  list?: boolean
  selectAll?: boolean
}
const states = ["negative", "critical", "positive", "information"] as const
export const MCB_ITEMS = ["Argentina", "Brazil", "Canada", "Denmark", "Estonia", "France"]
const TWO = ["Argentina", "Brazil"]
const MANY = MCB_ITEMS.slice(0, 5)

export default defineFixtures<Props>({
  name: "multi-combobox",
  cases: [
    { id: "multi-combobox-empty", props: { placeholder: "Choose countries" } },
    { id: "multi-combobox-tokens", props: { selected: TWO, width: "20rem" } },
    { id: "multi-combobox-n-more", props: { selected: MANY } },
    ...states.map((valueState) => ({ id: `multi-combobox-${valueState}`, props: { selected: TWO, valueState, width: "20rem" } })),
    { id: "multi-combobox-disabled", props: { selected: MANY, disabled: true } },
    { id: "multi-combobox-readonly", props: { selected: MANY, readOnly: true } },
    { id: "multi-combobox-list", props: { selected: TWO, list: true } },
    { id: "multi-combobox-list-select-all", props: { selected: TWO, list: true, selectAll: true } },
  ],
  react: ({ selected = [], width = FIELD_WIDTH, list, selectAll, ...p }) => {
    const field = (
      <MultiComboBox
        defaultSelectedValues={selected}
        valueStateMessage={null}
        aria-label="Countries"
        open={list || undefined}
        portal={!list}
        showSelectAll={selectAll}
        {...p}
      >
        {MCB_ITEMS.map((c) => <MultiComboBoxItem key={c} text={c} />)}
      </MultiComboBox>
    )
    if (!list) return <div style={{ width }}>{field}</div>
    // The open list, shown in place: the field is taken out of the layout (UI5 side: only its popover is shown).
    return (
      <div className={`${inPlace} [&_[data-slot=multi-combobox]]:absolute! [&_[data-slot=multi-combobox]]:invisible [&_[data-slot=multi-combobox-popover]]:w-60 [&_[data-slot=multi-combobox-popover]]:min-w-0`}>
        {field}
      </div>
    )
  },
})
