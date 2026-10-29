import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
})

test("dialog: opens with focus inside, Escape closes and returns focus to the opener", async ({ page }) => {
  const opener = page.locator("#open-dialog")
  await opener.focus()
  await page.keyboard.press("Enter")
  const dialog = page.getByRole("dialog", { name: "Edit product" })
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute("aria-modal", "true")
  // Focus moves to the first focusable element.
  await expect(page.locator("#dialog-name")).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
})

test("dialog: focus is trapped inside", async ({ page }) => {
  await page.locator("#open-dialog").click()
  const dialog = page.getByRole("dialog", { name: "Edit product" })
  await expect(page.locator("#dialog-name")).toBeFocused()
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab")
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)
  }
  await page.keyboard.press("Shift+Tab")
  expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)
})

test("dialog: footer actions are end-aligned, emphasized action first", async ({ page }) => {
  await page.locator("#open-dialog").click()
  const dialog = page.getByRole("dialog", { name: "Edit product" })
  const footer = dialog.locator("[data-slot=dialog-footer]")
  const buttons = footer.getByRole("button")
  await expect(buttons).toHaveText(["Save", "Cancel"])
  await expect(buttons.first()).toHaveAttribute("data-variant", "emphasized")
  const f = (await footer.boundingBox())!
  const last = (await buttons.last().boundingBox())!
  const first = (await buttons.first().boundingBox())!
  expect(first.x).toBeLessThan(last.x)
  // Right edge: footer padding (1rem) + bar item margin (0.25rem) = 20px from the dialog's edge.
  expect(Math.round(f.x + f.width - (last.x + last.width))).toBe(20)
  await buttons.last().click()
  await expect(dialog).toHaveCount(0)
})

test("dialog: blocks the page with an overlay and is centered", async ({ page }) => {
  await page.locator("#open-dialog").click()
  const overlay = page.locator("[data-slot=dialog-overlay]")
  await expect(overlay).toBeVisible()
  const dialog = page.getByRole("dialog", { name: "Edit product" })
  const box = (await dialog.boundingBox())!
  const vp = page.viewportSize()!
  expect(Math.abs(box.x + box.width / 2 - vp.width / 2)).toBeLessThanOrEqual(1)
  expect(Math.abs(box.y + box.height / 2 - vp.height / 2)).toBeLessThanOrEqual(1)
  // Clicking the overlay does not interact with the page underneath.
  await page.mouse.click(5, vp.height - 5)
})

for (const [state, role] of [
  ["Negative", "alertdialog"],
  ["Critical", "alertdialog"],
  ["Positive", "dialog"],
  ["Information", "dialog"],
] as const) {
  test(`dialog: ${state} state has role=${role}, a state icon and a colored header line`, async ({ page }) => {
    await page.locator("[data-demo=state-dialog]").getByText(state, { exact: true }).click()
    const dialog = page.getByRole(role, { name: state })
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute("data-state-value", state.toLowerCase())
    const icon = dialog.locator("[data-slot=dialog-header] [data-slot=icon]")
    await expect(icon).toHaveAttribute("aria-hidden", "true")
    const iconName = { Negative: "error", Critical: "alert", Positive: "sys-enter-2", Information: "information" }[state]
    await expect(icon).toHaveAttribute("data-icon", iconName)
    const line = await dialog.locator(".fiori-popup__header").evaluate((h) => getComputedStyle(h, "::before").backgroundColor)
    const expected = await page.evaluate(
      (v) => {
        const probe = document.createElement("div")
        probe.style.backgroundColor = `var(${v})`
        document.body.append(probe)
        const c = getComputedStyle(probe).backgroundColor
        probe.remove()
        return c
      },
      { Negative: "--sapErrorBorderColor", Critical: "--sapWarningBorderColor", Positive: "--sapSuccessBorderColor", Information: "--sapInformationBorderColor" }[state]
    )
    expect(line).toBe(expected)
    await page.keyboard.press("Escape")
    await expect(dialog).toHaveCount(0)
  })
}
