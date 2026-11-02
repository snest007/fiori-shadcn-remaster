import { expect, test, type Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
})

const demo = (page: Page) => page.locator("#dynamic-side-content-demo")
const main = (page: Page) => demo(page).getByRole("region", { name: "Main Content" })
const side = (page: Page) => demo(page).getByRole("region", { name: "Side Content" })
const bp = (page: Page) => page.getByTestId("dynamic-side-content-demo-bp")
const width = (l: import("@playwright/test").Locator) => l.evaluate((el) => Math.round(el.getBoundingClientRect().width))

test("breakpoints follow the control's width (ResizeObserver)", async ({ page }) => {
  await expect(bp(page)).toHaveText("L")
  expect(await width(side(page))).toBe(Math.round(1100 / 3))
  await page.getByRole("button", { name: "1000px" }).click()
  await expect(bp(page)).toHaveText("M")
  expect(await width(side(page))).toBe(340)
  // M below 960px: side content falls below the main content.
  await page.getByRole("button", { name: "900px" }).click()
  await expect.poll(() => width(side(page))).toBe(900)
  await page.getByRole("button", { name: "600px" }).click()
  await expect(bp(page)).toHaveText("S")
  await expect(side(page)).toBeHidden()
  await expect(main(page)).toBeVisible()
})

test("toggleContents swaps main and side content on S only", async ({ page }) => {
  const toggle = page.getByRole("button", { name: "Toggle contents" })
  await toggle.click()
  await expect(side(page)).toBeVisible()
  await expect(main(page)).toBeVisible()
  await page.getByRole("button", { name: "600px" }).click()
  await expect(bp(page)).toHaveText("S")
  await toggle.click()
  await expect(side(page)).toBeVisible()
  await expect(main(page)).toBeHidden()
  expect(await width(side(page))).toBe(600)
  await toggle.click()
  await expect(side(page)).toBeHidden()
  await expect(main(page)).toBeVisible()
})
