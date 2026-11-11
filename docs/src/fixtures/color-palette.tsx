import * as React from "react"

import { ColorPalette, ColorPaletteItem } from "@/components/ui/color-palette"
import { defineFixtures } from "../fixture-types"

export const paletteColors = ["#000000", "#993300", "#333300", "#003300", "#003366", "#000080", "#333399", "#333333", "#800000", "#ff6600", "#808000", "#008000", "#008080", "#0000ff", "#666699"]
export type PaletteFixtureProps = { count?: number; selected?: number[]; defaultButton?: boolean; recent?: boolean; populate?: boolean; emptySelected?: boolean; tooltip?: boolean }

function PaletteFixture({ count = 15, selected = [], defaultButton, recent, populate, emptySelected, tooltip }: PaletteFixtureProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  React.useLayoutEffect(() => {
    if (!populate) return
    for (const index of [0, 2, 4]) ref.current?.querySelectorAll<HTMLElement>("[data-color-palette-area=main]")[index]?.click()
    ref.current?.querySelector<HTMLButtonElement>(".fiori-color-palette__default")?.click()
    document.activeElement instanceof HTMLElement && document.activeElement.blur()
  }, [populate])
  return <ColorPalette ref={ref} showDefaultColor={defaultButton} defaultColor="#003366" showRecentColors={recent}>
    {Array.from({ length: count }, (_, index) => <ColorPaletteItem key={index} value={paletteColors[index % 15]} selected={selected.includes(index)} tooltip={tooltip && index === 0 ? "Black" : undefined} />)}
    {emptySelected && <ColorPaletteItem value="" selected />}
  </ColorPalette>
}

export default defineFixtures<PaletteFixtureProps>({
  name: "color-palette",
  cases: [
    { id: "color-palette", props: {} },
    { id: "color-palette-default-recent", props: { defaultButton: true, recent: true } },
    { id: "color-palette-populated-recent", props: { defaultButton: true, recent: true, populate: true } },
    { id: "color-palette-selected", props: { selected: [0, 7] } },
    { id: "color-palette-single-row", props: { count: 3 } },
    { id: "color-palette-incomplete-row", props: { count: 12 } },
    { id: "color-palette-limit-hidden-selection", props: { count: 17, selected: [1, 16] } },
    { id: "color-palette-empty-selected", props: { emptySelected: true, selected: [1] } },
    { id: "color-palette-tooltip", props: { tooltip: true } },
  ],
  react: (props) => <PaletteFixture {...props} />,
})
