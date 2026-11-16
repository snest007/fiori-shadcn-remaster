import { readdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import type { Plugin } from "vite"
import { readComponentDocumentation } from "./component-metadata"

const demos = fileURLToPath(new URL("../docs/src/demos/", import.meta.url))
const items = fileURLToPath(new URL("../registry/items/", import.meta.url))
const property = (node: ts.ObjectLiteralExpression, name: string) => node.properties.find(
  (p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && p.name.getText().replace(/["']/g, "") === name
)?.initializer
const string = (node?: ts.Node) => node && ts.isStringLiteral(node) ? node.text : undefined
const object = (node?: ts.Node) => node && ts.isObjectLiteralExpression(node) ? node : undefined

/** Read literals with TypeScript's parser: never evaluate or bundle the demo/fixture modules. */
export function readDemoMetadata() {
  const metadata: Record<string, { category: string; title: string; props: { name: string; type: string; description: string; defaultValue?: string }[] }> = {}
  for (const file of readdirSync(demos).filter((file) => file.endsWith(".tsx")).sort()) {
    const source = ts.createSourceFile(file, readFileSync(`${demos}/${file}`, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && node.expression.getText(source) === "defineDemo") {
        const demo = object(node.arguments[0])
        if (demo) {
          const category = string(property(demo, "category"))
          const docs = property(demo, "docs")
          if (!category || !docs || !ts.isArrayLiteralExpression(docs)) throw new Error(`Non-literal docs metadata in ${file}`)
          for (const entry of docs.elements) {
            const doc = object(entry)
            if (!doc) throw new Error(`Non-literal docs entry in ${file}`)
            const name = string(property(doc, "name"))
            const props = property(doc, "props")
            if (!name || !props || !ts.isArrayLiteralExpression(props)) throw new Error(`Missing item metadata in ${file}`)
            const title = JSON.parse(readFileSync(`${items}/${name}.json`, "utf8")).title as string
            const result: (typeof metadata)[string] = metadata[name] ??= { category, title, props: [] }
            if (result.category !== category) throw new Error(`Conflicting category for ${name}`)
            for (const entry of props.elements) {
              const prop = object(entry)
              if (!prop) throw new Error(`Non-literal prop metadata in ${file}`)
              const name = string(property(prop, "name")), type = string(property(prop, "type")), description = string(property(prop, "description"))
              if (!name || !type || !description) throw new Error(`Incomplete prop metadata in ${file}`)
              const value = { name, type, description, defaultValue: string(property(prop, "defaultValue")) }
              const previous = result.props.findIndex((p) => p.name === name)
              if (previous < 0) result.props.push(value)
              else result.props[previous] = value
            }
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  const source = ts.createSourceFile("types.ts", readFileSync(`${demos}/types.ts`, "utf8"), ts.ScriptTarget.Latest, true)
  const categoryType = source.statements.find((node): node is ts.TypeAliasDeclaration => ts.isTypeAliasDeclaration(node) && node.name.text === "DemoCategory")
  if (!categoryType || !ts.isUnionTypeNode(categoryType.type)) throw new Error("DemoCategory must be a literal union")
  const categories = categoryType.type.types.map((type) => ts.isLiteralTypeNode(type) ? string(type.literal) : undefined)
  if (categories.some((category) => !category)) throw new Error("DemoCategory must contain string literals")
  return { metadata, categories: categories as string[], documentation: Object.fromEntries(Object.entries(metadata).map(([name, item]) => [name, readComponentDocumentation(name, item.title)])) }
}

export function storyItemOptions(file: string) {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let result: { name?: string; category?: string; title?: string } = {}
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && node.expression.getText(source) === "fioriMeta") {
      const options = object(node.arguments[0])
      if (options) result = { name: string(property(options, "name")), category: string(property(options, "category")), title: string(property(options, "title")) }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return result
}

export function demoMetadataPlugin(): Plugin {
  const id = "virtual:fiori-demo-metadata"
  return {
    name: "fiori-demo-metadata",
    resolveId: (source) => source === id ? `\0${id}` : undefined,
    load: (source) => source === `\0${id}` ? `export default ${JSON.stringify(readDemoMetadata())}` : undefined,
    handleHotUpdate(context) {
      if (context.file.startsWith(demos) || context.file.startsWith(items) || context.file.includes("/registry/ui/") || context.file.endsWith("/docs/plan/a11y-audit.md")) {
        const module = context.server.moduleGraph.getModuleById(`\0${id}`)
        if (module) context.server.moduleGraph.invalidateModule(module)
        context.server.ws.send({ type: "full-reload" })
      }
    },
  }
}
