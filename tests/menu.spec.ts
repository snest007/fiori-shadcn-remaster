import { expect, test, type Page } from "@playwright/test"

// The docs page also shows open, in-place menus (fixtures); popups opened from the demo are portaled to <body>.
const menus = (page: Page) => page.locator("body > [data-radix-popper-content-wrapper]").getByRole("menu")

const open = async (page: Page, how: "click" | "Enter" | "Space" | "ArrowDown") => {
  const trigger = page.locator("#open-menu")
  if (how === "click") await trigger.click()
  else {
    await trigger.focus()
    await page.keyboard.press(how)
  }
  const menu = menus(page).first()
  await expect(menu).toBeVisible()
  return menu
}

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/menu`)
  await page.waitForSelector("html[data-ready=true]")
})

for (const how of ["click", "Enter", "Space", "ArrowDown"] as const) {
  test(`menu: opening with ${how} focuses the first item`, async ({ page }) => {
    await open(page, how)
    await expect(menus(page).getByRole("menuitem", { name: "Edit" })).toBeFocused()
  })
}

test("menu: ARIA roles", async ({ page }) => {
  const trigger = page.locator("#open-menu")
  await expect(trigger).toHaveAttribute("aria-haspopup", "menu")
  const menu = await open(page, "click")
  await expect(trigger).toHaveAttribute("aria-expanded", "true")
  await expect(menu.getByRole("menuitem")).toHaveCount(5)
  await expect(menu.getByRole("separator")).toHaveCount(1)
  await expect(menu.getByRole("menuitem", { name: "Paste" })).toHaveAttribute("aria-disabled", "true")
  await expect(menu.getByRole("menuitem", { name: "Share" })).toHaveAttribute("aria-haspopup", "menu")
})

test("menu: arrow keys skip disabled items and Enter activates", async ({ page }) => {
  await open(page, "Enter")
  await page.keyboard.press("ArrowDown")
  await expect(menus(page).getByRole("menuitem", { name: "Copy" })).toBeFocused()
  await page.keyboard.press("ArrowDown") // Paste is disabled
  await expect(menus(page).getByRole("menuitem", { name: "Share" })).toBeFocused()
  await page.keyboard.press("ArrowUp")
  await expect(menus(page).getByRole("menuitem", { name: "Copy" })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(menus(page)).toHaveCount(0)
  await expect(page.locator("#menu-result")).toHaveText("Selected: Copy")
  await expect(page.locator("#open-menu")).toBeFocused()
})

test("menu: Space activates", async ({ page }) => {
  await open(page, "Enter")
  await page.keyboard.press("End")
  await expect(menus(page).getByRole("menuitem", { name: "Delete" })).toBeFocused()
  await page.keyboard.press("Space")
  await expect(page.locator("#menu-result")).toHaveText("Selected: Delete")
})

test("menu: → opens a submenu, ← closes it, Escape closes only the submenu", async ({ page }) => {
  await open(page, "Enter")
  const share = menus(page).getByRole("menuitem", { name: "Share" })
  await share.focus()
  await page.keyboard.press("ArrowRight")
  const email = menus(page).getByRole("menuitem", { name: "Email" })
  await expect(email).toBeFocused()
  await expect(share).toHaveAttribute("aria-expanded", "true")
  await page.keyboard.press("ArrowLeft")
  await expect(email).toHaveCount(0)
  await expect(share).toBeFocused()
  // UI5: Escape in a submenu closes just that submenu.
  await page.keyboard.press("ArrowRight")
  await expect(email).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(email).toHaveCount(0)
  await expect(share).toBeFocused()
  await expect(menus(page)).toHaveCount(1)
  // Choosing a submenu item closes everything.
  await page.keyboard.press("ArrowRight")
  await expect(email).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(menus(page).getByRole("menuitem", { name: "Chat" })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(menus(page)).toHaveCount(0)
  await expect(page.locator("#menu-result")).toHaveText("Selected: Chat")
})

test("menu: submenu opens to the side of its item, aligned with it", async ({ page }) => {
  await open(page, "Enter")
  const share = menus(page).getByRole("menuitem", { name: "Share" })
  await share.focus()
  await page.keyboard.press("ArrowRight")
  const sub = menus(page).nth(1)
  await expect(sub).toBeVisible()
  const s = (await share.boundingBox())!
  const b = (await sub.boundingBox())!
  expect(Math.round(b.x)).toBe(Math.round(s.x + s.width))
  expect(Math.round(b.y - s.y)).toBe(4) // UI5: margin-top .25rem
})

test("menu: Escape and Tab close it and return focus", async ({ page }) => {
  await open(page, "Enter")
  await page.keyboard.press("Escape")
  await expect(menus(page)).toHaveCount(0)
  await expect(page.locator("#open-menu")).toBeFocused()
  await open(page, "Enter")
  await page.keyboard.press("Tab")
  await expect(menus(page)).toHaveCount(0)
})

test("menu: items have the Fiori layout (icon column, additional text)", async ({ page }) => {
  const menu = await open(page, "click")
  const copy = menu.getByRole("menuitem", { name: "Copy" })
  await expect(copy.locator(".fiori-menu-item__additional-text")).toHaveText("Ctrl+C")
  // Texts align whether or not the item has an icon (Share has one; all do in the demo).
  const xs = await menu.locator(".fiori-menu-item__text").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().x)))
  expect(new Set(xs).size).toBe(1)
})


test("menu: RTL mirrors horizontal keyboard navigation", async ({ page }) => {
  await page.goto("/index.html?dir=rtl#/menu")
  await page.waitForSelector("html[data-ready=true]")
  await page.locator("#open-menu").focus()
  await page.keyboard.press("Enter")
  const share = menus(page).getByRole("menuitem", { name: "Share", exact: true })
  await expect(share).toBeVisible()
  await share.focus()
  await expect(share).toBeFocused()
  await page.keyboard.press("ArrowLeft")
  const email = menus(page).getByRole("menuitem", { name: "Email", exact: true })
  await expect(email).toBeFocused()
  await page.keyboard.press("ArrowRight")
  await expect(email).toHaveCount(0)
  await expect(share).toBeFocused()
})
