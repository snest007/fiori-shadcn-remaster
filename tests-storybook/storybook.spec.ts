import { expect, test, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { build } from "vite"
import AxeBuilder from "@axe-core/playwright"
import { axeViolations, expectNamedControls, waitForStoryFinished } from "./accessibility"
import { attachAudit, classifyViolations } from "./known-issues"

interface StoryEntry { id: string; type: "story" | "docs"; title: string; name: string }
const entries = Object.values(JSON.parse(readFileSync(new URL("../storybook-static/index.json", import.meta.url), "utf8")).entries) as StoryEntry[]
const stories = entries.filter((entry) => entry.type === "story")
const storyId = (title: string, name = "Playground") => {
  const story = stories.find((story) => story.title === title && story.name === name)
  if (!story) throw new Error(`Missing ${title}/${name} story`)
  return story.id
}
const iframe = (id: string, globals?: string, args?: string, mode = "story") => {
  const query = new URLSearchParams({ id, viewMode: mode })
  if (globals) query.set("globals", globals)
  if (args) query.set("args", args)
  return `/iframe.html?${query}`
}
async function render(page: Page, id: string, globals?: string, args?: string) {
  await page.goto(iframe(id, globals, args))
  await expect(page.locator("#storybook-root [data-slot]").first()).toBeAttached()
  await page.evaluate(() => document.fonts.ready)
  await waitForStoryFinished(page)
}
async function tokenColor(page: Page, token: string) {
  return page.evaluate((token) => {
    const probe = document.createElement("span")
    probe.style.backgroundColor = `var(${token})`
    document.body.append(probe)
    const color = getComputedStyle(probe).backgroundColor
    probe.remove()
    return color
  }, token)
}

for (const story of stories) {
  test(`${story.title}/${story.name} renders named controls without errors`, async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()) })
    await render(page, story.id)
    await expect(page.locator("#storybook-root [data-slot]").first()).toBeAttached()
    await expectNamedControls(page)
    expect(errors).toEqual([])
  })
  for (const theme of ["sap_horizon", "sap_horizon_hcb"]) {
    test(`${story.title}/${story.name} has no unexpected axe violations (${theme})`, async ({ page }, testInfo) => {
      await render(page, story.id, `theme:${theme}`)
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme)
      if (story.name === "Loading") await expect(page.getByRole("progressbar")).toBeVisible()
      const violations = await axeViolations(page, theme)
      const audit = await classifyViolations(page, violations, { story: story.id, theme })
      await attachAudit(testInfo, "axe-violations", audit)
      expect(audit.unexpected).toEqual([])
    })
  }
}

test("toolbar globals set root attributes and Horizon canvas color", async ({ page }) => {
  await render(page, storyId("Actions/Button"), "theme:sap_horizon_dark;density:compact;dir:rtl")
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sap_horizon_dark")
  await expect(page.locator("html")).toHaveAttribute("data-density", "compact")
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
  const background = await tokenColor(page, "--sapBackgroundColor")
  await expect(page.locator(".fiori-story-canvas")).toHaveCSS("background-color", background)
})

for (const title of ["Actions/Button", "Data/DataTable"]) {
  test(`${title} docs shows install command and optional usage`, async ({ page, context }) => {
    const docs = entries.find((entry) => entry.type === "docs" && entry.title === title)
    expect(docs).toBeDefined()
    await page.goto(iframe(docs!.id, undefined, undefined, "docs"))
    const name = title === "Actions/Button" ? "button" : "data-table"
    const item = JSON.parse(readFileSync(new URL(`../registry/items/${name}.json`, import.meta.url), "utf8"))
    await expect(page.getByText(`npx shadcn add @petalo/${name}`, { exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "Copy install command" })).toBeVisible()
    // G1 now supplies Button usage; the card's old conditional example is stale.
    await expect(page.getByRole("heading", { name: "When to use", exact: true })).toHaveCount(item.usage ? 1 : 0)
    await expect(page.getByRole("heading", { name: "Props", exact: true })).toBeVisible()
    await expect(page.getByText(name === "button" ? "Semantic appearance of the action." : "Rows to render.").first()).toBeVisible()
    if (name === "data-table") {
      const alternative = page.getByRole("region", { name: "Usage guidance" }).getByRole("link", { name: "table", exact: true })
      await expect(alternative).toHaveAttribute("target", "_top")
      expect(await alternative.evaluate((link) => {
        const url = new URL((link as HTMLAnchorElement).href)
        return { path: url.pathname, docs: url.searchParams.get("path") }
      })).toEqual({ path: "/", docs: "/docs/data-table--docs" })
    }
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.getByRole("button", { name: "Copy install command" }).click()
    await expect(page.getByRole("button", { name: "Copy install command" })).toHaveText("Copied")
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`npx shadcn add @petalo/${name}`)
    await page.getByRole("switch", { name: "Show code" }).first().click()
    await expect(page.locator(".sbdocs-content")).toContainText(name === "button" ? "<Button" : "<DataTable")
  })
}

