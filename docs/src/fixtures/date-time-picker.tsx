import { Button } from "@/components/ui/button"
import { DateTimePicker, DateTimeSelection } from "@/components/ui/date-time-picker"
import { PickerPopoverBody } from "@/components/ui/picker-field"

import { defineFixtures } from "../fixture-types"
import { fieldCases, popoverSurface, type PickerFieldFixture } from "./date-picker"

const PATTERN = "MMM d, y, h:mm:ss a"
export const DT_VALUE = "Mar 12, 2024, 3:25:40 PM"

// Fields, plus the open popover (calendar | clocks, OK / Cancel footer) in place at a fixed date-time.
export default defineFixtures<PickerFieldFixture>({
  name: "date-time-picker",
  cases: [...fieldCases("date-time-picker", DT_VALUE), { id: "date-time-picker-popover", props: { value: DT_VALUE, popover: true } }],
  react: ({ value, popover, ...p }) =>
    popover ? (
      <div className="overflow-hidden p-3">
        <div className={`${popoverSurface} fiori-date-time-picker-popover`}>
          <PickerPopoverBody
            footer={
              <div className="fiori-dt-picker-footer">
                <Button variant="emphasized" className="fiori-dt-picker-ok">OK</Button>
                <Button variant="transparent">Cancel</Button>
              </div>
            }
          >
            <DateTimeSelection
              pattern={PATTERN}
              day={new Date(2024, 2, 12)}
              time={new Date(2024, 2, 12, 15, 25, 40)}
              onDayChange={() => {}}
              onTimeChange={() => {}}
            />
          </PickerPopoverBody>
        </div>
      </div>
    ) : (
      <DateTimePicker wrapperClassName="w-(--w)" defaultValue={value} valueStateMessage={null} aria-label="Date and time" {...p} />
    ),
})
