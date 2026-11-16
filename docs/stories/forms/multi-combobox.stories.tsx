import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { MultiComboBox, MultiComboBoxItem, MultiComboBoxItemGroup, type MultiComboBoxProps } from "@/components/ui/multi-combobox"
import { fioriMeta } from "../_lib/meta"
import { DocsPage } from "../_lib/DocsPage"

const groups = [{ title: "Americas", items: [{ text: "Argentina", code: "AR" }, { text: "Brazil", code: "BR" }, { text: "Canada", code: "CA" }] }, { title: "Europe", items: [{ text: "Denmark", code: "DK" }, { text: "Estonia", code: "EE" }, { text: "France", code: "FR" }] }]
type Args = MultiComboBoxProps & { grouped?: boolean; emptyItems?: boolean }
const base = fioriMeta({ name: "multi-combobox", component: MultiComboBox })
const meta = {
  ...base,
  args: { value: "", selectedValues: ["Argentina", "Brazil"], showSelectAll: false, noValidation: false, open: false, grouped: false, emptyItems: false, filter: "startsWithPerTerm", noTypeahead: false, valueState: "none", disabled: false, readOnly: false, required: false, placeholder: "Type or choose countries", "aria-label": "Delivery countries", onValueChange: fn(), onCommit: fn(), onSelectionChange: fn(), onOpenChange: fn() },
  argTypes: { ...base.argTypes, valueState: { control: "select", options: ["none", "negative", "critical", "positive", "information"] }, value: { control: "text" }, open: { control: "boolean" }, grouped: { control: "boolean", description: "Group the example countries by region." }, emptyItems: { control: "boolean", description: "Show a field without available items." }, filter: { control: "select", options: ["startsWithPerTerm", "startsWith", "contains", "none"] }, noTypeahead: { control: "boolean" }, disabled: { control: "boolean" }, readOnly: { control: "boolean" }, required: { control: "boolean" }, placeholder: { control: "text" }, valueStateMessage: { control: "text" }, arrowLabel: { control: "text" }, listLabel: { control: "text" }, dialogTitle: { control: "text" }, okText: { control: "text" }, cancelText: { control: "text" }, portal: { control: false, table: { disable: true } }, onValueChange: { control: false }, onCommit: { control: false }, onSelectionChange: { control: false }, onOpenChange: { control: false }, selectedValues: { control: "object" }, showSelectAll: { control: "boolean" }, noValidation: { control: "boolean" }, selectAllText: { control: false }, alreadySelectedText: { control: "text" }, invalidText: { control: "text" }, nMoreText: { control: false }, tokensCountText: { control: false }, showSelectedLabel: { control: "text" } },
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
    "arrowLabel",
    "SELECT_OPTIONS",
    "Select Options"
  ],
  [
    "listLabel",
    "COMBOBOX_AVAILABLE_OPTIONS",
    "Available Options"
  ],
  [
    "dialogTitle",
    "INPUT_SUGGESTIONS_TITLE",
    "All Items"
  ],
  [
    "okText",
    "MULTICOMBOBOX_DIALOG_OK_BUTTON",
    "OK"
  ],
  [
    "cancelText",
    "MULTICOMBOBOX_DIALOG_CANCEL_BUTTON",
    "Cancel"
  ],
  [
    "selectAllText",
    "MCB_SELECTED_ITEMS",
    "Select All ({0} of {1})"
  ],
  [
    "alreadySelectedText",
    "VALUE_STATE_ERROR_ALREADY_SELECTED",
    "This value is already selected."
  ],
  [
    "invalidText",
    "VALUE_STATE_ERROR",
    "Invalid entry"
  ],
  [
    "showSelectedLabel",
    "SHOW_SELECTED_BUTTON",
    "Show Selected Items Only"
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
  ]
] as const
  return <><DocsPage /><section aria-label="Localization text keys" className="sbdocs-content"><h2>Localization text keys</h2><p>Override these public text props in your application; CustomTexts demonstrates the supported API. Existing label props remain available.</p><table><thead><tr><th>Prop / key</th><th>UI5 key or source</th><th>English component default</th></tr></thead><tbody>{textKeys.map(([prop, key, value]) => <tr key={prop}><td><code>{prop}</code></td><td>{key}</td><td>{value}</td></tr>)}</tbody></table></section></>
}, story: { inline: false, height: "540px" } } },
  render: function DeliveryCountries(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const { grouped, emptyItems, ...props } = args
    return <div className="w-full max-w-md"><MultiComboBox {...props}
      onValueChange={(value) => { args.onValueChange?.(value); updateArgs({ value }) }}
      onOpenChange={(open) => { args.onOpenChange?.(open); updateArgs({ open }) }}
      onSelectionChange={(selectedValues) => { args.onSelectionChange?.(selectedValues); updateArgs({ selectedValues }) }}
      >
      {!emptyItems && (grouped ? groups.map((region) => <MultiComboBoxItemGroup key={region.title} headerText={region.title}>{region.items.map((country) => <MultiComboBoxItem key={country.code} text={country.text} additionalText={country.code} />)}</MultiComboBoxItemGroup>) : groups.flatMap((region) => region.items).map((country) => <MultiComboBoxItem key={country.code} text={country.text} additionalText={country.code} />))}
    </MultiComboBox></div>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const None: Story = { args: { valueState: "none" } }
export const Negative: Story = { args: { valueState: "negative" } }
export const Critical: Story = { args: { valueState: "critical" } }
export const Positive: Story = { args: { valueState: "positive" } }
export const Information: Story = { args: { valueState: "information" } }
export const Empty: Story = { args: { value: "", selectedValues: [] } }
export const WithoutItems: Story = { args: { emptyItems: true } }
export const Disabled: Story = { args: { disabled: true } }
export const ReadOnly: Story = { args: { readOnly: true } }
export const Required: Story = { args: { required: true } }
export const Open: Story = { args: { open: true }, parameters: { docs: { story: { inline: false, height: "440px" } } } }
export const ItemGroups: Story = { args: { grouped: true, open: true }, parameters: { docs: { story: { inline: false, height: "480px" } } } }
export const StartsWith: Story = { args: { filter: "startsWith", value: "" } }
export const Contains: Story = { args: { filter: "contains", noTypeahead: true, value: "" } }
export const NoFiltering: Story = { args: { filter: "none", noTypeahead: true } }
export const NoTypeahead: Story = { args: { noTypeahead: true } }
export const RTL: Story = { globals: { dir: "rtl" } }
export const Overflow: Story = { args: { selectedValues: ["Argentina", "Brazil", "Canada", "Denmark", "Estonia"] }, decorators: [(Story) => <div className="max-w-xs"><Story /></div>] }
export const SelectAll: Story = { args: { open: true, showSelectAll: true }, parameters: { docs: { story: { inline: false, height: "480px" } } } }
export const GroupedSelectAll: Story = { args: { open: true, showSelectAll: true, grouped: true }, parameters: { docs: { story: { inline: false, height: "540px" } } } }
export const NoValidation: Story = { args: { noValidation: true, value: "Custom delivery destination" } }
export const CustomTexts: Story = { args: { arrowLabel: "Choose delivery countries", listLabel: "Delivery destinations", showSelectAll: true, selectAllText: (selected, total) => `All destinations (${selected} of ${total})`, alreadySelectedText: "This destination is already included.", invalidText: "Choose a country from the delivery list.", tokensCountText: (count) => `${count} delivery destinations`, nMoreText: (count) => `${count} more destinations`, dialogTitle: "Delivery destinations", okText: "Use countries", cancelText: "Keep previous countries", showSelectedLabel: "Show chosen destinations" } }
