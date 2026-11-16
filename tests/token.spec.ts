import { expect, test } from "@playwright/test"

for (const theme of ["sap_horizon", "sap_horizon_hcb"]) test(`Token ${theme} keeps selection semantics and keyboard-only focus`, async ({ page }) => {
  await page.goto(`/index.html?fixtures&only=token&theme=${theme}`)
  await page.waitForSelector("html[data-ready=true]")
  const cell = page.locator('[data-fixture="token"]')
  const token = cell.getByRole("option", { name: "Andorra", exact: true })
  const painted = () => token.evaluate((node) => {
    const css = getComputedStyle(node), after = getComputedStyle(node, "::after")
    return css.outlineStyle !== "none" && Number.parseFloat(css.outlineWidth) > 0
      || !["none", "normal"].includes(after.content) && after.borderTopStyle !== "none" && Number.parseFloat(after.borderTopWidth) > 0
  })
  await token.click()
  await expect(token).toBeFocused()
  await expect(token).toHaveAttribute("aria-selected", "true")
  expect(await painted()).toBe(false)
  await cell.evaluate((node) => {
    const before = document.createElement("button"); before.id = "token-e4-before"; before.textContent = "Before token"
    node.before(before); before.focus()
  })
  await expect(page.locator("#token-e4-before")).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(token).toBeFocused()
  expect(await painted()).toBe(true)
})
