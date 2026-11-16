import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { MultiInput, SuggestionItem, type MultiInputProps } from "@/components/ui/multi-input"
import { Token } from "@/components/ui/token"
import { fioriMeta } from "../_lib/meta"
import { DocsPage } from "../_lib/DocsPage"

type Args = MultiInputProps & { tokenTexts: string[]; suggestions?: boolean; initialSuggestionsOpen?: boolean }
const countries = ["Argentina", "Australia", "Austria", "Belgium", "Brazil", "Bulgaria", "Canada", "China", "France", "Germany", "Japan"]
const base = fioriMeta({ name: "multi-input", component: MultiInput })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: function ComponentDocs() {
  const textKeys = [
  [
    "valueStateMessage (negative)",
    "VALUE_STATE_ERROR",
    "Invalid entry"
  ],
  [
    "valueStateMessage (critical)",
    "VALUE_STATE_WARNING",
    "Warning issued"
  ],
  [
    "valueStateMessage (positive)",
    "VALUE_STATE_SUCCESS",
    "Entry successfully validated"
  ],
  [
    "valueStateMessage (information)",
    "VALUE_STATE_INFORMATION",
    "Informative entry"
  ],
  [
    "nMoreText (some visible)",
    "MULTIINPUT_SHOW_MORE_TOKENS",
    "{0} more"
  ],
  [
    "nMoreText (all hidden)",
    "TOKENIZER_SHOW_ALL_ITEMS",
    "{0} Items"
  ],
  [
    "tokensCountText (0)",
    "TOKENIZER_ARIA_CONTAIN_TOKEN",
    "No Tokens"
  ],
  [
    "tokensCountText (1)",
    "TOKENIZER_ARIA_CONTAIN_ONE_TOKEN",
    "Contains 1 token"
  ],
  [
    "tokensCountText (several)",
    "TOKENIZER_ARIA_CONTAIN_SEVERAL_TOKENS",
    "Contains {0} tokens"
  ],
  [
    "valueHelpLabel",
    "MULTIINPUT_VALUE_HELP_LABEL",
    "Show Value Help"
  ],
  [
    "roleDescription",
    "MULTIINPUT_ROLEDESCRIPTION_TEXT",
    "Multi Value Input"
  ],
  [
    "dialogTitle",
    "INPUT_SUGGESTIONS_TITLE",
    "All Items"
  ],
  [
    "okText",
    "INPUT_SUGGESTIONS_OK_BUTTON",
    "OK"
  ],
  [
    "cancelText",
    "INPUT_SUGGESTIONS_CANCEL_BUTTON",
    "Cancel"
  ],
  [
    "showTokensLabel",
    "MULTIINPUT_FILTER_BUTTON_LABEL",
    "Show selected tokens"
  ],
  [
    "tokenDeleteLabel",
    "TOKEN_ARIA_DELETE",
    "Delete"
  ],
  [
    "suggestionsLabel",
    "React popup listbox label extension (no direct UI5 text key)",
    "Suggestions"
  ]
] as const
  return <><DocsPage /><section aria-label="Localization text keys" className="sbdocs-content"><h2>Localization text keys</h2><p>Override these public text props in your application; CustomTexts demonstrates the supported API. Existing label props remain available.</p><table><thead><tr><th>Prop / key</th><th>UI5 key or source</th><th>English component default</th></tr></thead><tbody>{textKeys.map(([prop, key, value]) => <tr key={prop}><td><code>{prop}</code></td><td>{key}</td><td>{value}</td></tr>)}</tbody></table></section></>
}, story: { inline: false, height: "440px" } } },
  args: { value: "", tokenTexts: ["Germany", "France"], suggestions: true, showValueHelpIcon: false, filter: "startsWithPerTerm", noTypeahead: false, valueState: "none", disabled: false, readOnly: false, required: false, placeholder: "Type a country and press Enter", "aria-label": "Delivery countries", onValueChange: fn(), onCommit: fn(), onSuggestionSelect: fn(), onTokenDelete: fn(), onValueHelpTrigger: fn() },
  argTypes: { ...base.argTypes,
    initialSuggestionsOpen: { control: false, table: { disable: true } },
    value: { control: "text" }, tokenTexts: { control: "object", description: "Country tokens managed by this example." }, suggestions: { control: "boolean", description: "Offer country suggestions not already selected." }, showValueHelpIcon: { control: "boolean" }, filter: { control: "select", options: ["startsWithPerTerm", "startsWith", "contains", "none"] }, noTypeahead: { control: "boolean" }, valueState: { control: "select", options: ["none", "negative", "critical", "positive", "information"] }, disabled: { control: "boolean" }, readOnly: { control: "boolean" }, required: { control: "boolean" }, placeholder: { control: "text" }, valueStateMessage: { control: "text" },
    valueHelpLabel: { control: "text" }, roleDescription: { control: "text" }, nMoreText: { control: false }, tokensCountText: { control: false }, dialogTitle: { control: "text" }, okText: { control: "text" }, cancelText: { control: "text" }, showTokensLabel: { control: "text" }, tokenDeleteLabel: { control: "text" }, suggestionsLabel: { control: "text" }, tokens: { control: false, table: { disable: true } },
    onValueChange: { control: false }, onCommit: { control: false }, onSuggestionSelect: { control: false }, onTokenDelete: { control: false }, onValueHelpTrigger: { control: false },
  },
  render: function DeliveryTokens(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const { tokenTexts, suggestions, initialSuggestionsOpen, ...props } = args
    const root = React.useRef<HTMLDivElement>(null)
    React.useEffect(() => {
      const input = root.current?.querySelector<HTMLInputElement>('input[role="combobox"]')
      if (!initialSuggestionsOpen || !input) return
      // Use the component's real typing path to display its suggestions.
      input.focus()
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "Ja")
      input.dispatchEvent(new InputEvent("input", { bubbles: true }))
    }, [initialSuggestionsOpen])
    const add = (value: string) => {
      args.onCommit?.(value)
      const text = value.trim()
      updateArgs({ value: "", tokenTexts: text && !tokenTexts.includes(text) ? [...tokenTexts, text] : tokenTexts })
    }
    return <div ref={root} className="w-full max-w-lg"><MultiInput {...props}
      tokens={tokenTexts.map((text) => <Token key={text} text={text} />)}
      onValueChange={(value) => { args.onValueChange?.(value); updateArgs({ value }) }}
      onCommit={add}
      onTokenDelete={(values) => { args.onTokenDelete?.(values); updateArgs({ tokenTexts: tokenTexts.filter((text) => !values.includes(text)) }) }}>
      {suggestions && countries.filter((text) => !tokenTexts.includes(text)).map((text) => <SuggestionItem key={text} text={text} />)}
    </MultiInput></div>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>

