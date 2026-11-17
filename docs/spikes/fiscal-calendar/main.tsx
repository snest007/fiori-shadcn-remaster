// Spike page: /spikes/fiscal-calendar/index.html?theme=…&density=…&dir=rtl&locale=de-DE&variant=Z445&date=2026-03-10
// Served by `pnpm dev` (Vite root is docs/); not part of the docs build or the registry.
import * as React from "react"
import { createRoot } from "react-dom/client"

import { FiscalCalendar } from "./fiscal-calendar"
import { parseDay } from "./fiscal-adapter"
import { variants } from "./fiscal-variants"
import "./spike.css"

const q = new URLSearchParams(location.search)
document.documentElement.dataset.theme = q.get("theme") ?? "sap_horizon"
document.documentElement.dataset.density = q.get("density") === "compact" ? "compact" : "cozy"
document.documentElement.dir = q.get("dir") === "rtl" ? "rtl" : "ltr"
const locale = q.get("locale") ?? "en-US"
document.documentElement.lang = locale
const variant = (q.get("variant") ?? "K4") as keyof typeof variants
const date = q.get("date") ? parseDay(q.get("date")!) : parseDay("2025-03-10")

function Page() {
  const [log, setLog] = React.useState("")
  React.useEffect(() => {
    document.fonts.ready.then(() => (document.documentElement.dataset.ready = "true"))
  }, [])
  return (
    <main className="grid gap-4 bg-(--sapBackgroundColor) p-6 text-(--sapTextColor) font-(family-name:--sapFontFamily) min-h-screen">
      <h1 className="font-(family-name:--sapFontBoldFamily) text-(length:--sapFontHeader4Size)">Spike: fiscal calendar on Calendar's public API</h1>
      <FiscalCalendar locale={locale} defaultVariant={variant} defaultDate={date} onPeriodChange={(p) => setLog(p ? JSON.stringify({ ...p, start: p.start.toDateString(), end: p.end.toDateString() }) : "null")} />
      <pre data-testid="fiscal-calendar-event" className="text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor) whitespace-pre-wrap">{log}</pre>
    </main>
  )
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>
)
