// UI5 popups (dialog, popover, toast, menu) render in the browser's top layer, positioned to the
// viewport, so they can't be screenshotted inside a fixture cell when opened. For the pixel comparison
// we keep them closed and display their surface in place: only display/position are overridden (and
// max-width/height, whose percentages refer to the viewport while the popup is fixed); everything that draws
// the surface (header/footer bars, padding, radius, shadow, colors) is UI5's own CSS.
// The overlay *behaviour* (opening, focus, Escape, placement) is tested in tests/<name>.spec.ts.
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"

export function placeInPlace(el: HTMLElement, display = "flex") {
  el.style.setProperty("display", display, "important")
  el.style.setProperty("position", "relative", "important")
  el.style.setProperty("inset", "auto", "important")
  el.style.setProperty("transform", "none", "important")
  if (el.localName !== "ui5-toast") {
    // ui5-toast's max-width is a fixed 15rem, the others are viewport-relative.
    el.style.setProperty("max-width", "none", "important")
    el.style.setProperty("max-height", "none", "important")
  }
}

/** Wraps the popup in a clipping frame (matching the React fixture) and shows it in place. */
export function showPopupInPlace(el: HTMLElement, display = "flex") {
  placeInPlace(el, display)
  const frame = document.createElement("div")
  frame.style.cssText = "overflow:hidden;padding:0.75rem"
  frame.append(el)
  return frame
}

/**
 * Same for a popup that lives in another element's shadow root (ui5-menu's popover). The renderer runs
 * before the host is connected, so wait (a few frames; ui5-main waits much longer before "ready").
 */
export function showShadowPopupInPlace(host: HTMLElement, selector: string, width?: string) {
  const apply = async (tries = 0): Promise<void> => {
    await renderFinished()
    const popup = host.shadowRoot?.querySelector<HTMLElement>(selector)
    if (popup) {
      placeInPlace(popup)
      if (width) popup.style.width = width
      return
    }
    if (tries > 100) throw new Error(`${host.localName}: ${selector} not found`)
    await new Promise((r) => requestAnimationFrame(r))
    return apply(tries + 1)
  }
  apply()
  const frame = document.createElement("div")
  frame.style.cssText = "overflow:hidden;padding:0.75rem"
  frame.append(host)
  return frame
}

/**
 * Body text for a popup. UI5 popups don't set a font size (content brings its own, e.g. ui5-text);
 * ours default to --sapFontSize, so the line box is wrapped at that size to compare like for like.
 */
export function body(text: string) {
  const div = document.createElement("div")
  div.style.fontSize = "var(--sapFontSize)"
  const t = document.createElement("ui5-text")
  t.textContent = text
  div.append(t)
  return div
}
