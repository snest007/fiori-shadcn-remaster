import type * as React from "react"

/** docs/src/demos/<component>.tsx default-exports one of these; the docs page lists them by `order`. */
export type Demo = { title: string; order?: number; Demo: () => React.ReactNode }
export const defineDemo = (d: Demo) => d
