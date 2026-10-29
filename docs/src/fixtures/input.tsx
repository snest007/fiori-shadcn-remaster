import { Input, type ValueState } from "@/components/ui/input"

import { defineFixtures } from "../fixture-types"

type Props = { value?: string; placeholder?: string; valueState?: ValueState; disabled?: boolean; readOnly?: boolean }
const states = ["negative", "critical", "positive", "information"] as const

export default defineFixtures<Props>({
  name: "input",
  cases: [
    { id: "input-empty", props: { placeholder: "Enter a name" } },
    { id: "input-value", props: { value: "SAP SE" } },
    ...states.map((valueState) => ({ id: `input-${valueState}`, props: { value: "SAP SE", valueState } })),
    { id: "input-disabled", props: { value: "SAP SE", disabled: true } },
    { id: "input-readonly", props: { value: "SAP SE", readOnly: true } },
  ],
  react: ({ value, ...p }) => (
    <Input wrapperClassName="w-(--w)" defaultValue={value} valueStateMessage={null} aria-label="Input" {...p} />
  ),
})
