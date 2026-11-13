import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"

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

for (const theme of ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]) {
  for (const density of ["cozy", "compact"]) {
    test(`auto design remeasures wrapped content after widening (${theme}, ${density})`, async ({ page, context }) => {
      const url = `/index.html?theme=${theme}&density=${density}#/illustrated-message`
      await page.goto(url)
      await page.waitForSelector("html[data-ready=true]")
      const box = page.locator("#illustrated-message-wrapping")
      const im = box.locator("[data-slot=illustrated-message]")
      const freshPage = await context.newPage()
      try {
        await freshPage.goto(url)
        await freshPage.waitForSelector("html[data-ready=true]")
        const fresh = freshPage.locator("#illustrated-message-wrapping [data-slot=illustrated-message]")
        await freshPage.locator("#illustrated-message-wrapping").evaluate((element) => { (element as HTMLElement).style.height = "240px" })
        await expect(fresh).toHaveAttribute("data-media", "spot")
        const freshMedia = await fresh.getAttribute("data-media")
        await box.evaluate((element) => { (element as HTMLElement).style.height = "240px" })
        await expect(im).toHaveAttribute("data-media", freshMedia!)
        // The subtitle genuinely wraps into more lines at this width, so the
        // smaller design is still needed while the available height stays fixed.
        await box.evaluate((element) => { (element as HTMLElement).style.width = "270px" })
        await expect(im).toHaveAttribute("data-media", "dot")
        await box.evaluate((element) => { (element as HTMLElement).style.width = "340px" })
        await expect(im).toHaveAttribute("data-media", freshMedia!)
        await expect(im.locator(".fiori-illustrated-message__illustration svg")).toHaveAttribute("width", "128")
        await expect.poll(() => im.evaluate((element) => element.scrollHeight <= element.clientHeight)).toBe(true)
      } finally {
        await freshPage.close()
      }
    })
  }
}

test("auto design remeasures after a late font changes wrapping at the same size", async ({ page, context }) => {
  const font = readFileSync("node_modules/@sap-theming/theming-base-content/content/Base/baseLib/baseTheme/fonts/72-Regular.woff2")
  const fontURL = "**/illustrated-message-delayed.woff2"
  const freshPage = await context.newPage()
  let releaseFont!: () => void
  const fontGate = new Promise<void>((resolve) => { releaseFont = resolve })
  await page.route(fontURL, async (route) => {
    await fontGate
    await route.fulfill({ contentType: "font/woff2", body: font })
  })
  await freshPage.route(fontURL, (route) => route.fulfill({ contentType: "font/woff2", body: font }))
  const setFont = (element: Element) => {
    const box = element as HTMLElement
    box.style.fontFamily = '"illustrated-message-late", monospace'
    box.style.setProperty("--sapFontHeaderFamily", '"illustrated-message-late", monospace')
    box.style.setProperty("--sapFontFamily", '"illustrated-message-late", monospace')
    box.style.width = "341px"
    box.style.height = "240px"
  }
  try {
    await freshPage.goto("/index.html#/illustrated-message")
    await freshPage.waitForSelector("html[data-ready=true]")
    await freshPage.evaluate(async () => {
      const face = new FontFace("illustrated-message-late", "url(/illustrated-message-delayed.woff2)", { display: "swap" })
      document.fonts.add(face)
      await face.load()
    })
    const fresh = freshPage.locator("#illustrated-message-wrapping [data-slot=illustrated-message]")
    await freshPage.locator("#illustrated-message-wrapping").evaluate(setFont)
    await expect(fresh).toHaveAttribute("data-media", "spot")

    const box = page.locator("#illustrated-message-wrapping")
    const im = box.locator("[data-slot=illustrated-message]")
    await page.evaluate(() => document.fonts.add(new FontFace("illustrated-message-late", "url(/illustrated-message-delayed.woff2)", { display: "swap" })))
    const request = page.waitForRequest(fontURL)
    await box.evaluate(setFont)
    await request
    // The fallback font needs more lines; the real 72 face fits without a
    // container resize. Readiness alone must not retain the fallback's design.
    await expect(im).toHaveAttribute("data-media", "dot")
    const fallbackSize = await im.evaluate((element) => ({ width: element.clientWidth, height: element.clientHeight }))
    releaseFont()
    await page.evaluate(() => document.fonts.ready)
    await expect(im).toHaveAttribute("data-media", (await fresh.getAttribute("data-media"))!)
    expect(await im.evaluate((element) => ({ width: element.clientWidth, height: element.clientHeight }))).toEqual(fallbackSize)
    await expect.poll(() => im.evaluate((element) => element.scrollHeight <= element.clientHeight)).toBe(true)
    // A fixed design remains fixed when font metrics and available space change.
    const fixed = page.locator("#illustrated-message-actions [data-slot=illustrated-message]")
    await page.locator("#illustrated-message-actions").evaluate((element) => {
      const box = element as HTMLElement
      box.style.width = "200px"
      box.style.height = "80px"
    })
    await expect(fixed).toHaveAttribute("data-media", "dialog")
    await expect(fixed.locator(".fiori-illustrated-message__illustration svg")).toHaveAttribute("width", "160")
  } finally {
    releaseFont()
    await freshPage.close()
  }
})

test("auto design expands for shorter content and steps down again for genuine overflow", async ({ page }) => {
  const box = page.locator("#illustrated-message-wrapping")
  const im = box.locator("[data-slot=illustrated-message]")
  await box.evaluate((element) => {
    const box = element as HTMLElement
    box.style.width = "270px"
    box.style.height = "240px"
  })
  await expect(im).toHaveAttribute("data-media", "dot")
  await page.locator("#illustrated-message-description").click()
  await expect(im).toHaveAttribute("data-media", "spot")
  await expect(im).toContainText("Try again.")
  await page.locator("#illustrated-message-description").click()
  await expect(im).toHaveAttribute("data-media", "dot")
  await expect(im).toContainText("check with your administrator.")
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
