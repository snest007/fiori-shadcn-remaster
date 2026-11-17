import { expect, test, type FrameLocator, type Page } from "@playwright/test"

// Docs pages render `inline: false` stories in a lazy child iframe whose URL carries no
// globals (addon-docs getStoryHref). Before the fix the child booted in Morning Horizon and
// its SET_GLOBALS reset the Docs document too. Drive the real manager toolbar, not URL
// globals, so the same path a person uses is covered.
const DOCS = "/?path=/docs/forms-select--docs"
const CHILD = "iframe[id='iframe--forms-select--open']"

async function pickTheme(page: Page, docs: FrameLocator, title: string, value: string) {
  await page.getByRole("button", { name: /Horizon theme/ }).click()
  await page.getByRole("button", { name: title, exact: true }).or(page.getByText(title, { exact: true })).first().click()
  await expect(docs.locator("html")).toHaveAttribute("data-theme", value)
  // A globals change re-renders the Docs page, which replaces the child iframe elements.
  // Wait for that re-render to settle before touching them: the docs content is back and
  // the child host is attached in the new tree.
  await expect(docs.locator(".sbdocs-content").first()).toBeVisible()
  await expect(docs.locator(CHILD)).toBeAttached()
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
