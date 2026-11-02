import * as React from "react"

import { Label } from "@/components/ui/label"
import { RatingIndicator } from "@/components/ui/rating-indicator"

import { defineDemo } from "./types"

function RatingIndicatorDemo() {
  const [value, setValue] = React.useState(3)
  return (
    <div className="grid max-w-md grid-cols-[auto_1fr] items-center gap-x-4">
      <Label showColon>Your rating</Label>
      <div className="flex items-center gap-4">
        <RatingIndicator id="rating-indicator-demo" value={value} onValueChange={setValue} aria-label="Your rating" />
        <span id="rating-indicator-demo-value" className="text-(--sapContent_LabelColor)">{value}</span>
      </div>
      <Label showColon>Read only</Label>
      <RatingIndicator id="rating-indicator-demo-ro" readOnly value={2.5} aria-label="Average" />
      <Label showColon>Display only</Label>
      <RatingIndicator displayOnly value={4} max={7} size="S" aria-label="Display only" />
    </div>
  )
}

export default defineDemo({ title: "RatingIndicator", order: 61, Demo: RatingIndicatorDemo })
