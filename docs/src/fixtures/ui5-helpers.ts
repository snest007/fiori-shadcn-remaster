// Shared helpers for *.ui5.ts fixture renderers.

/** "negative" -> "Negative"; "none"/undefined -> undefined (attribute omitted). */
export const ui5State = (s?: string) => (s && s !== "none" ? s[0].toUpperCase() + s.slice(1) : undefined)
