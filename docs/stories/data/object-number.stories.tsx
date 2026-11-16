import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { ObjectNumber } from "@/components/ui/object-number"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"

const base = fioriMeta({ name: "object-number", component: ObjectNumber })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: S2DocsPage } },
  args: { number: "379.99", unit: "USD", state: "none", emphasized: true, inverted: false, large: false, active: false, onClick: fn() },
  argTypes: { ...base.argTypes, number: { control: "text" }, unit: { control: "text" }, state: { control: "select", options: ["none", "negative", "critical", "positive", "information"] }, emphasized: { control: "boolean" }, inverted: { control: "boolean" }, large: { control: "boolean" }, active: { control: "boolean" }, textAlign: { control: "inline-radio", options: ["start", "end", "center"] }, stateAnnouncementText: { control: "text" }, onClick: { control: false } },
  render: (args) => <ObjectNumber {...args} />,
} satisfies Meta<typeof ObjectNumber>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const None: Story = { args: { state: "none" } }
export const Negative: Story = { args: { state: "negative" } }
export const Critical: Story = { args: { state: "critical" } }
export const Positive: Story = { args: { state: "positive" } }
export const Information: Story = { args: { state: "information" } }
export const NotEmphasized: Story = { args: { emphasized: false } }
export const WithoutUnit: Story = { args: { unit: undefined } }
export const Inverted: Story = { args: { inverted: true, state: "positive" } }
export const Large: Story = { args: { large: true } }
export const Active: Story = { args: { active: true } }
export const AlignedEnd: Story = { args: { textAlign: "end" }, parameters: { layout: "padded" } }
export const CustomTexts: Story = { args: { state: "critical", stateAnnouncementText: "Budget requires review" } }
export const RTL: Story = { globals: { dir: "rtl" } }
export const FormattedAmount: Story = { render: () => <ObjectNumber number={new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(12897)} unit="EUR" emphasized={false} /> }


// Current defaults are read from registry/ui/object-number.tsx and its shared calendar/input/clock primitives.
// UI5 keys come from the installed 2.28 English i18n defaults; non-identical wording is identified explicitly.
function S2DocsPage() {
  const textKeys = [
  {
    "prop": "stateAnnouncementText.negative",
    "text": "Error",
    "key": "TAG_ERROR"
  },
  {
    "prop": "stateAnnouncementText.critical",
    "text": "Warning",
    "key": "TAG_WARNING, BUTTON_ARIA_TYPE_ATTENTION"
  },
  {
    "prop": "stateAnnouncementText.positive",
    "text": "Success",
    "key": "TAG_SUCCESS"
  },
  {
    "prop": "stateAnnouncementText.information",
    "text": "Information",
    "key": "TAG_INFORMATION"
  }
]
  return <><DocsPage /><section aria-label="Localization text keys"><h2>Localization text keys</h2><p>Override these props to translate built-in labels and announcements. English defaults below describe the current component API.</p><table><thead><tr><th>Text prop / key</th><th>UI5 reference key</th><th>English default</th></tr></thead><tbody>{textKeys.map((text) => <tr key={text.prop}><td><code>{text.prop}</code></td><td>{text.key}</td><td>{text.text}</td></tr>)}</tbody></table></section></>
}
