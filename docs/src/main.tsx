import * as React from "react"
import { createRoot } from "react-dom/client"

import * as icons from "@/lib/fiori-icons"
import type { FioriIconData } from "@/lib/fiori-icons"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { Demo } from "./demos/types"
import { FIELD_WIDTH, readPageOptions } from "./fixture-types"
import { fixtureSets } from "./fixtures"
import iconNames from "./icon-names.json"
import "./index.css"

const iconByName = new Map<string, FioriIconData>(
  (iconNames as [string, string][]).map(([name, id]) => [name, (icons as Record<string, FioriIconData>)[id]])
)

const demos = Object.values(import.meta.glob<{ default: Demo }>("./demos/*.tsx", { eager: true }))
  .map((m) => m.default)
  .sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.title.localeCompare(b.title))

const opts = readPageOptions()
document.documentElement.dataset.theme = opts.theme
document.documentElement.dataset.density = opts.density

function FixtureGrid() {
  React.useEffect(() => {
    document.fonts.ready.then(() => (document.documentElement.dataset.ready = "true"))
  }, [])
  return (
    <div className="flex flex-wrap items-start gap-4" style={{ "--w": FIELD_WIDTH } as React.CSSProperties}>
      {fixtureSets.flatMap((set) =>
        set.cases
          .filter((c) => !opts.only || c.id.startsWith(opts.only))
          .map((c) => (
            <div key={c.id} data-fixture={c.id} className="inline-flex p-1 leading-[normal]">
              {set.react(c.props)}
            </div>
          ))
      )}
    </div>
  )
}

const THEMES = [
  ["sap_horizon", "Morning Horizon"],
  ["sap_horizon_dark", "Evening Horizon"],
  ["sap_horizon_hcb", "High Contrast Black"],
  ["sap_horizon_hcw", "High Contrast White"],
] as const

function Toolbar() {
  const set = (k: string, v: string) => {
    const q = new URLSearchParams(location.search)
    q.set(k, v)
    location.search = q.toString()
  }
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b border-(--sapShell_BorderColor) bg-(--sapShell_Background) px-6 py-2 shadow-(--sapShell_Shadow)">
      <h1 className="font-(family-name:--sapFontBoldFamily) text-(length:--sapFontLargeSize) text-(--sapShell_TextColor)">shadcn-fiori</h1>
      <span className="text-(--sapContent_LabelColor)">SAP Horizon for shadcn/ui</span>
      <div className="ms-auto flex items-center gap-2">
        <Label htmlFor="theme">Theme</Label>
        <Select value={opts.theme} onValueChange={(v) => set("theme", v)}>
          <SelectTrigger id="theme" wrapperClassName="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            {THEMES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button aria-pressed={opts.density === "compact"} onClick={() => set("density", opts.density === "compact" ? "cozy" : "compact")}>
          Compact
        </Button>
        <Button variant="transparent" asChild>
          <a href={`ui5.html${location.search}`}>UI5 reference</a>
        </Button>
      </div>
    </header>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-(--sapGroup_ContentBackground) p-6 shadow-(--sapContent_Shadow0)">
      <h2 className="mb-4 font-(family-name:--sapFontHeaderFamily) text-(length:--sapFontHeader4Size) text-(--sapGroup_TitleTextColor)">{title}</h2>
      {children}
    </section>
  )
}

function Docs() {
  const [query, setQuery] = React.useState("")
  const matches = (iconNames as [string, string][]).filter(([n]) => n.includes(query.trim())).slice(0, 120)
  return (
    <>
      <Toolbar />
      <main className="mx-auto grid max-w-6xl gap-6 p-6">
        {demos.map(({ title, Demo }) => (
          <Section key={title} title={title}>
            <Demo />
          </Section>
        ))}
        <Section title="All fixtures (screenshot-compared against UI5)">
          <FixtureGrid />
        </Section>
        <Section title={`Icons (${iconNames.length})`}>
          <Input placeholder="Filter icons" value={query} onChange={(e) => setQuery(e.target.value)} wrapperClassName="mb-4 max-w-xs" />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2">
            {matches.map(([n]) => (
              <div key={n} className="flex flex-col items-center gap-2 rounded-md p-2 text-center text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor) hover:bg-(--sapList_Hover_Background)">
                <Icon icon={iconByName.get(n)!} className="size-6 text-(--sapContent_IconColor)" />
                <span className="break-all">{n}</span>
              </div>
            ))}
          </div>
        </Section>
      </main>
    </>
  )
}

// Expose case ids and tolerances for tests/visual.spec.ts. Anti-aliasing and sub-pixel text layout
// differ slightly between shadow DOM and light DOM, hence the default 2% tolerance.
;(window as any).__fixtures = fixtureSets.flatMap((set) =>
  set.cases.filter((c) => !set.skipCompare?.includes(c.id)).map((c) => ({ id: c.id, tolerance: set.tolerance ?? 0.02 }))
)

const fixtureMode = new URLSearchParams(location.search).has("fixtures")
if (fixtureMode) document.body.style.padding = "1rem"
createRoot(document.getElementById("root")!).render(<React.StrictMode>{fixtureMode ? <FixtureGrid /> : <Docs />}</React.StrictMode>)
