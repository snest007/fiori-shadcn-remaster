import * as React from "react"

import { Icon } from "@/components/ui/icon"
import { Input, InputIcon } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { search } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

function FormFields() {
  const [country, setCountry] = React.useState("de")
  const [name, setName] = React.useState("")
  return (
    <>
      <div className="grid max-w-md grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
        <Label htmlFor="name" required showColon>Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="At least 3 characters"
          valueState={name && name.length < 3 ? "negative" : name ? "positive" : "none"}
          valueStateMessage={name && name.length < 3 ? "Enter at least 3 characters." : undefined}
        />
        <Label htmlFor="country" showColon>Country</Label>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger id="country"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="de">Germany</SelectItem>
            <SelectItem value="fr">France</SelectItem>
            <SelectItem value="cn">China</SelectItem>
            <SelectItem value="us" disabled>United States</SelectItem>
          </SelectContent>
        </Select>
        <Label htmlFor="search" showColon>Search</Label>
        <Input id="search" type="search" placeholder="Search" icon={<InputIcon><Icon icon={search} /></InputIcon>} />
        <Label htmlFor="ro" showColon>Read only</Label>
        <Input id="ro" readOnly defaultValue="SAP SE" />
      </div>
      <p className="mt-4 text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        Select keyboard: ↑/↓/Home/End change the value without opening; Alt+↓, F4, Space or Enter open the list.
      </p>
    </>
  )
}

export default defineDemo({
  category: "Forms",
  docs: [
    {
      name: "label",
      description: "Field labels with required markers, colons and optional truncation.",
      props: [
        { name: "Label.htmlFor", type: "string", description: "ID of the labelled form control." },
        { name: "Label.required", type: "boolean", description: "Show the required marker." },
        { name: "Label.showColon", type: "boolean", description: "Append a colon." },
        { name: "Label.truncate", type: "boolean", description: "Keep the label on one line with an ellipsis." },
      ],
    },
    {
      name: "input",
      description: "A text field with Fiori value states and a trailing icon slot.",
      props: [
        { name: "Input.value", type: "string | number | readonly string[]", description: "Controlled native input value." },
        { name: "Input.onChange", type: "React.ChangeEventHandler<HTMLInputElement>", description: "Receive native text changes." },
        { name: "Input.valueState", type: "ValueState", description: "Semantic validation state.", defaultValue: "none" },
        { name: "Input.valueStateMessage", type: "ReactNode | null", description: "Message shown on focus; null hides it." },
        { name: "Input.icon", type: "ReactNode", description: "Trailing icon or value-help action." },
      ],
    },
    {
      name: "select",
      description: "A fixed-option choice with the Fiori closed-field keyboard model.",
      props: [
        { name: "Select.value", type: "string", description: "Controlled selected option value." },
        { name: "Select.onValueChange", type: "(value: string) => void", description: "Receive the selected option value." },
        { name: "Select.open", type: "boolean", description: "Controlled popup state." },
        { name: "SelectTrigger.valueState", type: "ValueState", description: "Semantic field state.", defaultValue: "none" },
        { name: "SelectTrigger.readOnly", type: "boolean", description: "Keep focus and prevent selection changes." },
      ],
    },
  ],
 title: "Form fields: Label, Input, Select", order: 20, Demo: FormFields })
