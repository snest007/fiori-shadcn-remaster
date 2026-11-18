import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Form, FormGroup, FormItem, type FormProps } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { TextArea } from "@/components/ui/textarea"
import { Text } from "@/components/ui/text"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Slider, RangeSlider } from "@/components/ui/slider"
import { RatingIndicator } from "@/components/ui/rating-indicator"
import { StepInput } from "@/components/ui/step-input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select"
import { ComboBox, ComboBoxItem } from "@/components/ui/combobox"
import { MultiComboBox, MultiComboBoxItem } from "@/components/ui/multi-combobox"
import { MultiInput, SuggestionItem } from "@/components/ui/multi-input"
import { Token } from "@/components/ui/token"
import { Tokenizer } from "@/components/ui/tokenizer"
import { FileUploader } from "@/components/ui/file-uploader"
import { ColorPalette, ColorPaletteItem } from "@/components/ui/color-palette"
import { ColorPicker } from "@/components/ui/color-picker"
import { DatePicker } from "@/components/ui/date-picker"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { Calendar } from "@/components/ui/calendar"
import { fioriMeta, docsLink } from "../_lib/meta"
import { ArgTypes, Controls, DocsContext, DocsStory, Primary, Title } from "@storybook/addon-docs/blocks"
import { Button } from "@/components/ui/button"

