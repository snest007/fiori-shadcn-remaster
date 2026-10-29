import * as React from "react"
import { createRoot } from "react-dom/client"

import * as icons from "@/lib/fiori-icons"
import type { FioriIconData } from "@/lib/fiori-icons"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Input, InputIcon } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { FIELD_WIDTH, fixtures, readPageOptions, type Fixture } from "./fixtures"
import iconNames from "./icon-names.json"
import "./index.css"

const iconByName = new Map<string, FioriIconData>(
  (iconNames as [string, string][]).map(([name, id]) => [name, (icons as Record<string, FioriIconData>)[id]])
)

const opts = readPageOptions()
document.documentElement.dataset.theme = opts.theme
document.documentElement.dataset.density = opts.density

function RenderFixture({ f }: { f: Fixture }) {
  switch (f.kind) {
    case "button": {
      const icon = f.icon ? iconByName.get(f.icon) : undefined
      return (
        <Button variant={f.variant} size={f.text ? "default" : "icon"} disabled={f.disabled} aria-label={f.text ? undefined : f.icon}>
          {icon && <Icon icon={icon} />}
          {f.text}
        </Button>
      )
    }
    case "label":
      return <Label required={f.required} showColon={f.showColon}>{f.text}</Label>
    case "input":
      return (
        <Input
          wrapperClassName="w-(--w)"
          defaultValue={f.value}
          placeholder={f.placeholder}
          valueState={f.valueState}
          valueStateMessage={null}
          disabled={f.disabled}
          readOnly={f.readOnly}
          aria-label={f.id}
        />
      )
    case "select":
      return (
        <Select defaultValue={f.selected} disabled={f.disabled}>
          <SelectTrigger wrapperClassName="w-(--w)" valueState={f.valueState} valueStateMessage={null} disabled={f.disabled} aria-label={f.id}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {f.options.map((o) => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
  }
}

function FixtureGrid() {
  React.useEffect(() => {
    document.fonts.ready.then(() => (document.documentElement.dataset.ready = "true"))
  }, [])
  return (
    <div className="flex flex-wrap items-start gap-4" style={{ "--w": FIELD_WIDTH } as React.CSSProperties}>
      {fixtures
        .filter((f) => !opts.only || f.id.startsWith(opts.only))
        .map((f) => (
          <div key={f.id} data-fixture={f.id} className="inline-flex p-1 leading-normal">
            <RenderFixture f={f} />
          </div>
        ))}
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
      <span className="text-(--sapContent_LabelColor)">SAP Horizon for shadcn/ui · Phase 0</span>
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
  const [country, setCountry] = React.useState("de")
  const [name, setName] = React.useState("")
  const matches = (iconNames as [string, string][]).filter(([n]) => n.includes(query.trim())).slice(0, 120)
  return (
    <>
      <Toolbar />
      <main className="mx-auto grid max-w-6xl gap-6 p-6">
        <Section title="Button">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="emphasized">Save</Button>
            <Button>Cancel</Button>
            <Button variant="transparent">Transparent</Button>
            <Button variant="positive"><Icon icon={icons.accept} />Approve</Button>
            <Button variant="negative"><Icon icon={icons.decline} />Reject</Button>
            <Button variant="attention">Attention</Button>
            <Button size="icon" variant="transparent" aria-label="Edit"><Icon icon={icons.edit} /></Button>
            <Button disabled>Disabled</Button>
          </div>
        </Section>
        <Section title="Form fields">
          <div className="grid max-w-md grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
            <Label htmlFor="name" required showColon>Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="At least 3 characters"
              valueState={name && name.length < 3 ? "negative" : name ? "positive" : "none"}
              valueStateMessage={name && name.length < 3 ? "Enter at least 3 characters." : undefined}
            />
            <Label htmlFor="country" showColon>Country</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger id="country"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="de">Germany</SelectItem>
                <SelectItem value="fr">France</SelectItem>
                <SelectItem value="cn">China</SelectItem>
                <SelectItem value="us" disabled>United States</SelectItem>
              </SelectContent>
            </Select>
            <Label htmlFor="search" showColon>Search</Label>
            <Input id="search" type="search" placeholder="Search" icon={<InputIcon><Icon icon={icons.search} /></InputIcon>} />
            <Label htmlFor="ro" showColon>Read only</Label>
            <Input id="ro" readOnly defaultValue="SAP SE" />
          </div>
          <p className="mt-4 text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
            Select keyboard: ↑/↓/Home/End change the value without opening; Alt+↓, F4, Space or Enter open the list.
          </p>
        </Section>
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

const fixtureMode = new URLSearchParams(location.search).has("fixtures")
if (fixtureMode) document.body.style.padding = "1rem"
createRoot(document.getElementById("root")!).render(<React.StrictMode>{fixtureMode ? <FixtureGrid /> : <Docs />}</React.StrictMode>)
