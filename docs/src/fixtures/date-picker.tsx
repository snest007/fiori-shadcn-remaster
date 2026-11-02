import { Calendar } from "@/components/ui/calendar"
import { DatePicker } from "@/components/ui/date-picker"
import type { ValueState } from "@/components/ui/input"
import { PickerPopoverBody } from "@/components/ui/picker-field"

import { defineFixtures } from "../fixture-types"

export type PickerFieldFixture = { value?: string; placeholder?: string; valueState?: ValueState; disabled?: boolean; readOnly?: boolean; popover?: boolean }

/** Frame + surface for an open picker popover rendered in place (matches ui5-picker-popover.ts). */
export const popoverSurface = "fiori-popover fiori-picker-popover flex flex-col"
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
// The popover cases show the open value help in place (see ui5-picker-popover.ts), with a value in
// March 2024 so no day is marked as today; the negative one adds the value state header.
export default defineFixtures<PickerFieldFixture>({
  name: "date-picker",
  cases: [
    ...fieldCases("date-picker", "Mar 12, 2024"),
    { id: "date-picker-popover", props: { value: "Mar 12, 2024", popover: true } },
    { id: "date-picker-popover-negative", props: { value: "Mar 12, 2024", popover: true, valueState: "negative" } },
  ],
  react: ({ value, popover, ...p }) =>
    popover ? (
      <div className="overflow-hidden p-3">
        <div className={popoverSurface}>
          <PickerPopoverBody valueState={p.valueState}>
            <Calendar defaultSelectedDates={[new Date(2024, 2, 12)]} />
          </PickerPopoverBody>
        </div>
      </div>
    ) : (
      <DatePicker wrapperClassName="w-(--w)" defaultValue={value} valueStateMessage={null} aria-label="Date" {...p} />
    ),
})
