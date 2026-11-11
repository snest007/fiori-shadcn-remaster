import "@ui5/webcomponents/dist/ColorPalette.js"
import "@ui5/webcomponents/dist/ColorPaletteItem.js"
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"

import { defineUi5, h, type Ui5FixtureElement } from "../fixture-types"
import set, { paletteColors } from "./color-palette"

export default defineUi5(set, ({ count = 15, selected = [], defaultButton, recent, populate, emptySelected, tooltip }) => {
  const palette = h("ui5-color-palette", { "show-default-color": defaultButton, "default-color": "#003366", "show-recent-colors": recent },
    ...Array.from({ length: count }, (_, index) => h("ui5-color-palette-item", { value: paletteColors[index % 15], selected: selected.includes(index), tooltip: tooltip && index === 0 ? "Black" : undefined })),
    ...(emptySelected ? [h("ui5-color-palette-item", { value: "", selected: true })] : [])) as Ui5FixtureElement
  if (populate) palette.fixtureReady = (async () => {
    await renderFinished()
    const native = palette as typeof palette & { handleSelection: (item: HTMLElement) => void; _onDefaultColorClick: () => void }
    for (const index of [0, 2, 4]) { native.handleSelection(palette.children[index] as HTMLElement); await renderFinished() }
    native._onDefaultColorClick()
    await renderFinished()
    document.activeElement instanceof HTMLElement && document.activeElement.blur()
  })()
  return palette
})
