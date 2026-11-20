import type { ValueState } from "@/components/ui/input"
import { MultiInput } from "@/components/ui/multi-input"
import { Token } from "@/components/ui/token"

import { defineFixtures, FIELD_WIDTH } from "../fixture-types"

type Props = {
  tokens?: string[]
  value?: string
  placeholder?: string
  valueHelp?: boolean
  valueState?: ValueState
  disabled?: boolean
  readOnly?: boolean
  width?: string
}
const states = ["negative", "critical", "positive", "information"] as const
export const TWO = ["Argentina", "Brazil"]
export const MANY = ["Argentina", "Brazil", "Canada", "Denmark", "Estonia"]

export default defineFixtures<Props>({
  name: "multi-input",
  cases: [
    { id: "multi-input-empty", props: { placeholder: "Enter countries" } },
    { id: "multi-input-value-help", props: { placeholder: "Enter countries", valueHelp: true } },
    { id: "multi-input-tokens", props: { tokens: TWO, width: "20rem" } },
    { id: "multi-input-tokens-value-help", props: { tokens: TWO, valueHelp: true, width: "20rem" } },
    { id: "multi-input-n-more", props: { tokens: MANY, valueHelp: true } },
    ...states.map((valueState) => ({ id: `multi-input-${valueState}`, props: { tokens: TWO, valueHelp: true, valueState, width: "20rem" } })),
    { id: "multi-input-disabled", props: { tokens: MANY, valueHelp: true, disabled: true } },
    { id: "multi-input-readonly", props: { tokens: MANY, valueHelp: true, readOnly: true } },
  ],
  // Fixed-width cells; the field fills them (UI5: the host gets the width).
  react: ({ tokens = [], value, valueHelp, width = FIELD_WIDTH, ...p }) => (
    <div style={{ width }}>
      <MultiInput
        defaultValue={value}
        showValueHelpIcon={valueHelp}
        valueStateMessage={null}
        aria-label="Countries"
        tokens={tokens.map((t) => <Token key={t} text={t} />)}
        {...p}
      />
    </div>
  ),
})
