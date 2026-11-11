import "@ui5/webcomponents/dist/ColorPalette.js"
import "@ui5/webcomponents/dist/ColorPaletteItem.js"
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"

import { defineUi5, h, type Ui5FixtureElement } from "../fixture-types"
import set, { paletteColors } from "./color-palette"

export default defineUi5(set, ({ count = 15, selected = [], defaultButton, recent, populate, emptySelected, tooltip, hidden = [], toggledHidden }) => {
  const palette = h("ui5-color-palette", { "show-default-color": defaultButton, "default-color": "#003366", "show-recent-colors": recent },
    ...Array.from({ length: count }, (_, index) => h("ui5-color-palette-item", { value: paletteColors[index % 15], selected: selected.includes(index), hidden: hidden.includes(index), tooltip: tooltip && index === 0 ? "Black" : undefined })),
    ...(emptySelected ? [h("ui5-color-palette-item", { value: "", selected: true })] : [])) as Ui5FixtureElement
  if (populate || toggledHidden?.length) palette.fixtureReady = (async () => {
    await customElements.whenDefined(palette.localName)
    if (populate) {
      // Seed UI5's instance-local history without moving focus across shared reference fixtures.
      const native = palette as typeof palette & { _recentColors: string[]; _selectedColor: string }
      native._recentColors = [paletteColors[4], paletteColors[2], paletteColors[0]]
      native._selectedColor = paletteColors[4] // Decorated property schedules the updated recent row.
    }
    await renderFinished()
    for (const index of toggledHidden ?? []) (palette.children[index] as HTMLElement).hidden = true
    await renderFinished()
  })()
  return palette
})
