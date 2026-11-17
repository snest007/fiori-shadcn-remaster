import * as React from "react"
import { Calendar, useCalendar, type CalendarProps, type CalendarPartProps } from "./calendar"
import { Calendar as RegistryCalendar } from "@/components/ui/calendar"
const date = new Date(2024, 2, 12)
function ContextProbe({ defaultContent }: CalendarPartProps) {
  const c = useCalendar()
  React.useLayoutEffect(() => {
    document.documentElement.dataset.contextKeys = Object.keys(c).sort().join(",")
    document.documentElement.dataset.monthName = c.getHeaderButtonProps("month")["aria-label"]
  })
  return <>{defaultContent}</>
}
function GridProbe({ defaultContent }: CalendarPartProps) {
  const c = useCalendar()
  const props = c.getCellProps(date, { role: "button", "aria-selected": false, tabIndex: 7, id: "stolen-id", className: "getter-class", style: { color: "var(--sapTextColor)" } })
  React.useLayoutEffect(() => {
    document.documentElement.dataset.getter = JSON.stringify({ role: props.role, selected: props["aria-selected"], tabIndex: props.tabIndex, className: props.className, color: props.style?.color })
    document.documentElement.dataset.gridRole = c.getGridProps().role
    document.documentElement.dataset.rowRole = c.getRowProps(20240310).role
    document.documentElement.dataset.weekRole = c.getRowHeaderProps(new Date(2024, 2, 10)).role
  })
  return <>{defaultContent}</>
}
export function ExtensionProbe({ mode, registry }: { mode: string; registry: boolean }) {
  const [events, setEvents] = React.useState(0)
  const [revision, setRevision] = React.useState(false)
  const base = { id: "probe-calendar", "aria-label": "Probe calendar", defaultFocusedDate: date, defaultSelectedDates: [date], initialPicker: mode === "slots" ? "month" as const : undefined } satisfies CalendarProps
  return <><div id="probe-target">{registry ? <RegistryCalendar {...base} /> : <Calendar {...base}
    components={mode === "slots" ? undefined : mode === "neutral" ? { Header: ({ defaultContent }) => <>{defaultContent}</>, DayGrid: ({ defaultContent }) => <>{defaultContent}</>, DayCell: ({ defaultContent }) => <span>{defaultContent}</span> } : mode === "items" ? { Header: ContextProbe } : { Header: ContextProbe, DayGrid: GridProbe }}
    classNames={mode === "neutral" ? undefined : { Header: "consumer-header" }}
    getDayProps={mode === "neutral" ? undefined : () => ({ role: "button", "aria-selected": false, tabIndex: 7, id: "stolen-id", className: "consumer-cell", style: { outlineColor: "var(--sapLinkColor)" }, onClick: () => setEvents(n => n + 1), onKeyDown: e => { e.preventDefault(); e.stopPropagation(); setEvents(n => n + 1) } })}
    getDayLabel={mode === "neutral" || mode === "items" ? undefined : () => "Extra"}
    renderMonth={mode === "slots" ? item => <span data-testid={`probe-month-${item.key}`} data-locale={item.locale} data-focused={String(item.focused)} data-selected={String(item.selected)}>{item.defaultContent}</span> : undefined}
    renderYear={mode === "slots" ? item => <span data-testid="probe-year" data-locale={item.locale} data-focused={String(item.focused)} data-selected={String(item.selected)}>{item.defaultContent}</span> : undefined}
    renderDay={mode === "neutral" ? undefined : day => <>{day.defaultContent}<button>Extra</button></>}
    itemPicker={mode === "items" ? { items: Array.from({ length: 10 }, (_, i) => ({ key: i + (revision ? 10 : 0), text: `Item ${i + 1}`, disabled: i === 1 })), rowSize: 3, label: "Custom items" } : undefined}
  />}</div>{mode === "items" && <button onClick={() => setRevision(true)}>Replace items</button>}<output data-testid="probe-events">{events}</output></>
}
