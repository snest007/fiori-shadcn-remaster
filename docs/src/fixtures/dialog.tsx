import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ValueState } from "@/components/ui/input"

import { defineFixtures } from "../fixture-types"

type Props = { state?: ValueState; footer?: boolean; draggable?: boolean; resizable?: boolean; rtl?: boolean; reactHost?: boolean }
const states = ["negative", "critical", "positive", "information"] as const

// Overlays are pixel-compared as their surface, rendered in place: the dialog is open but non-modal
// and not portaled, so it sits inside the cell (UI5's side does the same with ui5-dialog, see dialog.ui5.ts).
// The wrapper clips the large dialog shadow so it can't bleed into neighbouring cells (both pages).
const fixtureSet = defineFixtures<Props>({
  name: "dialog",
  cases: [
    { id: "dialog", props: { footer: true } },
    { id: "dialog-no-footer", props: {} },
    { id: "dialog-draggable", props: { footer: true, draggable: true } },
    { id: "dialog-resizable", props: { footer: true, resizable: true } },
    { id: "dialog-resizable-rtl", props: { footer: true, resizable: true, rtl: true } },
    ...states.map((state) => ({ id: `dialog-${state}`, props: { state, footer: true } })),
  ],
  react: ({ state, footer, draggable, resizable, rtl }) => (
    <div className="overflow-hidden p-3" dir={rtl ? "rtl" : undefined}>
      <Dialog open modal={false}>
        <DialogContent portal={false} state={state} draggable={draggable} resizable={resizable} onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Dialog title</DialogTitle>
          </DialogHeader>
          <DialogBody>Dialog content text.</DialogBody>
          {footer && (
            <DialogFooter>
              <Button variant="emphasized">Submit</Button>
              <Button>Cancel</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  ),
})


// E4: consumer host replacement changes the DOM host while the component keeps
// the owning semantics. The native renderer uses the same underlying state.
function ChildrenOnlyHost({ children }: React.ComponentProps<"div">) {
  return <section data-custom-output="dialog">{children}</section>
}
function customHost(node: React.ReactNode, reactHost = false, rtl = false): React.ReactNode {
  if (Array.isArray(node)) return node.map((child) => customHost(child, reactHost, rtl))
  if (!React.isValidElement<{ children?: React.ReactNode }>(node)) return node
  const children = customHost(node.props.children, reactHost, rtl)
  if (node.type === DialogContent) {
    const descriptionId = `dialog-host-description-${rtl ? "rtl" : "ltr"}`
    const hostile = { role: "presentation", tabIndex: 13, id: "dialog-caller-host", "aria-label": "Wrong name", "aria-labelledby": "missing-title", "aria-describedby": "missing-description" }
    return React.cloneElement(node, { asChild: true, ...(reactHost ? { id: `dialog-react-surface-${rtl ? "rtl" : "ltr"}`, "aria-label": "Dialog title", "aria-describedby": descriptionId, ref: (host: HTMLDivElement | null) => host?.setAttribute("data-owned-ref", "true") } : {}) } as Partial<typeof node.props>,
      reactHost ? <ChildrenOnlyHost {...hostile}>{children}<span id={descriptionId} className="sr-only" aria-hidden="true">Dialog description</span></ChildrenOnlyHost>
        : <div data-custom-host="dialog" {...hostile}>{children}</div>)
  }
  return node.props.children === undefined ? node : React.cloneElement(node, {}, children)
}
const baseCase = fixtureSet.cases.find((entry) => entry.id === "dialog")!
export default {
  ...fixtureSet,
  cases: [...fixtureSet.cases, { id: "dialog-custom-host", props: { ...baseCase.props, customHost: true } },
    ...[false, true].map((rtl) => ({ id: `dialog-react-host${rtl ? "-rtl" : ""}`, props: { ...baseCase.props, customHost: true, reactHost: true, rtl } }))],
  react: (props: typeof baseCase.props & { customHost?: boolean; reactHost?: boolean }) => props.customHost ? customHost(fixtureSet.react(props), props.reactHost, props.rtl) : fixtureSet.react(props),
}
