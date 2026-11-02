import * as React from "react"

import { Bar } from "@/components/ui/bar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link } from "@/components/ui/link"
import { MessageStrip } from "@/components/ui/message-strip"
import { Page } from "@/components/ui/page"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Text } from "@/components/ui/text"
import { Title } from "@/components/ui/title"
import { Wizard, WizardStep } from "@/components/ui/wizard"
import { accept, activate, hint, product } from "@/lib/fiori-icons"

// Fiori "Wizard" floorplan (SAP Fiori design guidelines): a full-screen page with a title, the wizard
// with one form per step, and a footer toolbar. Each step ends with a "Step N" button that reveals the
// next step once the current one is valid; the footer offers Cancel and, after the last step is
// complete, Review. Review replaces the wizard with a read-only summary (with Edit per section) whose
// footer has Submit and Cancel.

type Form = {
  name: string
  category: string
  description: string
  availableFrom: string
  price: string
  currency: string
  options: { warranty: boolean; insurance: boolean; giftWrap: boolean }
}

const initial: Form = {
  name: "",
  category: "",
  description: "",
  availableFrom: "",
  price: "",
  currency: "EUR",
  options: { warranty: true, insurance: false, giftWrap: false },
}

const CATEGORIES = ["Laptops", "Monitors", "Accessories"]
const STEPS = [
  { value: "type", title: "Product type", icon: product },
  { value: "info", title: "Product information", icon: hint },
  { value: "options", title: "Options", icon: activate },
  { value: "pricing", title: "Pricing", icon: accept },
] as const

function Field({ id, label, required, children }: { id: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[12rem_minmax(0,20rem)] sm:items-center sm:gap-4">
      <Label htmlFor={id} required={required} showColon className="sm:justify-self-end">
        {label}
      </Label>
      {children}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[12rem_1fr] sm:gap-4">
      <Label showColon className="sm:justify-self-end">
        {label}
      </Label>
      <Text>{value || "–"}</Text>
    </div>
  )
}

