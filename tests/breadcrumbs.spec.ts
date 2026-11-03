import { expect, test, type Locator } from "@playwright/test"

type Modifiers = { shiftKey?: boolean; ctrlKey?: boolean; altKey?: boolean; metaKey?: boolean }
const modifiers: Modifiers[] = [
  { shiftKey: true }, { ctrlKey: true }, { altKey: true }, { metaKey: true },
  { altKey: true, shiftKey: true }, { altKey: true, ctrlKey: true }, { altKey: true, metaKey: true },
]
async function dispatchKey(target: Locator, key: string, modifier: Modifiers = {}) {
  return target.evaluate((element, detail) => {
    const init = { key: detail.key, bubbles: true, cancelable: true, ...detail.modifier }
    // Eager UI5 fixture imports install F6Navigation.js on document. Ctrl/Meta+Alt+Up/Down
    // are its global F6 shortcuts, independent of Breadcrumbs. Stop only those at the React
    // root after React's own handler runs, so this test measures the component's key contract.
    const root = element.closest("#root")
    const isolate = (event: Event) => event.stopPropagation()
    const globalF6 = detail.modifier.altKey && (detail.modifier.ctrlKey || detail.modifier.metaKey)
      && ["ArrowUp", "Up", "ArrowDown", "Down"].includes(detail.key)
    if (globalF6) root?.addEventListener("keydown", isolate)
    const down = new KeyboardEvent("keydown", init)
    element.dispatchEvent(down)
    if (globalF6) root?.removeEventListener("keydown", isolate)
    const up = new KeyboardEvent("keyup", init)
    element.dispatchEvent(up)
    return { downPrevented: down.defaultPrevented, upPrevented: up.defaultPrevented }
  }, { key, modifier })
}

