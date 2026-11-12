import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/panel`)
  await page.waitForSelector("html[data-ready=true]")
})

const header = (page: import("@playwright/test").Page) => page.locator("#panel-demo").getByRole("button", { name: "Expandable panel" })

test("header toggles on click with aria-expanded and aria-controls", async ({ page }) => {
  const h = header(page)
  await expect(h).toHaveAttribute("aria-expanded", "true")
  const content = page.locator(`#${await h.getAttribute("aria-controls")}`)
  await expect(content).toBeVisible()
  await h.click()
  await expect(h).toHaveAttribute("aria-expanded", "false")
  await expect(content).toBeHidden()
  await h.click()
  await expect(h).toHaveAttribute("aria-expanded", "true")
  await expect(page.locator("#panel-demo").getByText("Click the header")).toBeVisible()
})

for (const key of ["Enter", "Space"]) {
  test(`${key} toggles the panel`, async ({ page }) => {
    const h = header(page)
    await h.focus()
    await page.keyboard.press(key)
    await expect(h).toHaveAttribute("aria-expanded", "false")
    await page.keyboard.press(key)
    await expect(h).toHaveAttribute("aria-expanded", "true")
  })
}

test("header is a heading and its focus ring is keyboard-only", async ({ page }) => {
  await expect(page.locator("#panel-demo").getByRole("heading", { level: 2 })).toContainText("Expandable panel")
  const h = header(page)
  await h.click()
  expect(await h.evaluate((el) => getComputedStyle(el, "::after").content)).toBe("none")
  await h.focus()
  await page.keyboard.press("Shift+Tab")
  await page.keyboard.press("Tab")
  await expect(h).toBeFocused()
  expect(await h.evaluate((el) => getComputedStyle(el, "::after").content)).not.toBe("none")
})

test("fixed panel has no toggle", async ({ page }) => {
  const fixed = page.getByRole("region", { name: "Fixed panel" })
  await expect(fixed.getByRole("button")).toHaveCount(0)
  await expect(fixed.getByText("A fixed panel has no toggle.")).toBeVisible()
})

test("defaultCollapsed panel starts collapsed", async ({ page }) => {
  const h = page.getByRole("button", { name: "Collapsed by default" })
  await expect(h).toHaveAttribute("aria-expanded", "false")
  await expect(page.getByText("Hidden at first.")).toBeHidden()
})
