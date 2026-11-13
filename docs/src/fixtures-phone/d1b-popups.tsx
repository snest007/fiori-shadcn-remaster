import * as React from "react"
import { defineFixtures } from "../fixture-types"
import { DatePicker } from "@/components/ui/date-picker"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { TimePicker } from "@/components/ui/time-picker"
import type { ValueState } from "@/components/ui/input"

export type D1bCase = { kind: "date-picker" | "date-range-picker" | "date-time-picker" | "time-picker"; valueState?: ValueState; timeView?: boolean; noLabel?: boolean }
export const PHONE_DATE = "Nov 13, 2026"
export const PHONE_RANGE = "Nov 13, 2026 - Nov 17, 2026"
export const PHONE_TIME = "10:15:30 AM"
export const PHONE_DATETIME = "Nov 13, 2026, 10:15:30 AM"
function PickerPhone({ kind, valueState, timeView, noLabel }: D1bCase) {
  const holder = React.useRef<HTMLDivElement>(null)
  const [value, setValue] = React.useState(kind === "time-picker" ? PHONE_TIME : kind === "date-time-picker" ? PHONE_DATETIME : kind === "date-range-picker" ? PHONE_RANGE : PHONE_DATE)
  const [events, setEvents] = React.useState<string[]>([])
  const query = new URLSearchParams(location.search)
  const record = (next: string) => { if (query.get("consumer") !== "reject") setValue(next); setEvents((previous) => [...previous, `value:${next}`]) }
  React.useEffect(() => {
    if (query.has("interactive")) return
    holder.current?.querySelector<HTMLElement>('[data-slot="picker-field-icon"]')?.click()
  }, [])
  React.useEffect(() => {
    if (!timeView || query.has("interactive")) return
    const observer = new MutationObserver(() => document.querySelector<HTMLButtonElement>('[data-slot="date-time-toggle"] button[data-phone-view="time"]')?.click())
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [timeView])
  const common = { id: `${kind}-phone-field`, "aria-label": noLabel ? undefined : "Appointment", valueState, value, onValueChange: record }
  return <div ref={holder} id={`${kind}-phone-demo`} style={{ width: "375px", height: "667px", overflow: "hidden" }}><div style={{ width: "15rem" }}>
    {kind === "date-picker" && <DatePicker {...common} />}
    {kind === "date-range-picker" && <DateRangePicker {...common} onConfirm={(next) => setEvents((previous) => [...previous, `change:${next}`])} />}
    {kind === "date-time-picker" && <DateTimePicker {...common} />}
    {kind === "time-picker" && <TimePicker {...common} />}
  </div><output data-slot="phone-events" hidden>{JSON.stringify(events)}</output></div>
}
export default defineFixtures<D1bCase>({ name: "d1b-popups", cases: [
  ...(["date-picker", "date-range-picker", "time-picker", "date-time-picker"] as const).flatMap((kind) => [
    { id: `${kind}-phone`, props: { kind } },
    { id: `${kind}-phone-negative`, props: { kind, valueState: "negative" as const } },
  ]),
  { id: "date-time-picker-phone-time", props: { kind: "date-time-picker", timeView: true } },
  { id: "date-picker-phone-default-title", props: { kind: "date-picker", noLabel: true } },
  { id: "time-picker-phone-default-title", props: { kind: "time-picker", noLabel: true } },
], react: (props) => <PickerPhone {...props} /> })
