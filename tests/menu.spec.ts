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

for (const { id, direction, openerDirection } of [
  { id: "menu-direction-owner-rtl-opener-ltr", direction: "rtl", openerDirection: "ltr" },
  { id: "menu-direction-owner-rtl-opener-ancestor-ltr", direction: "rtl", openerDirection: "ltr" },
  { id: "menu-direction-owner-ltr-opener-ancestor-rtl", direction: "ltr", openerDirection: "rtl" },
  { id: "menu-direction-explicit-ltr", direction: "ltr", openerDirection: "rtl" },
  { id: "menu-direction-explicit-rtl", direction: "rtl", openerDirection: "ltr" },
]) {
  test(`menu: portal direction follows owning scope and explicit dir (${id})`, async ({ page }) => {
    // Menu.js isRtl -> UI5Element.effectiveDir -> getEffectiveDir(this), independent
    // of opener direction. Explicit Menu dir overrides the inherited owning scope.
    for (const native of [false, true]) {
      await page.goto(native ? `/ui5.html?only=${id}` : `/index.html?fixtures&only=${id}`)
      await page.waitForSelector("html[data-ready=true]")
      const cell = page.locator(`[data-fixture="${id}"]`)
      const opener = cell.getByRole("button", { name: "Open menu", exact: true })
      await expect(opener).toHaveCSS("direction", openerDirection)
      await opener.click()
      const surface = native ? cell.getByRole("menu").first() : menus(page).first()
      await expect(surface).toBeVisible()
      await expect(surface).toHaveCSS("direction", direction)
      const scope = native ? cell : menus(page)
      // Native MenuItem's shadow row has no accessible name in this fixture;
      // locate its real focusable ListItemTemplate row beneath the text-bearing host.
      const share = native ? scope.locator('ui5-menu-item[text="Share"] .ui5-li-root').first() : scope.getByRole("menuitem", { name: "Share", exact: true })
      const email = native ? scope.locator('ui5-menu-item[text="Email"] .ui5-li-root').first() : scope.getByRole("menuitem", { name: "Email", exact: true })
      await share.focus()
      await expect(share).toBeFocused()
      await page.keyboard.press(direction === "rtl" ? "ArrowRight" : "ArrowLeft")
      await expect(email).toBeHidden()
      await expect(share).toBeFocused()
      await page.keyboard.press(direction === "rtl" ? "ArrowLeft" : "ArrowRight")
      await expect(email).toBeFocused()
      await page.keyboard.press(direction === "rtl" ? "ArrowRight" : "ArrowLeft")
      await expect(email).toBeHidden()
      await expect(share).toBeFocused()
    }
  })
}
