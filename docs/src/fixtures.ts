// Shared fixtures rendered identically by the React docs page (main.tsx) and the UI5 reference
// page (ui5-main.ts). tests/visual.spec.ts screenshots each [data-fixture] on both and diffs them.

export type Fixture =
  | { id: string; kind: "button"; variant: "default" | "emphasized" | "transparent" | "positive" | "negative" | "attention"; text?: string; icon?: string; disabled?: boolean }
  | { id: string; kind: "label"; text: string; required?: boolean; showColon?: boolean }
  | { id: string; kind: "input"; value?: string; placeholder?: string; valueState?: "none" | "negative" | "critical" | "positive" | "information"; disabled?: boolean; readOnly?: boolean }
  | { id: string; kind: "select"; options: string[]; selected: string; valueState?: "none" | "negative" | "critical" | "positive" | "information"; disabled?: boolean }

const buttonVariants = ["default", "emphasized", "transparent", "positive", "negative", "attention"] as const
const states = ["none", "negative", "critical", "positive", "information"] as const

export const fixtures: Fixture[] = [
  ...buttonVariants.map((variant) => ({ id: `button-${variant}`, kind: "button" as const, variant, text: "Button" })),
  ...buttonVariants.map((variant) => ({ id: `button-${variant}-disabled`, kind: "button" as const, variant, text: "Button", disabled: true })),
  { id: "button-icon-text", kind: "button", variant: "default", text: "Edit", icon: "edit" },
  { id: "button-icon-only", kind: "button", variant: "transparent", icon: "add" },
  { id: "label", kind: "label", text: "Company name" },
  { id: "label-required", kind: "label", text: "Company name", required: true },
  { id: "label-colon-required", kind: "label", text: "Company name", required: true, showColon: true },
  { id: "input-empty", kind: "input", placeholder: "Enter a name" },
  { id: "input-value", kind: "input", value: "SAP SE" },
  ...states.slice(1).map((valueState) => ({ id: `input-${valueState}`, kind: "input" as const, value: "SAP SE", valueState })),
  { id: "input-disabled", kind: "input", value: "SAP SE", disabled: true },
  { id: "input-readonly", kind: "input", value: "SAP SE", readOnly: true },
  { id: "select", kind: "select", options: ["Germany", "France", "China"], selected: "Germany" },
  ...states.slice(1).map((valueState) => ({ id: `select-${valueState}`, kind: "select" as const, options: ["Germany", "France"], selected: "Germany", valueState })),
  { id: "select-disabled", kind: "select", options: ["Germany", "France"], selected: "Germany", disabled: true },
]

export type PageOptions = { theme: string; density: "cozy" | "compact"; only?: string }

export function readPageOptions(): PageOptions {
  const q = new URLSearchParams(location.search)
  return {
    theme: q.get("theme") ?? "sap_horizon",
    density: q.get("density") === "compact" ? "compact" : "cozy",
    only: q.get("only") ?? undefined,
  }
}

/** Fixture cell width, shared so inputs/selects are the same width on both pages. */
export const FIELD_WIDTH = "13.125rem"
