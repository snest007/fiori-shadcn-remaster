import type { ValueState } from "@/components/ui/input"
import { PickerPopoverBody } from "@/components/ui/picker-field"
import { TimePicker, TimePickerFooter, TimeSelectionClocks } from "@/components/ui/time-picker"

import { defineFixtures } from "../fixture-types"
import { fieldCases, popoverSurface } from "./date-picker"

type Props = { value?: string; valueState?: ValueState; disabled?: boolean; readOnly?: boolean; popover?: boolean; clocks?: string }

export const TP_VALUE = "3:25:40\u202fPM"
const time = new Date(2024, 0, 1, 15, 25, 40)

// Fields in every state; the open popover (clocks + OK / Cancel) in place at a fixed time, also with
// the value state header; and the bare 24-hour clocks (ui5-time-selection-clocks).
export default defineFixtures<Props>({
  name: "time-picker",
  cases: [
    ...fieldCases("time-picker", TP_VALUE),
    { id: "time-picker-popover", props: { value: TP_VALUE, popover: true } },
    { id: "time-picker-popover-critical", props: { value: TP_VALUE, popover: true, valueState: "critical" } },
    { id: "time-picker-clocks-24h", props: { clocks: "HH:mm" } },
  ],
  react: ({ value, clocks, popover, ...p }) =>
    clocks ? (
      <div className="w-80 bg-(--fiori-popover-background)">
        <TimeSelectionClocks value={time} onValueChange={() => {}} formatPattern={clocks} />
      </div>
    ) : popover ? (
      <div className="overflow-hidden p-3">
        <div className={`${popoverSurface} fiori-time-picker-popover`}>
          <PickerPopoverBody
            valueState={p.valueState}
            footer={<TimePickerFooter />}
          >
            <TimeSelectionClocks value={time} onValueChange={() => {}} formatPattern={"h:mm:ss\u202fa"} />
          </PickerPopoverBody>
        </div>
      </div>
    ) : (
      <TimePicker wrapperClassName="w-(--w)" defaultValue={value} valueStateMessage={null} aria-label="Time" {...p} />
    ),
})
