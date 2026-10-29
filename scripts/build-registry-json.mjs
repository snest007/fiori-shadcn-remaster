// Writes registry.json (the shadcn registry manifest). Kept as a script so item lists stay in one place.
import { readFileSync, writeFileSync } from "node:fs"

// Where public/r is served. Consumers' components.json gets "@fiori" -> this URL on `shadcn init`.
const REGISTRY_URL = (process.env.REGISTRY_URL ?? "http://localhost:4173/r").replace(/\/$/, "")

// Theme CSS lands next to the app's Tailwind entry (src/index.css in Vite, app/globals.css in Next):
// "~/" is the project root, so we target src/ and let Next users move the folder (documented).
const css = (name) => ({ path: `registry/styles/${name}`, type: "registry:file", target: `~/src/styles/fiori/${name}` })
const shadcnVars = JSON.parse(readFileSync("registry/styles/shadcn-vars.json", "utf8"))
const ui = (name, extra = {}) => ({
  name,
  type: "registry:ui",
  registryDependencies: ["@fiori/fiori-theme", ...(extra.registryDependencies ?? [])],
  dependencies: extra.dependencies ?? [],
  files: [{ path: `registry/ui/${name}.tsx`, type: "registry:ui" }],
  title: extra.title,
  description: extra.description,
})

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "fiori",
  homepage: "https://github.com/snest007/shadcn-fiori",
  items: [
    {
      name: "fiori",
      type: "registry:base",
      title: "Fiori (SAP Horizon) base",
      description: "Theme, density, 72 font and the Phase 0 components. Install with `shadcn init <url>/r/fiori.json`.",
      registryDependencies: ["@fiori/fiori-theme", "@fiori/button", "@fiori/label", "@fiori/input", "@fiori/select"],
      config: {
        style: "new-york",
        iconLibrary: "lucide",
        tailwind: { baseColor: "neutral", cssVariables: true },
        registries: { "@fiori": `${REGISTRY_URL}/{name}.json` },
      },
    },
    {
      name: "fiori-theme",
      type: "registry:style",
      title: "Fiori theme",
      description: "SAP Horizon tokens (4 themes), density parameters, shadcn variable mapping and component CSS.",
      dependencies: ["clsx", "tailwind-merge"],
      files: [
        css("fiori.css"),
        css("fiori-tailwind.css"),
        css("fiori-components.css"),
        { path: "registry/lib/utils.ts", type: "registry:lib" },
      ],
      // Same values for light and dark: Fiori switches theme with data-theme, the --sap* vars do the work.
      cssVars: { light: shadcnVars, dark: shadcnVars },
      css: {
        '@import "./styles/fiori/fiori.css"': {},
        '@import "./styles/fiori/fiori-tailwind.css"': {},
        '@import "./styles/fiori/fiori-components.css"': {},
      },
    },
    {
      name: "icons",
      type: "registry:lib",
      title: "SAP Horizon icons",
      description: "705 SAP Horizon icons (tree-shakeable) and the <Icon> component.",
      registryDependencies: ["@fiori/fiori-theme"],
      files: [
        { path: "registry/lib/fiori-icons.ts", type: "registry:lib" },
        { path: "registry/ui/icon.tsx", type: "registry:ui" },
      ],
    },
    ui("button", { title: "Button", dependencies: ["class-variance-authority", "radix-ui"], description: "Fiori button designs: default, emphasized, transparent, positive, negative, attention." }),
    ui("label", { title: "Label", dependencies: ["radix-ui"], description: "Form label with required marker and colon." }),
    ui("input", { title: "Input", registryDependencies: ["@fiori/icons"], description: "Fiori input with value states and value state message." }),
    ui("select", { title: "Select", dependencies: ["radix-ui"], registryDependencies: ["@fiori/icons", "@fiori/input"], description: "Fiori select with the SAP keyboard model (arrows change value while closed; F4 / Alt+↓ open)." }),
  ],
}

writeFileSync("registry.json", JSON.stringify(registry, null, 2) + "\n")
console.log(`registry.json written (${registry.items.length} items)`)
