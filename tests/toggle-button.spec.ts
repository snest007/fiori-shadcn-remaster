import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
})

test("toggle button: aria-pressed toggles with click, Space and Enter", async ({ page }) => {
  const fav = page.getByRole("button", { name: "Favorite" })
  await expect(fav).toHaveAttribute("aria-pressed", "true")
  await fav.click()
  await expect(fav).toHaveAttribute("aria-pressed", "false")
  await fav.focus()
  await page.keyboard.press("Space")
  await expect(fav).toHaveAttribute("aria-pressed", "true")
  await page.keyboard.press("Enter")
  await expect(fav).toHaveAttribute("aria-pressed", "false")
})

test("toggle button: pressed look uses the selected tokens", async ({ page }) => {
  const neg = page.getByRole("button", { name: "Negative", exact: true }).and(page.locator('[data-slot="toggle-button"]'))
  await page.mouse.move(0, 0)
  const bg = await neg.evaluate((el) => getComputedStyle(el).backgroundColor)
  const expected = await neg.evaluate((el) => {
    const probe = document.createElement("div")
    probe.style.background = "var(--sapButton_Reject_Selected_Background)"
    el.parentElement!.append(probe)
    const v = getComputedStyle(probe).backgroundColor
    probe.remove()
    return v
  })
  expect(bg).toBe(expected)
})
