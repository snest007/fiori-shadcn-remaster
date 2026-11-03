import "@ui5/webcomponents/dist/Label.js"
import "@ui5/webcomponents/dist/Toolbar.js"
import "@ui5/webcomponents/dist/ToolbarButton.js"
import "@ui5/webcomponents/dist/ToolbarItem.js"
import "@ui5/webcomponents/dist/ToolbarSeparator.js"
import "@ui5/webcomponents/dist/ToolbarSpacer.js"
import "@ui5/webcomponents-icons/dist/overflow.js"
import "@ui5/webcomponents-icons/dist/action.js"
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"

import { defineUi5, h } from "../fixture-types"
import set, { TOOLBAR_WIDTH } from "./toolbar"
import { showShadowPopupInPlace } from "./ui5-popup-in-place"

export default defineUi5(set, ({ items, alignContent, design, width, always, never, open }) => {
  const el = h(
    "ui5-toolbar",
    { "accessible-name": "Actions", "align-content": alignContent === "start" ? "Start" : undefined, design: design === "transparent" ? "Transparent" : undefined },
    ...items.map((t) =>
      t === "|"
        ? h("ui5-toolbar-separator")
        : t === "<->"
          ? h("ui5-toolbar-spacer")
          : t.endsWith("rem")
            ? h("ui5-toolbar-spacer", { width: t })
            : t.startsWith("#")
              ? h("ui5-toolbar-item", {}, h("ui5-label", {}, t.slice(1)))
              : h("ui5-toolbar-button", { text: t, "overflow-priority": always?.includes(t) ? "AlwaysOverflow" : never?.includes(t) ? "NeverOverflow" : undefined,
                icon: open && t === "Share" ? "action" : undefined, "show-overflow-text": open && t === "Share", tooltip: open && t === "Share" ? "Share" : undefined })
    )
  )
  el.style.width = width ?? TOOLBAR_WIDTH
  if (open) {
    // Paint the real closed popover in-place without taking focus from other fixture cells.
    // The toolbar bar remains visible above it, with its own source height and border.
    el.style.cssText += ";display:flex;flex-direction:column;align-items:flex-start;height:auto;padding:0;border:0;background:none"
    const frame = showShadowPopupInPlace(el, ".ui5-overflow-popover", "12rem")
    frame.style.width = "12rem"
    const apply = async () => {
      await renderFinished()
      if (!el.shadowRoot) { requestAnimationFrame(apply); return }
      const sheet = new CSSStyleSheet()
      sheet.replaceSync(".ui5-tb-items { display:flex;align-items:center;justify-content:flex-end;height:var(--_ui5-toolbar-height);flex-shrink:0;box-sizing:border-box;padding:0 var(--_ui5-toolbar-padding-right) 0 var(--_ui5-toolbar-padding-left);background:var(--sapToolbar_Background);border-bottom:var(--sapGroup_TitleBorderWidth) solid var(--sapGroup_TitleBorderColor); }")
      // As in ui5-picker-popover.ts, keep the fixture sheet after UI5 replaces theme sheets.
      const root = el.shadowRoot
      const descriptor = Object.getOwnPropertyDescriptor(ShadowRoot.prototype, "adoptedStyleSheets")
        ?? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ShadowRoot.prototype), "adoptedStyleSheets")!
      Object.defineProperty(root, "adoptedStyleSheets", {
        configurable: true,
        get: () => descriptor.get!.call(root),
        set: (sheets: CSSStyleSheet[]) => descriptor.set!.call(root, [...sheets.filter((candidate) => candidate !== sheet), sheet]),
      })
      root.adoptedStyleSheets = [...root.adoptedStyleSheets]
    }
    apply()
    return frame
  }
  return el
})
