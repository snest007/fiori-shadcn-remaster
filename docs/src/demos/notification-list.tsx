import * as React from "react"

import { MenuItem } from "@/components/ui/menu"
import { NotificationList, NotificationListGroupItem, NotificationListItem } from "@/components/ui/notification-list"

import { defineDemo } from "./types"

const LONG =
  "And with very long description and long labels of the action buttons - Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."

function NotificationListDemo() {
  const [closed, setClosed] = React.useState<string[]>([])
  const [last, setLast] = React.useState("none")
  const shown = (v: string) => !closed.includes(v)
  return (
    <div className="grid max-w-xl gap-3">
      <NotificationList
        id="notification-list-demo"
        onItemClick={(v) => setLast(`click:${v}`)}
        onItemClose={(v) => setClosed((c) => [...c, v])}
        onItemToggle={(v, collapsed) => setLast(`${collapsed ? "collapse" : "expand"}:${v}`)}
      >
        <NotificationListGroupItem value="orders" titleText="Orders">
          {shown("delayed") && (
            <NotificationListItem value="delayed" titleText="Order #2565 delayed" state="negative" showClose menu={<MenuItem>Accept</MenuItem>} footnotes={["Logistics", "3 Hours"]}>
              Shipping was delayed by the carrier.
            </NotificationListItem>
          )}
          {shown("shipped") && (
            <NotificationListItem value="shipped" titleText="Order #2566 shipped" state="positive" read showClose footnotes={["Logistics"]}>
              {LONG}
            </NotificationListItem>
          )}
          {shown("open") && <NotificationListItem value="open" titleText="Cannot be closed" importance="important" footnotes={["Admin"]} />}
        </NotificationListGroupItem>
        <NotificationListGroupItem value="approvals" titleText="Approvals" defaultCollapsed>
          <NotificationListItem value="requisition" titleText="Purchase requisition">
            Needs your approval.
          </NotificationListItem>
        </NotificationListGroupItem>
      </NotificationList>
      <span id="notification-list-demo-last" className="text-(--sapContent_LabelColor)">{`Last action: ${last}`}</span>
    </div>
  )
}

export default defineDemo({ title: "Notification List", order: 63, Demo: NotificationListDemo })
