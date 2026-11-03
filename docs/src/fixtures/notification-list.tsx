import { Avatar } from "@/components/ui/avatar"
import { MenuItem } from "@/components/ui/menu"
import { NotificationList, NotificationListGroupItem, NotificationListItem } from "@/components/ui/notification-list"

import { defineFixtures } from "../fixture-types"

export const NOTIFICATION_WIDTH = "30rem"

export type NotificationFixture = {
  title: string
  description?: string
  state?: "negative" | "critical" | "positive" | "information"
  read?: boolean
  important?: boolean
  showClose?: boolean
  menu?: boolean
  avatar?: string
  footnotes?: string[]
  wrapping?: boolean
  loading?: boolean
}

type Props = { groups?: { title: string; collapsed?: boolean; growing?: "button" | "scroll"; loading?: boolean; items: NotificationFixture[] }[]; items?: NotificationFixture[] }

const LONG =
  "And with very long description and long labels of the action buttons - Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."

export default defineFixtures<Props>({
  name: "notification-list",
  cases: [
    {
      id: "notification-list-item-loading",
      props: { items: [{ title: "Working", description: "Updating the notification.", loading: true, showClose: true }] },
    },
    {
      id: "notification-list-growing-button",
      props: { groups: [{ title: "Orders", growing: "button", items: [{ title: "New order", description: "An order is awaiting approval." }] }] },
    },
    {
      id: "notification-list-growing-button-loading",
      props: { groups: [{ title: "Orders", growing: "button", loading: true, items: [{ title: "New order", loading: true }] }] },
    },
    {
      id: "notification-list-growing-scroll-loading",
      props: { groups: [{ title: "Orders", growing: "scroll", loading: true, items: [{ title: "New order", loading: true }] }] },
    },
    {
      id: "notification-list-growing-collapsed",
      props: { groups: [{ title: "Orders", growing: "button", collapsed: true, items: [{ title: "New order" }] }] },
    },
    {
      id: "notification-list-items",
      props: {
        items: [
          { title: "New order (#2525) With a very long title - Lorem ipsum dolor sit amet", description: LONG, state: "critical", showClose: true, avatar: "JD", footnotes: ["John Doe", "2 Days"] },
          { title: "Leave request approved", description: "Your leave request for next week has been approved.", state: "positive", read: true, footnotes: ["Jane Smith", "1 Hour"] },
          { title: "System maintenance", description: "Planned downtime tonight.", important: true, showClose: true, footnotes: ["Admin"] },
        ],
      },
    },
    {
      id: "notification-list-actions",
      props: {
        items: [
          { title: "Purchase order awaiting approval", description: "Two buttons reserve more space next to the title, which then wraps earlier than without them.", menu: true, showClose: true, state: "information", footnotes: ["Procurement"] },
          { title: "Menu only", description: LONG, menu: true, wrapping: true, read: true, avatar: "AB", footnotes: ["Anna Bauer", "5 Minutes", "Finance"] },
          { title: "Title only" },
        ],
      },
    },
    {
      id: "notification-list-groups",
      props: {
        groups: [
          {
            title: "Orders",
            items: [
              { title: "Order #2565 delayed", description: "Shipping was delayed by the carrier.", state: "negative", showClose: true, footnotes: ["Logistics", "3 Hours"] },
              { title: "Order #2566 shipped", state: "information", read: true, footnotes: ["Logistics"] },
            ],
          },
          { title: "Approvals", collapsed: true, items: [{ title: "Purchase requisition", description: "Needs your approval." }] },
        ],
      },
    },
  ],
  react: ({ items, groups }) => {
    const item = (n: NotificationFixture) => (
      <NotificationListItem
        key={n.title}
        titleText={n.title}
        state={n.state}
        read={n.read}
        importance={n.important ? "important" : undefined}
        showClose={n.showClose}
        avatar={n.avatar ? <Avatar size="XS" initials={n.avatar} /> : undefined}
        footnotes={n.footnotes}
        menu={n.menu ? <MenuItem>Accept</MenuItem> : undefined}
        wrappingType={n.wrapping ? "normal" : undefined}
        loading={n.loading}
        loadingDelay={0}
      >
        {n.description}
      </NotificationListItem>
    )
    return (
      <NotificationList style={{ width: NOTIFICATION_WIDTH }}>
        {items?.map(item)}
        {groups?.map((g) => (
          <NotificationListGroupItem key={g.title} titleText={g.title} defaultCollapsed={g.collapsed} growing={g.growing} loading={g.loading} loadingDelay={0}>
            {g.items.map(item)}
          </NotificationListGroupItem>
        ))}
      </NotificationList>
    )
  },
})
