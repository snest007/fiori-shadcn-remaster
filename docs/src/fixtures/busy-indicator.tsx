import { BusyIndicator } from "@/components/ui/busy-indicator"

import { defineFixtures } from "../fixture-types"

type Props = { size?: "S" | "M" | "L"; text?: string; top?: boolean; content?: boolean }

// The dots animate forever; the visual test screenshots with animations:"disabled", which cancels
// the animation on both pages, so the frozen state is comparable.
export default defineFixtures<Props>({
  name: "busy-indicator",
  cases: ([
    { id: "busy-indicator-s", props: { size: "S" } },
    { id: "busy-indicator-m", props: { size: "M" } },
    { id: "busy-indicator-l", props: { size: "L" } },
    { id: "busy-indicator-text", props: { size: "M", text: "Loading data" } },
    { id: "busy-indicator-text-top", props: { size: "L", text: "Loading data", top: true } },
    { id: "busy-indicator-content", props: { size: "M", content: true } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "busy-indicator-rtl" }] : [fixture]),
  react: ({ size, text, top, content }) => (
    <BusyIndicator active delay={0} size={size} text={text} textPlacement={top ? "top" : "bottom"}>
      {content && <div style={{ width: "12rem", height: "5rem", background: "var(--sapGroup_ContentBackground)" }} />}
    </BusyIndicator>
  ),
})
