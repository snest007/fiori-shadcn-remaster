import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ValueState } from "@/components/ui/input"

import { defineFixtures } from "../fixture-types"

type Props = { state?: ValueState; footer?: boolean; draggable?: boolean; resizable?: boolean; rtl?: boolean }
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
function customHost(node: React.ReactNode): React.ReactNode {
  if (Array.isArray(node)) return node.map(customHost)
  if (!React.isValidElement<{ children?: React.ReactNode }>(node)) return node
  const children = customHost(node.props.children)
  if (node.type === DialogContent) return React.cloneElement(node, { asChild: true } as Partial<typeof node.props>, <div data-custom-host="dialog" role="presentation" tabIndex={13} id="dialog-caller-host">{children}</div>)
  return node.props.children === undefined ? node : React.cloneElement(node, {}, children)
}
const baseCase = fixtureSet.cases.find((entry) => entry.id === "dialog")!
export default {
  ...fixtureSet,
  cases: [...fixtureSet.cases, { id: "dialog-custom-host", props: { ...baseCase.props, customHost: true } }],
  react: (props: typeof baseCase.props & { customHost?: boolean }) => props.customHost ? customHost(fixtureSet.react(props)) : fixtureSet.react(props),
}
