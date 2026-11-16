import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { fioriMeta } from "../_lib/meta"
import { fioriArgTypes } from "../_lib/argTypes"

type Args = React.ComponentProps<typeof Select> & Pick<React.ComponentProps<typeof SelectTrigger>, "readOnly" | "valueState" | "valueStateMessage" | "valueStateTypeText"> & Pick<React.ComponentProps<typeof SelectContent>, "dialogTitle" | "cancelText" | "dialogNamePrefix"> & { placeholder?: string }
const base = fioriMeta({ name: "select", component: Select })
const triggerProps = fioriArgTypes("select", "SelectTrigger")
const meta = {
  ...base,
  args: { value: "de", disabled: false, readOnly: false, required: false, valueState: "none", placeholder: "Choose a country", onValueChange: fn(), onOpenChange: fn() },
  argTypes: {
    ...base.argTypes, ...triggerProps,
    value: { ...base.argTypes?.value, control: "select", options: ["", "de", "fr", "cn"] },
    open: { ...base.argTypes?.open, control: "boolean" },
    disabled: { control: "boolean" }, required: { control: "boolean" },
    readOnly: { ...triggerProps.readOnly, control: "boolean" },
    valueState: { ...triggerProps.valueState, control: "select", options: ["none", "negative", "critical", "positive", "information"] },
    valueStateMessage: { control: "text" }, placeholder: { control: "text" },
    onValueChange: { ...base.argTypes?.onValueChange, control: false }, onOpenChange: { control: false },
    dir: { control: false }, valueStateTypeText: { control: false }, dialogTitle: { control: "text" }, cancelText: { control: "text" }, dialogNamePrefix: { control: "text" },
  },
  render: function CountrySelect(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const { readOnly, valueState, valueStateMessage, valueStateTypeText, placeholder, dialogTitle, cancelText, dialogNamePrefix, ...props } = args
    return <Select {...props} open={args.open ?? false} onValueChange={(value) => { args.onValueChange?.(value); updateArgs({ value }) }} onOpenChange={(open) => { args.onOpenChange?.(open); updateArgs({ open }) }}>
      <SelectTrigger aria-label="Country" readOnly={readOnly} disabled={props.disabled} valueState={valueState} valueStateMessage={valueStateMessage} valueStateTypeText={valueStateTypeText}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent aria-label="Country choices" dialogTitle={dialogTitle} cancelText={cancelText} dialogNamePrefix={dialogNamePrefix}><SelectGroup><SelectItem value="de">Germany</SelectItem><SelectItem value="fr">France</SelectItem><SelectItem value="cn">China</SelectItem><SelectItem value="us" disabled>United States (unavailable)</SelectItem></SelectGroup></SelectContent>
    </Select>
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
export const Disabled: Story = { args: { disabled: true } }
export const ReadOnly: Story = { args: { readOnly: true } }
export const Required: Story = { args: { required: true } }
export const Empty: Story = { args: { value: "" } }
export const Open: Story = { args: { open: true }, parameters: { docs: { story: { inline: false, height: "360px" } } } }
export const CustomTexts: Story = { args: { valueState: "negative", valueStateMessage: "Choose an available delivery country.", valueStateTypeText: { negative: "Country error" }, dialogTitle: "Delivery countries", cancelText: "Use this country", dialogNamePrefix: "Choose" } }
export const RTL: Story = { globals: { dir: "rtl" } }
export const LabelledField: Story = { render: function CountryField() {
  const [country, setCountry] = React.useState("de")
  return <div className="grid max-w-md gap-2"><Label htmlFor="select-country" showColon>Country</Label><Select value={country} onValueChange={setCountry}><SelectTrigger id="select-country"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="de">Germany</SelectItem><SelectItem value="fr">France</SelectItem><SelectItem value="cn">China</SelectItem></SelectGroup></SelectContent></Select></div>
} }

export const AccessibleRoleDescription: Story = { render: () => <Select defaultValue="de" texts={{ roleDescription: "Country selector", optionsInGroups: (count, groups) => `${count} choices in ${groups} regions`, itemPosition: (position, count) => `Choice ${position} from ${count}` }}><SelectTrigger aria-label="Country"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="de">Germany</SelectItem><SelectItem value="fr">France</SelectItem></SelectGroup><SelectGroup><SelectItem value="cn">China</SelectItem></SelectGroup></SelectContent></Select> }
export const RTLAccessibleRoleDescription: Story = { ...AccessibleRoleDescription, globals: { dir: "rtl" } }
