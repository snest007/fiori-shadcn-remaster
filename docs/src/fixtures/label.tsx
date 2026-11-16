import { Label } from "@/components/ui/label"

import { defineFixtures } from "../fixture-types"

type Props = { text: string; required?: boolean; showColon?: boolean }

export default defineFixtures<Props>({
  name: "label",
  cases: ([
    { id: "label", props: { text: "Company name" } },
    { id: "label-required", props: { text: "Company name", required: true } },
    { id: "label-colon-required", props: { text: "Company name", required: true, showColon: true } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "label-rtl" }] : [fixture]),
  react: ({ text, required, showColon }) => <Label required={required} showColon={showColon}>{text}</Label>,
})
