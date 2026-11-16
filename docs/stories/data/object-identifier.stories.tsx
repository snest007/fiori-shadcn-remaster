import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { ObjectIdentifier, ObjectAttribute } from "@/components/ui/object-identifier"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"

const base = fioriMeta({ name: "object-identifier", component: ObjectIdentifier })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: S2DocsPage } },
  args: { title: "Robot Arm Series 9", text: "PO-48865", titleActive: false, onTitlePress: fn() },
  argTypes: { ...base.argTypes, title: { control: "text" }, text: { control: "text" }, titleActive: { control: "boolean" }, titleHref: { control: "text" }, titleLevel: { control: "select", options: [undefined, "H1", "H2", "H3", "H4", "H5", "H6"] }, onTitlePress: { control: false } },
  render: (args) => {
    const titleDepth = Number(args.titleLevel?.slice(1) ?? 0)
    // A deep heading belongs in an existing document hierarchy. Keep every
    // titleLevel Control meaningful without asking the component to invent it.
    return <div className="grid gap-3">
      {titleDepth > 2 && <h2>Inventory</h2>}
      {titleDepth > 3 && <h3>Assembly systems</h3>}
      {titleDepth > 4 && <h4>Robot arms</h4>}
      {titleDepth > 5 && <h5>Precision assembly</h5>}
      <ObjectIdentifier {...args} />
    </div>
  },
} satisfies Meta<typeof ObjectIdentifier>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const TitleOnly: Story = { args: { text: undefined } }
export const TextOnly: Story = { args: { title: undefined } }
export const ActiveTitle: Story = { args: { titleActive: true } }
export const HeadingTitle: Story = { args: { titleLevel: "H2" } }
export const LongText: Story = { args: { title: "Robot Arm Series 9 — Precision Assembly for Industrial Manufacturing", text: "Purchase order PO-48865 · Robotech International" } }
export const RTL: Story = { globals: { dir: "rtl" } }
export const WithAttributes: Story = { render: () => <div className="grid gap-3"><ObjectIdentifier title="Robot Arm Series 9" text="PO-48865" /><ObjectAttribute title="Manufacturer" text="Robotech" /><ObjectAttribute title="Supplier" text="Robotech (234242343)" active onPress={fn()} /></div> }


// Current defaults are read from registry/ui/object-identifier.tsx and its shared calendar/input/clock primitives.
// UI5 keys come from the installed 2.28 English i18n defaults; non-identical wording is identified explicitly.
function S2DocsPage() {
  const textKeys = [
  {
    "prop": "title / text / ObjectAttribute.title / text",
    "text": "Provided by the application; no built-in text",
    "key": "Application text; no identical UI5 2.28 default"
  }
]
  return <><DocsPage /><section aria-label="Localization text keys"><h2>Localization text keys</h2><p>Override these props to translate built-in labels and announcements. English defaults below describe the current component API.</p><table><thead><tr><th>Text prop / key</th><th>UI5 reference key</th><th>English default</th></tr></thead><tbody>{textKeys.map((text) => <tr key={text.prop}><td><code>{text.prop}</code></td><td>{text.key}</td><td>{text.text}</td></tr>)}</tbody></table></section></>
}
