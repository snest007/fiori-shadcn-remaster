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

import { defineUi5, h } from "../fixture-types"
import set, { TABS_WIDTH } from "./tabs"

const pascal = (s?: string) => (s ? s[0].toUpperCase() + s.slice(1) : undefined)

export default defineUi5(set, ({ tabs, selected }) => {
  const el = h(
    "ui5-tabcontainer",
    {},
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
  el.style.width = TABS_WIDTH
  return el
})
