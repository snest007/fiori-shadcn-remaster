import * as React from "react"
import { defineFixtures } from "../fixture-types"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ComboBox, ComboBoxItem } from "@/components/ui/combobox"
import { MultiComboBox, MultiComboBoxItem } from "@/components/ui/multi-combobox"
import { MultiInput, SuggestionItem } from "@/components/ui/multi-input"
import { Token } from "@/components/ui/token"
import { ResponsivePopover, ResponsivePopoverTrigger, ResponsivePopoverContent } from "@/components/ui/responsive-popover"
import { Button } from "@/components/ui/button"
import type { ValueState } from "@/components/ui/input"

export const PHONE_OPTIONS = ["Argentina", "Australia", "Germany", "United Kingdom"]
export const PHONE_CODE_VALUES: Record<string, string> = { Argentina: "AR", Australia: "AU", Germany: "DE", "United Kingdom": "GB" }
export const PHONE_LONG_OPTIONS = [...PHONE_OPTIONS, ...Array.from({ length: 36 }, (_, index) => `Country ${index + 5}`)]
export type PhoneCase = { kind: "select" | "combobox" | "multi-combobox" | "multi-input" | "responsive-popover"; valueState?: ValueState; tokens?: boolean | string[]; longList?: boolean }
function PhonePopup({ kind, valueState = "none", tokens = false, longList = false }: PhoneCase) {
  const query = new URLSearchParams(location.search)
  const options = longList || query.has("long-list") ? PHONE_LONG_OPTIONS : PHONE_OPTIONS
  const itemValue = (text: string) => query.has("explicit-values") ? PHONE_CODE_VALUES[text] ?? text : text
  const initialSelected = (query.get("controlled-start") === "pair" ? ["Germany", "Australia"] : Array.isArray(tokens) ? tokens : tokens ? ["Germany"] : []).map(itemValue)
  const interactive = new URLSearchParams(location.search).has("interactive")
  const uncontrolled = new URLSearchParams(location.search).has("uncontrolled")
  const nestedRtl = new URLSearchParams(location.search).has("nested-rtl")
  const externalOpen = new URLSearchParams(location.search).has("external-open")
  const consumerProps = query.has("consumer-props")
  const [contentNode, setContentNode] = React.useState<HTMLDivElement | null>(null)
  const [contentEvents, setContentEvents] = React.useState<string[]>([])
  const [openEvents, setOpenEvents] = React.useState<string[]>([])
  const recordContent = (event: string) => setContentEvents((previous) => [...previous, event])
  const [open, setOpen] = React.useState(!interactive)
  const [value, setValue] = React.useState(kind === "select" ? "Germany" : "")
  const [selected, setSelected] = React.useState(initialSelected)
  const [events, setEvents] = React.useState<string[]>([])
  const record = (event: string) => setEvents((previous) => [...previous, event])
  const holder = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!interactive && kind === "multi-input") holder.current?.querySelector<HTMLInputElement>('input')?.click()
  }, [interactive, kind])
  return <div id={`${kind}-phone-demo`} ref={holder} dir={nestedRtl ? "rtl" : undefined} style={{ width: "375px", height: "667px", overflow: "hidden" }}>
    {externalOpen && <Button onClick={() => { setValue("Australia"); setSelected(["Australia"]); setOpen(true) }}>Open changed field</Button>}
    {query.has("controlled-echo") && <><Button onClick={() => setSelected((previous) => [...previous].reverse())}>Reorder selection</Button><Button onClick={() => setSelected([itemValue("Australia")])}>Replace selection</Button><Button onClick={() => setSelected([])}>Reset selection</Button></>}
    {consumerProps && <p id="phone-description">Choose one country for delivery.</p>}
    <div style={{ width: "13.125rem" }}>
      {kind === "select" && <Select value={value} onValueChange={(next) => { setValue(next); record(`change:${next}`) }} open={open} onOpenChange={(next) => { setOpen(next); setOpenEvents((previous) => [...previous, next ? "open" : "close"]) }}>
        <SelectTrigger aria-label="Country" valueState={valueState}><SelectValue /></SelectTrigger>
        <SelectContent {...(consumerProps ? { id: "phone-consumer-select", className: "phone-consumer-class", style: { "--phone-consumer-probe": "7" } as React.CSSProperties,
          "data-consumer": "forwarded", "aria-label": "Delivery country", "aria-describedby": "phone-description", ref: setContentNode,
          onOpenAutoFocus: (event: Event) => { recordContent("open"); event.preventDefault(); document.querySelector<HTMLButtonElement>('#phone-consumer-select button')?.focus() },
          onCloseAutoFocus: (event: Event) => { recordContent("close"); event.preventDefault() },
          onEscapeKeyDown: (event: KeyboardEvent) => { recordContent("escape"); event.preventDefault() },
        } : {})}>{options.map((text) => <SelectItem key={text} value={text} disabled={query.has("disabled-option") && text === "Australia"}>{text}</SelectItem>)}</SelectContent>
      </Select>}
      {kind === "combobox" && <ComboBox id="combobox-phone-field" aria-label="Country" value={value} onValueChange={setValue} onCommit={(next) => record(`change:${next}`)} onSelectionChange={(item) => record(`selection:${item?.text ?? ""}`)}
        open={open} onOpenChange={setOpen} valueState={valueState}>{options.map((text) => <ComboBoxItem key={text} text={text} />)}</ComboBox>}
      {kind === "multi-combobox" && <MultiComboBox id="multi-combobox-phone-field" aria-label="Country" value={value} onValueChange={setValue} onCommit={(next) => record(`change:${next}`)} selectedValues={uncontrolled ? undefined : selected} defaultSelectedValues={initialSelected}
        onSelectionChange={(next) => { if (!query.has("reject-selection")) setSelected(next); record(`selection:${next.join(",")}`) }} open={open} onOpenChange={setOpen} valueState={valueState} showSelectAll noValidation={externalOpen}>
        {options.map((text) => <MultiComboBoxItem key={text} text={text} value={query.has("explicit-values") ? itemValue(text) : undefined} />)}</MultiComboBox>}
      {kind === "multi-input" && <MultiInput id="multi-input-phone-field" type={query.has("email") ? "email" : undefined} filter={query.has("tab-active") ? "startsWith" : undefined} noTypeahead={query.has("tab-active")} aria-label="Country" value={value} onValueChange={setValue} onCommit={(next) => record(`change:${next}`)}
        onSuggestionSelect={(item) => record(`suggestion:${item.text}`)} onValueHelpTrigger={() => record("value-help")} onTokenDelete={(keys) => { setSelected((previous) => previous.filter((key) => !keys.includes(key))); record(`delete:${keys.join(",")}`) }}
        valueState={valueState} tokens={selected.map((text) => <Token key={text} value={text} text={text} />)}>
        {options.map((text) => <SuggestionItem key={text} text={text} />)}</MultiInput>}
      {kind === "responsive-popover" && <ResponsivePopover open={open} onOpenChange={setOpen}><ResponsivePopoverTrigger asChild><Button>Open</Button></ResponsivePopoverTrigger>
        <ResponsivePopoverContent headerText="Country" aria-describedby={consumerProps ? "phone-description" : undefined}><p>Choose a country.</p><Button onClick={() => setOpen(false)}>Done</Button></ResponsivePopoverContent></ResponsivePopover>}
    </div>
    <output data-slot="phone-events" hidden>{JSON.stringify(events)}</output><output data-slot="phone-selected" hidden>{selected.join(",")}</output>
    <output data-slot="phone-open-events" hidden>{JSON.stringify(openEvents)}</output>
    {consumerProps && <><output data-slot="phone-content-ref" hidden>{contentNode?.id ?? "null"}</output><output data-slot="phone-content-events" hidden>{JSON.stringify(contentEvents)}</output></>}
  </div>
}
export default defineFixtures<PhoneCase>({ name: "phone-popups", cases: [
  { id: "responsive-popover-phone", props: { kind: "responsive-popover" } },
  ...(["select", "combobox", "multi-combobox", "multi-input"] as const).flatMap((kind) => [
    { id: `${kind}-phone`, props: { kind } },
    { id: `${kind}-phone-negative`, props: { kind, valueState: "negative" as const } },
  ]),
  { id: "multi-combobox-phone-selected", props: { kind: "multi-combobox", tokens: true } },
  { id: "multi-input-phone-tokens", props: { kind: "multi-input", tokens: true } },
  { id: "multi-input-phone-two-tokens", props: { kind: "multi-input", tokens: ["Germany", "Australia"] } },
  { id: "combobox-phone-negative-long", props: { kind: "combobox", valueState: "negative", longList: true } },
  { id: "multi-combobox-phone-negative-long", props: { kind: "multi-combobox", valueState: "negative", longList: true } },
], react: (props) => <PhonePopup {...props} /> })
