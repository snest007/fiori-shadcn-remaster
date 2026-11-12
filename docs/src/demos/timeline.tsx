import * as React from "react"

import { calendar, email, phone } from "@/lib/fiori-icons"
import { Timeline, TimelineGroupItem, TimelineItem } from "@/components/ui/timeline"

import { defineDemo } from "./types"

function TimelineDemo() {
  const [clicked, setClicked] = React.useState(0)
  const [extra, setExtra] = React.useState(0)
  return (
    <div className="grid gap-6">
      <div id="timeline-vertical" className="max-w-md">
        <Timeline accessibleName="Order history" growing="Button" onLoadMore={() => setExtra((n) => n + 1)}>
          <TimelineItem icon={calendar} name="John Smith" titleText="Weekly sync" subtitleText="Dec 21, 2026, 10:00" />
          <TimelineGroupItem groupName="Last week">
            <TimelineItem icon={phone} titleText="Called supplier" subtitleText="Dec 15, 2026, 16:30" state="Positive">
              Delivery confirmed.
            </TimelineItem>
            <TimelineItem
              icon={email}
              name={`Clicked ${clicked}×`}
              nameClickable
              onNameClick={() => setClicked((n) => n + 1)}
              titleText="sent a message"
              subtitleText="Dec 14, 2026, 09:15"
            />
          </TimelineGroupItem>
          <TimelineItem titleText="Order created" subtitleText="Dec 10, 2026" />
          {Array.from({ length: extra }, (_, i) => (
            <TimelineItem key={i} titleText={`Older entry ${i + 1}`} subtitleText="Dec 1, 2026" />
          ))}
        </Timeline>
      </div>
      <div id="timeline-horizontal">
        <Timeline layout="Horizontal" accessibleName="Milestones">
          <TimelineItem icon={calendar} titleText="Kick-off" subtitleText="Jan 12" />
          <TimelineItem icon={phone} titleText="Supplier call" subtitleText="Feb 3" />
          <TimelineItem icon={email} titleText="Contract sent" subtitleText="Mar 9" />
        </Timeline>
      </div>
    </div>
  )
}

export default defineDemo({
  category: "Data",
  docs: [
    {
      name: "timeline",
      description: "Chronological events with grouping, semantic states and growing.",
      props: [
        { name: "Timeline.layout", type: "Vertical | Horizontal", description: "Event arrangement.", defaultValue: "Vertical" },
        { name: "Timeline.growing", type: "None | Button | Scroll", description: "Loading affordance.", defaultValue: "None" },
        { name: "Timeline.onLoadMore", type: "() => void", description: "Request more events." },
        { name: "Timeline.loading", type: "boolean", description: "Show loading feedback.", defaultValue: "false" },
        { name: "TimelineItem.titleText", type: "string", description: "Event title." },
        { name: "TimelineGroupItem.onToggle", type: "(collapsed: boolean) => void", description: "Receive group collapse changes." },
      ],
    },
  ],
 title: "Timeline", order: 61, Demo: TimelineDemo })
