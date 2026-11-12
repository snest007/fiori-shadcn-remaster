import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/card`)
  await page.waitForSelector("html[data-ready=true]")
})

test("interactive card header is a button activated by click, Enter and Space", async ({ page }) => {
  const header = page.locator("#card-interactive-header")
  const button = header.getByRole("button")
  await expect(button).toHaveAttribute("aria-roledescription", "Interactive Card Header")
  await button.click()
  await expect(header).toContainText("Opened 1×")
  await button.focus()
  await page.keyboard.press("Enter")
  await expect(header).toContainText("Opened 2×")
  await page.keyboard.press("Space")
  await expect(header).toContainText("Opened 3×")
})

test("card is a region with a level-3 heading; the action is reachable", async ({ page }) => {
  const card = page.getByRole("region", { name: "Card Team" })
  await expect(card.getByRole("heading", { level: 3 })).toHaveText("Team")
  await expect(card.getByRole("group", { name: /Team/ })).toHaveAttribute("aria-roledescription", "Card Header")
  await expect(card.getByRole("button", { name: "More actions" })).toBeVisible()
})

test("focus ring on the header only for keyboard focus, and not while the action has focus", async ({ page }) => {
  const card = page.getByRole("region", { name: "Card Team" })
  const header = card.locator("[data-slot=card-header]")
  const ring = () => header.evaluate((el) => getComputedStyle(el, "::before").content)
  await card.getByRole("group").first().click()
  expect(await ring()).toBe("none")
  await page.keyboard.press("Shift+Tab")
  await page.keyboard.press("Tab")
  expect(await ring()).not.toBe("none")
  await page.keyboard.press("Tab")
  await expect(card.getByRole("button", { name: "More actions" })).toBeFocused()
  expect(await ring()).toBe("none")
})
