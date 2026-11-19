import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { HeroBanner, type HeroBannerProps } from "@/components/ui/hero-banner"
import { Button } from "@/components/ui/button"
import { Title } from "@/components/ui/title"
import { fioriMeta } from "../_lib/meta"

type Args = HeroBannerProps & { start: boolean; end: boolean; showActions: boolean; narrow: boolean; pageLevel: boolean; onAction?: React.ComponentProps<typeof Button>["onClick"] }

const base = fioriMeta({ name: "hero-banner", component: HeroBanner })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { description: { component: "Use a named region inside main. PageBanner and PageComplementary demonstrate page-level landmarks in their own page context." } } },
  args: { headerText: "Welcome back, Ann", overlineText: "Good morning", columnsRatio: "FirstWider", actionsPlacement: "TopEnd", headerBlockPlacement: "Top", landmarkRole: "region", landmarkLabel: "Welcome", start: true, end: true, showActions: true, narrow: false, pageLevel: false, onAction: fn() },
  argTypes: { ...base.argTypes, headerText: { control: "text" }, overlineText: { control: "text" }, columnsRatio: { control: "inline-radio", options: ["Equal", "FirstWider"] }, actionsPlacement: { control: "inline-radio", options: ["TopEnd", "BottomStart"] }, headerBlockPlacement: { control: "inline-radio", options: ["Top", "Bottom"] }, landmarkRole: { control: "select", options: ["region"], description: "The named region is suitable within main. PageBanner and PageComplementary show the page-level roles." }, landmarkLabel: { control: "text" }, start: { control: "boolean" }, end: { control: "boolean" }, showActions: { control: "boolean" }, narrow: { control: "boolean" }, pageLevel: { control: false, table: { disable: true } }, actions: { control: false }, endContent: { control: false }, onAction: { control: false } },
  render: function WelcomeBanner(args: Args) {
    const { start, end, showActions, narrow, pageLevel, onAction, ...props } = args
    const [count, setCount] = React.useState(0)
    return <div className={narrow ? "max-w-sm" : "w-full"}><HeroBanner {...props} landmarkRole={props.landmarkRole ?? (pageLevel ? "banner" : "region")} actions={showActions ? <Button variant="transparent" onClick={(event) => { onAction?.(event); setCount((value) => value + 1) }}>Customize</Button> : undefined} endContent={end ? <p>Three approvals are waiting for you.</p> : undefined}>{start ? <p>Your team closed twelve orders this week.</p> : undefined}</HeroBanner>{pageLevel ? <main className="grid gap-2" aria-label="Welcome dashboard"><Title level="H2">Today's work</Title><p>Review your orders and pending approvals.</p>{showActions && <output>Customized {count} times</output>}</main> : showActions && <output>Customized {count} times</output>}</div>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const PageBanner: Story = { args: { landmarkRole: "banner", pageLevel: true }, parameters: { fiori: { ...base.parameters.fiori, ownsLandmarks: true }, docs: { story: { inline: false, height: "600px" } } } }
export const PageComplementary: Story = { args: { landmarkRole: "complementary", pageLevel: true }, parameters: { fiori: { ...base.parameters.fiori, ownsLandmarks: true }, docs: { story: { inline: false, height: "600px" } } } }
export const HeaderOnly: Story = { args: { start: false, end: false, showActions: false } }
export const HeaderAndActions: Story = { args: { start: false, end: false } }
export const BottomActions: Story = { args: { start: false, end: false, actionsPlacement: "BottomStart" } }
export const FirstColumn: Story = { args: { end: false, showActions: false } }
export const TwoColumns: Story = { args: {} }
export const EqualColumns: Story = { args: { columnsRatio: "Equal", showActions: false } }
export const BottomHeading: Story = { args: { start: false, headerBlockPlacement: "Bottom" } }
export const Narrow: Story = { args: { narrow: true } }
export const RTL: Story = { globals: { dir: "rtl" } }
