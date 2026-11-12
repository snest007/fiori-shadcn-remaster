import type * as React from "react"

export type DemoCategory = "Actions" | "Forms" | "Dates" | "Data" | "Overlays" | "Display" | "Navigation" | "Layout"

export type PropDoc = { name: string; type: string; description: string; defaultValue?: string }
export type ComponentDocs = {
  /** Registry install name. Several entries can share an existing compound demo. */
  name: string
  description: string
  props: PropDoc[]
  /** Existing fixture set when its name differs from the install name. */
  fixtureSet?: string
  /** Canonical case ID for a particular export within a shared fixture set. */
  fixtureId?: string
}

/** Each demo supplies the docs for its Registry entries; the page orders examples by `order`. */
export type Demo = { title: string; order?: number; category: DemoCategory; docs: ComponentDocs[]; Demo: () => React.ReactNode }
export const defineDemo = (d: Demo) => d
