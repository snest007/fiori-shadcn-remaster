import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/popover`)
  await page.waitForSelector("html[data-ready=true]")
})

test("popover: opens next to its opener with an arrow; Escape closes and restores focus", async ({ page }) => {
  const opener = page.locator("#open-popover")
  await opener.focus()
  await page.keyboard.press("Enter")
  const popover = page.getByRole("dialog", { name: "Details" })
  await expect(popover).toBeVisible()
  // Focus moves into the popover (first focusable element).
  await expect(popover.getByRole("button", { name: "OK" })).toBeFocused()
  const arrow = popover.locator(".fiori-popover-arrow")
  await expect(arrow).toBeVisible()
  const o = (await opener.boundingBox())!
  const p = (await popover.boundingBox())!
  // Placed on one side of the opener, 8px away (the arrow's height), like UI5.
  const gap = Math.min(Math.abs(p.y - (o.y + o.height)), Math.abs(o.y - (p.y + p.height)))
  expect(Math.round(gap)).toBe(8)
  await page.keyboard.press("Escape")
  await expect(popover).toHaveCount(0)
  await expect(opener).toBeFocused()
})

test("popover: clicking outside closes it", async ({ page }) => {
  await page.locator("#open-popover").click()
  const popover = page.getByRole("dialog", { name: "Details" })
  await expect(popover.getByRole("button", { name: "OK" })).toBeFocused()
  // Radix attaches its outside-pointer listener on a timer after mounting.
  await page.evaluate(() => new Promise((r) => setTimeout(r, 50)))
  await page.mouse.click(5, 5)
  await expect(popover).toHaveCount(0)
})

test("popover: footer button closes it", async ({ page }) => {
  await page.locator("#open-popover").click()
  const popover = page.getByRole("dialog", { name: "Details" })
  await popover.getByRole("button", { name: "OK" }).click()
  await expect(popover).toHaveCount(0)
})

test("popover: custom outer host keeps owned dialog role name refs tabindex and focus target", async ({ page }) => {
  await page.goto('/index.html?fixtures&only=popover-custom-host')
  await page.waitForSelector("html[data-ready=true]")
  const host = page.locator('[data-fixture="popover-custom-host"] [data-custom-host="popover"]')
  await expect(host).toHaveAttribute("role", "dialog")
  await expect(host).toHaveAttribute("tabindex", "-1")
  await expect(host).toHaveAccessibleName("Popover title")
  const labelledby = await host.getAttribute("aria-labelledby")
  await expect(page.locator(`[id="${labelledby}"]`)).toHaveText("Popover title")
  await host.focus(); await expect(host).toBeFocused()
})

for (const dir of ["ltr", "rtl"]) test(`popover: ${dir} children-only React host cannot drop owned semantics or ref`, async ({ page }) => {
  const id = `popover-react-host${dir === "rtl" ? "-rtl" : ""}`
  await page.goto(`/index.html?fixtures&only=${id}`)
  await page.waitForSelector("html[data-ready=true]")
  const cell = page.locator(`[data-fixture="${id}"]`)
  const host = cell.getByRole("dialog", { name: "Popover title", exact: true })
  await expect(host).toHaveCount(1)
  await expect(host).toHaveAttribute("id", `popover-react-surface-${dir}`)
  await expect(host).toHaveAttribute("tabindex", "-1")
  await expect(host).toHaveAttribute("aria-label", "Popover title")
  await expect(host).toHaveAccessibleDescription("Popover description")
  await expect(host).toHaveAttribute("aria-describedby", `popover-host-description-${dir}`)
  await expect(host).toHaveAttribute("data-owned-ref", "true")
  const labelledby = await host.getAttribute("aria-labelledby")
  await expect(cell.locator(`[id="${labelledby}"]`)).toHaveText("Popover title")
  await expect(cell.locator('[data-custom-output="popover"]')).not.toHaveAttribute("role")
  await host.focus(); await expect(host).toBeFocused()
  await cell.getByRole("button", { name: "OK", exact: true }).focus()
  await expect(cell.getByRole("button", { name: "OK", exact: true })).toBeFocused()
})
