import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Text } from "@/components/ui/text"
import { Wizard, WizardStep } from "@/components/ui/wizard"
import { accept, activate, hint, product } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

function WizardDemo() {
  const [step, setStep] = React.useState("type")
  const [reached, setReached] = React.useState(1)
  const [name, setName] = React.useState("")
  const [changes, setChanges] = React.useState(0)
  const order = ["type", "info", "options", "pricing"]
  const next = (i: number) => {
    setReached((r) => Math.max(r, i + 2))
    setStep(order[i + 1])
  }
  // The "next step" button sits at the end of the last reached step, as in the Fiori wizard guideline.
  const stepBody = (i: number, text: string, extra?: React.ReactNode, canGoOn = true) => (
    <div className="grid gap-3">
      <Text>{text}</Text>
      {extra}
      {i + 1 === reached && i < order.length - 1 && (
        <div>
          <Button disabled={!canGoOn} onClick={() => next(i)}>
            Step {i + 2}
          </Button>
        </div>
      )}
    </div>
  )
  return (
    <div className="grid gap-2">
      <Text>
        Step: <span data-testid="wizard-demo-step">{step}</span> · changes: <span data-testid="wizard-demo-changes">{changes}</span>
      </Text>
      <div id="wizard-demo" className="h-[22rem]">
        <Wizard
          accessibleName="Create product"
          selectedStep={step}
          onStepChange={(s) => {
            setStep(s)
            setChanges((c) => c + 1)
          }}
        >
          <WizardStep value="type" titleText="Product type" icon={product}>
            {stepBody(0, "Choose the type of product you want to create.")}
          </WizardStep>
          <WizardStep value="info" titleText="Product information" subtitleText="(Optional)" icon={hint} disabled={reached < 2}>
            {stepBody(
              1,
              "Name the product.",
              <div className="grid max-w-xs gap-1">
                <Label htmlFor="wizard-demo-name" required showColon>Name</Label>
                <Input id="wizard-demo-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>,
              name.trim().length > 0
            )}
          </WizardStep>
          <WizardStep value="options" titleText="Options" icon={activate} disabled={reached < 3}>
            {stepBody(2, "Pick the options.")}
          </WizardStep>
          <WizardStep value="pricing" titleText="Pricing" icon={accept} disabled={reached < 4}>
            {stepBody(3, "Set the price.")}
          </WizardStep>
        </Wizard>
      </div>
    </div>
  )
}

export default defineDemo({
  category: "Navigation",
  docs: [
    {
      name: "wizard",
      description: "Guided steps with keyboard navigation and scroll-based step selection.",
      props: [
        { name: "Wizard.selectedStep", type: "string", description: "Controlled selected step identifier." },
        { name: "Wizard.onStepChange", type: "(step: string, detail: { previousStep: string | undefined; withScroll: boolean }) => void", description: "Receive selection and scroll-based step changes." },
        { name: "Wizard.contentLayout", type: "multipleSteps | singleStep", description: "Show all reached steps or only the selected step.", defaultValue: "multipleSteps" },
        { name: "Wizard.stepSwitchThreshold", type: "number", description: "Share of a step to scroll past before selecting the next.", defaultValue: "0.7" },
        { name: "WizardStep.value", type: "string", description: "Step identifier; defaults to its index." },
        { name: "WizardStep.titleText", type: "string", description: "Step title." },
        { name: "WizardStep.disabled", type: "boolean", description: "Keep an unreached step inactive and its content hidden." },
      ],
    },
  ], title: "Wizard", order: 74, Demo: WizardDemo })
