import ts from "typescript"
import type { Plugin } from "vite"

const unwrap = (node: ts.Expression): ts.Expression => ts.isSatisfiesExpression(node) || ts.isAsExpression(node) ? unwrap(node.expression) : node
const property = (node: ts.ObjectLiteralExpression, name: string) => node.properties.find(
  (p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && p.name.getText().replace(/["']/g, "") === name
)?.initializer

/** CSF's default source is an args object. Surface the actual JSX function and its args instead. */
export function storySourcePlugin(): Plugin {
  return {
    name: "fiori-story-jsx-source",
    enforce: "pre",
    transform(code, id) {
      if (!id.endsWith(".stories.tsx")) return
      const source = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
      const declarations = source.statements.flatMap((statement) => ts.isVariableStatement(statement) ? statement.declarationList.declarations.map((declaration) => ({ statement, declaration })) : [])
      const meta = declarations.find(({ declaration }) => declaration.name.getText(source) === "meta")?.declaration.initializer
      const options = meta && unwrap(meta)
      if (!options || !ts.isObjectLiteralExpression(options)) return
      const defaultArgs = property(options, "args")?.getText(source) ?? "{}"
      const defaultRender = property(options, "render")
      // Preserve example imports, data, column definitions and local types; omit metadata plumbing.
      const prelude = source.statements.filter((statement) => statement.end < options.pos && !statement.getText(source).includes("fioriMeta") && !statement.getText(source).includes("fioriArgTypes") && !statement.getText(source).includes("/_lib/") && !statement.getText(source).includes('type Story =')).map((statement) => statement.getText(source)).join("\n")
      const additions: string[] = []
      for (const { statement, declaration } of declarations) {
        if (!statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) || !declaration.initializer) continue
        const story = unwrap(declaration.initializer)
        if (!ts.isObjectLiteralExpression(story)) continue
        const render = property(story, "render") ?? defaultRender
        if (!render) continue
        const name = declaration.name.getText(source)
        const args = property(story, "args")?.getText(source)
        const snippet = `${prelude}\n\nconst args = ${args ? `{ ...${defaultArgs}, ...${args} }` : defaultArgs}\n\nconst Example = ${render.getText(source)}\n`
        additions.push(`${name}.parameters = { ...${name}.parameters, docs: { ...${name}.parameters?.docs, source: { ...${name}.parameters?.docs?.source, type: "code", code: ${JSON.stringify(snippet)} } } };`)
      }
      return { code: `${code}\n${additions.join("\n")}`, map: null }
    },
  }
}
