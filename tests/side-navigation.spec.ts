import { expect, test, type Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
})

const nav = (page: Page) => page.locator("#side-navigation-demo")
const item = (page: Page, name: string) => nav(page).getByRole("treeitem", { name, exact: true })
const value = (page: Page) => page.getByTestId("side-navigation-demo-value")

async function waitCollapsedNavigation(page: Page) {
  // SideNavigation.css.js clips widened hover/focus rows while ui5-sn-animating is present.
  // Width can reach its target before that flag is cleared; wait for both before pointer cycles.
  await expect.poll(() => nav(page).locator("[data-slot=side-navigation]").evaluate((el) => el.getBoundingClientRect().width)).toBe(64)
  await expect(nav(page).locator(".fiori-sn__root")).not.toHaveAttribute("data-animating", "")
}

// Keys.js isSpace/isEnter/isEnterShift/isEnterAlt/isEnterCtrl: Meta and Control share
// one family. NavigationMenuItem.js and SideNavigationSelectableItemBase.js use these cases.
const overflowModifierCases = [
  ["Shift+Space", false, "Shift"],
  ["Alt+Space", false, "Alt"],
  ["Control+Space", false, "Control"],
  ["Meta+Space", false, "Meta"],
  ["Control+Meta+Space", false, "Control+Meta"],
  ["Control+Shift+Space", false, "Control+Shift"],
  ["Shift+Enter", true, "Shift"],
  ["Alt+Enter", true, "Alt"],
  ["Control+Enter", true, "Control"],
  ["Meta+Enter", true, "Meta"],
  ["Control+Meta+Enter", true, "Control+Meta"],
  ["Control+Shift+Enter", false, "Control+Shift"],
  ["Meta+Shift+Enter", false, "Meta+Shift"],
  ["Alt+Shift+Enter", false, "Alt+Shift"],
  ["Control+Alt+Enter", false, "Control+Alt"],
  ["Meta+Alt+Enter", false, "Alt+Meta"],
  ["Control+Alt+Shift+Enter", false, "Control+Alt+Shift"],
] as const

test("expanded mode is a navigation landmark with two trees", async ({ page }) => {
  await expect(nav(page).getByRole("navigation", { name: "Main navigation" })).toBeVisible()
  await expect(nav(page).getByRole("tree", { name: "Primary Navigation Menu" })).toBeVisible()
  await expect(nav(page).getByRole("tree", { name: "Footer Navigation Menu" })).toBeVisible()
  await expect(item(page, "Home")).toHaveAttribute("aria-current", "page")
  await expect(item(page, "People")).toHaveAttribute("aria-expanded", "true")
  await expect(item(page, "Events")).toHaveAttribute("aria-expanded", "false")
  await expect(item(page, "Locations")).toHaveAttribute("aria-disabled", "true")
})

test("roving focus: Tab enters at the selected item, arrows / Home / End move", async ({ page }) => {
  await page.locator("#side-navigation-demo-resize").focus()
  await page.keyboard.press("Tab")
  await expect(item(page, "Home")).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(item(page, "Organization")).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(item(page, "People")).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(item(page, "From My Team")).toBeFocused()
  await page.keyboard.press("End")
  await expect(item(page, "SAP Community")).toBeFocused()
  await page.keyboard.press("Home")
  await expect(item(page, "Home")).toBeFocused()
  await page.keyboard.press("ArrowUp")
  await expect(item(page, "Home")).toBeFocused()
  // The fixed list is its own tab stop.
  await page.keyboard.press("Tab")
  await expect(item(page, "Legal")).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(item(page, "Settings")).toBeFocused()
})

test("→ / ← expand and collapse items and groups", async ({ page }) => {
  await item(page, "Home").focus()
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("ArrowLeft")
  await expect(item(page, "Organization")).toHaveAttribute("aria-expanded", "false")
  await expect(item(page, "People")).toHaveCount(0)
  await page.keyboard.press("ArrowRight")
  await expect(item(page, "Organization")).toHaveAttribute("aria-expanded", "true")
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("ArrowLeft")
  await expect(item(page, "People")).toHaveAttribute("aria-expanded", "false")
  await expect(item(page, "From My Team")).toHaveCount(0)
  await page.keyboard.press("ArrowRight")
  await expect(item(page, "From My Team")).toBeVisible()
})

