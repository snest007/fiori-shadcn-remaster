import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs, useRef } from "storybook/preview-api"
import { fn } from "storybook/test"
import { ColorPalettePopover, type ColorPalettePopoverProps } from "@/components/ui/color-palette-popover"
import { ColorPaletteItem } from "@/components/ui/color-palette"
import { Button } from "@/components/ui/button"
import { fioriMeta } from "../_lib/meta"
import { DocsPage } from "../_lib/DocsPage"

type Args = ColorPalettePopoverProps & { colors: string[]; hiddenIndices?: number[] }
const colors = ["#000000", "#993300", "#333300", "#003300", "#003366", "#000080", "#333399", "#333333", "#800000", "#ff6600", "#808000", "#008000", "#008080", "#0000ff", "#666699"]
const base = fioriMeta({ name: "color-palette-popover", component: ColorPalettePopover })
const meta = {
  ...base,
  args: { open: false, colors, placement: "Bottom", showDefaultColor: false, defaultColor: "#003366", showRecentColors: false, showMoreColors: false, popoverLabel: "Chart series color palette", onOpenChange: fn(), onItemClick: fn(), onMoreColorsOpenChange: fn() },
  argTypes: { ...base.argTypes,
    open: { control: "boolean" }, colors: { control: "object", description: "Application colors available in the popup." }, hiddenIndices: { control: "object", description: "Indices hidden by the application." }, placement: { control: "select", options: ["Bottom", "Top", "Start", "End", "Left", "Right"] }, popoverLabel: { control: "text" }, showDefaultColor: { control: "boolean" }, defaultColor: { control: "text" }, showRecentColors: { control: "boolean" }, showMoreColors: { control: "boolean" }, defaultColorText: { control: "text" }, moreColorsText: { control: "text" }, moreColorsDialogTitle: { control: "text" }, moreColorsOkText: { control: "text" }, moreColorsCancelText: { control: "text" }, containerLabel: { control: "text" }, colorLabel: { control: "text" }, accessibleName: { control: "text" }, accessibleNameRef: { control: false }, moreColorsOpen: { control: "boolean" }, colorPickerProps: { control: false }, moreColorsDialogProps: { control: false }, opener: { control: false, table: { disable: true } }, portal: { control: false, table: { disable: true } }, contentProps: { control: false, table: { disable: true } }, onOpenChange: { control: false }, onItemClick: { control: false }, onMoreColorsOpenChange: { control: false },
  },
  // Primary is also isolated: the open Control must never paint over a sibling docs example.
  parameters: { ...base.parameters, docs: { page: function ComponentDocs() {
  const textKeys = [
  [
    "defaultColorText",
    "COLOR_PALETTE_DEFAULT_COLOR_TEXT",
    "Default Color"
  ],
  [
    "moreColorsText",
    "COLOR_PALETTE_MORE_COLORS_TEXT",
    "More Colors..."
  ],
  [
    "moreColorsDialogTitle",
    "COLOR_PALETTE_DIALOG_TITLE",
    "Change Color"
  ],
  [
    "moreColorsOkText",
    "COLOR_PALETTE_DIALOG_OK_BUTTON",
    "OK"
  ],
  [
    "moreColorsCancelText",
    "COLOR_PALETTE_DIALOG_CANCEL_BUTTON",
    "Cancel"
  ],
  [
    "containerLabel",
    "COLORPALETTE_CONTAINER_LABEL",
    "Color Palette - Predefined Colors"
  ],
  [
    "colorLabel",
    "COLORPALETTE_COLOR_LABEL",
    "Color"
  ],
  [
    "popoverLabel",
    "COLORPALETTE_POPOVER_TITLE",
    "Color Palette"
  ],
  [
    "ColorPaletteItem.tooltip",
    "Caller-provided text",
    "Defaults to the item CSS color value"
  ]
] as const
  return <><DocsPage /><section aria-label="Localization text keys" className="sbdocs-content"><h2>Localization text keys</h2><p>Override these public text props in your application; CustomTexts demonstrates the supported API. Existing label props remain available.</p><table><thead><tr><th>Prop / key</th><th>UI5 key or source</th><th>English component default</th></tr></thead><tbody>{textKeys.map(([prop, key, value]) => <tr key={prop}><td><code>{prop}</code></td><td>{key}</td><td>{value}</td></tr>)}</tbody></table></section></>
}, story: { inline: false, height: "520px" } } },
  render: function ChartColorMenu(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const opener = useRef<HTMLButtonElement | null>(null)
    const { colors, hiddenIndices = [], ...props } = args
    return <div className="flex min-h-80 items-start justify-center gap-2"><Button ref={opener} onClick={() => updateArgs({ open: !args.open })}>Choose chart color</Button>
      <ColorPalettePopover {...props} opener={opener} onOpenChange={(open) => { args.onOpenChange?.(open); updateArgs({ open }) }}>
        {colors.map((value, index) => <ColorPaletteItem key={`${index}:${value}`} value={value} hidden={hiddenIndices.includes(index)} />)}
      </ColorPalettePopover>
    </div>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>

// Storybook Controls update the inline docs store; its isolated IFrame does not forward args.
export const Playground: Story = { parameters: { docs: { story: { inline: true } } } }
export const Trigger: Story = {}
export const Open: Story = { args: { open: true } }
export const DefaultAndRecent: Story = { args: { open: true, showDefaultColor: true, showRecentColors: true } }
export const Empty: Story = { args: { open: true, colors: [] } }
export const EmptyValue: Story = { args: { open: true, colors: [""] } }
export const HiddenOnly: Story = { args: { open: true, colors: ["red"], hiddenIndices: [0] } }
export const HiddenBeforeVisible: Story = { args: { open: true, colors: ["red", "blue"], hiddenIndices: [0] } }
export const MoreColors: Story = { args: { showMoreColors: true, showRecentColors: true } }
export const StartPlacement: Story = { args: { open: true, placement: "Start" } }
export const EndPlacement: Story = { args: { open: true, placement: "End" } }
export const CustomTexts: Story = { args: { open: true, showDefaultColor: true, showMoreColors: true, popoverLabel: "Choose a chart series color", defaultColorText: "Use the chart default", moreColorsText: "Choose another chart color", moreColorsDialogTitle: "Chart series color", moreColorsOkText: "Apply color", moreColorsCancelText: "Keep current color", containerLabel: "Chart palette", colorLabel: "Series color" } }
export const RTL: Story = { args: { open: true, placement: "Start" }, globals: { dir: "rtl" } }
