import { fileURLToPath, URL } from "node:url"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  root: "docs",
  publicDir: r("public"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^@\/components\/ui\//, replacement: r("registry/ui/") },
      { find: /^@\/lib\//, replacement: r("registry/lib/") },
      { find: /^@\/docs\//, replacement: r("docs/src/") },
    ],
  },
  build: {
    outDir: r("dist"),
    emptyOutDir: true,
    rollupOptions: { input: { main: r("docs/index.html"), ui5: r("docs/ui5.html") } },
  },
  server: { port: 5173 },
})
