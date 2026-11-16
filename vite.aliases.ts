import { fileURLToPath, URL } from "node:url"

const r = (path: string) => fileURLToPath(new URL(path, import.meta.url))

/** Shared by the unchanged multi-page docs build and the isolated Storybook build. */
export const aliases = [
  { find: /^@\/components\/ui\//, replacement: r("registry/ui/") },
  { find: /^@\/lib\//, replacement: r("registry/lib/") },
  { find: /^@\/components\/blocks\//, replacement: r("registry/blocks/") },
  { find: /^@\/docs\//, replacement: r("docs/src/") },
]
