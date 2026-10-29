import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
})

test("checkbox: role, name, Space and Enter toggle", async ({ page }) => {
  const cb = page.locator("#notify-email")
  await expect(cb).toHaveRole("checkbox")
  await expect(cb).toHaveAccessibleName("Email")
  await expect(cb).toHaveAttribute("aria-checked", "true")
  await cb.focus()
  await page.keyboard.press("Space")
  await expect(cb).toHaveAttribute("aria-checked", "false")
  await page.keyboard.press("Enter")
  await expect(cb).toHaveAttribute("aria-checked", "true")
  await page.locator("#notify-sms").getByText("SMS").click() // the label is part of the control
  await expect(page.locator("#notify-sms")).toHaveAttribute("aria-checked", "true")
})

test("checkbox: indeterminate is announced as mixed and becomes checked", async ({ page }) => {
  const all = page.locator("#notify-all")
  await expect(all).toHaveAttribute("aria-checked", "mixed")
  await all.focus()
  await page.keyboard.press("Space")
  await expect(all).toHaveAttribute("aria-checked", "true")
  for (const k of ["email", "sms", "push"]) await expect(page.locator(`#notify-${k}`)).toHaveAttribute("aria-checked", "true")
})

test("checkbox: read-only stays focusable but can't change", async ({ page }) => {
  const ro = page.locator("#cb-readonly")
  await expect(ro).toHaveAttribute("aria-readonly", "true")
  await ro.focus()
  await expect(ro).toBeFocused()
  await page.keyboard.press("Space")
  await page.keyboard.press("Enter")
  await ro.click()
  await expect(ro).toHaveAttribute("aria-checked", "true")
})

test("checkbox: disabled is skipped and value state is described", async ({ page }) => {
  await expect(page.locator("#cb-disabled")).toBeDisabled()
  await expect(page.locator("#cb-disabled")).toHaveAccessibleName("Disabled")
  const terms = page.locator("#terms")
  await expect(terms).toHaveAttribute("aria-required", "true")
  await expect(terms).toHaveAccessibleDescription("Warning issued")
})

test("checkbox: focus ring only for keyboard", async ({ page }) => {
  const cb = page.locator("#notify-push")
  await cb.click()
  expect(await cb.evaluate((el) => getComputedStyle(el, "::before").content)).toBe("none")
  await page.keyboard.press("Shift+Tab")
  await page.keyboard.press("Tab")
  await expect(cb).toBeFocused()
  expect(await cb.evaluate((el) => getComputedStyle(el, "::before").content)).not.toBe("none")
})
