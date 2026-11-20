import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Text } from "@/components/ui/text"
import { fioriMeta } from "../_lib/meta"


const base = fioriMeta({ name: "text", component: Text })
const meta = {
  ...base,
  args: { children: "Review the delivery details and confirm the purchase order. The supplier will receive a notification once approval is complete, and your team can track the shipment from the order overview." },
  argTypes: { ...base.argTypes, children: { control: "text", table: { disable: false } }, maxLines: { control: "number" } },
  render: (args) => <div className="max-w-xs"><Text {...args} /></div>,
} satisfies Meta<typeof Text>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Default: Story = { args: {} }
export const OneLine: Story = { args: { maxLines: 1 } }
export const TwoLines: Story = { args: { maxLines: 2 } }
export const ShortText: Story = { args: { children: "Delivery confirmed." } }
export const RTL: Story = { globals: { dir: "rtl" } }
