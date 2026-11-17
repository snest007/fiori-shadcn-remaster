// One metadata source feeds the registry, docs and skill. TypeScript is already a dev dependency.
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import ts from "typescript"

export const categories = ["Actions", "Forms", "Dates", "Data", "Overlays", "Display", "Navigation", "Layout", "Floorplans"]
export const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0
export const json = (path) => JSON.parse(readFileSync(path, "utf8"))
export const itemMetadata = (folder) => readdirSync(folder).filter((name) => name.endsWith(".json")).sort(compare)
  .map((file) => ({ ...json(join(folder, file)), name: file.slice(0, -5) }))

// The existing icons library also ships a React component. Share its actual file ownership with
// both generators so layouts can name any parsed export, including Icon, via @fiori/icons.
export const iconsItem = {
  name: "icons",
  type: "registry:lib",
  title: "SAP Horizon icons",
  description: "704 SAP Horizon icons (tree-shakeable) and the <Icon> component.",
  registryDependencies: ["@fiori/fiori-theme"],
  files: [
    { path: "registry/lib/fiori-icons.ts", type: "registry:lib" },
    { path: "registry/ui/icon.tsx", type: "registry:ui" },
  ],
}

/** Parse public runtime exports, including aliases and direct export declarations; omit TS-only types. */
export function runtimeExports(path) {
  const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const names = new Set()
  for (const node of source.statements) {
    if (ts.isExportDeclaration(node) && !node.isTypeOnly && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const specifier of node.exportClause.elements) if (!specifier.isTypeOnly) names.add(specifier.name.text)
    } else if (node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
        if (node.name) names.add(node.name.text)
      } else if (ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations) if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text)
      }
    }
  }
  return [...names].sort(compare)
}

