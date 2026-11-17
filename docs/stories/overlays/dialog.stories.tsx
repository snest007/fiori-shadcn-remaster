import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, type DialogContentProps } from "@/components/ui/dialog"
import { Bar } from "@/components/ui/bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fioriMeta } from "../_lib/meta"
import { fioriArgTypes } from "../_lib/argTypes"

type Args = React.ComponentProps<typeof Dialog> & Pick<DialogContentProps, "state" | "portal" | "draggable" | "resizable" | "movementTexts"> & { footer?: boolean }
const base = fioriMeta({ name: "dialog", component: Dialog })
const contentProps = fioriArgTypes("dialog", "DialogContent")
const meta = {
  ...base,
  args: { open: false, modal: true, state: "none", draggable: false, resizable: false, footer: true, onOpenChange: fn() },
  argTypes: {
    ...base.argTypes, ...contentProps,
    open: { ...base.argTypes?.open, control: "boolean" }, modal: { ...base.argTypes?.modal, control: "boolean" },
    state: { ...contentProps.state, control: "select", options: ["none", "negative", "critical", "positive", "information"] },
    draggable: { ...contentProps.draggable, control: "boolean" }, resizable: { ...contentProps.resizable, control: "boolean" }, footer: { control: "boolean", description: "Show the action footer in this example." },
    movementTexts: { ...contentProps.movementTexts, control: "object" }, portal: { control: false, table: { disable: true } },
    onOpenChange: { ...base.argTypes?.onOpenChange, control: false },
  },
  render: function ProductDialog(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    const { state, portal, draggable, resizable, movementTexts, footer, ...props } = args
    return <Dialog {...props} onOpenChange={(open) => { args.onOpenChange?.(open); updateArgs({ open }) }}>
      <DialogTrigger asChild><Button>Edit product</Button></DialogTrigger>
      <DialogContent portal={portal} state={state} draggable={draggable} resizable={resizable} movementTexts={movementTexts}>
        <DialogHeader><DialogTitle>Edit product</DialogTitle></DialogHeader>
        <DialogBody><DialogDescription>Update the product name before saving.</DialogDescription><div className="grid gap-2"><Label htmlFor="dialog-product-name" showColon>Name</Label><Input id="dialog-product-name" defaultValue="Notebook Basic 15" /></div></DialogBody>
        {footer && <DialogFooter><DialogClose asChild><Button variant="emphasized">Save</Button></DialogClose><DialogClose asChild><Button>Cancel</Button></DialogClose></DialogFooter>}
      </DialogContent>
    </Dialog>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
const openDocs = { docs: { story: { inline: false, height: "480px" } } }

export const Playground: Story = {}
export const Trigger: Story = {}
export const Open: Story = { args: { open: true }, parameters: openDocs }
export const None: Story = { args: { open: true, state: "none" }, parameters: openDocs }
export const Negative: Story = { args: { open: true, state: "negative" }, parameters: openDocs }
export const Critical: Story = { args: { open: true, state: "critical" }, parameters: openDocs }
export const Positive: Story = { args: { open: true, state: "positive" }, parameters: openDocs }
export const Information: Story = { args: { open: true, state: "information" }, parameters: openDocs }
export const WithoutFooter: Story = { args: { open: true, footer: false }, parameters: openDocs }
export const Draggable: Story = { args: { open: true, draggable: true }, parameters: openDocs }
export const Resizable: Story = { args: { open: true, resizable: true }, parameters: openDocs }
export const DraggableResizable: Story = { args: { open: true, draggable: true, resizable: true }, parameters: openDocs }
export const ResizableRTL: Story = { args: { open: true, resizable: true }, globals: { dir: "rtl" }, parameters: openDocs }
export const CustomTexts: Story = { args: { open: true, draggable: true, resizable: true, movementTexts: { dragResizeHandleLabel: "Move or resize product editor", dragResizeDescription: "Arrow keys move the editor; Shift and arrow keys change its size.", dragResizeReachDescription: "Tab to the editor's movement handle." } }, parameters: openDocs }
export const RTL: Story = { args: { open: true }, globals: { dir: "rtl" }, parameters: openDocs }
export const WithFooterBar: Story = { parameters: openDocs, render: function ConfirmOrder() {
  const [open, setOpen] = React.useState(true)
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button>Review order</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Confirm order</DialogTitle></DialogHeader><DialogBody><DialogDescription>Submit purchase order 45000123 to Northwind Traders?</DialogDescription></DialogBody><Bar design="footer" endContent={<><DialogClose asChild><Button variant="emphasized">Submit</Button></DialogClose><DialogClose asChild><Button>Cancel</Button></DialogClose></>} /></DialogContent></Dialog>
} }

export const CustomHost: Story = { render: () => <Dialog open modal={false}><DialogContent asChild portal={false}><section><DialogHeader><DialogTitle>Custom host dialog</DialogTitle></DialogHeader><DialogBody>Dialog content</DialogBody></section></DialogContent></Dialog> }
