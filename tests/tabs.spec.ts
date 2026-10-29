import { expect, test } from "@playwright/test"

// UI5 TabContainer keyboard model: arrows move focus only; Enter (key down) / Space (key up) select.
test.describe("Tabs keyboard and ARIA", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/index.html`)
    await page.waitForSelector("html[data-ready=true]")
  })

  const list = (page: import("@playwright/test").Page) => page.getByRole("tablist", { name: "Order sections" })
  const tab = (page: import("@playwright/test").Page, name: string) => list(page).getByRole("tab", { name })

  test("roles, aria-selected, aria-controls and a single tab stop", async ({ page }) => {
    const tabs = list(page).getByRole("tab")
    await expect(tabs).toHaveCount(5)
    await expect(tab(page, "Info")).toHaveAttribute("aria-selected", "true")
    await expect(tab(page, "12 Items")).toHaveAttribute("aria-selected", "false")
    // Only the selected tab is in the Tab order.
    expect(await tabs.evaluateAll((els) => els.map((e) => e.getAttribute("tabindex")))).toEqual(["0", "-1", "-1", "-1", "-1"])
    // aria-controls of every tab resolves to a tabpanel labelled by that tab.
    for (const t of await tabs.all()) {
      const panelId = await t.getAttribute("aria-controls")
      const panel = page.locator(`[id="${panelId}"]`)
      await expect(panel).toHaveAttribute("role", "tabpanel")
      expect(await panel.getAttribute("aria-labelledby")).toBe(await t.getAttribute("id"))
    }
    const selectedPanel = page.getByRole("tabpanel")
    await expect(selectedPanel.filter({ hasText: "General information" })).toBeVisible()
    await expect(tab(page, "Approvals Positive")).toBeVisible() // design is part of the accessible name
    await expect(tab(page, "Locked")).toHaveAttribute("aria-disabled", "true")
  })

  test("arrow keys move focus without selecting; Enter selects", async ({ page }) => {
    await tab(page, "Info").focus()
    await page.keyboard.press("ArrowRight")
    await expect(tab(page, "12 Items")).toBeFocused()
    await expect(tab(page, "Info")).toHaveAttribute("aria-selected", "true")
    await expect(tab(page, "12 Items")).toHaveAttribute("tabindex", "0")
    await page.keyboard.press("Enter")
    await expect(tab(page, "12 Items")).toHaveAttribute("aria-selected", "true")
    await expect(page.getByRole("tabpanel").filter({ hasText: "12 line items." })).toBeVisible()
    await page.keyboard.press("ArrowLeft")
    await expect(tab(page, "Info")).toBeFocused()
    await page.keyboard.press("ArrowLeft") // no wrap-around
    await expect(tab(page, "Info")).toBeFocused()
  })

  test("Home/End, Space selects on key up, disabled tabs are focusable but not selectable", async ({ page }) => {
    await tab(page, "Info").focus()
    await page.keyboard.press("End")
    await expect(tab(page, "Notes")).toBeFocused()
    await page.keyboard.press("Space")
    await expect(tab(page, "Notes")).toHaveAttribute("aria-selected", "true")
    await page.keyboard.press("ArrowLeft")
    await expect(tab(page, "Locked")).toBeFocused()
    await page.keyboard.press("Enter")
    await page.keyboard.press("Space")
    await expect(tab(page, "Locked")).toHaveAttribute("aria-selected", "false")
    await expect(tab(page, "Notes")).toHaveAttribute("aria-selected", "true")
    await page.keyboard.press("Home")
    await expect(tab(page, "Info")).toBeFocused()
  })

  test("Space down alone does not select (UI5 selects on key up)", async ({ page }) => {
    await tab(page, "Info").focus()
    await page.keyboard.press("ArrowRight")
    await page.keyboard.down(" ")
    await expect(tab(page, "12 Items")).toHaveAttribute("aria-selected", "false")
    await page.keyboard.up(" ")
    await expect(tab(page, "12 Items")).toHaveAttribute("aria-selected", "true")
  })

  test("leaving the strip and tabbing back lands on the selected tab", async ({ page }) => {
    await tab(page, "Info").focus()
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowRight")
    await expect(tab(page, "Approvals Positive")).toBeFocused()
    await page.keyboard.press("Tab")
    await page.keyboard.press("Shift+Tab")
    await expect(tab(page, "Info")).toBeFocused()
  })

  test("clicking selects; clicking a disabled tab does nothing", async ({ page }) => {
    await tab(page, "12 Items").click()
    await expect(tab(page, "12 Items")).toHaveAttribute("aria-selected", "true")
    await tab(page, "Locked").click({ force: true }) // aria-disabled: Playwright would wait for it to be enabled
    await expect(tab(page, "12 Items")).toHaveAttribute("aria-selected", "true")
  })

  test("focus ring only for keyboard focus", async ({ page }) => {
    const info = tab(page, "Info")
    await info.click()
    const ring = () => info.locator(".fiori-tab__text").evaluate((el) => getComputedStyle(el, "::before").content)
    expect(await ring()).toBe("none")
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowLeft")
    expect(await ring()).not.toBe("none")
  })
})
