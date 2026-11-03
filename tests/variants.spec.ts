import { expect, test, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { build } from "vite"

import type { Variant, useVariantState } from "@/lib/fiori-variants"

const storageKey = "fiori-list-report-variants"
const report = (page: Page) => page.locator("#list-report")
const views = (page: Page) => report(page).locator("#list-report-variants")
const trigger = (page: Page) => views(page).getByTitle("Select View", { exact: true })
const savedView = (change: Partial<Variant> = {}): Variant => ({
  key: "saved", title: "Saved View", changeable: true, remove: true, rename: true, favorite: true,
  default: true, executeOnSelect: true,
  state: { values: { supplier: [{ operator: "Contains", values: ["depot"] }] }, visibleKeys: ["supplier", "category"], search: "scissors" },
  ...change,
})
async function load(page: Page, variants: Variant[]) {
  await page.addInitScript(({ key, data }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(data)) }, { key: storageKey, data: variants })
  await page.goto("/block.html?name=list-report")
  await page.waitForSelector("html[data-ready=true]")
  await expect(page.locator("[data-variants-ready]")).toBeVisible()
}
async function openManage(page: Page) {
  await trigger(page).click()
  await page.getByRole("dialog", { name: "My Views", exact: true }).getByRole("button", { name: "Manage", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "Manage Views", exact: true })
  await expect(dialog).toBeVisible()
  return dialog
}
async function openAdapt(page: Page) {
  await report(page).getByRole("button", { name: /^Adapt Filters/ }).click()
  const dialog = page.locator("#list-report-filter-bar-adapt-dialog")
  await expect(dialog).toBeVisible()
  return dialog
}
async function confirmReset(page: Page) {
  const warning = page.locator("#list-report-filter-bar-adapt-dialog-reset")
  await expect(warning).toBeVisible()
  await warning.getByRole("button", { name: "OK", exact: true }).click()
  await expect(warning).toHaveCount(0)
}

test("variants: registry item distributes the library and its type dependencies", () => {
  const item = JSON.parse(readFileSync("public/r/variants.json", "utf8"))
  expect(item.type).toBe("registry:lib")
  expect(item.files.map((file: { path: string; type: string }) => ({ path: file.path, type: file.type }))).toEqual([
    { path: "registry/lib/fiori-variants.ts", type: "registry:lib" },
  ])
  expect(item.registryDependencies).toEqual(expect.arrayContaining(["@fiori/filter-bar", "@fiori/variant-management"]))
})

test("variants: load applies the default values, search and field order, while Standard stays immutable", async ({ page }) => {
  await load(page, [savedView(), { key: "standard", title: "Tampered", remove: true, rename: true, changeable: true, state: { values: {}, visibleKeys: [], search: "tampered" } }])
  await expect(trigger(page)).toHaveAccessibleName("View Saved View.")
  await expect(report(page).getByRole("heading", { name: "Products (1)", exact: true })).toBeVisible()
  await expect.poll(() => report(page).locator("[data-filter-key]").evaluateAll((items) => items.map((item) => item.getAttribute("data-filter-key")))).toEqual(["supplier", "category"])
  const manage = await openManage(page)
  const standard = manage.locator('[data-variant-key="standard"]')
  await expect(standard).toContainText("Standard")
  await expect(standard).toContainText("SAP")
  await expect(standard.getByRole("textbox")).toHaveCount(0)
  await expect(standard.getByRole("button", { name: "Delete View", exact: true })).toHaveCount(0)
  await manage.getByRole("button", { name: "Cancel", exact: true }).click()
  await expect(manage).toHaveCount(0)
  await trigger(page).click()
  await page.getByRole("dialog", { name: "My Views", exact: true }).getByRole("option", { name: "Standard", exact: true }).click()
  await expect(trigger(page)).toHaveAccessibleName("View Standard.")
  await expect(report(page).getByLabel("Supplier", { exact: true })).toHaveValue("")
  await expect(report(page).getByRole("searchbox", { name: "Search", exact: true })).toHaveValue("")
  await expect.poll(() => report(page).locator("[data-filter-key]").evaluateAll((items) => items.map((item) => item.getAttribute("data-filter-key")))).toEqual(["category", "supplier"])
})

