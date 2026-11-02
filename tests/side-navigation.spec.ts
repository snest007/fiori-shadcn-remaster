import { expect, test, type Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
})

const nav = (page: Page) => page.locator("#side-navigation-demo")
const item = (page: Page, name: string) => nav(page).getByRole("treeitem", { name, exact: true })
const value = (page: Page) => page.getByTestId("side-navigation-demo-value")

test("expanded mode is a navigation landmark with two trees", async ({ page }) => {
  await expect(nav(page).getByRole("navigation", { name: "Main navigation" })).toBeVisible()
  await expect(nav(page).getByRole("tree", { name: "Primary Navigation Menu" })).toBeVisible()
  await expect(nav(page).getByRole("tree", { name: "Footer Navigation Menu" })).toBeVisible()
  await expect(item(page, "Home")).toHaveAttribute("aria-current", "page")
  await expect(item(page, "People")).toHaveAttribute("aria-expanded", "true")
  await expect(item(page, "Events")).toHaveAttribute("aria-expanded", "false")
  await expect(item(page, "Locations")).toHaveAttribute("aria-disabled", "true")
})

test("roving focus: Tab enters at the selected item, arrows / Home / End move", async ({ page }) => {
  await page.locator("#side-navigation-demo-toggle").focus()
  await page.keyboard.press("Tab")
  await expect(item(page, "Home")).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(item(page, "Organization")).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(item(page, "People")).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(item(page, "From My Team")).toBeFocused()
  await page.keyboard.press("End")
  await expect(item(page, "SAP Community")).toBeFocused()
  await page.keyboard.press("Home")
  await expect(item(page, "Home")).toBeFocused()
  await page.keyboard.press("ArrowUp")
  await expect(item(page, "Home")).toBeFocused()
  // The fixed list is its own tab stop.
  await page.keyboard.press("Tab")
  await expect(item(page, "Legal")).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(item(page, "Settings")).toBeFocused()
})

test("→ / ← expand and collapse items and groups", async ({ page }) => {
  await item(page, "Home").focus()
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("ArrowLeft")
  await expect(item(page, "Organization")).toHaveAttribute("aria-expanded", "false")
  await expect(item(page, "People")).toHaveCount(0)
  await page.keyboard.press("ArrowRight")
  await expect(item(page, "Organization")).toHaveAttribute("aria-expanded", "true")
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("ArrowLeft")
  await expect(item(page, "People")).toHaveAttribute("aria-expanded", "false")
  await expect(item(page, "From My Team")).toHaveCount(0)
  await page.keyboard.press("ArrowRight")
  await expect(item(page, "From My Team")).toBeVisible()
})

test("Enter and Space select; clicking the arrow only toggles", async ({ page }) => {
  await item(page, "Home").focus()
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Enter")
  await expect(value(page)).toHaveText("people")
  await expect(item(page, "People")).toHaveAttribute("aria-current", "page")
  await expect(item(page, "Home")).not.toHaveAttribute("aria-current", "page")
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Space")
  await expect(value(page)).toHaveText("team")
  await item(page, "Events").getByRole("img", { name: "Expand" }).click()
  await expect(item(page, "Events")).toHaveAttribute("aria-expanded", "true")
  await expect(value(page)).toHaveText("team")
})

test("disabled and unselectable items are not selected", async ({ page }) => {
  await item(page, "Locations").click({ force: true })
  await expect(value(page)).toHaveText("home")
  // An unselectable parent toggles on click instead.
  await item(page, "Legal").click()
  await expect(item(page, "Legal")).toHaveAttribute("aria-expanded", "true")
  await expect(value(page)).toHaveText("home")
  await item(page, "Privacy").click()
  await expect(value(page)).toHaveText("privacy")
})

test("item with href is a link and opens in a new tab", async ({ page }) => {
  const link = item(page, "SAP Community")
  await expect(link).toHaveAttribute("href", "https://community.sap.com")
  await expect(link).toHaveAttribute("target", "_blank")
  expect(await link.evaluate((el) => el.tagName)).toBe("A")
})

test.describe("collapsed", () => {
  test.beforeEach(async ({ page }) => {
    await page.locator("#side-navigation-demo-toggle").click()
  })

  test("is a vertical menubar of icon items", async ({ page }) => {
    const bar = nav(page).getByRole("menubar", { name: "Primary Navigation Menu" })
    await expect(bar).toHaveAttribute("aria-orientation", "vertical")
    await expect(bar.getByRole("menuitemradio", { name: "Home" })).toHaveAttribute("aria-checked", "true")
    await expect(bar.getByRole("menuitemradio", { name: "Events" })).toHaveAttribute("aria-haspopup", "tree")
    await expect(nav(page).getByRole("treeitem")).toHaveCount(0)
    // Width animates (0.3s) to --fiori-side-navigation-collapsed-width.
    await expect.poll(() => nav(page).locator("[data-slot=side-navigation]").evaluate((el) => el.getBoundingClientRect().width)).toBe(64)
  })

  test("an item with sub-items opens a popover tree; selecting closes it", async ({ page }) => {
    const events = nav(page).getByRole("menuitemradio", { name: "Events" })
    await events.click()
    await expect(events).toHaveAttribute("aria-expanded", "true")
    const pop = page.getByRole("dialog", { name: "Navigation" })
    await expect(pop.getByRole("treeitem", { name: "Events" })).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(pop.getByRole("treeitem", { name: "Local" })).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(pop).toHaveCount(0)
    await expect(value(page)).toHaveText("local")
    await expect(events).toHaveAttribute("aria-checked", "true")
    await expect(events).toBeFocused()
  })

  test("keyboard: → opens the popover, Escape and ← close it", async ({ page }) => {
    const events = nav(page).getByRole("menuitemradio", { name: "Events" })
    await nav(page).getByRole("menuitemradio", { name: "Home" }).focus()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    await expect(nav(page).getByRole("menuitemradio", { name: "Locations" })).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(events).toBeFocused()
    await page.keyboard.press("ArrowRight")
    const pop = page.getByRole("dialog", { name: "Navigation" })
    await expect(pop).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(pop).toHaveCount(0)
    await expect(events).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(pop).toBeVisible()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowLeft")
    await expect(pop).toHaveCount(0)
    await expect(events).toBeFocused()
  })

  test("an unselectable parent's popover starts at its first sub-item", async ({ page }) => {
    await nav(page).getByRole("menuitem", { name: "Legal" }).click()
    const pop = page.getByRole("dialog", { name: "Navigation" })
    await expect(pop.getByRole("treeitem", { name: "Terms of use" })).toBeFocused()
    await page.keyboard.press("ArrowUp")
    await expect(pop.getByRole("treeitem", { name: "Terms of use" })).toBeFocused()
  })
})
