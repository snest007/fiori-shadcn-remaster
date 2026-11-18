import * as React from "react"
import type { Preview } from "@storybook/react-vite"
import { addons } from "storybook/preview-api"
import { GLOBALS_UPDATED, SET_GLOBALS } from "storybook/internal/core-events"
import "../docs/src/index.css"
import "./preview.css"
import { DocsPage } from "../docs/stories/_lib/DocsPage"

// Storybook Preview.emitGlobals initializes SET_GLOBALS and updates through
// GLOBALS_UPDATED. Keep the document on toolbar globals, including MDX/iframe-only
// docs; an individual inline RTL example must only change its own canvas.
//
// Docs pages render `inline: false` stories in their own lazy iframe (addon-docs
// IFrame + getStoryHref: `iframe.html?viewMode=story&id=…`, without globals). That
// child preview boots with initialGlobals (Morning) and its SET_GLOBALS /
// GLOBALS_UPDATED also reach the docs frame's channel. Two fixes:
// 1. A frame only applies globals its own Preview emitted (Channel stamps every event
//    `from: sender`), so a child's boot payload can't reset the Docs document.
// 2. A child story iframe inside a same-origin docs frame takes theme/density/dir from
//    that docs frame — locally, without a channel message: the child channel's only
//    transport is its parent, so UPDATE_GLOBALS would re-render the docs page and
//    remount the child.
type ThemeGlobals = { theme?: string; density?: string; dir?: string }
type DocsHost = Window & { __petaloDocsGlobals?: () => ThemeGlobals | undefined }
const channel = addons.getChannel()
// Channel.sender is private in Storybook's typings; every Channel event carries `from: this.sender`.
const ownSender = () => (channel as unknown as { sender?: string }).sender
const isOwnEvent = (event: { from?: string } | undefined) => !event?.from || !ownSender() || event.from === ownSender()

/** The embedding docs frame, when this is an `inline: false` child story iframe without URL globals. */
const docsHost = (): DocsHost | undefined => {
  try {
    if (window.parent === window) return undefined
    const own = new URLSearchParams(window.location.search)
    if (own.get("viewMode") !== "story" || own.has("globals")) return undefined
    const parent = new URL(window.parent.location.href)
    return parent.pathname.endsWith("iframe.html") && parent.searchParams.get("viewMode") === "docs" ? (window.parent as DocsHost) : undefined
  } catch {
    return undefined // cross-origin parent (composed Storybook): keep own globals
  }
}
const inheritedGlobals = (): ThemeGlobals | undefined => {
  const g = docsHost()?.__petaloDocsGlobals?.()
  return g && { theme: g.theme, density: g.density, dir: g.dir }
}

let documentGlobals: ThemeGlobals | undefined
const DOCS_GLOBALS_EVENT = "petalo:docs-globals"
const applyDocumentGlobals = ({ globals }: { globals: ThemeGlobals }) => {
  const effective = { ...globals, ...inheritedGlobals() }
  documentGlobals = effective
  document.documentElement.dataset.theme = effective.theme ?? "sap_horizon"
  document.documentElement.dataset.density = effective.density ?? "cozy"
  document.documentElement.dir = effective.dir ?? "ltr"
  window.dispatchEvent(new Event(DOCS_GLOBALS_EVENT))
}
;(window as DocsHost).__petaloDocsGlobals = () => documentGlobals
function onOwnGlobals(this: { from?: string } | undefined, payload: { globals: ThemeGlobals }) {
  if (isOwnEvent(this)) applyDocumentGlobals(payload)
}
channel.on(SET_GLOBALS, onOwnGlobals)
channel.on(GLOBALS_UPDATED, onOwnGlobals)
import.meta.hot?.dispose(() => {
  channel.off(SET_GLOBALS, onOwnGlobals)
  channel.off(GLOBALS_UPDATED, onOwnGlobals)
})

