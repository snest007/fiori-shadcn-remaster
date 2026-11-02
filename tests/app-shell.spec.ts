import { expect, test, type Page } from "@playwright/test"

const button = (page: Page, name: string | RegExp) => page.locator("[data-slot=shell-bar]").getByRole("button", { name })

test.beforeEach(async ({ page }) => {
  await page.goto(`/block.html?name=app-shell`)
  await page.waitForSelector("html[data-ready=true]")
})

test("app-shell: full-page layout with the bar on top and the content below", async ({ page }) => {
  const bar = (await page.locator("[data-slot=shell-bar]").boundingBox())!
  const main = (await page.getByRole("main").boundingBox())!
  expect(bar.y).toBe(0)
  expect(bar.width).toBe(1280)
  expect(main.y).toBe(bar.height)
  expect(main.y + main.height).toBe(900)
  await expect(page.getByRole("main").getByRole("heading")).toBeVisible()
})

test("app-shell: notifications popover: closing and reading items updates the badge; the bell toggles it", async ({ page }) => {
  const bell = button(page, "3 Notifications")
  await expect(bell).toHaveAttribute("aria-expanded", "false")
  await bell.click()
  const popover = page.getByRole("dialog", { name: "Notifications" })
  await expect(popover.locator("[data-slot=notification-list-item]")).toHaveCount(3)
  const box = (await popover.boundingBox())!
  expect(box.x + box.width).toBeLessThanOrEqual(1280)
  await popover.locator("[data-slot=notification-list-item]").filter({ hasText: "Order #2565" }).getByRole("button", { name: "Close" }).click()
  await expect(popover.locator("[data-slot=notification-list-item]")).toHaveCount(2)
  await popover.locator("[data-slot=notification-list-item]").filter({ hasText: "Order #2566" }).click()
  await expect(button(page, "1 Notifications")).toHaveAttribute("aria-expanded", "true")
  await button(page, "1 Notifications").click()
  await expect(popover).toHaveCount(0)
  await expect(button(page, "1 Notifications")).toBeFocused()
})

test("app-shell: popups aren't loosened by the line height pages inherit from Tailwind's preflight", async ({ page }) => {
  expect(await page.locator("body").evaluate((el) => getComputedStyle(el).lineHeight)).not.toBe("normal")
  await button(page, "3 Notifications").click()
  const text = page.getByRole("dialog", { name: "Notifications" }).getByText("Needs your approval.")
  expect((await text.boundingBox())!.height).toBe(16)
  await page.keyboard.press("Escape")
  await button(page, "User Menu").click()
  const email = page.getByRole("dialog", { name: "User menu for John Doe" }).getByText("john.doe@example.com")
  expect((await email.boundingBox())!.height).toBe(16)
})

test("app-shell: user menu opens against the profile button and only one popup is open at a time", async ({ page }) => {
  await button(page, "User Menu").click()
  const menu = page.getByRole("dialog", { name: "User menu for John Doe" })
  await expect(menu.getByRole("menuitem", { name: "Settings" })).toBeFocused()
  const opener = (await button(page, "User Menu").boundingBox())!
  expect((await menu.boundingBox())!.y).toBeGreaterThanOrEqual(opener.y + opener.height)
  await button(page, "Products").click()
  await expect(menu).toHaveCount(0)
  await expect(page.getByRole("dialog", { name: "Products" })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { name: "Products" })).toHaveCount(0)
  await expect(button(page, "Products")).toBeFocused()
})

test("app-shell: product switch closes when a product is chosen", async ({ page }) => {
  await button(page, "Products").click()
  const popover = page.getByRole("dialog", { name: "Products" })
  await popover.getByRole("button", { name: /^Customers/ }).click()
  await expect(popover).toHaveCount(0)
})

test("app-shell: notifications stay reachable from the overflow popover on a phone-sized window", async ({ page }) => {
  await page.setViewportSize({ width: 300, height: 700 })
  await expect(button(page, /Notifications/)).toBeHidden()
  await button(page, "More").click()
  await page.getByRole("dialog", { name: "More" }).getByRole("listitem").filter({ hasText: "Notifications" }).click()
  await expect(page.getByRole("dialog", { name: "Notifications" })).toBeVisible()
  await expect(page.getByRole("dialog", { name: "More" })).toHaveCount(0)
})

test("app-shell: search starts collapsed, then expands and suggests", async ({ page }) => {
  await button(page, "Open Search").click()
  await page.keyboard.type("Sal")
  await expect(page.locator(".fiori-search__popover").getByRole("option")).toHaveCount(3)
  await expect(page.getByRole("searchbox")).toHaveValue("Sales orders")
})

test("app-shell: the bar and the content are fast navigation groups", async ({ page }) => {
  await expect(page.locator("main")).toHaveAttribute("data-sap-ui-fastnavgroup", "true")
  await expect(page.locator("[data-slot=shell-bar]")).toHaveAttribute("data-sap-ui-fastnavgroup", "true")
})
