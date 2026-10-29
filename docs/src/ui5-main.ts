// UI5 Web Components reference page: the official SAP implementation, used as the visual oracle.
// Renders every case from docs/src/fixtures/*.tsx with its sibling *.ui5.ts renderer.
// Registers themes (and i18n/CLDR) so setTheme can load sap_horizon_dark etc.
import "@ui5/webcomponents/dist/Assets.js"
import { setTheme } from "@ui5/webcomponents-base/dist/config/Theme.js"
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"

import { readPageOptions, type Ui5Renderer } from "./fixture-types"
import { fixtureSets } from "./fixtures"

const renderers = import.meta.glob<{ default: Ui5Renderer }>("./fixtures/*.ui5.ts", { eager: true })
const rendererFor = (name: string) => renderers[`./fixtures/${name}.ui5.ts`]?.default

const opts = readPageOptions()
await setTheme(opts.theme)
if (opts.density === "compact") document.body.setAttribute("data-ui5-compact-size", "")
document.body.style.cssText = "margin:0;padding:1rem;background:var(--sapBackgroundColor);font-family:var(--sapFontFamily)"

const root = document.getElementById("root")!
root.style.cssText = "display:flex;flex-wrap:wrap;gap:1rem;align-items:flex-start"
for (const set of fixtureSets) {
  const render = rendererFor(set.name)
  if (!render) continue
  for (const c of set.cases) {
    if (opts.only && !c.id.startsWith(opts.only)) continue
    if (set.skipCompare?.includes(c.id)) continue
    const cell = document.createElement("div")
    cell.dataset.fixture = c.id
    cell.style.cssText = "display:inline-flex;padding:0.25rem;line-height:normal"
    cell.append(render(c.props))
    root.append(cell)
  }
}

// Wait for every custom element to be defined and rendered, fonts loaded, and icons drawn
// (ui5-icon fills its <path> asynchronously).
const tags = new Set([...root.querySelectorAll("*")].map((e) => e.localName).filter((t) => t.includes("-")))
await Promise.all([...tags].map((t) => customElements.whenDefined(t)))
await renderFinished()
await document.fonts.ready
const shadowIcons = (node: ParentNode): Element[] =>
  [...node.querySelectorAll("*")].flatMap((e) => [
    ...(e.localName === "ui5-icon" || e.hasAttribute("ui5-icon") ? [e] : []),
    ...(e.shadowRoot ? shadowIcons(e.shadowRoot) : []),
  ])
const iconsDrawn = () => shadowIcons(root).every((i) => !i.getAttribute("name") || i.shadowRoot?.querySelector("path"))
for (let i = 0; i < 300 && !iconsDrawn(); i++) await new Promise((r) => requestAnimationFrame(r))
await renderFinished()
// setTheme resolves before the theme's CSS variables are applied; wait until the background is the theme's.
const EXPECTED_BG: Record<string, string> = { sap_horizon: "#f5f6f7", sap_horizon_dark: "#12171c", sap_horizon_hcb: "#000", sap_horizon_hcw: "#fff" }
const bg = () => getComputedStyle(document.documentElement).getPropertyValue("--sapBackgroundColor").trim().toLowerCase()
for (let i = 0; i < 300 && EXPECTED_BG[opts.theme] && bg() !== EXPECTED_BG[opts.theme]; i++)
  await new Promise((r) => requestAnimationFrame(r))
await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
document.documentElement.dataset.ready = "true"
