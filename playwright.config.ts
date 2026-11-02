import { defineConfig } from "@playwright/test"

// PORT lets several checkouts (git worktrees) run their test servers side by side.
const port = Number(process.env.PORT ?? 4173)

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  // Leave headroom for the preview server and Chromium's own processes: with one worker per core the
  // machine saturates and Chromium occasionally drops a file-chooser request (file-uploader "Enter" test).
  workers: "75%",
  // One retry absorbs rare OS/browser timing hiccups; a test that fails twice is real.
  retries: 1,
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL: `http://localhost:${port}`,
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  },
  webServer: {
    command: `pnpm build && pnpm exec vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI && !process.env.PORT,
    timeout: 120_000,
  },
})
