import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Tokenizer, type TokenizerProps } from "@/components/ui/tokenizer"
import { Token } from "@/components/ui/token"
import { fioriMeta } from "../_lib/meta"
import { DocsPage } from "../_lib/DocsPage"

type Args = TokenizerProps & { tokenTexts: string[]; selectedValues?: string[] }
const initial = ["Argentina", "Bulgaria", "Canada", "Denmark", "Estonia"]
const base = fioriMeta({ name: "tokenizer", component: Tokenizer })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: function ComponentDocs() {
  const textKeys = [
  [
    "aria-label",
    "TOKENIZER_ARIA_LABEL",
    "Tokenizer"
  ],
  [
    "deleteLabel",
    "TOKEN_ARIA_DELETE",
    "Delete"
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
  ]
] as const
  return <><DocsPage /><section aria-label="Localization text keys" className="sbdocs-content"><h2>Localization text keys</h2><p>Override these public text props in your application; CustomTexts demonstrates the supported API. Existing label props remain available.</p><table><thead><tr><th>Prop / key</th><th>UI5 key or source</th><th>English component default</th></tr></thead><tbody>{textKeys.map(([prop, key, value]) => <tr key={prop}><td><code>{prop}</code></td><td>{key}</td><td>{value}</td></tr>)}</tbody></table></section></>
}, story: { inline: false, height: "440px" } } },
  args: { tokenTexts: initial.slice(0, 3), selectedValues: [], readOnly: false, disabled: false, expanded: false, "aria-label": "Delivery countries", onTokenDelete: fn(), onSelectionChange: fn(), onPopoverOpenChange: fn() },
  argTypes: { ...base.argTypes,
    tokenTexts: { control: "object", description: "Country tokens managed by this example." }, selectedValues: { control: "object", description: "Initial selected country tokens; editing this value restarts the example's selection." }, readOnly: { control: "boolean" }, disabled: { control: "boolean" }, expanded: { control: "boolean" }, preventInitialFocus: { control: "boolean" }, hidePopoverArrow: { control: "boolean" }, nMoreText: { control: false }, deleteLabel: { control: "text" }, onTokenDelete: { control: false }, onSelectionChange: { control: false }, onPopoverOpenChange: { control: false }, onFocusExhausted: { control: false }, onShowAll: { control: false }, popoverAnchor: { control: false, table: { disable: true } }, handleRef: { control: false, table: { disable: true } }, contentClassName: { control: false, table: { disable: true } },
  },
  render: function DeliveryCountryList(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const { tokenTexts, selectedValues = [], ...props } = args
    return <div className="w-full max-w-lg"><Tokenizer {...props} key={selectedValues.join("|")} onTokenDelete={(values) => { args.onTokenDelete?.(values); updateArgs({ tokenTexts: tokenTexts.filter((text) => !values.includes(text)) }) }}>{tokenTexts.map((text) => <Token key={text} text={text} defaultSelected={selectedValues.includes(text)} />)}</Tokenizer></div>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Selected: Story = { args: { selectedValues: ["Bulgaria"] } }
export const Empty: Story = { args: { tokenTexts: [] } }
export const SingleToken: Story = { args: { tokenTexts: ["Argentina"] } }
export const ReadOnly: Story = { args: { readOnly: true } }
export const Disabled: Story = { args: { disabled: true } }
export const Overflow: Story = { args: { tokenTexts: initial }, decorators: [(Story) => <div className="max-w-xs"><Story /></div>] }
export const Open: Story = { args: { tokenTexts: initial }, render: function OpenCountryOverflow(args: Args) {
  const { tokenTexts, selectedValues = [], ...props } = args
  const [texts, setTexts] = React.useState(tokenTexts)
  const root = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const element = root.current
    if (!element) return
    // The overflow indicator appears after Tokenizer's real size measurement.
    const open = () => {
      const indicator = element.querySelector<HTMLElement>(".fiori-tokenizer__more")
      if (!indicator) return
      observer.disconnect()
      indicator.click()
    }
    const observer = new MutationObserver(open)
    observer.observe(element, { childList: true, subtree: true })
    open()
    return () => observer.disconnect()
  }, [])
  return <div ref={root} className="max-w-xs"><Tokenizer {...props} onTokenDelete={(values) => { args.onTokenDelete?.(values); setTexts((current) => current.filter((text) => !values.includes(text))) }}>{texts.map((text) => <Token key={text} text={text} defaultSelected={selectedValues.includes(text)} />)}</Tokenizer></div>
} }
export const OverflowReadOnly: Story = { args: { tokenTexts: initial, readOnly: true }, decorators: [(Story) => <div className="max-w-xs"><Story /></div>] }
export const OverflowDisabled: Story = { args: { tokenTexts: initial, disabled: true }, decorators: [(Story) => <div className="max-w-xs"><Story /></div>] }
export const AllHidden: Story = { args: { tokenTexts: ["Northwind International Procurement Services", "Second delivery destination"] }, decorators: [(Story) => <div className="max-w-32"><Story /></div>] }
export const Expanded: Story = { args: { tokenTexts: initial, expanded: true }, decorators: [(Story) => <div className="max-w-xs"><Story /></div>] }
export const CustomTexts: Story = { args: { tokenTexts: initial, nMoreText: (count, allHidden) => `${count} ${allHidden ? "delivery countries" : "more countries"}`, deleteLabel: "Remove delivery country" }, decorators: [(Story) => <div className="max-w-xs"><Story /></div>] }
export const RTL: Story = { globals: { dir: "rtl" } }
