import { existsSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const ui = fileURLToPath(new URL("../registry/ui/", import.meta.url))
const auditFile = fileURLToPath(new URL("../docs/plan/a11y-audit.md", import.meta.url))
const defaultsFile = fileURLToPath(new URL("../node_modules/@ui5/webcomponents/dist/generated/i18n/i18n-defaults.js", import.meta.url))
const parse = (file: string) => ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.JS)
const text = (node: ts.Node | undefined) => node && ts.isStringLiteralLike(node) ? node.text : undefined
const field = (node: ts.ObjectLiteralExpression, name: string) => node.properties.find((p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && p.name.getText().replace(/["']/g, "") === name)?.initializer
const nativeTexts = parse(defaultsFile).statements.flatMap((statement) => ts.isVariableStatement(statement) ? [...statement.declarationList.declarations] : [])
  .flatMap((declaration) => {
    const value = declaration.initializer
    if (!value || !ts.isObjectLiteralExpression(value)) return []
    const key = text(field(value, "key")), defaultText = text(field(value, "defaultText"))
    return key && defaultText !== undefined ? [{ key, defaultText }] : []
  })

// Identify public text objects, not their values: defaults are always parsed from the owning source.
const sources: Record<string, { file: string; object: string; prop: string }[]> = {
  input: [{ file: "input", object: "valueStateDefaultText", prop: "valueStateMessage" }],
  select: [{ file: "input", object: "valueStateDefaultText", prop: "SelectTrigger.valueStateMessage" }],
  calendar: [{ file: "calendar", object: "defaultLabels", prop: "labels" }],
  "data-table": [{ file: "data-table", object: "defaultDataTableTexts", prop: "dataTableTexts" }, { file: "table", object: "defaultTableTexts", prop: "texts" }],
  dialog: [{ file: "dialog", object: "defaultMovementTexts", prop: "movementTexts" }],
}
const prefixes: Record<string, string[]> = {
  input: ["VALUE_STATE_"], select: ["SELECT_", "VALUE_STATE_"], calendar: ["CALENDAR_", "DAY_PICKER_", "MONTH_PICKER_", "YEAR_PICKER_", "YEAR_RANGE_PICKER_", "CAL_LEGEND_"],
  "data-table": ["TABLE_", "CHECKBOX_", "ACC_STATE_", "LABEL_"], dialog: ["DIALOG_"],
}

export interface ComponentDocumentation {
  accessibility: string[]
  audit?: string
  textKeys: { prop: string; key: string; defaultText: string; ui5Keys: string[] }[]
}

function defaultText(node: ts.Expression): string | undefined {
  if (ts.isStringLiteralLike(node)) return node.text
  if (!ts.isArrowFunction(node) || !ts.isTemplateExpression(node.body)) return undefined
  const params = node.parameters.map((parameter) => parameter.name.getText())
  return node.body.head.text + node.body.templateSpans.map((span) => {
    const index = params.indexOf(span.expression.getText())
    return `${index < 0 ? span.expression.getText() : `{${index}}`}${span.literal.text}`
  }).join("")
}

/** Static JSDoc/default extraction keeps stories independent of fixtures and demos. */
export function readComponentDocumentation(name: string, title: string): ComponentDocumentation {
  const file = `${ui}/${name}.tsx`
  const result: ComponentDocumentation = { accessibility: [], textKeys: [] }
  if (!existsSync(file)) return result
  const source = parse(file)
  const addText = (prop: string, key: string, value: string) => {
    const matches = nativeTexts.filter((entry) => entry.defaultText === value)
    const preferred = matches.filter((entry) => (prefixes[name] ?? []).some((prefix) => entry.key.startsWith(prefix)))
    result.textKeys.push({ prop, key, defaultText: value, ui5Keys: (preferred.length ? preferred : matches).map((entry) => entry.key) })
  }
  const visit = (node: ts.Node) => {
    for (const tag of ts.getJSDocTags(node)) {
      if (tag.tagName.text === "accessibility") {
        const comment = typeof tag.comment === "string" ? tag.comment : tag.comment?.map((part) => part.text).join("")
        if (comment && !result.accessibility.includes(comment)) result.accessibility.push(comment)
      }
    }
    if (name === "select" && ts.isBindingElement(node) && ["dialogTitle", "cancelText", "dialogNamePrefix"].includes(node.name.getText())) {
      const value = text(node.initializer)
      if (value) addText("SelectContent", node.name.getText(), value)
    }
    if (name === "select" && ts.isObjectLiteralExpression(node) && node.properties.length === 4) {
      for (const property of node.properties) {
        if (ts.isPropertyAssignment(property)) {
          const value = text(property.initializer)
          if (value?.startsWith("Value State ")) addText("SelectTrigger.valueStateTypeText", property.name.getText(), value)
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  for (const descriptor of sources[name] ?? []) {
    const owner = parse(`${ui}/${descriptor.file}.tsx`)
    for (const statement of owner.statements) {
      if (!ts.isVariableStatement(statement)) continue
      for (const declaration of statement.declarationList.declarations) {
        if (declaration.name.getText(owner) !== descriptor.object || !declaration.initializer || !ts.isObjectLiteralExpression(declaration.initializer)) continue
        for (const property of declaration.initializer.properties) {
          if (!ts.isPropertyAssignment(property)) continue
          const value = defaultText(property.initializer)
          if (value !== undefined) addText(descriptor.prop, property.name.getText(owner), value)
        }
      }
    }
  }
  if (existsSync(auditFile)) {
    const audit = readFileSync(auditFile, "utf8")
    const sections = [...audit.matchAll(/^(#{1,6})\s+(.+)$/gm)]
    const index = sections.findIndex((section) => [name, title].some((label) => section[2].toLowerCase().includes(label.toLowerCase())))
    if (index >= 0) {
      const heading = sections[index]
      const next = sections.slice(index + 1).find((section) => section[1].length <= heading[1].length)
      result.audit = audit.slice(heading.index! + heading[0].length, next?.index).trim()
    }
  }
  return result
}
