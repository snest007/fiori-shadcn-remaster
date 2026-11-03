import { expect, test } from "@playwright/test"

// UI5 TabContainer keyboard model: arrows move focus only; Enter (key down) / Space (key up) select.
test.describe("Tabs keyboard and ARIA", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/index.html`)
    await page.waitForSelector("html[data-ready=true]")
  })

  const list = (page: import("@playwright/test").Page) => page.locator("#tabs-demo").getByRole("tablist", { name: "Order sections", exact: true })
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


test.describe("Tabs responsive overflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/index.html")
    await page.waitForSelector("html[data-ready=true]")
  })
  const root = (page: import("@playwright/test").Page) => page.locator("#tabs-overflow-demo")
  const more = (page: import("@playwright/test").Page) => root(page).getByRole("button", { name: "More", exact: true })
  const menu = (page: import("@playwright/test").Page) => page.getByRole("dialog", { name: "Hidden order sections" })
  const narrow = async (page: import("@playwright/test").Page) => {
    await root(page).evaluate((el) => { el.style.maxWidth = "none"; el.style.width = "30rem" })
    await expect(more(page)).toBeVisible()
  }

  test("resize adds and removes overflow, keeping the selected tab visible", async ({ page }) => {
    await root(page).evaluate((el) => { el.style.maxWidth = "none"; el.style.width = "100rem" })
    await expect(more(page)).toHaveCount(0)
    await expect(root(page).getByRole("tab")).toHaveCount(10)
    await narrow(page)
    await expect(root(page).getByRole("tab", { name: "Section 3", exact: true })).toHaveAttribute("aria-selected", "true")
    await root(page).locator("#tabs-select-last").click()
    await expect(root(page).getByRole("tab", { name: "Section 10", exact: true })).toHaveAttribute("aria-selected", "true")
    await root(page).evaluate((el) => { el.style.width = "100rem" })
    await expect(more(page)).toHaveCount(0)
    await expect(root(page).getByRole("tab")).toHaveCount(10)
  })

  test("choosing a hidden tab closes the list and focuses the selected tab", async ({ page }) => {
    await narrow(page)
    await more(page).click()
    await expect(menu(page)).toBeVisible()
    await menu(page).locator('[data-nav-key="section-10"]').click()
    const selected = root(page).getByRole("tab", { name: "Section 10", exact: true })
    await expect(menu(page)).toHaveCount(0)
    await expect(selected).toHaveAttribute("aria-selected", "true")
    await expect(selected).toBeFocused()
  })

  test("arrows reach the overflow control, Enter opens, Down/Enter select, Escape restores focus", async ({ page }) => {
    await narrow(page)
    await root(page).getByRole("tab").last().focus()
    await page.keyboard.press("ArrowRight")
    await expect(more(page)).toBeFocused()
    expect(await more(page).evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe("none")
    await page.keyboard.press("Enter")
    await expect(menu(page)).toBeVisible()
    const items = menu(page).getByRole("listitem")
    await expect(items.first()).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(items.nth(1)).toBeFocused()
    const selectedText = (await items.nth(1).locator(".fiori-tabs__overflow-content").innerText()).trim()
    await page.keyboard.press("Enter")
    const selected = root(page).getByRole("tab", { name: selectedText, exact: true })
    await expect(selected).toHaveAttribute("aria-selected", "true")
    await expect(selected).toBeFocused()
    await more(page).focus()
    await page.keyboard.press("ArrowDown")
    await expect(menu(page)).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(menu(page)).toHaveCount(0)
    await expect(more(page)).toBeFocused()
  })

  test("Space opens the overflow and selects on key up; disabled overflow tabs cannot select", async ({ page }) => {
    await narrow(page)
    await more(page).focus()
    await page.keyboard.press("Space")
    await expect(menu(page)).toBeVisible()
    const disabled = menu(page).locator('[data-nav-key="section-8"]')
    await expect(disabled).toHaveAttribute("aria-disabled", "true")
    await disabled.click({ force: true })
    await expect(menu(page)).toBeVisible()
    await expect(root(page).getByRole("tab", { name: "Section 3", exact: true })).toHaveAttribute("aria-selected", "true")
    const first = menu(page).getByRole("listitem").first()
    const name = (await first.locator(".fiori-tabs__overflow-content").innerText()).trim()
    await first.focus()
    await expect(first).toBeFocused()
    await page.keyboard.down(" ")
    await expect(menu(page)).toBeVisible()
    await page.keyboard.up(" ")
    await expect(root(page).getByRole("tab", { name, exact: true })).toHaveAttribute("aria-selected", "true")
    await expect(menu(page)).toHaveCount(0)
  })

  test("StartAndEnd counts hidden tabs and preserves their order, including after start selection", async ({ page }) => {
    const sections = page.locator("#tabs-start-end-demo")
    const start = sections.locator('[data-tabs-overflow-button="start"]')
    const end = sections.locator('[data-tabs-overflow-button="end"]')
    await expect(start).toBeVisible()
    await expect(end).toBeVisible()
    const visible = await sections.getByRole("tab").allTextContents()
    expect(visible).toEqual([...visible].sort((a, b) => Number(a.split(" ")[1]) - Number(b.split(" ")[1])))
    await start.click()
    const popup = page.getByRole("dialog", { name: "Hidden mailbox sections" })
    const hidden = await popup.getByRole("listitem").allTextContents()
    expect(await start.innerText()).toBe(`+${hidden.length}`)
    await popup.locator('[data-nav-key="section-1"]').click()
    await expect(sections.getByRole("tab", { name: "Section 1", exact: true })).toBeFocused()
    await expect(sections.getByRole("tab", { name: "Section 1", exact: true })).toHaveAttribute("aria-selected", "true")
  })

  test("custom overflow controls retain their accessible text and open the correct list", async ({ page }) => {
    const sections = page.locator("#tabs-custom-overflow-demo")
    const button = sections.getByRole("button", { name: "Choose sections" })
    await expect(button).toHaveAttribute("title", "Choose a section")
    // TabContainer.css.js applies the same 1.5rem pill geometry to custom UI5 buttons.
    expect(await button.evaluate((el) => el.getBoundingClientRect().height)).toBe(24)
    await button.click()
    const popup = page.getByRole("dialog", { name: "Custom hidden sections" })
    await expect(popup).toBeVisible()
    await popup.locator('[data-nav-key="section-10"]').click()
    await expect(sections.getByRole("tab", { name: "Section 10", exact: true })).toBeFocused()
  })

  test("resize closes an open menu and restores its opener", async ({ page }) => {
    await narrow(page)
    await more(page).click()
    await expect(menu(page)).toBeVisible()
    await root(page).evaluate((el) => { el.style.width = "32rem" })
    await expect(menu(page)).toHaveCount(0)
    await expect(more(page)).toBeFocused()
  })

  test("custom start control anchors its own menu and Escape returns to that control", async ({ page }) => {
    const sections = page.locator("#tabs-custom-overflow-demo")
    const start = sections.getByRole("button", { name: "Previous sections" })
    const end = sections.getByRole("button", { name: "Choose sections" })
    await start.click()
    const popup = page.getByRole("dialog", { name: "Custom hidden sections" })
    await expect(popup).toBeVisible()
    const position = await popup.boundingBox()
    const endPosition = await end.boundingBox()
    // Radix collision handling may flip the surface vertically; it still aligns with the start opener.
    expect(position!.x + position!.width).toBeLessThan(endPosition!.x + endPosition!.width)
    await expect(popup.locator('[data-nav-key="section-1"]')).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(popup).toHaveCount(0)
    await expect(start).toBeFocused()
  })

})
