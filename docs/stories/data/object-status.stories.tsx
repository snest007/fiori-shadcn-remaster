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


// Current defaults are read from registry/ui/object-status.tsx and its shared calendar/input/clock primitives.
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
