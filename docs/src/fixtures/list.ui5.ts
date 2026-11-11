import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import "@ui5/webcomponents/dist/List.js"
import "@ui5/webcomponents/dist/ListItemStandard.js"
import "@ui5/webcomponents/dist/ListItemCustom.js"
import "@ui5/webcomponents/dist/ListItemGroup.js"
import "@ui5/webcomponents/dist/Avatar.js"
import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents-icons/dist/calendar.js"
import "@ui5/webcomponents-icons/dist/email.js"
import "@ui5/webcomponents-icons/dist/employee.js"
import "@ui5/webcomponents-icons/dist/folder.js"
import "@ui5/webcomponents-icons/dist/history.js"
import "@ui5/webcomponents-icons/dist/product.js"
import "@ui5/webcomponents-icons/dist/settings.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-right.js"
import "@ui5/webcomponents-icons/dist/edit.js"
import "@ui5/webcomponents-icons/dist/decline.js"
import "@ui5/webcomponents-icons/dist/accept.js"

import { defineUi5, h, type Ui5FixtureElement } from "../fixture-types"
import set, { LIST_WIDTH, type ItemSpec } from "./list"

const cap = (s?: string) => (s && s !== "none" ? s[0].toUpperCase() + s.slice(1) : undefined)
const mode = (m?: string) => (m ? m[0].toUpperCase() + m.slice(1) : undefined)

function item(it: ItemSpec) {
  const common = {
    type: cap(it.type),
    highlight: cap(it.highlight),
    selected: it.selected,
    disabled: it.disabled,
  }
  if (it.custom) {
    const row = h("div", {}, h("span", {}, it.text), h("ui5-button", {}, "Edit"))
    row.style.cssText = "display:flex;align-items:center;justify-content:space-between;width:100%"
    return h("ui5-li-custom", common, row)
  }
  const li = h(
    "ui5-li",
    {
      ...common,
      description: it.description,
      icon: it.icon,
      "icon-end": it.iconEnd,
      "additional-text": it.additionalText,
      "additional-text-state": cap(it.additionalTextState),
      navigated: it.navigated,
    },
    it.text
  )
  if (it.avatar) li.append(h("ui5-avatar", { slot: "image", initials: it.avatar, size: "S" }))
  return li
}

export default defineUi5(set, ({ items, mode: m, headerText, footerText, noDataText, separators, growing, dropPlacement }) => {
  const list = h(
    "ui5-list",
    {
      "accessible-name": "List",
      "selection-mode": mode(m),
      "header-text": headerText,
      "footer-text": footerText,
      "no-data-text": noDataText,
      separators: separators && separators[0].toUpperCase() + separators.slice(1),
      growing: cap(growing),
    },
    ...items.map((x) => ("group" in x ? h("ui5-li-group", { "header-text": x.group }, ...x.items.map(item)) : item(x)))
  )
  const wrap = h("div", {}, list)
  wrap.style.width = LIST_WIDTH
  // Our docs body uses --sapFontSize; the UI5 page body keeps the browser's 16px. Text the list doesn't
  // size itself (custom content, the "More" button) inherits it, so give both sides the same page font size.
  wrap.style.fontSize = "var(--sapFontSize)"
  if (dropPlacement) {
    ;(wrap as Ui5FixtureElement).fixtureReady = (async () => {
      while (!list.isConnected || !list.shadowRoot?.querySelector("ui5-drop-indicator")) await new Promise(requestAnimationFrame)
      await renderFinished()
      await document.fonts.ready
      const indicator = list.shadowRoot!.querySelector("ui5-drop-indicator") as HTMLElement & { targetReference: HTMLElement; placement: string }
      indicator.targetReference = list.querySelectorAll<HTMLElement>("ui5-li")[1]
      indicator.placement = dropPlacement
      await renderFinished()
      await new Promise(requestAnimationFrame)
    })()
  }
  return wrap
})
