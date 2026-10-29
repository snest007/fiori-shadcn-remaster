// UI5 Web Components reference renderer: the official SAP implementation, used as the visual oracle.
import "@ui5/webcomponents/dist/Assets.js"
import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents/dist/Label.js"
import "@ui5/webcomponents/dist/Input.js"
import "@ui5/webcomponents/dist/Select.js"
import "@ui5/webcomponents/dist/Option.js"
// Icons used by fixtures; imported directly so they register synchronously (AllIcons loads lazily).
import "@ui5/webcomponents-icons/dist/add.js"
import "@ui5/webcomponents-icons/dist/edit.js"
import { setTheme } from "@ui5/webcomponents-base/dist/config/Theme.js"

import { FIELD_WIDTH, fixtures, readPageOptions, type Fixture } from "./fixtures"

const opts = readPageOptions()
const pascal = (s: string) => s[0].toUpperCase() + s.slice(1)

function render(f: Fixture): HTMLElement {
  switch (f.kind) {
    case "button": {
      const el = document.createElement("ui5-button")
      el.setAttribute("design", f.variant === "default" ? "Default" : pascal(f.variant))
      if (f.icon) el.setAttribute("icon", f.icon)
      if (f.disabled) el.setAttribute("disabled", "")
      if (f.text) el.textContent = f.text
      return el
    }
    case "label": {
      const el = document.createElement("ui5-label")
      if (f.required) el.setAttribute("required", "")
      if (f.showColon) el.setAttribute("show-colon", "")
      el.textContent = f.text
      return el
    }
    case "input": {
      const el = document.createElement("ui5-input")
      el.style.width = FIELD_WIDTH
      if (f.value) el.setAttribute("value", f.value)
      if (f.placeholder) el.setAttribute("placeholder", f.placeholder)
      if (f.valueState && f.valueState !== "none") el.setAttribute("value-state", pascal(f.valueState))
      if (f.disabled) el.setAttribute("disabled", "")
      if (f.readOnly) el.setAttribute("readonly", "")
      return el
    }
    case "select": {
      const el = document.createElement("ui5-select")
      el.style.width = FIELD_WIDTH
      if (f.valueState && f.valueState !== "none") el.setAttribute("value-state", pascal(f.valueState))
      if (f.disabled) el.setAttribute("disabled", "")
      for (const o of f.options) {
        const opt = document.createElement("ui5-option")
        opt.textContent = o
        if (o === f.selected) opt.setAttribute("selected", "")
        el.append(opt)
      }
      return el
    }
  }
}

await setTheme(opts.theme)
if (opts.density === "compact") document.body.setAttribute("data-ui5-compact-size", "")
document.body.style.cssText = "margin:0;padding:1rem;background:var(--sapBackgroundColor);font-family:var(--sapFontFamily)"

const root = document.getElementById("root")!
root.style.cssText = "display:flex;flex-wrap:wrap;gap:1rem;align-items:flex-start"
for (const f of fixtures) {
  if (opts.only && !f.id.startsWith(opts.only)) continue
  const cell = document.createElement("div")
  cell.dataset.fixture = f.id
  cell.style.cssText = "display:inline-flex;padding:0.25rem;line-height:normal"
  cell.append(render(f))
  root.append(cell)
}
await Promise.all(["ui5-button", "ui5-input", "ui5-select", "ui5-label"].map((t) => customElements.whenDefined(t)))
await document.fonts.ready
// Icons render asynchronously inside ui5-icon's shadow root; wait until every one has its <path>.
const iconsDrawn = () =>
  [...document.querySelectorAll("ui5-button[icon]")].every((b) =>
    b.shadowRoot?.querySelector("[ui5-icon]")?.shadowRoot?.querySelector("path")
  )
while (!iconsDrawn()) await new Promise((r) => requestAnimationFrame(r))
document.documentElement.dataset.ready = "true"
