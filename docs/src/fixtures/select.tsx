import type * as React from "react"
import type { ValueState } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"

import { defineFixtures } from "../fixture-types"

type Props = { options: string[]; selected: string; valueState?: ValueState; disabled?: boolean; groups?: string[][]; channel?: "name" | "name-ref" | "description" | "description-ref"; rtl?: boolean }
const states = ["negative", "critical", "positive", "information"] as const

export default defineFixtures<Props>({
  name: "select",
  a11yDiff: {
    "select": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0/children/0",
        "/ui5/ax/0"
      ],
      "reason": "React/DOM difference in select: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "select-a11y-description": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0"
      ],
      "reason": "React/DOM difference in select: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "select-a11y-description-ref": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0"
      ],
      "reason": "React/DOM difference in select: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "select-a11y-description-ref-rtl": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0"
      ],
      "reason": "React/DOM difference in select: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "select-a11y-description-rtl": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0"
      ],
      "reason": "React/DOM difference in select: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "select-a11y-groups": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0/children/0",
        "/ui5/ax/0"
      ],
      "reason": "React/DOM difference in select: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "select-a11y-groups-rtl": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0/children/0",
        "/ui5/ax/0"
      ],
      "reason": "React/DOM difference in select: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "select-a11y-name": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0"
      ],
      "reason": "React/DOM difference in select: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "select-a11y-name-ref": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0"
      ],
      "reason": "React/DOM difference in select: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "select-a11y-name-ref-rtl": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0"
      ],
      "reason": "React/DOM difference in select: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "select-a11y-name-rtl": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0"
      ],
      "reason": "React/DOM difference in select: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "select-critical": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0/children/0",
        "/ui5/ax/0"
      ],
      "reason": "React/DOM difference in select: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "select-disabled": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0/children/0",
        "/ui5/ax/0"
      ],
      "reason": "React/DOM difference in select: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "select-information": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0/children/0",
        "/ui5/ax/0"
      ],
      "reason": "React/DOM difference in select: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "select-negative": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0/children/0",
        "/ui5/ax/0"
      ],
      "reason": "React/DOM difference in select: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "select-positive": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0/children/0",
        "/ui5/ax/0"
      ],
      "reason": "React/DOM difference in select: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    }
  },
  cases: [
    ...(["name", "name-ref", "description", "description-ref"] as const).flatMap((channel) => [false, true].map((rtl) => ({ id: `select-a11y-${channel}${rtl ? "-rtl" : ""}`, props: { options: ["Germany", "France"], selected: "Germany", channel, rtl } }))),
    { id: "select-a11y-groups", props: { options: ["Germany", "France", "China"], selected: "Germany", groups: [["Germany", "France"], ["China"]] } },
    { id: "select-a11y-groups-rtl", props: { options: ["Germany", "France", "China"], selected: "Germany", groups: [["Germany", "France"], ["China"]], rtl: true } },
    { id: "select", props: { options: ["Germany", "France", "China"], selected: "Germany" } },
    ...states.map((valueState) => ({ id: `select-${valueState}`, props: { options: ["Germany", "France"], selected: "Germany", valueState } })),
    { id: "select-disabled", props: { options: ["Germany", "France"], selected: "Germany", disabled: true } },
  ],
  react: ({ options, selected, valueState, disabled, groups, channel, rtl }) => {
    const targetId = `select-a11y-${channel}${rtl ? "-rtl" : ""}-description-target`
    const attributes = {
      "aria-label": channel === "name" ? "Country" : channel === "name-ref" ? undefined : "Select",
      "aria-labelledby": channel === "name-ref" ? targetId : undefined,
      "aria-description": channel === "description" ? "Choose an office location" : undefined,
      "aria-describedby": channel === "description-ref" ? targetId : undefined,
    }
    const field: React.ReactNode = <>
      {channel && <span hidden id={targetId}>{channel.startsWith("name") ? "Country" : "Choose an office location"}</span>}
      <Select defaultValue={selected} disabled={disabled}>
        <SelectTrigger wrapperClassName="w-(--w)" valueState={valueState} valueStateMessage={null} disabled={disabled} {...attributes}><SelectValue /></SelectTrigger>
        <SelectContent>{groups ? groups.map((group, i) => <SelectGroup key={i}><SelectLabel>{`Region ${i + 1}`}</SelectLabel>{group.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectGroup>) : options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </>
    return rtl ? <span dir="rtl">{field}</span> : field
  },
})
