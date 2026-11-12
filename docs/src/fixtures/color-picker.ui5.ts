import "@ui5/webcomponents/dist/ColorPicker.js"
import "@ui5/webcomponents/dist/features/ColorPaletteMoreColors.js"
import "@ui5/webcomponents/dist/ColorPaletteItem.js"
import "@ui5/webcomponents-icons/dist/resize-corner.js"
import "@ui5/webcomponents-icons/dist/expand.js"
import "@ui5/webcomponents-icons/dist/direction-arrows.js"
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import { defineUi5, h, type Ui5FixtureElement } from "../fixture-types"
import { placeInPlace } from "./ui5-popup-in-place"
import set from "./color-picker"

// UI5's alternate-theme initialization awaits styles outside Render.js's queue.
// Await the actual nested control before committing fixture state; renderFinished alone can precede it.
async function nestedControl(host: HTMLElement, selector: string): Promise<HTMLElement> {
  for (let frame = 0; frame < 300; frame++) {
    const control = host.shadowRoot?.querySelector<HTMLElement>(selector)
    if (control) return control
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  throw new Error(`${host.localName}: ${selector} was not rendered`)
}

export default defineUi5(set, ({ simplified, invalid, hsl, alpha, palette, dialog }) => {
  if (palette) {
    const native = h("ui5-color-palette", { "show-more-colors": true, "show-recent-colors": true }, h("ui5-color-palette-item", { value: "red" }), h("ui5-color-palette-item", { value: "blue" }))
    const frame = h("div", {}, native) as Ui5FixtureElement
    if (dialog) {
      frame.style.cssText = "overflow:hidden;padding:.75rem"
      // Neutralize anonymous inline baseline space around the relocated nested popup on both sides.
      native.style.display = "block"
      frame.fixtureReady = (async () => {
        await customElements.whenDefined(native.localName)
        await renderFinished()
        // The preloaded More Colors template retains its closed dialog. Compare its real styled surface in place.
        const popup = await nestedControl(native, "ui5-dialog")
        native.shadowRoot!.querySelector<HTMLElement>(".ui5-cp-root")!.style.display = "none"
        placeInPlace(popup)
        await renderFinished()
      })()
    }
    return frame
  }
  const picker = h("ui5-color-picker", { value: alpha ? "rgba(51, 102, 153, 0.5)" : "#336699", simplified }) as Ui5FixtureElement
  if (invalid || hsl) picker.fixtureReady = (async () => {
    await customElements.whenDefined(picker.localName)
    await renderFinished()
    if (hsl) (await nestedControl(picker, "#toggle-picker-mode")).click()
    if (invalid) {
      const input = await nestedControl(picker, "ui5-input") as HTMLElement & { value: string }
      input.value = "nothex"
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    }
    await renderFinished()
  })()
  return picker
})
