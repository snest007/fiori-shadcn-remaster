// Registers the fiori package's theme parameters for every theme (ui5-main only loads the main package's).
import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/NotificationList.js"
import "@ui5/webcomponents-fiori/dist/NotificationListItem.js"
import "@ui5/webcomponents-fiori/dist/NotificationListGroupItem.js"
import "@ui5/webcomponents/dist/Avatar.js"
import "@ui5/webcomponents/dist/Label.js"
import "@ui5/webcomponents/dist/Menu.js"
import "@ui5/webcomponents/dist/MenuItem.js"
import "@ui5/webcomponents-icons/dist/decline.js"
import "@ui5/webcomponents-icons/dist/overflow.js"
import "@ui5/webcomponents-icons/dist/high-priority.js"
import "@ui5/webcomponents-icons/dist/error.js"
import "@ui5/webcomponents-icons/dist/alert.js"
import "@ui5/webcomponents-icons/dist/sys-enter-2.js"
import "@ui5/webcomponents-icons/dist/information.js"
import "@ui5/webcomponents-icons/dist/navigation-down-arrow.js"
import "@ui5/webcomponents-icons/dist/navigation-right-arrow.js"

import { defineUi5, h } from "../fixture-types"
import set, { NOTIFICATION_WIDTH, type NotificationFixture } from "./notification-list"

const cap = (s?: string) => (s ? s[0].toUpperCase() + s.slice(1) : undefined)

const item = (n: NotificationFixture) =>
  h(
    "ui5-li-notification",
    {
      "title-text": n.title,
      state: cap(n.state),
      read: n.read,
      importance: n.important ? "Important" : undefined,
      "show-close": n.showClose,
      "wrapping-type": n.wrapping ? "Normal" : undefined,
    },
    ...(n.menu ? [h("ui5-menu", { slot: "menu" }, h("ui5-menu-item", { text: "Accept" }))] : []),
    ...(n.avatar ? [h("ui5-avatar", { slot: "avatar", size: "XS", initials: n.avatar })] : []),
    ...(n.footnotes ?? []).map((f) => h("ui5-label", { slot: "footnotes" }, f)),
    ...(n.description ? [n.description] : [])
  )

export default defineUi5(set, ({ items, groups }) => {
  const list = h(
    "ui5-notification-list",
    {},
    ...(items ?? []).map(item),
    ...(groups ?? []).map((g) => h("ui5-li-notification-group", { "title-text": g.title, collapsed: g.collapsed }, ...g.items.map(item)))
  )
  list.style.width = NOTIFICATION_WIDTH
  return list
})
