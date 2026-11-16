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


// No UI5 Web Component exists for this display. Installed OpenUI5 1.154 is the reference.
// ObjectNumber._getStateText uses the sap.m OBJECTNUMBER_ARIA_VALUE_STATE_* keys.
// The current port retains its shorter inherited announcement defaults, shown separately below.
function S2DocsPage() {
  const textKeys = [
  {
    "state": "negative",
    "text": "Error",
    "key": "OBJECTNUMBER_ARIA_VALUE_STATE_ERROR",
    "nativeText": "Value State Error"
  },
  {
    "state": "critical",
    "text": "Warning",
    "key": "OBJECTNUMBER_ARIA_VALUE_STATE_WARNING",
    "nativeText": "Value State Warning"
  },
  {
    "state": "positive",
    "text": "Success",
    "key": "OBJECTNUMBER_ARIA_VALUE_STATE_SUCCESS",
    "nativeText": "Value State Success"
  },
  {
    "state": "information",
    "text": "Information",
    "key": "OBJECTNUMBER_ARIA_VALUE_STATE_INFORMATION",
    "nativeText": "Value State Information"
  }
]
  return <><DocsPage /><section aria-label="Localization text keys"><h2>Localization text keys</h2><p>stateAnnouncementText is a single string overriding the hidden announcement for the current state; pass null to omit it. The inherited defaults in this port differ from the owning OpenUI5 defaults shown below.</p><table><thead><tr><th>State for stateAnnouncementText</th><th>Current English default</th><th>OpenUI5 reference key</th><th>OpenUI5 English default</th></tr></thead><tbody>{textKeys.map((text) => <tr key={text.state}><td><code>{text.state}</code></td><td>{text.text}</td><td>{text.key}</td><td>{text.nativeText}</td></tr>)}</tbody></table></section></>
}
