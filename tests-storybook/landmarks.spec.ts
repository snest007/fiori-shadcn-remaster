import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page, type TestInfo } from "@playwright/test"
import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { build } from "vite"
import { waitForStoryFinished } from "./accessibility"

const root = fileURLToPath(new URL("../", import.meta.url))
const landmarkRules = ["landmark-main-is-top-level", "landmark-no-duplicate-main", "landmark-one-main"]

async function auditLandmarks(page: Page, testInfo: TestInfo, name: string) {
  await page.evaluate(() => document.fonts.ready)
  await waitForStoryFinished(page)
  // Preserve the complete, unfiltered scan, including unrelated component defects.
  const result = await new AxeBuilder({ page }).analyze()
  await testInfo.attach(`${name}-axe-raw.json`, { body: JSON.stringify(result, null, 2), contentType: "application/json" })
  expect(result.violations.filter((violation) => landmarkRules.includes(violation.id))).toEqual([])
  return result
}

async function buildLandmarkFixture(worker: number) {
  // S4's production block stories are not registered yet. Bundle the real helper,
  // decorator and components as a test-only portable story; never rewrite their DOM.
  const source = resolve(root, `.integration/SX-evidence/landmark-fixture-${worker}`)
  const output = resolve(root, `storybook-static/sx-landmarks-${worker}`)
  await mkdir(source, { recursive: true })
  await writeFile(resolve(source, "index.html"), '<!doctype html><html lang="en"><head><title>Storybook landmark ownership</title></head><body><div id="storybook-root"></div><script type="module" src="virtual:sx-landmarks"></script></body></html>')
  await build({
    root: source,
    configFile: resolve(root, ".storybook/vite.config.ts"),
    base: "./",
    logLevel: "warn",
    plugins: [{
      name: "sx-landmark-fixture",
      resolveId: (id) => id === "virtual:sx-landmarks" ? "\0sx-landmarks" : undefined,
      load: (id) => id === "\0sx-landmarks" ? `
        import { createElement } from "react";
        import { createRoot } from "react-dom/client";
        import { composeStory } from "@storybook/react-vite";
        import preview from ${JSON.stringify(resolve(root, ".storybook/preview.tsx"))};
        import { fioriMeta } from ${JSON.stringify(resolve(root, "docs/stories/_lib/meta.ts"))};
        import AppShell from ${JSON.stringify(resolve(root, "registry/blocks/app-shell.tsx"))};
        import { Page } from ${JSON.stringify(resolve(root, "registry/ui/page.tsx"))};
        import { Button } from ${JSON.stringify(resolve(root, "registry/ui/button.tsx"))};
        const kind = new URLSearchParams(location.search).get("kind");
        let meta, args;
        if (kind === "block") {
          meta = fioriMeta({ name: "app-shell", component: AppShell });
          args = {};
        } else if (kind === "layout") {
          const base = fioriMeta({ name: "page", component: Page });
          meta = { ...base, parameters: { ...base.parameters, fiori: { ...base.parameters.fiori, ownsLandmarks: true } } };
          args = {
            role: "main", "aria-label": "Purchase orders",
            header: createElement("h2", null, "Purchase orders"),
            children: createElement("p", null, "Review purchase orders."),
          };
        } else {
          meta = fioriMeta({ name: "button", component: Button });
          args = { children: "Save", variant: "emphasized" };
        }
        meta = { ...meta, parameters: { ...meta.parameters, layout: "fullscreen" } };
        // @storybook/react composeStory delegates to prepareStory/defaultDecorateStory;
        // use its real parameter merging and the exported project decorators.
        const Story = composeStory({ args, globals: { theme: "sap_horizon", density: "compact", dir: "rtl" } }, meta, preview, "Playground");
        createRoot(document.getElementById("storybook-root")).render(createElement(Story));
      ` : undefined,
    }],
    build: { outDir: output, emptyOutDir: true, rollupOptions: { input: resolve(source, "index.html") } },
  })
  return `/sx-landmarks-${worker}/index.html`
}

