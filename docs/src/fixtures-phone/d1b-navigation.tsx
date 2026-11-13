import * as React from "react"
import { defineFixtures } from "../fixture-types"
import { Button } from "@/components/ui/button"
import { Menu, MenuTrigger, MenuContent, MenuItem, MenuSub, MenuSubTrigger, MenuSubContent } from "@/components/ui/menu"
import { Search, ShellBarSearch, SearchItem } from "@/components/ui/search"
export type NavigationCase = { kind: "menu" | "search" | "shellbar-search"; nested?: boolean; scopes?: boolean; longList?: boolean }
export const SEARCH_OPTIONS = ["Notebook", "Notebook Basic", "Notebook Pro"]
function NavigationPhone({ kind, nested, scopes, longList }: NavigationCase) {
  const query = new URLSearchParams(location.search)
  const holder = React.useRef<HTMLDivElement>(null)
  const [value, setValue] = React.useState("Notebook")
  const [events, setEvents] = React.useState<string[]>([])
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(true)
  const [secondOpen, setSecondOpen] = React.useState(false)
  React.useEffect(() => {
    if (query.has("interactive")) return
    if (kind === "menu") setOpen(true)
    else holder.current?.querySelector<HTMLElement>(kind === "search" ? 'input' : 'button')?.click()
  }, [])
  React.useEffect(() => {
    if (!nested || query.has("interactive")) return
    const observer = new MutationObserver(() => document.querySelector<HTMLElement>('[data-slot="menu-sub-trigger"]')?.click())
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [nested])
  const record = (event: string) => setEvents((previous) => [...previous, event])
  const Component = kind === "shellbar-search" ? ShellBarSearch : Search
  return <div ref={holder} id={`${kind}-phone-demo`} style={{ width: "375px", height: "667px", overflow: "hidden" }}>
    {kind === "menu" ? <Menu open={open} onOpenChange={setOpen}><MenuTrigger asChild><Button>Open Menu</Button></MenuTrigger><MenuContent headerText="Actions">
      <MenuItem onSelect={() => record("New")}>New</MenuItem><MenuItem disabled>Unavailable</MenuItem><MenuSub><MenuSubTrigger>More</MenuSubTrigger><MenuSubContent headerText="More"><MenuItem onSelect={() => record("Copy")}>Copy</MenuItem><MenuItem onSelect={() => record("Paste")}>Paste</MenuItem></MenuSubContent></MenuSub>
      {longList && Array.from({ length: 30 }, (_, index) => <MenuItem key={index}>Action {index + 1}</MenuItem>)}
    </MenuContent></Menu> : mounted && <Component id={`${kind}-phone-field`} value={value} onValueChange={(next) => { setValue(next); record(`input:${next}`) }} onSearch={({ value }) => record(`search:${value}`)} onScopeChange={(next) => record(`scope:${next}`)} accessibleName="Product Search" showClearIcon scopes={scopes ? [{ value: "all", text: "All" }, { value: "products", text: "Products" }] : undefined}>
      {SEARCH_OPTIONS.map((text) => <SearchItem key={text} text={text} />)}
    </Component>}
    {query.has("lifecycle") && kind === "search" && <><Button id="search-phone-unmount" onClick={() => setMounted(false)}>Unmount first search</Button><Button id="search-phone-open-second" onClick={() => setSecondOpen(true)}>Open second search</Button><div id="search-phone-second-demo"><Search accessibleName="Second Search" defaultValue="Notebook" open={secondOpen} onOpenChange={setSecondOpen}><SearchItem text="Notebook" /></Search></div></>}
    <output data-slot="phone-events" hidden>{JSON.stringify(events)}</output>
  </div>
}
export default defineFixtures<NavigationCase>({ name: "d1b-navigation", cases: [
  { id: "menu-phone", props: { kind: "menu" } },
  { id: "menu-phone-nested", props: { kind: "menu", nested: true } },
  { id: "menu-phone-long", props: { kind: "menu", longList: true } },
  { id: "search-phone", props: { kind: "search" } },
  { id: "search-phone-scopes", props: { kind: "search", scopes: true } },
  { id: "shellbar-search-phone", props: { kind: "shellbar-search" } },
  { id: "shellbar-search-phone-scopes", props: { kind: "shellbar-search", scopes: true } },
], react: (props) => <NavigationPhone {...props} /> })
