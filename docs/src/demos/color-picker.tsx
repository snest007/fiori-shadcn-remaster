import * as React from "react"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/ui/color-picker"
import { ColorPalette, ColorPaletteItem } from "@/components/ui/color-palette"
import { ColorPalettePopover } from "@/components/ui/color-palette-popover"
import { defineDemo } from "./types"

function ColorPickerDemo() {
  const [value, setValue] = React.useState("rgba(51, 102, 153, 0.5)")
  const [events, setEvents] = React.useState<string[]>([])
  const [open, setOpen] = React.useState(false)
  return <div id="color-picker-demo" className="flex flex-col items-start gap-4">
    <ColorPicker id="color-picker-control" value={value} onValueChange={setValue} />
    <output id="color-picker-value">{value}</output>
    <Button id="color-picker-reset" onClick={() => setValue("rgba(51, 102, 153, 0.5)")}>Reset color</Button>
    <ColorPicker id="color-picker-simplified-control" simplified defaultValue="red" />
    <ColorPalette id="color-picker-palette" showDefaultColor defaultColor="red" showMoreColors showRecentColors onItemClick={({ color }) => setEvents((history) => [...history, color])}>
      <ColorPaletteItem value="red" /><ColorPaletteItem value="blue" selected />
    </ColorPalette>
    <ColorPalette id="color-picker-palette-no-recents" showMoreColors onItemClick={({ color }) => setEvents((history) => [...history, color])}>
      <ColorPaletteItem value="red" /><ColorPaletteItem value="blue" selected />
    </ColorPalette>
    <Button id="color-picker-popover-opener" onClick={() => setOpen(!open)}>Open color palette</Button>
    <ColorPalettePopover id="color-picker-palette-popover" opener="color-picker-popover-opener" open={open} onOpenChange={setOpen} showMoreColors showRecentColors onItemClick={({ color }) => setEvents((history) => [...history, color])}>
      <ColorPaletteItem value="red" /><ColorPaletteItem value="blue" />
    </ColorPalettePopover>
    <output id="color-picker-palette-events">{JSON.stringify(events)}</output>
  </div>
}
export default defineDemo({ title: "ColorPicker", order: 62.1, Demo: ColorPickerDemo })
