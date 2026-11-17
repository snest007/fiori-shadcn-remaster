import { expect, test } from "@playwright/test"

test("Select opens on completed primary click and preserves keyboard opening", async ({ page }) => {
  await page.goto("/index.html?fixtures&only=select")
  await page.waitForSelector("html[data-ready=true]")
  const trigger = page.locator('[data-fixture="select"] [data-slot="select-trigger"]')
  await trigger.hover()
  try {
    await page.mouse.down()
    await expect(trigger).toHaveAttribute("aria-expanded", "false")
    await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0)
  } finally {
    await page.mouse.up()
  }
  await expect(trigger).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByRole("option", { name: "Germany", exact: true })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(trigger).toHaveAttribute("aria-expanded", "false")
  await expect(trigger).toBeFocused()
  await page.keyboard.press("Space")
  await expect(trigger).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByRole("option", { name: "Germany", exact: true })).toBeFocused()
})

for (const locale of ["en-US", "de-DE", "zh-CN", "ar-EG"]) {
  test(`Select role and grouped option-count descriptions match native (${locale})`, async ({ browser }) => {
    const id = locale === "en-US" ? "select-grouped" : `select-l10n-${locale}`
    const native = await browser.newPage()
    const ours = await browser.newPage()
    try {
      await native.goto(`/ui5.html?locale=${locale}&only=${id}`)
      await native.waitForSelector("html[data-ready=true]")
      const descriptions = await native.locator(`[data-fixture="${id}"] ui5-select`).evaluate((host: any) => ({ role: host._ariaRoleDescription, groups: host._groupCountText }))
      await ours.goto(`/?fixtures&locale=${locale}&only=${id}`)
      await ours.waitForSelector("html[data-ready=true]")
      const trigger = ours.locator(`[data-fixture="${id}"] [data-slot="select-trigger"]`)
      await expect(trigger).toHaveAttribute("aria-roledescription", descriptions.role)
      await expect(trigger).toHaveAccessibleDescription(descriptions.groups)
      await expect(ours.locator(`[data-fixture="${id}"] [data-slot="select-group-count"]`)).toHaveText(descriptions.groups)
    } finally { await native.close(); await ours.close() }
  })
}
