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

import { placeInPlace } from "./ui5-popup-in-place"
import { defineUi5, h } from "../fixture-types"
import set, { TABS_WIDTH } from "./tabs"

const pascal = (s?: string) => (s ? s[0].toUpperCase() + s.slice(1) : undefined)

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
  const frame = document.createElement("div")
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
    tabsControl._setItemsForStrip()
    await tabsControl._showPopoverAt(button, false, true)
    await renderFinished()
    tabsControl._closePopover()
    await renderFinished()
    const popup = el.shadowRoot!.querySelector<HTMLElement>("[ui5-responsive-popover]")!
    root.style.display = "none"
    placeInPlace(popup, "block")
    popup.style.width = "15rem"
    el.style.cssText = "width:15rem;height:auto"
  }
  paint()
  return frame
})
