import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResponsivePopover, ResponsivePopoverContent } from "@/components/ui/responsive-popover"
import { defineFixtures } from "../fixture-types"

export type SelectPhoneA11y = { channel?: "name" | "name-ref" | "label"; custom?: boolean; rtl?: boolean }
function PhoneSelect({ channel, custom, rtl }: SelectPhoneA11y) {
  const [name, setName] = React.useState("Shipping country")
  const [value, setValue] = React.useState("Germany")
  const [open, setOpen] = React.useState(!new URLSearchParams(location.search).has("interactive"))
  const events = React.useRef<string[]>([])
  const holder = React.useRef<HTMLDivElement>(null)
  const record = (event: string) => { events.current.push(event); holder.current?.querySelector("output")?.replaceChildren(JSON.stringify(events.current)) }
  const childRef = React.useCallback((node: HTMLDivElement | null) => { if (node) node.dataset.childRef = "retained" }, [])
  if (new URLSearchParams(location.search).has("header-fallback")) return <div style={{ width: "375px", height: "667px" }}><ResponsivePopover defaultOpen><ResponsivePopoverContent headerText="Fallback dialog" phoneHeader={<h2>Custom header</h2>}><p>Custom header content</p></ResponsivePopoverContent></ResponsivePopover></div>
  return <div ref={holder} id="select-a11y-phone-demo" dir={rtl ? "rtl" : undefined} style={{ width: "375px", height: "667px", overflow: "hidden" }}>
    {channel === "label" ? <label htmlFor="select-a11y-phone-field" id="select-a11y-phone-name">{name}</label> : <span hidden id="select-a11y-phone-name">{name}</span>}
    <button id="select-a11y-phone-update-name" onClick={() => setName("Billing country")}>Update field name</button>
    <Select value={value} onValueChange={(next) => { setValue(next); record(`change:${next}`) }} open={open} onOpenChange={setOpen}>
      <SelectTrigger id="select-a11y-phone-field" aria-label={channel === "name" ? name : channel === "name-ref" ? "Ignored direct name" : undefined} aria-labelledby={channel === "name-ref" ? "select-a11y-phone-name" : undefined}><SelectValue /></SelectTrigger>
      <SelectContent>{["Argentina", "Australia", "Germany"].map((text) => <SelectItem key={text} value={text} disabled={text === "Australia"} asChild={custom} onClick={() => custom && record(`outer:${text}`)}>
        {custom ? <div ref={childRef} id={`select-a11y-phone-${text}`} role="menuitem" aria-selected={false} aria-disabled={false} aria-checked="mixed" tabIndex={99} data-value="foreign" data-state="foreign" onClick={() => record(`child:${text}`)}>{text}</div> : text}
      </SelectItem>)}</SelectContent>
    </Select>
    <output hidden data-slot="select-a11y-phone-events">[]</output>
  </div>
}
export default defineFixtures<SelectPhoneA11y>({ name: "select-a11y", cases: [
  { id: "select-a11y-phone-custom", props: { custom: true, channel: "name" } },
  { id: "select-a11y-phone-name", props: { channel: "name" } },
  { id: "select-a11y-phone-name-ref", props: { channel: "name-ref" } },
  { id: "select-a11y-phone-label", props: { channel: "label" } },
  { id: "select-a11y-phone-unnamed", props: {} },
  { id: "select-a11y-phone-name-ref-rtl", props: { channel: "name-ref", rtl: true } },
], react: (props) => <PhoneSelect {...props} /> })