test("variants: equivalent empty conditions clear modified; Save overwrites state and keeps options", async ({ page }) => {
  await load(page, [savedView({ state: { values: {}, visibleKeys: ["category", "supplier"], search: "" }, executeOnSelect: false })])
  const supplier = report(page).getByLabel("Supplier", { exact: true })
  await supplier.fill("depot")
  await expect(trigger(page)).toHaveAccessibleName("Modified view Saved View.")
  await supplier.fill("")
  await expect(trigger(page)).toHaveAccessibleName("View Saved View.")
  await supplier.fill("depot")
  await expect(trigger(page)).toHaveAccessibleName("Modified view Saved View.")
  await trigger(page).click()
  const list = page.getByRole("dialog", { name: "My Views", exact: true })
  await list.getByRole("button", { name: "Save", exact: true }).click()
  await expect(list).toHaveCount(0)
  await expect(trigger(page)).toHaveAccessibleName("View Saved View.")
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "[]").find((item: { key: string }) => item.key === "saved"), storageKey)).toMatchObject({
    default: true, executeOnSelect: false, state: { values: { supplier: [{ operator: "Contains", values: ["depot"] }] } },
  })
  await page.reload()
  await page.waitForSelector("html[data-ready=true]")
  await expect(supplier).toHaveValue("depot")
  await expect(report(page).getByRole("heading", { name: "Products (12)", exact: true })).toBeVisible()
})

