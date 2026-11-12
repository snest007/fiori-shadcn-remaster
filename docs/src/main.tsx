import * as React from "react"
import { createRoot } from "react-dom/client"

import * as icons from "@/lib/fiori-icons"
import type { FioriIconData } from "@/lib/fiori-icons"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NavigationLayout, type NavigationLayoutMode } from "@/components/ui/navigation-layout"
import { ShellBar, ShellBarBranding, ShellBarSpacer } from "@/components/ui/shell-bar"
import { SideNavigation, SideNavigationGroup, SideNavigationItem } from "@/components/ui/side-navigation"

import type { ComponentDocs, Demo, DemoCategory } from "./demos/types"
import { FIELD_WIDTH, readPageOptions, snapSlots } from "./fixture-types"
import { fixtureSets } from "./fixtures"
import { sapui5FixtureSets } from "./fixtures-sapui5"
import iconNames from "./icon-names.json"
import "./index.css"

const iconByName = new Map<string, FioriIconData>(
  (iconNames as [string, string][]).map(([name, id]) => [name, (icons as Record<string, FioriIconData>)[id]])
)

const demos = Object.values(import.meta.glob<{ default: Demo }>("./demos/*.tsx", { eager: true }))
  .map((m) => m.default)
  .sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.title.localeCompare(b.title))

const opts = readPageOptions()
document.documentElement.dir = opts.dir
document.documentElement.dataset.theme = opts.theme
document.documentElement.dataset.density = opts.density

const query = new URLSearchParams(location.search)
const activeFixtureSets = query.has("fixtures-sapui5") ? sapui5FixtureSets : fixtureSets

