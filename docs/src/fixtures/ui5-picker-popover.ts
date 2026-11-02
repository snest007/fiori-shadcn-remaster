// Shows a UI5 picker's (closed) value-help popover in place, for the pixel comparison of the open surface.
// ui5-date-picker / ui5-time-picker / ui5-datetime-picker render their ResponsivePopover (with its calendar
// or clocks) in their shadow root even while closed. Like ui5-popup-in-place.ts, only display / position
// (and the viewport-relative max sizes) are overridden; the field next to it is hidden and the host's own
// field styles are neutralized so it is just a box around the popover. The picker re-renders its shadow
// DOM (dropping inline styles), so the overrides go in a stylesheet adopted by the shadow root; UI5
// re-assigns adoptedStyleSheets when the theme arrives, so that one root keeps our sheet at the end.
// Opening behaviour is tested in tests/<name>.spec.ts.
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"

const sheet = new CSSStyleSheet()
sheet.replaceSync(`
  [ui5-responsive-popover] { display: flex !important; position: relative !important; inset: auto !important;
    transform: none !important; max-width: none !important; max-height: none !important; }
  .ui5-date-picker-root, .ui5-time-picker-root { display: none !important; }
`)

export function showPickerPopoverInPlace(host: HTMLElement) {
  host.style.cssText = "display:block;height:auto;min-width:0;margin:0;background:none;border-radius:0;box-shadow:none"
  const apply = async (tries = 0): Promise<void> => {
    if (tries === 0) await customElements.whenDefined(host.localName)
    const root = host.shadowRoot
    if (root) {
      const desc = Object.getOwnPropertyDescriptor(ShadowRoot.prototype, "adoptedStyleSheets")
        ?? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ShadowRoot.prototype), "adoptedStyleSheets")!
      Object.defineProperty(root, "adoptedStyleSheets", {
        configurable: true,
        get: () => desc.get!.call(root),
        set: (v: CSSStyleSheet[]) => desc.set!.call(root, [...v.filter((x) => x !== sheet), sheet]),
      })
      root.adoptedStyleSheets = [...root.adoptedStyleSheets]
      // Time clocks fade in on first render; UI5 skips that when its popover opens (_skipAnimation).
      customElements.whenDefined("ui5-time-selection-clocks").then(async () => {
        await renderFinished()
        const clocks = root.querySelector("[ui5-time-selection-clocks]") as (HTMLElement & { _skipAnimation: boolean }) | null
        if (clocks) clocks._skipAnimation = true
      })
      return
    }
    if (tries > 100) throw new Error(`${host.localName}: no shadow root`)
    await new Promise((r) => setTimeout(r))
    return apply(tries + 1)
  }
  apply()
  const frame = document.createElement("div")
  frame.style.cssText = "overflow:hidden;padding:0.75rem"
  frame.append(host)
  return frame
}
