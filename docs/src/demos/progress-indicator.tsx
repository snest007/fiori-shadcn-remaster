import * as React from "react"

import { Button } from "@/components/ui/button"
import { ProgressIndicator } from "@/components/ui/progress-indicator"

import { defineDemo } from "./types"

function ProgressIndicatorDemo() {
  const [value, setValue] = React.useState(30)
  return (
    <div className="grid max-w-md gap-2">
      <ProgressIndicator id="progress-indicator-demo" value={value} aria-label="Upload progress" />
      <ProgressIndicator value={70} valueState="positive" aria-label="Positive" />
      <ProgressIndicator value={45} valueState="negative" displayValue="Failed at 45%" aria-label="Negative" />
      <div className="flex gap-2">
        <Button id="progress-indicator-demo-inc" onClick={() => setValue((v) => Math.min(100, v + 10))}>+10%</Button>
        <Button onClick={() => setValue(0)}>Reset</Button>
      </div>
    </div>
  )
}

export default defineDemo({ title: "ProgressIndicator", order: 60, Demo: ProgressIndicatorDemo })
