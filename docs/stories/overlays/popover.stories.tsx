import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Popover, PopoverBody, PopoverClose, PopoverContent, PopoverFooter, PopoverHeader, PopoverTitle, PopoverTrigger, type PopoverContentProps } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { fioriMeta } from "../_lib/meta"

type Args = React.ComponentProps<typeof Popover> & Pick<PopoverContentProps, "side" | "align" | "hideArrow"> & { title: string; content: string; footer: boolean }
const base = fioriMeta({ name: "popover", component: Popover })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { story: { inline: false, height: "360px" } } },
  args: { open: false, modal: false, side: "bottom", align: "start", hideArrow: false, title: "Delivery details", content: "The order will arrive at the main warehouse on Friday.", footer: true, onOpenChange: fn() },
  argTypes: { ...base.argTypes, open: { control: "boolean" }, modal: { control: "boolean" }, side: { control: "select", options: ["top", "right", "bottom", "left"] }, align: { control: "inline-radio", options: ["start", "center", "end"] }, hideArrow: { control: "boolean" }, title: { control: "text" }, content: { control: "text" }, footer: { control: "boolean" }, onOpenChange: { control: false } },
  render: function DeliveryPopover(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const { title, content, footer, side, align, hideArrow, ...props } = args
    return <Popover {...props} onOpenChange={(open) => { args.onOpenChange?.(open); updateArgs({ open }) }}><PopoverTrigger asChild><Button>View delivery details</Button></PopoverTrigger><PopoverContent side={side} align={align} hideArrow={hideArrow} aria-label={title || "Delivery details"} className="w-72">{title && <PopoverHeader><PopoverTitle>{title}</PopoverTitle></PopoverHeader>}<PopoverBody>{content}</PopoverBody>{footer && <PopoverFooter><PopoverClose asChild><Button variant="emphasized">Done</Button></PopoverClose></PopoverFooter>}</PopoverContent></Popover>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Trigger: Story = {}
export const Open: Story = { args: { open: true } }
export const BodyOnly: Story = { args: { open: true, title: "", footer: false, hideArrow: true } }
export const HeaderAndFooter: Story = { args: { open: true, hideArrow: true } }
export const WithArrow: Story = { args: { open: true, footer: false } }
export const WithoutArrow: Story = { args: { open: true, hideArrow: true } }
export const Modal: Story = { args: { open: true, modal: true } }
export const LongText: Story = { args: { open: true, content: "Review the receiving address, contact person and unloading instructions before submitting your purchase order. The warehouse accepts deliveries from Monday to Friday and requires a confirmed appointment." } }
export const RTL: Story = { args: { open: true }, globals: { dir: "rtl" } }
