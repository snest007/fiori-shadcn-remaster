import { expect, test, type Page } from "@playwright/test"

const bar = (page: Page) => page.locator("#shell-bar-demo")
const last = (page: Page) => page.locator("#shell-bar-demo-last")
const setWidth = (page: Page, width: string) => bar(page).evaluate((el, w) => ((el as HTMLElement).style.width = w), width)
const button = (page: Page, name: string | RegExp) => bar(page).getByRole("button", { name })
// As in UI5, a field that is expanded when the bar suddenly gets too narrow stays open and covers the bar. Passing through
// a width where it merely crowds the items collapses it first, which is what dragging a window edge does.
const narrow = async (page: Page, width: string) => {
  await setWidth(page, "1000px")
  await expect(button(page, "Open Search")).toBeVisible()
  await setWidth(page, width)
}

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/shell-bar`)
  await page.waitForSelector("html[data-ready=true]")
})

test("shell-bar: breakpoints set the side padding from the bar's own width and S hides the title", async ({ page }) => {
  const title = bar(page).locator(".fiori-shellbar-branding__title")
  for (const [width, bp, padding] of [["500px", "S", "16px"], ["800px", "M", "32px"], ["1200px", "L", "32px"], ["1600px", "XL", "48px"], ["2000px", "XXL", "48px"]]) {
    await setWidth(page, width)
    await expect(bar(page)).toHaveAttribute("data-breakpoint", bp)
    await expect(bar(page)).toHaveCSS("padding-left", padding)
    if (bp === "S") await expect(title).toBeHidden()
    else await expect(title).toBeVisible()
  }
})

test("shell-bar: click callbacks report the buttons", async ({ page }) => {
  await button(page, "12 Notifications").click()
  await expect(last(page)).toHaveText("Last action: notifications")
  await button(page, "User Menu").click()
  await expect(last(page)).toHaveText("Last action: profile")
  await button(page, "Products").click()
  await expect(last(page)).toHaveText("Last action: products")
  await button(page, "Help").click()
  await expect(last(page)).toHaveText("Last action: help")
  await page.locator("#shell-bar-demo-branding").click()
  await expect(last(page)).toHaveText("Last action: branding")
})

test("shell-bar: branding without href is a button: Enter and Space activate it", async ({ page }) => {
  const branding = page.locator("#shell-bar-demo-branding")
  await expect(branding).toHaveRole("button")
  await branding.focus()
  await page.keyboard.press("Enter")
  await expect(last(page)).toHaveText("Last action: branding")
  await page.locator("#shell-bar-demo-start").click()
  await branding.focus()
  await page.keyboard.press("Space")
  await expect(last(page)).toHaveText("Last action: branding")
})

test("shell-bar: arrows, Home and End move among the items without wrapping", async ({ page }) => {
  const start = page.locator("#shell-bar-demo-start")
  await start.focus()
  await page.keyboard.press("ArrowLeft")
  await expect(start).toBeFocused()
  await page.keyboard.press("ArrowRight")
  await expect(page.locator("#shell-bar-demo-branding")).toBeFocused()
  await page.keyboard.press("End")
  await expect(button(page, "Products")).toBeFocused()
  await page.keyboard.press("ArrowRight")
  await expect(button(page, "Products")).toBeFocused()
  await page.keyboard.press("ArrowLeft")
  await expect(button(page, "User Menu")).toBeFocused()
  await page.keyboard.press("Home")
  await expect(start).toBeFocused()
})

test("shell-bar: F6 and Shift+F6 move between fast navigation groups", async ({ page }) => {
  await page.locator("#shell-bar-demo-start").focus()
  await page.keyboard.press("F6")
  await expect(page.locator("#shell-bar-demo-menu").locator("button").first()).toBeFocused()
  await page.keyboard.press("Shift+F6")
  await expect(page.locator("#shell-bar-demo-start")).toBeFocused()
})

test("shell-bar: narrow widths move items into the overflow popover, keeping profile and product switch", async ({ page }) => {
  await setWidth(page, "1200px")
  const overflow = button(page, "More")
  await expect(overflow).toBeHidden()
  await narrow(page, "420px")
  await expect(overflow).toBeVisible()
  await expect(button(page, "User Menu")).toBeVisible()
  await expect(button(page, "Products")).toBeVisible()
  await expect(button(page, "Help")).toHaveCount(0)
  // Several items with counts: an attention dot rather than a number.
  await expect(overflow.locator("[data-slot=shell-bar-badge]")).toHaveAttribute("data-dot", "")
  await overflow.click()
  const popover = page.getByRole("dialog", { name: "More" })
  await expect(popover.getByRole("listitem")).toContainText(["Notifications", "Assistant", "Help", "Expenses"])
  // Entries fire the same callbacks; the popover closes.
  await popover.getByRole("listitem").filter({ hasText: "Expenses" }).click()
  await expect(last(page)).toHaveText("Last action: expenses")
  await expect(popover).toHaveCount(0)
  await expect(overflow).toBeFocused()
  // Everything is back when there is room again.
  await setWidth(page, "1600px")
  await expect(overflow).toBeHidden()
  await expect(button(page, "Help")).toBeVisible()
})

test("shell-bar: hide order with the search collapsed: actions, content, search, then the first content item", async ({ page }) => {
  await narrow(page, "800px")
  await expect(button(page, "Open Search")).toBeVisible()
  // Narrow the bar step by step, noting when each part first disappears.
  const order = await bar(page).evaluate(async (el) => {
    const host = el as HTMLElement
    const seen: string[] = []
    for (let width = 800; width >= 120; width -= 10) {
      host.style.width = `${width}px`
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      for (const part of host.querySelectorAll<HTMLElement>("[data-sb-id]")) {
        const id = part.dataset.sbId!
        if (id !== "overflow" && part.hasAttribute("data-sb-hidden") && !seen.includes(id)) seen.push(id)
      }
    }
    return seen
  })
  const at = (id: string) => order.findIndex((x) => x.includes(id))
  expect(order).toHaveLength(7)
  for (const action of ["item-", "assistant", "notifications"]) expect(at(action)).toBeLessThan(at("trial"))
  expect(at("trial")).toBeLessThan(at("search"))
  expect(at("search")).toBeLessThan(at("app"))
})

test("shell-bar: search expands from its button; Enter and Escape on the empty field collapse it, returning focus", async ({ page }) => {
  await narrow(page, "800px")
  await button(page, "Open Search").click()
  const input = bar(page).getByRole("searchbox")
  await expect(input).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(input).toHaveCount(0)
  await expect(button(page, "Open Search")).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(input).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(input).toHaveCount(0)
  await expect(button(page, "Open Search")).toBeFocused()
})

test("shell-bar: a search field that doesn't fit covers the bar, with Cancel closing and clearing it", async ({ page }) => {
  await narrow(page, "420px")
  await button(page, "More").click()
  await page.getByRole("dialog", { name: "More" }).getByRole("listitem").filter({ hasText: "Search" }).click()
  const input = bar(page).getByRole("searchbox")
  await expect(bar(page)).toHaveAttribute("data-full-width-search", "")
  await expect(input).toBeFocused()
  // It covers the bar: wider than the room left of the (now covered) profile and product switch buttons.
  const box = (await bar(page).locator(".fiori-search").boundingBox())!
  expect(box.width).toBeGreaterThan(250)
  const hit = await bar(page).evaluate((el) => {
    const r = el.querySelector<HTMLElement>('[aria-label="Products"]')!.getBoundingClientRect()
    return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest(".fiori-shellbar__search-frame") != null
  })
  expect(hit).toBe(true)
  await input.fill("Lap")
  await bar(page).getByRole("button", { name: "Cancel" }).click()
  await expect(input).toHaveCount(0)
  await expect(bar(page)).not.toHaveAttribute("data-full-width-search", "")
  // With room again it expands by itself, cleared.
  await setWidth(page, "1200px")
  await expect(bar(page).getByRole("searchbox")).toHaveValue("")
})

test("shell-bar: the assistant toggle works, also from the overflow popover", async ({ page }) => {
  await button(page, "Joule").click()
  await expect(button(page, "Joule")).toHaveAttribute("aria-pressed", "true")
  await expect(last(page)).toHaveText("Last action: assistant:on")
  await narrow(page, "420px")
  await button(page, "More").click()
  await page.getByRole("dialog", { name: "More" }).getByRole("listitem").filter({ hasText: "Assistant" }).click()
  await expect(last(page)).toHaveText("Last action: assistant:off")
})

test("shell-bar: menu button opens its app menu; at S the logo moves into it and the titles go", async ({ page }) => {
  const menuBar = page.locator("#shell-bar-demo-menu")
  const button = menuBar.locator("[data-slot=shell-bar-menu-button]")
  await expect(button).toHaveAccessibleName("Corporate Portal")
  await expect(menuBar.getByText("Secondary title")).toBeVisible()
  await button.click()
  await expect(page.getByRole("menuitem", { name: "Application 1" })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(button).toBeFocused()
  await menuBar.evaluate((el) => ((el as HTMLElement).style.width = "400px"))
  await expect(menuBar.getByText("Secondary title")).toBeHidden()
  await expect(button.locator("img")).toBeVisible()
  await expect(menuBar.locator(".fiori-shellbar-menu-logo")).toBeHidden()
})

test("shell-bar: the search button itself moves into the overflow popover when even it doesn't fit", async ({ page }) => {
  await narrow(page, "240px")
  await expect(bar(page).locator("[data-sb-id=search]")).toBeHidden()
  await button(page, "More").click()
  await page.getByRole("dialog", { name: "More" }).getByRole("listitem").filter({ hasText: "Search" }).click()
  await expect(bar(page)).toHaveAttribute("data-full-width-search", "")
  await expect(bar(page).getByRole("searchbox")).toBeFocused()
})

test("shell-bar: expanding or collapsing the search because of the bar's width leaves the focus alone", async ({ page }) => {
  const start = page.locator("#shell-bar-demo-start")
  await narrow(page, "800px")
  await start.focus()
  await setWidth(page, "1200px")
  await expect(bar(page).getByRole("searchbox")).toBeVisible()
  await expect(start).toBeFocused()
  await setWidth(page, "1000px")
  await expect(button(page, "Open Search")).toBeVisible()
  await expect(start).toBeFocused()
})

test("shell-bar: reports which content items are hidden, by key", async ({ page }) => {
  const hidden = page.locator("#shell-bar-demo-hidden")
  await expect(hidden).toHaveText("Hidden content: none")
  await narrow(page, "420px")
  await expect(hidden).toHaveText("Hidden content: trial")
  await setWidth(page, "300px")
  await expect(hidden).toHaveText("Hidden content: trial, app") // in the order they hid
  await setWidth(page, "1600px")
  await expect(hidden).toHaveText("Hidden content: none")
})
