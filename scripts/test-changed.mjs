#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"

const files = execFileSync("git", ["diff", "--name-only", "-z", "main...HEAD"], { encoding: "utf8" }).split("\0").filter(Boolean)
if (!files.length) {
  console.log("No committed changes compared with main.")
  process.exit(0)
}
const names = new Set()
const specs = new Set()
const shared = []
for (const file of files) {
  // AGENTS.md rule 3: all eight component-owned paths have the same basename.
  const owned = file.match(/^registry\/(?:ui\/([^/]+)\.tsx|items\/([^/]+)\.json|styles\/components\/([^/]+)\.css)$/)
    ?? file.match(/^docs\/src\/(?:fixtures|demos)\/([^/]+)\.(?:tsx|ui5\.ts)$/)
    ?? file.match(/^docs\/stories\/[^/]+\/([^/]+)\.stories\.tsx$/)
  if (owned) names.add(owned.slice(1).find(Boolean))
  else if (/^tests\/(?!visual)[^/]+\.spec\.ts$/.test(file)) specs.add(file)
  else shared.push(file)
}
if (shared.length) {
  shared.forEach((file) => console.error(`shared file changed: run the full suite (${file})`))
  process.exit(1)
}
const visualSpecs = new Set()
const interactionSource = readFileSync("tests/visual-interaction.spec.ts", "utf8")
for (const name of names) {
  const spec = `tests/${name}.spec.ts`
  if (existsSync(spec)) specs.add(spec)
  else {
    console.log(`${name} has no own spec; running only its visual fixtures.`)
    // Absence of a behaviour spec must never request a full-suite fallback.
    // The visual guard reports a component with no comparable fixtures clearly.
    visualSpecs.add("tests/visual.spec.ts")
  }
  if (existsSync(`docs/src/fixtures/${name}.tsx`) && existsSync(`docs/src/fixtures/${name}.ui5.ts`)) visualSpecs.add("tests/visual.spec.ts")
  if (existsSync(`docs/src/fixtures-sapui5/${name}.tsx`)) visualSpecs.add("tests/visual-sapui5.spec.ts")
  if (existsSync(`docs/src/fixtures-phone/${name}.tsx`)) visualSpecs.add("tests/visual-phone.spec.ts")
  // Interaction CASES include literal ids and generated `<name>-` prefixes.
  if (interactionSource.includes(`"${name}-`) || interactionSource.includes(`"${name}"`)) visualSpecs.add("tests/visual-interaction.spec.ts")
}
const args = [...specs, ...visualSpecs]
if (!args.length) {
  console.error("No affected specs or paired visual fixtures found: run the full suite.")
  process.exit(1)
}
console.log(`Affected specs: ${args.join(", ")}${names.size ? ` | VISUAL_ONLY=${[...names].join(",")}` : ""}`)
const env = { ...process.env }
delete env.VISUAL_ONLY
if (names.size) env.VISUAL_ONLY = [...names].join(",")
const result = spawnSync("pnpm", ["test:summary", ...args, ...process.argv.slice(2)], {
  stdio: "inherit",
  env,
})
if (result.error) console.error(result.error.message)
process.exitCode = result.status ?? 1
