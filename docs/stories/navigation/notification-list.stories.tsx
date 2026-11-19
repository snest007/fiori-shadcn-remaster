import * as React from "react"
import { ArgTypes, Controls, DocsContext, DocsStory, Primary, Title as DocsTitle } from "@storybook/addon-docs/blocks"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs, useState } from "storybook/preview-api"
import { fn } from "storybook/test"
import { NotificationList, NotificationListItem, NotificationListGroupItem } from "@/components/ui/notification-list"
import { MenuItem } from "@/components/ui/menu"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { docsLink, fioriMeta } from "../_lib/meta"
const description = "The carrier has rescheduled delivery. Review the shipping address and contact the supplier to agree a new delivery date. The purchasing team will receive an update after you confirm the revised plan."
type Args = React.ComponentProps<typeof NotificationList> & Pick<React.ComponentProps<typeof NotificationListItem>, "read" | "importance" | "state" | "showClose" | "wrappingType" | "loading"> & Pick<React.ComponentProps<typeof NotificationListGroupItem>, "collapsed" | "growing" | "onLoadMore"> & { grouped: boolean; withActions: boolean; childLoading: boolean; empty: boolean }
const base = fioriMeta({ name: "notification-list", component: NotificationList })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: ItemDocs } },
  args: { read: false, importance: "standard", state: "negative", showClose: true, wrappingType: "none", loading: false, childLoading: false, grouped: true, withActions: false, collapsed: false, growing: "none", empty: false, onItemClick: fn(), onItemClose: fn(), onItemToggle: fn(), onLoadMore: fn() },
  argTypes: { ...base.argTypes, read: { control: "boolean" }, importance: { control: "inline-radio", options: ["standard", "important"] }, state: { control: "select", options: ["negative", "critical", "positive", "information"] }, showClose: { control: "boolean" }, wrappingType: { control: "inline-radio", options: ["none", "normal"] }, loading: { control: "boolean" }, childLoading: { control: "boolean" }, collapsed: { control: "boolean" }, grouped: { control: "boolean" }, withActions: { control: "boolean" }, empty: { control: "boolean" }, growing: { control: "inline-radio", options: ["none", "button", "scroll"] }, noDataText: { control: "text" }, texts: { control: false }, onItemClick: { control: false }, onItemClose: { control: false }, onItemToggle: { control: false }, onLoadMore: { control: false } },
  render: function OrderNotifications(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const [closed, setClosed] = useState<string[]>([])
    const [extra, setExtra] = useState(0)
    const { read, importance, state, showClose, wrappingType, loading, childLoading, grouped, withActions, collapsed, growing, empty, onLoadMore, ...list } = args
    const items = empty ? null : <>{!closed.includes("delayed") && <NotificationListItem value="delayed" titleText="Order 1001 delayed" state={state} read={read} importance={importance} showClose={showClose} wrappingType={wrappingType} loading={childLoading || (!grouped && loading)} loadingDelay={0} menu={withActions ? <><MenuItem>Contact supplier</MenuItem><MenuItem>Review order</MenuItem></> : undefined} avatar={withActions ? <Avatar size="XS" initials="AL" accessibleName="Alex Lee" /> : undefined} footnotes={["Purchasing", "Today"]}>{description}</NotificationListItem>}{!closed.includes("shipped") && <NotificationListItem value="shipped" titleText="Order 1002 shipped" state="positive" read showClose={showClose}>The shipment has left the warehouse.</NotificationListItem>}{Array.from({ length: extra }, (_, index) => <NotificationListItem key={index} value={`new-${index}`} titleText={`Order ${1003 + index} confirmed`}>The supplier confirmed this order.</NotificationListItem>)}</>
    return <div className="max-w-xl"><NotificationList {...list} onItemClose={(value) => { args.onItemClose?.(value); setClosed((previous) => [...previous, value]) }} onItemToggle={(value, collapsed) => { args.onItemToggle?.(value, collapsed); updateArgs({ collapsed }) }}>{grouped && !empty ? <NotificationListGroupItem value="orders" titleText="Orders" read={read} collapsed={collapsed} onCollapsedChange={(collapsed) => updateArgs({ collapsed })} growing={growing} loading={loading} loadingDelay={0} onLoadMore={() => { onLoadMore?.(); setExtra((previous) => previous + 2) }}>{items}</NotificationListGroupItem> : items}</NotificationList></div>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Items: Story = { args: { grouped: false } }
export const Actions: Story = { args: { grouped: false, withActions: true } }
export const Groups: Story = {}
export const Collapsed: Story = { args: { collapsed: true } }
export const Read: Story = { args: { read: true } }
export const Important: Story = { args: { importance: "important" } }
export const Negative: Story = {}
export const Critical: Story = { args: { state: "critical" } }
export const Positive: Story = { args: { state: "positive" } }
export const Information: Story = { args: { state: "information" } }
export const Wrapping: Story = { args: { wrappingType: "normal" } }
export const ItemLoading: Story = { args: { grouped: false, loading: true } }
export const GrowingButton: Story = { args: { growing: "button" } }
export const GrowingButtonLoading: Story = { args: { growing: "button", loading: true } }
export const GrowingButtonChildLoading: Story = { args: { growing: "button", childLoading: true } }
export const GrowingScrollLoading: Story = { args: { growing: "scroll", loading: true } }
export const GrowingCollapsed: Story = { args: { growing: "button", collapsed: true } }
export const Empty: Story = { args: { empty: true, noDataText: "No order notifications" } }
// Custom visible action text and its spoken label must describe the same action.
export const CustomTexts: Story = { args: { texts: { list: "Order updates", close: "Dismiss update", actions: "Update actions", more: "Read full update", less: "Collapse update", moreLabel: "Read full update. Show the full texts", lessLabel: "Collapse update. Show the texts with truncation", growingButton: "Load older updates", important: "Priority" }, growing: "button", withActions: true } }
export const RTL: Story = { globals: { dir: "rtl" } }

// Source-backed defaults from registry/ui/notification-list.tsx and the installed UI5 bundles.
const textKeys = [
  [
    "texts.list",
    "NOTIFICATION_LIST_ACCESSIBLE_NAME",
    "Notifications"
  ],
  [
    "texts.more",
    "NOTIFICATION_LIST_ITEM_SHOW_MORE",
    "More"
  ],
  [
    "texts.less",
    "NOTIFICATION_LIST_ITEM_SHOW_LESS",
    "Less"
  ],
  [
    "texts.growingButton",
    "NOTIFICATION_LIST_ITEM_SHOW_MORE",
    "More"
  ],
  [
    "texts.moreLabel",
    "NOTIFICATION_LIST_ITEM_MORE_LINK_LABEL_FULL",
    "More button. Show the full texts"
  ],
  [
    "texts.lessLabel",
    "NOTIFICATION_LIST_ITEM_MORE_LINK_LABEL_TRUNCATE",
    "Less button. Show the texts with truncation"
  ],
  [
    "texts.actions",
    "NOTIFICATION_LIST_ITEM_MENU_BTN_TITLE",
    "Actions"
  ],
  [
    "texts.close",
    "NOTIFICATION_LIST_ITEM_CLOSE_BTN_TITLE",
    "Close"
  ],
  [
    "texts.read",
    "NOTIFICATION_LIST_ITEM_READ",
    "Read"
  ],
  [
    "texts.unread",
    "NOTIFICATION_LIST_ITEM_UNREAD",
    "Unread"
  ],
  [
    "texts.states.negative",
    "NOTIFICATION_LIST_ITEM_NEGATIVE_STATUS_TXT",
    "Status Negative"
  ],
  [
    "texts.states.critical",
    "NOTIFICATION_LIST_ITEM_CRITICAL_STATUS_TXT",
    "Status Critical"
  ],
  [
    "texts.states.positive",
    "NOTIFICATION_LIST_ITEM_POSITIVE_STATUS_TXT",
    "Status Positive"
  ],
  [
    "texts.states.information",
    "NOTIFICATION_LIST_ITEM_INFORMATION_STATUS_TXT",
    "Status Information"
  ],
  [
    "texts.important",
    "NOTIFICATION_LIST_ITEM_IMPORTANT_TXT",
    "Important"
  ],
  [
    "texts.loading",
    "NOTIFICATION_LIST_ITEM_LOADING",
    "Loading"
  ],
  [
    "texts.busyTitle",
    "BUSY_INDICATOR_TITLE",
    "Please wait"
  ],
  [
    "texts.group",
    "NOTIFICATION_LIST_GROUP_ITEM_TXT",
    "Notification Group"
  ],
  [
    "texts.expanded",
    "NOTIFICATION_LIST_GROUP_EXPANDED",
    "Expanded"
  ],
  [
    "texts.collapsed",
    "NOTIFICATION_LIST_GROUP_COLLAPSED",
    "Collapsed"
  ],
  [
    "texts.toggle",
    "NOTIFICATION_LIST_GROUP_ITEM_TOGGLE_ICON_COLLAPSE_TITLE",
    "Expand/Collapse"
  ]
]
// Source: registry/items/notification-list.json and registry/ui/notification-list.tsx; story-local docs preserve the S0 fiori metadata.
const guide = {
  "description": "Fiori notifications with state icons, read/unread, importance, actions menu, close button, More/Less and collapsible groups with button or scroll growing (ui5-notification-list).",
  "usage": {
    "summary": "Collect business-event updates that users may read, act on or dismiss without interrupting their task.",
    "useWhen": [
      "Keep users informed about relevant reminders, alerts or workflow updates they can revisit.",
      "Group related events and distinguish unread state and importance so users can decide what needs attention.",
      "Provide item actions or dismissal only when they are useful for the event."
    ],
    "avoidWhen": [
      {
        "when": "Confirm a completed action transiently without keeping an event collection.",
        "use": [
          "toast"
        ]
      },
      {
        "when": "Browse ordinary business items rather than event-triggered updates.",
        "use": [
          "list"
        ]
      }
    ],
    "source": "sap-fiori-guidelines"
  }
}
const accessibilityNote = "texts.list names the list; titleText and hidden read/state texts name each item. Arrow keys, Home/End and PageUp/PageDown navigate, F2 enters content, Shift+Enter toggles full text, Shift+F10 opens actions and Delete requests dismissal. The caller removes dismissed records."
function ItemDocs() {
  const context = React.useContext(DocsContext)
  const variants = context.componentStories().filter((story) => story.tags?.includes("autodocs") && !story.usesMount).slice(1)
  const [copied, setCopied] = React.useState(false)
  const command = "npx shadcn add @petalo/notification-list"
  return <main><DocsTitle /><p>{guide.description}</p>
    <section aria-label="Install component"><div className="flex items-center gap-3"><pre><code>{command}</code></pre><Button aria-label="Copy install command" onClick={async () => { await navigator.clipboard.writeText(command); setCopied(true) }}>{copied ? "Copied" : "Copy"}</Button></div><span role="status" className="sr-only">{copied ? "Install command copied" : ""}</span></section>
    <section aria-label="Usage guidance"><p>{guide.usage.summary}</p><h2>When to use</h2><ul>{guide.usage.useWhen.map((text) => <li key={text}>{text}</li>)}</ul><h2>Don't use</h2><ul>{guide.usage.avoidWhen.map((entry) => <li key={entry.when}>{entry.when}{" "}{entry.use.map((alternative, index) => <React.Fragment key={alternative}>{index > 0 && ", "}<a href={docsLink(alternative)} target="_top">{alternative}</a></React.Fragment>)}</li>)}</ul></section>
    <section aria-label="Accessibility"><h2>Accessibility</h2><ul><li>{accessibilityNote}</li></ul></section>
    <section aria-label="Localization"><h2>Localization</h2>{textKeys.length ? <><p>Override these props for application terminology. Function texts receive their parameters in UI5 order.</p><table><thead><tr><th>Text prop / key</th><th>UI5 key</th><th>English default</th></tr></thead><tbody>{textKeys.map(([key, ui5, value]) => <tr key={key}><td><code>{key}</code></td><td>{ui5}</td><td>{value}</td></tr>)}</tbody></table></> : <p>Supply application labels and native accessible names through the component's content and aria props. The Direction toolbar applies RTL to each example.</p>}</section>
    <h2>Playground</h2><div data-fiori-primary><Primary /></div><div data-fiori-controls><Controls /></div>
    <h2>Props</h2><ArgTypes />
    <h2>Variants and examples</h2>{variants.map((story) => <DocsStory key={story.id} of={story.moduleExport} __forceInitialArgs={false} />)}
  </main>
}
