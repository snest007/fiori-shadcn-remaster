import * as React from "react"
import { ColorPalette, ColorPaletteItem } from "@/components/ui/color-palette"
import { ColorPicker } from "@/components/ui/color-picker"
import { defineFixtures } from "../fixture-types"

function PickerFixture({ simplified, invalid, hsl, alpha, palette, dialog }: { simplified?: boolean; invalid?: boolean; hsl?: boolean; alpha?: boolean; palette?: boolean; dialog?: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const root = ref.current!
    if (!root) return
    if (hsl) root.querySelector<HTMLButtonElement>('button')!.click()
    if (!invalid) return
    const input = root.querySelector<HTMLInputElement>('input')!
    // Apply the actual input/commit path without moving focus on the shared fixture page.
    input.value = "nothex"
    input.dispatchEvent(new InputEvent("input", { bubbles: true }))
    const frame = requestAnimationFrame(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })))
    return () => cancelAnimationFrame(frame)
  }, [invalid, hsl])
  if (palette) return <div style={dialog ? { overflow: "hidden", padding: ".75rem" } : undefined}>
    {dialog && <style>{".color-picker-dialog-fixture > .fiori-color-palette__root { display:none }"}</style>}
    <ColorPalette style={{ fontSize: "1rem", display: dialog ? "block" : undefined }} className={dialog ? "color-picker-dialog-fixture" : undefined} showMoreColors showRecentColors moreColorsOpen={dialog} moreColorsDialogProps={dialog ? { portal: false, onOpenAutoFocus: (event) => event.preventDefault() } : undefined}>
      <ColorPaletteItem value="red" /><ColorPaletteItem value="blue" />
    </ColorPalette>
  </div>
  return <ColorPicker ref={ref} defaultValue={alpha ? "rgba(51, 102, 153, 0.5)" : "#336699"} simplified={simplified} />
}
export default defineFixtures({
  name: "color-picker",
  cases: [
    { id: "color-picker", props: {} },
    { id: "color-picker-simplified", props: { simplified: true } },
    { id: "color-picker-invalid-hex", props: { invalid: true } },
    { id: "color-picker-hsl", props: { hsl: true } },
    { id: "color-picker-alpha", props: { alpha: true } },
    { id: "color-picker-palette-more", props: { palette: true } },
    { id: "color-picker-palette-dialog", props: { palette: true, dialog: true } },
  ],
  react: (props) => <PickerFixture {...props} />,
})
