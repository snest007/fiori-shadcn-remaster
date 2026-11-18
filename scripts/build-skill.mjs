// Generated guidance has no timestamps and uses stable name order; edit item JSON or the template.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { categories, compare, componentOwners, demoCategories, iconsItem, itemMetadata, mainExports, validateUsage } from "./skill/usage.mjs"

const root = process.cwd()
const components = itemMetadata(join(root, "registry/items")).map((item) => ({ ...item, type: item.type ?? "registry:ui" }))
const blocks = itemMetadata(join(root, "registry/block-items")).map((item) => ({ ...item, type: "registry:block", category: "Floorplans" }))
const documented = new Map()
const categoryByName = demoCategories(root, documented)
for (const item of components) {
  item.category = categoryByName.get(item.name)
  if (!item.category) throw new Error(`${item.name}: missing demo category/docs entry`)
}
for (const name of categoryByName.keys()) if (!components.some((item) => item.name === name)) throw new Error(`${name}: unknown demo registry item`)
const illustrations = JSON.parse(readFileSync(join(root, "registry/lib/fiori-illustrations/registry-items.json"), "utf8"))
validateUsage([...components, ...blocks, ...illustrations, { name: "petalo" }, { name: "fiori-theme" }, iconsItem], componentOwners(root, [...components, ...blocks, iconsItem]))

const install = (name) => `npx shadcn add @petalo/${name}`
const cell = (value) => value.replace(/\|/g, "\\|").replace(/\n/g, " ")
const summary = (item) => item.usage?.summary ?? item.description ?? item.title
const table = (headings, rows) => ["| " + headings.join(" | ") + " |", "| " + headings.map(() => "---").join(" | ") + " |", ...rows.map((row) => "| " + row.map(cell).join(" | ") + " |")].join("\n")
const localAlternative = (name) => {
  const item = [...components, ...blocks].find((item) => item.name === name)
  return item ? `[${name}](${item.category.toLowerCase()}.md#${name})` : `\`${name}\``
}
function entry(item) {
  const sourcePaths = item.type === "registry:block" ? [`registry/blocks/${item.name}.tsx`] : item.type === "registry:ui" ? [`registry/ui/${item.name}.tsx`] : (item.files ?? []).filter((file) => /\.tsx?$/.test(file.path)).map((file) => file.path)
  const exports = [...new Set(sourcePaths.flatMap((path) => mainExports(join(root, path), documented.get(item.name))))].sort(compare)
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

const output = join(root, "skills/petalo")
const generated = new Map()
const all = [...components, ...blocks].sort((a, b) => compare(a.name, b.name))
for (const category of categories) {
  generated.set(`references/${category.toLowerCase()}.md`, `# ${category}\n\n` + table(["Item", "Summary"], all.filter((item) => item.category === category).map((item) => [`[${item.name}](#${item.name})`, summary(item)])) + "\n\n" + all.filter((item) => item.category === category).map(entry).join("\n\n") + "\n")
}
const floorplans = table(["Block", "Use when", "Other blocks"], blocks.map((item) => [
  `[${item.name}](references/floorplans.md#${item.name})`, item.usage?.useWhen[0] ?? "Inspect the block.",
  [...new Set(item.usage?.avoidWhen.flatMap((entry) => entry.use ?? []).filter((name) => blocks.some((block) => block.name === name)))].join(", ") || "—",
]))
const decisions = {
  Actions: "explicit actions; toggles; related view options",
  Forms: "select, combobox, multi-combobox, multi-input, radio-group and segmented-button decisions; text and numeric entry; files and colors; tokens",
  Dates: "date, range, date-time and time fields; visible calendars; custom pickers",
  Data: "table, data-table, list and tree; object identity, amounts and status; histories and attachments",
  Overlays: "dialog, popover and responsive-popover; commands; value help; view settings and filter personalization; transient feedback",
  Display: "message-strip, toast and illustrated-message; tag and object-status; cards and panels; text, media and progress",
  Navigation: "tabs and segmented-button; destinations, breadcrumbs and product switching; search, filter-bar and saved views; toolbars and guided steps",
  Layout: "page and dynamic-page; object sections; related columns, supplementary context and application navigation",
  Floorplans: "all seven page blocks; nesting and adaptations; launchpad is a navigation scaffold and supplies no app-tile grid",
}
const index = categories.map((category) => `- [${category}](references/${category.toLowerCase()}.md) — ${decisions[category]}.`).join("\n")
let template = readFileSync(join(root, "scripts/skill/SKILL.template.md"), "utf8")
for (const [key, content] of Object.entries({ FLOORPLAN_PICKER: floorplans, REFERENCE_INDEX: index })) template = template.replaceAll(`{{${key}}}`, content)
if (/\{\{[A-Z_]+\}\}/.test(template)) throw new Error("Unresolved skill template placeholder")
// 8000 bytes is below either interpretation of the card's 8 KB budget. Check before writing.
const bytes = Buffer.byteLength(template, "utf8")
if (bytes > 8000) throw new Error(`SKILL.md is ${bytes} bytes; maximum is 8000 bytes (8 KB)`)
generated.set("SKILL.md", template)
generated.set("NOTICE", "petalo usage guidance\n\nGuidance adapted in original wording from SAP/ai-skills-library (Apache-2.0).\nSource: https://github.com/SAP/ai-skills-library/tree/cd0bb455ec68db3f83db94b200546618c32f8ab2/skills/sap-fiori-guidelines\nPinned commit: cd0bb455ec68db3f83db94b200546618c32f8ab2\nCopyright SAP SE and ai-skills-library contributors.\nThe adaptation describes the APIs available in this registry.\n")

// Remove obsolete generated outputs. evals/ is hand-written evidence, owned by the author,
// and must survive every generation (including outputs and their first-attempt notes).
mkdirSync(output, { recursive: true })
function prune(folder, prefix = "") {
  for (const file of readdirSync(folder, { withFileTypes: true })) {
    const relative = prefix + file.name
    const path = join(folder, file.name)
    if (relative === "evals") continue
    if (file.isDirectory() && [...generated.keys()].some((key) => key.startsWith(relative + "/"))) prune(path, relative + "/")
    else if (!generated.has(relative)) rmSync(path, { recursive: true, force: true })
  }
}
prune(output)
for (const [file, content] of generated) {
  mkdirSync(join(output, file, ".."), { recursive: true })
  writeFileSync(join(output, file), content)
}
console.log(`skills/petalo written (${all.length} items, ${categories.length} references, SKILL.md ${bytes} bytes)`)
