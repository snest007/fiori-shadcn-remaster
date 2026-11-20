import { FioriLocaleProvider } from "@/lib/fiori-locale"
import de from "../../../registry/i18n/de.json"
import zh from "../../../registry/i18n/zh-CN.json"
import ar from "../../../registry/i18n/ar.json"
import type { ValueState } from "@/components/ui/input"
import { PickerPopoverBody } from "@/components/ui/picker-field"
import { TimePicker, TimePickerFooter, TimeSelectionClocks } from "@/components/ui/time-picker"

import { defineFixtures, readPageOptions } from "../fixture-types"
import { fieldCases, popoverSurface } from "./date-picker"

type Props = { locale?: string; pattern?: string; value?: string; valueState?: ValueState; disabled?: boolean; readOnly?: boolean; popover?: boolean; clocks?: string }

export const TP_VALUE = "3:25:40\u202fPM"
const time = new Date(2024, 0, 1, 15, 25, 40)

// Fields in every state; the open popover (clocks + OK / Cancel) in place at a fixed time, also with
// the value state header; and the bare 24-hour clocks (ui5-time-selection-clocks).
// Localized cases own their provider and filtering; shared fixture routing stays unchanged.
const renderFixture: import("../fixture-types").FixtureSet<Props>["react"] = ({ value, clocks, popover, pattern, ...p }) =>
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
      <TimePicker formatPattern={pattern} wrapperClassName="w-(--w)" defaultValue={value} valueStateMessage={null} aria-label="Time" {...p} />
    )

export default defineFixtures<Props>({
  name: "time-picker",
  cases: ([
    ...["de-DE", "zh-CN", "ar-EG"].map(locale => ({ id: `time-picker-l10n-${locale}`, props: { locale, value: "15:25:40", pattern: "HH:mm:ss" } })),
    ...fieldCases("time-picker", TP_VALUE),
    { id: "time-picker-popover", props: { value: TP_VALUE, popover: true } },
    { id: "time-picker-popover-critical", props: { value: TP_VALUE, popover: true, valueState: "critical" } },
    { id: "time-picker-clocks-24h", props: { clocks: "HH:mm" } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).filter(fixture => !fixture.id.includes("-l10n-") || ("locale" in fixture.props && fixture.props.locale === readPageOptions().locale)),
  react: (props) => props.locale ? <FioriLocaleProvider locale={props.locale} texts={props.locale === "de-DE" ? de : props.locale === "zh-CN" ? zh : ar}>{renderFixture(props)}</FioriLocaleProvider> : renderFixture(props),
})