// Storybook Controls update the inline docs store; its isolated IFrame does not forward args.
export const Playground: Story = { parameters: { docs: { story: { inline: true } } } }
export const Empty: Story = { args: { tokenTexts: [] } }
export const Tokens: Story = { args: { suggestions: false } }
export const ValueHelp: Story = { args: { tokenTexts: [], showValueHelpIcon: true } }
export const TokensAndValueHelp: Story = { args: { showValueHelpIcon: true } }
export const Suggestions: Story = { args: { tokenTexts: [], value: "", suggestions: true } }
export const Open: Story = { args: { tokenTexts: [], value: "", suggestions: true, initialSuggestionsOpen: true } }
export const None: Story = { args: { valueState: "none" } }
export const Negative: Story = { args: { valueState: "negative" } }
export const Critical: Story = { args: { valueState: "critical" } }
export const Positive: Story = { args: { valueState: "positive" } }
export const Information: Story = { args: { valueState: "information" } }
export const Overflow: Story = { args: { tokenTexts: ["Argentina", "Brazil", "Canada", "Denmark", "Estonia"], showValueHelpIcon: true }, decorators: [(Story) => <div className="max-w-xs"><Story /></div>] }
export const Disabled: Story = { args: { disabled: true, showValueHelpIcon: true } }
export const ReadOnly: Story = { args: { readOnly: true, showValueHelpIcon: true } }
export const Required: Story = { args: { required: true } }
export const CustomTexts: Story = { args: { showValueHelpIcon: true, valueHelpLabel: "Find delivery countries", roleDescription: "Delivery destination input", nMoreText: (count) => `${count} more destinations`, tokensCountText: (count) => `${count} chosen delivery countries`, dialogTitle: "Choose delivery countries", okText: "Use countries", cancelText: "Keep current countries", showTokensLabel: "Show selected destinations", tokenDeleteLabel: "Remove destination", suggestionsLabel: "Suggested delivery countries" } }
export const RTL: Story = { globals: { dir: "rtl" } }
