import * as React from "react"

import { Button } from "@/components/ui/button"
import { ColorPaletteItem } from "@/components/ui/color-palette"
import { ColorPalettePopover } from "@/components/ui/color-palette-popover"
import { paletteColors } from "../fixtures/color-palette"
import { defineDemo } from "./types"

function ColorPalettePopoverDemo() {
  const [open, setOpen] = React.useState(false)
  const [events, setEvents] = React.useState<string[]>([])
  const [showDefault, setShowDefault] = React.useState(true)
  const [count, setCount] = React.useState(15)
  const opener = React.useRef<HTMLButtonElement | null>(null)
  return <div id="color-palette-popover-demo" className="flex items-center gap-4">
    <Button id="color-palette-popover-opener" ref={opener} aria-expanded={open} onClick={() => setOpen(!open)}>Choose color</Button>
    <Button id="color-palette-popover-default-toggle" onClick={() => setShowDefault(!showDefault)}>Toggle default</Button>
    <Button id="color-palette-popover-count" onClick={() => setCount(count === 15 ? 12 : count === 12 ? 3 : 15)}>Change color count</Button>
    <ColorPalettePopover id="color-palette-popover-surface" open={open} opener={opener} onOpenChange={setOpen} showDefaultColor={showDefault}
      defaultColor="rgb(1, 2, 3)" showRecentColors showMoreColors onItemClick={({ color }) => setEvents((history) => [...history, color])}>
      {paletteColors.slice(0, count).map((value, index) => <ColorPaletteItem key={index} value={value} />)}
    </ColorPalettePopover>
    <output id="color-palette-popover-events">{JSON.stringify(events)}</output>
  </div>
}

export default defineDemo({ title: "ColorPalettePopover", order: 63, Demo: ColorPalettePopoverDemo })
