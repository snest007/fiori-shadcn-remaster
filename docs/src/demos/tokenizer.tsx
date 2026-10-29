import * as React from "react"

import { Token } from "@/components/ui/token"
import { Tokenizer } from "@/components/ui/tokenizer"

import { defineDemo } from "./types"

const INITIAL = ["Argentina", "Bulgaria", "Canada", "Denmark", "Estonia", "Finland", "Greece"]

function TokenizerDemo() {
  const [tokens, setTokens] = React.useState(INITIAL)
  const [selected, setSelected] = React.useState<string[]>([])
  return (
    <>
      <div className="flex flex-col gap-3">
        {/* A token is an option, so standalone tokens need a listbox around them too. */}
        <div id="tokenizer-demo-single" role="listbox" aria-label="Standalone tokens" className="flex gap-2">
          <Token text="Standalone" tabIndex={0} />
          <Token text="Selected" defaultSelected />
          <Token text="Read only" readOnly />
        </div>
        <Tokenizer
          id="tokenizer-demo"
          aria-label="Countries"
          className="w-80 rounded-(--sapField_BorderCornerRadius) border border-(--sapField_BorderColor)"
          onTokenDelete={(values) => setTokens((t) => t.filter((x) => !values.includes(x)))}
          onSelectionChange={setSelected}
        >
          {tokens.map((t) => <Token key={t} text={t} />)}
        </Tokenizer>
        <button
          type="button"
          className="w-fit text-(--sapLinkColor) underline"
          onClick={() => setTokens(INITIAL)}
        >
          Reset tokens
        </button>
      </div>
      <p className="mt-4 text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        Tokens are a listbox with one tab stop: ←/→ and Home/End move, Space toggles, Shift+arrows extend, Ctrl+A selects all,
        Backspace/Delete remove the selection (or the focused token) and move focus to a neighbour, Ctrl+I opens the list of all
        tokens. Unfocused, the overflow collapses into "n more". Selected:{" "}
        <span data-testid="tokenizer-selected">{selected.join(", ") || "—"}</span> · Tokens:{" "}
        <span data-testid="tokenizer-count">{tokens.length}</span>
      </p>
    </>
  )
}

export default defineDemo({ title: "Token, Tokenizer", order: 36, Demo: TokenizerDemo })
