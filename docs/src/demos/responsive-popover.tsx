import * as React from "react"
import { useIsPhone } from "@/lib/use-is-phone"
import { ResponsivePopover, ResponsivePopoverTrigger, ResponsivePopoverContent } from "@/components/ui/responsive-popover"
import { Button } from "@/components/ui/button"
import { defineDemo } from "./types"
function ResponsivePopoverDemo() {
  const phone = useIsPhone()
  const [open, setOpen] = React.useState(false)
  return <div id="responsive-popover-demo" className="flex flex-col items-start gap-4">
    <p>Current device: {phone ? "phone" : "desktop or tablet"}.</p>
    <ResponsivePopover open={open} onOpenChange={setOpen}><ResponsivePopoverTrigger asChild><Button>Choose a country</Button></ResponsivePopoverTrigger>
      <ResponsivePopoverContent headerText="Country" phoneFooter={<Button variant="emphasized" onClick={() => setOpen(false)}>OK</Button>}>
        <p>Select, ComboBox, MultiComboBox and MultiInput use full-screen dialogs on phones.</p>
      </ResponsivePopoverContent>
    </ResponsivePopover>
  </div>
}
export default defineDemo({ category: "Overlays", title: "ResponsivePopover", order: 52, docs: [
  { name: "responsive-popover", description: "A Popover on desktops and tablets, and a stretch Dialog on phones. Phone header/footer slots follow UI5 ResponsivePopover.", props: [
    { name: "open / defaultOpen / onOpenChange", type: "boolean / (open: boolean) => void", description: "Controlled or uncontrolled popup state." },
    { name: "headerText", type: "string", defaultValue: '""', description: "Phone dialog title and accessible name." },
    { name: "closeLabel", type: "string", defaultValue: '"Decline"', description: "Accessible name of the default phone close button." },
    { name: "phoneHeader / phoneFooter", type: "ReactNode", description: "Custom phone header replaces the default title and decline button; optional footer holds actions." },
    { name: "phoneField", type: "boolean", description: "Use UI5's unpadded picker content/header surface." },
    { name: "preventFocusRestore", type: "boolean", description: "Close without returning focus to the opener, as editable phone fields do." },
  ] },
  { name: "use-is-phone", description: "Reactive touch/phone detection, with SSR-safe desktop fallback and a data-fiori-device override on html.", props: [
    { name: "useIsPhone()", type: "boolean", description: "Match UI5 Device's touch/tablet classification; use a 600px short viewport edge for generic touch devices." },
    { name: "data-fiori-device", type: '"phone" | "tablet" | "desktop"', description: "Force the browser device classification for tests and demos; changes update live." },
  ] },
], Demo: ResponsivePopoverDemo })
