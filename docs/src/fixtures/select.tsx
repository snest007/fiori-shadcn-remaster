import type { ValueState } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { defineFixtures } from "../fixture-types"

type Props = { options: string[]; selected: string; valueState?: ValueState; disabled?: boolean }
const states = ["negative", "critical", "positive", "information"] as const

export default defineFixtures<Props>({
  name: "select",
  cases: ([
    { id: "select", props: { options: ["Germany", "France", "China"], selected: "Germany" } },
    ...states.map((valueState) => ({ id: `select-${valueState}`, props: { options: ["Germany", "France"], selected: "Germany", valueState } })),
    { id: "select-disabled", props: { options: ["Germany", "France"], selected: "Germany", disabled: true } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "select-rtl" }] : [fixture]),
  react: ({ options, selected, valueState, disabled }) => (
    <Select defaultValue={selected} disabled={disabled}>
      <SelectTrigger wrapperClassName="w-(--w)" valueState={valueState} valueStateMessage={null} disabled={disabled} aria-label="Select">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  ),
})
