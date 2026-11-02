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

export default defineDemo({ title: "HeroBanner", order: 63, Demo: HeroBannerDemo })
