import * as React from "react"
import type { Preview } from "@storybook/react-vite"
import { addons } from "storybook/preview-api"
import { GLOBALS_UPDATED, SET_GLOBALS } from "storybook/internal/core-events"
import "../docs/src/index.css"
import "./preview.css"
import { DocsPage } from "../docs/stories/_lib/DocsPage"
import { FioriLocaleProvider, type FioriTexts } from "../registry/lib/fiori-locale"

const packs = import.meta.glob<FioriTexts>("../registry/i18n/*.json", { eager: true, import: "default" })
const pack = (locale: string) => packs[`../registry/i18n/${locale}.json`] ?? {}

// Storybook Preview.emitGlobals initializes SET_GLOBALS and updates through
// GLOBALS_UPDATED. Keep the document on toolbar globals, including MDX/iframe-only
// docs; an individual inline RTL example must only change its own canvas.
const channel = addons.getChannel()
const applyDocumentGlobals = ({ globals }: { globals: Record<string, string> }) => {
  document.documentElement.dataset.theme = globals.theme ?? "sap_horizon"
  document.documentElement.dataset.density = globals.density ?? "cozy"
  document.documentElement.dir = globals.locale === "ar" ? "rtl" : globals.dir ?? "ltr"
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
    locale: { description: "Locale and SAP translations", toolbar: { title: "Locale", icon: "globe", dynamicTitle: true, items: [
      { value: "default", title: "English (default)" }, { value: "de", title: "Deutsch" }, { value: "fr", title: "Français" },
      { value: "ja", title: "日本語" }, { value: "zh-CN", title: "简体中文" }, { value: "ar", title: "العربية" },
    ] } },
  },
  initialGlobals: { theme: "sap_horizon", density: "cozy", dir: "ltr", locale: "default" },
  decorators: [(Story, context) => {
    // Match docs/src/main.tsx: tokens and portaled overlays inherit the root attributes.
    if (context.viewMode === "story") applyDocumentGlobals({ globals: context.globals })
    const Canvas = context.viewMode === "story" ? "main" : "div"
    const controlArgs = Object.fromEntries(Object.entries(context.args).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)))
    const locale = context.globals.locale as string
    const direction = locale === "ar" ? "rtl" : context.globals.dir
    const content = <Canvas className="fiori-story-canvas" data-fiori-story={context.id} data-fiori-args={JSON.stringify(controlArgs)} data-theme={context.globals.theme} data-density={context.globals.density} dir={direction}>{context.viewMode === "story" && <h1 className="sr-only">{context.title}: {context.name}</h1>}<Story /></Canvas>
    // Keep the pre-E5 English/no-provider path for default stories.
    return locale && locale !== "default" ? <FioriLocaleProvider locale={locale} texts={pack(locale)}>{content}</FioriLocaleProvider> : content
  }],
  parameters: {
    docs: { page: DocsPage, source: { type: "code" } },
    controls: { sort: "requiredFirst" },
    options: { storySort: { order: ["Introduction", "Actions", "Forms", "Dates", "Data", "Overlays", "Display", "Navigation", "Layout", "Floorplans"] } },
  },
}
export default preview
