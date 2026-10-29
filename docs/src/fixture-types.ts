// Each component has two fixture files:
//   docs/src/fixtures/<component>.tsx     default-exports a FixtureSet (cases + React renderer)
//   docs/src/fixtures/<component>.ui5.ts  default-exports a Ui5Renderer for the same cases
// index.html?fixtures renders the React side, ui5.html the UI5 side (SAP's official implementation,
// kept in a separate file so UI5 never loads into our page). tests/visual.spec.ts screenshots every
// [data-fixture] cell on both pages and diffs them pixel by pixel.
import type * as React from "react"

export type FixtureCase<P = any> = { id: string; props: P }

export type FixtureSet<P = any> = {
  /** Component name, also the prefix of every case id ("button" -> "button-emphasized"). */
  name: string
  cases: FixtureCase<P>[]
  react: (props: P) => React.ReactNode
  /** Max share of differing pixels per cell; default 0.02. Raise only with a comment explaining why. */
  tolerance?: number
  /** Opt out of comparing specific case ids against UI5 (keep them in the docs grid). Explain why. */
  skipCompare?: string[]
}

export const defineFixtures = <P,>(set: FixtureSet<P>) => set

/** Builds the UI5 element for one case. Import the UI5 component modules (and icons) at the top of the file. */
export type Ui5Renderer<P = any> = (props: P) => HTMLElement

export const defineUi5 = <S extends FixtureSet>(_set: S, render: Ui5Renderer<S extends FixtureSet<infer P> ? P : never>) => render

/** Shared width for fields, so inputs/selects are the same width on both pages. */
export const FIELD_WIDTH = "13.125rem"

/** Helper for the ui5 renderer: create an element with attributes (true -> boolean attribute) and children. */
export function h(tag: string, attrs: Record<string, string | boolean | undefined | null> = {}, ...children: (Node | string)[]) {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v === true) el.setAttribute(k, "")
    else if (v !== false && v != null) el.setAttribute(k, v)
  }
  el.append(...children)
  return el
}

export type PageOptions = { theme: string; density: "cozy" | "compact"; only?: string }

export function readPageOptions(): PageOptions {
  const q = new URLSearchParams(location.search)
  return {
    theme: q.get("theme") ?? "sap_horizon",
    density: q.get("density") === "compact" ? "compact" : "cozy",
    only: q.get("only") ?? undefined,
  }
}
