import { FioriLocaleProvider } from "@/lib/fiori-locale"
import de from "../../../registry/i18n/de.json"
import zh from "../../../registry/i18n/zh-CN.json"
import ar from "../../../registry/i18n/ar.json"
import { RangeSlider, Slider } from "@/components/ui/slider"

import { defineFixtures, readPageOptions } from "../fixture-types"

type Props = {
  locale?: string
  range?: [number, number]
  value?: number
  min?: number
  max?: number
  step?: number
  showTickmarks?: boolean
  labelInterval?: number
  disabled?: boolean
  editableTooltip?: boolean
  tooltipFixture?: boolean
}

// Localized cases own their provider and filtering; shared fixture routing stays unchanged.
const renderFixture: import("../fixture-types").FixtureSet<Props>["react"] = ({ range, value, tooltipFixture, ...p }) => (
    <div style={{ width: "20rem", ...(tooltipFixture ? { paddingBlockStart: "6rem" } : {}) }}>
      {range ? <RangeSlider value={range} aria-label="Range" {...p} /> : <Slider value={value} aria-label="Value" {...p} />}
    </div>
  )

export default defineFixtures<Props>({
  name: "slider",
  cases: ([
    ...["de-DE", "zh-CN", "ar-EG"].map(locale => ({ id: `slider-l10n-${locale}`, props: { locale, value: 0.5, min: 0, max: 2, step: 0.1 } })),
    { id: "slider-0", props: { value: 0 } },
    { id: "slider-40", props: { value: 40 } },
    { id: "slider-100", props: { value: 100 } },
    { id: "slider-tickmarks", props: { value: 3, min: 0, max: 10, showTickmarks: true } },
    { id: "slider-labels", props: { value: 6, min: 0, max: 10, showTickmarks: true, labelInterval: 2 } },
    { id: "slider-disabled", props: { value: 30, disabled: true } },
    { id: "slider-editable-range", props: { range: [0.5, 1.5], min: 0, max: 2, step: 0.1, editableTooltip: true, tooltipFixture: true } },
    { id: "slider-range", props: { range: [20, 70] } },
    { id: "slider-range-tickmarks", props: { range: [2, 6], min: 0, max: 10, showTickmarks: true, labelInterval: 5 } },
    { id: "slider-range-disabled", props: { range: [10, 50], disabled: true } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index, fixtures) => index === 0 ? [fixture, { ...fixtures.find(c => !c.id.includes("-l10n-"))!, id: "slider-rtl" }] : [fixture]).filter(fixture => !fixture.id.includes("-l10n-") || ("locale" in fixture.props && fixture.props.locale === readPageOptions().locale)),
  react: (props) => props.locale ? <FioriLocaleProvider locale={props.locale} texts={props.locale === "de-DE" ? de : props.locale === "zh-CN" ? zh : ar}>{renderFixture(props)}</FioriLocaleProvider> : renderFixture(props),
})
