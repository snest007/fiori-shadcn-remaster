import { expect, test } from "@playwright/test"

// The app-shell block with a real SideNavigation in its slot (the two were built in parallel).
test.beforeEach(async ({ page }) => {
  await page.goto(`/block.html?name=launchpad`)
  await page.waitForSelector("html[data-ready=true]")
})

test("launchpad: the side navigation drives the page", async ({ page }) => {
  const nav = page.locator("[data-slot=launchpad-navigation]")
  const pageTitle = page.locator("[data-slot=launchpad-page] h2")
  await expect(pageTitle).toHaveText("Home")
  await nav.getByText("Products", { exact: true }).click()
  await expect(pageTitle).toHaveText("Products")
  await nav.getByText("Active customers", { exact: true }).click()
  await expect(pageTitle).toHaveText("Active customers")
})

test("launchpad: the shell bar's menu button collapses and expands the side navigation", async ({ page }) => {
  const nav = page.locator("[data-slot=launchpad-navigation] [data-slot=side-navigation]").first()
  const toggle = page.getByRole("button", { name: "Collapse navigation" })
  const expandedWidth = (await nav.boundingBox())!.width
  await toggle.click()
  await expect(page.getByRole("button", { name: "Expand navigation" })).toHaveAttribute("aria-expanded", "false")
  await expect.poll(async () => (await nav.boundingBox())!.width).toBeLessThan(expandedWidth)
  // Collapsed: still navigable (icons), and the page follows.
  await page.locator("[data-slot=launchpad-navigation]").getByRole("menuitemradio", { name: /Home/ }).click()
  await expect(page.locator("[data-slot=launchpad-page] h2")).toHaveText("Home")
  await page.getByRole("button", { name: "Expand navigation" }).click()
  await expect.poll(async () => (await nav.boundingBox())!.width).toBe(expandedWidth)
})
