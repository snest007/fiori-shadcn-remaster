import { ComboBox, ComboBoxItem, ComboBoxItemGroup } from "@/components/ui/combobox"
import type { ValueState } from "@/components/ui/input"

import { defineFixtures } from "../fixture-types"
import { inPlace } from "./popover"

type Props = { value?: string; placeholder?: string; valueState?: ValueState; disabled?: boolean; readOnly?: boolean; list?: boolean }
const states = ["negative", "critical", "positive", "information"] as const
export const COUNTRIES = ["Argentina", "Australia", "Austria", "Belgium", "Brazil", "Bulgaria", "Canada", "China", "Germany", "India"]

export const CB_GROUPS = [
  { headerText: "Americas", items: ["Argentina", "Brazil", "Canada"] },
  { headerText: "Europe", items: ["Denmark", "Estonia", "France"] },
]

export default defineFixtures<Props>({
  name: "combobox",
  cases: [
    { id: "combobox-empty", props: { placeholder: "Choose a country" } },
    { id: "combobox-value", props: { value: "Germany" } },
    ...states.map((valueState) => ({ id: `combobox-${valueState}`, props: { value: "Germany", valueState } })),
    { id: "combobox-disabled", props: { value: "Germany", disabled: true } },
    { id: "combobox-readonly", props: { value: "Germany", readOnly: true } },
    { id: "combobox-groups-open", props: { value: "Brazil", list: true } },
  ],
  react: ({ value, list, ...p }) => {
    const field = (
      <ComboBox wrapperClassName="w-(--w)" defaultValue={value} open={list || undefined} portal={!list} valueStateMessage={null} aria-label="Country" {...p}>
        {list ? CB_GROUPS.map((group) => (
          <ComboBoxItemGroup key={group.headerText} headerText={group.headerText}>
            {group.items.map((c) => <ComboBoxItem key={c} text={c} />)}
          </ComboBoxItemGroup>
        )) : COUNTRIES.map((c) => <ComboBoxItem key={c} text={c} />)}
      </ComboBox>
    )
    if (!list) return field
    return (
      <div className={`${inPlace} [&_[data-slot=combobox]]:absolute! [&_[data-slot=combobox]]:invisible [&_[data-slot=combobox-popover]]:w-60 [&_[data-slot=combobox-popover]]:min-w-0`}>
        {field}
      </div>
    )
  },
})
