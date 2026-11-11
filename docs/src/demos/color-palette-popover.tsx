import * as React from "react"
import { createPortal } from "react-dom"

import { Button } from "@/components/ui/button"
import { ColorPaletteItem } from "@/components/ui/color-palette"
import { ColorPalettePopover } from "@/components/ui/color-palette-popover"
import { paletteColors } from "../fixtures/color-palette"
import { defineDemo } from "./types"

function ShadowOpenerExample() {
  const [root, setRoot] = React.useState<ShadowRoot | null>(null)
  const [open, setOpen] = React.useState(false)
  const [events, setEvents] = React.useState<string[]>([])
  const opener = React.useRef<HTMLButtonElement | null>(null)
  const mount = React.useCallback((node: HTMLDivElement | null) => {
    if (node) setRoot(node.shadowRoot ?? node.attachShadow({ mode: "open" }))
  }, [])
  return <div id="color-palette-popover-shadow-example">
    <div id="color-palette-popover-shadow-host" ref={mount} />
    {root && createPortal(<button id="color-palette-popover-shadow-opener" ref={opener} onClick={() => setOpen(true)}>Choose shadow color</button>, root)}
    <ColorPalettePopover id="color-palette-popover-shadow-surface" opener={opener} open={open} onOpenChange={setOpen}
      onItemClick={({ color }) => setEvents((history) => [...history, color])}>
      <ColorPaletteItem value="red" /><ColorPaletteItem value="blue" />
    </ColorPalettePopover>
    <output id="color-palette-popover-shadow-events">{JSON.stringify(events)}</output>
  </div>
}

function LogicalPlacementExample() {
  const [open, setOpen] = React.useState(false)
  const [rtl, setRtl] = React.useState(false)
  const [placement, setPlacement] = React.useState<"Start" | "End" | "Left" | "Right">("Start")
  const opener = React.useRef<HTMLButtonElement | null>(null)
  return <div id="color-palette-popover-placement-example" dir={rtl ? "rtl" : "ltr"}>
    <Button id="color-palette-popover-placement-opener" ref={opener} dir="ltr" onClick={() => setOpen(true)}>Choose positioned color</Button>
    <Button id="color-palette-popover-placement-direction" onClick={() => setRtl(!rtl)}>Toggle placement direction</Button>
    <Button id="color-palette-popover-placement-value" onClick={() => setPlacement((value) => ({ Start: "End", End: "Left", Left: "Right", Right: "Start" } as const)[value])}>Change placement</Button>
    <ColorPalettePopover id="color-palette-popover-placement-surface" opener={opener} open={open} onOpenChange={setOpen} placement={placement}>
      <ColorPaletteItem value="red" /><ColorPaletteItem value="blue" />
    </ColorPalettePopover>
    <output id="color-palette-popover-placement-state">{`${rtl ? "rtl" : "ltr"}:${placement}`}</output>
  </div>
}

function OpenerLifecycleExample() {
  const [open, setOpen] = React.useState(false)
  const [present, setPresent] = React.useState(false)
  const [openerMode, setOpenerMode] = React.useState(0)
  const [count, setCount] = React.useState(2)
  const [changes, setChanges] = React.useState<boolean[]>([])
  const [events, setEvents] = React.useState<string[]>([])
  const opener = React.useRef<HTMLButtonElement | null>(null)
  const changeOpen = React.useCallback((next: boolean) => { setOpen(next); setChanges((history) => [...history, next]) }, [])
  return <div id="color-palette-popover-lifecycle-example">
    <Button id="color-palette-popover-lifecycle-request" onClick={() => setOpen(true)}>Request palette</Button>
    <Button id="color-palette-popover-lifecycle-presence" onClick={() => setPresent(!present)}>Toggle opener</Button>
    <Button id="color-palette-popover-lifecycle-clear" onClick={() => setOpenerMode((value) => (value + 1) % 3)}>Change opener reference</Button>
    <Button id="color-palette-popover-lifecycle-count" onClick={() => setCount(count === 2 ? 7 : 2)}>Resize active palette</Button>
    <div id="color-palette-popover-lifecycle-scroll">
      {present && <Button id="color-palette-popover-lifecycle-opener" ref={opener} onClick={() => setOpen(true)}>Choose lifecycle color</Button>}
      <div id="color-palette-popover-lifecycle-spacer" />
    </div>
    <ColorPalettePopover id="color-palette-popover-lifecycle-surface" opener={openerMode === 1 ? null : openerMode === 2 ? "color-palette-popover-lifecycle-missing" : opener} open={open} onOpenChange={changeOpen}
      onItemClick={({ color }) => setEvents((history) => [...history, color])}>
      {["red", "blue", "green", "black", "yellow", "orange", "purple"].slice(0, count).map((value) => <ColorPaletteItem key={value} value={value} />)}
    </ColorPalettePopover>
    <output id="color-palette-popover-lifecycle-state">{JSON.stringify({ open, changes, events })}</output>
  </div>
}

