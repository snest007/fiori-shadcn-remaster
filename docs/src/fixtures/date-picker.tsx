import { FioriLocaleProvider } from "@/lib/fiori-locale"
import de from "../../../registry/i18n/de.json"
import zh from "../../../registry/i18n/zh-CN.json"
import ar from "../../../registry/i18n/ar.json"
import { Calendar } from "@/components/ui/calendar"
import { DatePicker } from "@/components/ui/date-picker"
import type { ValueState } from "@/components/ui/input"
import { PickerPopoverBody } from "@/components/ui/picker-field"

import { defineFixtures, readPageOptions } from "../fixture-types"

export type PickerFieldFixture = { locale?: string; pattern?: string; value?: string; placeholder?: string; valueState?: ValueState; disabled?: boolean; readOnly?: boolean; popover?: boolean }

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
// Localized cases own their provider and filtering; shared fixture routing stays unchanged.
const renderFixture: import("../fixture-types").FixtureSet<PickerFieldFixture>["react"] = ({ value, popover, pattern, ...p }) =>
    popover ? (
      <div className="overflow-hidden p-3">
        <div className={popoverSurface}>
          <PickerPopoverBody valueState={p.valueState}>
            <Calendar locale={p.locale} defaultSelectedDates={[new Date(2024, 2, 12)]} />
          </PickerPopoverBody>
        </div>
      </div>
    ) : (
      <DatePicker formatPattern={pattern} wrapperClassName="w-(--w)" defaultValue={value} valueStateMessage={null} aria-label="Date" {...p} />
    )

export default defineFixtures<PickerFieldFixture>({
  name: "date-picker",
  cases: ([
    ...["de-DE", "zh-CN", "ar-EG"].map(locale => ({ id: `date-picker-l10n-${locale}`, props: { locale, value: "2024-03-12", pattern: "yyyy-MM-dd", popover: true } })),
    ...fieldCases("date-picker", "Mar 12, 2024"),
    { id: "date-picker-popover", props: { value: "Mar 12, 2024", popover: true } },
    { id: "date-picker-popover-negative", props: { value: "Mar 12, 2024", popover: true, valueState: "negative" } },
  ] satisfies import("../fixture-types").FixtureCase<PickerFieldFixture>[]).flatMap((fixture, index, fixtures) => index === 0 ? [fixture, { ...fixtures.find(c => !c.id.includes("-l10n-"))!, id: "date-picker-rtl" }] : [fixture]).filter(fixture => !fixture.id.includes("-l10n-") || ("locale" in fixture.props && fixture.props.locale === readPageOptions().locale)),
  react: (props) => props.locale ? <FioriLocaleProvider locale={props.locale} texts={props.locale === "de-DE" ? de : props.locale === "zh-CN" ? zh : ar}>{renderFixture(props)}</FioriLocaleProvider> : renderFixture(props),
})
