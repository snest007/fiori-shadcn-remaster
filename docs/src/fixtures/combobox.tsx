import { ComboBox, ComboBoxItem } from "@/components/ui/combobox"
import type { ValueState } from "@/components/ui/input"

import { defineFixtures } from "../fixture-types"

type Props = { value?: string; placeholder?: string; valueState?: ValueState; disabled?: boolean; readOnly?: boolean }
const states = ["negative", "critical", "positive", "information"] as const
export const COUNTRIES = ["Argentina", "Australia", "Austria", "Belgium", "Brazil", "Bulgaria", "Canada", "China", "Germany", "India"]

export default defineFixtures<Props>({
  name: "combobox",
  cases: [
    { id: "combobox-empty", props: { placeholder: "Choose a country" } },
    { id: "combobox-value", props: { value: "Germany" } },
    ...states.map((valueState) => ({ id: `combobox-${valueState}`, props: { value: "Germany", valueState } })),
    { id: "combobox-disabled", props: { value: "Germany", disabled: true } },
    { id: "combobox-readonly", props: { value: "Germany", readOnly: true } },
  ],
  react: ({ value, ...p }) => (
    <ComboBox wrapperClassName="w-(--w)" defaultValue={value} valueStateMessage={null} aria-label="Country" {...p}>
      {COUNTRIES.map((c) => <ComboBoxItem key={c} text={c} />)}
    </ComboBox>
  ),
})
