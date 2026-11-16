import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Token, type TokenProps } from "@/components/ui/token"
import { Tokenizer } from "@/components/ui/tokenizer"
import { Button } from "@/components/ui/button"
import { fioriMeta } from "../_lib/meta"
import { DocsPage } from "../_lib/DocsPage"

type Args = TokenProps & { disabled?: boolean }
const base = fioriMeta({ name: "token", component: Token })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: function ComponentDocs() {
  const textKeys = [
  [
    "deleteLabel",
    "TOKEN_ARIA_DELETE",
    "Delete"
  ],
  [
    "description (readOnly)",
    "TOKEN_ARIA_LABEL",
    "Token"
  ],
  [
    "description (editable)",
    "TOKEN_ARIA_LABEL + TOKEN_ARIA_DELETABLE",
    "Token Deletable"
  ]
] as const
  return <><DocsPage /><section aria-label="Localization text keys" className="sbdocs-content"><h2>Localization text keys</h2><p>Override these public text props in your application; CustomTexts demonstrates the supported API. Existing label props remain available.</p><table><thead><tr><th>Prop / key</th><th>UI5 key or source</th><th>English component default</th></tr></thead><tbody>{textKeys.map(([prop, key, value]) => <tr key={prop}><td><code>{prop}</code></td><td>{key}</td><td>{value}</td></tr>)}</tbody></table></section></>
} } },
  args: { text: "Germany", value: "DE", selected: false, readOnly: false, disabled: false, onSelectedChange: fn(), onDelete: fn() },
  argTypes: { ...base.argTypes, text: { control: "text" }, value: { control: "text" }, selected: { control: "boolean" }, readOnly: { control: "boolean" }, disabled: { control: "boolean", description: "Show the token in a disabled Tokenizer, as in UI5." }, deleteLabel: { control: "text" }, description: { control: "text" }, tabIndex: { control: false, table: { disable: true } }, onSelectedChange: { control: false }, onDelete: { control: false } },
  render: function CountryToken(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const [removed, setRemoved] = React.useState(false)
    const { disabled, ...props } = args
    return <div className="flex items-center gap-3">{disabled
      ? <Tokenizer aria-label="Delivery countries" disabled><Token {...props} /></Tokenizer>
      : <div role="listbox" aria-label="Delivery countries" className="flex">{!removed && <Token {...props} tabIndex={0} onSelectedChange={(selected) => { args.onSelectedChange?.(selected); updateArgs({ selected }) }} onDelete={(via) => { args.onDelete?.(via); setRemoved(true) }} />}</div>}
      {removed && <Button onClick={() => setRemoved(false)}>Restore country</Button>}
    </div>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Selected: Story = { args: { selected: true } }
export const ReadOnly: Story = { args: { readOnly: true } }
export const ReadOnlySelected: Story = { args: { readOnly: true, selected: true } }
export const Disabled: Story = { args: { disabled: true } }
export const LongText: Story = { args: { text: "Northwind International Procurement Services" }, decorators: [(Story) => <div className="max-w-xs"><Story /></div>] }
export const CustomTexts: Story = { args: { deleteLabel: "Remove delivery country", description: "Delivery country. Press Delete to remove it." } }
export const RTL: Story = { globals: { dir: "rtl" } }

export const NativeTextOverrides: Story = { args: { texts: { token: "Attachment", deletable: "Can be removed", deleteLabel: "Remove attachment" } } }
