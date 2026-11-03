import * as React from "react"

import { Button } from "@/components/ui/button"
import { MenuItem } from "@/components/ui/menu"
import { NotificationList, NotificationListGroupItem, NotificationListItem } from "@/components/ui/notification-list"

import { defineDemo } from "./types"

const LONG =
  "And with very long description and long labels of the action buttons - Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."

function GrowingNotificationsDemo() {
  const [growing, setGrowing] = React.useState<"none" | "button" | "scroll">("button")
  const [behavior, setBehavior] = React.useState("append")
  const [items, setItems] = React.useState({ orders: [1, 2], approvals: [1] })
  const [loading, setLoading] = React.useState({ orders: false, approvals: false })
  const [delay, setDelay] = React.useState(1000)
  const [childLoading, setChildLoading] = React.useState(false)
  const [mounted, setMounted] = React.useState(true)
  const [requests, setRequests] = React.useState({ orders: 0, approvals: 0 })
  const [action, setAction] = React.useState("none")
  const append = (group: "orders" | "approvals") => setItems((current) => ({ ...current, [group]: [...current[group], current[group].at(-1)! + 1] }))
  const load = (group: "orders" | "approvals") => {
    setRequests((current) => ({ ...current, [group]: current[group] + 1 }))
    if (behavior === "append") append(group)
    if (behavior === "manual") setLoading((current) => ({ ...current, [group]: true }))
  }
  return (
    <div id="notification-list-growing-demo" className="grid gap-3">
      <div className="flex flex-wrap gap-3">
        <label>Growing <select aria-label="Growing mode" value={growing} onChange={(e) => setGrowing(e.target.value as typeof growing)}>
          <option value="button">Button</option><option value="scroll">Scroll</option><option value="none">None</option>
        </select></label>
        <label>Load behavior <select aria-label="Load behavior" value={behavior} onChange={(e) => setBehavior(e.target.value)}>
          <option value="append">Append immediately</option><option value="manual">Manual completion</option><option value="noop">No more items</option>
        </select></label>
        <label>Loading delay <select aria-label="Loading delay" value={delay} onChange={(e) => setDelay(Number(e.target.value))}>
          <option value="1000">1000 ms</option><option value="0">0 ms</option>
        </select></label>
      </div>
      <div className="flex flex-wrap gap-3">
        {(["orders", "approvals"] as const).map((group) => <React.Fragment key={group}>
          <Button onClick={() => append(group)}>Append {group}</Button>
          <Button onClick={() => setLoading((current) => ({ ...current, [group]: !current[group] }))}>{loading[group] ? "Finish" : "Start"} loading {group}</Button>
        </React.Fragment>)}
        <Button onClick={() => setChildLoading((current) => !current)}>Toggle child loading</Button>
        <Button onClick={() => setMounted((current) => !current)}>{mounted ? "Hide" : "Show"} growing list</Button>
      </div>
      {mounted && <NotificationList
        texts={{ growingButton: "Load more notifications", more: "Details", moreLabel: "Details button. Show the full texts", loading: "Fetching notifications" }}
        onItemClick={(value) => setAction(`click:${value}`)}
        onItemToggle={(value, collapsed) => setAction(`${collapsed ? "collapse" : "expand"}:${value}`)}
      >
        {(["orders", "approvals"] as const).map((group) => (
          <NotificationListGroupItem key={group} id={`notification-list-growing-${group}`} value={`growing-${group}`} titleText={`More ${group}`} growing={growing} loading={loading[group]} loadingDelay={delay} onLoadMore={() => load(group)}>
            {items[group].map((number) => <NotificationListItem key={number} value={`${group}-${number}`} titleText={`${group} notification ${number}`} loading={childLoading} loadingDelay={delay} showClose>{LONG}</NotificationListItem>)}
          </NotificationListGroupItem>
        ))}
      </NotificationList>}
      <output id="notification-list-growing-requests">{`Requests: orders=${requests.orders}, approvals=${requests.approvals}`}</output>
      <output id="notification-list-growing-action">{`Last action: ${action}`}</output>
    </div>
  )
}

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
      <GrowingNotificationsDemo />
    </div>
  )
}

export default defineDemo({ title: "Notification List", order: 63, Demo: NotificationListDemo })