function ClosedCommitExample() {
  const [open, setOpen] = React.useState(false)
  const [recent, setRecent] = React.useState(true)
  const [selected, setSelected] = React.useState(false)
  const [events, setEvents] = React.useState<string[]>([])
  const opener = React.useRef<HTMLButtonElement | null>(null)
  return <div id="color-palette-popover-closed-example">
    <Button id="color-palette-popover-closed-opener" ref={opener} onClick={() => setOpen(true)}>Choose retained color</Button>
    <Button id="color-palette-popover-closed-recent" onClick={() => setRecent(!recent)}>Toggle closed recent row</Button>
    <Button id="color-palette-popover-closed-selected" onClick={() => setSelected(!selected)}>Toggle closed main declaration</Button>
    <ColorPalettePopover id="color-palette-popover-closed-surface" open={open} opener={opener} onOpenChange={setOpen} showRecentColors={recent}
      onItemClick={({ color }) => setEvents((history) => [...history, color])}>
      <ColorPaletteItem value="red" /><ColorPaletteItem value="blue" selected={selected} />
    </ColorPalettePopover>
    <output id="color-palette-popover-closed-events">{JSON.stringify(events)}</output>
  </div>
}

function ForceMountExample() {
  const [mounted, setMounted] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [events, setEvents] = React.useState<string[]>([])
  const [autoFocus, setAutoFocus] = React.useState<string[]>([])
  const [, sample] = React.useReducer((value) => value + 1, 0)
  const opener = React.useRef<HTMLButtonElement | null>(null)
  const objectRef = React.useRef<HTMLDivElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const callbackNode = React.useRef<HTMLDivElement | null>(null)
  const counts = React.useRef({ mounts: 0, cleanups: 0 })
  const callbackRef = React.useCallback((node: HTMLDivElement | null) => {
    callbackNode.current = node
    if (node) { counts.current.mounts++; return () => { counts.current.cleanups++; callbackNode.current = null } }
  }, [])
  return <div id="color-palette-popover-force-example">
    <Button id="color-palette-popover-force-mount" onClick={() => setMounted(!mounted)}>Toggle retained surface</Button>
    <Button id="color-palette-popover-force-opener" ref={opener} onClick={() => setOpen(true)}><span id="color-palette-popover-force-opener-label">Choose retained surface color</span></Button>
    <Button id="color-palette-popover-force-sample" onClick={sample}>Read retained refs</Button>
    {mounted && <ColorPalettePopover id="color-palette-popover-force-surface" portal={false} open={open} opener={opener} onOpenChange={setOpen}
      contentProps={{ forceMount: true, ref: contentRef, role: "region", "aria-description": "Retained content API", style: { opacity: 1 },
        onOpenAutoFocus: () => setAutoFocus((history) => [...history, "open"]), onCloseAutoFocus: () => setAutoFocus((history) => [...history, "close"]) }}
      onItemClick={({ color }) => setEvents((history) => [...history, color])}>
      <ColorPaletteItem id="color-palette-popover-force-object" ref={objectRef} value="red" />
      <ColorPaletteItem id="color-palette-popover-force-callback" ref={callbackRef} value="blue" />
    </ColorPalettePopover>}
    <output id="color-palette-popover-force-state">{JSON.stringify({ object: objectRef.current?.id ?? null, callback: callbackNode.current?.id ?? null, ...counts.current, events, autoFocus })}</output>
    <output id="color-palette-popover-force-content-ref">{contentRef.current?.id ?? "none"}</output>
  </div>
}

