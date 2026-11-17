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
const channel = addons.getChannel()
const applyDocumentGlobals = ({ globals }: { globals: Record<string, string> }) => {
  document.documentElement.dataset.theme = globals.theme ?? "sap_horizon"
  document.documentElement.dataset.density = globals.density ?? "cozy"
  document.documentElement.dir = globals.dir ?? "ltr"
}
channel.on(SET_GLOBALS, applyDocumentGlobals)
channel.on(GLOBALS_UPDATED, applyDocumentGlobals)
import.meta.hot?.dispose(() => {
  channel.off(SET_GLOBALS, applyDocumentGlobals)
  channel.off(GLOBALS_UPDATED, applyDocumentGlobals)
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
    // Match docs/src/main.tsx: tokens and portaled overlays inherit the root attributes.
    if (context.viewMode === "story") applyDocumentGlobals({ globals: context.globals })
    // DocsPage owns the docs landmark. Full-page stories own theirs too: axe-core's
    // landmark-main-is-top-level / landmark-no-duplicate-main also match [role=main].
    const role = context.viewMode === "story" && !context.parameters.fiori?.ownsLandmarks ? "main" : undefined
    const controlArgs = Object.fromEntries(Object.entries(context.args).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)))
    return <div role={role} className="fiori-story-canvas" data-fiori-story={context.id} data-fiori-args={JSON.stringify(controlArgs)} data-theme={context.globals.theme} data-density={context.globals.density} dir={context.globals.dir}>{context.viewMode === "story" && <h1 className="sr-only">{context.title}: {context.name}</h1>}<Story /></div>
  }],
  parameters: {
    docs: { page: DocsPage, source: { type: "code" } },
    controls: { sort: "requiredFirst" },
    options: { storySort: { order: ["Introduction", "Actions", "Forms", "Dates", "Data", "Overlays", "Display", "Navigation", "Layout", "Floorplans"] } },
  },
}
export default preview
