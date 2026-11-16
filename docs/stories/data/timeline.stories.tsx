import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Timeline, TimelineGroupItem, TimelineItem, type TimelineProps, type TimelineItemState } from "@/components/ui/timeline"
import { Title } from "@/components/ui/title"
import { calendar, email, phone } from "@/lib/fiori-icons"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"

type Args = TimelineProps & { icons?: "all" | "none" | "mixed"; grouped?: boolean; collapsed?: boolean; itemState?: TimelineItemState; empty?: boolean; onNameClick?: () => void; onGroupToggle?: (collapsed: boolean) => void }
const base = fioriMeta({ name: "timeline", component: Timeline })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: S2DocsPage } },
  args: { layout: "Vertical", growing: "None", accessibleName: "Order history", loading: false, loadingDelay: 0, stickyHeader: false, icons: "all", grouped: false, collapsed: false, itemState: "None", empty: false, onLoadMore: fn(), onNameClick: fn(), onGroupToggle: fn() },
  argTypes: {
    ...base.argTypes,
    layout: { control: "inline-radio", options: ["Vertical", "Horizontal"] }, growing: { control: "inline-radio", options: ["None", "Button", "Scroll"] }, accessibleName: { control: "text" }, loading: { control: "boolean" }, loadingDelay: { control: "number" }, stickyHeader: { control: "boolean" }, timelineText: { control: "text" }, loadMoreText: { control: "text" },
    icons: { control: "inline-radio", options: ["all", "none", "mixed"] }, grouped: { control: "boolean" }, collapsed: { control: "boolean" }, itemState: { control: "select", options: ["None", "Negative", "Critical", "Positive", "Information"] }, empty: { control: "boolean" }, header: { control: false }, infoBar: { control: false }, onLoadMore: { control: false }, onNameClick: { control: false }, onGroupToggle: { control: false },
  },
  render: function OrderTimeline(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const { icons, grouped, collapsed, itemState, empty, onNameClick, onGroupToggle, ...props } = args
    const [extra, setExtra] = React.useState(0)
    const eventDate = (day: number) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(2024, 2, day, 10))
    const call = <TimelineItem icon={icons !== "none" ? phone : undefined} iconTooltip="Supplier call" titleText="Called supplier" subtitleText={eventDate(10)} state={itemState}>Delivery confirmed.</TimelineItem>
    const message = <TimelineItem icon={icons === "all" ? email : undefined} iconTooltip="Email" name="Ann Lee" nameClickable onNameClick={onNameClick} titleText="Sent a message" subtitleText={eventDate(9)} />
    return <Timeline {...props} onLoadMore={() => { args.onLoadMore?.(); setExtra((current) => current + 1) }}>
      {!empty && <><TimelineItem icon={icons !== "none" ? calendar : undefined} iconTooltip="Meeting" name="John Smith" titleText="Weekly sync" subtitleText={eventDate(12)} state={itemState} />{grouped ? <TimelineGroupItem groupName="Last week" collapsed={collapsed} onToggle={(collapsed) => { onGroupToggle?.(collapsed); updateArgs({ collapsed }) }}>{call}{message}</TimelineGroupItem> : <>{call}{message}</>}<TimelineItem titleText="Order created" subtitleText={eventDate(8)} />{Array.from({ length: extra }, (_, index) => <TimelineItem key={index} titleText={`Older event ${index + 1}`} subtitleText={eventDate(7)} />)}</>}
    </Timeline>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Vertical: Story = {}
