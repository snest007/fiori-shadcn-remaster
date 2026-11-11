import * as React from "react"
import { createPortal } from "react-dom"

import { Button } from "@/components/ui/button"
import { ColorPalette, ColorPaletteItem } from "@/components/ui/color-palette"
import { paletteColors } from "../fixtures/color-palette"
import { defineDemo } from "./types"

function ShadowNames() {
  const [root, setRoot] = React.useState<ShadowRoot | null>(null)
  const mount = React.useCallback((node: HTMLDivElement | null) => {
    if (node) setRoot(node.shadowRoot ?? node.attachShadow({ mode: "open" }))
  }, [])
  return <>
    <span id="color-palette-root-label">Document label</span>
    <span id="color-palette-document-label">Document fallback</span>
    <div id="color-palette-shadow-host" ref={mount} />
    {root && createPortal(<>
      <ColorPalette id="color-palette-name-shadow" accessibleName="Direct shadow" accessibleNameRef="color-palette-root-label color-palette-document-label">
        <ColorPaletteItem value="red" /><ColorPaletteItem value="blue" />
      </ColorPalette>
      <span id="color-palette-root-label">Shadow label</span>
    </>, root)}
  </>
}

function NameExamples() {
  return <div id="color-palette-name-examples">
    <ColorPalette id="color-palette-name-both" accessibleName="Direct palette" accessibleNameRef="color-palette-name-label"><ColorPaletteItem value="red" /></ColorPalette>
    <ColorPalette id="color-palette-name-missing" accessibleName="Direct palette" accessibleNameRef="color-palette-absent-label"><ColorPaletteItem value="red" /></ColorPalette>
    <ColorPalette id="color-palette-name-empty" accessibleName="Direct palette" accessibleNameRef="color-palette-empty-label"><ColorPaletteItem value="red" /></ColorPalette>
    <ColorPalette id="color-palette-name-empty-ref" accessibleName="Direct palette" accessibleNameRef=""><ColorPaletteItem value="red" /></ColorPalette>
    <ColorPalette id="color-palette-name-spaces" accessibleName="Direct palette" accessibleNameRef="color-palette-leading-label color-palette-absent-label color-palette-trailing-label color-palette-absent-last"><ColorPaletteItem value="red" /></ColorPalette>
    <ColorPalette id="color-palette-name-whitespace-ref" accessibleName="Direct palette" accessibleNameRef=" "><ColorPaletteItem value="red" /></ColorPalette>
    <ColorPalette id="color-palette-name-root-aria" aria-label="Host label"><ColorPaletteItem value="red" /></ColorPalette>
    <ColorPalette id="color-palette-name-tab" accessibleName="Direct palette" accessibleNameRef={"color-palette-tab-first\tcolor-palette-tab-second"}><ColorPaletteItem value="red" /></ColorPalette>
    <span id="color-palette-name-label">Referenced palette</span><span id="color-palette-empty-label" />
    <span id="color-palette-leading-label">{" A "}</span><span id="color-palette-trailing-label">{"B  "}</span>
    <span id={"color-palette-tab-first\tcolor-palette-tab-second"}>Tab target</span>
    <span id="color-palette-tab-first">Wrong first</span><span id="color-palette-tab-second">Wrong second</span>
    <ShadowNames />
  </div>
}

function ColorPaletteDemo() {
  const [events, setEvents] = React.useState<string[]>([])
  const [count, setCount] = React.useState(15)
  const [showDefault, setShowDefault] = React.useState(true)
  const [mounted, setMounted] = React.useState(true)
  const [external, setExternal] = React.useState(false)
  const [hidden, setHidden] = React.useState(true)
  const [paletteClicks, setPaletteClicks] = React.useState<string[]>([])
  const [itemClicks, setItemClicks] = React.useState<string[]>([])
  const [emptyClicks, setEmptyClicks] = React.useState({ item: 0, parent: 0 })
  return <div id="color-palette-demo" className="flex flex-col items-start gap-4">
    <div className="flex gap-2">
      <Button id="color-palette-count" onClick={() => setCount(count === 15 ? 12 : count === 12 ? 3 : 15)}>Change color count</Button>
      <Button id="color-palette-default-toggle" onClick={() => setShowDefault(!showDefault)}>Toggle default</Button>
      <Button id="color-palette-remount" onClick={() => setMounted(!mounted)}>Toggle palette</Button>
      <Button id="color-palette-external" onClick={() => setExternal(!external)}>Toggle selected property</Button>
    </div>
    {mounted && <ColorPalette id="color-palette-control" showDefaultColor={showDefault} defaultColor="rgb(1, 2, 3)" showRecentColors showMoreColors
      onClick={(event) => setPaletteClicks((history) => [...history, (event.target as HTMLElement).dataset.slot === "color-palette-item" ? "host" : "inner"])}
      onItemClick={({ color }) => setEvents((history) => [...history, color])}>
      {paletteColors.slice(0, count).map((value, index) => <ColorPaletteItem key={index} value={value} selected={external && index === 7}
        onClick={(event) => setItemClicks((history) => [...history, `${index}:${(event.target as HTMLElement).dataset.slot === "color-palette-item" ? "host" : "inner"}`])} />)}
    </ColorPalette>}
    <output id="color-palette-events">{JSON.stringify(events)}</output>
    <output id="color-palette-click-events">{JSON.stringify({ palette: paletteClicks, item: itemClicks })}</output>
    <div id="color-palette-empty-item" onClick={() => setEmptyClicks((counts) => ({ ...counts, parent: counts.parent + 1 }))}>
      <ColorPaletteItem value="" onClick={() => setEmptyClicks((counts) => ({ ...counts, item: counts.item + 1 }))} />
    </div>
    <output id="color-palette-empty-click-events">{JSON.stringify(emptyClicks)}</output>
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
    <Button id="color-palette-hidden-toggle" onClick={() => setHidden(!hidden)}>Toggle hidden color</Button>
    <ColorPalette id="color-palette-hidden" onItemClick={({ color }) => setEvents((history) => [...history, color])}>
      <ColorPaletteItem value="red" selected />
      <ColorPaletteItem value="blue" selected hidden={hidden} />
      <ColorPaletteItem value="green" />
    </ColorPalette>
    <NameExamples />
  </div>
}

export default defineDemo({ title: "ColorPalette", order: 62, Demo: ColorPaletteDemo })
