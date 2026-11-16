import * as React from "react"
import type { Preview } from "@storybook/react-vite"
import "../docs/src/index.css"
import "./preview.css"
import { DocsPage } from "../docs/stories/_lib/DocsPage"

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
    document.documentElement.dataset.theme = context.globals.theme
    document.documentElement.dataset.density = context.globals.density
    document.documentElement.dir = context.globals.dir
    const Canvas = context.viewMode === "story" ? "main" : "div"
    const controlArgs = Object.fromEntries(Object.entries(context.args).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)))
    return <Canvas className="fiori-story-canvas" data-fiori-story={context.id} data-fiori-args={JSON.stringify(controlArgs)} data-theme={context.globals.theme} data-density={context.globals.density} dir={context.globals.dir}>{context.viewMode === "story" && <h1 className="sr-only">{context.title}: {context.name}</h1>}<Story /></Canvas>
  }],
  parameters: {
    docs: { page: DocsPage, source: { type: "code" } },
    controls: { sort: "requiredFirst" },
    options: { storySort: { order: ["Introduction", "Actions", "Forms", "Dates", "Data", "Overlays", "Display", "Navigation", "Layout", "Floorplans"] } },
  },
}
export default preview
