import * as React from "react"
import { Button } from "@/components/ui/button"
import { ResponsivePopover, ResponsivePopoverContent } from "@/components/ui/responsive-popover"
import { defineFixtures } from "../fixture-types"

type Props = { rtl?: boolean }
function PhoneHost({ rtl }: Props) {
  const [open, setOpen] = React.useState(!new URLSearchParams(location.search).has("interactive"))
  return <div id="responsive-popover-host-phone-demo" dir={rtl ? "rtl" : undefined} style={{ width: "375px", height: "667px", overflow: "hidden" }}>
    <Button onClick={() => setOpen(true)}>Open popup</Button>
    <ResponsivePopover open={open} onOpenChange={setOpen}>
      <ResponsivePopoverContent asChild headerText="Country" aria-label="Country">
        <section data-custom-host="responsive-popover-phone" role="presentation" tabIndex={13}><p>Choose a country.</p><Button>Done</Button></section>
      </ResponsivePopoverContent>
    </ResponsivePopover>
  </div>
}
export default defineFixtures<Props>({ name: "responsive-popover-host", cases: [
  { id: "responsive-popover-host-phone", props: {} },
  { id: "responsive-popover-host-phone-rtl", props: { rtl: true } },
], react: (props) => <PhoneHost {...props} /> })
