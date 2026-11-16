import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { error, sysEnter2 } from "@/lib/fiori-icons"
import { ObjectStatus } from "@/components/ui/object-status"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"

const base = fioriMeta({ name: "object-status", component: ObjectStatus })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: S2DocsPage } },
  args: { title: "Status", text: "Delivered", state: "none", inverted: false, large: false, active: false, onClick: fn() },
  argTypes: { ...base.argTypes, title: { control: "text" }, text: { control: "text" }, state: { control: "select", options: ["none", "negative", "critical", "positive", "information", "indication1", "indication2", "indication3", "indication4", "indication5", "indication6", "indication7", "indication8", "indication9", "indication10"] }, inverted: { control: "boolean" }, large: { control: "boolean" }, active: { control: "boolean" }, stateAnnouncementText: { control: "text" }, iconLabel: { control: "text" }, icon: { control: false }, onClick: { control: false } },
  render: (args) => <ObjectStatus {...args} />,
} satisfies Meta<typeof ObjectStatus>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const None: Story = { args: { state: "none" } }
export const Negative: Story = { args: { state: "negative" } }
export const Critical: Story = { args: { state: "critical" } }
export const Positive: Story = { args: { state: "positive" } }
export const Information: Story = { args: { state: "information" } }
export const Indication1: Story = { args: { state: "indication1", text: "Delivery stage 1" } }
export const Indication2: Story = { args: { state: "indication2", text: "Delivery stage 2" } }
export const Indication3: Story = { args: { state: "indication3", text: "Delivery stage 3" } }
export const Indication4: Story = { args: { state: "indication4", text: "Delivery stage 4" } }
export const Indication5: Story = { args: { state: "indication5", text: "Delivery stage 5" } }
export const Indication6: Story = { args: { state: "indication6", text: "Delivery stage 6" } }
export const Indication7: Story = { args: { state: "indication7", text: "Delivery stage 7" } }
export const Indication8: Story = { args: { state: "indication8", text: "Delivery stage 8" } }
export const Indication9: Story = { args: { state: "indication9", text: "Delivery stage 9" } }
export const Indication10: Story = { args: { state: "indication10", text: "Delivery stage 10" } }
export const Inverted: Story = { args: { inverted: true, state: "positive" } }
export const Large: Story = { args: { large: true, state: "positive" } }
export const Active: Story = { args: { active: true, text: "3 issues", state: "negative" } }
export const WithIcon: Story = { args: { icon: sysEnter2, state: "positive" } }
export const IconOnly: Story = { args: { title: undefined, text: undefined, icon: sysEnter2, iconLabel: "Delivered", state: "positive" } }
export const InvertedWithIcon: Story = { args: { inverted: true, icon: error, state: "negative", text: "Blocked" } }
export const LongText: Story = { args: { text: "Shipment is delayed while awaiting customs clearance" } }
export const CustomTexts: Story = { args: { state: "critical", text: "Review needed", stateAnnouncementText: "Delivery requires review" } }
export const RTL: Story = { globals: { dir: "rtl" } }


// No UI5 Web Component exists for this display. Installed OpenUI5 1.154 is the reference.
// ObjectStatus._getStateText delegates to sap.ui.core.ValueStateSupport / IndicationColorSupport.
// The current port retains its shorter inherited announcement defaults, shown separately below.
function S2DocsPage() {
  const textKeys = [
  {
    "state": "negative",
    "text": "Error",
    "key": "VALUE_STATE_ERROR",
    "nativeText": "Invalid entry"
  },
  {
    "state": "critical",
    "text": "Warning",
    "key": "VALUE_STATE_WARNING",
    "nativeText": "Warning issued"
  },
  {
    "state": "positive",
    "text": "Success",
    "key": "VALUE_STATE_SUCCESS",
    "nativeText": "Entry successfully validated"
  },
  {
    "state": "information",
    "text": "Information",
    "key": "VALUE_STATE_INFORMATION",
    "nativeText": "Informative entry"
  },
  {
    "state": "indication1",
    "text": "No default announcement",
    "key": "INDICATION_STATE_INDICATION01",
    "nativeText": "Indication Color 1"
  },
  {
    "state": "indication2",
    "text": "No default announcement",
    "key": "INDICATION_STATE_INDICATION02",
    "nativeText": "Indication Color 2"
  },
  {
    "state": "indication3",
    "text": "No default announcement",
    "key": "INDICATION_STATE_INDICATION03",
    "nativeText": "Indication Color 3"
  },
  {
    "state": "indication4",
    "text": "No default announcement",
    "key": "INDICATION_STATE_INDICATION04",
    "nativeText": "Indication Color 4"
  },
  {
    "state": "indication5",
    "text": "No default announcement",
    "key": "INDICATION_STATE_INDICATION05",
    "nativeText": "Indication Color 5"
  },
  {
    "state": "indication6",
    "text": "No default announcement",
    "key": "INDICATION_STATE_INDICATION06",
    "nativeText": "Indication Color 6"
  },
  {
    "state": "indication7",
    "text": "No default announcement",
    "key": "INDICATION_STATE_INDICATION07",
    "nativeText": "Indication Color 7"
  },
  {
    "state": "indication8",
    "text": "No default announcement",
    "key": "INDICATION_STATE_INDICATION08",
    "nativeText": "Indication Color 8"
  },
  {
    "state": "indication9",
    "text": "No default announcement",
    "key": "INDICATION_STATE_INDICATION09",
    "nativeText": "Indication Color 9"
  },
  {
    "state": "indication10",
    "text": "No default announcement",
    "key": "INDICATION_STATE_INDICATION10",
    "nativeText": "Indication Color 10"
  }
]
  return <><DocsPage /><section aria-label="Localization text keys"><h2>Localization text keys</h2><p>stateAnnouncementText is a single string overriding the hidden announcement for the current state; pass null to omit it. The inherited defaults in this port differ from the owning OpenUI5 defaults shown below. Indication states currently have no built-in announcement; supply stateAnnouncementText for them.</p><table><thead><tr><th>State for stateAnnouncementText</th><th>Current English default</th><th>OpenUI5 reference key</th><th>OpenUI5 English default</th></tr></thead><tbody>{textKeys.map((text) => <tr key={text.state}><td><code>{text.state}</code></td><td>{text.text}</td><td>{text.key}</td><td>{text.nativeText}</td></tr>)}</tbody></table></section></>
}
