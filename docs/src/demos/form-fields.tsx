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

export default defineDemo({ title: "Form fields: Label, Input, Select", order: 20, Demo: FormFields })
