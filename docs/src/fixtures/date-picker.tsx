import { DatePicker } from "@/components/ui/date-picker"
import type { ValueState } from "@/components/ui/input"

import { defineFixtures } from "../fixture-types"

export type PickerFieldFixture = { value?: string; placeholder?: string; valueState?: ValueState; disabled?: boolean; readOnly?: boolean }
const states = ["negative", "critical", "positive", "information"] as const

/** The field states every date/time picker fixture set compares (`name` prefixes the ids). */
export const fieldCases = (name: string, value: string) => [
  { id: `${name}-empty`, props: {} },
  { id: `${name}-value`, props: { value } },
  ...states.map((valueState) => ({ id: `${name}-${valueState}`, props: { value, valueState } })),
  { id: `${name}-disabled`, props: { value, disabled: true } },
  { id: `${name}-readonly`, props: { value, readOnly: true } },
]

// The empty case shows UI5's default placeholder ("e.g. Dec 31, <current year>") on both sides.
export default defineFixtures<PickerFieldFixture>({
  name: "date-picker",
  cases: fieldCases("date-picker", "Mar 12, 2024"),
  react: ({ value, ...p }) => <DatePicker wrapperClassName="w-(--w)" defaultValue={value} valueStateMessage={null} aria-label="Date" {...p} />,
})
