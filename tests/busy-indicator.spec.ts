import { expect, test } from "@playwright/test"

test("busy indicator appears only after its delay and is a progressbar", async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
  const busy = page.locator("#busy-demo")
  await page.getByRole("button", { name: "Load (1s delay)" }).click()
  await page.waitForTimeout(300)
  await expect(busy.getByRole("progressbar")).toHaveCount(0)
  const bar = busy.getByRole("progressbar")
  await expect(bar).toBeVisible({ timeout: 2000 })
  await expect(bar).toHaveAttribute("aria-valuetext", "Busy")
  await expect(bar).toHaveAccessibleName("Please wait")
  await expect(busy).toHaveAttribute("aria-busy", "true")
  // Content is inert while busy.
  await expect(busy.locator("[inert]")).toHaveCount(1)
  await page.getByRole("button", { name: "Stop" }).click()
  await expect(bar).toHaveCount(0)
})
