// Writes registry.json (the shadcn registry manifest). Kept as a script so item lists stay in one place.
import { readFileSync, writeFileSync } from "node:fs"
import { componentOwners, iconsItem, itemMetadata, usageMarkdown, validateUsage } from "./skill/usage.mjs"

// Where public/r is served. Consumers' components.json gets "@fiori" -> this URL on `shadcn init`.
const REGISTRY_URL = (process.env.REGISTRY_URL ?? "http://localhost:4173/r").replace(/\/$/, "")

// Theme CSS lands next to the app's Tailwind entry (src/index.css in Vite, app/globals.css in Next):
// "~/" is the project root, so we target src/ and let Next users move the folder (documented).
const css = (name) => ({ path: `registry/styles/${name}`, type: "registry:file", target: `~/src/styles/fiori/${name}` })
const shadcnVars = JSON.parse(readFileSync("registry/styles/shadcn-vars.json", "utf8"))
// One registry/items/<name>.json per component ({ title, description, dependencies?,
// registryDependencies?, files? }); the component source is registry/ui/<name>.tsx.
const ui = (name, extra = {}) => ({
  name,
  type: extra.type ?? "registry:ui",
  title: extra.title,
  description: extra.description,
  registryDependencies: ["@fiori/fiori-theme", ...(extra.registryDependencies ?? [])],
  dependencies: extra.dependencies ?? [],
  files: [...(extra.type === "registry:lib" ? [] : [{ path: `registry/ui/${name}.tsx`, type: "registry:ui" }]), ...(extra.files ?? [])],
  ...(extra.usage ? { meta: { usage: extra.usage }, docs: usageMarkdown(extra.usage) } : {}),
})
const componentMetadata = itemMetadata("registry/items")
const blockMetadata = itemMetadata("registry/block-items").map((item) => ({ ...item, type: "registry:block" }))
// SAP illustrations: written by scripts/generate-illustrations.mjs (illustrations-core + one item each).
const illustrations = JSON.parse(readFileSync("registry/lib/fiori-illustrations/registry-items.json", "utf8"))
validateUsage([
  ...componentMetadata.map((item) => ({ ...item, type: item.type ?? "registry:ui" })), ...blockMetadata, ...illustrations,
  { name: "fiori" }, { name: "fiori-theme" }, iconsItem,
], componentOwners(process.cwd(), [...componentMetadata, iconsItem]), { requireUsage: process.argv.includes("--require-usage") })
const components = componentMetadata.map((extra) => ui(extra.name, extra))

// Blocks (floorplans / page templates): registry/blocks/<name>.tsx + registry/block-items/<name>.json
// ({ title, description, dependencies?, registryDependencies?, files? }). Installed into components/.
const blocks = blockMetadata.map((extra) => {
    const name = extra.name
    return {
      name,
      type: "registry:block",
      title: extra.title,
      description: extra.description,
      registryDependencies: ["@fiori/fiori-theme", ...(extra.registryDependencies ?? [])],
      dependencies: extra.dependencies ?? [],
      files: [{ path: `registry/blocks/${name}.tsx`, type: "registry:block" }, ...(extra.files ?? [])],
      categories: extra.categories ?? ["floorplan"],
      ...(extra.usage ? { meta: { usage: extra.usage }, docs: usageMarkdown(extra.usage) } : {}),
    }
  })

// Blocks install into components/<name>.tsx next to components/ui/; a block named like a component would
// overwrite it (or vice versa), so names must be unique across both.
for (const b of blocks) {
  if (components.some((c) => c.name === b.name)) throw new Error(`block "${b.name}" has the same name as a component`)
}

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "fiori",
  homepage: "https://github.com/snest007/fiori-shadcn-remaster",
  items: [
    {
      name: "fiori",
      type: "registry:base",
      title: "Fiori (SAP Horizon) base",
      description: "Theme, density, 72 font, icons and every Fiori component. Install with `shadcn init <url>/r/fiori.json`.",
      registryDependencies: ["@fiori/fiori-theme", ...components.map((c) => `@fiori/${c.name}`)],
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
    iconsItem,
    ...components,
    ...illustrations,
    ...blocks,
  ],
}

// shadcn 4.23's registryItemSchema preserves both `docs` and `meta` in public/r (covered by
// usage-guidance.spec.ts). No post-processing is needed; the CLI installs the original file payloads.
writeFileSync("registry.json", JSON.stringify(registry, null, 2) + "\n")
console.log(`registry.json written (${registry.items.length} items)`)
