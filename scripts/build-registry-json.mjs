// Writes registry.json (the shadcn registry manifest). Kept as a script so item lists stay in one place.
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { componentOwners, iconsItem, itemMetadata, usageMarkdown, validateUsage } from "./skill/usage.mjs"

// Where public/r is served. Consumers' components.json gets "@petalo" -> this URL on `shadcn init`.
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
  registryDependencies: ["@petalo/fiori-theme", ...(extra.registryDependencies ?? [])],
  dependencies: extra.dependencies ?? [],
  files: [...(extra.type === "registry:lib" ? [] : [{ path: `registry/ui/${name}.tsx`, type: "registry:ui" }]), ...(extra.files ?? [])],
  ...(extra.usage ? { meta: { usage: extra.usage }, docs: usageMarkdown(extra.usage) } : {}),
})
const componentMetadata = itemMetadata("registry/items")
// The registry builder is also used against isolated usage-only fixture repositories.
// Generate SAP packs only when this registry owns their sources; never require UI5
// node_modules in an unrelated fixture cwd.
if (existsSync("registry/i18n/registry-items.json")) await import("./build-i18n-packs.mjs")
const blockMetadata = itemMetadata("registry/block-items").map((item) => ({ ...item, type: "registry:block" }))
// Coverage exemptions: registry:lib (f6-navigation, use-is-phone, variants) provides utilities,
// not selectable UI or floorplans. Script-emitted fiori (base), fiori-theme (style), icons
// (library), illustrations-core and illustration-* (assets) have no hand-authored usage source.
// Only authored registry:ui and registry:block items are required by --require-usage.
// SAP illustrations: written by scripts/generate-illustrations.mjs (illustrations-core + one item each).
const illustrations = JSON.parse(readFileSync("registry/lib/fiori-illustrations/registry-items.json", "utf8"))
validateUsage([
  ...componentMetadata.map((item) => ({ ...item, type: item.type ?? "registry:ui" })), ...blockMetadata, ...illustrations,
  { name: "petalo" }, { name: "fiori-theme" }, iconsItem,
], componentOwners(process.cwd(), [...componentMetadata, ...blockMetadata, iconsItem]), { requireUsage: process.argv.includes("--require-usage") })
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
      registryDependencies: ["@petalo/fiori-theme", ...(extra.registryDependencies ?? [])],
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
  name: "petalo",
  homepage: "https://github.com/snest007/petalo",
  items: [
    {
      // Entry point: `shadcn init <url>/r/petalo.json`. The project is named petalo (not "fiori": SAP
      // trademark); item and file names like fiori-theme / fiori.css describe the design language.
      name: "petalo",
      type: "registry:base",
      title: "petalo base (SAP Fiori Horizon design language)",
      description: "Theme, density, icons and every Fiori component (the 72 font is the separate, optional @petalo/fiori-font). Install with `shadcn init <url>/r/petalo.json`.",
      registryDependencies: ["@petalo/fiori-theme", ...components.map((c) => `@petalo/${c.name}`)],
      config: {
        style: "new-york",
        iconLibrary: "lucide",
        tailwind: { baseColor: "neutral", cssVariables: true },
        registries: { "@petalo": `${REGISTRY_URL}/{name}.json` },
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
      // Opt-in: the 72 font files are © SAP SE / Monotype, not Apache-2.0 (see scripts/generate-tokens.mjs).
      name: "fiori-font",
      type: "registry:item",
      title: "SAP 72 font (optional)",
      description: "@font-face rules that load SAP's 72 font from jsDelivr. The font is not Apache-2.0 licensed: check your rights to use it before installing.",
      registryDependencies: ["@petalo/fiori-theme"],
      files: [css("fiori-font.css")],
      css: { '@import "./styles/fiori/fiori-font.css"': {} },
    },
    iconsItem,
    ...components,
    ...(existsSync("registry/i18n/registry-items.json") ? JSON.parse(readFileSync("registry/i18n/registry-items.json", "utf8")) : []),
    ...illustrations,
    ...blocks,
  ],
}

// shadcn 4.23's registryItemSchema preserves both `docs` and `meta` in public/r (covered by
// usage-guidance.spec.ts). No post-processing is needed; the CLI installs the original file payloads.
writeFileSync("registry.json", JSON.stringify(registry, null, 2) + "\n")
console.log(`registry.json written (${registry.items.length} items)`)
