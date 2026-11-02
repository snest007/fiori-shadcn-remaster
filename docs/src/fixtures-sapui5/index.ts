import type { FixtureSet } from "../fixture-types"

// A separate oracle: these controls are rendered by OpenUI5, never by UI5 Web Components.
const modules = import.meta.glob<{ default: FixtureSet }>("./*.tsx", { eager: true })
export const sapui5FixtureSets: FixtureSet[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.name.localeCompare(b.name))
