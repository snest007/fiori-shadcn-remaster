import * as React from "react"
import { createRoot } from "react-dom/client"
import { Calendar as RegistryCalendar, CalendarLegend as RegistryLegend, CalendarLegendItem as RegistryLegendItem } from "@/components/ui/calendar"
import { Calendar, CalendarLegend, CalendarLegendItem } from "./calendar"
import { ExtensionProbe } from "./extension-probe"
import { FiscalConsumer } from "./fiscal-consumers"
import { parseDay } from "../fiscal-calendar/fiscal-adapter"
import type { FixtureSet } from "../../src/fixture-types"
import "./spike.css"

const q = new URLSearchParams(location.search)
const html = document.documentElement
html.dataset.theme = q.get("theme") ?? "sap_horizon"
html.dataset.density = q.get("density") ?? "cozy"
html.dir = q.get("dir") ?? "ltr"
html.lang = q.get("locale") ?? "en-US"
const sets = Object.values(import.meta.glob<{ default: FixtureSet }>("../../src/fixtures/*.tsx", { eager: true })).map(m => m.default).filter(set => set?.name === "calendar" || set?.name.startsWith("calendar-"))
const cases = sets.flatMap(set => set.cases.map(c => ({ id: c.id, render: () => set.react(c.props) })))
// Transform the ACTUAL fixture renderer, including legend props, rather than maintaining a copied case list.
function prototype(node: React.ReactNode): React.ReactNode {
  return React.Children.map(node, child => {
    if (!React.isValidElement<Record<string, unknown>>(child)) return child
    const type = child.type === RegistryCalendar ? Calendar : child.type === RegistryLegend ? CalendarLegend : child.type === RegistryLegendItem ? CalendarLegendItem : child.type
    const props = { ...child.props }
    if (props.children) props.children = prototype(props.children as React.ReactNode)
    if (props.legend) props.legend = prototype(props.legend as React.ReactNode)
    return React.createElement(type as React.ElementType, props)
  })
}
function Page() {
  React.useEffect(() => { document.fonts.ready.then(() => { html.dataset.ready = "true" }) }, [])
  const fixture = cases.find(c => c.id === q.get("case"))
  const source = q.get("source") === "registry"
  return <main>
    {q.has("probe") ? <ExtensionProbe mode={q.get("probe") ?? "neutral"} registry={source} /> : q.has("parity") ? <><div id="parity-target">{fixture ? source ? fixture.render() : prototype(fixture.render()) : null}</div><script id="fixture-manifest" type="application/json">{JSON.stringify(cases.map(c => c.id))}</script></> :
      <FiscalConsumer mode={q.get("mode") === "period" ? "period" : "day"} initialVariant={q.get("variant") ?? "Z445"} initialDate={parseDay(q.get("date") ?? "2026-03-10")} locale={html.lang} />}
  </main>
}
createRoot(document.getElementById("root")!).render(<Page />)
