import type { ValueState } from "@/components/ui/input"
import { TimePicker, TimeSelectionClocks } from "@/components/ui/time-picker"

import { defineFixtures } from "../fixture-types"
import { fieldCases } from "./date-picker"

type Props = { value?: string; valueState?: ValueState; disabled?: boolean; readOnly?: boolean; clocks?: string; pattern?: string }

/** The clocks surface uses a fixed time (UI5 would otherwise start from "now"). */
export const CLOCK_TIME = [15, 25, 40] as const

// Fields in every state, plus the open popover's content (ui5-time-selection-clocks) rendered in place
// at a fixed time, 12-hour (with AM/PM) and 24-hour. The popover frame itself is the same surface as
// the date pickers' and is checked in tests/time-picker.spec.ts.
export default defineFixtures<Props>({
  name: "time-picker",
  cases: [
    ...fieldCases("time-picker", "3:25:40\u202fPM"),
    { id: "time-picker-clocks", props: { clocks: "h:mm:ss a" } },
    { id: "time-picker-clocks-24h", props: { clocks: "HH:mm" } },
  ],
  react: ({ value, clocks, ...p }) =>
    clocks ? (
      <div className="w-80 bg-(--fiori-popover-background)">
        <TimeSelectionClocks value={new Date(2024, 0, 1, ...CLOCK_TIME)} onValueChange={() => {}} formatPattern={clocks} />
      </div>
    ) : (
      <TimePicker wrapperClassName="w-(--w)" defaultValue={value} valueStateMessage={null} aria-label="Time" {...p} />
    ),
})
