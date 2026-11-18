import { defineConfig } from "@playwright/test"

// PORT lets several checkouts (git worktrees) run their test servers side by side.
const port = Number(process.env.PORT ?? 4173)
const sapui5Port = Number(process.env.SAPUI5_PORT ?? 4174)

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
    // Both sides of every pixel comparison render in this same Chromium, but on Linux it
    // draws text with LCD subpixel antialiasing and hinting. Subpixel AA depends on whether
    // a layer is opaque, so the same glyph gets coloured fringes on one page and greyscale
    // on the other (2-11% "differing" pixels in CI), and hinting snaps line boxes so a
    // 1px size mismatch appears. Greyscale, unhinted text is what macOS Chromium draws
    // already, so these flags make Linux CI match local runs without touching tolerances.
    launchOptions: { args: ["--disable-lcd-text", "--font-render-hinting=none"] },
  },
  webServer: [{
    command: `pnpm build && pnpm exec vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI && !process.env.PORT,
    timeout: 120_000,
  }, {
    command: "pnpm sapui5:serve",
    url: `http://localhost:${sapui5Port}/index.html`,
    reuseExistingServer: !process.env.CI && !process.env.PORT && !process.env.SAPUI5_PORT,
    timeout: 120_000,
  }],
})
