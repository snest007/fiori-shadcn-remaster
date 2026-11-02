import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
})

test("slider: handle is a slider with aria values", async ({ page }) => {
  const h = page.locator("#slider-demo [role=slider]")
  await expect(h).toHaveAttribute("aria-valuemin", "0")
  await expect(h).toHaveAttribute("aria-valuemax", "100")
  await expect(h).toHaveAttribute("aria-valuenow", "20")
  await expect(h).toHaveAccessibleName("Volume Slider handle")
})

test("slider: keyboard steps, big steps, Home/End, Escape restores; commit on key up", async ({ page }) => {
  const h = page.locator("#slider-demo [role=slider]")
  const v = page.locator("#slider-demo-value")
  await h.focus()
  await page.keyboard.press("ArrowRight")
  await expect(v).toHaveText("21")
  await expect(page.locator("#slider-demo-committed")).toHaveText("21")
  await page.keyboard.press("ArrowUp")
  await expect(v).toHaveText("22")
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("ArrowLeft")
  await expect(v).toHaveText("20")
  await page.keyboard.press("PageUp") // 100 steps > 10: a tenth of the range
  await expect(v).toHaveText("30")
  await page.keyboard.press("Control+ArrowRight")
  await expect(v).toHaveText("40")
  await page.keyboard.press("PageDown")
  await expect(v).toHaveText("30")
  await page.keyboard.press("End")
  await expect(v).toHaveText("100")
  await page.keyboard.press("ArrowRight") // clipped
  await expect(v).toHaveText("100")
  await page.keyboard.press("Home")
  await expect(v).toHaveText("0")
  await page.keyboard.press("Escape") // back to the value at focus
  await expect(v).toHaveText("20")
  await expect(h).toHaveAttribute("aria-valuenow", "20")
})

test("slider: a range of 10 steps uses the normal step for PageUp", async ({ page }) => {
  const h = page.locator("#slider-demo-ticks [role=slider]")
  await h.focus()
  await page.keyboard.press("PageUp")
  await expect(h).toHaveAttribute("aria-valuenow", "5")
  await expect(page.locator("#slider-demo-ticks .fiori-slider__tickmark")).toHaveCount(11)
  await expect(page.locator("#slider-demo-ticks .fiori-slider__tickmark-label")).toHaveText(["0", "2", "4", "6", "8", "10"])
})

test("slider: clicking the track sets the value", async ({ page }) => {
  const scale = page.locator("#slider-demo [data-slot=slider-scale]")
  await scale.scrollIntoViewIfNeeded()
  const box = (await scale.boundingBox())!
  await page.mouse.click(box.x + box.width * 0.75, box.y + box.height / 2)
  await expect(page.locator("#slider-demo-value")).toHaveText("75")
  await expect(page.locator("#slider-demo-committed")).toHaveText("75")
  await expect(page.locator("#slider-demo [role=slider]")).toBeFocused()
})

test("range-slider: range then handles in tab order; keys move the range or one handle", async ({ page }) => {
  const sliders = page.locator("#slider-demo-range [role=slider]")
  await expect(sliders).toHaveCount(3)
  const [range, start, end] = [sliders.nth(0), sliders.nth(1), sliders.nth(2)]
  await expect(range).toHaveAccessibleName("Price Range")
  await expect(range).toHaveAttribute("aria-valuetext", "From 20 to 60")
  await expect(start).toHaveAccessibleName("Price Minimum")
  await expect(end).toHaveAccessibleName("Price Maximum")
  const v = page.locator("#slider-demo-range-value")
  await range.focus()
  await page.keyboard.press("ArrowRight")
  await expect(v).toHaveText("21 – 61")
  await page.keyboard.press("End") // whole range to the end
  await expect(v).toHaveText("60 – 100")
  await page.keyboard.press("Home")
  await expect(v).toHaveText("0 – 40")
  await page.keyboard.press("Tab")
  await expect(start).toBeFocused()
  await page.keyboard.press("ArrowRight")
  await expect(v).toHaveText("1 – 40")
  await page.keyboard.press("Tab")
  await expect(end).toBeFocused()
  await page.keyboard.press("Home") // past the start handle: values swap, focus follows
  await expect(v).toHaveText("0 – 1")
  await expect(start).toBeFocused()
})