export const VerticalNoIcons: Story = { args: { icons: "none" } }
export const VerticalMixedIcons: Story = { args: { icons: "mixed" } }
export const None: Story = { args: { itemState: "None" } }
export const Negative: Story = { args: { itemState: "Negative" } }
export const Critical: Story = { args: { itemState: "Critical" } }
export const Positive: Story = { args: { itemState: "Positive" } }
export const Information: Story = { args: { itemState: "Information" } }
export const GrowingButton: Story = { args: { growing: "Button" } }
export const GrowingScroll: Story = { args: { growing: "Scroll", className: "max-h-60 overflow-auto" } }
export const Grouped: Story = { args: { grouped: true } }
export const CollapsedGroup: Story = { args: { grouped: true, collapsed: true } }
export const Horizontal: Story = { args: { layout: "Horizontal" } }
export const HorizontalNoIcons: Story = { args: { layout: "Horizontal", icons: "none" } }
export const HorizontalMixedIcons: Story = { args: { layout: "Horizontal", icons: "mixed" } }
export const HorizontalGrowing: Story = { args: { layout: "Horizontal", growing: "Button" } }
export const HorizontalGroup: Story = { args: { layout: "Horizontal", grouped: true } }
export const HorizontalCollapsedGroup: Story = { args: { layout: "Horizontal", grouped: true, collapsed: true } }
export const Loading: Story = { args: { loading: true, loadingDelay: 0 } }
export const Empty: Story = { args: { empty: true } }
export const WithHeader: Story = { args: { header: <Title level="H2" size="H5">Order history</Title>, infoBar: <p>Events for purchase order PO-48865</p>, stickyHeader: true } }
export const CustomTexts: Story = { args: { timelineText: "Order activity", loadMoreText: "Load older events", growing: "Button" }, render: function LocalizedTimeline(args: Args) {
  const [extra, setExtra] = React.useState(0)
  return <Timeline accessibleName="Shipment" timelineText="Shipment activity" growing="Button" loadMoreText="Load older events" onLoadMore={() => { args.onLoadMore?.(); setExtra((current) => current + 1) }}><TimelineGroupItem groupName="Previous updates" collapsedText="Updates hidden" expandedText="Updates visible"><TimelineItem icon={phone} iconTooltip="Supplier contact" titleText="Delivery confirmed" state="Positive" stateText="Delivery succeeded" /></TimelineGroupItem>{Array.from({ length: extra }, (_, index) => <TimelineItem key={index} titleText={`Older update ${index + 1}`} />)}</Timeline>
} }
export const RTL: Story = { globals: { dir: "rtl" }, args: { layout: "Horizontal" } }

// Current defaults are read from registry/ui/timeline.tsx and its shared calendar/input/clock primitives.
// UI5 keys come from the installed 2.28 English i18n defaults; non-identical wording is identified explicitly.
function S2DocsPage() {
  const textKeys = [
  {
    "prop": "collapsedText",
    "text": "collapsed",
    "key": "Application text; no identical UI5 2.28 default"
  },
  {
    "prop": "expandedText",
    "text": "expanded",
    "key": "Application text; no identical UI5 2.28 default"
  },
  {
    "prop": "timelineText",
    "text": "Timeline",
    "key": "TIMELINE_ARIA_LABEL"
  },
  {
    "prop": "loadMoreText",
    "text": "Load More",
    "key": "TIMELINE_LOAD_MORE_BUTTON_TEXT"
  },
  {
    "prop": "TimelineItem.stateText (Information)",
    "text": "Information State",
    "key": "TIMELINE_ITEM_INFORMATION_STATE_TEXT"
  },
  {
    "prop": "TimelineItem.stateText (Positive)",
    "text": "Positive State",
    "key": "TIMELINE_ITEM_POSITIVE_STATE_TEXT"
  },
  {
    "prop": "TimelineItem.stateText (Negative)",
    "text": "Negative State",
    "key": "TIMELINE_ITEM_NEGATIVE_STATE_TEXT"
  },
  {
    "prop": "TimelineItem.stateText (Critical)",
    "text": "Critical State",
    "key": "TIMELINE_ITEM_CRITICAL_STATE_TEXT"
  }
]
  return <><DocsPage /><section aria-label="Localization text keys"><h2>Localization text keys</h2><p>Override these props to translate built-in labels and announcements. English defaults below describe the current component API.</p><table><thead><tr><th>Text prop / key</th><th>UI5 reference key</th><th>English default</th></tr></thead><tbody>{textKeys.map((text) => <tr key={text.prop}><td><code>{text.prop}</code></td><td>{text.key}</td><td>{text.text}</td></tr>)}</tbody></table></section></>
}
