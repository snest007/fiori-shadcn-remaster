import * as React from "react"

import { Label } from "@/components/ui/label"
import { MultiInput, SuggestionItem } from "@/components/ui/multi-input"
import { Token } from "@/components/ui/token"

import { defineDemo } from "./types"

const COUNTRIES = ["Argentina", "Australia", "Austria", "Belgium", "Brazil", "Bulgaria", "Canada", "China", "France", "Germany", "India", "Italy", "Japan"]

function MultiInputDemo() {
  const [tokens, setTokens] = React.useState(["Germany", "France"])
  const [value, setValue] = React.useState("")
  const [helps, setHelps] = React.useState(0)
  const add = (text: string) => {
    const t = text.trim()
    if (t && !tokens.includes(t)) setTokens([...tokens, t])
    setValue("")
  }
  return (
    <>
      <div className="grid max-w-lg grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
        <Label htmlFor="multi-input-countries" showColon>Countries</Label>
        <MultiInput
          id="multi-input-countries"
          value={value}
          onValueChange={setValue}
          onCommit={add}
          filter="startsWithPerTerm"
          showValueHelpIcon
          onValueHelpTrigger={() => setHelps((n) => n + 1)}
          onTokenDelete={(values) => setTokens((t) => t.filter((x) => !values.includes(x)))}
          placeholder="Type and press Enter"
          tokens={tokens.map((t) => <Token key={t} text={t} />)}
        >
          {COUNTRIES.filter((c) => !tokens.includes(c)).map((c) => <SuggestionItem key={c} text={c} />)}
        </MultiInput>
        <Label htmlFor="multi-input-readonly" showColon>Read only</Label>
        <MultiInput id="multi-input-readonly" readOnly tokens={["SAP SE", "SAP Labs"].map((t) => <Token key={t} text={t} />)} />
      </div>
      <p className="mt-4 text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        Enter or leaving the field turns the text into a token; ↑/↓ walk the suggestions. Backspace in the empty field, ← at its start
        or Home move into the tokens. F4 / Alt+↓ or the icon open value help (pressed{" "}
        <span data-testid="multi-input-value-help-count">{helps}</span>×). Tokens:{" "}
        <span data-testid="multi-input-tokens">{tokens.join(", ") || "—"}</span>
      </p>
    </>
  )
}

export default defineDemo({ title: "MultiInput", order: 37, Demo: MultiInputDemo })
