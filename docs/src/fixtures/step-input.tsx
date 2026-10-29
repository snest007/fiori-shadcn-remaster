import type { ValueState } from "@/components/ui/input"
import { StepInput } from "@/components/ui/step-input"

import { defineFixtures } from "../fixture-types"

type Props = {
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

export default defineFixtures<Props>({
  name: "step-input",
  cases: [
    { id: "step-input", props: { value: 5 } },
    { id: "step-input-precision", props: { value: 2.5, step: 0.25, valuePrecision: 2 } },
    { id: "step-input-min", props: { value: 0, min: 0, max: 10 } },
    { id: "step-input-max", props: { value: 10, min: 0, max: 10 } },
    ...states.map((valueState) => ({ id: `step-input-${valueState}`, props: { value: 5, valueState } })),
    { id: "step-input-disabled", props: { value: 5, disabled: true } },
    { id: "step-input-readonly", props: { value: 5, readOnly: true } },
  ],
  react: ({ value, ...p }) => (
    <StepInput wrapperClassName="w-(--w)" defaultValue={value} valueStateMessage={null} aria-label="Quantity" {...p} />
  ),
})
