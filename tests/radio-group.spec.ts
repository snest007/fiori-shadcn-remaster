import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
})

test("radio group: roles, one tab stop on the checked item", async ({ page }) => {
  const group = page.getByRole("radiogroup", { name: "Shipping" })
  const radios = group.getByRole("radio")
  await expect(radios).toHaveCount(4)
  await expect(group.getByRole("radio", { name: "Standard" })).toHaveAttribute("aria-checked", "true")
  await expect(group.getByRole("radio", { name: "Express" })).toHaveAttribute("aria-checked", "false")
  // Roving tabindex: Tab into the group lands on the checked radio, and once the group has been
  // entered only that radio is in the tab order.
  await page.locator("#notify-push").focus()
  await page.keyboard.press("Tab")
  await page.keyboard.press("Tab")
  await page.keyboard.press("Tab")
  await expect(group.getByRole("radio", { name: "Standard" })).toBeFocused()
  const tabbable = await radios.evaluateAll((els) => els.map((e) => e.getAttribute("tabindex")))
  expect(tabbable).toEqual(["0", "-1", "-1", "-1"])
})

test("radio group: arrow keys move focus and selection, skip disabled, wrap", async ({ page }) => {
  const group = page.getByRole("radiogroup", { name: "Shipping" })
  const r = (name: string) => group.getByRole("radio", { name })
  await r("Standard").focus()
  await page.keyboard.press("ArrowDown")
  await expect(r("Express")).toBeFocused()
  await expect(r("Express")).toHaveAttribute("aria-checked", "true")
  await expect(r("Standard")).toHaveAttribute("aria-checked", "false")
  await page.keyboard.press("ArrowRight") // skips the disabled "Pick-up"
  await expect(r("Overnight")).toBeFocused()
  await expect(r("Overnight")).toHaveAttribute("aria-checked", "true")
  await page.keyboard.press("ArrowDown") // wraps to the first
  await expect(r("Standard")).toBeFocused()
  await expect(r("Standard")).toHaveAttribute("aria-checked", "true")
  await page.keyboard.press("ArrowUp") // wraps back
  await expect(r("Overnight")).toHaveAttribute("aria-checked", "true")
  await page.keyboard.press("ArrowLeft")
  await expect(r("Express")).toHaveAttribute("aria-checked", "true")
  const tabbable = await group.getByRole("radio").evaluateAll((els) => els.map((e) => e.getAttribute("tabindex")))
  expect(tabbable).toEqual(["-1", "0", "-1", "-1"])
})

test("radio group: Tab leaves the group, Shift+Tab returns to the checked radio", async ({ page }) => {
  const group = page.getByRole("radiogroup", { name: "Shipping" })
  await group.getByRole("radio", { name: "Standard" }).focus()
  await page.keyboard.press("Tab")
  await expect(page.getByRole("radiogroup", { name: "Payment" }).getByRole("radio", { name: "Card" })).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(group.getByRole("radio", { name: "Standard" })).toBeFocused()
})

test("radio group: Space and Enter select the focused radio", async ({ page }) => {
  const group = page.getByRole("radiogroup", { name: "Payment" })
  const invoice = group.getByRole("radio", { name: "Invoice" })
  await expect(invoice).toHaveAttribute("aria-invalid", "true")
  await expect(invoice).toHaveAccessibleDescription("Invalid entry")
  await invoice.click()
  await expect(invoice).toHaveAttribute("aria-checked", "true")
  await group.getByRole("radio", { name: "Card" }).click()
  await invoice.evaluate((el) => (el as HTMLElement).focus())
  await page.keyboard.press("Enter")
  await expect(invoice).toHaveAttribute("aria-checked", "true")
})

test("radio group: read-only can't change selection", async ({ page }) => {
  const group = page.getByRole("radiogroup", { name: "Plan" })
  await expect(group).toHaveAttribute("aria-readonly", "true")
  await group.getByRole("radio", { name: "Free" }).click()
  await expect(group.getByRole("radio", { name: "Pro" })).toHaveAttribute("aria-checked", "true")
  await group.getByRole("radio", { name: "Pro" }).focus()
  await page.keyboard.press("ArrowLeft")
  await expect(group.getByRole("radio", { name: "Pro" })).toHaveAttribute("aria-checked", "true")
  await expect(group.getByRole("radio", { name: "Free" })).toHaveAttribute("aria-checked", "false")
})