test("variants: Adapt Filters Reset restores saved values, visibility, order and search only on OK", async ({ page }) => {
  await load(page, [savedView()])
  await report(page).getByLabel("Supplier", { exact: true }).fill("guru")
  await report(page).getByRole("searchbox", { name: "Search", exact: true }).fill("mugs")
  let dialog = await openAdapt(page)
  await dialog.locator('[data-key="category"]').getByRole("button", { name: "Hide on Filter Bar: Category", exact: true }).click()
  await dialog.getByRole("button", { name: "OK", exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(report(page).getByLabel("Category", { exact: true })).toHaveCount(0)
  await expect(trigger(page)).toHaveAccessibleName("Modified view Saved View.")
  dialog = await openAdapt(page)
  await dialog.getByRole("button", { name: "Reset", exact: true }).click()
  await confirmReset(page)
  await expect(dialog.getByRole("textbox", { name: "Supplier", exact: true })).toHaveValue("depot")
  await expect(report(page).locator('input[type="search"]')).toHaveValue("mugs")
  await dialog.getByRole("button", { name: "OK", exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(report(page).getByLabel("Supplier", { exact: true })).toHaveValue("depot")
  await expect(report(page).getByRole("searchbox", { name: "Search", exact: true })).toHaveValue("scissors")
  await expect.poll(() => report(page).locator("[data-filter-key]").evaluateAll((items) => items.map((item) => item.getAttribute("data-filter-key")))).toEqual(["supplier", "category"])
  await expect(trigger(page)).toHaveAccessibleName("View Saved View.")
})

test("variants: search-only Reset is enabled, Cancel discards it and selecting the view runs Go again", async ({ page }) => {
  await load(page, [savedView()])
  const search = report(page).getByRole("searchbox", { name: "Search", exact: true })
  await search.fill("mugs")
  let dialog = await openAdapt(page)
  await expect(dialog.getByRole("button", { name: "Reset", exact: true })).toBeEnabled()
  await dialog.getByRole("button", { name: "Reset", exact: true }).click()
  await confirmReset(page)
  await expect(dialog.getByRole("button", { name: "Reset", exact: true })).toBeDisabled()
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(search).toHaveValue("mugs")
  await expect(trigger(page)).toHaveAccessibleName("Modified view Saved View.")
  dialog = await openAdapt(page)
  await dialog.getByRole("button", { name: "Reset", exact: true }).click()
  await confirmReset(page)
  await dialog.getByRole("button", { name: "OK", exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(search).toHaveValue("scissors")
  await expect(trigger(page)).toHaveAccessibleName("View Saved View.")
  await trigger(page).click()
  await page.getByRole("dialog", { name: "My Views", exact: true }).getByRole("option", { name: "Standard", exact: true }).click()
  await expect(search).toHaveValue("")
  await report(page).getByRole("button", { name: "Go", exact: true }).click()
  await expect(report(page).getByRole("heading", { name: "Products (12)", exact: true })).toBeVisible()
  await trigger(page).click()
  await page.getByRole("dialog", { name: "My Views", exact: true }).getByRole("option", { name: "Saved View", exact: true }).click()
  await expect(search).toHaveValue("scissors")
  await expect(report(page).getByRole("heading", { name: "Products (1)", exact: true })).toBeVisible()
})

test("variants: deleting the selected view switches to the new default and applies its execution option", async ({ page }) => {
  await load(page, [savedView(), savedView({ key: "other", title: "Other View", default: false, executeOnSelect: false, state: { values: { supplier: [{ operator: "Contains", values: ["guru"] }] }, visibleKeys: ["supplier"], search: "" } })])
  const manage = await openManage(page)
  const other = manage.locator('[data-variant-key="other"]')
  await other.getByRole("radio", { name: "Default", exact: true }).click()
  await other.getByRole("checkbox", { name: "Apply Automatically", exact: true }).check()
  await manage.locator('[data-variant-key="saved"]').getByRole("button", { name: "Delete View", exact: true }).click()
  await manage.getByRole("button", { name: "Save", exact: true }).click()
  await expect(manage).toHaveCount(0)
  await expect(trigger(page)).toHaveAccessibleName("View Other View.")
  await expect(report(page).getByLabel("Supplier", { exact: true })).toHaveValue("guru")
  await expect(report(page).getByRole("heading", { name: "Products (2)", exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "[]").map((item: { key: string }) => item.key), storageKey)).toEqual(["standard", "other"])
})

type VariantHarness = {
  controller: ReturnType<typeof useVariantState>
  resolveLoad: (variants: Variant[]) => void
  rejectLoad: (error: Error) => void
  writes: { variants: Variant[]; resolve: () => void; reject: (error: Error) => void }[]
  executions: { state: Variant["state"]; rendered: string }[]
}
declare global { interface Window { variantsHarness: VariantHarness } }

test.describe("variants: asynchronous storage contract", () => {
  // These tests exercise a real React consumer with controlled promises; no network timing or sleeps.
  test.describe.configure({ mode: "default" })
  let harnessCode: string
  test.beforeAll(async () => {
    const virtual = resolve("variants-test.js")
    const resolvedVirtual = "\0variants-test"
    const source = `
      import * as React from "react";
      import { createRoot } from "react-dom/client";
      import { useVariantState } from ${JSON.stringify(resolve("registry/lib/fiori-variants.ts"))};
      const harness = window.variantsHarness = { writes: [], executions: [] };
      const storage = {
        load: () => new Promise((resolve, reject) => { harness.resolveLoad = resolve; harness.rejectLoad = reject; }),
        save: variants => new Promise((resolve, reject) => harness.writes.push({ variants, resolve, reject }))
      };
      function Consumer() {
        const views = useVariantState({
          initialVariants: [{ key: "standard", title: "Standard", state: { values: {}, visibleKeys: ["supplier", "category"], search: "" } }],
          storage,
          onExecute: state => harness.executions.push({ state, rendered: document.getElementById("variants-test-state").textContent })
        });
        harness.controller = views;
        return React.createElement("pre", { id: "variants-test-state" }, JSON.stringify({
          ready: views.ready, saving: views.saving, error: !!views.error, selectedKey: views.selectedKey,
          defaultKey: views.defaultKey, modified: views.modified, state: views.state, variants: views.variants
        }));
      }
      createRoot(document.getElementById("variants-test")).render(React.createElement(Consumer));
    `
    const result = await build({
      configFile: false, publicDir: false, logLevel: "silent", define: { "process.env.NODE_ENV": JSON.stringify("production") },
      plugins: [{ name: "variants-test", resolveId: (id) => id === virtual ? resolvedVirtual : undefined, load: (id) => id === resolvedVirtual ? source : undefined }],
      build: { write: false, minify: false, lib: { entry: virtual, formats: ["iife"], name: "VariantsTest" } },
    })
    const output = Array.isArray(result) ? result[0] : result
    if (!("output" in output)) throw new Error("Expected an in-memory Vite build.")
    const chunk = output.output.find((file) => file.type === "chunk")
    if (!chunk || chunk.type !== "chunk") throw new Error("Missing variants harness bundle.")
    harnessCode = chunk.code
  })
  async function mount(page: Page) {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.route("**/variants-test.html", (route) => route.fulfill({ contentType: "text/html", body: `<main id="variants-test"></main><script>${harnessCode.replaceAll("</script", "<\\/script")}</script>` }))
    await page.goto("/variants-test.html")
    await expect(page.locator("#variants-test-state")).toContainText('"ready":false')
    expect(errors).toEqual([])
    await expect.poll(() => page.evaluate(() => typeof window.variantsHarness.resolveLoad)).toBe("function")
  }
  async function resolveLoad(page: Page, variants: Variant[] = []) {
    await page.evaluate((data) => window.variantsHarness.resolveLoad(data), variants)
    await expect(page.locator("#variants-test-state")).toContainText('"ready":true')
  }
  const snapshot = (page: Page) => page.locator("#variants-test-state")

  test("ignores commands during load and executes the loaded default after its state renders", async ({ page }) => {
    await mount(page)
    await page.evaluate(() => {
      const controller = window.variantsHarness.controller
      controller.setState({ values: {}, visibleKeys: [], search: "too early" })
      controller.manageVariants({ renamed: [{ key: "standard", name: "Changed" }], deleted: ["standard"] })
      controller.saveVariant({ name: "Too Early", key: null, overwrite: false, def: true })
      controller.selectVariant("standard")
    })
    await expect(snapshot(page)).toContainText('"search":""')
    expect(await page.evaluate(() => window.variantsHarness.writes.length)).toBe(0)
    expect(await page.evaluate(() => window.variantsHarness.executions.length)).toBe(0)
    await resolveLoad(page, [savedView()])
    await expect(snapshot(page)).toContainText('"selectedKey":"saved"')
    await expect.poll(() => page.evaluate(() => window.variantsHarness.executions.length)).toBe(1)
    const executed = await page.evaluate(() => window.variantsHarness.executions[0])
    expect(executed.state).toEqual(savedView().state)
    expect(JSON.parse(executed.rendered)).toMatchObject({ selectedKey: "saved", state: savedView().state })
    expect(await page.evaluate(() => window.variantsHarness.writes.length)).toBe(0)
  })

  test("serializes saves and retains the snapshot of each pending write", async ({ page }) => {
    await mount(page)
    await resolveLoad(page)
    await page.evaluate(() => window.variantsHarness.controller.saveVariant({ name: "First", overwrite: false, key: null, def: true }))
    await expect.poll(() => page.evaluate(() => window.variantsHarness.writes.length)).toBe(1)
    await page.evaluate(() => window.variantsHarness.controller.setState({ values: {}, visibleKeys: ["supplier"], search: "new value" }))
    await expect(snapshot(page)).toContainText('"modified":true')
    await page.evaluate(() => {
      const controller = window.variantsHarness.controller
      controller.saveVariant({ name: "First", overwrite: true, key: controller.selectedKey, def: true })
    })
    await expect(snapshot(page)).toContainText('"modified":false')
    expect(await page.evaluate(() => window.variantsHarness.writes.length)).toBe(1)
    expect(await page.evaluate(() => window.variantsHarness.writes[0].variants.find((item) => item.title === "First")?.state.search)).toBe("")
    await page.evaluate(() => window.variantsHarness.writes[0].resolve())
    await expect.poll(() => page.evaluate(() => window.variantsHarness.writes.length)).toBe(2)
    expect(await page.evaluate(() => window.variantsHarness.writes[1].variants.find((item) => item.title === "First")?.state.search)).toBe("new value")
    await expect(snapshot(page)).toContainText('"saving":true')
    await page.evaluate(() => window.variantsHarness.writes[1].resolve())
    await expect(snapshot(page)).toContainText('"saving":false')
    await expect(snapshot(page)).toContainText('"error":false')
  })

  test("load rejection unlocks Standard and a later save recovers from a failed write", async ({ page }) => {
    await mount(page)
    await page.evaluate(() => window.variantsHarness.rejectLoad(new Error("Load unavailable")))
    await expect(snapshot(page)).toContainText('"ready":true')
    await expect(snapshot(page)).toContainText('"error":true')
    await expect(snapshot(page)).toContainText('"selectedKey":"standard"')
    await page.evaluate(() => window.variantsHarness.controller.setState({ values: {}, visibleKeys: ["supplier"], search: "recovered" }))
    await expect(snapshot(page)).toContainText('"modified":true')
    await page.evaluate(() => window.variantsHarness.controller.saveVariant({ name: "Recovery", key: null, overwrite: false, def: true, execute: true }))
    await expect.poll(() => page.evaluate(() => window.variantsHarness.writes.length)).toBe(1)
    await page.evaluate(() => window.variantsHarness.writes[0].reject(new Error("Write unavailable")))
    await expect(snapshot(page)).toContainText('"saving":false')
    await expect(snapshot(page)).toContainText('"error":true')
    await page.evaluate(() => window.variantsHarness.controller.manageVariants({ renamed: [{ key: window.variantsHarness.controller.selectedKey, name: "Recovered View" }] }))
    await expect.poll(() => page.evaluate(() => window.variantsHarness.writes.length)).toBe(2)
    await page.evaluate(() => window.variantsHarness.writes[1].resolve())
    await expect(snapshot(page)).toContainText('"saving":false')
    await expect(snapshot(page)).toContainText('"error":false')
    await expect(snapshot(page)).toContainText('"title":"Recovered View"')
    expect(await page.evaluate(() => window.variantsHarness.executions.length)).toBe(1)
  })
})