function RetainedShadowOpenerExample() {
  const [root, setRoot] = React.useState<ShadowRoot | null>(null)
  const [open, setOpen] = React.useState(false)
  const [preventOutside, setPreventOutside] = React.useState(true)
  const [changes, setChanges] = React.useState<boolean[]>([])
  const [outside, setOutside] = React.useState<{ phase: string; defaultPrevented: boolean }[]>([])
  const [escapePrevented, setEscapePrevented] = React.useState<boolean | null>(null)
  const opener = React.useRef<HTMLButtonElement | null>(null)
  const mount = React.useCallback((node: HTMLDivElement | null) => {
    if (node) setRoot(node.shadowRoot ?? node.attachShadow({ mode: "open" }))
  }, [])
  return <div id="color-palette-popover-force-shadow-example">
    <div id="color-palette-popover-force-shadow-host" ref={mount} />
    {root && createPortal(<button id="color-palette-popover-force-shadow-opener" ref={opener} onClick={() => setOpen(true)}>
      <span id="color-palette-popover-force-shadow-label">Choose retained shadow color</span>
    </button>, root)}
    <Button id="color-palette-popover-force-shadow-guard" onClick={() => setPreventOutside(!preventOutside)}>Toggle outside prevention</Button>
    <Button id="color-palette-popover-force-shadow-outside">Outside retained shadow surface</Button>
    <input id="color-palette-popover-force-shadow-escape-input" aria-label="Independent Escape control" defaultValue="edited" onKeyDown={(event) => {
      if (event.key === "Escape") { setEscapePrevented(event.defaultPrevented); if (!event.defaultPrevented) event.currentTarget.value = "restored" }
    }} />
    <output id="color-palette-popover-force-shadow-escape-state">{JSON.stringify(escapePrevented)}</output>
    <ColorPalettePopover id="color-palette-popover-force-shadow-surface" portal={false} opener={opener} open={open}
      onOpenChange={(next) => { setOpen(next); setChanges((history) => [...history, next]) }}
      contentProps={{ forceMount: true, onPointerDownOutside: (event) => {
        if (preventOutside) event.preventDefault()
        setOutside((history) => [...history, { phase: "pointerdown", defaultPrevented: event.defaultPrevented }])
      }, onInteractOutside: (event) => setOutside((history) => [...history, { phase: "interact", defaultPrevented: event.defaultPrevented }]) }}>
      <ColorPaletteItem value="red" /><ColorPaletteItem value="blue" />
    </ColorPalettePopover>
    <output id="color-palette-popover-force-shadow-state">{JSON.stringify({ open, changes, outside })}</output>
  </div>
}

function ColorPalettePopoverDemo() {
  const [open, setOpen] = React.useState(false)
  const [events, setEvents] = React.useState<string[]>([])
  const [showDefault, setShowDefault] = React.useState(true)
  const [count, setCount] = React.useState(15)
  const [nameCase, setNameCase] = React.useState(0)
  const opener = React.useRef<HTMLButtonElement | null>(null)
  return <div id="color-palette-popover-demo" className="flex flex-col items-start gap-4">
    <Button id="color-palette-popover-opener" ref={opener} aria-expanded={open} onClick={() => setOpen(!open)}>Choose color</Button>
    <Button id="color-palette-popover-default-toggle" onClick={() => setShowDefault(!showDefault)}>Toggle default</Button>
    <Button id="color-palette-popover-count" onClick={() => setCount(count === 15 ? 12 : count === 12 ? 3 : 15)}>Change color count</Button>
    <Button id="color-palette-popover-name-case" onClick={() => setNameCase((value) => (value + 1) % 4)}>Change palette name</Button>
    <ColorPalettePopover id="color-palette-popover-surface" open={open} opener={opener} onOpenChange={setOpen} showDefaultColor={showDefault}
      accessibleName="Direct popup" accessibleNameRef={["color-palette-popover-name-label", "color-palette-popover-absent-label", "color-palette-popover-empty-label", ""][nameCase]}
      defaultColor="rgb(1, 2, 3)" showRecentColors showMoreColors onItemClick={({ color }) => setEvents((history) => [...history, color])}>
      {paletteColors.slice(0, count).map((value, index) => <ColorPaletteItem key={index} value={value} />)}
    </ColorPalettePopover>
    <span id="color-palette-popover-name-label">{" Popup target "}</span><span id="color-palette-popover-empty-label" />
    <output id="color-palette-popover-events">{JSON.stringify(events)}</output>
    <ShadowOpenerExample /><LogicalPlacementExample /><OpenerLifecycleExample /><ClosedCommitExample /><ForceMountExample /><RetainedShadowOpenerExample />
  </div>
}

export default defineDemo({ title: "ColorPalettePopover", order: 63, Demo: ColorPalettePopoverDemo })
