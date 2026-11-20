import type { ValueState } from "@/components/ui/input"
import { TextArea } from "@/components/ui/textarea"

import { defineFixtures } from "../fixture-types"

type Props = {
  value?: string
  placeholder?: string
  valueState?: ValueState
  disabled?: boolean
  readOnly?: boolean
  rows?: number
  growing?: boolean
  growingMaxRows?: number
  maxLength?: number
  counter?: boolean
  applicationSurface?: boolean
}
const states = ["negative", "critical", "positive", "information"] as const
const lines = (n: number) => Array.from({ length: n }, (_, i) => `Line ${i + 1}`).join("\n")

export default defineFixtures<Props>({
  name: "textarea",
  cases: ([
    { id: "textarea-empty", props: { placeholder: "Enter a description" } },
    { id: "textarea-value", props: { value: "SAP SE" } },
    ...states.map((valueState) => ({ id: `textarea-${valueState}`, props: { value: "SAP SE", valueState } })),
    ...states.map((valueState) => ({ id: `textarea-${valueState}-empty`, props: { placeholder: "Placeholder", valueState } })),
    { id: "textarea-disabled", props: { value: "SAP SE", disabled: true } },
    { id: "textarea-readonly", props: { value: "SAP SE", readOnly: true } },
    { id: "textarea-rows-1", props: { value: "SAP SE", rows: 1 } },
    { id: "textarea-rows-4", props: { value: lines(2), rows: 4 } },
    { id: "textarea-growing", props: { value: lines(4), growing: true } },
    { id: "textarea-growing-max", props: { value: lines(3), growing: true, growingMaxRows: 3 } },
    { id: "textarea-counter", props: { value: "SAP SE", maxLength: 20, counter: true } },
    { id: "textarea-counter-over", props: { value: "SAP SE Walldorf Germany", maxLength: 20, counter: true } },
    { id: "textarea-counter-negative", props: { value: "SAP SE", maxLength: 20, counter: true, valueState: "negative" } },
    { id: "textarea-counter-critical", props: { value: "SAP SE", maxLength: 20, counter: true, valueState: "critical" } },
    { id: "textarea-counter-negative-application", props: { value: "SAP SE", maxLength: 20, counter: true, valueState: "negative", applicationSurface: true } },
    { id: "textarea-counter-critical-application", props: { value: "SAP SE", maxLength: 20, counter: true, valueState: "critical", applicationSurface: true } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "textarea-rtl" }] : [fixture]),
  react: ({ value, counter, applicationSurface, ...p }) => (
    <div style={applicationSurface ? { backgroundColor: "var(--sapBackgroundColor)" } : undefined}>
    <TextArea
      wrapperClassName="w-(--w)"
      defaultValue={value}
      counterMode={counter ? "always" : undefined}
      valueStateMessage={null}
      aria-label="Description"
      {...p}
    />
    </div>
  ),
})
