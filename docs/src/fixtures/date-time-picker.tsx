import { FioriLocaleProvider } from "@/lib/fiori-locale"
import de from "../../../registry/i18n/de.json"
import zh from "../../../registry/i18n/zh-CN.json"
import ar from "../../../registry/i18n/ar.json"
import { Button } from "@/components/ui/button"
import { DateTimePicker, DateTimeSelection } from "@/components/ui/date-time-picker"
import { useFioriLocale } from "@/lib/fiori-locale"
import { PickerPopoverBody } from "@/components/ui/picker-field"

import { defineFixtures, readPageOptions } from "../fixture-types"
import { fieldCases, popoverSurface, type PickerFieldFixture } from "./date-picker"

const PATTERN = "MMM d, y, h:mm:ss a"
export const DT_VALUE = "Mar 12, 2024, 3:25:40 PM"

// Fields, plus the open popover (calendar | clocks, OK / Cancel footer) in place at a fixed date-time.
// Localized cases own their provider and filtering; shared fixture routing stays unchanged.
const renderFixture: import("../fixture-types").FixtureSet<PickerFieldFixture>["react"] = ({ value, popover, pattern, ...p }) =>
    popover ? (
      <div className="overflow-hidden p-3">
        <div className={`${popoverSurface} fiori-date-time-picker-popover`}>
          <PickerPopoverBody
            footer={
              p.locale ? <LocalizedFooter /> : <div className="fiori-dt-picker-footer">
                <Button variant="emphasized" className="fiori-dt-picker-ok">OK</Button>
                <Button variant="transparent">Cancel</Button>
              </div>
            }
          >
            <DateTimeSelection
              pattern={pattern ?? PATTERN}
              locale={p.locale}
              day={new Date(2024, 2, 12)}
              time={new Date(2024, 2, 12, 15, 25, 40)}
              onDayChange={() => {}}
              onTimeChange={() => {}}
            />
          </PickerPopoverBody>
        </div>
      </div>
    ) : (
      <DateTimePicker formatPattern={pattern} wrapperClassName="w-(--w)" defaultValue={value} valueStateMessage={null} aria-label="Date and time" {...p} />
    )

export default defineFixtures<PickerFieldFixture>({
  name: "date-time-picker",
  cases: ([...["de-DE", "zh-CN", "ar-EG"].map(locale => ({ id: `date-time-picker-l10n-${locale}`, props: { locale, value: "2024-03-12 15:25:40", pattern: "yyyy-MM-dd HH:mm:ss", popover: true } })), ...fieldCases("date-time-picker", DT_VALUE), { id: "date-time-picker-popover", props: { value: DT_VALUE, popover: true } }] satisfies import("../fixture-types").FixtureCase<PickerFieldFixture>[]).filter(fixture => !fixture.id.includes("-l10n-") || ("locale" in fixture.props && fixture.props.locale === readPageOptions().locale)),
  react: (props) => props.locale ? <FioriLocaleProvider locale={props.locale} texts={props.locale === "de-DE" ? de : props.locale === "zh-CN" ? zh : ar}>{renderFixture(props)}</FioriLocaleProvider> : renderFixture(props),
})

function LocalizedFooter() {
  const { t } = useFioriLocale()
  return <div className="fiori-dt-picker-footer"><Button variant="emphasized" className="fiori-dt-picker-ok">{t("TIMEPICKER_SUBMIT_BUTTON", "OK")}</Button><Button variant="transparent">{t("TIMEPICKER_CANCEL_BUTTON", "Cancel")}</Button></div>
}
