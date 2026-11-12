import { expect, test, type Locator } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/dynamic-page`)
  await page.waitForSelector("html[data-ready=true]")
})

const parts = (dp: Locator) => ({
  scroll: dp.locator(".fiori-dynamic-page__scroll"),
  title: dp.locator("[data-dp-focus-area]"),
  header: dp.locator("[data-slot=dynamic-page-header]"),
  expand: dp.locator(".fiori-dynamic-page-header-action--expand"),
  pin: dp.locator(".fiori-dynamic-page-header-action--pin"),
})

const headerHeight = (dp: Locator) => dp.locator("[data-slot=dynamic-page-header-area]").evaluate((e) => e.getBoundingClientRect().height)

test("dynamic-page: title is a toggle button with aria-expanded; header region labelled", async ({ page }) => {
  const dp = page.locator("#dynamic-page-demo")
  const { title, header } = parts(dp)
  await expect(title).toHaveAttribute("role", "button")
  await expect(title).toHaveAttribute("aria-expanded", "true")
  await expect(title).toHaveAccessibleName("Laptop 15")
  await expect(title).toHaveAccessibleDescription("Toggle Header")
  await expect(header.getByRole("region", { name: "Laptop 15 details" })).toBeVisible()
  await expect(dp.getByRole("region", { name: "Laptop 15 header" })).toBeVisible()
})

test("dynamic-page: header snaps after scrolling past header height + 10px and expands below height − 10px", async ({ page }) => {
  const dp = page.locator("#dynamic-page-demo")
  const { scroll, title } = parts(dp)
  const h = await headerHeight(dp)
  await scroll.evaluate((el, top) => (el.scrollTop = top), h + 5)
  await page.waitForTimeout(100)
  await expect(dp).not.toHaveAttribute("data-header-snapped")
  await scroll.evaluate((el, top) => (el.scrollTop = top), h + 15)
  await expect(dp).toHaveAttribute("data-header-snapped", "")
  await expect(title).toHaveAttribute("aria-expanded", "false")
  await expect(dp.locator("[data-slot=dynamic-page-title]").getByText("PO-48865 · In Stock")).toBeVisible()
  await expect(page.locator("#dynamic-page-demo-log")).toHaveText("snapped")
  // Hysteresis: between height − 10 and height + 10 nothing changes.
  await scroll.evaluate((el, top) => (el.scrollTop = top), h - 5)
  await page.waitForTimeout(100)
  await expect(dp).toHaveAttribute("data-header-snapped", "")
  await scroll.evaluate((el, top) => (el.scrollTop = top), h - 15)
  await expect(dp).not.toHaveAttribute("data-header-snapped")
  await expect(page.locator("#dynamic-page-demo-log")).toHaveText("snapped, expanded")
})

test("dynamic-page: clicking the title, Enter and Space toggle the header", async ({ page }) => {
  const dp = page.locator("#dynamic-page-demo")
  const { title, header } = parts(dp)
  await dp.locator("[data-slot=dynamic-page-title]").click({ position: { x: 300, y: 50 } })
  await expect(dp).toHaveAttribute("data-header-snapped", "")
  await expect(header).toBeHidden()
  await expect(title).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(dp).not.toHaveAttribute("data-header-snapped")
  await expect(header).toBeVisible()
  await page.keyboard.press("Space")
  await expect(dp).toHaveAttribute("data-header-snapped", "")
  // Buttons inside the title keep their own click.
  await dp.getByRole("button", { name: "Edit" }).click()
  await expect(dp).toHaveAttribute("data-header-snapped", "")
})

test("dynamic-page: expand/collapse button toggles and keeps focus; labels follow the state", async ({ page }) => {
  const dp = page.locator("#dynamic-page-demo")
  const { expand, pin } = parts(dp)
  await expect(expand).toHaveAccessibleName("Collapse Header")
  await expect(pin).toHaveAccessibleName("Pin Header")
  await expand.click()
  await expect(dp).toHaveAttribute("data-header-snapped", "")
  await expect(expand).toHaveAccessibleName("Expand Header")
  await expect(expand).toBeFocused()
  await expect(pin).toHaveCount(0) // UI5 hides the pin button while snapped
  await expand.press("Enter")
  await expect(dp).not.toHaveAttribute("data-header-snapped")
})

test("dynamic-page: pinned header stays visible while scrolling and does not snap", async ({ page }) => {
  const dp = page.locator("#dynamic-page-demo")
  const { scroll, pin, header } = parts(dp)
  await pin.click()
  await expect(pin).toHaveAttribute("aria-pressed", "true")
  await expect(pin).toHaveAccessibleName("Unpin Header")
  await expect(page.locator("#dynamic-page-demo-log")).toHaveText("pinned")
  await scroll.evaluate((el) => (el.scrollTop = 300))
  await page.waitForTimeout(100)
  await expect(dp).not.toHaveAttribute("data-header-snapped")
  // The header sits in the sticky title area: its top stays right below the title.
  const titleBox = (await dp.locator("[data-slot=dynamic-page-title]").boundingBox())!
  const headerBox = (await header.boundingBox())!
  const scrollBox = (await scroll.boundingBox())!
  expect(Math.abs(titleBox.y - scrollBox.y)).toBeLessThanOrEqual(1)
  expect(Math.abs(headerBox.y - (titleBox.y + titleBox.height))).toBeLessThanOrEqual(1)
  // Snapping (title click) unpins.
  await dp.locator("[data-slot=dynamic-page-title]").click({ position: { x: 300, y: 50 } })
  await expect(dp).toHaveAttribute("data-header-snapped", "")
  await expect(dp).not.toHaveAttribute("data-header-pinned")
})

test("dynamic-page: toggling while scrolled shows the header in the sticky area", async ({ page }) => {
  const dp = page.locator("#dynamic-page-demo")
  const { scroll, expand, header } = parts(dp)
  await scroll.evaluate((el) => (el.scrollTop = 400))
  await expect(dp).toHaveAttribute("data-header-snapped", "")
  // Snapping shrinks the scroll height, which can clamp scrollTop and fire one more (debounced) scroll;
  // let the page settle (and bring it into the window) before toggling, as a user would.
  await dp.scrollIntoViewIfNeeded()
  await expect.poll(async () => {
    const a = await scroll.evaluate((el) => el.scrollTop)
    await page.waitForTimeout(50)
    return a === (await scroll.evaluate((el) => el.scrollTop))
  }).toBe(true)
  await expand.click()
  await expect(dp).not.toHaveAttribute("data-header-snapped")
  await expect(header).toBeInViewport()
  const scrollTop = await scroll.evaluate((el) => el.scrollTop)
  expect(scrollTop).toBeGreaterThan(300)
})

test("dynamic-page: floating footer shows and hides", async ({ page }) => {
  const dp = page.locator("#dynamic-page-demo")
  const footer = dp.locator("[data-slot=dynamic-page-footer]")
  await dp.scrollIntoViewIfNeeded()
  // Sticky at the page's bottom edge (0.5rem inset).
  const dpBox = (await dp.boundingBox())!
  const save = (await footer.getByRole("button", { name: "Confirm" }).boundingBox())!
  expect(save.y + save.height).toBeLessThan(dpBox.y + dpBox.height)
  expect(save.y + save.height).toBeGreaterThan(dpBox.y + dpBox.height - 30)
  await dp.getByRole("button", { name: "Toggle Footer" }).click()
  await expect(dp).not.toHaveAttribute("data-show-footer")
  await expect(footer).toHaveAttribute("inert", "")
})
