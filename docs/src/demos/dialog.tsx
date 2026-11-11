import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { defineDemo } from "./types"

function MovableDialog({ rtl = false }: { rtl?: boolean }) {
  const name = rtl ? "dialog-rtl" : "dialog-movable"
  return <div dir={rtl ? "rtl" : "ltr"}>
    <Dialog>
      <DialogTrigger asChild><Button id={`${name}-open`}>{rtl ? "Move and resize in RTL" : "Move and resize dialog"}</Button></DialogTrigger>
      <DialogContent id={`${name}-content`} dir={rtl ? "rtl" : "ltr"} draggable resizable style={{ width: "24rem", height: "12rem" }}>
        <DialogHeader>
          <DialogTitle>Move and resize</DialogTitle>
          <Button id={`${name}-header-action`} variant="transparent" className="ms-auto">Help</Button>
        </DialogHeader>
        <DialogBody><DialogDescription>Drag the header or the corner. Tab to the last handle to move with arrows and resize with Shift+arrows.</DialogDescription></DialogBody>
        <DialogFooter><DialogClose asChild><Button id={`${name}-close`} variant="emphasized">Close</Button></DialogClose></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
}

function AutoSizeDialog() {
  const [expanded, setExpanded] = React.useState(false)
  return <Dialog>
    <DialogTrigger asChild><Button id="dialog-auto-open">Content-sized dialog</Button></DialogTrigger>
    <DialogContent id="dialog-auto-content" draggable resizable style={{ width: "24rem" }} movementTexts={{
      dragResizeDescription: "Move with arrows; resize with Shift and arrows.",
      dragResizeReachDescription: "The final control moves and resizes this window.",
      dragResizeHandleLabel: "Move or resize window",
      handleRoleDescription: "Window control",
      resizeHandleTooltip: "Resize this window",
    }}>
      <DialogHeader><DialogTitle>Content-sized dialog</DialogTitle></DialogHeader>
      <DialogBody>
        <DialogDescription>Change the content to see when the dialog re-centers.</DialogDescription>
        <Button id="dialog-auto-toggle" onClick={() => setExpanded(!expanded)}>{expanded ? "Collapse content" : "Expand content"}</Button>
        <div id="dialog-auto-growth">{Array.from({ length: expanded ? 8 : 1 }, (_, index) => <p key={index}>Product information {index + 1}</p>)}</div>
      </DialogBody>
      <DialogFooter><DialogClose asChild><Button id="dialog-auto-close" variant="emphasized">Close</Button></DialogClose></DialogFooter>
    </DialogContent>
  </Dialog>
}

export default defineDemo({ title: "Dialog drag and resize", order: 31, Demo: () => <div id="dialog-demo" className="flex flex-wrap gap-2"><MovableDialog /><MovableDialog rtl /><AutoSizeDialog /></div> })
