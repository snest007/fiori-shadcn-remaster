import { Token } from "@/components/ui/token"
import { Tokenizer } from "@/components/ui/tokenizer"

import { defineFixtures } from "../fixture-types"

type Props = { tokens: string[]; width?: string; selected?: string[]; readOnly?: boolean; disabled?: boolean }
export const TOKENS = ["Argentina", "Bulgaria", "Canada", "Denmark", "Estonia"]

export default defineFixtures<Props>({
  name: "tokenizer",
  cases: [
    { id: "tokenizer", props: { tokens: TOKENS.slice(0, 3) } },
    { id: "tokenizer-selected", props: { tokens: TOKENS.slice(0, 3), selected: ["Bulgaria"] } },
    { id: "tokenizer-n-more", props: { tokens: TOKENS, width: "15rem" } },
    { id: "tokenizer-n-more-readonly", props: { tokens: TOKENS, width: "15rem", readOnly: true } },
    { id: "tokenizer-n-more-disabled", props: { tokens: TOKENS, width: "15rem", disabled: true } },
    { id: "tokenizer-all-hidden", props: { tokens: ["A very long token text", "Second token"], width: "8rem" } },
  ],
  react: ({ tokens, width, selected = [], readOnly, disabled }) => (
    <Tokenizer readOnly={readOnly} disabled={disabled} aria-label="Countries" style={width ? { width } : undefined}>
      {tokens.map((t) => <Token key={t} text={t} defaultSelected={selected.includes(t)} />)}
    </Tokenizer>
  ),
})
