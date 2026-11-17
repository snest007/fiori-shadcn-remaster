import { PopoverBody } from "@/components/ui/popover"
import { ResponsivePopover, ResponsivePopoverContent } from "@/components/ui/responsive-popover"
import { defineFixtures } from "../fixture-types"
import { inPlace } from "./popover"

type Props = { customHost?: boolean; rtl?: boolean }
export default defineFixtures<Props>({
  name: "responsive-popover",
  cases: [
    { id: "responsive-popover", props: {} },
    { id: "responsive-popover-custom-host", props: { customHost: true } },
    { id: "responsive-popover-custom-host-rtl", props: { customHost: true, rtl: true } },
  ],
  react: ({ customHost, rtl }) => <div className={inPlace} dir={rtl ? "rtl" : undefined}><ResponsivePopover open modal={false}>
    <ResponsivePopoverContent asChild={customHost} portal={false} aria-label="Custom responsive popup" hideArrow className="w-56">
      {customHost ? <div data-custom-host="responsive-popover" role="presentation" tabIndex={13}><PopoverBody>Responsive content</PopoverBody></div> : <PopoverBody>Responsive content</PopoverBody>}
    </ResponsivePopoverContent>
  </ResponsivePopover></div>,
})
