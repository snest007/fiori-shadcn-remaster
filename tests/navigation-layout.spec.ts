import { expect, test, type Page } from "@playwright/test"

const demo = (page: Page) => page.locator("#navigation-layout-demo")
const sideNav = (page: Page) => demo(page).locator("[data-slot=side-navigation]")
const toggle = (page: Page) => demo(page).getByRole("button", { name: "Toggle navigation" })

test("auto mode is expanded on wide screens; the menu button collapses it", async ({ page }) => {
  await page.goto(`/index.html#/navigation-layout`)
  await page.waitForSelector("html[data-ready=true]")
  await expect(sideNav(page)).not.toHaveAttribute("data-collapsed")
  await expect(demo(page).getByRole("tree", { name: "Primary Navigation Menu" })).toBeVisible()
  await toggle(page).click()
  await expect(sideNav(page)).toHaveAttribute("data-collapsed", "")
  await expect(demo(page).getByRole("menubar", { name: "Primary Navigation Menu" })).toBeVisible()
  await toggle(page).click()
  await expect(sideNav(page)).not.toHaveAttribute("data-collapsed")
})

test("small screens: collapsed by default, expanded covers the content, choosing an item collapses", async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 800 })
  await page.goto(`/index.html#/navigation-layout`)
  await page.waitForSelector("html[data-ready=true]")
  const aside = demo(page).locator("aside")
  await expect(sideNav(page)).toHaveAttribute("data-collapsed", "")
  // Slid out of view (and inert) while collapsed.
  await expect.poll(() => aside.evaluate((el) => el.getBoundingClientRect().right <= el.parentElement!.getBoundingClientRect().left + 1)).toBe(true)
  await toggle(page).click()
  await expect(sideNav(page)).not.toHaveAttribute("data-collapsed")
  await expect
    .poll(() => aside.evaluate((el) => Math.round(el.getBoundingClientRect().width) === Math.round(el.parentElement!.getBoundingClientRect().width)))
    .toBe(true)
  await demo(page).getByRole("treeitem", { name: "Products" }).click()
  await expect(page.getByTestId("navigation-layout-demo-page")).toHaveText("products")
  await expect(sideNav(page)).toHaveAttribute("data-collapsed", "")
})
