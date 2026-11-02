import * as React from "react"

import { Button } from "@/components/ui/button"
import { Form, FormGroup, FormItem } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Text } from "@/components/ui/text"

import { defineDemo } from "./types"

const groups: { title: string; items: [string, string][] }[] = [
  { title: "Address", items: [["Name", "Red Point Stores"], ["Street", "Main St 1618"], ["City", "Walldorf"]] },
  { title: "Contact", items: [["Phone", "+49 6227 747474"], ["Email", "john@sap.com"]] },
]

function FormDemo() {
  const [edit, setEdit] = React.useState(false)
  const [values, setValues] = React.useState(() => Object.fromEntries(groups.flatMap((g) => g.items)))
  return (
    <div className="grid gap-2">
      <div>
        <Button id="form-demo-toggle" onClick={() => setEdit((e) => !e)}>
          {edit ? "Display" : "Edit"}
        </Button>
      </div>
      <Form id="form-demo" headerText="Supplier" layout="S1 M2 L2 XL3" labelSpan="S12 M4 L4 XL4" accessibleMode={edit ? "edit" : "display"}>
        {groups.map((g) => (
          <FormGroup key={g.title} headerText={g.title}>
            {g.items.map(([label]) => {
              const id = `form-demo-${label.toLowerCase()}`
              return (
                <FormItem key={label} label={<Label showColon htmlFor={edit ? id : undefined}>{label}</Label>}>
                  {edit ? (
                    <Input id={id} value={values[label]} onChange={(e) => setValues((v) => ({ ...v, [label]: e.target.value }))} />
                  ) : (
                    <Text>{values[label]}</Text>
                  )}
                </FormItem>
              )
            })}
          </FormGroup>
        ))}
      </Form>
    </div>
  )
}

export default defineDemo({ title: "Form", order: 71, Demo: FormDemo })