test.describe("Breadcrumbs keyboard and ARIA", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/index.html`)
    await page.waitForSelector("html[data-ready=true]")
  })

  test("nav landmark, ordered list, current location", async ({ page }) => {
    const nav = page.locator("#demo-breadcrumbs")
    await expect(nav).toHaveRole("navigation")
    await expect(nav).toHaveAttribute("aria-label", "Breadcrumb Trail")
    await expect(nav.getByRole("listitem")).toHaveCount(4)
    await expect(nav.getByRole("link")).toHaveCount(3)
    await expect(nav.getByRole("link", { name: "Home 1 of 4" })).toBeVisible()
    const current = nav.locator('[aria-current="page"]')
    await expect(current).toHaveText("Notebook 15")
    await expect(current).toHaveAttribute("aria-label", "Notebook 15 4 of 4")
    // Separators are decorative.
    await expect(nav.locator(".fiori-breadcrumbs__separator").first()).toHaveAttribute("aria-hidden", "true")
  })

  test("single tab stop, arrows/Home/End move between items, current location is focusable", async ({ page }) => {
    const nav = page.locator("#demo-breadcrumbs")
    const home = nav.getByRole("link", { name: /^Home/ })
    const tabIndexes = () => nav.locator("[data-breadcrumbs-focus]").evaluateAll((els) => els.map((e) => e.getAttribute("tabindex")))
    expect(await tabIndexes()).toEqual(["0", "-1", "-1", "-1"])
    await home.focus()
    await page.keyboard.press("ArrowRight")
    await expect(nav.getByRole("link", { name: /^Products/ })).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(nav.getByRole("link", { name: /^Laptops/ })).toBeFocused()
    await page.keyboard.press("End")
    await expect(nav.locator('[aria-current="page"]')).toBeFocused()
    await page.keyboard.press("ArrowRight") // no wrap-around
    await expect(nav.locator('[aria-current="page"]')).toBeFocused()
    expect(await tabIndexes()).toEqual(["-1", "-1", "-1", "0"])
    await page.keyboard.press("Home")
    await expect(home).toBeFocused()
    await page.keyboard.press("ArrowUp")
    await expect(home).toBeFocused()
  })

  test("Enter and Space activate a link", async ({ page }) => {
    const nav = page.locator("#demo-breadcrumbs")
    await nav.getByRole("link", { name: /^Products/ }).focus()
    await page.keyboard.press("Enter")
    await expect(page.locator("#demo-breadcrumbs-last")).toHaveText("Products")
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("Space")
    await expect(page.locator("#demo-breadcrumbs-last")).toHaveText("Laptops")
  })
})


test.describe("Breadcrumbs responsive overflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/index.html")
    await page.waitForSelector("html[data-ready=true]")
  })

  test("leading overflow responds to width and preserves the current location", async ({ page }) => {
    const demo = page.locator("#breadcrumbs-overflow-demo")
    const nav = demo.locator("#breadcrumbs-overflow-demo-trail")
    const arrow = nav.getByRole("button", { name: "More" })
    await expect(arrow).toBeVisible()
    await expect(nav.getByRole("link")).toHaveText(["Laptops"])
    await expect(nav.locator('[aria-current="page"]')).toHaveText("Notebook 15")
    await demo.getByRole("button", { name: "Wide trail", exact: true }).click()
    await expect(arrow).toBeHidden()
    await expect(nav.getByRole("link")).toHaveText(["Home", "Products", "Laptops"])
    await demo.getByRole("button", { name: "Tiny trail", exact: true }).click()
    await expect(arrow).toBeVisible()
    await expect(nav.getByRole("link")).toHaveCount(0)
    await expect(nav.locator('[aria-current="page"] > span')).toBeVisible()
    await expect(nav.locator('[aria-current="page"]')).toHaveText("Notebook 15")
  })

  test("popup contains only hidden ancestors in UI5 getter order; selection clicks its real anchor and follows href", async ({ page }) => {
    const demo = page.locator("#breadcrumbs-overflow-demo")
    const nav = demo.locator("#breadcrumbs-overflow-demo-trail")
    const arrow = nav.getByRole("button", { name: "More" })
    await expect(arrow).toHaveAttribute("aria-haspopup", "listbox")
    await expect(arrow).not.toHaveAttribute("aria-expanded")
    await arrow.click()
    const popup = page.getByRole("dialog", { name: "Available Values" })
    await expect(popup).toBeVisible()
    await expect(popup.getByRole("list", { name: "Contains Selectable Items", exact: true })).toBeVisible()
    await expect(popup.getByRole("list")).not.toHaveAttribute("aria-label")
    await expect(popup.getByRole("listitem")).toHaveCount(2)
    await expect(popup.getByRole("listbox")).toHaveCount(0)
    await expect(popup.getByRole("option")).toHaveCount(0)
    await expect(arrow).not.toHaveAttribute("aria-expanded")
    // BreadcrumbsTemplate.js wires click to _openRespPopover, so clicking again stays open.
    await arrow.click()
    await expect(popup).toBeVisible()
    // UI5 Breadcrumbs.js _overflowItemsData: slice(0, _overflowSize).filter(...).reverse().
    await expect(popup.locator(".fiori-li__title")).toHaveText(["Products", "Home"])
    await popup.getByRole("listitem").filter({ hasText: /^Home/ }).click()
    await expect(demo.locator("#breadcrumbs-overflow-demo-last")).toHaveText("Home")
    await expect(page).toHaveURL(/#breadcrumbs-home$/)
    await expect(popup).toBeHidden()
    await expect(arrow).not.toHaveAttribute("aria-expanded")
  })

  test("canceling an ancestor click keeps the popup open without following its href", async ({ page }) => {
    const demo = page.locator("#breadcrumbs-overflow-demo")
    await demo.getByRole("button", { name: "Block ancestor navigation", exact: true }).click()
    const arrow = demo.locator("#breadcrumbs-overflow-demo-trail").getByRole("button", { name: "More" })
    await arrow.click()
    const popup = page.getByRole("dialog", { name: "Available Values" })
    await popup.getByRole("listitem").filter({ hasText: /^Home/ }).click()
    await expect(demo.locator("#breadcrumbs-overflow-demo-last")).toHaveText("Home")
    await expect(page).not.toHaveURL(/#breadcrumbs-home$/)
    await expect(popup).toBeVisible()
    await expect(arrow).not.toHaveAttribute("aria-expanded")
  })

  test("keyboard opens with Enter, Space, F4 and Alt arrows; list navigation and Escape restore focus", async ({ page }) => {
    const demo = page.locator("#breadcrumbs-overflow-demo")
    const nav = demo.locator("#breadcrumbs-overflow-demo-trail")
    const arrow = nav.getByRole("button", { name: "More" })
    const popup = page.getByRole("dialog", { name: "Available Values" })
    for (const key of ["Enter", "Space", "F4", "Alt+ArrowDown", "Alt+ArrowUp"]) {
      await arrow.focus()
      await page.keyboard.press(key)
      await expect(popup).toBeVisible()
      await expect(popup.getByRole("listitem").filter({ hasText: /^Products/ })).toBeFocused()
      await page.keyboard.press("ArrowDown")
      await expect(popup.getByRole("listitem").filter({ hasText: /^Home/ })).toBeFocused()
      await page.keyboard.press("Home")
      await expect(popup.getByRole("listitem").filter({ hasText: /^Products/ })).toBeFocused()
      await page.keyboard.press("End")
      await expect(popup.getByRole("listitem").filter({ hasText: /^Home/ })).toBeFocused()
      await page.keyboard.press("Escape")
      await expect(popup).toBeHidden()
      await expect(arrow).toBeFocused()
    }
    await page.keyboard.press("ArrowRight")
    await expect(nav.getByRole("link", { name: /^Laptops/ })).toBeFocused()
    await page.keyboard.press("End")
    await expect(nav.locator('[aria-current="page"]')).toBeFocused()
    await page.keyboard.press("Home")
    await expect(arrow).toBeFocused()
    await page.keyboard.press("F4")
    await expect(popup).toBeVisible()
    await page.keyboard.press("ArrowDown")
    await expect(popup.getByRole("listitem").filter({ hasText: /^Home/ })).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(demo.locator("#breadcrumbs-overflow-demo-last")).toHaveText("Home")
    await expect(popup).toBeHidden()
  })

  test("growing the trail closes redundant overflow and restores a valid single tab stop", async ({ page }) => {
    const demo = page.locator("#breadcrumbs-overflow-demo")
    const nav = demo.locator("#breadcrumbs-overflow-demo-trail")
    const arrow = nav.getByRole("button", { name: "More" })
    await arrow.click()
    const popup = page.getByRole("dialog", { name: "Available Values" })
    await expect(popup).toBeVisible()
    // Resize in place, without clicking outside the popup (which would close it independently).
    await nav.evaluate((node) => { node.style.width = "640px" })
    await expect(arrow).toBeHidden()
    await expect(popup).toBeHidden()
    await expect(nav.locator('[data-breadcrumbs-focus][tabindex="0"]')).toHaveCount(1)
    await expect(nav.getByRole("link", { name: /^Home/ })).toHaveAttribute("tabindex", "0")
  })

  test("no-current-page and a linked current location stay visible; hidden and renamed items remeasure", async ({ page }) => {
    const demo = page.locator("#breadcrumbs-overflow-demo")
    const nav = demo.locator("#breadcrumbs-overflow-demo-trail")
    const arrow = nav.getByRole("button", { name: "More" })
    await demo.getByRole("button", { name: "Toggle current page", exact: true }).click()
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(0)
    await expect(nav.getByRole("link")).toHaveText(["Laptops", "Notebook 15"])
    await expect(nav.locator('[data-slot=breadcrumbs-item]:not([hidden]) .fiori-breadcrumbs__separator')).toHaveCount(2)
    await demo.getByRole("button", { name: "Toggle current page", exact: true }).click()
    await demo.getByRole("button", { name: "Toggle linked current page", exact: true }).click()
    await expect(nav.getByRole("link", { name: /^Notebook/ })).toHaveAttribute("aria-current", "page")
    await demo.getByRole("button", { name: "Toggle home visibility", exact: true }).click()
    await expect(nav.getByRole("link", { name: /^Home/ })).toHaveCount(0)
    await arrow.click()
    const popup = page.getByRole("dialog", { name: "Available Values" })
    await expect(popup.locator(".fiori-li__title")).toHaveText(["Products"])
    await page.keyboard.press("Escape")
    await expect(popup).toBeHidden()
    await demo.getByRole("button", { name: "Toggle home visibility", exact: true }).click()
    await demo.getByRole("button", { name: "Rename home", exact: true }).click()
    await arrow.click()
    await expect(popup.locator(".fiori-li__title")).toHaveText(["Products", "A much longer home location"])
  })
})


test.describe("Breadcrumbs exact UI5 source contracts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/index.html")
    await page.waitForSelector("html[data-ready=true]")
  })

  test("More tooltip and caller labels match the template; the list keeps its UI5 selection announcement", async ({ page }) => {
    const demo = page.locator("#breadcrumbs-demo")
    await expect(demo.locator("#demo-breadcrumbs")).toHaveAttribute("aria-label", "Breadcrumb Trail")
    const nav = demo.locator("#breadcrumbs-overflow-demo-trail")
    const arrow = nav.getByRole("button", { name: "More", exact: true })
    await expect(arrow.locator(".fiori-breadcrumbs__overflow-icon")).toHaveAttribute("title", "More")
    await expect(arrow).not.toHaveAttribute("aria-expanded")
    await expect(arrow).not.toHaveAttribute("aria-controls")
    await arrow.click()
    const popup = page.getByRole("dialog", { name: "Available Values", exact: true })
    await expect(popup).toBeVisible()
    await expect(popup.getByRole("list", { name: "Contains Selectable Items", exact: true })).toBeVisible()
    await expect(popup.getByRole("listitem")).toHaveCount(2)
    await expect(popup.getByRole("listbox")).toHaveCount(0)
    await expect(arrow).not.toHaveAttribute("aria-expanded")
    await page.keyboard.press("Escape")
    await expect(popup).toBeHidden()
    const custom = demo.locator("#breadcrumbs-overrides-demo-trail")
    await expect(custom).toHaveAttribute("aria-label", "Custom navigation trail")
    const customArrow = custom.getByRole("button", { name: "Hidden ancestors", exact: true })
    await expect(customArrow.locator(".fiori-breadcrumbs__overflow-icon")).toHaveAttribute("title", "Hidden ancestors")
    await customArrow.click()
    const customPopup = page.getByRole("dialog", { name: "Ancestor choices", exact: true })
    await expect(customPopup).toBeVisible()
    await expect(customPopup.getByRole("list", { name: "Contains Selectable Items", exact: true })).toBeVisible()
  })

  test("hidden middle items consume raw overflow positions at 100px", async ({ page }) => {
    const nav = page.locator("#breadcrumbs-hidden-middle-demo-trail")
    const arrow = nav.getByRole("button", { name: "More", exact: true })
    await expect(arrow).toBeVisible()
    await expect(nav.locator("#breadcrumbs-hidden-middle-demo-products")).toHaveAttribute("hidden", "")
    await expect(nav.getByRole("link")).toHaveText(["Laptops"])
    await expect(nav.locator('[aria-current="page"] > span')).toBeVisible()
    await expect(nav.locator('[aria-current="page"]')).toHaveText("Notebook 15")
    await arrow.click()
    const popup = page.getByRole("dialog", { name: "Available Values", exact: true })
    await expect(popup.locator(".fiori-li__title")).toHaveText(["Home"])
    await expect(popup.getByRole("listitem")).toHaveCount(1)
    await page.keyboard.press("Escape")
    await expect(popup).toBeHidden()
    await expect(arrow).toBeFocused()
    await page.keyboard.press("ArrowRight")
    await expect(nav.getByRole("link", { name: /^Laptops/ })).toBeFocused()
  })

  test("modified trail navigation and non-href activation are ignored without canceling native keys", async ({ page }) => {
    const demo = page.locator("#breadcrumbs-demo")
    const nav = demo.locator("#demo-breadcrumbs")
    const products = nav.getByRole("link", { name: /^Products/ })
    const last = demo.locator("#demo-breadcrumbs-last")
    await products.focus()
    await expect(products).toBeFocused()
    for (const modifier of modifiers) {
      for (const key of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"]) {
        expect(await dispatchKey(products, key, modifier), JSON.stringify({ key, modifier })).toEqual({ downPrevented: false, upPrevented: false })
        await expect(products).toBeFocused()
      }
    }
    const action = demo.locator("#breadcrumbs-no-href-demo-trail [data-slot=breadcrumbs-item] a")
    const current = nav.locator('[aria-current="page"]')
    for (const target of [action, current]) {
      await target.focus()
      await expect(target).toBeFocused()
      for (const modifier of modifiers) {
        for (const key of ["Enter", " ", "Spacebar"]) {
          expect(await dispatchKey(target, key, modifier)).toEqual({ downPrevented: false, upPrevented: false })
          await expect(last).toHaveText("none")
        }
      }
    }
    await dispatchKey(current, "Enter")
    await expect(last).toHaveText("Notebook 15")
    await dispatchKey(action, "Spacebar")
    await expect(last).toHaveText("Action")
  })

  test("modified opening keys do not open More; only Alt alone toggles the arrow shortcut", async ({ page }) => {
    const nav = page.locator("#breadcrumbs-overflow-demo-trail")
    const arrow = nav.getByRole("button", { name: "More", exact: true })
    const popup = page.getByRole("dialog", { name: "Available Values", exact: true })
    await arrow.focus()
    await expect(arrow).toBeFocused()
    for (const modifier of modifiers) {
      for (const key of ["Enter", " ", "Spacebar", "F4"]) {
        expect(await dispatchKey(arrow, key, modifier)).toEqual({ downPrevented: false, upPrevented: false })
        await expect(popup).toBeHidden()
        await expect(arrow, JSON.stringify({ key, modifier })).toBeFocused()
      }
    }
    for (const modifier of modifiers.filter((m) => !m.altKey || m.shiftKey || m.ctrlKey || m.metaKey)) {
      for (const key of ["ArrowUp", "ArrowDown", "Up", "Down"]) {
        await dispatchKey(arrow, key, modifier)
        await expect(popup).toBeHidden()
        await expect(arrow, JSON.stringify({ key, modifier })).toBeFocused()
      }
    }
    for (const key of ["ArrowUp", "ArrowDown", "Up", "Down"]) {
      await dispatchKey(arrow, key, { altKey: true })
      await expect(popup).toBeVisible()
      await expect(popup.getByRole("listitem").first()).toBeFocused()
      await page.keyboard.press("Escape")
      await expect(popup).toBeHidden()
      await expect(arrow).toBeFocused()
    }
  })

  test("modified overflow activation/navigation/closing are ignored, including Radix Escape capture", async ({ page }) => {
    const demo = page.locator("#breadcrumbs-overflow-demo")
    await demo.locator("#breadcrumbs-overflow-demo-trail").getByRole("button", { name: "More", exact: true }).click()
    const popup = page.getByRole("dialog", { name: "Available Values", exact: true })
    const first = popup.getByRole("listitem").first()
    await expect(first).toBeFocused()
    for (const modifier of modifiers) {
      for (const key of ["Enter", " ", "Spacebar", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown", "F4", "Escape"]) {
        if (modifier.altKey && !modifier.shiftKey && !modifier.ctrlKey && !modifier.metaKey && ["ArrowUp", "ArrowDown"].includes(key)) continue
        await dispatchKey(first, key, modifier)
        await expect(popup).toBeVisible()
        await expect(first).toBeFocused()
        await expect(demo.locator("#breadcrumbs-overflow-demo-last")).toHaveText("none")
      }
    }
    await page.keyboard.press("Space")
    await expect(demo.locator("#breadcrumbs-overflow-demo-last")).toHaveText("Products")
    await expect(popup).toBeHidden()
  })
})
