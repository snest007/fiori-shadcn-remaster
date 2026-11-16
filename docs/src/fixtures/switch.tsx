import { Switch } from "@/components/ui/switch"

import { defineFixtures } from "../fixture-types"

type Props = { checked?: boolean; design?: "textual" | "graphical"; textOn?: string; textOff?: string; disabled?: boolean; readOnly?: boolean }

const variants: [string, Props][] = [
  ["", {}],
  ["-text", { textOn: "On", textOff: "Off" }],
  ["-graphical", { design: "graphical" }],
]

export default defineFixtures<Props>({
  name: "switch",
  cases: ([
    ...variants.flatMap(([suffix, p]) => [
      { id: `switch${suffix}`, props: p },
      { id: `switch${suffix}-checked`, props: { ...p, checked: true } },
    ]),
    { id: "switch-disabled", props: { disabled: true } },
    { id: "switch-disabled-checked", props: { disabled: true, checked: true } },
    { id: "switch-text-disabled-checked", props: { textOn: "On", textOff: "Off", disabled: true, checked: true } },
    { id: "switch-graphical-disabled", props: { design: "graphical", disabled: true } },
    { id: "switch-readonly", props: { readOnly: true } },
    { id: "switch-readonly-checked", props: { readOnly: true, checked: true } },
    { id: "switch-text-readonly-checked", props: { textOn: "On", textOff: "Off", readOnly: true, checked: true } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "switch-rtl" }] : [fixture]),
  react: ({ checked, design, textOn, textOff, disabled, readOnly }) => (
    <Switch defaultChecked={checked} design={design} textOn={textOn} textOff={textOff} disabled={disabled} readOnly={readOnly} aria-label="Switch" />
  ),
})
