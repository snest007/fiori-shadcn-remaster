import "@ui5/webcomponents/dist/ColorPalettePopover.js"
import "@ui5/webcomponents/dist/ColorPaletteItem.js"
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"

import { defineUi5, h, type Ui5FixtureElement } from "../fixture-types"
import { paletteColors } from "./color-palette"
import { placeInPlace } from "./ui5-popup-in-place"
import set from "./color-palette-popover"

export default defineUi5(set, ({ recent, defaultButton, empty }) => {
  const host = h("ui5-color-palette-popover", { "show-recent-colors": recent, "show-default-color": defaultButton, "default-color": "#003366" },
    ...(!empty ? paletteColors.map((value) => h("ui5-color-palette-item", { value })) : empty === "empty" ? [] : empty === "empty-value"
      ? [h("ui5-color-palette-item", { value: "" })] : [h("ui5-color-palette-item", { value: "red", hidden: true }),
        ...(empty === "hidden-before-visible" ? [h("ui5-color-palette-item", { value: "blue" })] : [])]))
  const frame = document.createElement("div") as Ui5FixtureElement
  frame.style.cssText = "overflow:hidden;padding:.75rem"
  frame.append(host)
  // The closed native ResponsivePopover already contains the palette. Keep it in its own cell,
  // using only display/position overrides; no opening/focus side effects can dismiss another fixture.
  frame.fixtureReady = (async () => {
    await customElements.whenDefined(host.localName)
    // As in showShadowPopupInPlace, nondefault theme styles can delay the first shadow render.
    for (let frame = 0; frame <= 100; frame++) {
      await renderFinished()
      const popup = host.shadowRoot?.querySelector<HTMLElement>("ui5-responsive-popover")
      if (popup) { placeInPlace(popup); return }
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }
    throw new Error("color-palette-popover: native surface missing")
  })()
  return frame
})
