import * as React from "react"

import { Label } from "@/components/ui/label"
import { StepInput } from "@/components/ui/step-input"

import { defineDemo } from "./types"

function StepInputDemo() {
  const [qty, setQty] = React.useState(3)
  return (
    <>
      <div className="grid max-w-md grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
        <Label htmlFor="si-qty" showColon>Quantity (0–10)</Label>
        <StepInput id="si-qty" value={qty} onValueChange={setQty} min={0} max={10} />
        <Label htmlFor="si-price" showColon>Price</Label>
        <StepInput id="si-price" defaultValue={9.99} step={0.5} valuePrecision={2} min={0} />
        <Label htmlFor="si-ro" showColon>Read only</Label>
        <StepInput id="si-ro" readOnly defaultValue={42} />
      </div>
      <p className="mt-4 text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        ↑/↓ step; Shift+PageUp / Ctrl+Shift+↑ jump to the maximum, Shift+PageDown / Ctrl+Shift+↓ to the minimum; Escape
        restores the value from focus. Hold a button to spin. Values outside the range turn the field negative on commit.
        Quantity: <span data-testid="si-qty-value">{qty}</span>
      </p>
    </>
  )
}

export default defineDemo({
  category: "Forms",
  docs: [
    {
      name: "step-input",
      description: "Numeric entry with stepping, limits and decimal validation.",
      props: [
        { name: "StepInput.value", type: "number", description: "Controlled numeric value." },
        { name: "StepInput.onValueChange", type: "(value: number) => void", description: "Receive a committed value after stepping, Enter or blur." },
        { name: "StepInput.step", type: "number", description: "Amount added or removed per small step.", defaultValue: "1" },
        { name: "StepInput.min / StepInput.max", type: "number", description: "Allowed range." },
        { name: "StepInput.valuePrecision", type: "number", description: "Displayed decimal places.", defaultValue: "0" },
      ],
    },
  ],
 title: "StepInput", order: 32, Demo: StepInputDemo })
