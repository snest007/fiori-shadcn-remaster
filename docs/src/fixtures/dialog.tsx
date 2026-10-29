import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ValueState } from "@/components/ui/input"

import { defineFixtures } from "../fixture-types"

type Props = { state?: ValueState; footer?: boolean }
const states = ["negative", "critical", "positive", "information"] as const

// Overlays are pixel-compared as their surface, rendered in place: the dialog is open but non-modal
// and not portaled, so it sits inside the cell (UI5's side does the same with ui5-dialog, see dialog.ui5.ts).
// The wrapper clips the large dialog shadow so it can't bleed into neighbouring cells (both pages).
export default defineFixtures<Props>({
  name: "dialog",
  cases: [
    { id: "dialog", props: { footer: true } },
    { id: "dialog-no-footer", props: {} },
    ...states.map((state) => ({ id: `dialog-${state}`, props: { state, footer: true } })),
  ],
  react: ({ state, footer }) => (
    <div className="overflow-hidden p-3">
      <Dialog open modal={false}>
        <DialogContent portal={false} state={state} onOpenAutoFocus={(e) => e.preventDefault()}>
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
