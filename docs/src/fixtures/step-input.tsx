import { FioriLocaleProvider } from "@/lib/fiori-locale"
import de from "../../../registry/i18n/de.json"
import zh from "../../../registry/i18n/zh-CN.json"
import ar from "../../../registry/i18n/ar.json"
import type { ValueState } from "@/components/ui/input"
import { StepInput } from "@/components/ui/step-input"

import { defineFixtures, readPageOptions } from "../fixture-types"

type Props = {
  locale?: string
  value?: number
  min?: number
  max?: number
  step?: number
  valuePrecision?: number
  valueState?: ValueState
  disabled?: boolean
  readOnly?: boolean
}
const states = ["negative", "critical", "positive", "information"] as const

// Localized cases own their provider and filtering; shared fixture routing stays unchanged.
const renderFixture: import("../fixture-types").FixtureSet<Props>["react"] = ({ value, ...p }) => (
    <StepInput wrapperClassName="w-(--w)" defaultValue={value} valueStateMessage={null} aria-label="Quantity" {...p} />
  )

export default defineFixtures<Props>({
  name: "step-input",
  cases: ([
    ...["de-DE", "zh-CN", "ar-EG"].map(locale => ({ id: `step-input-l10n-${locale}`, props: { locale, value: 1.5, step: 0.1, valuePrecision: 1 } })),
    { id: "step-input", props: { value: 5 } },
    { id: "step-input-precision", props: { value: 2.5, step: 0.25, valuePrecision: 2 } },
    { id: "step-input-min", props: { value: 0, min: 0, max: 10 } },
    { id: "step-input-max", props: { value: 10, min: 0, max: 10 } },
    ...states.map((valueState) => ({ id: `step-input-${valueState}`, props: { value: 5, valueState } })),
    { id: "step-input-disabled", props: { value: 5, disabled: true } },
    { id: "step-input-readonly", props: { value: 5, readOnly: true } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).filter(fixture => !fixture.id.includes("-l10n-") || ("locale" in fixture.props && fixture.props.locale === readPageOptions().locale)),
  react: (props) => props.locale ? <FioriLocaleProvider locale={props.locale} texts={props.locale === "de-DE" ? de : props.locale === "zh-CN" ? zh : ar}>{renderFixture(props)}</FioriLocaleProvider> : renderFixture(props),
})
