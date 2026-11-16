import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Title } from "@/components/ui/title"
import { fioriMeta } from "../_lib/meta"


const base = fioriMeta({ name: "title", component: Title })
const meta = {
  ...base,
  args: { children: "Purchase orders", level: "H2", size: "H5", wrappingType: "Normal" },
  argTypes: { ...base.argTypes, children: { control: "text", table: { disable: false } }, level: { control: "select", options: ["H1", "H2", "H3", "H4", "H5", "H6"] }, size: { control: "select", options: ["H1", "H2", "H3", "H4", "H5", "H6"] }, wrappingType: { control: "inline-radio", options: ["Normal", "None"] } },
  render: (args) => <div className="max-w-xs"><Title {...args} /></div>,
} satisfies Meta<typeof Title>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const SizeH1: Story = { args: { size: "H1", level: "H1" } }
export const SizeH2: Story = { args: { size: "H2", level: "H2" } }
export const SizeH3: Story = { args: { size: "H3", level: "H3" } }
export const SizeH4: Story = { args: { size: "H4", level: "H4" } }
export const SizeH5: Story = { args: { size: "H5", level: "H5" } }
export const SizeH6: Story = { args: { size: "H6", level: "H6" } }
export const Default: Story = { args: {} }
export const Wrapping: Story = { args: { size: "H4", children: "Purchase orders awaiting confirmation from international suppliers" } }
export const Truncated: Story = { args: { size: "H4", wrappingType: "None", children: "Purchase orders awaiting confirmation from international suppliers" } }
export const IndependentLevelAndSize: Story = { args: { level: "H3", size: "H1" } }
export const RTL: Story = { globals: { dir: "rtl" } }

