import { Input, type ValueState } from "@/components/ui/input"

import { defineFixtures } from "../fixture-types"

type Props = { value?: string; placeholder?: string; valueState?: ValueState; disabled?: boolean; readOnly?: boolean; a11y?: "name" | "name-ref" | "description" | "description-ref" }
const states = ["negative", "critical", "positive", "information"] as const

export default defineFixtures<Props>({
  name: "input",
  a11yDiff: {
    "input-a11y-description": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-a11y-description-ref": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-a11y-name": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-a11y-name-ref": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-critical": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-disabled": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-empty": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-information": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-negative": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-positive": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-readonly": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-value": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    }
  },
  cases: [
    { id: "input-empty", props: { placeholder: "Enter a name" } },
    { id: "input-value", props: { value: "SAP SE" } },
    ...(["name", "name-ref", "description", "description-ref"] as const).map((a11y) => ({ id: `input-a11y-${a11y}`, props: { value: "SAP SE", a11y } })),
    ...states.map((valueState) => ({ id: `input-${valueState}`, props: { value: "SAP SE", valueState } })),
    { id: "input-disabled", props: { value: "SAP SE", disabled: true } },
    { id: "input-readonly", props: { value: "SAP SE", readOnly: true } },
  ],
  react: ({ value, a11y, ...p }) => {
    const prefix = `input-a11y-${a11y}`
    return <div>
      {a11y && <span id={`${prefix}-label`} hidden>Supplier identifier</span>}
      {a11y && <span id={`${prefix}-description`} hidden>Use the supplier number</span>}
      <Input wrapperClassName="w-(--w)" defaultValue={value} valueStateMessage={null}
        aria-label={a11y === "name" ? "Supplier identifier" : "Input"}
        aria-labelledby={a11y === "name-ref" ? `${prefix}-label` : undefined}
        aria-description={a11y === "description" ? "Use the supplier number" : undefined}
        aria-describedby={a11y === "description-ref" ? `${prefix}-description` : undefined}
        {...p} />
    </div>
  },
})