test("Button args control its emphasized background", async ({ page }) => {
  await render(page, storyId("Actions/Button"), undefined, "variant:emphasized")
  const button = page.getByRole("button", { name: "Save", exact: true })
  await expect(button).toHaveAttribute("data-variant", "emphasized")
  await expect(button).toHaveCSS("background-color", await tokenColor(page, "--sapButton_Emphasized_Background"))
})

test("Input playground typing updates its controlled value", async ({ page }) => {
  await render(page, storyId("Forms/Input"))
  const input = page.getByRole("textbox", { name: "Company" })
  await input.fill("Northwind Traders")
  await expect(input).toHaveValue("Northwind Traders")
})

test("Select playground commits a new option", async ({ page }) => {
  await render(page, storyId("Forms/Select"))
  const select = page.getByRole("combobox", { name: "Country" })
  await select.focus()
  await expect(select).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(select).toHaveText("France")
  await page.keyboard.press("F4")
  await expect(page.getByRole("option", { name: "France", exact: true })).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(page.getByRole("option", { name: "China", exact: true })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("listbox")).toHaveCount(0)
  await expect(select).toHaveText("China")
  await expect(select).toBeFocused()
})

test("Select Open retains component-owned listbox selection and focus restoration", async ({ page }) => {
  await render(page, storyId("Forms/Select", "Open"))
  await expect(page.getByRole("listbox", { name: "Country choices" })).toBeVisible()
  await expect(page.getByRole("option", { name: "Germany", exact: true })).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(page.getByRole("option", { name: "France", exact: true })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("listbox")).toHaveCount(0)
  const select = page.getByRole("combobox", { name: "Country" })
  await expect(select).toHaveText("France")
  await expect(select).toBeFocused()
})