type Args = FormProps & { grouped?: boolean; allFieldTypes?: boolean }
const base = fioriMeta({ name: "form", component: Form })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: function ComponentDocs() {
  const textKeys = [
  [
    "accessibleName",
    "FORM_ACCESSIBLE_NAME",
    "Form"
  ],
  [
    "FormGroup.accessibleName",
    "FORM_GROUP_ACCESSIBLE_NAME",
    "Group {0}"
  ]
] as const
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().slice(1)
  const [copied, setCopied] = React.useState(false)
  // Story-local fallback: S0 DocsPage assumes every avoidWhen has a use array.
  // Form's application-owned submission warning intentionally has no alternative.
  const usage = {
  "summary": "Arrange related labels and fields for one record in responsive groups.",
  "useWhen": [
    "Let users inspect or edit related fields of one record in a consistent layout.",
    "Group fields by meaning and keep their labels aligned as available width changes.",
    "Use accessibleMode=\"edit\" for editable fields; the default display mode presents label-value pairs."
  ],
  "avoidWhen": [
    {
      "when": "Compare repeated records in rows rather than fields of one record.",
      "use": [
        "table",
        "data-table"
      ]
    },
    {
      "when": "Guide users through 3\u20138 steps: use Wizard within an existing page or Wizard Page for a complete creation page.",
      "use": [
        "wizard",
        "wizard-page"
      ]
    },
    {
      "when": "Submit or validate data automatically; provide caller-owned submission and validation."
    }
  ],
  "source": "ui5-apidoc"
}
  const accessibility = ["accessibleName or native aria-label/aria-labelledby names the form root when headerText is absent. Headers name their own form or region; FormGroup accessibleName names groups.", "Form does not add keyboard stops. Each edit FormItem keeps a Label htmlFor association or an explicitly named control; display mode uses definition-list semantics."]
  return <main><Title /><p>Fiori form (ui5-form): responsive label/field layout with columns per size range, labelSpan / emptySpan, groups, display (definition list) and edit modes.</p>
    <section aria-label="Install component" className="mb-6"><div className="flex items-center gap-3"><pre><code>npx shadcn add @petalo/form</code></pre><Button aria-label="Copy install command" onClick={async () => { await navigator.clipboard.writeText("npx shadcn add @petalo/form"); setCopied(true) }}>{copied ? "Copied" : "Copy"}</Button></div><span role="status" className="sr-only">{copied ? "Install command copied" : ""}</span></section>
    <section aria-label="Usage guidance"><p>{usage.summary}</p><h2>When to use</h2><ul>{usage.useWhen.map((text) => <li key={text}>{text}</li>)}</ul><h2>Don't use</h2><ul>{usage.avoidWhen.map((entry) => <li key={entry.when}>{entry.when}{" "}{entry.use?.map((alternative, index) => <React.Fragment key={alternative}>{index > 0 && ", "}<a href={docsLink(alternative)} target="_top">{alternative}</a></React.Fragment>)}</li>)}</ul></section>
    <section aria-label="Accessibility"><h2>Accessibility</h2><ul>{accessibility.map((note) => <li key={note}>{note}</li>)}</ul></section>
    <section aria-label="Localization"><h2>Localization</h2><p>Supply translated field labels and group headings in your application.</p></section>
    <section aria-label="Localization text keys"><h2>Localization text keys</h2><table><thead><tr><th>Prop / key</th><th>UI5 key or source</th><th>English component default</th></tr></thead><tbody>{textKeys.map(([prop, key, value]) => <tr key={prop}><td><code>{prop}</code></td><td>{key}</td><td>{value}</td></tr>)}</tbody></table></section>
    <h2>Playground</h2><div data-fiori-primary><Primary /></div><div data-fiori-controls><Controls /></div><h2>Props</h2><ArgTypes /><h2>Variants and examples</h2>{variants.map((story) => <DocsStory key={story.id} of={story.moduleExport} __forceInitialArgs={false} />)}
  </main>
} } },
  args: { headerText: "Supplier", layout: "S1 M1 L1 XL1", labelSpan: "S12 M4 L4 XL4", emptySpan: "S0 M0 L0 XL0", accessibleMode: "display", itemSpacing: "normal", headerLevel: "H2", grouped: false, allFieldTypes: false },
  argTypes: { ...base.argTypes, headerText: { control: "text" }, headerLevel: { control: "select", options: ["H1", "H2", "H3", "H4", "H5", "H6"], description: "Sample context headings preserve the document outline before the chosen form header level." }, layout: { control: "select", options: ["S1 M1 L1 XL1", "S1 M2 L2 XL2", "S1 M3 L3 XL3"] }, labelSpan: { control: "select", options: ["S12 M4 L4 XL4", "S12 M12 L12 XL12", "S12 M6 L6 XL6"] }, emptySpan: { control: "text" }, accessibleMode: { control: "inline-radio", options: ["display", "edit"] }, itemSpacing: { control: "select", options: ["normal", "large"] }, accessibleName: { control: "text" }, grouped: { control: "boolean", description: "Show Address, Contact and Purchasing groups." }, allFieldTypes: { control: "boolean", description: "Compose all supported field families in an editable supplier form." }, header: { control: false } },
  render: function SupplierForm(args: Args) {
    const { grouped, allFieldTypes, ...props } = args
    const id = React.useId()
    const edit = args.accessibleMode === "edit"
    const fieldId = (label: string) => `${id}-${label.toLowerCase().replace(/\s+/g, "-")}`
    // Changing headerLevel must still demonstrate a complete document outline.
    const contextTitles = ["Procurement", "Supplier management", "Supplier record", "Record fields"]
    const contextHeadings = Array.from({ length: Math.max(0, Number(args.headerLevel?.slice(1) ?? 2) - 2) }, (_, index) => React.createElement(`h${index + 2}`, { key: index }, contextTitles[index]))
    const withContext = (form: React.ReactNode) => <div className="w-full">{contextHeadings}{form}</div>
    const [tags, setTags] = React.useState(["Germany", "France"])
    const [tagValue, setTagValue] = React.useState("")
    const [regions, setRegions] = React.useState(["Europe", "Americas"])
    const groups = [{ title: "Address", items: [["Company", "Northwind Traders"], ["Street", "Market Street 12"], ["City", "Berlin"]] }, { title: "Contact", items: [["Phone", "+49 30 123456"], ["Email", "purchasing@example.com"]] }, { title: "Purchasing", items: [["Buyer", "Alex Morgan"], ["Payment terms", "Net 30 days"]] }]
    const item = (label: string, value: string) => <FormItem key={label} label={<Label showColon htmlFor={edit ? fieldId(label) : undefined}>{label}</Label>}>{edit ? <Input id={fieldId(label)} defaultValue={value} /> : <Text>{value}</Text>}</FormItem>
    if (!allFieldTypes) return withContext(<Form {...props}>{grouped ? groups.map((group) => <FormGroup key={group.title} headerText={group.title}>{group.items.map(([label, value]) => item(label, value))}</FormGroup>) : groups.flatMap((group) => group.items).map(([label, value]) => item(label, value))}</Form>)
    const label = (text: string, field?: string) => <Label showColon htmlFor={field ? `${id}-${field}` : undefined}>{text}</Label>
    return withContext(<Form {...props} accessibleMode="edit">
      <FormGroup headerText="Supplier details">
        <FormItem label={label("Company", "company")}><Input id={`${id}-company`} defaultValue="Northwind Traders" /></FormItem>
        <FormItem label={label("Notes", "notes")}><TextArea id={`${id}-notes`} defaultValue="Deliver to the receiving desk." growing /></FormItem>
        <FormItem label={label("Country", "country")}><Select defaultValue="de"><SelectTrigger id={`${id}-country`}><SelectValue /></SelectTrigger><SelectContent aria-label="Countries"><SelectGroup><SelectItem value="de">Germany</SelectItem><SelectItem value="fr">France</SelectItem></SelectGroup></SelectContent></Select></FormItem>
        <FormItem label={label("Buyer", "buyer")}><ComboBox id={`${id}-buyer`} defaultValue="Alex Morgan"><ComboBoxItem text="Alex Morgan" /><ComboBoxItem text="Sam Taylor" /></ComboBox></FormItem>
        <FormItem label={label("Delivery countries", "countries")}><MultiComboBox id={`${id}-countries`} defaultSelectedValues={["Germany"]}><MultiComboBoxItem text="Germany" /><MultiComboBoxItem text="France" /><MultiComboBoxItem text="China" /></MultiComboBox></FormItem>
        <FormItem label={label("Destinations", "destinations")}><MultiInput id={`${id}-destinations`} value={tagValue} onValueChange={setTagValue} tokens={tags.map((text) => <Token key={text} text={text} />)} onTokenDelete={(values) => setTags((current) => current.filter((text) => !values.includes(text)))} onCommit={(text) => { if (text.trim()) setTags((current) => current.includes(text.trim()) ? current : [...current, text.trim()]); setTagValue("") }}><SuggestionItem text="Japan" /><SuggestionItem text="Canada" /></MultiInput></FormItem>
        <FormItem label={label("Regions")}><Tokenizer aria-label="Purchasing regions" onTokenDelete={(values) => setRegions((current) => current.filter((text) => !values.includes(text)))}>{regions.map((text) => <Token key={text} text={text} />)}</Tokenizer></FormItem>
        <FormItem label={label("Attachment")}><FileUploader aria-label="Supplier contract attachment" accept=".pdf" /></FormItem>
      </FormGroup>
      <FormGroup headerText="Purchasing preferences">
        <FormItem label={label("Approval")}><Checkbox text="Approved supplier" defaultChecked /></FormItem>
        <FormItem label={label("Delivery method")}><RadioGroup aria-label="Delivery method" defaultValue="standard"><RadioGroupItem value="standard" text="Standard delivery" /><RadioGroupItem value="express" text="Express delivery" /></RadioGroup></FormItem>
        <FormItem label={label("Notifications")}><Switch aria-label="Email notifications" defaultChecked /></FormItem>
        <FormItem label={label("Quantity", "quantity")}><StepInput id={`${id}-quantity`} min={0} max={100} defaultValue={10} /></FormItem>
        <FormItem label={label("Order volume")}><Slider aria-label="Order volume" defaultValue={40} /></FormItem>
        <FormItem label={label("Order range")}><RangeSlider aria-label="Order range" defaultValue={[20, 70]} /></FormItem>
        <FormItem label={label("Rating")}><RatingIndicator aria-label="Supplier rating" defaultValue={3} /></FormItem>
        <FormItem label={label("Series colors")}><ColorPalette accessibleName="Supplier chart"><ColorPaletteItem value="#336699" /><ColorPaletteItem value="#008000" /></ColorPalette></FormItem>
        <FormItem label={label("Custom color")}><ColorPicker accessibleName="Supplier chart series" defaultValue="#336699" simplified /></FormItem>
      </FormGroup>
      <FormGroup headerText="Delivery schedule">
        <FormItem label={label("Delivery date", "date")}><DatePicker id={`${id}-date`} /></FormItem>
        <FormItem label={label("Delivery window", "range")}><DateRangePicker id={`${id}-range`} /></FormItem>
        <FormItem label={label("Arrival time", "time")}><TimePicker id={`${id}-time`} /></FormItem>
        <FormItem label={label("Appointment", "datetime")}><DateTimePicker id={`${id}-datetime`} /></FormItem>
        <FormItem label={label("Available dates")}><Calendar aria-label="Available delivery dates" /></FormItem>
      </FormGroup>
    </Form>)
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const OneColumn: Story = { args: { layout: "S1 M1 L1 XL1" } }
export const TwoColumns: Story = { args: { layout: "S1 M2 L2 XL2", grouped: true } }
export const ThreeColumns: Story = { args: { layout: "S1 M3 L3 XL3", grouped: true } }
export const LabelsAbove: Story = { args: { grouped: true, labelSpan: "S12 M12 L12 XL12" } }
export const LabelsBeside: Story = { args: { labelSpan: "S12 M4 L4 XL4" } }
export const Narrow: Story = { args: { grouped: true }, decorators: [(Story) => <div className="max-w-md"><Story /></div>] }
export const Edit: Story = { args: { accessibleMode: "edit", grouped: true, layout: "S1 M2 L2 XL2" } }
export const LargeSpacing: Story = { args: { labelSpan: "S12 M6 L6 XL6", itemSpacing: "large" } }
export const WithoutHeader: Story = { args: { headerText: "", accessibleName: "Supplier contact details" } }
export const EmptySpan: Story = { args: { emptySpan: "S0 M2 L2 XL2" } }
export const EveryFieldType: Story = { args: { allFieldTypes: true, layout: "S1 M2 L3 XL3", labelSpan: "S12 M12 L12 XL12", accessibleMode: "edit" }, parameters: { docs: { story: { inline: false, height: "1400px" } } } }
export const CustomTexts: Story = { args: { headerText: "", accessibleName: "Approved supplier profile" } }
export const RTL: Story = { globals: { dir: "rtl" }, args: { grouped: true, accessibleMode: "edit", layout: "S1 M2 L2 XL2" } }
