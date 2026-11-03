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

import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"

import { defineUi5, h, type Ui5FixtureElement } from "../fixture-types"
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
      loading: n.loading,
      "loading-delay": "0",
      "data-notification-local-loading": n.loadingAfterGroup,
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
    ...(groups ?? []).map((g) => h("ui5-li-notification-group", { "title-text": g.title, collapsed: g.collapsed, growing: cap(g.growing), loading: g.loading, "loading-delay": "0" }, ...g.items.map(item)))
  )
  list.style.width = NOTIFICATION_WIDTH
  const lateChildren = [...list.querySelectorAll<HTMLElement>("[data-notification-local-loading]")] as (HTMLElement & { loading: boolean; _waitForDomRef(): Promise<void> })[]
  if (lateChildren.length) {
    const fixture = list as Ui5FixtureElement
    fixture.fixtureReady = (async () => {
      const groups = [...new Set(lateChildren.map((child) => child.closest("ui5-li-notification-group")))] as (HTMLElement & { _waitForDomRef(): Promise<void>; getGrowingButton(): HTMLElement | null })[]
      await Promise.all([...groups, ...lateChildren].map((element) => element._waitForDomRef()))
      await renderFinished()
      // NotificationListGroupItem.js/onBeforeRendering first clears children. Start a
      // genuinely local request only after that owning render and its inline busy area.
      while (groups.some((group) => !(group.getGrowingButton()?.querySelector(".ui5-list-growing-button-busy-indicator") as any)?._isBusy)) {
        await new Promise(requestAnimationFrame)
      }
      lateChildren.forEach((child) => { child.loading = true })
      await renderFinished()
      while (lateChildren.some((child) => !(child.shadowRoot?.querySelector(".ui5-nli-loading") as any)?._isBusy)) {
        await new Promise(requestAnimationFrame)
      }
      await renderFinished()
    })()
  }
  return list
})
