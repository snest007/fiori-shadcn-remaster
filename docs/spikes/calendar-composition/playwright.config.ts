import { fileURLToPath } from "node:url"
import { defineConfig } from "@playwright/test"
const port = Number(process.env.PORT ?? 5184)
export default defineConfig({
  testDir: ".", testMatch: "*.spec.ts", fullyParallel: true, workers: "75%", retries: 0,
  outputDir: "/tmp/shadcn-fiori-X0-test-results",
  reporter: [["list"], ["json", { outputFile: "/tmp/shadcn-fiori-X0-results.json" }]],
  use: { baseURL: `http://localhost:${port}`, viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 },
  webServer: { command: `pnpm exec vite --port ${port} --strictPort`, cwd: fileURLToPath(new URL("../../..", import.meta.url)), url: `http://localhost:${port}/spikes/calendar-composition/index.html`, reuseExistingServer: false, timeout: 120_000 },
})
