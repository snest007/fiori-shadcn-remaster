import * as React from "react"

import { Button } from "@/components/ui/button"
import { DynamicSideContent, type DynamicSideContentHandle } from "@/components/ui/dynamic-side-content"
import { Text } from "@/components/ui/text"

import { defineDemo } from "./types"

function DynamicSideContentDemo() {
  const ref = React.useRef<DynamicSideContentHandle>(null)
  const [width, setWidth] = React.useState(1100)
  const [bp, setBp] = React.useState("")
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {[600, 900, 1000, 1100].map((w) => (
          <Button key={w} aria-pressed={width === w} onClick={() => setWidth(w)}>
            {w}px
          </Button>
        ))}
        <Button onClick={() => ref.current?.toggleContents()}>Toggle contents</Button>
        <span className="text-(--sapContent_LabelColor)">
          Breakpoint: <span data-testid="dynamic-side-content-demo-bp">{bp}</span>
        </span>
      </div>
      <div className="overflow-x-auto">
        <div id="dynamic-side-content-demo" style={{ width, height: "10rem" }}>
          <DynamicSideContent
            ref={ref}
            onLayoutChange={(d) => setBp(d.currentBreakpoint)}
            // The docs page has its own <main>; keep the demo areas as named regions.
            accessibilityAttributes={{ mainContent: { role: "region" }, sideContent: { role: "region" } }}
            sideContent={
              <div className="h-full bg-(--sapList_SelectionBackgroundColor) p-4">
                <Text>Side content</Text>
              </div>
            }
          >
            <div className="h-full bg-(--sapGroup_ContentBackground) p-4">
              <Text>Main content</Text>
            </div>
          </DynamicSideContent>
        </div>
      </div>
    </div>
  )
}

export default defineDemo({ title: "DynamicSideContent", order: 73, Demo: DynamicSideContentDemo })
