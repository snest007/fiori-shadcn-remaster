import { expect, test, type Locator, type Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/side-navigation`)
  await page.waitForSelector("html[data-ready=true]")
})

const nav = (page: Page) => page.locator("#side-navigation-demo")
const item = (page: Page, name: string) => nav(page).getByRole("treeitem", { name, exact: true })
const value = (page: Page) => page.getByTestId("side-navigation-demo-value")

// NavigationMenuItemTemplate.js has an outer href anchor as well as its inner roving LI.
// Activation assertions target the inner row, matching UI5 getFocusDomRef().
const menuRow = (menu: Locator, name: string) => menu.getByRole("menuitem", { name, exact: true }).and(menu.locator("[data-sn-menu-row]"))

async function focusMenuRow(row: Locator) {
  await row.focus()
  await expect(row).toBeFocused()
  await expect(row).toHaveAttribute("tabindex", "0")
  await expect.poll(() => row.evaluate((el) => [...el.closest("[data-sn-overflow-menu]")!.querySelectorAll<HTMLElement>("[data-sn-menu-row]")]
    .filter((item) => item !== el).every((item) => item.tabIndex === -1))).toBe(true)
}

async function waitCollapsedNavigation(page: Page) {
  // SideNavigation.css.js clips widened hover/focus rows while ui5-sn-animating is present.
  // Width can reach its target before that flag is cleared; wait for both before pointer cycles.
  await expect.poll(() => nav(page).locator("[data-slot=side-navigation]").evaluate((el) => el.getBoundingClientRect().width)).toBe(64)
  await expect(nav(page).locator(".fiori-sn__root")).not.toHaveAttribute("data-animating", "")
}

async function observeKeyboardDefaults(page: Page) {
  await page.evaluate(() => {
    const state = window as unknown as { sideNavigationKeyEvent?: KeyboardEvent; sideNavigationKeyUpEvent?: KeyboardEvent }
    // Keep the original event reference; reading after press observes final cancellation
    // even when propagation was stopped. A capture microtask can run before later handlers.
    window.addEventListener("keydown", (e) => {
      state.sideNavigationKeyEvent = e
    }, true)
    window.addEventListener("keyup", (e) => {
      // press("Shift+Enter") releases Shift after Enter; retain the activation key,
      // rather than replacing its final cancellation state with the modifier release.
      if (!["Shift", "Control", "Alt", "Meta"].includes(e.key)) state.sideNavigationKeyUpEvent = e
    }, true)
  })
}

async function pressWithDefault(page: Page, key: string, prevented: boolean) {
  await page.evaluate(() => { (window as unknown as { sideNavigationKeyEvent?: KeyboardEvent }).sideNavigationKeyEvent = undefined })
  await page.keyboard.press(key)
  await expect.poll(() => page.evaluate(() => (window as unknown as { sideNavigationKeyEvent?: KeyboardEvent }).sideNavigationKeyEvent?.defaultPrevented)).toBe(prevented)
}

async function expectKeyUpDefault(page: Page, key: string, prevented: boolean) {
  await expect.poll(() => page.evaluate(() => {
    const e = (window as unknown as { sideNavigationKeyUpEvent?: KeyboardEvent }).sideNavigationKeyUpEvent
    return e && { key: e.key, defaultPrevented: e.defaultPrevented }
  })).toEqual({ key: key === "Space" ? " " : key.split("+").at(-1), defaultPrevented: prevented })
}

const ignoredNavigationModifiers = ["Shift", "Alt", "Control", "Meta", "Control+Meta", "Control+Shift"]
const navigationKeyCases = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"]

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
    await expect(menuRow(menu, "History")).toBeVisible()
    await expect(menuRow(menu, "Events")).toBeVisible()
    await expect(menuRow(menu, "Locations")).toHaveAttribute("aria-disabled", "true")
    await expect(menuRow(menu, "Home")).toHaveCount(0)
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
      await expect(menuRow(menu, "Locations")).toBeFocused()
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
    await expect(menuRow(menu, "Locations")).toBeFocused()
    await expect(more).toHaveAttribute("aria-expanded", "true")
    await expect(page.getByTestId("side-navigation-demo-clicks")).toHaveText("0")
    await page.keyboard.press("Escape")
    await expect(menu).toHaveCount(0)
    await expect(more).toBeFocused()
  })

  test("More ignores every modified navigation family while retaining browser defaults and plain navigation", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    await waitCollapsedNavigation(page)
    await observeKeyboardDefaults(page)
    const more = nav(page).getByRole("menuitem", { name: "More Items", exact: true })
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    const primary = nav(page).getByRole("menubar", { name: "Primary Navigation Menu", exact: true })
    const rows = primary.locator("[data-sn-nav]:visible")
    await more.focus()
    await expect(more).toBeFocused()
    for (const modifier of ignoredNavigationModifiers) {
      for (const key of navigationKeyCases) {
        await pressWithDefault(page, `${modifier}+${key}`, false)
        await expect(more).toBeFocused()
        await expect(menu).toHaveCount(0)
      }
    }
    for (const key of ["ArrowLeft", "ArrowRight", "ArrowDown"]) {
      await pressWithDefault(page, key, true)
      await expect(more).toBeFocused()
      await expect(menu).toHaveCount(0)
    }
    await pressWithDefault(page, "ArrowUp", true)
    await expect(rows.nth(await rows.count() - 2)).toBeFocused()
    await pressWithDefault(page, "End", true)
    await expect(more).toBeFocused()
    await pressWithDefault(page, "Home", true)
    await expect(rows.first()).toBeFocused()
    await pressWithDefault(page, "PageDown", true)
    await expect(more).toBeFocused()
    await pressWithDefault(page, "PageUp", true)
    await expect(rows.first()).toBeFocused()
    await expect(value(page)).toHaveText("home")
    await expect(page.getByTestId("side-navigation-demo-clicks")).toHaveText("0")
  })

  test("overflow root ignores modified arrows and page keys and keeps plain static navigation", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    await nav(page).getByRole("menuitem", { name: "More Items", exact: true }).click()
    await observeKeyboardDefaults(page)
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    const events = menuRow(menu, "Events")
    await events.focus()
    await expect(events).toBeFocused()
    for (const modifier of ignoredNavigationModifiers) {
      for (const key of navigationKeyCases) {
        await pressWithDefault(page, `${modifier}+${key}`, false)
        await expect(events).toBeFocused()
        await expect(events).toHaveAttribute("aria-expanded", "false")
        await expect(page.getByRole("menu", { name: "Events", exact: true })).toHaveCount(0)
      }
    }
    await pressWithDefault(page, "ArrowDown", true)
    await expect(menuRow(menu, "History")).toBeFocused()
    await pressWithDefault(page, "ArrowUp", true)
    await expect(events).toBeFocused()
    for (const key of ["End", "PageDown"]) {
      await pressWithDefault(page, key, true)
      await expect(menuRow(menu, "SAP Community")).toBeFocused()
      await pressWithDefault(page, "Home", true)
      await expect(menuRow(menu, "Locations")).toBeFocused()
    }
    await pressWithDefault(page, "PageUp", true)
    await expect(menuRow(menu, "Locations")).toBeFocused()
    await pressWithDefault(page, "ArrowLeft", false)
    await expect(menu).toBeVisible()
    await expect(menuRow(menu, "Locations")).toBeFocused()
    await expect(value(page)).toHaveText("home")
    await expect(page.getByTestId("side-navigation-demo-clicks")).toHaveText("0")
  })

  test("overflow submenu ignores modified navigation and keeps plain ten-row pages and static boundaries", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    await nav(page).getByRole("menuitem", { name: "More Items", exact: true }).click()
    await observeKeyboardDefaults(page)
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    const events = menuRow(menu, "Events")
    await events.focus()
    await expect(events).toBeFocused()
    await pressWithDefault(page, "ArrowRight", false)
    const submenu = page.getByRole("menu", { name: "Events", exact: true })
    const parent = menuRow(submenu, "Events")
    const local = menuRow(submenu, "Local")
    const last = menuRow(submenu, "Others")
    await expect(parent).toBeFocused()
    await local.focus()
    await expect(local).toBeFocused()
    for (const modifier of ignoredNavigationModifiers) {
      for (const key of navigationKeyCases) {
        await pressWithDefault(page, `${modifier}+${key}`, false)
        await expect(local).toBeFocused()
        await expect(submenu).toBeVisible()
        await expect(events).toHaveAttribute("aria-expanded", "true")
      }
    }
    await pressWithDefault(page, "ArrowRight", false)
    await expect(local).toBeFocused()
    await pressWithDefault(page, "ArrowUp", true)
    await expect(parent).toBeFocused()
    await pressWithDefault(page, "PageDown", true)
    await expect(last).toBeFocused()
    await pressWithDefault(page, "ArrowUp", true)
    await expect(local).toBeFocused()
    await pressWithDefault(page, "ArrowUp", true)
    await expect(parent).toBeFocused()
    for (const key of ["Home", "PageUp"]) {
      await pressWithDefault(page, key, true)
      await expect(parent).toBeFocused()
      await pressWithDefault(page, "PageDown", true)
      await expect(last).toBeFocused()
    }
    await pressWithDefault(page, "ArrowDown", true)
    await expect(last).toBeFocused()
    await pressWithDefault(page, "End", true)
    await expect(last).toBeFocused()
    await pressWithDefault(page, "ArrowLeft", false)
    await expect(submenu).toHaveCount(0)
    await expect(events).toBeFocused()
    await expect(menu).toBeVisible()
    await expect(value(page)).toHaveText("home")
    await expect(page.getByTestId("side-navigation-demo-clicks")).toHaveText("0")
  })

  test("modified Escape preserves root and submenu while plain Escape closes only the top surface", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    const more = nav(page).getByRole("menuitem", { name: "More Items", exact: true })
    await more.click()
    await observeKeyboardDefaults(page)
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    const events = menuRow(menu, "Events")
    const submenu = page.getByRole("menu", { name: "Events", exact: true })
    await events.focus()
    await expect(events).toBeFocused()
    for (const modifier of ignoredNavigationModifiers) {
      await pressWithDefault(page, `${modifier}+Escape`, false)
      await expect(events).toBeFocused()
      await expect(menu).toBeVisible()
    }
    await pressWithDefault(page, "ArrowRight", false)
    const local = menuRow(submenu, "Local")
    await expect(menuRow(submenu, "Events")).toBeFocused()
    await local.focus()
    await expect(local).toBeFocused()
    for (const modifier of ignoredNavigationModifiers) {
      await pressWithDefault(page, `${modifier}+Escape`, false)
      await expect(local).toBeFocused()
      await expect(submenu).toBeVisible()
      await expect(menu).toBeVisible()
    }
    // UI5's global popup registry closes the topmost submenu even if its owning row
    // is focused; the root remains open. Its trigger is a valid focus target while open.
    await events.focus()
    await expect(events).toBeFocused()
    await expect(submenu).toBeVisible()
    await pressWithDefault(page, "Escape", false)
    await expect(submenu).toHaveCount(0)
    await expect(events).toBeFocused()
    await expect(menu).toBeVisible()
    await pressWithDefault(page, "Escape", false)
    await expect(menu).toHaveCount(0)
    await expect(more).toBeFocused()
    await expect(page.getByTestId("side-navigation-demo-clicks")).toHaveText("0")
  })

  test("modified Tab combinations keep popups open while allowing their native browser focus defaults", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    await nav(page).getByRole("menuitem", { name: "More Items", exact: true }).click()
    await observeKeyboardDefaults(page)
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    const events = menuRow(menu, "Events")
    const keys = ["Control+Tab", "Meta+Tab", "Alt+Tab", "Control+Meta+Tab", "Control+Shift+Tab", "Meta+Shift+Tab", "Alt+Shift+Tab", "Control+Alt+Tab", "Meta+Alt+Tab"]
    for (const key of keys) {
      await focusMenuRow(events)
      await pressWithDefault(page, key, false)
      await expect(menu).toBeVisible()
      if (["Control+Tab", "Meta+Tab", "Control+Meta+Tab", "Meta+Shift+Tab"].includes(key)) await expect(events).toBeFocused()
      if (key === "Alt+Tab") await expect(menu.locator("[data-sn-menu-link]")).toBeFocused()
      if (key === "Alt+Shift+Tab") await expect(menuRow(menu, "Locations")).toBeFocused()
    }
    await focusMenuRow(events)
    await pressWithDefault(page, "ArrowRight", false)
    const submenu = page.getByRole("menu", { name: "Events", exact: true })
    const local = menuRow(submenu, "Local")
    await expect(menuRow(submenu, "Events")).toBeFocused()
    for (const key of keys) {
      await focusMenuRow(local)
      await pressWithDefault(page, key, false)
      await expect(submenu).toBeVisible()
      await expect(menu).toBeVisible()
      if (["Control+Tab", "Meta+Tab", "Control+Meta+Tab", "Meta+Shift+Tab"].includes(key)) await expect(local).toBeFocused()
      if (["Alt+Tab", "Alt+Shift+Tab"].includes(key)) await expect(menuRow(submenu, "Events")).toBeFocused()
    }
  })

  for (const key of ["Tab", "Shift+Tab"]) {
    test(`root ${key} closes overflow and restores More with the UI5 canceled default`, async ({ page }) => {
      await page.locator("#side-navigation-demo-resize").click()
      const more = nav(page).getByRole("menuitem", { name: "More Items", exact: true })
      await more.click()
      await observeKeyboardDefaults(page)
      const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
      const events = menuRow(menu, "Events")
      await events.focus()
      await expect(events).toBeFocused()
      await pressWithDefault(page, key, true)
      await expect(menu).toHaveCount(0)
      await expect(more).toBeFocused()
      await expect(page.getByTestId("side-navigation-demo-clicks")).toHaveText("0")
    })

    test(`submenu ${key} closes only its surface and restores Events after the native default`, async ({ page }) => {
      await page.locator("#side-navigation-demo-resize").click()
      await nav(page).getByRole("menuitem", { name: "More Items", exact: true }).click()
      await observeKeyboardDefaults(page)
      const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
      const events = menuRow(menu, "Events")
      await events.focus()
      await expect(events).toBeFocused()
      await pressWithDefault(page, "ArrowRight", false)
      const submenu = page.getByRole("menu", { name: "Events", exact: true })
      const local = menuRow(submenu, "Local")
      await expect(menuRow(submenu, "Events")).toBeFocused()
      await local.focus()
      await expect(local).toBeFocused()
      await pressWithDefault(page, key, false)
      await expect(submenu).toHaveCount(0)
      await expect(menu).toBeVisible()
      await expect(events).toBeFocused()
      await expect(events).toHaveAttribute("aria-expanded", "false")
      await expect(value(page)).toHaveText("home")
      await expect(page.getByTestId("side-navigation-demo-clicks")).toHaveText("0")
    })
  }

  test("printable letters, digits, punctuation and Shift case changes never typeahead in overflow menus", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    await nav(page).getByRole("menuitem", { name: "More Items", exact: true }).click()
    await observeKeyboardDefaults(page)
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    const events = menuRow(menu, "Events")
    await events.focus()
    await expect(events).toBeFocused()
    for (const key of ["h", "Shift+h", "1", "Shift+1", "/", "Shift+/"]) {
      await pressWithDefault(page, key, false)
      await expect(events).toBeFocused()
      await expect(events).toHaveAttribute("aria-expanded", "false")
    }
    await pressWithDefault(page, "ArrowRight", false)
    const submenu = page.getByRole("menu", { name: "Events", exact: true })
    const local = menuRow(submenu, "Local")
    await expect(menuRow(submenu, "Events")).toBeFocused()
    await local.focus()
    await expect(local).toBeFocused()
    for (const key of ["e", "Shift+e", "l", "Shift+l", "2", "?"]) {
      await pressWithDefault(page, key, false)
      await expect(local).toBeFocused()
      await expect(submenu).toBeVisible()
    }
    await expect(value(page)).toHaveText("home")
    await expect(page.getByTestId("side-navigation-demo-clicks")).toHaveText("0")
  })

  test("overflow horizontal navigation follows the owner's RTL direction without canceling its default", async ({ page }) => {
    await page.evaluate(() => { document.documentElement.dir = "rtl" })
    await page.locator("#side-navigation-demo-resize").click()
    await observeKeyboardDefaults(page)
    const more = nav(page).getByRole("menuitem", { name: "More Items", exact: true })
    await more.focus()
    await expect(more).toBeFocused()
    await page.keyboard.press("Enter")
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    const events = menuRow(menu, "Events")
    await expect(menu).toHaveAttribute("dir", "rtl")
    await events.focus()
    await expect(events).toBeFocused()
    await pressWithDefault(page, "ArrowLeft", false)
    const submenu = page.getByRole("menu", { name: "Events", exact: true })
    await expect(menuRow(submenu, "Events")).toBeFocused()
    await pressWithDefault(page, "ArrowRight", false)
    await expect(submenu).toHaveCount(0)
    await expect(events).toBeFocused()
    await expect(menu).toBeVisible()
    await expect(page.getByTestId("side-navigation-demo-clicks")).toHaveText("0")
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
        await expect(menuRow(menu, "Locations")).toBeFocused()
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
    await expect(menuRow(menu, "Locations")).toBeFocused()
    const events = menuRow(menu, "Events")
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
    await expect(menuRow(submenu, "Events")).toBeFocused()
    await expect(page.getByTestId("side-navigation-demo-events-clicks")).toHaveText("1")
  })

  test("overflow parent modifier matrix preserves callback modifiers and only opens for supported keys", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    await nav(page).getByRole("menuitem", { name: "More Items", exact: true }).click()
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    await expect(menuRow(menu, "Locations")).toBeFocused()
    const events = menuRow(menu, "Events")
    const submenu = page.getByRole("menu", { name: "Events", exact: true })
    const callbacks = page.getByTestId("side-navigation-demo-clicks")
    await events.focus()
    await expect(events).toBeFocused()
    let count = 0
    for (const [key, accepted, modifiers] of overflowModifierCases) {
      await page.keyboard.press(key)
      if (accepted) {
        count++
        await expect(menuRow(submenu, "Events")).toBeFocused()
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
      await expect(menuRow(menu, "Locations")).toBeFocused()
      const history = menuRow(menu, "History")
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
        const home = menuRow(menu, "Home")
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
      } else await expect(menuRow(menu, "Locations")).toBeFocused()
      await page.keyboard.up(key)
      await expect(menuRow(menu, "Locations")).toBeFocused()
      const events = menuRow(menu, "Events")
      await events.focus()
      await expect(events).toBeFocused()
      await page.keyboard.down(key)
      if (key === "Space") {
        await expect(submenu).toHaveCount(0)
        await expect(events).toBeFocused()
        await expect(callbacks).toHaveText("0")
      } else {
        await expect(menuRow(submenu, "Events")).toBeFocused()
        await expect(callbacks).toHaveText("1")
      }
      await page.keyboard.up(key)
      const parentAction = menuRow(submenu, "Events")
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
      await expect(menuRow(menu, "Locations")).toBeFocused()
      const external = menuRow(menu, "SAP Community")
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
    await expect(menuRow(menu, "Locations")).toBeFocused()
    const external = menuRow(menu, "SAP Community")
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

  for (const key of ["Enter", "Space"]) {
    for (const canceled of [false, true]) {
      test(`outer overflow href anchor ${key} keeps its native default and skips item activation with cancellation ${canceled}`, async ({ page, context }) => {
        if (canceled) await page.locator("#side-navigation-demo-prevent-events").click()
        await page.locator("#side-navigation-demo-resize").click()
        await waitCollapsedNavigation(page)
        await nav(page).getByRole("menuitem", { name: "More Items", exact: true }).click()
        const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
        await expect(menuRow(menu, "Locations")).toBeFocused()
        await page.keyboard.press("ArrowDown")
        await focusMenuRow(menuRow(menu, "Events"))
        await page.keyboard.press("Alt+Tab")
        const anchor = menu.locator("[data-sn-menu-link]")
        await expect(anchor).toBeFocused()
        await observeKeyboardDefaults(page)
        // Menu.js cancels plain Enter on the host, but neither outer-anchor key invokes
        // NavigationMenuItem.js's inner-LI activation or its cancellation callback.
        await pressWithDefault(page, key, key === "Enter")
        await expectKeyUpDefault(page, key, false)
        await expect(anchor).toBeFocused()
        await expect(menu).toBeVisible()
        await expect(page.getByTestId("side-navigation-demo-clicks")).toHaveText("0")
        await expect(value(page)).toHaveText("home")
        expect(context.pages()).toHaveLength(1)
      })
    }

    test(`canceled inner overflow href ${key} invokes its callback once and closes without navigation`, async ({ page, context }) => {
      await page.locator("#side-navigation-demo-prevent-events").click()
      await page.locator("#side-navigation-demo-resize").click()
      await waitCollapsedNavigation(page)
      const more = nav(page).getByRole("menuitem", { name: "More Items", exact: true })
      await more.click()
      const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
      await expect(menuRow(menu, "Locations")).toBeFocused()
      await focusMenuRow(menuRow(menu, "SAP Community"))
      await page.keyboard.press(key)
      await expect(menu).toHaveCount(0)
      await expect(more).toBeFocused()
      await expect(page.getByTestId("side-navigation-demo-clicks")).toHaveText("1")
      await expect(value(page)).toHaveText("home")
      expect(context.pages()).toHaveLength(1)
    })
  }

  for (const key of ["Shift+Enter", "Meta+Enter"]) {
    test(`outer overflow href anchor ${key} follows its native link without item activation`, async ({ page, context }) => {
      await context.route("https://community.sap.com/**", (route) => route.fulfill({ contentType: "text/html", body: "External navigation target" }))
      await page.locator("#side-navigation-demo-resize").click()
      await waitCollapsedNavigation(page)
      await nav(page).getByRole("menuitem", { name: "More Items", exact: true }).click()
      const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
      await expect(menuRow(menu, "Locations")).toBeFocused()
      await page.keyboard.press("ArrowDown")
      await focusMenuRow(menuRow(menu, "Events"))
      await page.keyboard.press("Alt+Tab")
      await expect(menu.locator("[data-sn-menu-link]")).toBeFocused()
      await observeKeyboardDefaults(page)
      // Chromium's Shift+Enter navigation can request a separate window without a
      // context page event. Assert its actual native navigation request, as in UI5.
      const navigation = context.waitForEvent("request", { predicate: (request) => request.isNavigationRequest() && request.url() === "https://community.sap.com/" })
      await pressWithDefault(page, key, false)
      await navigation
      await expectKeyUpDefault(page, key, false)
      await expect(menu).toBeVisible()
      await expect(menu.locator("[data-sn-menu-link]")).toBeFocused()
      await expect(page.getByTestId("side-navigation-demo-clicks")).toHaveText("0")
      await expect(value(page)).toHaveText("home")
      for (const popup of context.pages().filter((candidate) => candidate !== page)) {
        await popup.waitForURL("https://community.sap.com/")
        await popup.close()
      }
    })
  }

  test("disabled overflow rows remain in focus navigation and block activation", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    await nav(page).getByRole("menuitem", { name: "More Items", exact: true }).click()
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    const locations = menuRow(menu, "Locations")
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
    await expect(menuRow(menu, "Events")).toBeFocused()
    await page.keyboard.press("ArrowUp")
    await expect(locations).toBeFocused()
    await page.keyboard.press("End")
    await expect(menuRow(menu, "SAP Community")).toBeFocused()
    await page.keyboard.press("Home")
    await expect(locations).toBeFocused()
  })

  test("hovering an overflow parent preserves focus and leaves its submenu closed", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    await nav(page).getByRole("menuitem", { name: "More Items", exact: true }).click()
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    const locations = menuRow(menu, "Locations")
    const events = menuRow(menu, "Events")
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
    const events = menuRow(menu, "Events")
    await events.focus()
    await expect(events).toBeFocused()
    await page.clock.install()
    for (const name of ["History", "SAP Community", "Locations"]) {
      await menuRow(menu, name).hover({ force: name === "Locations" })
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
    const events = menuRow(menu, "Events")
    await events.focus()
    await expect(events).toBeFocused()
    await page.keyboard.press("ArrowRight")
    const submenu = page.getByRole("menu", { name: "Events", exact: true })
    const parentAction = menuRow(submenu, "Events")
    const local = menuRow(submenu, "Local")
    await expect(parentAction).toBeFocused()
    await local.hover()
    await expect(local).toBeFocused()
    await parentAction.hover()
    await expect(parentAction).toBeFocused()
    await local.hover()
    await expect(local).toBeFocused()
    await page.clock.install()
    for (const name of ["Events", "History"]) {
      await menuRow(menu, name).hover()
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
    const external = menuRow(menu, "SAP Community")
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
    await menuRow(menu, "History").click()
    await expect(menu).toHaveCount(0)
    await expect(value(page)).toHaveText("history")
    const history = nav(page).getByRole("menuitemradio", { name: "History", exact: true })
    await expect(history).toHaveAttribute("aria-checked", "true")
    await expect(history).toBeFocused()
    await more.click()
    await expect(menuRow(menu, "History")).toHaveCount(0)
    await expect(menuRow(menu, "People")).toBeVisible()
  })

  test("overflow submenus expose the parent action and preserve a selected child", async ({ page }) => {
    await page.locator("#side-navigation-demo-resize").click()
    const more = nav(page).getByRole("menuitem", { name: "More Items", exact: true })
    await expect(more).toBeVisible()
    await more.click()
    const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
    const events = menuRow(menu, "Events")
    await events.focus()
    await page.keyboard.press("ArrowRight")
    const submenu = page.getByRole("menu", { name: "Events", exact: true })
    await expect(menuRow(submenu, "Events")).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(menuRow(submenu, "Local")).toBeFocused()
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
        const events = menuRow(menu, "Events")
        await events.focus()
        await expect(events).toBeFocused()
        const submenu = page.getByRole("menu", { name: "Events", exact: true })
        await expect(submenu).toHaveCount(0)
        if (key === "click") await events.click()
        else await page.keyboard.press(key)
        const parentAction = menuRow(submenu, "Events")
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