export default function WizardPage() {
  const [form, setForm] = React.useState<Form>(initial)
  const [step, setStep] = React.useState<string>("type")
  const [reached, setReached] = React.useState(0)
  const [mode, setMode] = React.useState<"edit" | "review" | "done">("edit")
  const [priceTouched, setPriceTouched] = React.useState(false)
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))

  const priceValid = /^\d+(\.\d{1,2})?$/.test(form.price.trim()) && Number(form.price) > 0
  const valid = [form.category !== "", form.name.trim() !== "", true, priceValid]
  // A step stays reachable only while every step before it is valid.
  const firstInvalid = valid.findIndex((v) => !v)
  const reachable = Math.min(reached, firstInvalid === -1 ? STEPS.length - 1 : firstInvalid)
  const canReview = reachable === STEPS.length - 1 && firstInvalid === -1

  const goNext = (i: number) => {
    setReached((r) => Math.max(r, i + 1))
    setStep(STEPS[i + 1].value)
  }
  const reset = () => {
    setForm(initial)
    setStep("type")
    setReached(0)
    setPriceTouched(false)
    setMode("edit")
  }
  const edit = (value: string) => {
    setMode("edit")
    setStep(value)
  }

  const nextButton = (i: number) =>
    i === reachable &&
    i < STEPS.length - 1 && (
      <div className="pt-4">
        <Button disabled={!valid[i]} onClick={() => goNext(i)}>
          Step {i + 2}
        </Button>
      </div>
    )

  const header = (
    <Bar design="header">
      <Title level="H1" size="H5">
        {mode === "edit" ? "Create Product" : "Review Product"}
      </Title>
    </Bar>
  )

  const footer =
    mode === "done" ? undefined : (
      <Bar
        design="floating-footer"
        endContent={
          mode === "edit" ? (
            <>
              {canReview && (
                <Button variant="emphasized" onClick={() => setMode("review")}>
                  Review
                </Button>
              )}
              <Button variant="transparent" onClick={reset}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="emphasized" onClick={() => setMode("done")}>
                Submit
              </Button>
              <Button variant="transparent" onClick={reset}>
                Cancel
              </Button>
            </>
          )
        }
      />
    )

  return (
    <div className="h-screen">
      <Page
        header={header}
        footer={footer}
        backgroundDesign={mode === "edit" ? "solid" : "list"}
        noScrolling={mode === "edit"}
        // The wizard brings its own header, padding and scroll area, so it fills the content edge to edge.
        contentProps={{ className: mode === "edit" ? "px-0 pb-0" : undefined }}
      >
        {mode === "edit" && (
          <div className="h-full">
            <Wizard
              accessibleName="Create Product"
              selectedStep={step}
              onStepChange={(s) => setStep(s)}
              className="[&_.fiori-wiz\_\_content-item:last-child]:pb-16"
            >
              <WizardStep value="type" titleText={STEPS[0].title} icon={STEPS[0].icon}>
                <div className="grid gap-4">
                  <Title level="H2" size="H5">
                    1. {STEPS[0].title}
                  </Title>
                  <Text>Choose the category of the product you want to create.</Text>
                  <Field id="wizard-page-category" label="Category" required>
                    <Select value={form.category} onValueChange={(v) => set("category", v)}>
                      <SelectTrigger id="wizard-page-category" wrapperClassName="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  {nextButton(0)}
                </div>
              </WizardStep>
              <WizardStep value="info" titleText={STEPS[1].title} icon={STEPS[1].icon} disabled={reachable < 1}>
                <div className="grid gap-4">
                  <Title level="H2" size="H5">
                    2. {STEPS[1].title}
                  </Title>
                  <Field id="wizard-page-name" label="Name" required>
                    <Input id="wizard-page-name" value={form.name} onChange={(e) => set("name", e.target.value)} wrapperClassName="w-full" />
                  </Field>
                  <Field id="wizard-page-description" label="Description">
                    <Input
                      id="wizard-page-description"
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      wrapperClassName="w-full"
                    />
                  </Field>
                  <Field id="wizard-page-date" label="Available from">
                    <DatePicker
                      id="wizard-page-date"
                      value={form.availableFrom}
                      onValueChange={(v) => set("availableFrom", v)}
                      wrapperClassName="w-full"
                    />
                  </Field>
                  {nextButton(1)}
                </div>
              </WizardStep>
              <WizardStep value="options" titleText={STEPS[2].title} icon={STEPS[2].icon} disabled={reachable < 2}>
                <div className="grid gap-4">
                  <Title level="H2" size="H5">
                    3. {STEPS[2].title}
                  </Title>
                  <div role="group" aria-label="Options" className="grid gap-1">
                    {(
                      [
                        ["warranty", "Extended warranty"],
                        ["insurance", "Damage insurance"],
                        ["giftWrap", "Gift wrapping"],
                      ] as const
                    ).map(([k, text]) => (
                      <Checkbox
                        key={k}
                        text={text}
                        checked={form.options[k]}
                        onCheckedChange={(c) => set("options", { ...form.options, [k]: c === true })}
                      />
                    ))}
                  </div>
                  {nextButton(2)}
                </div>
              </WizardStep>
              <WizardStep value="pricing" titleText={STEPS[3].title} icon={STEPS[3].icon} disabled={reachable < 3}>
                <div className="grid gap-4">
                  <Title level="H2" size="H5">
                    4. {STEPS[3].title}
                  </Title>
                  <Field id="wizard-page-price" label="Price" required>
                    <div className="flex gap-2">
                      <Input
                        id="wizard-page-price"
                        inputMode="decimal"
                        value={form.price}
                        onChange={(e) => set("price", e.target.value)}
                        onBlur={() => setPriceTouched(true)}
                        valueState={priceTouched && !priceValid ? "negative" : "none"}
                        valueStateMessage="Enter a price greater than 0, e.g. 1299.00."
                        wrapperClassName="min-w-0 flex-1"
                      />
                      <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                        <SelectTrigger aria-label="Currency" wrapperClassName="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["EUR", "USD", "GBP"].map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </Field>
                  {canReview && <Text>All steps are complete. Choose Review in the footer to check your entries.</Text>}
                </div>
              </WizardStep>
            </Wizard>
          </div>
        )}
        {mode !== "edit" && (
          <div className="grid gap-6 py-4 pb-16">
            {mode === "done" && (
              <MessageStrip design="positive" hideCloseButton>
                Product {form.name} was created.{" "}
                <Link href="#" onClick={(e) => (e.preventDefault(), reset())}>
                  Create another product
                </Link>
              </MessageStrip>
            )}
            {(
              [
                [0, [["Category", form.category]]],
                [
                  1,
                  [
                    ["Name", form.name],
                    ["Description", form.description],
                    ["Available from", form.availableFrom],
                  ],
                ],
                [
                  2,
                  [
                    [
                      "Options",
                      [
                        form.options.warranty && "Extended warranty",
                        form.options.insurance && "Damage insurance",
                        form.options.giftWrap && "Gift wrapping",
                      ]
                        .filter(Boolean)
                        .join(", "),
                    ],
                  ],
                ],
                [3, [["Price", form.price && `${Number(form.price).toFixed(2)} ${form.currency}`]]],
              ] as [number, [string, string][]][]
            ).map(([i, rows]) => (
              <section key={i} aria-labelledby={`wizard-page-review-${i}`} className="grid gap-3">
                <div className="flex items-center gap-4">
                  <Title id={`wizard-page-review-${i}`} level="H2" size="H5">
                    {i + 1}. {STEPS[i].title}
                  </Title>
                  {mode === "review" && (
                    <Link href="#" aria-label={`Edit ${STEPS[i].title}`} onClick={(e) => (e.preventDefault(), edit(STEPS[i].value))}>
                      Edit
                    </Link>
                  )}
                </div>
                {rows.map(([label, value]) => (
                  <ReviewRow key={label} label={label} value={value} />
                ))}
              </section>
            ))}
          </div>
        )}
      </Page>
    </div>
  )
}
