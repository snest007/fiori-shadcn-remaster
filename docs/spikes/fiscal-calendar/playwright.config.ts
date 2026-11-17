import { fileURLToPath } from "node:url"
import { defineConfig } from "@playwright/test"

// Spike-only suite; not part of `pnpm test`. Run:
//   pnpm exec playwright test -c docs/spikes/fiscal-calendar/playwright.config.ts
const port = Number(process.env.PORT ?? 5182)
export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  fullyParallel: true,
  workers: "75%",
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${port}`, viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 },
  webServer: {
    command: `pnpm exec vite --port ${port} --strictPort`,
    cwd: fileURLToPath(new URL("../../..", import.meta.url)),
    url: `http://localhost:${port}/spikes/fiscal-calendar/index.html`,
    // Reuse a running spike server (e.g. PORT=5181 from the preview) to skip a cold start.
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
