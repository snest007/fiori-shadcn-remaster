import { Token } from "@/components/ui/token"
import { Tokenizer } from "@/components/ui/tokenizer"

import { defineFixtures } from "../fixture-types"

type Props = { selected?: boolean; readOnly?: boolean; disabled?: boolean }

// Each token sits in a one-token Tokenizer on both sides (UI5's ui5-token is only styled inside a
// ui5-tokenizer: readonly/disabled come from the tokenizer, and a lone token gets no end margin).
export default defineFixtures<Props>({
  name: "token",
  cases: [
    { id: "token", props: {} },
    { id: "token-selected", props: { selected: true } },
    { id: "token-readonly", props: { readOnly: true } },
    { id: "token-readonly-selected", props: { readOnly: true, selected: true } },
    { id: "token-disabled", props: { disabled: true } },
  ],
  react: ({ selected, readOnly, disabled }) => (
    <Tokenizer readOnly={readOnly} disabled={disabled} aria-label="Token">
      <Token text="Andorra" defaultSelected={selected} />
    </Tokenizer>
  ),
})
