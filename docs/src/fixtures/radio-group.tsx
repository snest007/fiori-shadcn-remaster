import type { ValueState } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { defineFixtures } from "../fixture-types"

type Props = { checked?: boolean; text?: string; disabled?: boolean; readOnly?: boolean; valueState?: ValueState }
const states = ["negative", "critical", "positive", "information"] as const

export default defineFixtures<Props>({
  name: "radio-group",
  cases: ([
    { id: "radio-group", props: {} },
    { id: "radio-group-checked", props: { checked: true } },
    { id: "radio-group-text", props: { text: "Option A" }, interact: { selector: '[data-slot="radio-group-item"]', ui5Selector: "ui5-radio-button" } },
    { id: "radio-group-text-checked", props: { text: "Option A", checked: true } },
    { id: "radio-group-disabled", props: { text: "Disabled", disabled: true } },
    { id: "radio-group-disabled-checked", props: { text: "Disabled", disabled: true, checked: true } },
    { id: "radio-group-readonly", props: { text: "Read only", readOnly: true } },
    { id: "radio-group-readonly-checked", props: { text: "Read only", readOnly: true, checked: true } },
    ...states.map((valueState) => ({ id: `radio-group-${valueState}`, props: { valueState, text: "Option" } })),
    ...states.map((valueState) => ({ id: `radio-group-${valueState}-checked`, props: { valueState, checked: true } })),
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "radio-group-rtl" }] : [fixture]),
  // One radio per cell, wrapped in its own group (UI5's reference is a lone ui5-radio-button).
  react: ({ checked, text, disabled, readOnly, valueState }) => (
    <RadioGroup defaultValue={checked ? "a" : undefined} aria-label="Group">
      <RadioGroupItem value="a" text={text} disabled={disabled} readOnly={readOnly} valueState={valueState} aria-label={text ? undefined : "Radio"} />
    </RadioGroup>
  ),
})
