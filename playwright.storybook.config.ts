import { defineConfig } from "@playwright/test"

const port = Number(process.env.PORT ?? 4320)
export default defineConfig({
  testDir: "tests-storybook",
  fullyParallel: true,
  workers: "75%",
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "test-results/storybook-results.json" }]],
  use: { baseURL: `http://localhost:${port}`, viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 },
  webServer: {
    command: `pnpm exec vite preview --config .storybook/vite.config.ts --outDir storybook-static --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
