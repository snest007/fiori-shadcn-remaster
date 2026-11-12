import { expect, test, type Locator } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/carousel`)
  await page.waitForSelector("html[data-ready=true]")
})

const items = (root: Locator) => root.locator('[role="listitem"]')
const dots = (root: Locator) => root.locator(".fiori-carousel__navigation-dot")
const activeDot = (root: Locator) => root.locator(".fiori-carousel__navigation-dot--active")

test("carousel has its role description, list semantics and hides off-page items", async ({ page }) => {
  const root = page.locator("#carousel-basic")
  await expect(root.locator('section[aria-roledescription="Carousel"]')).toHaveAttribute("aria-label", "Products")
  await expect(root.getByRole("list", { name: "Item Container" })).toBeVisible()
  await expect(items(root).nth(0)).toHaveAttribute("aria-posinset", "1")
  await expect(items(root).nth(0)).toHaveAttribute("aria-setsize", "4")
  await expect(items(root).nth(1)).toBeHidden()
  await expect(dots(root)).toHaveCount(4)
})

test("arrow keys move item by item and fire onNavigate; no wrap unless cyclic", async ({ page }) => {
  const root = page.locator("#carousel-basic")
  await items(root).nth(0).focus()
  await page.keyboard.press("ArrowLeft")
  await expect(items(root).nth(0)).toBeFocused()
  await page.keyboard.press("ArrowRight")
  await expect(items(root).nth(1)).toBeFocused()
  await expect(root.locator("#carousel-basic-page")).toHaveText("Page index: 1")
  await expect(dots(root).nth(1)).toHaveClass(/--active/)
  await page.keyboard.press("ArrowDown")
  await expect(items(root).nth(2)).toBeFocused()
  await page.keyboard.press("ArrowUp")
  await expect(items(root).nth(1)).toBeFocused()
})

test("Home and End go to the first and last item", async ({ page }) => {
  const root = page.locator("#carousel-basic")
  await items(root).nth(0).focus()
  await page.keyboard.press("End")
  await expect(items(root).nth(3)).toBeFocused()
  await expect(activeDot(root)).toHaveCount(1)
  await expect(dots(root).nth(3)).toHaveClass(/--active/)
  await page.keyboard.press("Home")
  await expect(items(root).nth(0)).toBeFocused()
  await expect(dots(root).nth(0)).toHaveClass(/--active/)
})

test("content arrows appear on hover, hide at the ends and move the page", async ({ page }) => {
  const root = page.locator("#carousel-basic")
  const next = root.getByRole("button", { name: "Next Page" })
  const prev = root.getByRole("button", { name: "Previous Page" })
  await expect(next).toHaveCount(0)
  await root.locator(".fiori-carousel__viewport").hover()
  await expect(next).toBeVisible()
  await expect(prev).toBeHidden()
  await next.click()
  await expect(root.locator("#carousel-basic-page")).toHaveText("Page index: 1")
  await expect(items(root).nth(1)).toBeFocused()
  await expect(prev).toBeVisible()
  for (let i = 0; i < 2; i++) await next.click()
  await expect(next).toBeHidden()
})

test("cyclic carousel wraps with keys and arrows; numeric indicator; arrows beside it", async ({ page }) => {
  const root = page.locator("#carousel-cyclic")
  const text = root.locator(".fiori-carousel__navigation-text")
  await expect(text).toHaveText("1 of 3")
  await root.getByRole("button", { name: "Previous Page" }).click()
  await expect(text).toHaveText("3 of 3")
  await expect(items(root).nth(2)).toBeFocused()
  await page.keyboard.press("ArrowRight")
  await expect(text).toHaveText("1 of 3")
  await expect(items(root).nth(0)).toBeFocused()
})

test("items per page follows the container width; pages are items minus page size plus one", async ({ page }) => {
  const root = page.locator("#carousel-multi")
  await expect(dots(root)).toHaveCount(3)
  await expect(items(root).nth(2)).toBeVisible()
  await expect(items(root).nth(3)).toBeHidden()
  await root.evaluate((el) => ((el as HTMLElement).style.width = "400px"))
  await expect(dots(root)).toHaveCount(5)
  await expect(items(root).nth(1)).toBeHidden()
})

test("F7 moves between the item and its content; keys on the inner button still work", async ({ page }) => {
  const root = page.locator("#carousel-basic")
  await items(root).nth(0).focus()
  await page.keyboard.press("ArrowRight")
  await expect(items(root).nth(1)).toBeFocused()
  const button = root.getByRole("button", { name: /Monitor clicked/ })
  await page.keyboard.press("F7")
  await expect(button).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(button).toHaveText("Monitor clicked 1×")
  await page.keyboard.press("F7")
  await expect(items(root).nth(1)).toBeFocused()
  await page.keyboard.press("F7")
  await expect(button).toBeFocused()
})

test("dragging changes the page; a plain click does not", async ({ page }) => {
  const root = page.locator("#carousel-basic")
  await root.scrollIntoViewIfNeeded()
  const box = (await root.locator(".fiori-carousel__viewport").boundingBox())!
  const y = box.y + box.height / 2
  await page.mouse.click(box.x + 200, y)
  await expect(root.locator("#carousel-basic-page")).toHaveText("Page index: 0")
  await page.mouse.move(box.x + 300, y)
  await page.mouse.down()
  await page.mouse.move(box.x + 100, y)
  await page.mouse.up()
  await expect(root.locator("#carousel-basic-page")).toHaveText("Page index: 1")
})

test("mouse focus shows no ring, keyboard focus does", async ({ page }) => {
  const root = page.locator("#carousel-basic")
  const first = items(root).nth(0)
  await first.click()
  await expect(first).toBeFocused()
  expect(await first.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("none")
  await page.keyboard.press("ArrowRight")
  await expect(items(root).nth(1)).toBeFocused()
  expect(await items(root).nth(1).evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe("none")
})

test("in a grid or flex parent the carousel keeps the parent's width (no resize feedback loop)", async ({ page }) => {
  const root = page.locator("#carousel-multi")
  const width = () => root.locator("[data-slot=carousel]").evaluate((el) => (el as HTMLElement).offsetWidth)
  const first = await width()
  await page.waitForTimeout(500)
  expect(await width()).toBe(first)
  expect(first).toBeLessThanOrEqual(1280)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280)
})


test("carousel: RTL retains UI5's unmirrored item keys", async ({ page }) => {
  // Carousel.js _onkeydown calls navigateRight for Right/Down regardless of _isRTL.
  for (const native of [false, true]) {
    await page.goto(native ? "/ui5.html?dir=rtl&only=carousel-default" : "/index.html?fixtures&dir=rtl&only=carousel-default")
    await page.waitForSelector("html[data-ready=true]")
    const root = page.locator('[data-fixture="carousel-default"]')
    const items = root.locator('[role=listitem]')
    await items.first().focus()
    await expect(items.first()).toBeFocused()
    await page.keyboard.press("ArrowRight")
    await expect(items.nth(1)).toBeFocused()
    await page.keyboard.press("ArrowLeft")
    await expect(items.first()).toBeFocused()
  }
})
