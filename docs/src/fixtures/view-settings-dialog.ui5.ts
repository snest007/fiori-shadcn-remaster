import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/ViewSettingsDialog.js"
import "@ui5/webcomponents-fiori/dist/SortItem.js"
import "@ui5/webcomponents-fiori/dist/FilterItem.js"
import "@ui5/webcomponents-fiori/dist/FilterItemOption.js"
import "@ui5/webcomponents-fiori/dist/GroupItem.js"
import "@ui5/webcomponents-icons/dist/sort.js"
import "@ui5/webcomponents-icons/dist/filter.js"
import "@ui5/webcomponents-icons/dist/group-2.js"
import "@ui5/webcomponents-icons/dist/nav-back.js"
import "@ui5/webcomponents-icons/dist/accept.js"

import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"

import { defineUi5, h } from "../fixture-types"
import { showShadowPopupInPlace } from "./ui5-popup-in-place"
import set, { vsdFilterItems, vsdGroupItems, vsdSortItems } from "./view-settings-dialog"

export default defineUi5(set, ({ sort, filter, group, descending }) => {
  const vsd = h("ui5-view-settings-dialog", { "sort-descending": descending })
  if (sort) vsdSortItems.forEach((i) => vsd.append(h("ui5-sort-item", { slot: "sortItems", text: i.text, selected: i.selected })))
  if (filter)
    vsdFilterItems.forEach((f) =>
      vsd.append(
        h(
          "ui5-filter-item",
          { slot: "filterItems", text: f.text },
          ...f.values.map((v) => h("ui5-filter-item-option", { slot: "values", text: v.text, selected: v.selected }))
        )
      )
    )
  if (group) vsdGroupItems.forEach((i) => vsd.append(h("ui5-group-item", { slot: "groupItems", text: i.text, selected: i.selected })))
  // Opening it for real would add the modal block layer over the page. The lists are built from the
  // settings UI5 initialises in beforeDialogOpen(), so run that once the slots are rendered, closed.
  const init = async () => {
    await customElements.whenDefined("ui5-view-settings-dialog")
    await renderFinished()
    if (!vsd.isConnected || !(vsd.constructor as any).i18nBundle) return requestAnimationFrame(init)
    ;(vsd as any).beforeDialogOpen()
  }
  requestAnimationFrame(init)
  return showShadowPopupInPlace(vsd, "[ui5-dialog]")
})