function FixtureGrid() {
  React.useEffect(() => {
    document.fonts.ready.then(snapSlots).then(() => (document.documentElement.dataset.ready = "true"))
  }, [])
  return (
    // The grid remains left-to-right so overwide fixture rows stay inside full-page screenshots.
    // Each cell inherits the requested direction independently of harness positioning.
    <div dir="ltr" className="flex flex-wrap items-start gap-4" style={{ "--w": FIELD_WIDTH } as React.CSSProperties}>
      {activeFixtureSets.flatMap((set) =>
        set.cases
          .filter((c) => !opts.only || c.id === opts.only)
          .map((c) => (
            // Each cell sits in a slot rounded up to whole pixels so one fractional-width cell can't shift
            // every following cell onto sub-pixel positions (which changes anti-aliasing).
            <div key={c.id} data-fixture-slot="" className="flex">
              <div dir={opts.dir} data-fixture={c.id} className="inline-flex p-1 leading-[normal]">
                {set.react(c.props)}
              </div>
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

type RegistryItem = { title: string; description?: string }
const itemName = (path: string) => path.split("/").pop()!.replace(/\.json$/, "")
const registryItems = Object.fromEntries(
  Object.entries(import.meta.glob<RegistryItem>("../../registry/items/*.json", { eager: true, import: "default" }))
    .map(([path, item]) => [itemName(path), item])
)
const blocks = Object.entries(import.meta.glob<RegistryItem>("../../registry/block-items/*.json", { eager: true, import: "default" }))
  .map(([path, item]) => ({ name: itemName(path), ...item }))
  .sort((a, b) => a.title.localeCompare(b.title))
const categories: DemoCategory[] = ["Actions", "Forms", "Dates", "Data", "Overlays", "Display", "Navigation", "Layout"]
type ComponentPage = { name: string; title: string; category: DemoCategory; examples: { demo: Demo; docs: ComponentDocs }[] }
const pageByName = new Map<string, ComponentPage>()
for (const demo of demos) {
  for (const docs of demo.docs) {
    const item = registryItems[docs.name]
    if (!item) throw new Error(`Unknown docs Registry item: ${docs.name}`)
    const page = pageByName.get(docs.name) ?? { name: docs.name, title: item.title, category: demo.category, examples: [] }
    if (page.category !== demo.category) throw new Error(`Inconsistent docs category: ${docs.name}`)
    page.examples.push({ demo, docs })
    pageByName.set(docs.name, page)
  }
}
for (const name of Object.keys(registryItems)) {
  if (!pageByName.has(name)) throw new Error(`Missing component docs: ${name}`)
}
const pages = [...pageByName.values()].sort((a, b) => a.title.localeCompare(b.title))
const publicRoutes = [...pages.map(({ name, title }) => ({ name, title })), { name: "icons", title: "SAP Horizon icons" }, { name: "floorplans", title: "Floorplans" }]
const validRoutes = new Set([...publicRoutes.map(({ name }) => name), "all"])

function routeFromHash(fallback = "button") {
  // Demo links such as #subtle and #breadcrumbs-home remain native anchors. Keep the owning
  // component in history state so Back also restores that page after following one of those links.
  if (!location.hash.startsWith("#/")) return history.state?.docsRoute ?? fallback
  try {
    const route = decodeURIComponent(location.hash.slice(2))
    return validRoutes.has(route) ? route : "button"
  } catch {
    return "button"
  }
}

function useDocsRoute() {
  const [route, setRoute] = React.useState(() => routeFromHash())
  const current = React.useRef(route)
  React.useEffect(() => {
    const update = () => {
      const next = routeFromHash(current.current)
      current.current = next
      history.replaceState({ ...history.state, docsRoute: next }, "", location.hash ? undefined : "#/button")
      setRoute(next)
    }
    update()
    window.addEventListener("hashchange", update)
    return () => window.removeEventListener("hashchange", update)
  }, [])
  return route
}

const wideScreen = () => window.matchMedia("(min-width: 600px)")
const subscribeWidth = (update: () => void) => {
  const media = wideScreen()
  media.addEventListener("change", update)
  return () => media.removeEventListener("change", update)
}

function DocsShell({ mode, onModeChange }: { mode: NavigationLayoutMode; onModeChange: (mode: NavigationLayoutMode) => void }) {
  // NavigationLayout.js calcSideCollapsed / _handleItemClick (UI5 2.28) use the 600px screen
  // boundary; the existing layout handles closing the navigation after a phone item is selected.
  const wide = React.useSyncExternalStore(subscribeWidth, () => wideScreen().matches, () => true)
  const expanded = mode === "expanded" || (mode === "auto" && wide)
  const set = (k: string, v: string) => {
    const q = new URLSearchParams(location.search)
    q.set(k, v)
    location.search = q.toString()
  }
  return (
    // NavigationLayout supplies the banner. A section scopes ShellBar's own header so the
    // composed shell exposes a single banner landmark, including on the all-demos route.
    <section>
      <ShellBar
        texts={{ label: "Component library header", additionalInfo: "Display settings" }}
        startButton={<Button id="docs-menu" variant="transparent" size="icon" aria-label="Toggle component navigation" aria-controls="docs-navigation" aria-expanded={expanded} onClick={() => onModeChange(expanded ? "collapsed" : "expanded")}><Icon icon={icons.menu2} /></Button>}
        branding={<ShellBarBranding href="#/button">shadcn-fiori</ShellBarBranding>}
        content={<>
          <ShellBarSpacer />
          <div key="theme" className="flex items-center gap-2">
            <Label htmlFor="docs-theme" className="sr-only lg:not-sr-only">Theme</Label>
            <Select value={opts.theme} onValueChange={(v) => set("theme", v)}>
              <SelectTrigger id="docs-theme" wrapperClassName="w-36 sm:w-52"><SelectValue /></SelectTrigger>
              <SelectContent>{THEMES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button key="density" id="docs-density" aria-pressed={opts.density === "compact"} onClick={() => set("density", opts.density === "compact" ? "cozy" : "compact")}>Compact</Button>
        </>}
      />
    </section>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-(--sapGroup_BorderCornerRadius) bg-(--sapGroup_ContentBackground) p-6 shadow-(--sapContent_Shadow0)">
      <h2 className="mb-4 font-(family-name:--sapFontHeaderFamily) text-(length:--sapFontHeader4Size) text-(--sapGroup_TitleTextColor)">{title}</h2>
      {children}
    </section>
  )
}

function IconsPage() {
  const [query, setQuery] = React.useState("")
  const matches = (iconNames as [string, string][]).filter(([n]) => n.includes(query.trim())).slice(0, 120)
  return (
    <div className="grid gap-6">
      <Install name="icons" />
      <p>The Icon component and tree-shakeable SAP Horizon icon data install together.</p>
      <PropsTable props={[{ name: "Icon.icon", type: "FioriIconData", description: "Required SAP icon data imported from fiori-icons." }, { name: "Icon.label", type: "string", description: "Accessible name; omit for a decorative icon." }]} />
        <Section title={`Icons (${iconNames.length})`}>
          <Input aria-label="Filter icons" placeholder="Filter icons" value={query} onChange={(e) => setQuery(e.target.value)} wrapperClassName="mb-4 max-w-xs" />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2">
            {matches.map(([n]) => (
              <div key={n} className="flex flex-col items-center gap-2 rounded-md p-2 text-center text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor) hover:bg-(--sapList_Hover_Background)">
                <Icon icon={iconByName.get(n)!} className="size-6 text-(--sapContent_IconColor)" />
                <span className="break-all">{n}</span>
              </div>
            ))}
          </div>
        </Section>
    </div>
  )
}

function Install({ name }: { name: string }) {
  return <pre className="overflow-x-auto rounded-(--sapElement_BorderCornerRadius) border border-(--sapGroup_ContentBorderColor) bg-(--sapList_Background) p-4"><code>{`npx shadcn add @fiori/${name}`}</code></pre>
}

function PropsTable({ props }: { props: ComponentDocs["props"] }) {
  return <div className="overflow-x-auto"><table className="w-full border-collapse text-left text-(length:--sapFontSmallSize)">
    <caption className="mb-2 text-left font-(family-name:--sapFontBoldFamily)">Main props</caption>
    <thead className="bg-(--sapList_HeaderBackground) text-(--sapList_HeaderTextColor)"><tr>{["Prop", "Type", "Default", "Description"].map((label) => <th key={label} scope="col" className="border-b border-(--sapList_BorderColor) p-3">{label}</th>)}</tr></thead>
    <tbody>{props.map((prop) => <tr key={prop.name}><th scope="row" className="border-b border-(--sapList_BorderColor) p-3 font-normal"><code>{prop.name}</code></th><td className="border-b border-(--sapList_BorderColor) p-3"><code>{prop.type}</code></td><td className="border-b border-(--sapList_BorderColor) p-3"><code>{prop.defaultValue ?? "—"}</code></td><td className="border-b border-(--sapList_BorderColor) p-3">{prop.description}</td></tr>)}</tbody>
  </table></div>
}

const ui5Sets = new Set(Object.keys(import.meta.glob("./fixtures/*.ui5.ts")).map((path) => path.split("/").pop()!.replace(/\.ui5\.ts$/, "")))
const pageQuery = () => new URLSearchParams({ theme: opts.theme, density: opts.density })
function FixtureLinks({ docs }: { docs: ComponentDocs }) {
  const name = docs.fixtureSet ?? docs.name
  const set = fixtureSets.find((set) => set.name === name) ?? sapui5FixtureSets.find((set) => set.name === name)
  if (!set) return <p className="text-(--sapContent_LabelColor)">Reference: demonstrated by the consuming component.</p>
  // E1's only= is an exact case ID. Component names such as button are not fixture prefixes.
  const fixture = set.cases.find((c) => c.id === docs.fixtureId) ?? set.cases.find((c) => !set.skipCompare?.includes(c.id)) ?? set.cases[0]
  const q = pageQuery()
  q.set(sapui5FixtureSets.includes(set) ? "fixtures-sapui5" : "fixtures", "")
  q.set("only", fixture.id)
  const hasUi5 = ui5Sets.has(name) && !set.skipCompare?.includes(fixture.id)
  const reference = pageQuery()
  reference.set("only", fixture.id)
  return <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-(--sapContent_LabelColor)">
    <a className="text-(--sapLinkColor) underline" data-docs-fixture={fixture.id} href={`/index.html?${q}`}>Fixtures</a>
    {hasUi5 ? <a className="text-(--sapLinkColor) underline" data-docs-reference={fixture.id} href={`/ui5.html?${reference}`}>UI5 reference</a> : <span>Reference: {sapui5FixtureSets.includes(set) ? "SAPUI5 local comparison harness" : "Fiori guideline review"}; no UI5 Web Components reference.</span>}
  </div>
}

function ComponentContent({ page }: { page: ComponentPage }) {
  const props = [...new Map(page.examples.flatMap(({ docs }) => docs.props).map((prop) => [prop.name, prop])).values()]
  return <div className="grid gap-6">
    <Install name={page.name} />
    {page.examples.map(({ demo, docs }) => <React.Fragment key={demo.title}><p>{docs.description}</p><FixtureLinks docs={docs} /><Section title={demo.title}><demo.Demo /></Section></React.Fragment>)}
    <PropsTable props={props} />
  </div>
}

const blockHref = (name: string) => `/block.html?${new URLSearchParams({ name, theme: opts.theme, density: opts.density })}`
function Floorplans() {
  return <div className="grid gap-6">{blocks.map((block) => <Section key={block.name} title={block.title}><div className="grid gap-4"><p>{block.description}</p><Install name={block.name} /><a className="text-(--sapLinkColor) underline" href={blockHref(block.name)}>Open {block.title}</a></div></Section>)}</div>
}

function Docs() {
  const route = useDocsRoute()
  const [mode, setMode] = React.useState<NavigationLayoutMode>("auto")
  React.useEffect(() => {
    document.fonts.ready.then(() => (document.documentElement.dataset.ready = "true"))
  }, [])
  const page = pageByName.get(route)
  const title = page?.title ?? (route === "icons" ? "SAP Horizon icons" : route === "floorplans" ? "Floorplans" : "All component demos")
  // NavigationLayout.css's ".fiori-nl[data-side-collapsed] .fiori-nl__aside" also matches
  // nested light-DOM demos (UI5 isolates each layout in shadow DOM). Reset only the preview
  // layout's own expanded aside; the collapsed docs and preview transforms remain unchanged.
  // Contain NavigationLayout.css's header/aside stacking in this shell so body-hosted surfaces
  // keep their own paint order above it.
  return <div data-docs-shell="" className="relative isolate h-dvh">
    <style>{`[data-docs-shell] main .fiori-nl:not([data-side-collapsed]) > .fiori-nl__root > .fiori-nl__section > .fiori-nl__aside { transform: none; }`}</style>
    <NavigationLayout mode={mode} onModeChange={setMode} header={<DocsShell mode={mode} onModeChange={setMode} />} sideContent={
    <SideNavigation id="docs-navigation" accessibleName="Component library navigation" value={route} texts={{ primaryListLabel: "Components by category" }}>
      {categories.map((category) => <SideNavigationGroup key={category} text={category} defaultExpanded>
        {pages.filter((page) => page.category === category).map((page) => <SideNavigationItem key={page.name} value={page.name} text={page.title} icon={icons.product} href={`#/${page.name}`} />)}
        {category === "Display" && <SideNavigationItem value="icons" text="Icons" icon={icons.grid} href="#/icons" />}
      </SideNavigationGroup>)}
      <SideNavigationGroup text="Floorplans" defaultExpanded><SideNavigationItem value="floorplans" text="Overview" icon={icons.home} href="#/floorplans" />{blocks.map((block) => <SideNavigationItem key={block.name} text={block.title} icon={icons.document} href={blockHref(block.name)} />)}</SideNavigationGroup>
    </SideNavigation>
  }>
    <main key={route} data-docs-route={route} className="mx-auto grid max-w-6xl gap-6 p-6 text-(--sapTextColor)">
      <h1 className="font-(family-name:--sapFontHeaderFamily) text-(length:--sapFontHeader2Size)">{title}</h1>
      {page ? <ComponentContent page={page} /> : route === "icons" ? <IconsPage /> : route === "floorplans" ? <Floorplans /> : <>{demos.map(({ title, Demo }) => <Section key={title} title={title}><Demo /></Section>)}<IconsPage /></>}
    </main>
    </NavigationLayout>
  </div>
}

// Expose case ids and tolerances for tests/visual.spec.ts. Anti-aliasing and sub-pixel text layout
// differ slightly between shadow DOM and light DOM, hence the default 2% tolerance.
;(window as any).__fixtures = activeFixtureSets.flatMap((set) =>
  set.cases.filter((c) => (!opts.only || c.id === opts.only) && !set.skipCompare?.includes(c.id)).map((c) => ({ id: c.id, tolerance: set.tolerance ?? 0.02, interact: c.interact }))
)

const fixtureMode = query.has("fixtures") || query.has("fixtures-sapui5")
if (fixtureMode) document.body.style.padding = "1rem"
createRoot(document.getElementById("root")!).render(<React.StrictMode>{fixtureMode ? <FixtureGrid /> : <Docs />}</React.StrictMode>)
