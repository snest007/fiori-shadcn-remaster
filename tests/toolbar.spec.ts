import { expect, test } from "@playwright/test"

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
    const popover = page.getByRole("dialog", { name: "Available actions" })
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
    const popover = page.getByRole("dialog", { name: "Available actions" })
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
      const popover = page.getByRole("dialog", { name: "Available actions" })
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
    const popover = page.getByRole("dialog", { name: "Available actions" })
    const overflowField = popover.getByRole("textbox", { name: "Overflow filter" })
    await expect(overflowField).toHaveValue("retained value")
    expect(await overflowField.evaluate((element) => (window as any).__toolbarField === element)).toBe(true)
    await overflowField.fill("changed in overflow")
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
    const popover = page.getByRole("dialog", { name: "Available actions" })
    const overflowView = popover.getByRole("combobox", { name: "Overflow view" })
    await expect(overflowView).toHaveText("My products")
    await overflowView.click()
    // Select's modal picker temporarily aria-hides the outer surface. It remains painted.
    await expect(page.locator("[data-slot=popover-content][aria-label='Available actions']")).toBeVisible()
    await page.getByRole("option", { name: "All products", exact: true }).click()
    await expect(page.locator("#demo-toolbar-last")).toHaveText("all")
    await expect(popover).toBeHidden()
    await expect(trigger).toBeFocused()
    await toolbar.evaluate((element) => { element.style.width = "24rem" })
    await expect(view).toBeVisible()
    await expect(view).toHaveText("All products")
  })
})
