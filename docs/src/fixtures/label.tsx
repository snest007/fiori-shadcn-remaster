import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { defineFixtures } from "../fixture-types"

type Props = { text: string; required?: boolean; showColon?: boolean; customHost?: boolean }

const fixtureSet = defineFixtures<Props>({
  name: "label",
  cases: [
    { id: "label", props: { text: "Company name" } },
    { id: "label-required", props: { text: "Company name", required: true } },
    { id: "label-colon-required", props: { text: "Company name", required: true, showColon: true } },
  ],
  react: ({ text, required, showColon }) => <Label required={required} showColon={showColon}>{text}</Label>,
})


// E4: consumer host replacement changes the DOM host while the component keeps
// the owning semantics. The native renderer uses the same underlying state.
const baseCase = fixtureSet.cases[2]
export default {
  ...fixtureSet,
  cases: [...fixtureSet.cases, { id: "label-custom-host", props: { ...baseCase.props, customHost: true } }],
  react: (props: typeof baseCase.props & { customHost?: boolean }) => props.customHost ? <div className="flex flex-col"><Label asChild htmlFor="label-custom-host-input" id="label-owned-label" required showColon><label data-custom-host="label" htmlFor="wrong-field" tabIndex={13}>{props.text}</label></Label><Input id="label-custom-host-input" required /></div> : fixtureSet.react(props),
}
