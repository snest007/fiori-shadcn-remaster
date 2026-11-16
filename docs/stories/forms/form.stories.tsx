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
import { fioriMeta } from "../_lib/meta"
import { DocsPage } from "../_lib/DocsPage"

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
  return <><DocsPage /><section aria-label="Localization text keys" className="sbdocs-content"><h2>Localization text keys</h2><p>Override these public text props in your application; CustomTexts demonstrates the supported API. Existing label props remain available.</p><table><thead><tr><th>Prop / key</th><th>UI5 key or source</th><th>English component default</th></tr></thead><tbody>{textKeys.map(([prop, key, value]) => <tr key={prop}><td><code>{prop}</code></td><td>{key}</td><td>{value}</td></tr>)}</tbody></table></section></>
} } },
  args: { headerText: "Supplier", layout: "S1 M1 L1 XL1", labelSpan: "S12 M4 L4 XL4", emptySpan: "S0 M0 L0 XL0", accessibleMode: "display", itemSpacing: "normal", headerLevel: "H2", grouped: false, allFieldTypes: false },
  argTypes: { ...base.argTypes, headerText: { control: "text" }, headerLevel: { control: "select", options: ["H1", "H2", "H3", "H4", "H5", "H6"] }, layout: { control: "select", options: ["S1 M1 L1 XL1", "S1 M2 L2 XL2", "S1 M3 L3 XL3"] }, labelSpan: { control: "select", options: ["S12 M4 L4 XL4", "S12 M12 L12 XL12", "S12 M6 L6 XL6"] }, emptySpan: { control: "text" }, accessibleMode: { control: "inline-radio", options: ["display", "edit"] }, itemSpacing: { control: "select", options: ["normal", "large"] }, accessibleName: { control: "text" }, grouped: { control: "boolean", description: "Show Address, Contact and Purchasing groups." }, allFieldTypes: { control: "boolean", description: "Compose all supported field families in an editable supplier form." }, header: { control: false } },
  render: function SupplierForm(args: Args) {
    const { grouped, allFieldTypes, ...props } = args
    const id = React.useId()
    const edit = args.accessibleMode === "edit"
    const [tags, setTags] = React.useState(["Germany", "France"])
    const [tagValue, setTagValue] = React.useState("")
    const [regions, setRegions] = React.useState(["Europe", "Americas"])
    const groups = [{ title: "Address", items: [["Company", "Northwind Traders"], ["Street", "Market Street 12"], ["City", "Berlin"]] }, { title: "Contact", items: [["Phone", "+49 30 123456"], ["Email", "purchasing@example.com"]] }, { title: "Purchasing", items: [["Buyer", "Alex Morgan"], ["Payment terms", "Net 30 days"]] }]
    const item = (label: string, value: string) => <FormItem key={label} label={<Label showColon htmlFor={edit ? `${id}-${label}` : undefined}>{label}</Label>}>{edit ? <Input id={`${id}-${label}`} defaultValue={value} /> : <Text>{value}</Text>}</FormItem>
    if (!allFieldTypes) return <div className="w-full"><Form {...props}>{grouped ? groups.map((group) => <FormGroup key={group.title} headerText={group.title}>{group.items.map(([label, value]) => item(label, value))}</FormGroup>) : groups.flatMap((group) => group.items).map(([label, value]) => item(label, value))}</Form></div>
    const label = (text: string, field?: string) => <Label showColon htmlFor={field ? `${id}-${field}` : undefined}>{text}</Label>
    return <Form {...props} accessibleMode="edit">
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
    </Form>
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
export const EveryFieldType: Story = { args: { allFieldTypes: true, layout: "S1 M2 L3 XL3", labelSpan: "S12 M12 L12 XL12", accessibleMode: "edit" } }
export const CustomTexts: Story = { args: { headerText: "", accessibleName: "Approved supplier profile" } }
export const RTL: Story = { globals: { dir: "rtl" }, args: { grouped: true, accessibleMode: "edit", layout: "S1 M2 L2 XL2" } }
