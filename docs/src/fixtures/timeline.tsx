import { calendar, email, phone } from "@/lib/fiori-icons"
import { Timeline, TimelineGroupItem, TimelineItem, type TimelineItemState, type TimelineLayout } from "@/components/ui/timeline"

import { defineFixtures } from "../fixture-types"

const icons = { calendar, email, phone }

export type TimelineFixtureItem = {
  icon?: keyof typeof icons
  name?: string
  clickable?: boolean
  title: string
  subtitle?: string
  text?: string
  state?: TimelineItemState
}
export type TimelineFixtureGroup = { group: string; collapsed?: boolean; items: TimelineFixtureItem[] }
export type TimelineFixtureEntry = TimelineFixtureItem | TimelineFixtureGroup

type Props = { layout?: TimelineLayout; width: string; entries: TimelineFixtureEntry[]; growing?: boolean }

const meeting: TimelineFixtureItem = { icon: "calendar", name: "John Smith", title: "Weekly sync", subtitle: "Dec 21, 2026, 10:00" }
const call: TimelineFixtureItem = { icon: "phone", title: "Called supplier", subtitle: "Dec 20, 2026, 16:30", text: "Delivery confirmed." }
const mail: TimelineFixtureItem = { icon: "email", name: "Ann Lee", clickable: true, title: "Sent a message", subtitle: "Dec 19, 2026, 09:15" }
const plain: TimelineFixtureItem = { title: "Order created", subtitle: "Dec 18, 2026" }
const plain2: TimelineFixtureItem = { title: "Order approved", subtitle: "Dec 19, 2026" }

const isGroup = (e: TimelineFixtureEntry): e is TimelineFixtureGroup => "group" in e

const item = (e: TimelineFixtureItem, key: number) => (
  <TimelineItem
    key={key}
    icon={e.icon && icons[e.icon]}
    name={e.name}
    nameClickable={e.clickable}
    titleText={e.title}
    subtitleText={e.subtitle}
    state={e.state}
  >
    {e.text}
  </TimelineItem>
)

export default defineFixtures<Props>({
  name: "timeline",
  cases: [
    { id: "timeline-vertical", props: { width: "24rem", entries: [meeting, call, mail] } },
    { id: "timeline-vertical-no-icons", props: { width: "24rem", entries: [plain, plain2, plain] } },
    { id: "timeline-vertical-mixed", props: { width: "24rem", entries: [meeting, plain, call, plain2] } },
    {
      id: "timeline-vertical-states",
      props: {
        width: "24rem",
        entries: [
          { icon: "calendar", title: "Positive", state: "Positive" },
          { icon: "calendar", title: "Negative", state: "Negative" },
          { icon: "calendar", title: "Critical", state: "Critical" },
          { icon: "calendar", title: "Information", state: "Information" },
        ],
      },
    },
    { id: "timeline-vertical-growing", props: { width: "24rem", entries: [meeting, call], growing: true } },
    { id: "timeline-vertical-group", props: { width: "24rem", entries: [meeting, { group: "Last week", items: [call, mail] }, plain] } },
    { id: "timeline-vertical-group-collapsed", props: { width: "24rem", entries: [meeting, { group: "Last week", collapsed: true, items: [call, mail] }, plain] } },
    { id: "timeline-horizontal", props: { layout: "Horizontal", width: "60rem", entries: [meeting, call, mail] } },
    { id: "timeline-horizontal-no-icons", props: { layout: "Horizontal", width: "50rem", entries: [plain, plain2, plain] } },
    { id: "timeline-horizontal-mixed", props: { layout: "Horizontal", width: "60rem", entries: [meeting, plain, call] } },
    { id: "timeline-horizontal-growing", props: { layout: "Horizontal", width: "50rem", entries: [meeting, call], growing: true } },
    { id: "timeline-horizontal-group", props: { layout: "Horizontal", width: "70rem", entries: [meeting, { group: "Last week", items: [call, mail] }] } },
    { id: "timeline-horizontal-group-collapsed", props: { layout: "Horizontal", width: "50rem", entries: [meeting, { group: "Last week", collapsed: true, items: [call, mail] }, plain] } },
  ],
  react: ({ layout = "Vertical", width, entries, growing }) => (
    <Timeline layout={layout} growing={growing ? "Button" : "None"} style={{ width }}>
      {entries.map((e, i) =>
        isGroup(e) ? (
          <TimelineGroupItem key={i} groupName={e.group} defaultCollapsed={e.collapsed}>
            {e.items.map(item)}
          </TimelineGroupItem>
        ) : (
          item(e, i)
        )
      )}
    </Timeline>
  ),
})
