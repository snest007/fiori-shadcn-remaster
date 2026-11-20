import { expect, test, type Page } from "@playwright/test"

const opener = (page: Page) => page.locator("#user-menu-demo-open")
const menu = (page: Page) => page.getByRole("dialog", { name: "User menu for John Doe" })
const last = (page: Page) => page.locator("#user-menu-demo-last")

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/user-menu`)
  await page.waitForSelector("html[data-ready=true]")
  await opener(page).click()
  await expect(menu(page)).toBeVisible()
})

test("user-menu: opens against its opener with the first item focused; Escape closes and restores focus", async ({ page }) => {
  await expect(menu(page).getByRole("menuitem", { name: "Settings" })).toBeFocused()
  const o = (await opener(page).boundingBox())!
  const m = (await menu(page).boundingBox())!
  expect(m.y).toBeGreaterThanOrEqual(o.y + o.height)
  expect(m.width).toBe(320)
  await page.keyboard.press("Escape")
  await expect(menu(page)).toHaveCount(0)
  await expect(opener(page)).toBeFocused()
})

test("user-menu: shows the account header, manage account and sign out", async ({ page }) => {
  await expect(menu(page).getByRole("heading", { name: "John Doe" })).toBeVisible()
  await expect(menu(page).getByText("john.doe@example.com")).toBeVisible()
  await menu(page).getByRole("button", { name: "Manage Account" }).click()
  await expect(last(page)).toHaveText("Last action: manage")
  await expect(menu(page)).toBeVisible()
  await menu(page).getByRole("button", { name: "Sign Out" }).click()
  await expect(last(page)).toHaveText("Last action: sign out")
  await expect(menu(page)).toHaveCount(0)
})

test("user-menu: arrows move without wrapping, Enter and Space activate and close", async ({ page }) => {
  const item = (name: string) => menu(page).getByRole("menuitem", { name })
  await page.keyboard.press("ArrowUp")
  await expect(item("Settings")).toBeFocused()
  await page.keyboard.press("End")
  await expect(item("Help")).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(item("Help")).toBeFocused()
  await page.keyboard.press("Home")
  await page.keyboard.press("ArrowDown")
  await expect(item("Language")).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(last(page)).toHaveText("Last action: language")
  await expect(menu(page)).toHaveCount(0)
  await opener(page).click()
  await page.keyboard.press("Space")
  await expect(last(page)).toHaveText("Last action: settings")
  await expect(menu(page)).toHaveCount(0)
})

test("user-menu: hover focuses an item; Tab stays inside", async ({ page }) => {
  await menu(page).getByRole("menuitem", { name: "Help" }).hover()
  await expect(menu(page).getByRole("menuitem", { name: "Help" })).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(menu(page).getByRole("button", { name: "Sign Out" })).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(menu(page).getByRole("button", { name: "Manage Account" })).toBeFocused()
})

test("user-menu: clicking the opener closes it instead of reopening", async ({ page }) => {
  await opener(page).click()
  await expect(menu(page)).toHaveCount(0)
})

test("user-menu: custom outer host retains popup and action menu semantics", async ({ page }) => {
  await page.goto('/index.html?fixtures&only=user-menu-custom-host')
  await page.waitForSelector("html[data-ready=true]")
  const holder = page.locator('[data-fixture="user-menu-custom-host"]')
  const host = holder.locator('[data-custom-host="user-menu"]')
  await expect(host).toHaveAttribute("role", "dialog")
  await expect(host).toHaveAttribute("tabindex", "-1")
  await expect(host).toHaveAccessibleName("User menu for John Doe")
  const item = host.getByRole("menuitem", { name: "Settings", exact: true })
  await item.focus(); await expect(item).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(host.getByRole("menuitem", { name: "Language", exact: true })).toBeFocused()
})