test("ordinary stories keep exactly one canvas main", async ({ page }, testInfo) => {
  await page.goto("/iframe.html?viewMode=story&id=actions-button--playground")
  const canvas = page.locator('[data-fiori-story="actions-button--playground"]')
  await expect(canvas.getByRole("button", { name: "Save", exact: true })).toBeVisible()
  await expect(page.getByRole("main")).toHaveCount(1)
  await expect(canvas).toHaveJSProperty("tagName", "DIV")
  await expect(canvas).toHaveAttribute("role", "main")
  await expect(canvas.getByRole("heading", { level: 1 })).toHaveText("Actions/Button: Playground")
  await auditLandmarks(page, testInfo, "ordinary")
})

test("blocks and opted-out layouts own their main while fullscreen controls retain the canvas main", async ({ page }, testInfo) => {
  const fixture = await buildLandmarkFixture(testInfo.workerIndex)
  for (const kind of ["block", "layout", "control"]) {
    await page.goto(`${fixture}?kind=${kind}`)
    const id = kind === "block" ? "floorplans-app-shell--playground" : kind === "layout" ? "layout-page--playground" : "actions-button--playground"
    const canvas = page.locator(`[data-fiori-story="${id}"]`)
    await expect(canvas.locator("[data-slot]").first()).toBeAttached()
    await expect(canvas).toHaveJSProperty("tagName", "DIV")
    await expect(canvas).toHaveAttribute("data-theme", "sap_horizon")
    await expect(canvas).toHaveAttribute("data-density", "compact")
    await expect(canvas).toHaveAttribute("dir", "rtl")
    const expectedArgs = kind === "control" ? { children: "Save", variant: "emphasized" } : kind === "layout" ? { role: "main", "aria-label": "Purchase orders" } : {}
    expect(JSON.parse(await canvas.getAttribute("data-fiori-args") ?? "null")).toEqual(expectedArgs)
    await expect(canvas.locator("h1.sr-only")).toHaveCount(1)
    await expect(page.getByRole("main")).toHaveCount(1)
    if (kind === "control") {
      await expect(canvas).toHaveAttribute("role", "main")
      await expect(canvas.locator('main, [role="main"]')).toHaveCount(0)
      await expect(canvas.getByRole("button", { name: "Save" })).toHaveAttribute("data-variant", "emphasized")
    } else {
      await expect(canvas).not.toHaveAttribute("role")
      const owned = canvas.getByRole("main")
      await expect(owned).toHaveCount(1)
      const heading = canvas.getByRole("heading", { level: 1 })
      const headingRegion = canvas.getByRole("region", { name: await heading.innerText(), exact: true })
      await expect(headingRegion.getByRole("heading", { level: 1 })).toHaveCount(1)
      await expect(headingRegion.locator('main, [role="main"]')).toHaveCount(0)
      if (kind === "block") {
        await expect(owned).toHaveJSProperty("tagName", "MAIN")
        await expect(heading).toHaveText("Floorplans/App Shell: Playground")
      }
      else await expect(owned).toHaveAccessibleName("Purchase orders")
    }
    const raw = await auditLandmarks(page, testInfo, kind)
    if (kind === "block") {
      // AppShell's default Card uses Title level="H3" after the canvas H1
      // (registry/blocks/app-shell.tsx). This single heading-order node existed
      // before SX; keep the full raw scan and reject every new rule or node.
      expect(raw.violations.map((violation) => violation.id)).toEqual(["heading-order"])
      expect(raw.violations[0].nodes).toHaveLength(1)
      await expect(canvas.locator('[data-slot="card"] h3[data-slot="title"]')).toHaveText("Welcome to the launchpad")
    }
  }
})

test("docs canvases remain divs within the docs-owned main", async ({ page }, testInfo) => {
  await page.goto("/iframe.html?viewMode=docs&id=actions-button--docs")
  const canvases = page.locator("[data-fiori-story]")
  await expect(canvases.first().locator("[data-slot]").first()).toBeAttached()
  await expect(page.getByRole("main")).toHaveCount(1)
  expect(await canvases.evaluateAll((nodes) => nodes.every((node) => node.tagName === "DIV" && !node.hasAttribute("role")))).toBe(true)
  await auditLandmarks(page, testInfo, "docs")
})
