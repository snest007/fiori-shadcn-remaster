import { expect, test } from "@playwright/test"

// UI5 Toolbar: every item keeps its own Tab stop; ←/→ move to the previous/next enabled item,
// Home/End to the first/last; text fields keep the arrows until the caret reaches their edge.
test.describe("Toolbar keyboard and ARIA", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/index.html`)
    await page.waitForSelector("html[data-ready=true]")
  })

  test("role toolbar with a name; separator is a vertical separator", async ({ page }) => {
    const toolbar = page.getByRole("toolbar", { name: "Product actions" })
    await expect(toolbar).toBeVisible()
    await expect(toolbar.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical")
  })

  test("arrow keys, Home and End move focus between enabled items", async ({ page }) => {
    const toolbar = page.getByRole("toolbar", { name: "Product actions" })
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
    await page.keyboard.press("ArrowLeft")
    await page.keyboard.press("ArrowLeft")
    await expect(filter).toBeFocused()
    // Items remain separate Tab stops.
    await page.keyboard.press("Tab")
    await expect(btn("Add")).toBeFocused()
  })

  test("a text field keeps arrows and Home/End until the caret is at its edge", async ({ page }) => {
    const toolbar = page.getByRole("toolbar", { name: "Product actions" })
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