test("Enter and Space select; clicking the arrow only toggles", async ({ page }) => {
  await item(page, "Home").focus()
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Enter")
  await expect(value(page)).toHaveText("people")
  await expect(item(page, "People")).toHaveAttribute("aria-current", "page")
  await expect(item(page, "Home")).not.toHaveAttribute("aria-current", "page")
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Space")
  await expect(value(page)).toHaveText("team")
  await item(page, "Events").getByRole("img", { name: "Expand" }).click()
  await expect(item(page, "Events")).toHaveAttribute("aria-expanded", "true")
  await expect(value(page)).toHaveText("team")
})

test("disabled and unselectable items are not selected", async ({ page }) => {
  await item(page, "Locations").click({ force: true })
  await expect(value(page)).toHaveText("home")
  // An unselectable parent toggles on click instead.
  await item(page, "Legal").click()
  await expect(item(page, "Legal")).toHaveAttribute("aria-expanded", "true")
  await expect(value(page)).toHaveText("home")
  await item(page, "Privacy").click()
  await expect(value(page)).toHaveText("privacy")
})

test("item with href is a link and opens in a new tab", async ({ page }) => {
  const link = item(page, "SAP Community")
  await expect(link).toHaveAttribute("href", "https://community.sap.com")
  await expect(link).toHaveAttribute("target", "_blank")
  expect(await link.evaluate((el) => el.tagName)).toBe("A")
})

