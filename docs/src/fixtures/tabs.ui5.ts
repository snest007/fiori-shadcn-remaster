import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents/dist/Tab.js"
import "@ui5/webcomponents/dist/TabContainer.js"
import "@ui5/webcomponents/dist/TabSeparator.js"
import "@ui5/webcomponents-icons/dist/alert.js"
import "@ui5/webcomponents-icons/dist/attachment.js"
import "@ui5/webcomponents-icons/dist/employee.js"
import "@ui5/webcomponents-icons/dist/error.js"
import "@ui5/webcomponents-icons/dist/inbox.js"
import "@ui5/webcomponents-icons/dist/notes.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-down.js"
import "@ui5/webcomponents-icons/dist/sys-enter-2.js"

import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"

import { defineUi5, h, type Ui5FixtureElement } from "../fixture-types"
import set, { TABS_WIDTH } from "./tabs"

const pascal = (s?: string) => (s ? s[0].toUpperCase() + s.slice(1) : undefined)
const overflowSheet = new CSSStyleSheet()
overflowSheet.replaceSync(`
  [ui5-responsive-popover] { display: block !important; position: relative !important;
    inset: auto !important; transform: none !important; width: 15rem !important;
    max-width: none !important; max-height: none !important; }
  .ui5-tc-root { display: none !important; }
`)
const overflowContentSheet = new CSSStyleSheet()
// Popover.styles.root retains calcPlacement's viewport caps on PopupTemplate's inner section
// after closing. Clearing only the host's limits still clips the in-place list under load.
overflowContentSheet.replaceSync(`
  .ui5-popup-root { max-width: none !important; max-height: none !important; }
`)

export default defineUi5(set, ({ tabs, selected, width = TABS_WIDTH, overflowMode, list, customStart, customEnd }) => {
  const el = h(
    "ui5-tabcontainer",
    { "overflow-mode": overflowMode === "startAndEnd" ? "StartAndEnd" : "End" },
    ...tabs.map((t, i) =>
      t === "|"
        ? h("ui5-tab-separator")
        : h(
            "ui5-tab",
            { text: t.text, icon: t.icon, "additional-text": t.count, design: pascal(t.design), disabled: t.disabled, selected: i === selected },
            `Content ${i}`
          )
    )
  )
  if (customStart) el.append(h("ui5-button", { slot: "startOverflowButton" }, "Previous"))
  if (customEnd) el.append(h("ui5-button", { slot: "overflowButton" }, "Next"))
  el.style.width = width
  if (!list) return el
  const frame: Ui5FixtureElement = document.createElement("div")
  frame.style.cssText = "overflow:hidden;padding:.75rem"
  frame.append(el)
  const paint = async (tries = 0): Promise<void> => {
    await renderFinished()
    const root = el.shadowRoot?.querySelector<HTMLElement>(".ui5-tc-root")
    const button = el.shadowRoot?.querySelector<HTMLElement>('[data-ui5-stable="overflow-end"]')
    if (!el.isConnected || !root || !button) {
      if (tries > 100) throw new Error("tabs: overflow popover not initialized")
      await new Promise((r) => requestAnimationFrame(r))
      return paint(tries + 1)
    }
    // Populate the real overflow through TabContainer's API, then close before painting it in place.
    // preventInitialFocus keeps this shared reference page's other popup fixtures undisturbed.
    const tabsControl = el as HTMLElement & { _setItemsForStrip(): void; _showPopoverAt(button: HTMLElement, focus: boolean, preventFocus: boolean): Promise<void>; _closePopover(): void }
    const popup = el.shadowRoot!.querySelector<HTMLElement & { open: boolean; _waitForDomRef(): Promise<void> }>("[ui5-responsive-popover]")!
    // UI5Element.connectedCallback resolves _waitForDomRef immediately before synchronous onEnterDOM.
    // Await that lifecycle before _showPopoverAt sets open: ResponsivePopover.handleOpenOnEnterDOM
    // otherwise calls native showPopover even when Popover.openPopup rejects the below-fold opener.
    await popup._waitForDomRef()
    tabsControl._setItemsForStrip()
    await tabsControl._showPopoverAt(button, false, true)
    await renderFinished()
    tabsControl._closePopover()
    await renderFinished()
    // INTEGRATION cause 2: Popup.closePopup returns early when !_opened, leaving a native
    // :popover-open surface outside this cell despite UI5's open=false. Remove only that closed
    // top-layer entry. A one-shot inline pin cannot contain the browser's top layer, and shadow
    // re-renders/theme stylesheet assignment can replace its pin and the hidden tab-strip parent.
    if (!popup.open && popup.matches(":popover-open")) popup.hidePopover()
    for (const [shadow, sheet] of [[el.shadowRoot!, overflowSheet], [popup.shadowRoot!, overflowContentSheet]] as const) {
      const desc = Object.getOwnPropertyDescriptor(ShadowRoot.prototype, "adoptedStyleSheets")
        ?? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ShadowRoot.prototype), "adoptedStyleSheets")!
      Object.defineProperty(shadow, "adoptedStyleSheets", {
        configurable: true,
        get: () => desc.get!.call(shadow),
        set: (value: CSSStyleSheet[]) => desc.set!.call(shadow, [...value.filter((item) => item !== sheet), sheet]),
      })
      shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets]
    }
    el.style.cssText = "width:15rem;height:auto"
  }
  frame.fixtureReady = paint()
  return frame
})
