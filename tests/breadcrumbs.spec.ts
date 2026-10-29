import { expect, test } from "@playwright/test"

test.describe("Breadcrumbs keyboard and ARIA", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/index.html`)
    await page.waitForSelector("html[data-ready=true]")
  })

  test("nav landmark, ordered list, current location", async ({ page }) => {
    const nav = page.locator("#demo-breadcrumbs")
    await expect(nav).toHaveRole("navigation")
    await expect(nav).toHaveAttribute("aria-label", "Breadcrumb Trail")
    await expect(nav.getByRole("listitem")).toHaveCount(4)
    await expect(nav.getByRole("link")).toHaveCount(3)
    await expect(nav.getByRole("link", { name: "Home 1 of 4" })).toBeVisible()
    const current = nav.locator('[aria-current="page"]')
    await expect(current).toHaveText("Notebook 15")
    await expect(current).toHaveAttribute("aria-label", "Notebook 15 4 of 4")
    // Separators are decorative.
    await expect(nav.locator(".fiori-breadcrumbs__separator").first()).toHaveAttribute("aria-hidden", "true")
  })

  test("single tab stop, arrows/Home/End move between items, current location is focusable", async ({ page }) => {
    const nav = page.locator("#demo-breadcrumbs")
    const home = nav.getByRole("link", { name: /^Home/ })
    const tabIndexes = () => nav.locator("[data-breadcrumbs-focus]").evaluateAll((els) => els.map((e) => e.getAttribute("tabindex")))
    expect(await tabIndexes()).toEqual(["0", "-1", "-1", "-1"])
    await home.focus()
    await page.keyboard.press("ArrowRight")
    await expect(nav.getByRole("link", { name: /^Products/ })).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(nav.getByRole("link", { name: /^Laptops/ })).toBeFocused()
    await page.keyboard.press("End")
    await expect(nav.locator('[aria-current="page"]')).toBeFocused()
    await page.keyboard.press("ArrowRight") // no wrap-around
    await expect(nav.locator('[aria-current="page"]')).toBeFocused()
    expect(await tabIndexes()).toEqual(["-1", "-1", "-1", "0"])
    await page.keyboard.press("Home")
    await expect(home).toBeFocused()
    await page.keyboard.press("ArrowUp")
    await expect(home).toBeFocused()
  })

  test("Enter and Space activate a link", async ({ page }) => {
    const nav = page.locator("#demo-breadcrumbs")
    await nav.getByRole("link", { name: /^Products/ }).focus()
    await page.keyboard.press("Enter")
    await expect(page.locator("#demo-breadcrumbs-last")).toHaveText("Products")
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("Space")
    await expect(page.locator("#demo-breadcrumbs-last")).toHaveText("Laptops")
  })
})
