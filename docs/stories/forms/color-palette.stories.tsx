import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { ColorPalette, ColorPaletteItem, ColorPaletteStateProvider, ColorPaletteStateContext, type ColorPaletteProps } from "@/components/ui/color-palette"
import { fioriMeta } from "../_lib/meta"
import { DocsPage } from "../_lib/DocsPage"

type Args = ColorPaletteProps & { colors: string[]; selectedIndices: number[]; hiddenIndices: number[]; recentColors?: string[]; tooltip?: string; toggleHidden?: boolean }
// These are user-supplied color values, not theme or component design values.
const colors = ["#000000", "#993300", "#333300", "#003300", "#003366", "#000080", "#333399", "#333333", "#800000", "#ff6600", "#808000", "#008000", "#008080", "#0000ff", "#666699"]
function RecentHistory({ values }: { values: string[] }) {
  const state = React.useContext(ColorPaletteStateContext)
  React.useLayoutEffect(() => { state?.setRecent(values) }, [state?.setRecent, values])
  return null
}
const base = fioriMeta({ name: "color-palette", component: ColorPalette })
const meta = {
  ...base,
  args: { colors, selectedIndices: [], hiddenIndices: [], showDefaultColor: false, defaultColor: "#003366", showRecentColors: false, showMoreColors: false, accessibleName: "Chart series colors", onItemClick: fn(), onMoreColorsOpenChange: fn() },
  argTypes: { ...base.argTypes,
    colors: { control: "object", description: "Application color values shown as palette items." }, selectedIndices: { control: "object", description: "Initial selected palette item indices." }, hiddenIndices: { control: "object", description: "Palette items hidden by the application." }, recentColors: { control: "object", description: "Seed component-local recent colors for this example." }, tooltip: { control: "text", description: "Custom tooltip for the first swatch." }, toggleHidden: { control: false }, showDefaultColor: { control: "boolean" }, defaultColor: { control: "text" }, showRecentColors: { control: "boolean" }, showMoreColors: { control: "boolean" }, moreColorsOpen: { control: "boolean" }, defaultColorText: { control: "text" }, moreColorsText: { control: "text" }, moreColorsDialogTitle: { control: "text" }, moreColorsOkText: { control: "text" }, moreColorsCancelText: { control: "text" }, containerLabel: { control: "text" }, colorLabel: { control: "text" }, accessibleName: { control: "text" }, accessibleNameRef: { control: false }, popupMode: { control: false, table: { disable: true } }, moreColorsDialogProps: { control: false }, colorPickerProps: { control: false }, onItemClick: { control: false }, onMoreColorsOpenChange: { control: false },
  },
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
    "ColorPaletteItem.tooltip",
    "Caller-provided text",
    "Defaults to the item CSS color value"
  ]
] as const
  return <><DocsPage /><section aria-label="Localization text keys" className="sbdocs-content"><h2>Localization text keys</h2><p>Override these public text props in your application; CustomTexts demonstrates the supported API. Existing label props remain available.</p><table><thead><tr><th>Prop / key</th><th>UI5 key or source</th><th>English component default</th></tr></thead><tbody>{textKeys.map(([prop, key, value]) => <tr key={prop}><td><code>{prop}</code></td><td>{key}</td><td>{value}</td></tr>)}</tbody></table></section></>
}, story: { inline: false, height: "600px" } } },
  render: function ChartColors(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const { colors, selectedIndices, hiddenIndices, recentColors, tooltip, toggleHidden, ...props } = args
    const [hidden, setHidden] = React.useState<number[]>(hiddenIndices)
    React.useEffect(() => setHidden(hiddenIndices), [hiddenIndices])
    React.useEffect(() => { if (toggleHidden) setHidden([1]) }, [toggleHidden])
    return <ColorPaletteStateProvider>{recentColors && <RecentHistory values={recentColors} />}<ColorPalette {...props} onMoreColorsOpenChange={(moreColorsOpen) => { args.onMoreColorsOpenChange?.(moreColorsOpen); updateArgs({ moreColorsOpen }) }} key={selectedIndices.join("|")}>
      {colors.map((value, index) => <ColorPaletteItem key={`${index}:${value}`} value={value} selected={selectedIndices.includes(index)} hidden={hidden.includes(index)} tooltip={index === 0 ? tooltip : undefined} />)}
    </ColorPalette></ColorPaletteStateProvider>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const DefaultAndRecent: Story = { args: { showDefaultColor: true, showRecentColors: true } }
export const PopulatedRecent: Story = { args: { showDefaultColor: true, showRecentColors: true, recentColors: ["#003366", "#333300", "#000000"] } }
export const Selected: Story = { args: { selectedIndices: [0, 7] } }
export const SingleRow: Story = { args: { colors: colors.slice(0, 3) } }
export const IncompleteRow: Story = { args: { colors: colors.slice(0, 12) } }
export const LimitHiddenSelection: Story = { args: { colors: [...colors, "red", "blue"], selectedIndices: [1, 16] } }
export const Empty: Story = { args: { colors: [] } }
export const EmptySelected: Story = { args: { colors: [...colors, ""], selectedIndices: [1, 15] } }
export const Tooltip: Story = { args: { tooltip: "Black" } }
export const Hidden: Story = { args: { colors: colors.slice(0, 6), selectedIndices: [0, 1], hiddenIndices: [1] } }
export const ToggledHidden: Story = { args: { colors: colors.slice(0, 6), selectedIndices: [0, 1], toggleHidden: true } }
export const MoreColors: Story = { args: { showMoreColors: true, showRecentColors: true } }
export const Open: Story = { args: { showMoreColors: true, showRecentColors: true, moreColorsOpen: true }, parameters: { docs: { story: { inline: false, height: "660px" } } } }
export const CustomTexts: Story = { args: { showDefaultColor: true, showMoreColors: true, defaultColorText: "Use the chart default", moreColorsText: "Choose another chart color", moreColorsDialogTitle: "Chart series color", moreColorsOkText: "Apply color", moreColorsCancelText: "Keep current color", containerLabel: "Chart palette", colorLabel: "Series color", colorPickerProps: { texts: { picker: "Chart color picker", toggleMode: "Switch chart color channels" } } } }
export const RTL: Story = { globals: { dir: "rtl" } }
