// Audit the installed pinned sources, including fixture-registered items and rendered subcomponents.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve, relative } from 'node:path'
import { createHash } from 'node:crypto'
import ts from 'typescript'
const packages = ['webcomponents', 'webcomponents-fiori']
const defaults = {}, sourceHashes = {}
for (const pkg of packages) {
  const file = `node_modules/@ui5/${pkg}/dist/generated/i18n/i18n-defaults.js`
  for (const match of readFileSync(file, 'utf8').matchAll(/const (\w+) = \{ key: "([^"]+)", defaultText: ("(?:[^"\\]|\\.)*") \}/g)) defaults[match[2]] = JSON.parse(match[3])
  // A small number of pinned native getters use getText("KEY") instead of an imported constant.
  const bundle = JSON.parse(readFileSync(`node_modules/@ui5/${pkg}/dist/generated/assets/i18n/messagebundle_en.json`, 'utf8'))
  for (const [key, value] of Object.entries(bundle)) defaults[key] ??= value
}
export function properties(text) {
  const table = {}
  // Java resource properties: continuation lines, Unicode, newline and escaped separators.
  const lines = text.replace(/\\\r?\n\s*/g, '').split(/\r?\n/)
  for (const line of lines) {
    const m = line.match(/^([^#!\s][^=]*)=(.*)$/)
    if (m) table[m[1]] = m[2].replace(/\\u([a-f0-9]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\([=:!# \\])/g, '$1')
  }
  return table
}
const openBundles = {}
for (const pkg of ['sap.m', 'sap.ui.mdc', 'sap.ui.core', 'sap.ui.layout', 'sap.ui.fl']) {
  const file = `node_modules/@openui5/${pkg}/src/${pkg.replaceAll('.', '/')}/messagebundle.properties`
  openBundles[pkg] = properties(readFileSync(file, 'utf8'))
  Object.assign(defaults, openBundles[pkg])
}
const scan = (file, seen = new Set()) => {
  if (!existsSync(file) || seen.has(resolve(file))) return []
  seen.add(resolve(file))
  const text = readFileSync(file, 'utf8')
  sourceHashes[relative(process.cwd(), file)] = createHash('sha256').update(text).digest('hex')
  const keys = [...text.matchAll(/import\s*\{([^}]+)\}\s*from\s*["'].*?generated\/i18n\/i18n-defaults\.js["']/g)].flatMap(m => m[1].split(',').map(k => k.trim()).filter(Boolean))
  keys.push(...[...text.matchAll(/i18nBundle\.getText\("([^"]+)"/g)].map(match => match[1]))
  for (const m of text.matchAll(/from\s*["'](\.\/[^"']+\.js)["']/g)) {
    const next = resolve(dirname(file), m[1])
    if (existsSync(next) && (/Template\.js$/.test(next) || /class.*extends /.test(readFileSync(next, 'utf8')))) keys.push(...scan(next, seen))
  }
  return [...new Set(keys)].sort()
}
const aliases = { checkbox: 'CheckBox', combobox: 'ComboBox', 'multi-combobox': 'MultiComboBox', 'data-table': 'Table', textarea: 'TextArea', tabs: 'TabContainer', 'radio-group': 'RadioButton', 'picker-field': 'Input' }
const nativeKeys = name => {
  const native = aliases[name] ?? name.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('')
  const sources = packages.flatMap(pkg => existsSync(`node_modules/@ui5/${pkg}/dist/${native}.js`) ? [`node_modules/@ui5/${pkg}/dist/${native}.js`] : [])
  if (name === 'illustrated-message') sources.push(...readdirSync('node_modules/@ui5/webcomponents-fiori/dist/illustrations').filter(file => file.endsWith('.js')).map(file => `node_modules/@ui5/webcomponents-fiori/dist/illustrations/${file}`))
  // Public subcomponents owned by the same registry item; fixture wrapper imports are not audit roots.
  const children = { card: ['CardHeader'], calendar: ['CalendarLegend', 'CalendarLegendItem'], table: ['TableHeaderRow','TableHeaderCell','TableRow','TableCell','TableGroupRow','TableSelectionMulti','TableSelectionSingle','TableGrowing','TableRowAction','TableRowActionNavigation'], list: ['ListItemStandard','ListItemCustom','ListItemGroup'], tree: ['TreeItem'], 'notification-list': ['NotificationListItem','NotificationListGroupItem'], 'upload-collection': ['UploadCollectionItem'], tabs: ['Tab','TabSeparator'], menu: ['MenuItem','MenuItemGroup'], tokenizer: ['Token'] }
  for (const child of children[name] ?? []) for (const pkg of packages) if (existsSync(`node_modules/@ui5/${pkg}/dist/${child}.js`)) sources.push(`node_modules/@ui5/${pkg}/dist/${child}.js`)
  const keys = sources.flatMap(file => scan(file))
  if (name === 'variant-management') keys.push(...Object.keys(openBundles['sap.m']).filter(k => k.startsWith('VARIANT_MANAGEMENT_')))
  if (name === 'filter-bar' || name === 'adapt-filters-dialog') keys.push(...Object.keys(openBundles['sap.ui.mdc']).filter(k => /^(filterbar|adaptFiltersPanel|p13nDialog)\./.test(k)))
  if (name === 'adapt-filters-dialog') keys.push(...Object.keys(openBundles['sap.m']).filter(k => /^p13n\./.test(k)))
  if (name === 'value-help-dialog') keys.push(...Object.keys(openBundles['sap.ui.mdc']).filter(k => /^valuehelp\./.test(k)))
  // These controls have no Web Component: inspect their owning OpenUI5 JS/renderer, not a guessed key family.
  const openControls = { 'object-number': 'ObjectNumber', 'object-status': 'ObjectStatus', 'object-identifier': 'ObjectIdentifier' }
  if (openControls[name]) {
    for (const suffix of ['', 'Renderer']) {
      const file = `node_modules/@openui5/sap.m/src/sap/m/${openControls[name]}${suffix}.js`
      const source = readFileSync(file, 'utf8')
      sourceHashes[file] = createHash('sha256').update(source).digest('hex')
      keys.push(...[...source.matchAll(/getText\("([^"]+)"\)/g)].map(match => match[1]))
    }
    if (name === 'object-number') keys.push(...Object.keys(openBundles['sap.m']).filter(key => key.startsWith('OBJECTNUMBER_ARIA_VALUE_STATE_')))
    if (name === 'object-status') {
      for (const file of ['ValueStateSupport', 'IndicationColorSupport']) {
        const path = `node_modules/@openui5/sap.ui.core/src/sap/ui/core/${file}.js`
        const source = readFileSync(path, 'utf8')
        sourceHashes[path] = createHash('sha256').update(source).digest('hex')
        keys.push(...[...source.matchAll(/getText\("([^"]+)"\)/g)].map(match => match[1]))
      }
    }
  }
  return [...new Set(keys)].sort()
}
const shipped = readdirSync('registry/ui').filter(file => file.endsWith('.tsx')).map(file => file.slice(0, -4)).sort()
const resolutions = {}
for (const name of shipped) {
  const file = `registry/ui/${name}.tsx`, source = readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const rows = {}
  const usedMappings = new Set()
  const translatedOutputs = new Map()
  // A returned text hook (Input.useValueStateTexts) still owns a map when its caller consumes the translated output.
  const hookMappings = new Map()
  function findHooks(node) {
    if (ts.isFunctionDeclaration(node) && node.name && node.body) {
      function body(part) {
        if (ts.isReturnStatement(part) && part.expression && ts.isCallExpression(part.expression) && part.expression.expression.getText(sf) === 'useFioriTexts') {
          hookMappings.set(node.name.text, part.expression.arguments[1]?.getText(sf))
        }
        ts.forEachChild(part, body)
      }
      body(node.body)
    }
    ts.forEachChild(node, findHooks)
  }
  findHooks(sf)
  function findOwners(node) {
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer)) {
      const call = node.initializer, callee = call.expression.getText(sf)
      const mapping = callee === 'useFioriTexts' ? call.arguments[1]?.getText(sf) : hookMappings.get(callee)
      if (mapping) { usedMappings.add(mapping); translatedOutputs.set(mapping, node.name.getText(sf)) }
    }
    if (ts.isCallExpression(node) && /^(t|translate)$/.test(node.expression.getText(sf))) {
      for (const match of (node.arguments[0]?.getText(sf) ?? '').matchAll(/\b(\w+Keys)\b/g)) usedMappings.add(match[1])
    }
    ts.forEachChild(node, findOwners)
  }
  findOwners(sf)
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(sf) === 't' && !source.includes('const t = (key: TextKey')) {
      // Conditional singular/plural keys still pass to the actual provider translator.
      function keyArgument(argument) {
        if (!argument) return
        if (ts.isStringLiteral(argument) && argument.text in defaults) rows[argument.text] = `${name}: owning t() text expression`
        else if (ts.isConditionalExpression(argument)) { keyArgument(argument.whenTrue); keyArgument(argument.whenFalse) }
        else if (ts.isParenthesizedExpression(argument)) keyArgument(argument.expression)
      }
      keyArgument(node.arguments[0])
    }
    if (ts.isVariableDeclaration(node) && usedMappings.has(node.name.getText(sf))) {
      const init = node.initializer && (ts.isAsExpression(node.initializer) ? node.initializer.expression : node.initializer)
      function object(n, path = []) { if (!n || !ts.isObjectLiteralExpression(n)) return; for (const prop of n.properties) if (ts.isPropertyAssignment(prop)) { const p = [...path, prop.name.getText(sf).replace(/^['"]|['"]$/g, '')]; if (ts.isStringLiteral(prop.initializer)) {
        const output = translatedOutputs.get(node.name.getText(sf))
        // Registering an unused map is not a text owner. Require use of the translated output.
        const usedOutput = !output || source.includes(`${output}.${p[0]}`) || source.includes(`${output}[`)
        if (usedOutput) rows[prop.initializer.text] = `${name}: texts/labels.${p.join('.')}`
      } else object(prop.initializer, p) } }
      object(init)
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  resolutions[name] = { source, rows, imports: [...source.matchAll(/from "@\/components\/ui\/([^"/]+)"/g)].map(m => m[1]) }
}
function resolveKey(name, key, seen = new Set()) {
  if (seen.has(name)) return undefined
  seen.add(name)
  const owner = resolutions[name]
  if (!owner) return undefined
  if (owner.rows[key]) return owner.rows[key]
  for (const next of owner.imports) { const result = resolveKey(next, key, seen); if (result) return `delegated ${result}` }
}
const audit = shipped.map(component => ({ component, rows: [...new Set([...nativeKeys(component), ...Object.keys(resolutions[component].rows).filter(key => key in defaults)])].sort().map(key => ({ key, english: defaults[key] ?? '', property: resolveKey(component, key) ?? 'No implemented provider/override text owner', status: resolveKey(component, key) ? 'fixed in E5' : 'gap' })) }))
const escape = s => String(s).replaceAll('|', '\\|').replaceAll('\n', '<br>')
const all = audit.flatMap(group => group.rows), keys = [...new Set(all.map(row => row.key))].sort()
const markdown = '# UI5 localization audit\n\nGenerated by `node scripts/i18n-audit.mjs` from installed UI5 Web Components 2.28.1 and OpenUI5 1.154.0. Every native imported key is retained, including rendered subcomponents and the OpenUI5 library key families required by E5. `gap` means no actual translated render/announcement owner exists; it is never counted as fixed by an unused prop.\n\nPinned-source drift: StepInput delegates to NumericInput in 2.28.1 and uses `NUMBERINPUT_*`, rather than the card example’s earlier `STEPINPUT_*`.\n\n' + audit.map(group => `## ${group.component}\n\n| UI5 key | English text | React property / owner | Status |\n| --- | --- | --- | --- |\n` + group.rows.map(row => `| ${escape(row.key)} | ${escape(row.english)} | ${escape(row.property)} | ${row.status} |`).join('\n') + '\n').join('\n')
writeFileSync('docs/plan/i18n-audit.md', markdown)
mkdirSync('.integration/E5-evidence', { recursive: true })
writeFileSync('.integration/E5-evidence/audit.json', JSON.stringify({ audit, keys, sourceHashes }, null, 2) + '\n')
console.log(`i18n audit: ${shipped.length} components, ${keys.length} unique keys, ${all.length} rows, ${all.filter(row => row.status === 'gap').length} gaps`)
export { audit, keys, defaults }
