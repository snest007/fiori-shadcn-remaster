import { ExpandableText, type ExpandableTextProps } from "@/components/ui/expandable-text"

import { defineFixtures } from "../fixture-types"

export const LONG_TEXT =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris."

type Props = Pick<ExpandableTextProps, "maxCharacters" | "overflowMode" | "emptyIndicatorMode"> & { text?: string; expanded?: boolean }

export default defineFixtures<Props>({
  name: "expandable-text",
  cases: ([
    { id: "expandable-text-collapsed", props: { text: LONG_TEXT } },
    { id: "expandable-text-expanded", props: { text: LONG_TEXT, expanded: true } },
    { id: "expandable-text-short", props: { text: "Short text." } },
    { id: "expandable-text-max-characters", props: { text: LONG_TEXT, maxCharacters: 30 } },
    { id: "expandable-text-popover", props: { text: LONG_TEXT, overflowMode: "Popover" } },
    { id: "expandable-text-empty", props: { emptyIndicatorMode: "On" } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "expandable-text-rtl" }] : [fixture]),
  react: ({ expanded, ...props }) => <ExpandableText {...props} defaultExpanded={expanded} style={{ width: "24rem" }} />,
})
