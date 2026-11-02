import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
})

test("content scrolls while header and floating footer stay put", async ({ page }) => {
  const demo = page.locator("#page-demo")
  const content = demo.locator("section")
  const footer = demo.locator("footer")
  const before = await footer.boundingBox()
  await content.evaluate((el) => (el.scrollTop = el.scrollHeight))
  expect(await content.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
  expect(await footer.boundingBox()).toEqual(before)
  // The floating footer sits 0.5rem above the page bottom and the last paragraph can scroll above it.
  const pageBox = (await demo.locator("[data-slot=page]").boundingBox())!
  expect(Math.round(pageBox.y + pageBox.height - (before!.y + before!.height))).toBe(8)
  const last = (await demo.getByText("Paragraph 12", { exact: false }).boundingBox())!
  expect(last.y + last.height).toBeLessThanOrEqual(before!.y)
})

test("hideFooter animates the floating footer out; fixed footer is docked", async ({ page }) => {
  const demo = page.locator("#page-demo")
  await page.getByRole("button", { name: "Hide footer" }).click()
  await expect.poll(() => demo.locator("footer").evaluate((el) => getComputedStyle(el).opacity)).toBe("0")
  await page.getByRole("button", { name: "Hide footer" }).click()
  await page.getByRole("button", { name: "Fixed footer" }).click()
  const pageBox = (await demo.locator("[data-slot=page]").boundingBox())!
  const f = (await demo.locator("footer").boundingBox())!
  expect(Math.round(pageBox.y + pageBox.height - (f.y + f.height))).toBe(0)
})
