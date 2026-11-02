import * as React from "react"

import NoSearchResults from "@/lib/fiori-illustrations/NoSearchResults"
import UnableToLoad from "@/lib/fiori-illustrations/UnableToLoad"
import { Button } from "@/components/ui/button"
import { IllustratedMessage } from "@/components/ui/illustrated-message"
import { Slider } from "@/components/ui/slider"

import { defineDemo } from "./types"

function IllustratedMessageDemo() {
  const [width, setWidth] = React.useState(480)
  const [retries, setRetries] = React.useState(0)
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-4">
        <span className="text-(--sapContent_LabelColor)">Container width: {width}px</span>
        <Slider aria-label="Container width" className="w-64" min={120} max={760} step={10} value={width} onValueChange={setWidth} />
      </div>
      <div id="illustrated-message-auto" className="border border-dashed border-(--sapGroup_ContentBorderColor)" style={{ width }}>
        <IllustratedMessage illustration={NoSearchResults} />
      </div>
      <div id="illustrated-message-actions" className="w-[30rem]">
        <IllustratedMessage illustration={UnableToLoad} design="Dialog">
          <Button variant="emphasized" onClick={() => setRetries((n) => n + 1)}>Retry ({retries})</Button>
        </IllustratedMessage>
      </div>
    </div>
  )
}

export default defineDemo({ title: "IllustratedMessage", order: 60, Demo: IllustratedMessageDemo })
