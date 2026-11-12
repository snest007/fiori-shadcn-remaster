import { Button } from "@/components/ui/button"
import { HeroBanner } from "@/components/ui/hero-banner"

import { defineDemo } from "./types"

function HeroBannerDemo() {
  return (
    <div id="hero-banner-demo">
      {/* Inside <main>, so not a banner landmark. */}
      <HeroBanner
        landmarkRole="region"
        landmarkLabel="Welcome"
        overlineText="Good morning"
        headerText="Welcome back, Ann"
        actions={<Button variant="transparent">Customize</Button>}
        endContent={<div>3 approvals are waiting for you.</div>}
      >
        <div>Your team closed 12 orders this week.</div>
      </HeroBanner>
    </div>
  )
}

export default defineDemo({
  category: "Display",
  docs: [
    {
      name: "hero-banner",
      description: "Welcome banners with a heading, actions and optional secondary content.",
      props: [
        { name: "HeroBanner.headerText", type: "string", description: "Main banner heading." },
        { name: "HeroBanner.overlineText", type: "string", description: "Text above the heading." },
        { name: "HeroBanner.endContent", type: "ReactNode", description: "Secondary content column." },
        { name: "HeroBanner.columnsRatio", type: "Equal | FirstWider", description: "Relative widths of the two columns.", defaultValue: "FirstWider" },
        { name: "HeroBanner.actions", type: "ReactNode", description: "Banner action controls." },
        { name: "HeroBanner.actionsPlacement", type: "TopEnd | BottomStart", description: "Position of the action controls.", defaultValue: "TopEnd" },
        { name: "HeroBanner.landmarkRole", type: "React.AriaRole", description: "ARIA landmark role; use a named region inside main.", defaultValue: "banner" },
        { name: "HeroBanner.landmarkLabel", type: "string", description: "Accessible name of the landmark." },
      ],
    },
  ], title: "HeroBanner", order: 63, Demo: HeroBannerDemo })
