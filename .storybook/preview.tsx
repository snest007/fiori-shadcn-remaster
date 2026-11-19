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
// GLOBALS_UPDATED also reach the docs frame's channel. Three rules:
// 1. A frame only applies globals its own Preview emitted (Channel stamps every event
//    `from: sender`), so a child's boot payload can't reset the Docs document.
// 2. A child story iframe inside a same-origin docs frame takes theme/density/dir from
//    that docs frame — locally, without a channel message: the child channel's only
//    transport is its parent, so UPDATE_GLOBALS would re-render the docs page and
//    remount the child. The story's own `globals` (e.g. an RTL story's `dir: "rtl"`)
//    still win: Storybook's StoryStore.getStoryContext puts storyGlobals over userGlobals,
//    and the docs frame only stands in for the user's toolbar values.
// 3. When the docs frame's globals change, the child re-renders through Storybook's own
//    StoryRender.rerender (preview/runtime.js), never through a React state update: story
//    render functions call Storybook hooks (useArgs, preview-api useState), which throw
//    "hooks can only be called inside decorators and story functions" when React re-renders
//    them outside Storybook's hooks context.
type ThemeGlobals = { theme?: string; density?: string; dir?: string }
type DocsHost = Window & { __petaloDocsGlobals?: () => ThemeGlobals | undefined }
type PreviewWindow = Window & { __STORYBOOK_PREVIEW__?: { storyRenders: { rerender: () => Promise<void> }[] } }
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
const inheritedGlobals = (): ThemeGlobals => {
  const g = docsHost()?.__petaloDocsGlobals?.()
  return Object.fromEntries(Object.entries({ theme: g?.theme, density: g?.density, dir: g?.dir }).filter(([, v]) => v))
}
/** Toolbar globals < docs frame (stands in for the toolbar in a child) < the story's own globals. */
const effectiveGlobals = (globals: ThemeGlobals, storyGlobals: ThemeGlobals = {}): ThemeGlobals =>
  ({ ...globals, ...inheritedGlobals(), ...storyGlobals })

let documentGlobals: ThemeGlobals | undefined
const DOCS_GLOBALS_EVENT = "petalo:docs-globals"
const applyDocumentGlobals = (effective: ThemeGlobals) => {
  documentGlobals = effective
  document.documentElement.dataset.theme = effective.theme ?? "sap_horizon"
  document.documentElement.dataset.density = effective.density ?? "cozy"
  document.documentElement.dir = effective.dir ?? "ltr"
  window.dispatchEvent(new Event(DOCS_GLOBALS_EVENT))
}
;(window as DocsHost).__petaloDocsGlobals = () => documentGlobals
function onOwnGlobals(this: { from?: string } | undefined, payload: { globals: ThemeGlobals; storyGlobals?: ThemeGlobals }) {
  if (isOwnEvent(this)) applyDocumentGlobals(effectiveGlobals(payload.globals, payload.storyGlobals))
}
channel.on(SET_GLOBALS, onOwnGlobals)
channel.on(GLOBALS_UPDATED, onOwnGlobals)

// Rule 3: a child story follows its docs frame's theme/density/dir via Storybook's own rerender.
const host = docsHost()
const rerenderStories = () => {
  for (const render of (window as PreviewWindow).__STORYBOOK_PREVIEW__?.storyRenders ?? []) void render.rerender()
}
host?.addEventListener(DOCS_GLOBALS_EVENT, rerenderStories)
import.meta.hot?.dispose(() => {
  channel.off(SET_GLOBALS, onOwnGlobals)
  channel.off(GLOBALS_UPDATED, onOwnGlobals)
  host?.removeEventListener(DOCS_GLOBALS_EVENT, rerenderStories)
})

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
  decorators: [(Story, context) => {
    const globals = effectiveGlobals(context.globals, context.storyGlobals)
    // Match docs/src/main.tsx: tokens and portaled overlays inherit the root attributes.
    if (context.viewMode === "story") applyDocumentGlobals(globals)
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
  }],
  parameters: {
    docs: { page: DocsPage, source: { type: "code" } },
    controls: { sort: "requiredFirst" },
    options: { storySort: { order: ["Introduction", "Actions", "Forms", "Dates", "Data", "Overlays", "Display", "Navigation", "Layout", "Floorplans"] } },
  },
}
export default preview
