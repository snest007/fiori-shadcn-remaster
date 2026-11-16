// Generated guidance has no timestamps and uses stable name order; edit item JSON or the template.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { categories, compare, componentOwners, demoCategories, iconsItem, itemMetadata, runtimeExports, validateUsage } from "./skill/usage.mjs"

const root = process.cwd()
const components = itemMetadata(join(root, "registry/items")).map((item) => ({ ...item, type: item.type ?? "registry:ui" }))
const blocks = itemMetadata(join(root, "registry/block-items")).map((item) => ({ ...item, type: "registry:block", category: "Floorplans" }))
const categoryByName = demoCategories(root)
for (const item of components) {
  item.category = categoryByName.get(item.name)
  if (!item.category) throw new Error(`${item.name}: missing demo category/docs entry`)
}
for (const name of categoryByName.keys()) if (!components.some((item) => item.name === name)) throw new Error(`${name}: unknown demo registry item`)
const illustrations = JSON.parse(readFileSync(join(root, "registry/lib/fiori-illustrations/registry-items.json"), "utf8"))
validateUsage([...components, ...blocks, ...illustrations, { name: "fiori" }, { name: "fiori-theme" }, iconsItem], componentOwners(root, [...components, iconsItem]))

const install = (name) => `npx shadcn add @fiori/${name}`
const cell = (value) => value.replace(/\|/g, "\\|").replace(/\n/g, " ")
const summary = (item) => item.usage?.summary ?? item.description ?? item.title
const table = (headings, rows) => ["| " + headings.join(" | ") + " |", "| " + headings.map(() => "---").join(" | ") + " |", ...rows.map((row) => "| " + row.map(cell).join(" | ") + " |")].join("\n")
const localAlternative = (name) => {
  const item = [...components, ...blocks].find((item) => item.name === name)
  return item ? `[${name}](${item.category.toLowerCase()}.md#${name})` : `\`${name}\``
}
function entry(item) {
  const sourcePaths = item.type === "registry:block" ? [`registry/blocks/${item.name}.tsx`] : item.type === "registry:ui" ? [`registry/ui/${item.name}.tsx`] : (item.files ?? []).filter((file) => /\.tsx?$/.test(file.path)).map((file) => file.path)
  const exports = [...new Set(sourcePaths.flatMap((path) => runtimeExports(join(root, path))))].sort(compare)
  const sections = [`## ${item.name}`, summary(item)]
  if (item.usage) {
    sections.push("### Use when\n\n" + item.usage.useWhen.map((text) => `- ${text}`).join("\n"))
    sections.push("### Don't use when\n\n" + item.usage.avoidWhen.map((entry) => `- ${entry.when}${entry.use?.length ? ` → ${entry.use.map(localAlternative).join(", ")}` : ""}`).join("\n"))
    if (item.usage.layout) sections.push("### Layout\n\n```text\n" + item.usage.layout.join("\n") + "\n```")
    if (item.usage.variations) sections.push("### Variations\n\n" + item.usage.variations.map((text) => `- ${text}`).join("\n"))
  } else sections.push("Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.")
  sections.push(`Main exports: ${exports.map((name) => `\`${name}\``).join(", ")}${item.type === "registry:block" ? " (default export)" : ""}.`, "```bash\n" + install(item.name) + "\n```")
  return sections.join("\n\n")
}

const output = join(root, "skills/shadcn-fiori")
const generated = new Map()
const all = [...components, ...blocks].sort((a, b) => compare(a.name, b.name))
for (const category of categories) {
  generated.set(`references/${category.toLowerCase()}.md`, `# ${category}\n\n` + all.filter((item) => item.category === category).map(entry).join("\n\n") + "\n")
}
const floorplans = table(["Block", "Use when", "Don't use when", "Instead"], blocks.map((item) => [
  `[${item.name}](references/floorplans.md#${item.name})`, item.usage?.useWhen.join("<br>") ?? "Guidance not yet authored; inspect the block.",
  item.usage?.avoidWhen.map((entry) => entry.when).join("<br>") ?? "—", item.usage?.avoidWhen.map((entry) => (entry.use ?? []).join(", ") || "—").join("<br>") ?? "—",
]))
const pickers = categories.slice(0, -1).map((category) => `### ${category}\n\n` + table(["Item", "Summary"], all.filter((item) => item.category === category).map((item) => [`[${item.name}](references/${category.toLowerCase()}.md#${item.name})`, summary(item)]))).join("\n\n")
const index = categories.map((category) => `- [${category}](references/${category.toLowerCase()}.md) — ${all.filter((item) => item.category === category).map((item) => `\`${item.name}\``).join(", ")}.`).join("\n")
let template = readFileSync(join(root, "scripts/skill/SKILL.template.md"), "utf8")
for (const [key, content] of Object.entries({ FLOORPLAN_PICKER: floorplans, COMPONENT_PICKERS: pickers, REFERENCE_INDEX: index })) template = template.replaceAll(`{{${key}}}`, content)
if (/\{\{[A-Z_]+\}\}/.test(template)) throw new Error("Unresolved skill template placeholder")
generated.set("SKILL.md", template)
generated.set("NOTICE", "shadcn-fiori usage guidance\n\nGuidance adapted in original wording from SAP/ai-skills-library (Apache-2.0).\nSource: https://github.com/SAP/ai-skills-library/tree/cd0bb455ec68db3f83db94b200546618c32f8ab2/skills/sap-fiori-guidelines\nPinned commit: cd0bb455ec68db3f83db94b200546618c32f8ab2\nCopyright SAP SE and ai-skills-library contributors.\nThe adaptation describes the APIs available in this registry.\n")

// This directory is wholly generated. Remove obsolete outputs after categories/templates change,
// so the next build converges on the same tree as a clean checkout without discarding source files.
mkdirSync(output, { recursive: true })
function prune(folder, prefix = "") {
  for (const file of readdirSync(folder, { withFileTypes: true })) {
    const relative = prefix + file.name
    const path = join(folder, file.name)
    if (file.isDirectory() && [...generated.keys()].some((key) => key.startsWith(relative + "/"))) prune(path, relative + "/")
    else if (!generated.has(relative)) rmSync(path, { recursive: true, force: true })
  }
}
prune(output)
for (const [file, content] of generated) {
  mkdirSync(join(output, file, ".."), { recursive: true })
  writeFileSync(join(output, file), content)
}
console.log(`skills/shadcn-fiori written (${all.length} items, ${categories.length} references)`)
