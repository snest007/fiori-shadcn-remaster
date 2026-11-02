// Registers the fiori package's theme parameters for every theme (ui5-main only loads the main package's).
import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/Timeline.js"
import "@ui5/webcomponents-fiori/dist/TimelineItem.js"
import "@ui5/webcomponents-fiori/dist/TimelineGroupItem.js"
import "@ui5/webcomponents-icons/dist/calendar.js"
import "@ui5/webcomponents-icons/dist/email.js"
import "@ui5/webcomponents-icons/dist/phone.js"
import "@ui5/webcomponents-icons/dist/drill-down.js"
import "@ui5/webcomponents-icons/dist/process.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-down.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-left.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-right.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-up.js"

import { defineUi5, h } from "../fixture-types"
import set, { type TimelineFixtureEntry, type TimelineFixtureGroup, type TimelineFixtureItem } from "./timeline"

const isGroup = (e: TimelineFixtureEntry): e is TimelineFixtureGroup => "group" in e

const item = (e: TimelineFixtureItem) =>
  h(
    "ui5-timeline-item",
    { icon: e.icon, name: e.name, "name-clickable": e.clickable, "title-text": e.title, "subtitle-text": e.subtitle, state: e.state },
    ...(e.text ? [e.text] : [])
  )

export default defineUi5(set, ({ layout = "Vertical", width, entries, growing }) => {
  const t = h(
    "ui5-timeline",
    { layout, growing: growing ? "Button" : undefined },
    ...entries.map((e) => (isGroup(e) ? h("ui5-timeline-group-item", { "group-name": e.group, collapsed: e.collapsed }, ...e.items.map(item)) : item(e)))
  )
  t.style.width = width
  return t
})
