import { DateRangePicker } from "@/components/ui/date-range-picker"

import { defineFixtures } from "../fixture-types"
import { fieldCases, type PickerFieldFixture } from "./date-picker"

export default defineFixtures<PickerFieldFixture>({
  name: "date-range-picker",
  cases: (fieldCases("date-range-picker", "Mar 5, 2024 - Mar 14, 2024") satisfies import("../fixture-types").FixtureCase<PickerFieldFixture>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "date-range-picker-rtl" }] : [fixture]),
  react: ({ value, popover: _popover, ...p }) => (
    <DateRangePicker wrapperClassName="w-(--w)" defaultValue={value} valueStateMessage={null} aria-label="Date range" {...p} />
  ),
})
