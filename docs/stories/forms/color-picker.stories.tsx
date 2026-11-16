import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { ColorPicker, type ColorPickerProps } from "@/components/ui/color-picker"
import { ColorPalette, ColorPaletteItem } from "@/components/ui/color-palette"
import { fioriMeta } from "../_lib/meta"
import { DocsPage } from "../_lib/DocsPage"

type Args = ColorPickerProps & { initialMode?: "rgb" | "hsl"; invalidHex?: boolean }
const base = fioriMeta({ name: "color-picker", component: ColorPicker })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: function ComponentDocs() {
  const textKeys = [
  [
    "texts.picker",
    "COLORPICKER_LABEL",
    "Color Picker"
  ],
  [
    "texts.sliders",
    "COLORPICKER_SLIDER_GROUP",
    "Color Sliders"
  ],
  [
    "texts.hueSlider",
    "COLORPICKER_HUE_SLIDER",
    "Hue Slider"
  ],
  [
    "texts.alphaSlider",
    "COLORPICKER_ALPHA_SLIDER",
    "Alpha Slider"
  ],
  [
    "texts.sliderHandle",
    "SLIDER_ARIA_DESCRIPTION",
    "Slider handle"
  ],
  [
    "texts.hex",
    "COLORPICKER_HEX",
    "Hexadecimal"
  ],
  [
    "texts.red",
    "COLORPICKER_RED",
    "Red"
  ],
  [
    "texts.green",
    "COLORPICKER_GREEN",
    "Green"
  ],
  [
    "texts.blue",
    "COLORPICKER_BLUE",
    "Blue"
  ],
  [
    "texts.hue",
    "COLORPICKER_HUE",
    "Hue"
  ],
  [
    "texts.saturation",
    "COLORPICKER_SATURATION",
    "Saturation"
  ],
  [
    "texts.light",
    "COLORPICKER_LIGHT",
    "Light"
  ],
  [
    "texts.alpha",
    "COLORPICKER_ALPHA",
    "Alpha"
  ],
  [
    "texts.percentage",
    "COLORPICKER_PERCENTAGE",
    "%"
  ],
  [
    "texts.toggleMode",
    "COLORPICKER_TOGGLE_MODE_TOOLTIP",
    "Change Color Mode"
  ],
  [
    "texts.invalidEntry",
    "VALUE_STATE_ERROR",
    "Invalid entry"
  ],
  [
    "texts.modeChanged",
    "COLORPICKER_COLOR_MODE_CHANGED",
    "Color mode changed to {0}. Current values: {1}."
  ],
  [
    "texts.hexLabel",
    "ColorPickerTemplate.js channel label",
    "Hex"
  ],
  [
    "texts.redLabel",
    "ColorPickerTemplate.js channel label",
    "R"
  ],
  [
    "texts.greenLabel",
    "ColorPickerTemplate.js channel label",
    "G"
  ],
  [
    "texts.blueLabel",
    "ColorPickerTemplate.js channel label",
    "B"
  ],
  [
    "texts.hueLabel",
    "ColorPickerTemplate.js channel label",
    "H"
  ],
  [
    "texts.saturationLabel",
    "ColorPickerTemplate.js channel label",
    "S"
  ],
  [
    "texts.lightLabel",
    "ColorPickerTemplate.js channel label",
    "L"
  ],
  [
    "texts.alphaLabel",
    "ColorPickerTemplate.js channel label",
    "A"
  ]
] as const
  return <><DocsPage /><section aria-label="Localization text keys" className="sbdocs-content"><h2>Localization text keys</h2><p>Override these public text props in your application; CustomTexts demonstrates the supported API. Existing label props remain available.</p><table><thead><tr><th>Prop / key</th><th>UI5 key or source</th><th>English component default</th></tr></thead><tbody>{textKeys.map(([prop, key, value]) => <tr key={prop}><td><code>{prop}</code></td><td>{key}</td><td>{value}</td></tr>)}</tbody></table></section></>
} } },
  args: { value: "#336699", simplified: false, accessibleName: "Chart series color", initialMode: "rgb", invalidHex: false, onValueChange: fn() },
  argTypes: { ...base.argTypes, value: { control: "text" }, simplified: { control: "boolean" }, accessibleName: { control: "text" }, texts: { control: "object" }, initialMode: { control: "select", options: ["rgb", "hsl"], description: "Initial channel mode for this example; the component's own toggle remains live." }, invalidHex: { control: false }, onValueChange: { control: false } },
  render: function ChartColorPicker(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const ref = React.useRef<HTMLDivElement>(null)
    const { initialMode, invalidHex, ...props } = args
    React.useEffect(() => {
      const root = ref.current
      if (!root) return
      const toggle = root.querySelector<HTMLButtonElement>(".fiori-color-picker__toggle")
      const hueChannel = root.querySelector<HTMLInputElement>('input[aria-label="Hue"]')
      if (toggle && ((initialMode === "hsl") !== !!hueChannel)) toggle.click()
    }, [initialMode])
    React.useEffect(() => {
      const input = ref.current?.querySelector<HTMLInputElement>(".fiori-color-picker__hex input")
      if (!invalidHex || !input) return
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "nothex")
      input.dispatchEvent(new InputEvent("input", { bubbles: true }))
      const frame = requestAnimationFrame(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })))
      return () => cancelAnimationFrame(frame)
    }, [invalidHex])
    return <ColorPicker {...props} ref={ref} onValueChange={(value) => { args.onValueChange?.(value); updateArgs({ value }) }} />
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Simplified: Story = { args: { simplified: true } }
export const InvalidHex: Story = { args: { invalidHex: true } }
export const HSL: Story = { args: { initialMode: "hsl" } }
export const Alpha: Story = { args: { value: "rgba(51, 102, 153, 0.5)" } }
export const PaletteMoreColors: Story = { render: function PaletteColorChoice() {
  return <ColorPalette showMoreColors showRecentColors accessibleName="Chart series"><ColorPaletteItem value="red" /><ColorPaletteItem value="blue" /></ColorPalette>
} }
export const Trigger: Story = { render: function PickerTrigger() {
  return <ColorPalette showMoreColors accessibleName="Chart series"><ColorPaletteItem value="#336699" selected /><ColorPaletteItem value="#008000" /></ColorPalette>
} }
export const Open: Story = { parameters: { docs: { story: { inline: false, height: "660px" } } }, render: function OpenColorEditor() {
  const [open, setOpen] = React.useState(true)
  return <ColorPalette showMoreColors showRecentColors moreColorsOpen={open} onMoreColorsOpenChange={setOpen} accessibleName="Chart series"><ColorPaletteItem value="red" /><ColorPaletteItem value="blue" /></ColorPalette>
} }
export const CustomTexts: Story = { args: { texts: { picker: "Series color picker", sliders: "Series color sliders", hueSlider: "Series hue", alphaSlider: "Series opacity", hex: "Series hexadecimal color", toggleMode: "Switch series color channels", invalidEntry: "Enter a valid series color.", modeChanged: (mode, values) => `Series color uses ${mode}. Values: ${values}.` } } }
export const RTL: Story = { globals: { dir: "rtl" } }
