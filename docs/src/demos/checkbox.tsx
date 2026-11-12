import * as React from "react"

import { Checkbox } from "@/components/ui/checkbox"

import { defineDemo } from "./types"

function CheckboxDemo() {
  const [items, setItems] = React.useState({ email: true, sms: false, push: false })
  const all = Object.values(items)
  const parent = all.every(Boolean) ? true : all.some(Boolean) ? "indeterminate" : false
  return (
    <div className="flex flex-col items-start">
      <Checkbox
        id="notify-all"
        text="All notifications"
        checked={parent}
        onCheckedChange={(v) => setItems({ email: !!v, sms: !!v, push: !!v })}
      />
      <div className="flex flex-col items-start ps-8">
        {(Object.keys(items) as (keyof typeof items)[]).map((k) => (
          <Checkbox key={k} id={`notify-${k}`} text={k === "sms" ? "SMS" : k[0].toUpperCase() + k.slice(1)} checked={items[k]} onCheckedChange={(v) => setItems({ ...items, [k]: !!v })} />
        ))}
      </div>
      <Checkbox id="terms" text="I accept the terms" required valueState="critical" />
      <Checkbox id="cb-readonly" text="Read only" readOnly defaultChecked />
      <Checkbox id="cb-disabled" text="Disabled" disabled />
    </div>
  )
}

export default defineDemo({
  category: "Forms",
  docs: [
    {
      name: "checkbox",
      description: "A checkbox with an integrated label and validation state.",
      props: [
        { name: "Checkbox.checked", type: "boolean | indeterminate", description: "Controlled checked state." },
        { name: "Checkbox.onCheckedChange", type: "(checked: boolean | indeterminate) => void", description: "Receive checked-state changes." },
        { name: "Checkbox.text", type: "ReactNode", description: "Label rendered inside the control." },
        { name: "Checkbox.readOnly", type: "boolean", description: "Keep the control focusable without changing its value." },
        { name: "Checkbox.valueState", type: "ValueState", description: "Semantic validation state.", defaultValue: "none" },
      ],
    },
  ],
 title: "CheckBox", order: 30, Demo: CheckboxDemo })
