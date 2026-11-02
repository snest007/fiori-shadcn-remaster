import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
})

const bubbles = (root: import("@playwright/test").Locator) => root.locator(".fiori-tli__bubble:visible")

test("timeline is a labelled region with a tree when it has groups, a list otherwise", async ({ page }) => {
  const v = page.locator("#timeline-vertical")
  await expect(v.getByRole("region", { name: "Timeline Order history" })).toBeVisible()
  await expect(v.getByRole("tree")).toBeVisible()
  const h = page.locator("#timeline-horizontal")
  await expect(h.getByRole("list")).toBeVisible()
  await expect(h.getByRole("listitem")).toHaveCount(3)
})

test("items form one Tab stop; arrows move, without wrapping", async ({ page }) => {
  const h = page.locator("#timeline-horizontal")
  const items = bubbles(h)
  await expect(h.locator('[data-timeline-nav][tabindex="0"]')).toHaveCount(1)
  await items.nth(0).focus()
  await page.keyboard.press("ArrowLeft")
  await expect(items.nth(0)).toBeFocused()
  await page.keyboard.press("ArrowRight")
  await expect(items.nth(1)).toBeFocused()
  await expect(items.nth(1)).toHaveAttribute("tabindex", "0")
  await expect(items.nth(0)).toHaveAttribute("tabindex", "-1")
  await page.keyboard.press("End")
  await expect(items.nth(2)).toBeFocused()
  await page.keyboard.press("Home")
  await expect(items.nth(0)).toBeFocused()
})

test("vertical navigation passes through the group toggle and skips collapsed items", async ({ page }) => {
  const v = page.locator("#timeline-vertical")
  const toggle = v.getByRole("button", { name: "Last week, expanded" })
  await bubbles(v).nth(0).focus()
  await page.keyboard.press("ArrowDown")
  await expect(toggle).toBeFocused()
  await page.keyboard.press("Space")
  const collapsed = v.getByRole("button", { name: "Last week, collapsed" })
  await expect(collapsed).toHaveAttribute("aria-pressed", "true")
  await expect(v.locator("[data-slot=timeline-group-item] [data-slot=timeline-item]").first()).toBeHidden()
  await page.keyboard.press("ArrowDown")
  await expect(v.locator(".fiori-tli__bubble", { hasText: "Order created" })).toBeFocused()
})

test("from the last item the arrow reaches Load More, which loads and returns with ArrowUp", async ({ page }) => {
  const v = page.locator("#timeline-vertical")
  const more = v.getByRole("button", { name: "Load More" })
  await bubbles(v).nth(0).focus()
  await page.keyboard.press("End")
  await page.keyboard.press("ArrowDown")
  await expect(more).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(v.getByText("Older entry 1")).toBeVisible()
  await page.keyboard.press("ArrowUp")
  await expect(v.locator(".fiori-tli__bubble", { hasText: "Older entry 1" })).toBeFocused()
})

test("F2 moves into the item's link and back; the clickable name fires", async ({ page }) => {
  const v = page.locator("#timeline-vertical")
  const bubble = v.locator(".fiori-tli__bubble", { hasText: "sent a message" })
  await bubble.focus()
  await page.keyboard.press("F2")
  const link = bubble.locator("[data-slot=link]")
  await expect(link).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(link).toContainText("Clicked 1×")
  await page.keyboard.press("F2")
  await expect(bubble).toBeFocused()
})

test("item label includes name, title, time stamp and state", async ({ page }) => {
  const bubble = page.locator("#timeline-vertical .fiori-tli__bubble", { hasText: "Called supplier" })
  await expect(bubble).toHaveAttribute("aria-label", "Called supplier, Dec 15, 2026, 16:30, Positive State")
  await expect(bubble).toHaveAttribute("aria-description", "Positive State")
})

test("horizontal layout: focus scrolls the item into view and the wheel scrolls sideways", async ({ page }) => {
  const h = page.locator("#timeline-horizontal")
  await h.evaluate((el) => ((el as HTMLElement).style.width = "14rem"))
  const scroller = h.locator(".fiori-timeline__scroll-container")
  await bubbles(h).nth(0).focus()
  await page.keyboard.press("End")
  await expect.poll(() => scroller.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0)
  await scroller.evaluate((el) => (el.scrollLeft = 0))
  await scroller.hover()
  await page.mouse.wheel(0, 60)
  await expect.poll(() => scroller.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0)
})