test.describe("collapsed", () => {
  test.beforeEach(async ({ page }) => {
    await page.locator("#side-navigation-demo-toggle").click()
  })

  test("is a vertical menubar of icon items", async ({ page }) => {
    const bar = nav(page).getByRole("menubar", { name: "Primary Navigation Menu" })
    await expect(bar).toHaveAttribute("aria-orientation", "vertical")
    await expect(bar.getByRole("menuitemradio", { name: "Home" })).toHaveAttribute("aria-checked", "true")
    await expect(bar.getByRole("menuitemradio", { name: "Events" })).toHaveAttribute("aria-haspopup", "tree")
    await expect(nav(page).getByRole("treeitem")).toHaveCount(0)
    // Width animates (0.3s) to --fiori-side-navigation-collapsed-width.
    await expect.poll(() => nav(page).locator("[data-slot=side-navigation]").evaluate((el) => el.getBoundingClientRect().width)).toBe(64)
  })

  test("an item with sub-items opens a popover tree; selecting closes it", async ({ page }) => {
    const events = nav(page).getByRole("menuitemradio", { name: "Events" })
    await events.click()
    await expect(events).toHaveAttribute("aria-expanded", "true")
    const pop = page.getByRole("dialog", { name: "Navigation" })
    await expect(pop.getByRole("treeitem", { name: "Events" })).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(pop.getByRole("treeitem", { name: "Local" })).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(pop).toHaveCount(0)
    await expect(value(page)).toHaveText("local")
    await expect(events).toHaveAttribute("aria-checked", "true")
    await expect(events).toBeFocused()
  })

  test("keyboard: → opens the popover, Escape and ← close it", async ({ page }) => {
    const events = nav(page).getByRole("menuitemradio", { name: "Events" })
    await nav(page).getByRole("menuitemradio", { name: "Home" }).focus()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    await expect(nav(page).getByRole("menuitemradio", { name: "Locations" })).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(events).toBeFocused()
    await page.keyboard.press("ArrowRight")
    const pop = page.getByRole("dialog", { name: "Navigation" })
    await expect(pop).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(pop).toHaveCount(0)
    await expect(events).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(pop).toBeVisible()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowLeft")
    await expect(pop).toHaveCount(0)
    await expect(events).toBeFocused()
  })

  test("an unselectable parent's popover starts at its first sub-item", async ({ page }) => {
    await nav(page).getByRole("menuitem", { name: "Legal" }).click()
    const pop = page.getByRole("dialog", { name: "Navigation" })
    await expect(pop.getByRole("treeitem", { name: "Terms of use" })).toBeFocused()
    await page.keyboard.press("ArrowUp")
    await expect(pop.getByRole("treeitem", { name: "Terms of use" })).toBeFocused()
  })

  test("shrinking and growing the flexible area adds and removes More", async ({ page }) => {
    const more = nav(page).getByRole("menuitem", { name: "More Items", exact: true })
    await expect(more).toBeHidden()
    await page.locator("#side-navigation-demo-resize").click()
    await expect(more).toBeVisible()
    await expect(nav(page).getByRole("menuitemradio", { name: "History", exact: true })).toHaveCount(0)
    await more.click()
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    await expect(menu.getByRole("menuitem", { name: "History", exact: true })).toBeVisible()
    await expect(menu.getByRole("menuitem", { name: "Events", exact: true })).toBeVisible()
    await expect(menu.getByRole("menuitem", { name: "Locations", exact: true })).toHaveAttribute("aria-disabled", "true")
    await expect(menu.getByRole("menuitem", { name: "Home", exact: true })).toHaveCount(0)
    await page.keyboard.press("Escape")
    await expect(menu).toHaveCount(0)
    await expect(more).toBeFocused()
    await page.locator("#side-navigation-demo-resize").click()
    await expect(more).toBeHidden()
    await expect(nav(page).getByRole("menuitemradio", { name: "History", exact: true })).toBeVisible()
  })

  for (const key of ["Enter", "Space"]) {
    test(`More participates in menubar focus and opens with ${key}`, async ({ page }) => {
      await page.locator("#side-navigation-demo-resize").click()
      const bar = nav(page).getByRole("menubar", { name: "Primary Navigation Menu" })
      const more = bar.getByRole("menuitem", { name: "More Items", exact: true })
      await expect(more).toBeVisible()
      await bar.getByRole("menuitemradio", { name: "Home", exact: true }).focus()
      await page.keyboard.press("End")
      await expect(more).toBeFocused()
      await page.keyboard.press(key)
      const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
      await expect(menu).toBeVisible()
      await expect(menu.getByRole("menuitem", { name: "Locations", exact: true })).toBeFocused()
      await page.keyboard.press("Escape")
      await expect(menu).toHaveCount(0)
      await expect(more).toBeFocused()
    })
  }

  test("More keeps focus and stays closed on ArrowDown, as UI5's item key handler", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    const more = nav(page).getByRole("menuitem", { name: "More Items", exact: true })
    await expect(more).toBeVisible()
    await more.focus()
    await page.keyboard.press("ArrowDown")
    await expect(more).toBeFocused()
    await expect(more).toHaveAttribute("aria-expanded", "false")
    await expect(page.getByRole("menu", { name: "Additional Navigation Items", exact: true })).toHaveCount(0)
  })

  test("More keeps its focused hit target through pointerdown and opens only on click", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    await waitCollapsedNavigation(page)
    const more = nav(page).getByRole("menuitem", { name: "More Items", exact: true })
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    await more.focus()
    await expect(more).toBeFocused()
    const before = (await more.boundingBox())!
    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2)
    await page.mouse.down()
    await expect(more).toBeFocused()
    await expect(more).toHaveAttribute("aria-expanded", "false")
    await expect(menu).toHaveCount(0)
    expect(await more.boundingBox()).toEqual(before)
    await page.mouse.up()
    await expect(menu.getByRole("menuitem", { name: "Locations", exact: true })).toBeFocused()
    await expect(more).toHaveAttribute("aria-expanded", "true")
    await expect(page.getByTestId("side-navigation-demo-clicks")).toHaveText("0")
    await page.keyboard.press("Escape")
    await expect(menu).toHaveCount(0)
    await expect(more).toBeFocused()
  })

  test("More accepts UI5's Enter modifier families and ignores modified Space and mixed Enter", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    const more = nav(page).getByRole("menuitem", { name: "More Items", exact: true })
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    await expect(more).toBeVisible()
    await more.focus()
    await expect(more).toBeFocused()
    for (const [key, accepted] of overflowModifierCases) {
      await page.keyboard.press(key)
      if (accepted) {
        await expect(menu.getByRole("menuitem", { name: "Locations", exact: true })).toBeFocused()
        await expect(more).toHaveAttribute("aria-expanded", "true")
        await page.keyboard.press("Escape")
      }
      await expect(menu).toHaveCount(0)
      await expect(more).toHaveAttribute("aria-expanded", "false")
      await expect(more).toBeFocused()
      await expect(page.getByTestId("side-navigation-demo-clicks")).toHaveText("0")
    }
  })

  test("overflow parent ignores Shift+Space without callbacks, focus changes, or opening", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    await nav(page).getByRole("menuitem", { name: "More Items", exact: true }).click()
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    await expect(menu.getByRole("menuitem", { name: "Locations", exact: true })).toBeFocused()
    const events = menu.getByRole("menuitem", { name: "Events", exact: true })
    await events.focus()
    await expect(events).toBeFocused()
    await page.keyboard.press("Shift+Space")
    await expect(events).toBeFocused()
    await expect(events).toHaveAttribute("aria-expanded", "false")
    const submenu = page.getByRole("menu", { name: "Events", exact: true })
    await expect(submenu).toHaveCount(0)
    await expect(page.getByTestId("side-navigation-demo-events-clicks")).toHaveText("0")
    await expect(page.getByTestId("side-navigation-demo-clicks")).toHaveText("0")
    await expect(value(page)).toHaveText("home")
    await page.keyboard.press("Space")
    await expect(submenu.getByRole("menuitem", { name: "Events", exact: true })).toBeFocused()
    await expect(page.getByTestId("side-navigation-demo-events-clicks")).toHaveText("1")
  })

  test("overflow parent modifier matrix preserves callback modifiers and only opens for supported keys", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    await nav(page).getByRole("menuitem", { name: "More Items", exact: true }).click()
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    await expect(menu.getByRole("menuitem", { name: "Locations", exact: true })).toBeFocused()
    const events = menu.getByRole("menuitem", { name: "Events", exact: true })
    const submenu = page.getByRole("menu", { name: "Events", exact: true })
    const callbacks = page.getByTestId("side-navigation-demo-clicks")
    await events.focus()
    await expect(events).toBeFocused()
    let count = 0
    for (const [key, accepted, modifiers] of overflowModifierCases) {
      await page.keyboard.press(key)
      if (accepted) {
        count++
        await expect(submenu.getByRole("menuitem", { name: "Events", exact: true })).toBeFocused()
        await expect(callbacks).toHaveAttribute("data-modifiers", modifiers)
        await page.keyboard.press("Escape")
      }
      await expect(submenu).toHaveCount(0)
      await expect(events).toHaveAttribute("aria-expanded", "false")
      await expect(events).toBeFocused()
      await expect(callbacks).toHaveText(String(count))
      await expect(page.getByTestId("side-navigation-demo-events-clicks")).toHaveText(String(count))
      await expect(value(page)).toHaveText("home")
    }
  })

  test("overflow leaf modifier matrix selects once with original modifiers and blocks unsupported defaults", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    await waitCollapsedNavigation(page)
    const more = nav(page).getByRole("menuitem", { name: "More Items", exact: true })
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    const callbacks = page.getByTestId("side-navigation-demo-clicks")
    for (const [key, accepted, modifiers] of overflowModifierCases) {
      await expect(more).toBeVisible()
      await more.click()
      await expect(menu.getByRole("menuitem", { name: "Locations", exact: true })).toBeFocused()
      const history = menu.getByRole("menuitem", { name: "History", exact: true })
      await history.focus()
      await expect(history).toBeFocused()
      const count = Number(await callbacks.textContent())
      await page.keyboard.press(key)
      if (accepted) {
        await expect(menu).toHaveCount(0)
        await expect(value(page)).toHaveText("history")
        await expect(callbacks).toHaveText(String(count + 1))
        await expect(callbacks).toHaveAttribute("data-modifiers", modifiers)
        await expect(nav(page).getByRole("menuitemradio", { name: "History", exact: true })).toBeFocused()
        // The selected trailing item reserves the visible slot; Home is now in More.
        await more.click()
        const home = menu.getByRole("menuitem", { name: "Home", exact: true })
        await expect(home).toBeFocused()
        await home.click()
        await expect(menu).toHaveCount(0)
        await expect(value(page)).toHaveText("home")
        await expect(nav(page).getByRole("menuitemradio", { name: "Home", exact: true })).toBeFocused()
      } else {
        await expect(menu).toBeVisible()
        await expect(history).toBeFocused()
        await expect(value(page)).toHaveText("home")
        await expect(callbacks).toHaveText(String(count))
        await page.keyboard.press("Escape")
        await expect(menu).toHaveCount(0)
        await expect(more).toBeFocused()
      }
    }
  })

  for (const key of ["Enter", "Space"]) {
    test(`More, overflow parent and leaf activate ${key} on ${key === "Enter" ? "keydown" : "keyup"} exactly once`, async ({ page }) => {
      await page.locator("#side-navigation-demo-resize").click()
      const more = nav(page).getByRole("menuitem", { name: "More Items", exact: true })
      const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
      const submenu = page.getByRole("menu", { name: "Events", exact: true })
      const callbacks = page.getByTestId("side-navigation-demo-events-clicks")
      await expect(more).toBeVisible()
      await more.focus()
      await expect(more).toBeFocused()
      await page.keyboard.down(key)
      if (key === "Space") {
        await expect(menu).toHaveCount(0)
        await expect(more).toBeFocused()
      } else await expect(menu.getByRole("menuitem", { name: "Locations", exact: true })).toBeFocused()
      await page.keyboard.up(key)
      await expect(menu.getByRole("menuitem", { name: "Locations", exact: true })).toBeFocused()
      const events = menu.getByRole("menuitem", { name: "Events", exact: true })
      await events.focus()
      await expect(events).toBeFocused()
      await page.keyboard.down(key)
      if (key === "Space") {
        await expect(submenu).toHaveCount(0)
        await expect(events).toBeFocused()
        await expect(callbacks).toHaveText("0")
      } else {
        await expect(submenu.getByRole("menuitem", { name: "Events", exact: true })).toBeFocused()
        await expect(callbacks).toHaveText("1")
      }
      await page.keyboard.up(key)
      const parentAction = submenu.getByRole("menuitem", { name: "Events", exact: true })
      await expect(parentAction).toBeFocused()
      await expect(callbacks).toHaveText("1")
      await page.keyboard.down(key)
      if (key === "Space") {
        await expect(parentAction).toBeFocused()
        await expect(callbacks).toHaveText("1")
        await expect(value(page)).toHaveText("home")
      } else {
        await expect(menu).toHaveCount(0)
        await expect(callbacks).toHaveText("2")
        await expect(value(page)).toHaveText("events")
      }
      await page.keyboard.up(key)
      await expect(menu).toHaveCount(0)
      await expect(submenu).toHaveCount(0)
      await expect(callbacks).toHaveText("2")
      await expect(value(page)).toHaveText("events")
      await expect(nav(page).getByRole("menuitemradio", { name: "Events", exact: true })).toBeFocused()
    })
  }

  test("overflow links activate on supported Enter without navigation and follow href on plain Space", async ({ page, context }) => {
    await page.locator("#side-navigation-demo-resize").click()
    await waitCollapsedNavigation(page)
    const more = nav(page).getByRole("menuitem", { name: "More Items", exact: true })
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    const callbacks = page.getByTestId("side-navigation-demo-clicks")
    let count = 0
    for (const key of ["Enter", "Shift+Enter", "Alt+Enter", "Control+Enter", "Meta+Enter", "Control+Meta+Enter"]) {
      await more.click()
      await expect(menu.getByRole("menuitem", { name: "Locations", exact: true })).toBeFocused()
      const external = menu.getByRole("menuitem", { name: "SAP Community", exact: true })
      await external.focus()
      await expect(external).toBeFocused()
      await page.keyboard.press(key)
      await expect(menu).toHaveCount(0)
      await expect(callbacks).toHaveText(String(++count))
      await expect(more).toBeFocused()
      await expect(value(page)).toHaveText("home")
      expect(context.pages()).toHaveLength(1)
    }
    await more.click()
    await expect(menu.getByRole("menuitem", { name: "Locations", exact: true })).toBeFocused()
    const external = menu.getByRole("menuitem", { name: "SAP Community", exact: true })
    await external.focus()
    await expect(external).toBeFocused()
    for (const key of ["Shift+Space", "Meta+Space", "Control+Shift+Enter", "Meta+Alt+Enter"]) {
      await page.keyboard.press(key)
      await expect(external).toBeFocused()
      await expect(menu).toBeVisible()
      await expect(callbacks).toHaveText(String(count))
      expect(context.pages()).toHaveLength(1)
    }
    await context.route("https://community.sap.com/**", (route) => route.fulfill({ body: "External navigation target" }))
    const newPage = context.waitForEvent("page")
    await page.keyboard.press("Space")
    const popup = await newPage
    await popup.waitForURL("https://community.sap.com/")
    await expect(menu).toHaveCount(0)
    await expect(callbacks).toHaveText(String(count + 1))
    expect(context.pages()).toHaveLength(2)
    await popup.close()
  })

  test("disabled overflow rows remain in focus navigation and block activation", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    await nav(page).getByRole("menuitem", { name: "More Items", exact: true }).click()
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    const locations = menu.getByRole("menuitem", { name: "Locations", exact: true })
    await expect(locations).toBeFocused()
    await expect(locations).toHaveAttribute("aria-disabled", "true")
    for (const key of ["Enter", "Space"]) {
      await page.keyboard.press(key)
      await expect(menu).toBeVisible()
      await expect(locations).toBeFocused()
      await expect(value(page)).toHaveText("home")
    }
    // Bypass Playwright's aria-disabled actionability gate to exercise UI5's pointer-accessible row.
    await locations.click({ force: true })
    await expect(menu).toBeVisible()
    await expect(value(page)).toHaveText("home")
    await page.keyboard.press("ArrowDown")
    await expect(menu.getByRole("menuitem", { name: "Events", exact: true })).toBeFocused()
    await page.keyboard.press("ArrowUp")
    await expect(locations).toBeFocused()
    await page.keyboard.press("End")
    await expect(menu.getByRole("menuitem", { name: "SAP Community", exact: true })).toBeFocused()
    await page.keyboard.press("Home")
    await expect(locations).toBeFocused()
  })

  test("hovering an overflow parent preserves focus and leaves its submenu closed", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    await nav(page).getByRole("menuitem", { name: "More Items", exact: true }).click()
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    const locations = menu.getByRole("menuitem", { name: "Locations", exact: true })
    const events = menu.getByRole("menuitem", { name: "Events", exact: true })
    await expect(locations).toBeFocused()
    await page.clock.install()
    await events.hover()
    // Advance virtual time past Radix's delayed hover opening; no real-time wait is needed.
    await page.clock.fastForward(1_000)
    await expect(events).toHaveAttribute("aria-expanded", "false")
    await expect(page.getByRole("menu", { name: "Events", exact: true })).toHaveCount(0)
    await expect(locations).toBeFocused()
    await page.mouse.move(0, 0)
    await expect(locations).toBeFocused()
    await expect(page.getByTestId("side-navigation-demo-events-clicks")).toHaveText("0")
    await expect(page.getByTestId("side-navigation-demo-clicks")).toHaveText("0")
    await expect(value(page)).toHaveText("home")
  })

  test("hovering overflow leaves preserves keyboard focus, including disabled and external rows", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    await nav(page).getByRole("menuitem", { name: "More Items", exact: true }).click()
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    const events = menu.getByRole("menuitem", { name: "Events", exact: true })
    await events.focus()
    await expect(events).toBeFocused()
    await page.clock.install()
    for (const name of ["History", "SAP Community", "Locations"]) {
      await menu.getByRole("menuitem", { name, exact: true }).hover({ force: name === "Locations" })
      await page.clock.fastForward(1_000)
      await expect(events).toBeFocused()
      await expect(events).toHaveAttribute("aria-expanded", "false")
      await expect(page.getByRole("menu", { name: "Events", exact: true })).toHaveCount(0)
    }
    await page.mouse.move(0, 0)
    await expect(events).toBeFocused()
    await expect(page.getByTestId("side-navigation-demo-clicks")).toHaveText("0")
    await expect(value(page)).toHaveText("home")
  })

  test("submenu parent-action and child hover focus their rows while root hover preserves the open submenu", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    await nav(page).getByRole("menuitem", { name: "More Items", exact: true }).click()
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    const events = menu.getByRole("menuitem", { name: "Events", exact: true })
    await events.focus()
    await expect(events).toBeFocused()
    await page.keyboard.press("ArrowRight")
    const submenu = page.getByRole("menu", { name: "Events", exact: true })
    const parentAction = submenu.getByRole("menuitem", { name: "Events", exact: true })
    const local = submenu.getByRole("menuitem", { name: "Local", exact: true })
    await expect(parentAction).toBeFocused()
    await local.hover()
    await expect(local).toBeFocused()
    await parentAction.hover()
    await expect(parentAction).toBeFocused()
    await local.hover()
    await expect(local).toBeFocused()
    await page.clock.install()
    for (const name of ["Events", "History"]) {
      await menu.getByRole("menuitem", { name, exact: true }).hover()
      await page.clock.fastForward(1_000)
      await expect(local).toBeFocused()
      await expect(submenu).toBeVisible()
      await expect(events).toHaveAttribute("aria-expanded", "true")
    }
    await expect(page.getByTestId("side-navigation-demo-events-clicks")).toHaveText("0")
    await expect(page.getByTestId("side-navigation-demo-clicks")).toHaveText("0")
    await expect(value(page)).toHaveText("home")
  })

  test("overflow menu centers on More and clamps inside a constrained viewport", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    const more = nav(page).getByRole("menuitem", { name: "More Items", exact: true })
    await expect(more).toBeVisible()
    await more.evaluate((el) => el.scrollIntoView({ block: "center" }))
    await more.click()
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    await expect(menu).toBeVisible()
    const expectPlacement = async () => {
      let anchor = await more.boundingBox()
      await expect.poll(async () => {
        const current = await more.boundingBox()
        const settled = current !== null && anchor !== null
          && current.x === anchor.x && current.y === anchor.y
          && current.width === anchor.width && current.height === anchor.height
        anchor = current
        return settled
      }).toBe(true)
      const triggerCenter = anchor!.y + anchor!.height / 2
      const viewportHeight = await page.evaluate(() => document.documentElement.clientHeight)
      await expect.poll(async () => {
        const surface = (await menu.boundingBox())!
        // Popover.js getHorizontalTop/calcPlacement centers the surface, then clamps with VIEWPORT_MARGIN (10px).
        const expectedTop = Math.max(10, Math.min(triggerCenter - surface.height / 2, viewportHeight - surface.height - 10))
        return Math.abs(surface.y - expectedTop)
      }).toBeLessThanOrEqual(1)
    }
    await expectPlacement()
    await page.keyboard.press("Escape")
    await expect(menu).toHaveCount(0)
    await page.setViewportSize({ width: 1280, height: 280 })
    await more.evaluate((el) => el.scrollIntoView({ block: "end" }))
    await more.click()
    await expect(menu).toBeVisible()
    await expectPlacement()
  })

  test("a hidden external leaf shows its indicator and opens its target once", async ({ page, context }) => {
    await page.locator("#side-navigation-demo-resize").click()
    await nav(page).getByRole("menuitem", { name: "More Items", exact: true }).click()
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    const external = menu.getByRole("menuitem", { name: "SAP Community", exact: true })
    await expect(external.locator(".fiori-sn-menu-external")).toBeVisible()
    await context.route("https://community.sap.com/**", (route) => route.fulfill({ body: "External navigation target" }))
    const newPage = context.waitForEvent("page")
    await external.click()
    const popup = await newPage
    await popup.waitForURL("https://community.sap.com/")
    await expect(menu).toHaveCount(0)
    await expect(value(page)).toHaveText("home")
    expect(context.pages()).toHaveLength(2)
    await popup.close()
  })

  test("overflow selection reveals the selected trailing item and focuses it", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    const more = nav(page).getByRole("menuitem", { name: "More Items", exact: true })
    await expect(more).toBeVisible()
    await more.click()
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    await menu.getByRole("menuitem", { name: "History", exact: true }).click()
    await expect(menu).toHaveCount(0)
    await expect(value(page)).toHaveText("history")
    const history = nav(page).getByRole("menuitemradio", { name: "History", exact: true })
    await expect(history).toHaveAttribute("aria-checked", "true")
    await expect(history).toBeFocused()
    await more.click()
    await expect(menu.getByRole("menuitem", { name: "History", exact: true })).toHaveCount(0)
    await expect(menu.getByRole("menuitem", { name: "People", exact: true })).toBeVisible()
  })

  test("overflow submenus expose the parent action and preserve a selected child", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    const more = nav(page).getByRole("menuitem", { name: "More Items", exact: true })
    await expect(more).toBeVisible()
    await more.click()
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    const events = menu.getByRole("menuitem", { name: "Events", exact: true })
    await events.focus()
    await page.keyboard.press("ArrowRight")
    const submenu = page.getByRole("menu", { name: "Events", exact: true })
    await expect(submenu.getByRole("menuitem", { name: "Events", exact: true })).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(submenu.getByRole("menuitem", { name: "Local", exact: true })).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(menu).toHaveCount(0)
    await expect(submenu).toHaveCount(0)
    await expect(value(page)).toHaveText("local")
    const selectedParent = nav(page).getByRole("menuitemradio", { name: "Events", exact: true })
    await expect(selectedParent).toHaveAttribute("aria-checked", "true")
    await expect(selectedParent).toBeFocused()
    await selectedParent.click()
    const pop = page.getByRole("dialog", { name: "Navigation" })
    await expect(pop.getByRole("treeitem", { name: "Local", exact: true })).toBeFocused()
  })

  for (const key of ["Enter", "Space", "click"]) {
    for (const canceled of [false, true]) {
      test(`overflow parent ${key} invokes click once, opens its submenu, and ${canceled ? "cancels" : "allows"} selection`, async ({ page }) => {
        await page.locator("#side-navigation-demo-resize").click()
        if (canceled) {
          const preventSelection = page.locator("#side-navigation-demo-prevent-events")
          await preventSelection.click()
          await expect(preventSelection).toHaveAttribute("aria-pressed", "true")
        }
        const more = nav(page).getByRole("menuitem", { name: "More Items", exact: true })
        await expect(more).toBeVisible()
        await more.click()
        const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
        const events = menu.getByRole("menuitem", { name: "Events", exact: true })
        await events.focus()
        await expect(events).toBeFocused()
        const submenu = page.getByRole("menu", { name: "Events", exact: true })
        await expect(submenu).toHaveCount(0)
        if (key === "click") await events.click()
        else await page.keyboard.press(key)
        const parentAction = submenu.getByRole("menuitem", { name: "Events", exact: true })
        await expect(parentAction).toBeFocused()
        await expect(events).toHaveAttribute("aria-expanded", "true")
        await expect(page.getByTestId("side-navigation-demo-events-clicks")).toHaveText("1")
        await expect(page.getByTestId("side-navigation-demo-clicks")).toHaveText("1")
        await expect(value(page)).toHaveText("home")
        if (key === "click") await parentAction.click()
        else await page.keyboard.press(key)
        await expect(menu).toHaveCount(0)
        await expect(submenu).toHaveCount(0)
        await expect(page.getByTestId("side-navigation-demo-events-clicks")).toHaveText("2")
        await expect(page.getByTestId("side-navigation-demo-clicks")).toHaveText("2")
        await expect(value(page)).toHaveText(canceled ? "home" : "events")
        await expect(canceled ? more : nav(page).getByRole("menuitemradio", { name: "Events", exact: true })).toBeFocused()
      })
    }
  }
})
