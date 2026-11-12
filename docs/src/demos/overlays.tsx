import * as React from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { ValueState } from "@/components/ui/input"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "@/components/ui/menu"
import { Popover, PopoverBody, PopoverClose, PopoverContent, PopoverFooter, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { Toast, type ToastPlacement } from "@/components/ui/toast"
import { copy, deleteIcon, edit, paste, share } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

const states: [ValueState, string][] = [
  ["negative", "Negative"],
  ["critical", "Critical"],
  ["positive", "Positive"],
  ["information", "Information"],
]

function StateDialog({ state, label }: { state: ValueState; label: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button data-demo="state-dialog">{label}</Button>
      </DialogTrigger>
      <DialogContent state={state}>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <DialogBody>This dialog has the {label.toLowerCase()} state.</DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="emphasized">OK</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Overlays() {
  const [last, setLast] = React.useState("")
  const [toastOpen, setToastOpen] = React.useState(false)
  const [placement, setPlacement] = React.useState<ToastPlacement>("bottom-center")
  const showToast = (p: ToastPlacement) => {
    setPlacement(p)
    setToastOpen(false)
    requestAnimationFrame(() => setToastOpen(true))
  }
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button id="open-dialog">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit product</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
                <Label htmlFor="dialog-name" showColon>Name</Label>
                <Input id="dialog-name" defaultValue="Notebook Basic 15" />
              </div>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="emphasized">Save</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {states.map(([s, l]) => <StateDialog key={s} state={s} label={l} />)}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button id="open-popover">Open popover</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" className="w-64">
            <PopoverHeader>
              <PopoverTitle>Details</PopoverTitle>
            </PopoverHeader>
            <PopoverBody>Popovers show extra information next to their opener.</PopoverBody>
            <PopoverFooter>
              <PopoverClose asChild>
                <Button variant="emphasized">OK</Button>
              </PopoverClose>
            </PopoverFooter>
          </PopoverContent>
        </Popover>
        <Menu>
          <MenuTrigger asChild>
            <Button id="open-menu">Open menu</Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem icon={edit} onSelect={() => setLast("Edit")}>Edit</MenuItem>
            <MenuItem icon={copy} additionalText="Ctrl+C" onSelect={() => setLast("Copy")}>Copy</MenuItem>
            <MenuItem icon={paste} disabled>Paste</MenuItem>
            <MenuSeparator />
            <MenuSub>
              <MenuSubTrigger icon={share}>Share</MenuSubTrigger>
              <MenuSubContent>
                <MenuItem onSelect={() => setLast("Email")}>Email</MenuItem>
                <MenuItem onSelect={() => setLast("Chat")}>Chat</MenuItem>
              </MenuSubContent>
            </MenuSub>
            <MenuItem icon={deleteIcon} onSelect={() => setLast("Delete")}>Delete</MenuItem>
          </MenuContent>
        </Menu>
        <span id="menu-result" className="text-(--sapContent_LabelColor)">{last && `Selected: ${last}`}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button id="show-toast" onClick={() => showToast("bottom-center")}>Show toast</Button>
        <Button onClick={() => showToast("top-end")}>Toast top end</Button>
        <Button onClick={() => showToast("middle-center")}>Toast middle center</Button>
        <Toast open={toastOpen} onOpenChange={setToastOpen} placement={placement}>Product saved</Toast>
      </div>
    </div>
  )
}

export default defineDemo({
  category: "Overlays",
  docs: [
    {
      name: "dialog",
      description: "Modal surfaces with labelled content, value states and focus management.",
      props: [
        { name: "Dialog.open", type: "boolean", description: "Controlled open state." },
        { name: "Dialog.onOpenChange", type: "(open: boolean) => void", description: "Receive open-state changes." },
        { name: "Dialog.modal", type: "boolean", description: "Trap focus and block outside interaction.", defaultValue: "true" },
        { name: "DialogContent.state", type: "ValueState", description: "Semantic state of the dialog.", defaultValue: "none" },
        { name: "DialogContent.portal", type: "boolean", description: "Render the surface through a portal.", defaultValue: "true" },
      ],
    },
    {
      name: "popover",
      description: "Anchored supplementary content with configurable placement.",
      props: [
        { name: "Popover.open", type: "boolean", description: "Controlled popup state." },
        { name: "Popover.onOpenChange", type: "(open: boolean) => void", description: "Receive popup-state changes." },
        { name: "PopoverContent.side", type: "top | right | bottom | left", description: "Preferred side of the opener.", defaultValue: "right" },
        { name: "PopoverContent.align", type: "start | center | end", description: "Alignment relative to the opener.", defaultValue: "center" },
        { name: "PopoverContent.hideArrow", type: "boolean", description: "Hide the directional arrow.", defaultValue: "false" },
      ],
    },
    {
      name: "menu",
      description: "Action menus with icons, shortcuts and nested submenus.",
      props: [
        { name: "Menu.open", type: "boolean", description: "Controlled root menu state." },
        { name: "Menu.onOpenChange", type: "(open: boolean) => void", description: "Receive root menu-state changes." },
        { name: "MenuItem.icon", type: "FioriIconData", description: "Leading item icon." },
        { name: "MenuItem.additionalText", type: "ReactNode", description: "Shortcut or secondary text." },
        { name: "MenuItem.onSelect", type: "(event: Event) => void", description: "Receive item activation; preventDefault retains the menu." },
      ],
    },
    {
      name: "toast",
      description: "Transient status feedback positioned relative to the viewport.",
      props: [
        { name: "Toast.open", type: "boolean", description: "Controlled visibility." },
        { name: "Toast.onOpenChange", type: "(open: boolean) => void", description: "Receive visibility changes." },
        { name: "Toast.duration", type: "number", description: "Automatic dismissal delay in milliseconds.", defaultValue: "3000" },
        { name: "Toast.placement", type: "ToastPlacement", description: "Viewport placement.", defaultValue: "bottom-center" },
        { name: "Toast.portal", type: "boolean", description: "Render outside the surrounding layout.", defaultValue: "true" },
      ],
    },
  ],
 title: "Dialog, Popover, Menu, Toast", order: 30, Demo: Overlays })
