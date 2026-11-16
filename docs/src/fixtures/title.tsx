import { Title, type TitleLevel } from "@/components/ui/title"

import { defineFixtures } from "../fixture-types"

const levels = ["H1", "H2", "H3", "H4", "H5", "H6"] as const
type Props = { level: TitleLevel; size?: TitleLevel; text?: string; nowrap?: boolean; width?: string }

export default defineFixtures<Props>({
  name: "title",
  cases: ([
    ...levels.map((l) => ({ id: `title-${l.toLowerCase()}`, props: { level: l, size: l } })),
    { id: "title-default", props: { level: "H2" } },
    { id: "title-wrap", props: { level: "H3", size: "H4", text: "A long title that wraps onto a second line", width: "12rem" } },
    { id: "title-nowrap", props: { level: "H3", size: "H4", text: "A long title that is truncated", width: "12rem", nowrap: true } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "title-rtl" }] : [fixture]),
  react: ({ level, size, text, nowrap, width }) => (
    <Title level={level} size={size} wrappingType={nowrap ? "None" : "Normal"} style={width ? { width } : undefined}>
      {text ?? `Title ${size ?? "default"}`}
    </Title>
  ),
})