/** Re-render a child story when its docs frame's theme/density/dir change. */
const subscribeDocsHost = (onChange: () => void) => {
  const host = docsHost()
  host?.addEventListener(DOCS_GLOBALS_EVENT, onChange)
  return () => host?.removeEventListener(DOCS_GLOBALS_EVENT, onChange)
}
const docsHostSnapshot = () => JSON.stringify(inheritedGlobals() ?? null)
const useInheritedGlobals = (): ThemeGlobals | undefined => {
  const snapshot = React.useSyncExternalStore(subscribeDocsHost, docsHostSnapshot, docsHostSnapshot)
  return React.useMemo(() => JSON.parse(snapshot) ?? undefined, [snapshot])
}
function FioriCanvas({ globals, children }: { globals: Record<string, string>; children: (effective: Record<string, string>) => React.ReactNode }) {
  const inherited = useInheritedGlobals()
  const effective = inherited ? { ...globals, ...Object.fromEntries(Object.entries(inherited).filter(([, v]) => v)) } : globals
  return <>{children(effective as Record<string, string>)}</>
}

const preview: Preview = {
  globalTypes: {
    theme: { description: "Horizon theme", toolbar: { title: "Theme", icon: "paintbrush", dynamicTitle: true, items: [
      { value: "sap_horizon", title: "Morning Horizon" },
      { value: "sap_horizon_dark", title: "Evening Horizon" },
      { value: "sap_horizon_hcb", title: "High Contrast Black" },
      { value: "sap_horizon_hcw", title: "High Contrast White" },
    ] } },
    density: { description: "Content density", toolbar: { title: "Density", icon: "component", dynamicTitle: true, items: ["cozy", "compact"] } },
    dir: { description: "Text direction", toolbar: { title: "Direction", icon: "transfer", dynamicTitle: true, items: ["ltr", "rtl"] } },
  },
  initialGlobals: { theme: "sap_horizon", density: "cozy", dir: "ltr" },
  decorators: [(Story, context) => (
    <FioriCanvas globals={context.globals}>{(globals) => {
      // Match docs/src/main.tsx: tokens and portaled overlays inherit the root attributes.
      if (context.viewMode === "story") applyDocumentGlobals({ globals })
      // DocsPage owns the docs landmark. Full-page stories own theirs too: axe-core's
      // landmark-main-is-top-level / landmark-no-duplicate-main also match [role=main].
      const ownsLandmarks = context.parameters.fiori?.ownsLandmarks
      const role = context.viewMode === "story" && !ownsLandmarks ? "main" : undefined
      const headingId = ownsLandmarks ? `fiori-story-heading-${context.id}` : undefined
      const heading = context.viewMode === "story" && <h1 id={headingId} className="sr-only">{context.title}: {context.name}</h1>
      const controlArgs = Object.fromEntries(Object.entries(context.args).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)))
      // axe-core regionEvaluate/findRegionlessElms counts accessible hidden headings.
      // Name a region around this heading alone; the story's main stays its sibling.
      // UI5 2.28 ListTemplate renders native header/footer (TreeList inherits List).
      // axe-core landmarkHasBodyContextMatches excludes native headers/footers only
      // beneath article/aside/main/nav/section. An unnamed section stays generic and keeps
      // component roles intact; owned full-page landmarks and Docs stay unwrapped.
      const story = role === "main" ? <section><Story /></section> : <Story />
      return <div role={role} className="fiori-story-canvas" data-fiori-story={context.id} data-fiori-args={JSON.stringify(controlArgs)} data-theme={globals.theme} data-density={globals.density} dir={globals.dir}>{context.viewMode === "story" && ownsLandmarks ? <section aria-labelledby={headingId}>{heading}</section> : heading}{story}</div>
    }}</FioriCanvas>
  )],
  parameters: {
    docs: { page: DocsPage, source: { type: "code" } },
    controls: { sort: "requiredFirst" },
    options: { storySort: { order: ["Introduction", "Actions", "Forms", "Dates", "Data", "Overlays", "Display", "Navigation", "Layout", "Floorplans"] } },
  },
}
export default preview
