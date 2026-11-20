import { expect, test, type FrameLocator, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"

// Docs pages render `inline: false` stories in a lazy child iframe whose URL carries no
// globals (addon-docs getStoryHref). Before the fix the child booted in Morning Horizon and
// its SET_GLOBALS reset the Docs document too. Drive the real manager toolbar, not URL
// globals, so the same path a person uses is covered.
const DOCS = "/?path=/docs/forms-select--docs"
const CHILD = "iframe[id='iframe--forms-select--open']"

async function pickTheme(page: Page, docs: FrameLocator, title: string, value: string, childHost = CHILD) {
  await page.getByRole("button", { name: /Horizon theme/ }).click()
  await page.getByRole("button", { name: title, exact: true }).or(page.getByText(title, { exact: true })).first().click()
  await expect(docs.locator("html")).toHaveAttribute("data-theme", value)
  // A globals change re-renders the Docs page, which replaces the child iframe elements.
  // Wait for that re-render to settle before touching them: the docs content is back and
  // the child host is attached in the new tree.
  await expect(docs.locator(".sbdocs-content").first()).toBeVisible()
  await expect(docs.locator(childHost)).toBeAttached()
}

async function mountedChild(docs: FrameLocator, theme: string) {
  // Re-query on every attempt (a locator, not a held element), and scroll until the lazy
  // child has rendered its canvas in the expected theme.
  const child = docs.frameLocator(CHILD)
  await expect(async () => {
    await docs.locator(CHILD).scrollIntoViewIfNeeded({ timeout: 1000 })
    await expect(child.locator("[data-fiori-story]")).toHaveAttribute("data-theme", theme, { timeout: 1000 })
  }).toPass()
  return child
}

test("docs child story iframe follows the toolbar theme and doesn't reset the docs page", async ({ page }) => {
  await page.goto(DOCS)
  const docs = page.frameLocator("#storybook-preview-iframe")
  await expect(docs.locator(".sbdocs-content").first()).toBeVisible()

  await pickTheme(page, docs, "High Contrast Black", "sap_horizon_hcb")
  const child = await mountedChild(docs, "sap_horizon_hcb")
  await expect(child.locator("html")).toHaveAttribute("data-theme", "sap_horizon_hcb")
  // The child's own boot globals must not have reset the docs document.
  await expect(docs.locator("html")).toHaveAttribute("data-theme", "sap_horizon_hcb")
  await expect(page).toHaveURL(/globals=[^&]*theme:sap_horizon_hcb/)

  // A later switch reaches an already-mounted child as well.
  await pickTheme(page, docs, "Evening Horizon", "sap_horizon_dark")
  const after = await mountedChild(docs, "sap_horizon_dark")
  await expect(after.locator("html")).toHaveAttribute("data-theme", "sap_horizon_dark")
  await expect(docs.locator("html")).toHaveAttribute("data-theme", "sap_horizon_dark")
})

test("a standalone story keeps its own URL globals", async ({ page }) => {
  // No docs parent: the inheritance path must not apply.
  await page.goto("/iframe.html?viewMode=story&id=forms-select--open&globals=theme:sap_horizon_hcw")
  await expect(page.locator("[data-fiori-story]")).toHaveAttribute("data-theme", "sap_horizon_hcw")
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sap_horizon_hcw")
})

test("switching the theme with a mounted docs child raises no preview errors", async ({ page }) => {
  // A child re-rendered outside Storybook's own render cycle loses its hooks context
  // ("Storybook preview hooks can only be called inside decorators and story functions").
  // Collect errors from every frame, including the lazy child.
  const errors: string[] = []
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()) })
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto(DOCS)
  const docs = page.frameLocator("#storybook-preview-iframe")
  await expect(docs.locator(".sbdocs-content").first()).toBeVisible()
  await pickTheme(page, docs, "High Contrast Black", "sap_horizon_hcb")
  await mountedChild(docs, "sap_horizon_hcb")
  await pickTheme(page, docs, "Evening Horizon", "sap_horizon_dark")
  await mountedChild(docs, "sap_horizon_dark")
  expect(errors.filter((text) => /hooks can only be called|Error rendering story/.test(text))).toEqual([])
})

test("a docs child story keeps its own explicit globals and inherits the rest", async ({ page }) => {
  // Dialog RTL declares `globals: { dir: "rtl" }` and renders `inline: false`. Story globals
  // win over the docs frame's toolbar values; the toolbar still supplies the theme.
  const RTL_CHILD = "iframe[id='iframe--overlays-dialog--rtl']"
  await page.goto("/?path=/docs/overlays-dialog--docs")
  const docs = page.frameLocator("#storybook-preview-iframe")
  await expect(docs.locator(".sbdocs-content").first()).toBeVisible()
  await pickTheme(page, docs, "High Contrast Black", "sap_horizon_hcb", RTL_CHILD)
  const child = docs.frameLocator(RTL_CHILD)
  await expect(async () => {
    await docs.locator(RTL_CHILD).scrollIntoViewIfNeeded({ timeout: 1000 })
    await expect(child.locator("[data-fiori-story]")).toHaveAttribute("data-theme", "sap_horizon_hcb", { timeout: 1000 })
  }).toPass()
  await expect(child.locator("[data-fiori-story]")).toHaveAttribute("dir", "rtl")
  await expect(child.locator("html")).toHaveAttribute("dir", "rtl")
  await expect(child.locator("html")).toHaveAttribute("data-theme", "sap_horizon_hcb")
  // The docs page itself stays on the toolbar direction.
  await expect(docs.locator("html")).toHaveAttribute("dir", "ltr")
})

test("Docs Open child inherits the toolbar locale and retains German text when theme changes", async ({ page }) => {
  const de = JSON.parse(readFileSync(new URL("../registry/i18n/de.json", import.meta.url), "utf8"))
  await page.goto(DOCS)
  const docs = page.frameLocator("#storybook-preview-iframe")
  await expect(docs.locator(".sbdocs-content").first()).toBeVisible()
  await page.getByRole("button", { name: /^Locale and SAP translations / }).click()
  await page.getByText("Deutsch", { exact: true }).click()
  await expect(page.getByRole("button", { name: /^Locale and SAP translations / })).toHaveAccessibleName("Locale and SAP translations Deutsch")
  const child = await mountedChild(docs, "sap_horizon")
  // The open popup hides its trigger from the tree; inspect the owned host's text
  // attributes while the actual Open story stays open.
  await expect(child.locator('[data-slot="select-trigger"]')).toHaveAttribute("aria-roledescription", de.SELECT_ROLE_DESCRIPTION)
  await expect(child.locator('[data-slot="select-trigger"]')).toHaveAccessibleDescription(de.SELECT_OPTIONS_IN_GROUPS.replace("{0}", "4").replace("{1}", "1"))
  await expect(page).toHaveURL(/globals=[^&]*locale:de/)

  await pickTheme(page, docs, "High Contrast Black", "sap_horizon_hcb")
  const after = await mountedChild(docs, "sap_horizon_hcb")
  await expect(after.locator('[data-slot="select-trigger"]')).toHaveAttribute("aria-roledescription", de.SELECT_ROLE_DESCRIPTION)
  await expect(docs.locator("html")).toHaveAttribute("data-theme", "sap_horizon_hcb")
})
