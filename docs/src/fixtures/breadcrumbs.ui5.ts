import "@ui5/webcomponents/dist/Breadcrumbs.js"
import "@ui5/webcomponents/dist/BreadcrumbsItem.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-down.js"
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"

import { defineUi5, h } from "../fixture-types"
import set, { BREADCRUMBS_WIDTH, BREADCRUMBS_OVERFLOW_WIDTH, BREADCRUMBS_HIDDEN_MIDDLE_WIDTH, trail } from "./breadcrumbs"

const pascal = (s: string) => s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("")

export default defineUi5(set, ({ separators, design, lastLink, overflow, open, hiddenMiddle }) => {
  const el = h(
    "ui5-breadcrumbs",
    { separators: separators && pascal(separators).replace("Backslash", "BackSlash"), design: design && pascal(design) },
    ...trail.map((t, i) => h("ui5-breadcrumbs-item", { hidden: hiddenMiddle && i === 1, href: i < trail.length - 1 || lastLink ? "#" : undefined }, t))
  )
  el.style.width = hiddenMiddle ? BREADCRUMBS_HIDDEN_MIDDLE_WIDTH : overflow ? BREADCRUMBS_OVERFLOW_WIDTH : BREADCRUMBS_WIDTH
  if (!open) return el
  const frame = document.createElement("div")
  frame.style.cssText = "overflow:hidden;padding:0.75rem"
  frame.append(el)
  const prepare = async (tries = 0): Promise<void> => {
    await customElements.whenDefined("ui5-breadcrumbs")
    const root = el.shadowRoot
    if (!root) {
      if (tries > 100) throw new Error("breadcrumbs: no shadow root for the overflow fixture")
      await new Promise((resolve) => requestAnimationFrame(resolve))
      return prepare(tries + 1)
    }
    // BreadcrumbsPopoverTemplate.js renders the real ResponsivePopover / List even closed,
    // including _overflowItemsData's unmodified hidden-only ancestor order. Real opening was
    // attempted: Popover._show asynchronously closes a below-fold opener on the shared page,
    // occasionally after the fixture was pinned. Show that existing closed surface in place.
    // Like ui5-picker-popover.ts, retain positioning/display overrides through theme assignment
    // and shadow re-render. Every rule that draws the surface remains UI5's own CSS.
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(`
      [ui5-responsive-popover] { display: flex !important; position: relative !important;
        inset: auto !important; transform: none !important; width: ${hiddenMiddle ? BREADCRUMBS_HIDDEN_MIDDLE_WIDTH : BREADCRUMBS_OVERFLOW_WIDTH};
        max-width: none !important; max-height: none !important; }
    `)
    const desc = Object.getOwnPropertyDescriptor(ShadowRoot.prototype, "adoptedStyleSheets")
      ?? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ShadowRoot.prototype), "adoptedStyleSheets")!
    Object.defineProperty(root, "adoptedStyleSheets", {
      configurable: true,
      get: () => desc.get!.call(root),
      set: (value: CSSStyleSheet[]) => desc.set!.call(root, [...value.filter((item) => item !== sheet), sheet]),
    })
    root.adoptedStyleSheets = [...root.adoptedStyleSheets]
    await renderFinished()
  }
  void prepare()
  return frame
})
