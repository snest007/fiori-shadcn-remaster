import { Checkbox } from "@/components/ui/checkbox"
import type { ValueState } from "@/components/ui/input"

import { defineFixtures } from "../fixture-types"

type Props = {
  checked?: boolean | "indeterminate"
  text?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  valueState?: ValueState
}
const states = ["negative", "critical", "positive", "information"] as const

export default defineFixtures<Props>({
  name: "checkbox",
  cases: [
    { id: "checkbox", props: {} },
    { id: "checkbox-checked", props: { checked: true } },
    { id: "checkbox-indeterminate", props: { checked: "indeterminate" } },
    { id: "checkbox-text", props: { text: "Accept terms" } },
    { id: "checkbox-text-checked", props: { text: "Accept terms", checked: true } },
    { id: "checkbox-text-required", props: { text: "Accept terms", required: true } },
    { id: "checkbox-disabled", props: { text: "Disabled", disabled: true } },
    { id: "checkbox-disabled-checked", props: { text: "Disabled", disabled: true, checked: true } },
    { id: "checkbox-readonly", props: { text: "Read only", readOnly: true } },
    { id: "checkbox-readonly-checked", props: { text: "Read only", readOnly: true, checked: true } },
    ...states.map((valueState) => ({ id: `checkbox-${valueState}`, props: { valueState } })),
    ...states.map((valueState) => ({ id: `checkbox-${valueState}-checked`, props: { valueState, checked: true, text: "Option" } })),
    { id: "checkbox-critical-indeterminate", props: { valueState: "critical", checked: "indeterminate" } },
  ],
  react: ({ checked, text, disabled, readOnly, required, valueState }) => (
    <Checkbox
      defaultChecked={checked ?? false}
      text={text}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      valueState={valueState}
      aria-label={text ? undefined : "Checkbox"}
    />
  ),
})
