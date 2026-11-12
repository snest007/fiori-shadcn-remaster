import { expect, test, type Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/object-page`)
  await page.waitForSelector("html[data-ready=true]")
  await page.locator("#object-page-demo").scrollIntoViewIfNeeded()
})

const op = (page: Page) => page.locator("#object-page-demo")
const scroller = (page: Page) => op(page).locator(".fiori-dynamic-page__scroll").first()
const tab = (page: Page, name: string) => op(page).getByRole("tablist", { name: "Page Sections" }).getByRole("tab", { name })

/** Top of a section relative to the bottom edge of the sticky title + navigation bar. */
async function offsetBelowSticky(page: Page, section: string) {
  return op(page).evaluate((root, id) => {
    const s = root.querySelector<HTMLElement>(`[data-section="${id}"][data-slot=object-page-section]`)!
    const bar = root.querySelector<HTMLElement>("[data-slot=dynamic-page-subheader]")!
    return s.getBoundingClientRect().top - bar.getBoundingClientRect().bottom
  }, section)
}

test("object-page: navigation bar is a tablist; sections are labelled regions", async ({ page }) => {
  await expect(tab(page, "General Information")).toHaveAttribute("aria-selected", "true")
  await expect(op(page).getByRole("region", { name: "Assembly Options" })).toBeVisible()
  // The first section's title is visually hidden in anchor mode (the bar names it) but still labels the section.
  await expect(op(page).getByRole("region", { name: "General Information" })).toBeVisible()
  await expect(op(page).getByRole("group", { name: "Status" })).toContainText("Delivery")
})

test("object-page: clicking a tab scrolls its section below the sticky bar and snaps the header", async ({ page }) => {
  await tab(page, "Contact Information").click()
  await expect(tab(page, "Contact Information")).toHaveAttribute("aria-selected", "true")
  await expect(op(page)).toHaveAttribute("data-header-snapped", "")
  await expect.poll(() => offsetBelowSticky(page, "contact")).toBeLessThanOrEqual(1)
  await expect.poll(() => offsetBelowSticky(page, "contact")).toBeGreaterThanOrEqual(-1)
  await expect(page.locator("#object-page-demo-selected")).toHaveText("contact")
  // Back to the first section: the page scrolls to the top and the header expands again.
  await tab(page, "General Information").click()
  await expect.poll(() => scroller(page).evaluate((e) => e.scrollTop)).toBe(0)
  await expect(op(page)).not.toHaveAttribute("data-header-snapped")
})

test("object-page: scroll spy updates the selected tab", async ({ page }) => {
  const top = await op(page).evaluate((root) => {
    const c = root.querySelector<HTMLElement>(".fiori-dynamic-page__scroll")!
    const s = root.querySelector<HTMLElement>('[data-section="assembly"][data-slot=object-page-section]')!
    return s.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop
  })
  await scroller(page).hover()
  await page.mouse.wheel(0, top)
  await expect(tab(page, "Assembly Options")).toHaveAttribute("aria-selected", "true")
  await page.mouse.wheel(0, 5000)
  await expect(tab(page, "Contact Information")).toHaveAttribute("aria-selected", "true")
  await page.mouse.wheel(0, -10000)
  await expect(tab(page, "General Information")).toHaveAttribute("aria-selected", "true")
})

test("object-page: keyboard on the navigation bar (arrows move, Enter selects)", async ({ page }) => {
  await tab(page, "General Information").focus()
  await page.keyboard.press("ArrowRight")
  await expect(tab(page, "Assembly Options")).toBeFocused()
  await expect(tab(page, "General Information")).toHaveAttribute("aria-selected", "true")
  await page.keyboard.press("End")
  await expect(tab(page, "Contact Information")).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(tab(page, "Contact Information")).toHaveAttribute("aria-selected", "true")
  await expect.poll(() => offsetBelowSticky(page, "contact")).toBeLessThanOrEqual(1)
})

test("object-page: tabs mode shows only the selected section", async ({ page }) => {
  await page.locator("#object-page-demo-tabs").click()
  await expect(op(page)).toHaveAttribute("data-mode", "tabs")
  await tab(page, "Assembly Options").click()
  await expect(op(page).getByRole("region", { name: "Configuration" })).toBeVisible()
  await expect(op(page).getByText("589946637")).toHaveCount(0)
  await expect(op(page).locator('[data-section="general"][data-slot=object-page-section]')).toBeHidden()
  // Every tab still controls an element in the DOM.
  for (const name of ["General Information", "Assembly Options", "Contact Information"]) {
    const controls = await tab(page, name).getAttribute("aria-controls")
    await expect(page.locator(`[id="${controls}"]`)).toHaveCount(1)
  }
})
