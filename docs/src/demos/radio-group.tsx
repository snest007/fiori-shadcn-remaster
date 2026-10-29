import * as React from "react"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { defineDemo } from "./types"

function RadioGroupDemo() {
  const [value, setValue] = React.useState("standard")
  return (
    <div className="flex flex-wrap gap-12">
      <RadioGroup id="shipping" aria-label="Shipping" value={value} onValueChange={setValue}>
        <RadioGroupItem value="standard" text="Standard" />
        <RadioGroupItem value="express" text="Express" />
        <RadioGroupItem value="pickup" text="Pick-up (unavailable)" disabled />
        <RadioGroupItem value="overnight" text="Overnight" />
      </RadioGroup>
      <RadioGroup aria-label="Payment" defaultValue="card" valueState="negative">
        <RadioGroupItem value="card" text="Card" />
        <RadioGroupItem value="invoice" text="Invoice" />
      </RadioGroup>
      <RadioGroup aria-label="Plan" defaultValue="pro" readOnly orientation="horizontal">
        <RadioGroupItem value="free" text="Free" />
        <RadioGroupItem value="pro" text="Pro" />
      </RadioGroup>
      <p className="basis-full text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        One tab stop per group; arrow keys move the selection (wrapping, skipping disabled items).
      </p>
    </div>
  )
}

export default defineDemo({ title: "RadioButton", order: 31, Demo: RadioGroupDemo })