const property = (object, name) => object.properties.find((node) => ts.isPropertyAssignment(node) && node.name?.getText().replace(/^['"]|['"]$/g, "") === name)?.initializer
const literal = (node) => node && ts.isStringLiteralLike(node) ? node.text : undefined

/** Read defineDemo({ category, docs: [{ name, ... }] }); compound demos can document several items. */
export function demoCategories(root, documented = new Map()) {
  const result = new Map()
  const folder = join(root, "docs/src/demos")
  for (const file of readdirSync(folder).filter((file) => file.endsWith(".tsx")).sort(compare)) {
    const path = join(folder, file)
    const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const visit = (node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "defineDemo") {
        const config = node.arguments[0]
        if (!config || !ts.isObjectLiteralExpression(config)) throw new Error(`${file}: defineDemo must use literal metadata`)
        const category = literal(property(config, "category"))
        const docs = property(config, "docs")
        if (!categories.slice(0, -1).includes(category) || !docs || !ts.isArrayLiteralExpression(docs)) throw new Error(`${file}: missing literal category/docs`)
        for (const entry of docs.elements) {
          const name = ts.isObjectLiteralExpression(entry) && literal(property(entry, "name"))
          if (!name) throw new Error(`${file}: docs entry needs a literal name`)
          if (result.has(name) && result.get(name) !== category) throw new Error(`${name}: inconsistent demo categories`)
          result.set(name, category)
          const names = documented.get(name) ?? new Set()
          const props = property(entry, "props")
          if (props && ts.isArrayLiteralExpression(props)) for (const prop of props.elements) {
            const text = ts.isObjectLiteralExpression(prop) && literal(property(prop, "name"))
            for (const match of text?.matchAll(/\b([A-Za-z_$][\w$]*)(?=\.|\()/g) ?? []) names.add(match[1])
          }
          documented.set(name, names)
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  return result
}

/** Main exports are consumer composition APIs, not every runtime symbol. Demo prop prefixes
 * explicitly document hooks/helpers; public API JSDoc also documents helpers (e.g. typed column
 * helpers). Contexts and undocumented hooks/lowercase helpers, source-only UI5 port comments,
 * and exports marked shared/internal are excluded. Runtime ownership remains unfiltered. */
export function mainExports(path, documented = new Set()) {
  const text = readFileSync(path, "utf8")
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const internal = new Set()
  const apiDocs = new Set(documented)
  for (const node of source.statements) {
    const names = ts.isVariableStatement(node) ? node.declarationList.declarations.map((d) => d.name?.text) : [node.name?.text]
    const doc = (node.jsDoc ?? []).map((d) => d.getText(source)).join(" ")
    if (doc && !/\.js\b|internal|not (?:meant|intended) for|shared with/i.test(doc)) for (const name of names) if (name && !/^use[A-Z]/.test(name)) apiDocs.add(name)
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      let shared = false
      for (const specifier of node.exportClause.elements) {
        if (/not meant for direct use|internal exports|@internal/i.test(specifier.getFullText(source))) shared = true
        if (shared) internal.add(specifier.name.text)
      }
    }
  }
  return runtimeExports(path).filter((name) => !/Context$/.test(name) && !internal.has(name)
    && (documented.has(name) || (!/^use[A-Z]/.test(name) && !/StateProvider$/.test(name) && (/^[A-Z]/.test(name) || apiDocs.has(name)))))
}

/** Map exported React names to owning registry items, rather than guessing PascalCase → kebab-case. */
export function componentOwners(root, items) {
  const owners = new Map()
  for (const item of items) {
    const files = new Set([
      ...((item.type ?? "registry:ui") === "registry:ui" ? [`registry/ui/${item.name}.tsx`] : []),
      ...(item.type === "registry:block" ? [`registry/blocks/${item.name}.tsx`] : []),
      ...(item.files ?? []).filter((file) => file.type === "registry:ui").map((file) => file.path),
    ])
    for (const name of [...files].flatMap((file) => runtimeExports(join(root, file))).filter((name) => /^[A-Z]/.test(name))) {
      if (!owners.has(name)) owners.set(name, new Set())
      owners.get(name).add(item.name)
    }
  }
  return owners
}

const nonempty = (value) => typeof value === "string" && value.trim().length > 0
function stringList(item, key, values, min, max = Infinity) {
  if (!Array.isArray(values) || values.length < min || values.length > max || values.some((value) => !nonempty(value))) {
    throw new Error(`${item.name}: usage.${key} must contain ${min}–${max === Infinity ? "many" : max} nonempty strings`)
  }
}

export function validateUsage(items, owners, { requireUsage = false } = {}) {
  const names = new Set(items.map((item) => item.name))
  for (const item of items) {
    const usage = Object.hasOwn(item, "usage") ? item.usage : item.meta?.usage
    if (usage === undefined) {
      if (requireUsage && ["registry:ui", "registry:block"].includes(item.type)) throw new Error(`${item.name}: missing usage (--require-usage)`)
      continue
    }
    if (!usage || typeof usage !== "object" || Array.isArray(usage)) throw new Error(`${item.name}: usage must be an object`)
    if (!nonempty(usage.summary)) throw new Error(`${item.name}: usage.summary is required`)
    if (!["sap-fiori-guidelines", "ui5-apidoc"].includes(usage.source)) throw new Error(`${item.name}: invalid usage.source`)
    stringList(item, "useWhen", usage.useWhen, 2, 5)
    if (!Array.isArray(usage.avoidWhen) || usage.avoidWhen.length < 1 || usage.avoidWhen.length > 5) throw new Error(`${item.name}: usage.avoidWhen must contain 1–5 entries`)
    for (const entry of usage.avoidWhen) {
      if (!entry || !nonempty(entry.when) || (entry.use !== undefined && (!Array.isArray(entry.use) || entry.use.some((name) => !nonempty(name))))) throw new Error(`${item.name}: invalid usage.avoidWhen entry`)
      for (const name of entry.use ?? []) if (!names.has(name)) throw new Error(`${item.name}: unknown usage alternative "${name}"`)
    }
    if (item.type === "registry:block") {
      stringList(item, "layout", usage.layout, 1)
      const dependencies = new Set((item.registryDependencies ?? []).map((name) => name.replace(/^@fiori\//, "")))
      // Layout prose/region labels stay lowercase; capitalized words must be actual React export names.
      for (const line of usage.layout) for (const name of line.match(/\b[A-Z][A-Za-z0-9]*\b/g) ?? []) {
        if (!owners.has(name)) throw new Error(`${item.name}: unknown layout export "${name}"`)
        if (![...owners.get(name)].some((owner) => dependencies.has(owner))) throw new Error(`${item.name}: layout export "${name}" needs a direct registryDependency`)
      }
      if (usage.variations !== undefined) stringList(item, "variations", usage.variations, 1)
    } else if (usage.layout !== undefined || usage.variations !== undefined) {
      throw new Error(`${item.name}: usage.layout/variations are for blocks only`)
    }
  }
}

export const alternativeLinks = (entry) => (entry.use ?? []).map((name) => `[${name}](#/${name})`).join(", ")
export function usageMarkdown(usage) {
  const sections = [usage.summary, "### Use when\n\n" + usage.useWhen.map((text) => `- ${text}`).join("\n"),
    "### Don't use when\n\n" + usage.avoidWhen.map((entry) => `- ${entry.when}${entry.use?.length ? ` → ${alternativeLinks(entry)}` : ""}`).join("\n")]
  if (usage.layout) sections.push("### Layout\n\n```text\n" + usage.layout.join("\n") + "\n```")
  if (usage.variations) sections.push("### Variations\n\n" + usage.variations.map((text) => `- ${text}`).join("\n"))
  return sections.join("\n\n")
}
