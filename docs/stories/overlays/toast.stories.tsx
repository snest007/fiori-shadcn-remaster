import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { fioriMeta } from "../_lib/meta"
const base = fioriMeta({ name: "toast", component: Toast })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { story: { inline: false, height: "280px" } } },
  args: { open: false, duration: 3000, placement: "bottom-center", portal: true, children: "Purchase order saved", onOpenChange: fn() },
  argTypes: { ...base.argTypes, children: { control: "text", table: { disable: false } }, open: { control: "boolean" }, duration: { control: "number" }, placement: { control: "select", options: ["top-start", "top-center", "top-end", "middle-start", "middle-center", "middle-end", "bottom-start", "bottom-center", "bottom-end"] }, portal: { control: "boolean" }, onOpenChange: { control: false } },
  render: function OrderNotification(args) {
    const [, updateArgs] = useArgs<React.ComponentProps<typeof Toast>>()
    const [sequence, setSequence] = React.useState(0)
    return <div className="grid gap-3"><Button onClick={() => { setSequence((value) => value + 1); args.onOpenChange?.(true); updateArgs({ open: true }) }}>Save purchase order</Button><Toast key={sequence} {...args} onOpenChange={(open) => { args.onOpenChange?.(open); updateArgs({ open }) }} /></div>
  },
} satisfies Meta<typeof Toast>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Trigger: Story = {}
export const Open: Story = { args: { open: true, duration: Infinity } }
export const Wrapping: Story = { args: { open: true, duration: Infinity, children: "The changes were saved and all purchase order approvers have been notified.", className: "max-w-xs" } }
export const TopStart: Story = { args: { open: true, duration: Infinity, placement: "top-start" } }
export const TopCenter: Story = { args: { open: true, duration: Infinity, placement: "top-center" } }
export const TopEnd: Story = { args: { open: true, duration: Infinity, placement: "top-end" } }
export const MiddleStart: Story = { args: { open: true, duration: Infinity, placement: "middle-start" } }
export const MiddleCenter: Story = { args: { open: true, duration: Infinity, placement: "middle-center" } }
export const MiddleEnd: Story = { args: { open: true, duration: Infinity, placement: "middle-end" } }
export const BottomStart: Story = { args: { open: true, duration: Infinity, placement: "bottom-start" } }
export const BottomCenter: Story = { args: { open: true, duration: Infinity, placement: "bottom-center" } }
export const BottomEnd: Story = { args: { open: true, duration: Infinity, placement: "bottom-end" } }
export const InPlace: Story = { args: { open: true, duration: Infinity, portal: false } }
export const RTL: Story = { args: { open: true, duration: Infinity, placement: "bottom-start" }, globals: { dir: "rtl" } }
