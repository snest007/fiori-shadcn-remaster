import { expect, test } from "@playwright/test"
import * as React from "react"
import { renderToString } from "react-dom/server"
import { build, createServer, type Plugin } from "vite"
import { fileURLToPath } from "node:url"

// UI5 Toolbar: every item keeps its own Tab stop; ←/→ move to the previous/next enabled item,
// Home/End to the first/last; text fields keep the arrows until the caret reaches their edge.
test.describe("Toolbar keyboard and ARIA", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/index.html`)
    await page.waitForSelector("html[data-ready=true]")
  })

  test("role toolbar with a name; separator is a vertical separator", async ({ page }) => {
    const toolbar = page.locator("#toolbar-demo").getByRole("toolbar", { name: "Product actions" })
    await expect(toolbar).toBeVisible()
    await expect(toolbar.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical")
  })

  test("arrow keys, Home and End move focus between enabled items", async ({ page }) => {
    const toolbar = page.locator("#toolbar-demo").getByRole("toolbar", { name: "Product actions" })
    const filter = toolbar.getByRole("textbox", { name: "Filter products" })
    const btn = (name: string) => toolbar.getByRole("button", { name })
    await btn("Add").focus()
    await page.keyboard.press("ArrowRight")
    await expect(btn("Edit")).toBeFocused()
    await page.keyboard.press("ArrowRight") // skips separator and disabled Copy
    await expect(btn("Delete")).toBeFocused()
    await page.keyboard.press("ArrowRight") // no wrap-around
    await expect(btn("Delete")).toBeFocused()
    await page.keyboard.press("Home")
    await expect(filter).toBeFocused()
    await btn("Add").focus()
    await page.keyboard.press("End")
    await expect(btn("Delete")).toBeFocused()
    await page.keyboard.press("ArrowLeft")
    await expect(btn("Edit")).toBeFocused()
    await page.keyboard.press("ArrowLeft")
    await expect(btn("Add")).toBeFocused()
    await page.keyboard.press("ArrowLeft")
    await expect(filter).toBeFocused()
    // Items remain separate Tab stops.
    await page.keyboard.press("Tab")
    await expect(btn("Add")).toBeFocused()
  })

  test("a text field keeps arrows and Home/End until the caret is at its edge", async ({ page }) => {
    const toolbar = page.locator("#toolbar-demo").getByRole("toolbar", { name: "Product actions" })
    const filter = toolbar.getByRole("textbox", { name: "Filter products" })
    await filter.fill("ab") // caret at the end
    await page.keyboard.press("ArrowLeft")
    await page.keyboard.press("ArrowLeft")
    await expect(filter).toBeFocused() // caret moved to the start
    await page.keyboard.press("End") // Home/End always stay with the field
    await expect(filter).toBeFocused()
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowRight")
    await expect(filter).toBeFocused()
    expect(await filter.evaluate((el: HTMLInputElement) => el.selectionStart)).toBe(2)
    await page.keyboard.press("ArrowRight") // caret at the end: the toolbar takes over
    await expect(toolbar.getByRole("button", { name: "Add" })).toBeFocused()
  })
})

test.describe("Toolbar overflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/index.html")
    await page.waitForSelector("html[data-ready=true]")
  })

  test("preserves UI5 order and priorities when narrowed and expanded", async ({ page }) => {
    const toolbar = page.locator("#toolbar-overflow-demo")
    const bar = toolbar.locator("[data-slot=toolbar-items]")
    await expect(bar.getByRole("button", { name: "Always", exact: true })).toHaveCount(0)
    await toolbar.evaluate((element) => { element.style.width = "13rem" })
    await expect(bar.getByRole("button", { name: "Copy", exact: true })).toHaveCount(0)
    await expect(bar.getByRole("button", { name: "Keep", exact: true })).toBeVisible()
    await bar.getByRole("button", { name: "Additional Options" }).click()
    const popover = page.getByRole("dialog", { name: "Available Values" })
    await expect(popover).toBeVisible()
    // Toolbar.js puts AlwaysOverflow items first, followed by the moved items in source order.
    await expect(popover.getByRole("button")).toHaveText(["Always", "Copy", "Paste", "Pin"])
    // UI5 2.28's template omits the visibility attribute for its horizontal wrapper.
    await expect(popover.locator("[data-slot=toolbar-separator]")).toHaveAttribute("aria-orientation", "horizontal")
    await expect(popover.locator("[data-slot=toolbar-separator]")).toBeHidden()
    await toolbar.evaluate((element) => { element.style.width = "30rem" })
    await expect(popover).toBeHidden()
    await expect(bar.getByRole("button", { name: "Copy", exact: true })).toBeVisible()
    await expect(bar.getByRole("button", { name: "Always", exact: true })).toHaveCount(0)
  })

  test("click closes with focus restoration; prevented items stay open", async ({ page }) => {
    const toolbar = page.locator("#toolbar-overflow-demo")
    await toolbar.evaluate((element) => { element.style.width = "13rem" })
    const trigger = toolbar.getByRole("button", { name: "Additional Options" })
    await expect(toolbar.locator("[data-slot=toolbar-items]").getByRole("button", { name: "Pin", exact: true })).toHaveCount(0)
    await trigger.click()
    const popover = page.getByRole("dialog", { name: "Available Values" })
    await popover.getByRole("button", { name: "Pin", exact: true }).click()
    await expect(page.locator("#demo-toolbar-last")).toHaveText("Pin")
    await expect(popover).toBeVisible()
    await expect(popover.getByRole("button", { name: "Pin", exact: true })).toBeFocused()
    await popover.getByRole("button", { name: "Copy", exact: true }).click()
    await expect(page.locator("#demo-toolbar-last")).toHaveText("Copy")
    await expect(popover).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test("arrow navigation reaches overflow; Enter and Space open; Escape returns focus", async ({ page }) => {
    const toolbar = page.locator("#toolbar-overflow-demo")
    await toolbar.evaluate((element) => { element.style.width = "13rem" })
    const keep = toolbar.getByRole("button", { name: "Keep", exact: true })
    const trigger = toolbar.getByRole("button", { name: "Additional Options" })
    await expect(toolbar.locator("[data-slot=toolbar-items]").getByRole("button", { name: "Copy", exact: true })).toHaveCount(0)
    await keep.focus()
    await page.keyboard.press("ArrowRight")
    await expect(trigger).toBeFocused()
    await expect(trigger).toHaveAttribute("aria-haspopup", "menu")
    for (const key of ["Enter", "Space"]) {
      await page.keyboard.press(key)
      await expect(trigger).toHaveAttribute("aria-expanded", "true")
      const popover = page.getByRole("dialog", { name: "Available Values" })
      await expect(popover.getByRole("button", { name: "Always", exact: true })).toBeFocused()
      await page.keyboard.press("Escape")
      await expect(popover).toBeHidden()
      await expect(trigger).toBeFocused()
      await expect(trigger).toHaveAttribute("aria-expanded", "false")
    }
    await page.keyboard.press("ArrowLeft")
    await expect(keep).toBeFocused()
    await page.keyboard.press("End")
    await expect(trigger).toBeFocused()
  })

  test("arbitrary uncontrolled input retains its DOM and value through overflow", async ({ page }) => {
    const toolbar = page.locator("#toolbar-overflow-demo")
    const field = toolbar.getByRole("textbox", { name: "Overflow filter" })
    await field.fill("retained value")
    await field.evaluate((element) => { (window as any).__toolbarField = element })
    await toolbar.evaluate((element) => { element.style.width = "13rem" })
    const trigger = toolbar.getByRole("button", { name: "Additional Options" })
    await expect(toolbar.locator("[data-slot=toolbar-items]").getByRole("textbox", { name: "Overflow filter" })).toHaveCount(0)
    await trigger.click()
    const popover = page.getByRole("dialog", { name: "Available Values" })
    const overflowField = popover.getByRole("textbox", { name: "Overflow filter" })
    await expect(overflowField).toHaveValue("retained value")
    expect(await overflowField.evaluate((element) => (window as any).__toolbarField === element)).toBe(true)
    await overflowField.fill("")
    await overflowField.pressSequentially("changed in overflow")
    await expect(overflowField).toHaveValue("changed in overflow")
    await expect(overflowField).toBeFocused()
    await expect(popover).toBeVisible()
    await toolbar.evaluate((element) => { element.style.width = "30rem" })
    await expect(popover).toBeHidden()
    await expect(field).toHaveValue("changed in overflow")
    expect(await field.evaluate((element) => (window as any).__toolbarField === element)).toBe(true)
  })

  test("List Report consumer still renders its toolbar and table", async ({ page }) => {
    await page.goto("/block.html?name=list-report")
    await expect(page.getByRole("toolbar", { name: "Products toolbar" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Create", exact: true })).toBeVisible()
    await expect(page.getByRole("grid", { name: "Products (12)" })).toBeVisible()
    await expect(page.getByText("Premium Scissors - Set of 3", { exact: true })).toBeVisible()
  })

  test("wrapped Select preserves its value and closes overflow on selection", async ({ page }) => {
    const toolbar = page.locator("#toolbar-select-demo")
    const view = toolbar.getByRole("combobox", { name: "Overflow view" })
    await view.focus()
    await page.keyboard.press("ArrowDown")
    await expect(view).toHaveText("My products")
    await toolbar.evaluate((element) => { element.style.width = "13rem" })
    const trigger = toolbar.getByRole("button", { name: "Additional Options" })
    await expect(toolbar.locator("[data-slot=toolbar-items]").getByRole("combobox")).toHaveCount(0)
    await trigger.click()
    const popover = page.getByRole("dialog", { name: "Available Values" })
    const overflowView = popover.getByRole("combobox", { name: "Overflow view" })
    await expect(overflowView).toHaveText("My products")
    await overflowView.click()
    // Select's modal picker temporarily aria-hides the outer surface. It remains painted.
    await expect(page.locator("[data-slot=popover-content][aria-label='Available Values']")).toBeVisible()
    await page.getByRole("option", { name: "All products", exact: true }).click()
    await expect(page.locator("#demo-toolbar-last")).toHaveText("all")
    await expect(popover).toBeHidden()
    await expect(trigger).toBeFocused()
    await toolbar.evaluate((element) => { element.style.width = "24rem" })
    await expect(view).toBeVisible()
    await expect(view).toHaveText("All products")
  })
})


test.describe("Toolbar review regressions", () => {
  test("top placement follows the installed UI5 effective order and first focus on reopen", async ({ page, context }) => {
    await page.goto("/index.html?fixtures&only=toolbar")
    await page.waitForSelector("html[data-ready=true]")
    const ours = page.locator('[data-fixture="toolbar-overflow"] [data-slot="toolbar"]')
    await ours.evaluate((element) => { Object.assign(element.style, { position: "fixed", bottom: "0", left: "20px", width: "8rem" }) })
    const referencePage = await context.newPage()
    await referencePage.goto("/ui5.html?only=toolbar")
    await referencePage.waitForSelector("html[data-ready=true]")
    const reference = referencePage.locator('[data-fixture="toolbar-overflow"] ui5-toolbar')
    await reference.evaluate((element) => { Object.assign((element as HTMLElement).style, { position: "fixed", bottom: "0", left: "20px", width: "8rem" }) })
    await expect.poll(() => reference.evaluate((element: any) => element.itemsToOverflow.filter((item: any) => item.text).length)).toBe(4)
    const trigger = ours.getByRole("button", { name: "Additional Options" })
    for (let opening = 0; opening < 2; opening++) {
      await reference.evaluate((element: any) => element.openOverflow())
      await expect.poll(() => reference.evaluate((element: any) => element.popoverOpen && element.getOverflowPopover().actualPlacement === "Top")).toBe(true)
      const order = await reference.evaluate((element: any) => element.overflowItems.filter((item: any) => item.text).map((item: any) => item.text))
      await trigger.click()
      const popover = page.getByRole("dialog", { name: "Available Values", exact: true })
      await expect(popover).toHaveAttribute("data-side", "top")
      await expect(popover.getByRole("button")).toHaveText(order)
      await expect(popover.getByRole("button", { name: order[0], exact: true })).toBeFocused()
      await reference.evaluate((element: any) => element.closeOverflow())
      await expect.poll(() => reference.evaluate((element: any) => element.popoverOpen)).toBe(false)
      await page.keyboard.press("Escape")
      await expect(popover).toBeHidden()
      await expect(trigger).toBeFocused()
    }
    await referencePage.close()
  })

  test("wrapped control closing uses committed events and labels remain overridable", async ({ page }) => {
    await page.goto("/index.html")
    await page.waitForSelector("html[data-ready=true]")
    const toolbar = page.locator("#toolbar-controls-demo")
    const trigger = toolbar.getByRole("button", { name: "Additional Options" })
    const popover = page.getByRole("dialog", { name: "Wrapped controls", exact: true })
    const open = async () => { await trigger.click(); await expect(popover).toBeVisible() }
    await open()
    await popover.getByRole("checkbox", { name: "Overflow checked" }).click()
    await expect(popover).toBeVisible() // ToolbarItem.getClosingEvents has no CheckBox event.
    await popover.getByRole("switch", { name: "Overflow enabled" }).click()
    await expect(popover).toBeHidden()
    await expect(page.locator("#demo-toolbar-last")).toHaveText("true")
    await open()
    await popover.getByRole("button", { name: "Wrapped action", exact: true }).click()
    await expect(popover).toBeHidden()
    await expect(page.locator("#demo-toolbar-last")).toHaveText("Wrapped action")
    await open()
    const combo = popover.getByRole("combobox", { name: "Overflow category" })
    await combo.fill("S")
    await expect(combo).toHaveValue("S")
    await expect(popover).toBeVisible() // ComboBox change means commit, not input.
    await page.getByRole("option", { name: "Software", exact: true }).click()
    await expect(popover).toBeHidden()
    await expect(page.locator("#demo-toolbar-last")).toHaveText("Software")
    await open()
    const date = popover.getByRole("textbox", { name: "Overflow date" })
    await date.fill("2026-11-03")
    await expect(date).toHaveValue("2026-11-03")
    await expect(date).toBeFocused()
    await expect(popover).toBeVisible()
    await page.keyboard.press("Enter")
    await expect(page.locator("#demo-toolbar-last")).toHaveText("2026-11-03")
    await expect(popover).toBeHidden()
    await open()
    const tags = popover.getByRole("combobox", { name: "Overflow tags" })
    await tags.focus()
    await expect(tags).toBeFocused()
    await page.keyboard.press("F4")
    await expect(tags).toHaveAttribute("aria-expanded", "true")
    const hardware = page.locator("[data-slot=multi-combobox-list]").getByRole("option", { name: /^Hardware/ })
    await expect(hardware).toBeVisible()
    await hardware.click()
    await expect(popover).toBeHidden()
    await expect(page.locator("#demo-toolbar-last")).toHaveText("Hardware")
    await expect(trigger).toBeFocused()
  })

  test("SSR supplies children and hydration preserves values and stable subsequent moves", async ({ page }) => {
    test.setTimeout(60_000)
    const root = fileURLToPath(new URL("../", import.meta.url))
    const aliases = [
      { find: /^@\/components\/ui\//, replacement: `${root}registry/ui/` },
      { find: /^@\/lib\//, replacement: `${root}registry/lib/` },
    ]
    const entry = `
      import * as React from "react";
      import { hydrateRoot } from "react-dom/client";
      import { Toolbar, ToolbarButton, ToolbarItem } from "${root}registry/ui/toolbar.tsx";
      import { Input } from "${root}registry/ui/input.tsx";
      export function App({ reverse = false, hideDelete = false } = {}) {
        const [count, setCount] = React.useState(0);
        React.useEffect(() => { window.__toolbarMounts = (window.__toolbarMounts || 0) + 1 }, []);
        const items = [
          React.createElement(ToolbarButton, { key: "save", overflowPriority: "neverOverflow", onClick: () => setCount(count + 1) }, count ? "Saved " + count : "Save"),
          !hideDelete && React.createElement(ToolbarButton, { key: "delete" }, "Delete"),
          React.createElement(ToolbarItem, { key: "input" }, React.createElement(Input, { "aria-label": "Hydrated filter", defaultValue: "Server value", wrapperClassName: "w-40" })),
          React.createElement(ToolbarItem, { key: "controlled" }, React.createElement(Input, { "aria-label": "Hydrated controlled", value: "Controlled value", readOnly: true, wrapperClassName: "w-40" })),
          React.createElement(ToolbarItem, { key: "checked" }, React.createElement("input", { "aria-label": "Hydrated checked", type: "checkbox", defaultChecked: false }))
        ].filter(Boolean);
        return React.createElement(Toolbar, { id: "toolbar-hydration-test", style: { width: "40rem", position: "fixed", top: "100px", left: "20px" } }, reverse ? items.reverse() : items);
      }
      export function hydrate(container) {
        const root = hydrateRoot(container, React.createElement(App), { onRecoverableError: (error) => window.__toolbarHydrationErrors.push(String(error)) });
        window.__toolbarRender = (props) => root.render(React.createElement(App, props));
      }
      if (typeof window !== "undefined") window.__toolbarHydrate = hydrate;
    `
    const virtual: Plugin = { name: "toolbar-hydration-regression", resolveId: (id) => id === "virtual:toolbar-hydration" ? id : undefined, load: (id) => id === "virtual:toolbar-hydration" ? entry : undefined }
    const server = await createServer({ configFile: false, root, resolve: { alias: aliases }, plugins: [virtual], server: { middlewareMode: true }, appType: "custom", logLevel: "error" })
    let markup: string
    try {
      const module = await server.ssrLoadModule("virtual:toolbar-hydration")
      markup = renderToString(React.createElement(module.App))
    } finally { await server.close() }
    expect(markup).toContain("Save")
    expect(markup).toContain("Delete")
    expect(markup).toContain('value="Server value"')
    const result = await build({ configFile: false, root, resolve: { alias: aliases }, plugins: [virtual], logLevel: "error", build: { write: false, minify: false, rollupOptions: { input: "virtual:toolbar-hydration", output: { codeSplitting: false } } } })
    const outputs = (Array.isArray(result) ? result : [result]).flatMap((item) => "output" in item ? item.output : [])
    const code = outputs.find((item) => item.type === "chunk" && item.isEntry)
    if (!code || code.type !== "chunk") throw new Error("Hydration bundle missing")
    await page.goto("/index.html")
    await page.waitForSelector("html[data-ready=true]")
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.evaluate((html) => {
      const container = document.createElement("div")
      container.id = "toolbar-server-root"
      container.innerHTML = html
      document.body.append(container)
      ;(window as any).__toolbarHydrationErrors = []
      const input = container.querySelector("input")!
      input.value = "Edited before hydration"
      input.setSelectionRange(2, 6, "backward")
      input.focus()
      container.querySelector<HTMLInputElement>("input[type=checkbox]")!.checked = true
    }, markup)
    const toolbar = page.locator("#toolbar-hydration-test")
    await expect(toolbar.getByRole("button", { name: "Save", exact: true })).toBeVisible()
    await expect(toolbar.getByRole("button", { name: "Delete", exact: true })).toBeVisible()
    await page.evaluate((source) => {
      const script = document.createElement("script")
      script.type = "module"
      script.textContent = source
      document.head.append(script)
    }, code.code)
    await page.waitForFunction(() => typeof (window as any).__toolbarHydrate === "function", null, { timeout: 10_000 }).catch(() => { throw new Error(`Hydration script failed: ${errors.join("; ")}`) })
    await page.evaluate(() => (window as any).__toolbarHydrate(document.getElementById("toolbar-server-root")))
    await expect.poll(() => page.evaluate(() => (window as any).__toolbarMounts)).toBe(1)
    const field = toolbar.getByRole("textbox", { name: "Hydrated filter" })
    await expect(field).toHaveValue("Edited before hydration")
    await expect(field).toBeFocused()
    expect(await field.evaluate((element: HTMLInputElement) => [element.selectionStart, element.selectionEnd, element.selectionDirection])).toEqual([2, 6, "backward"])
    await expect(toolbar.getByRole("textbox", { name: "Hydrated controlled" })).toHaveValue("Controlled value")
    await expect(toolbar.getByRole("checkbox", { name: "Hydrated checked" })).toBeChecked()
    // The one initialization transition adopts portals; future overflow moves reuse these nodes.
    await field.evaluate((element) => { (window as any).__toolbarHydratedInput = element })
    await toolbar.getByRole("button", { name: "Save", exact: true }).click()
    await expect(toolbar.getByRole("button", { name: "Saved 1", exact: true })).toBeVisible()
    await toolbar.evaluate((element) => { element.style.width = "10rem" })
    const trigger = toolbar.getByRole("button", { name: "Additional Options" })
    await expect(trigger).toBeVisible()
    await trigger.click()
    const popover = page.getByRole("dialog", { name: "Available Values", exact: true })
    await expect(popover.getByRole("textbox", { name: "Hydrated filter" })).toHaveValue("Edited before hydration")
    await page.evaluate(() => (window as any).__toolbarRender({ reverse: true }))
    await expect(popover.getByRole("button", { name: "Delete", exact: true })).toBeVisible()
    expect(await popover.getByRole("textbox", { name: "Hydrated filter" }).evaluate((element) => element === (window as any).__toolbarHydratedInput)).toBe(true)
    await page.evaluate(() => (window as any).__toolbarRender({ reverse: true, hideDelete: true }))
    await expect(popover.getByRole("button", { name: "Delete", exact: true })).toHaveCount(0)
    await expect(popover.getByRole("textbox", { name: "Hydrated filter" })).toHaveValue("Edited before hydration")
    await expect(toolbar.getByRole("button", { name: "Saved 1", exact: true })).toBeVisible()
    expect(await page.evaluate(() => (window as any).__toolbarHydrationErrors)).toEqual([])
    expect(await page.evaluate(() => (window as any).__toolbarMounts)).toBe(1)
    expect(errors).toEqual([])
  })
})
