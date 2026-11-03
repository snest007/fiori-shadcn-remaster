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
  const [loadingLastOnly, setLoadingLastOnly] = React.useState(false)
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
        <Button onClick={() => { setLoadingLastOnly(false); setChildLoading((current) => !current) }}>Toggle child loading</Button>
        <Button onClick={() => { setLoading((current) => ({ ...current, orders: false })); setChildLoading(true) }}>Finish orders and load children</Button>
        <Button onClick={() => { setLoadingLastOnly(true); setChildLoading(true) }}>Load last order only</Button>
        <Button onClick={() => setMounted((current) => !current)}>{mounted ? "Hide" : "Show"} growing list</Button>
      </div>
      {mounted && <NotificationList
        texts={{ growingButton: "Load more notifications", more: "Details", moreLabel: "Details button. Show the full texts", loading: "Fetching notifications", busyTitle: "Fetching notifications" }}
        onItemClick={(value) => setAction(`click:${value}`)}
        onItemToggle={(value, collapsed) => setAction(`${collapsed ? "collapse" : "expand"}:${value}`)}
      >
        {(["orders", "approvals"] as const).map((group) => (
          <NotificationListGroupItem key={group} id={`notification-list-growing-${group}`} value={`growing-${group}`} titleText={`More ${group}`} growing={growing} loading={loading[group]} loadingDelay={delay} onLoadMore={() => load(group)}>
            {items[group].map((number) => <NotificationListItem key={number} value={`${group}-${number}`} titleText={`${group} notification ${number}`} loading={childLoading && (!loadingLastOnly || (group === "orders" && number === items.orders.at(-1)))} loadingDelay={delay} showClose>{LONG}</NotificationListItem>)}
          </NotificationListGroupItem>
        ))}
      </NotificationList>}
      <output id="notification-list-growing-requests">{`Requests: orders=${requests.orders}, approvals=${requests.approvals}`}</output>
      <output id="notification-list-growing-action">{`Last action: ${action}`}</output>
    </div>
  )
}

function NotificationLoadingHandoffDemo() {
  const [phase, setPhase] = React.useState<"group" | "child">("group")
  return (
    <div id="notification-list-loading-handoff-demo" className="grid gap-3">
      <Button onClick={() => setPhase((current) => current === "group" ? "child" : "group")}>Switch loading phase</Button>
      <output>{`Loading phase: ${phase}`}</output>
      <NotificationList>
        <NotificationListGroupItem value="handoff-group" titleText="Loading handoff" loading={phase === "group"} loadingDelay={0}>
          <NotificationListItem value="handoff-child" titleText="Notification loading handoff" loading={phase === "child"} loadingDelay={0} showClose>
            Switch between loading the group and loading its notification.
          </NotificationListItem>
        </NotificationListGroupItem>
      </NotificationList>
    </div>
  )
}

function LocallyLoadingNotification({ contentVersion }: { contentVersion: number }) {
  const [loading, setLoading] = React.useState(false)
  return (
    <NotificationListItem value="local-loading-child" titleText="Locally loading notification" loading={loading} loadingDelay={0} wrappingType="normal">
      <Button onClick={() => setLoading((current) => !current)}>{loading ? "Reset" : "Start"} local child loading</Button>
      <output id="notification-list-local-child-state">{loading ? "Child request: loading" : "Child request: idle"}</output>
      <span>{`Local content version: ${contentVersion}`}</span>
    </NotificationListItem>
  )
}

function NotificationLocalLoadingDemo() {
  const [renders, setRenders] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [callback, setCallback] = React.useState("absent")
  const [requests, setRequests] = React.useState(0)
  const [appended, setAppended] = React.useState(false)
  const [member, setMember] = React.useState({ shown: true, revision: 0 })
  const [contentVersion, setContentVersion] = React.useState(0)
  const load = () => {
    if (callback === "counter") setRequests((current) => current + 1)
    if (callback === "title") setRenders((current) => current + 1)
    if (callback === "loading") setLoading((current) => !current)
    if (callback === "append") setAppended(true)
    if (callback === "remove") setMember((current) => ({ ...current, shown: false }))
    if (callback === "replace") setMember((current) => ({ ...current, revision: current.revision + 1 }))
    if (callback === "content") setContentVersion((current) => current + 1)
  }
  return (
    <div id="notification-list-local-loading-demo" className="grid gap-3">
      <label>More callback <select aria-label="Local loading callback" value={callback} onChange={(e) => setCallback(e.target.value)}>
        <option value="absent">No callback</option><option value="noop">No-op callback</option><option value="counter">Count requests</option><option value="title">Change group title</option><option value="loading">Toggle group loading</option><option value="append">Append a notification</option><option value="remove">Remove a notification</option><option value="replace">Replace a notification</option><option value="content">Change child content</option>
      </select></label>
      <Button onClick={() => setLoading(true)} disabled={loading}>Start busy group</Button>
      <Button onClick={() => setRenders((current) => current + 1)}>Render owning group</Button>
      <output id="notification-list-local-requests">{`Local requests: ${requests}`}</output>
      <NotificationList>
        <NotificationListGroupItem value="local-loading-group" titleText={`Busy group ${renders}`} loading={loading} growing="button" loadingDelay={0} onLoadMore={callback === "absent" ? undefined : load}>
          <LocallyLoadingNotification contentVersion={contentVersion} />
          {member.shown && <NotificationListItem key={member.revision} value="local-loading-member" titleText="Slot membership notification">{`Member revision: ${member.revision}`}</NotificationListItem>}
          {appended && <NotificationListItem value="local-loading-appended" titleText="Appended notification">A new group member.</NotificationListItem>}
        </NotificationListGroupItem>
      </NotificationList>
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
      <NotificationLoadingHandoffDemo />
      <NotificationLocalLoadingDemo />
    </div>
  )
}

export default defineDemo({ title: "Notification List", order: 63, Demo: NotificationListDemo })
