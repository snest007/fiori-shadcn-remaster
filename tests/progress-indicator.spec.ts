import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/progress-indicator`)
  await page.waitForSelector("html[data-ready=true]")
})

test("progress-indicator: role progressbar with value, valuetext and value text placement", async ({ page }) => {
  const bar = page.locator("#progress-indicator-demo [role=progressbar]")
  await expect(bar).toHaveAttribute("aria-valuenow", "30")
  await expect(bar).toHaveAttribute("aria-valuemin", "0")
  await expect(bar).toHaveAttribute("aria-valuemax", "100")
  await expect(bar).toHaveAttribute("aria-valuetext", "30%")
  await expect(bar).toHaveAccessibleName("Upload progress")
  // ≤ 50%: the value sits in the remaining part; above 50% in the bar (as UI5).
  await expect(bar.locator(".fiori-progress-indicator__remaining .fiori-progress-indicator__value")).toHaveText("30%")
  for (let i = 0; i < 3; i++) await page.locator("#progress-indicator-demo-inc").click()
  await expect(bar).toHaveAttribute("aria-valuenow", "60")
  await expect(bar.locator(".fiori-progress-indicator__bar .fiori-progress-indicator__value")).toHaveText("60%")
  const width = await bar.locator(".fiori-progress-indicator__bar").evaluate((b) => b.getBoundingClientRect().width / b.parentElement!.getBoundingClientRect().width)
  expect(width).toBeCloseTo(0.6, 2)
})

test("progress-indicator: value state appends the state text and shows the icon", async ({ page }) => {
  const bar = page.getByRole("progressbar", { name: "Positive" })
  await expect(bar).toHaveAttribute("aria-valuetext", "70% Entry successfully validated")
  await expect(bar.locator("[data-icon=status-positive]")).toBeVisible()
  await expect(page.getByRole("progressbar", { name: "Negative" })).toContainText("Failed at 45%")
})
