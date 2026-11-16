import { Text } from "@/components/ui/text"

import { defineFixtures } from "../fixture-types"

type Props = { maxLines?: number }
export const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam."

export default defineFixtures<Props>({
  name: "text",
  cases: ([
    { id: "text-default", props: {} },
    { id: "text-max-lines-1", props: { maxLines: 1 } },
    { id: "text-max-lines-2", props: { maxLines: 2 } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "text-rtl" }] : [fixture]),
  react: ({ maxLines }) => (
    <Text maxLines={maxLines} style={{ width: "14rem" }}>
      {LOREM}
    </Text>
  ),
})
