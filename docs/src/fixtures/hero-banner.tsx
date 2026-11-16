import { Button } from "@/components/ui/button"
import { HeroBanner, type HeroBannerProps } from "@/components/ui/hero-banner"

import { defineFixtures } from "../fixture-types"

type Props = Pick<HeroBannerProps, "columnsRatio" | "actionsPlacement" | "headerBlockPlacement" | "overlineText"> & {
  width?: string
  start?: boolean
  end?: boolean
  actions?: boolean
}

export default defineFixtures<Props>({
  name: "hero-banner",
  cases: ([
    { id: "hero-banner-header", props: { overlineText: "Good morning" } },
    { id: "hero-banner-actions", props: { overlineText: "Good morning", actions: true } },
    { id: "hero-banner-actions-bottom", props: { actions: true, actionsPlacement: "BottomStart" } },
    { id: "hero-banner-start", props: { start: true } },
    { id: "hero-banner-two-columns", props: { start: true, end: true, actions: true } },
    { id: "hero-banner-equal", props: { start: true, end: true, columnsRatio: "Equal" } },
    { id: "hero-banner-end-bottom", props: { end: true, headerBlockPlacement: "Bottom", actions: true } },
    { id: "hero-banner-narrow", props: { width: "24rem", start: true, end: true, actions: true } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "hero-banner-rtl" }] : [fixture]),
  react: ({ width = "48rem", start, end, actions, ...props }) => (
    <HeroBanner
      {...props}
      headerText="Welcome back, Ann"
      style={{ width }}
      endContent={end ? <div>End content</div> : undefined}
      actions={actions ? <Button variant="transparent">Customize</Button> : undefined}
    >
      {start ? <div>Start content</div> : undefined}
    </HeroBanner>
  ),
})
