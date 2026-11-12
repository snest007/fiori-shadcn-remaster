import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/illustrated-message`)
  await page.waitForSelector("html[data-ready=true]")
})

const widthCases: [number, string, string | null][] = [
  [150, "base", null],
  [240, "dot", "45"],
  [340, "spot", "128"],
  [600, "dialog", "160"],
  [760, "scene", "320"],
]

test("auto design follows the container width at UI5's breakpoints", async ({ page }) => {
  const box = page.locator("#illustrated-message-auto")
  const im = box.locator("[data-slot=illustrated-message]")
  for (const [width, media, svgWidth] of widthCases) {
    await box.evaluate((el, w) => ((el as HTMLElement).style.width = `${w}px`), width)
    await expect(im).toHaveAttribute("data-media", media)
    const svg = im.locator(".fiori-illustrated-message__illustration svg")
    if (svgWidth) await expect(svg).toHaveAttribute("width", svgWidth)
    else await expect(im.locator(".fiori-illustrated-message__illustration")).toBeHidden()
  }
})

test("auto design steps down when the container is too low for the content", async ({ page }) => {
  const box = page.locator("#illustrated-message-auto")
  const im = box.locator("[data-slot=illustrated-message]")
  await box.evaluate((el) => ((el as HTMLElement).style.width = "760px"))
  await expect(im).toHaveAttribute("data-media", "scene")
  // Thresholds measured against ui5-illustrated-message with the same content (same sweep, same designs).
  await box.evaluate((el) => ((el as HTMLElement).style.height = "300px"))
  await expect(im).toHaveAttribute("data-media", "dialog")
  await box.evaluate((el) => ((el as HTMLElement).style.height = "220px"))
  await expect(im).toHaveAttribute("data-media", "spot")
  await box.evaluate((el) => ((el as HTMLElement).style.height = "120px"))
  await expect(im).toHaveAttribute("data-media", "dot")
  // A taller fixed height brings the larger design back. (Removing the height doesn't, in UI5 either:
  // height:100% then resolves to the small design's own content height.)
  await box.evaluate((el) => ((el as HTMLElement).style.height = "500px"))
  await expect(im).toHaveAttribute("data-media", "scene")
  await box.evaluate((el) => ((el as HTMLElement).style.height = ""))
})

test("default texts, heading and accessible illustration; actions work", async ({ page }) => {
  const root = page.locator("#illustrated-message-actions")
  await expect(root.getByRole("heading", { level: 2 })).toHaveText("Unable to load data")
  await expect(root.getByRole("img", { name: "UnableToLoad" })).toBeVisible()
  await root.getByRole("button").click()
  await expect(root.getByRole("button")).toHaveText("Retry (1)")
})

test("two instances on a page don't share SVG ids", async ({ page }) => {
  const dupes = await page.evaluate(() => {
    const ids = [...document.querySelectorAll("[data-slot=illustrated-message] [id]")].map((e) => e.id)
    return ids.filter((id, i) => ids.indexOf(id) !== i)
  })
  expect(dupes).toEqual([])
})

test("Base hides actions", async ({ page }) => {
  await page.goto(`/index.html?fixtures&only=illustrated-message-base`)
  await page.waitForSelector("html[data-ready=true]")
  const im = page.locator("[data-slot=illustrated-message]")
  await expect(im).toHaveAttribute("data-media", "base")
  await expect(im.getByRole("button")).toHaveCount(0)
})
