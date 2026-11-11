import * as React from "react"

import { Button } from "@/components/ui/button"
import { ColorPalette, ColorPaletteItem } from "@/components/ui/color-palette"
import { paletteColors } from "../fixtures/color-palette"
import { defineDemo } from "./types"

function ColorPaletteDemo() {
  const [events, setEvents] = React.useState<string[]>([])
  const [count, setCount] = React.useState(15)
  const [showDefault, setShowDefault] = React.useState(true)
  const [mounted, setMounted] = React.useState(true)
  const [external, setExternal] = React.useState(false)
  return <div id="color-palette-demo" className="flex flex-col items-start gap-4">
    <div className="flex gap-2">
      <Button id="color-palette-count" onClick={() => setCount(count === 15 ? 12 : count === 12 ? 3 : 15)}>Change color count</Button>
      <Button id="color-palette-default-toggle" onClick={() => setShowDefault(!showDefault)}>Toggle default</Button>
      <Button id="color-palette-remount" onClick={() => setMounted(!mounted)}>Toggle palette</Button>
      <Button id="color-palette-external" onClick={() => setExternal(!external)}>Toggle selected property</Button>
    </div>
    {mounted && <ColorPalette id="color-palette-control" showDefaultColor={showDefault} defaultColor="rgb(1, 2, 3)" showRecentColors showMoreColors
      onItemClick={({ color }) => setEvents((history) => [...history, color])}>
      {paletteColors.slice(0, count).map((value, index) => <ColorPaletteItem key={index} value={value} selected={external && index === 7} />)}
    </ColorPalette>}
    <output id="color-palette-events">{JSON.stringify(events)}</output>
    <ColorPalette id="color-palette-identity" onItemClick={({ color }) => setEvents((history) => [...history, color])}>
      <ColorPaletteItem value="red" selected /><ColorPaletteItem value="red" selected />
      <ColorPaletteItem value="" /><ColorPaletteItem value="#ff0000" onClick={(event) => event.preventDefault()} tooltip="Canceled click" />
    </ColorPalette>
    <ColorPalette id="color-palette-fragments" onItemClick={({ color }) => setEvents((history) => [...history, color])}>
      <React.Fragment key="first">
        <ColorPaletteItem value="red" selected /><ColorPaletteItem value="green" />
      </React.Fragment>
      <React.Fragment key="second">
        <ColorPaletteItem value="red" selected /><ColorPaletteItem value="blue" />
      </React.Fragment>
    </ColorPalette>
  </div>
}

export default defineDemo({ title: "ColorPalette", order: 62, Demo: ColorPaletteDemo })