test("Dialog trigger opens and closes a labelled dialog", async ({ page }) => {
  await render(page, storyId("Overlays/Dialog"))
  await page.getByRole("button", { name: "Edit product" }).click()
  await expect(page.getByRole("dialog", { name: "Edit product" })).toBeVisible()
  await page.getByRole("button", { name: "Save", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
})


test("Calendar CustomTexts names its header without altering owned grid states", async ({ page }, testInfo) => {
  await render(page, storyId("Dates/Calendar", "Custom Texts"))
  await expect(page.getByRole("button", { name: "Next delivery month" })).toBeVisible()
  await expect(page.getByRole("gridcell", { selected: true })).toHaveAttribute("aria-selected", "true")
  await render(page, storyId("Dates/Calendar", "Custom Texts"), undefined, "initialPicker:year")
  const range = page.locator('[data-slot="calendar-year-range-button"]')
  await expect(range).toHaveAttribute("aria-label", "Delivery years from 2015 to 2034")
  await expect(range).toHaveAccessibleName("Delivery years from 2015 to 2034")
  const checkRange = async (phase: string) => {
    const audit = await classifyViolations(page, await axeViolations(page, "sap_horizon"), {
      story: "dates-calendar--custom-texts", theme: "sap_horizon", yearMode: true,
    })
    await attachAudit(testInfo, `calendar-custom-${phase}`, audit)
    expect(audit.unexpected).toEqual([])
  }
  await checkRange("initial")
  await page.getByRole("button", { name: "Next Year Range", exact: true }).click()
  await expect(range).toHaveAttribute("aria-label", "Delivery years from 2035 to 2054")
  await expect(range).toHaveAccessibleName("Delivery years from 2035 to 2054")
  await checkRange("paged")
  await range.focus()
  await expect(range).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.locator('[data-picker="yearrange"]')).toBeVisible()
})

test("locale toolbar localizes StepInput and Calendar and Arabic direction", async ({ page }) => {
  const de = JSON.parse(readFileSync(new URL("../registry/i18n/de.json", import.meta.url), "utf8"))
  await render(page, storyId("Forms/StepInput"), "locale:de", "value:1.5;valuePrecision:1")
  await expect(page.locator("#storybook-root input")).toHaveValue("1,5")
  await expect(page.locator("#storybook-root [data-dir=inc]")).toHaveAttribute("title", de.NUMBERINPUT_INC_ICON_TITLE)
  await render(page, storyId("Dates/Calendar"), "locale:de")
  await expect(page.locator("#storybook-root").getByRole("button", { name: de.CALENDAR_HEADER_MONTH_NEXT_BUTTON_TITLE, exact: true })).toBeVisible()
  await render(page, storyId("Dates/Calendar"), "locale:ar")
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
  await expect(page.locator(".fiori-story-canvas")).toHaveAttribute("dir", "rtl")
})

test("physical Locale toolbar updates German controls and the actual Arabic Direction global", async ({ page }) => {
  const de = JSON.parse(readFileSync(new URL("../registry/i18n/de.json", import.meta.url), "utf8"))
  const query = new URLSearchParams({ path: `/story/${storyId("Forms/StepInput")}`, args: "value:1.5;valuePrecision:1" })
  await page.goto(`/?${query}`)
  const locale = page.getByRole("button", { name: /^Locale and SAP translations / })
  const direction = page.getByRole("button", { name: /^Text direction / })
  const preview = page.frameLocator("#storybook-preview-iframe")
  await expect(preview.locator('#storybook-root input')).toHaveValue("1.5")
  await locale.click()
  await page.getByText("Deutsch", { exact: true }).click()
  await expect(locale).toHaveAccessibleName("Locale and SAP translations Deutsch")
  await expect(preview.locator('#storybook-root input')).toHaveValue("1,5")
  await expect(preview.locator('#storybook-root [data-dir="inc"]')).toHaveAttribute("title", de.NUMBERINPUT_INC_ICON_TITLE)
  await locale.click()
  await page.getByText("العربية", { exact: true }).click()
  await expect(locale).toHaveAccessibleName("Locale and SAP translations العربية")
  await expect(direction).toHaveAccessibleName("Text direction rtl")
  await expect(preview.locator("html")).toHaveAttribute("dir", "rtl")
  await expect(preview.locator(".fiori-story-canvas")).toHaveAttribute("dir", "rtl")
  // Preview.emitGlobals/onUpdateGlobals expose the same userGlobals store that
  // drives the Direction toolbar; this proves the stored global, beyond CSS.
  await expect.poll(() => preview.locator("html").evaluate(() => (window as any).__STORYBOOK_PREVIEW__.storyStoreValue.userGlobals.get().dir)).toBe("rtl")
})

async function buildLocalizedLandmarkFixture(worker: number) {
  // Reuse SX landmarks.spec.ts's portable-story approach: production floorplan
  // stories are not registered yet, so bundle the actual preview/composeStory and
  // owning Page/AppShell/List components without substituting their markup.
  const root = fileURLToPath(new URL("../", import.meta.url))
  const source = resolve(root, `.integration/E5-evidence/fourth-20261118/locale-landmarks-${worker}`)
  const output = resolve(root, `storybook-static/e5-locale-landmarks-${worker}`)
  await mkdir(source, { recursive: true })
  await writeFile(resolve(source, "index.html"), '<!doctype html><html lang="en"><head><title>Localized Storybook landmarks</title></head><body><div id="storybook-root"></div><script type="module" src="virtual:e5-locale-landmarks"></script></body></html>')
  await build({
    root: source, configFile: resolve(root, ".storybook/vite.config.ts"), base: "./", logLevel: "warn",
    plugins: [{ name: "e5-locale-landmarks", resolveId: id => id === "virtual:e5-locale-landmarks" ? "\0e5-locale-landmarks" : undefined,
      load: id => id === "\0e5-locale-landmarks" ? `
        import { createElement } from "react";
        import { createRoot } from "react-dom/client";
        import { composeStory } from "@storybook/react-vite";
        import preview from ${JSON.stringify(resolve(root, ".storybook/preview.tsx"))};
        import { fioriMeta } from ${JSON.stringify(resolve(root, "docs/stories/_lib/meta.ts"))};
        import AppShell from ${JSON.stringify(resolve(root, "registry/blocks/app-shell.tsx"))};
        import { Page } from ${JSON.stringify(resolve(root, "registry/ui/page.tsx"))};
        import { List } from ${JSON.stringify(resolve(root, "registry/ui/list.tsx"))};
        import { StepInput } from ${JSON.stringify(resolve(root, "registry/ui/step-input.tsx"))};
        import { Calendar } from ${JSON.stringify(resolve(root, "registry/ui/calendar.tsx"))};
        const query = new URLSearchParams(location.search), kind = query.get("kind"), locale = query.get("locale");
        let meta, args;
        if (kind === "block") { meta = fioriMeta({ name: "app-shell", component: AppShell }); args = {}; }
        else if (kind === "layout") {
          const base = fioriMeta({ name: "page", component: Page });
          // An application-owned native main provides the valid sectioning
          // context around Page's native header; keep Page's DOM unchanged.
          meta = { ...base, render: args => createElement("main", { "aria-label": "Purchase orders" }, createElement(Page, args)), parameters: { ...base.parameters, fiori: { ...base.parameters.fiori, ownsLandmarks: true } } };
          args = { header: createElement("h2", null, "Purchase orders"),
            children: createElement("div", { id: "e5-locale-controls" },
              createElement(StepInput, { value: 1.5, valuePrecision: 1, "aria-label": "Quantity" }),
              createElement(Calendar, { selectedDates: [new Date(2024, 2, 12)], "aria-label": "Delivery date" })) };
        } else { meta = fioriMeta({ name: "list", component: List }); args = { headerText: "Products", footer: "Available products" }; }
        const Story = composeStory({ args, globals: { locale, theme: "sap_horizon", density: "cozy", dir: "ltr" } }, meta, preview, "Playground");
        createRoot(document.getElementById("storybook-root")).render(createElement(Story));
      ` : undefined }],
    build: { outDir: output, emptyOutDir: true, rollupOptions: { input: resolve(source, "index.html") } },
  })
  return `/e5-locale-landmarks-${worker}/index.html`
}

test("Locale provider preserves SX ordinary and full-page landmark ownership", async ({ page }, testInfo) => {
  const fixture = await buildLocalizedLandmarkFixture(testInfo.workerIndex)
  const de = JSON.parse(readFileSync(new URL("../registry/i18n/de.json", import.meta.url), "utf8"))
  for (const locale of ["de", "ar"]) for (const kind of ["ordinary", "layout", "block"]) {
    await page.goto(`${fixture}?kind=${kind}&locale=${locale}`)
    const canvas = page.locator("[data-fiori-story]")
    await expect(canvas.locator("[data-slot]").first()).toBeAttached()
    await expect(canvas).toHaveJSProperty("tagName", "DIV")
    await expect(canvas).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr")
    await expect(page.getByRole("main")).toHaveCount(1)
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveCount(1)
    if (kind === "ordinary") {
      await expect(canvas).toHaveAttribute("role", "main")
      const content = canvas.locator(":scope > section")
      await expect(content).toHaveCount(1)
      expect(await content.evaluate(node => node.attributes.length)).toBe(0)
      await expect(canvas.getByRole("region")).toHaveCount(0)
      await expect(content.locator("header")).toHaveText("Products")
    } else {
      await expect(canvas).not.toHaveAttribute("role")
      const heading = canvas.getByRole("heading", { level: 1 })
      const headingRegion = canvas.getByRole("region", { name: await heading.innerText(), exact: true })
      await expect(headingRegion.getByRole("heading", { level: 1 })).toHaveCount(1)
      await expect(headingRegion.locator('main, [role="main"]')).toHaveCount(0)
      if (kind === "layout" && locale === "de") {
        await expect(canvas.getByRole("main")).toHaveAccessibleName("Purchase orders")
        await expect(canvas.locator('#e5-locale-controls input')).toHaveValue("1,5")
        await expect(canvas.getByRole("button", { name: de.CALENDAR_HEADER_MONTH_NEXT_BUTTON_TITLE, exact: true })).toBeVisible()
      }
    }
    await page.evaluate(() => document.fonts.ready)
    const raw = await new AxeBuilder({ page }).analyze()
    await testInfo.attach(`locale-${locale}-${kind}-axe-raw.json`, { body: JSON.stringify(raw, null, 2), contentType: "application/json" })
    expect(raw.violations.filter(violation => ["landmark-main-is-top-level", "landmark-no-duplicate-main", "landmark-one-main", "landmark-banner-is-top-level", "landmark-contentinfo-is-top-level"].includes(violation.id))).toEqual([])
  }
})

test("Locale provider keeps Docs canvases inside the Docs-owned main", async ({ page }, testInfo) => {
  const id = storyId("Forms/StepInput").replace(/--playground$/, "--docs")
  await page.goto(iframe(id, "locale:de", undefined, "docs"))
  const german = page.locator('[data-fiori-story="forms-step-input--german"]')
  await expect(german.locator("input")).toHaveValue("1,5")
  const canvases = page.locator("[data-fiori-story]")
  await expect(page.getByRole("main")).toHaveCount(1)
  expect(await canvases.evaluateAll(nodes => nodes.every(node => node.tagName === "DIV" && !node.hasAttribute("role")))).toBe(true)
  await expect(canvases.locator(":scope > section")).toHaveCount(0)
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr")
  await expect(page.locator('[data-fiori-story="forms-step-input--arabic"]')).toHaveAttribute("dir", "rtl")
  await waitForStoryFinished(page)
  const raw = await new AxeBuilder({ page }).analyze()
  await testInfo.attach("localized-docs-axe-raw.json", { body: JSON.stringify(raw, null, 2), contentType: "application/json" })
  expect(raw.violations.filter(violation => ["landmark-main-is-top-level", "landmark-no-duplicate-main", "landmark-one-main"].includes(violation.id))).toEqual([])
})
