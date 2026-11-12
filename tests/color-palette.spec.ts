import { expect, test, type Locator, type Page } from "@playwright/test"
import { colorContrast, normalizeCssColor, parseCssColor, updateRecentColors } from "../registry/lib/fiori-color"

const control = (page: Page) => page.locator("#color-palette-demo #color-palette-control")
const swatches = (root: Locator, area = "main") => root.locator(`[data-color-palette-area=${area}]`)
const events = (page: Page) => page.locator("#color-palette-demo #color-palette-events")
async function focusSwatch(target: Locator) {
  await target.dispatchEvent("mousedown")
  await expect(target).toHaveAttribute("tabindex", "0")
  await target.focus()
  await expect(target).toBeFocused()
}
async function pressTo(page: Page, key: string, target: Locator) {
  await page.keyboard.press(key)
  await expect(target).toBeFocused()
}

test.beforeEach(async ({ page }) => {
  await page.goto("/index.html#/color-palette")
  await page.waitForSelector("html[data-ready=true]")
})

test("color-palette: numeric color utilities preserve palette history strings", () => {
  expect(parseCssColor("#abc8")).toEqual({ r: 170, g: 187, b: 204, a: 136 / 255 })
  expect(normalizeCssColor("rgb(100% 0% 50% / 25%)")).toBe("rgba(255,0,128,0.25)")
  expect(parseCssColor("rgb(bad,2,3)")).toBeNull()
  expect(updateRecentColors(["red", "#ff0000"], "red")).toEqual(["red", "#ff0000"])
  expect(updateRecentColors(["red"], "blue", false)).toEqual(["red"])
  expect(colorContrast({ r: 0, g: 0, b: 0, a: 1 }, { r: 255, g: 255, b: 255, a: 1 })).toBe(21)
})

test("color-palette: five columns, disabled painted recent slots, no deferred More Colors", async ({ page }) => {
  const root = control(page), main = swatches(root)
  await expect(main).toHaveCount(15)
  await expect(root.locator(".fiori-color-palette__recent [data-slot=color-palette-item]")).toHaveCount(5)
  await expect(root.locator(".fiori-color-palette__recent [aria-disabled=true]")).toHaveCount(5)
  await expect(root.getByText("More Colors...")).toHaveCount(0)
  const positions = await main.evaluateAll((items) => items.map((item) => ({ x: item.getBoundingClientRect().x, y: item.getBoundingClientRect().y })))
  expect(new Set(positions.slice(0, 5).map((item) => item.y)).size).toBe(1)
  expect(positions[5].y).toBeGreaterThan(positions[0].y)
  await expect(root.getByRole("group")).toHaveAttribute("aria-label", "Color Palette - Predefined Colors")
})

test("color-palette: all arrows and cyclic grid edges without auxiliary targets", async ({ page }) => {
  await page.locator("#color-palette-demo #color-palette-default-toggle").click()
  const main = swatches(control(page))
  for (const [from, key, to] of [[4, "ArrowRight", 5], [5, "ArrowLeft", 4], [7, "ArrowUp", 2], [2, "ArrowDown", 7],
    [0, "ArrowLeft", 14], [0, "ArrowUp", 14], [14, "ArrowRight", 0], [14, "ArrowDown", 0], [1, "ArrowUp", 10], [13, "ArrowDown", 4]] as const) {
    await focusSwatch(main.nth(from))
    await pressTo(page, key, main.nth(to))
  }
  await expect(events(page)).toHaveText("[]")
})

test("color-palette: incomplete and single-row edge calculations", async ({ page }) => {
  await page.locator("#color-palette-demo #color-palette-default-toggle").click()
  await page.locator("#color-palette-demo #color-palette-count").click()
  const main = swatches(control(page))
  await expect(main).toHaveCount(12)
  for (const [from, key, to] of [[0, "ArrowLeft", 9], [0, "ArrowUp", 9], [9, "ArrowDown", 0], [11, "ArrowRight", 0], [10, "ArrowDown", 1], [1, "ArrowUp", 10], [3, "ArrowUp", 7]] as const) {
    await focusSwatch(main.nth(from)); await pressTo(page, key, main.nth(to))
  }
  await page.locator("#color-palette-demo #color-palette-count").click()
  await expect(main).toHaveCount(3)
  for (const [from, key, to] of [[0, "ArrowUp", 2], [2, "ArrowDown", 0], [1, "ArrowDown", 2], [1, "ArrowUp", 0]] as const) {
    await focusSwatch(main.nth(from)); await pressTo(page, key, main.nth(to))
  }
})

test("color-palette: embedded Home/End blocked and modifier keys ignored", async ({ page }) => {
  const main = swatches(control(page))
  await focusSwatch(main.nth(7))
  for (const key of ["Home", "End", "Control+Home", "Shift+ArrowRight", "Alt+ArrowDown", "Meta+ArrowLeft", "PageUp", "PageDown"]) await pressTo(page, key, main.nth(7))
  await expect(events(page)).toHaveText("[]")
})

test("color-palette: default and recent keyboard fallback order", async ({ page }) => {
  const root = control(page), main = swatches(root), defaultButton = root.getByRole("button", { name: "Default Color", exact: true })
  await defaultButton.focus()
  await pressTo(page, "ArrowRight", main.nth(0))
  await pressTo(page, "ArrowLeft", defaultButton)
  await pressTo(page, "ArrowUp", main.nth(14))
  for (const index of [0, 2, 4]) await main.nth(index).click()
  const recent = swatches(root, "recent")
  await expect(recent).toHaveCount(3)
  await defaultButton.focus(); await pressTo(page, "ArrowLeft", recent.nth(2))
  await pressTo(page, "ArrowRight", defaultButton)
  await pressTo(page, "ArrowDown", main.nth(0))
  await focusSwatch(main.nth(14)); await pressTo(page, "ArrowDown", recent.nth(0))
  await pressTo(page, "ArrowUp", main.nth(14))
  await focusSwatch(recent.nth(2)); await pressTo(page, "ArrowDown", defaultButton)
})

test("color-palette: Enter keydown and Space keyup emit exactly once", async ({ page }) => {
  const main = swatches(control(page))
  await focusSwatch(main.nth(1))
  await page.keyboard.down(" ")
  await expect(events(page)).toHaveText("[]")
  await page.keyboard.up(" ")
  await expect(events(page)).toHaveText('["#993300"]')
  await expect(main.nth(1)).toHaveAttribute("aria-pressed", "true")
  await focusSwatch(main.nth(2)); await page.keyboard.press("Enter")
  await expect(events(page)).toHaveText('["#993300","#333300"]')
  await expect(main.nth(2)).toHaveAttribute("aria-pressed", "true")
  await expect(main.nth(1)).toHaveAttribute("aria-pressed", "false")
})

test("color-palette: five recent values move duplicates to front and reset per instance", async ({ page }) => {
  const root = control(page), main = swatches(root)
  for (const index of [0, 1, 2, 3, 4, 5]) {
    await main.nth(index).click()
    await expect(events(page)).toContainText(index === 5 ? "#000080" : await main.nth(index).getAttribute("aria-label")!.then((label) => label!.split(": ")[1]))
  }
  const recent = swatches(root, "recent")
  await expect(recent).toHaveCount(5)
  await expect(recent.nth(0)).toHaveAttribute("aria-label", "Color - 1: #000080")
  await expect(recent.nth(4)).toHaveAttribute("aria-label", "Color - 5: #993300")
  await main.nth(2).click()
  await expect(recent.nth(0)).toHaveAttribute("aria-label", "Color - 1: #333300")
  await expect(recent).toHaveCount(5)
  await page.locator("#color-palette-demo #color-palette-remount").click()
  await expect(control(page)).toHaveCount(0)
  await page.locator("#color-palette-demo #color-palette-remount").click()
  await expect(swatches(control(page), "recent")).toHaveCount(0)
})

test("color-palette: selecting a nonfirst recent slot reorders and focuses slot zero", async ({ page }) => {
  const root = control(page), main = swatches(root)
  for (const index of [0, 2, 4]) await main.nth(index).click()
  const recent = swatches(root, "recent")
  await recent.nth(1).click()
  await expect(recent.nth(0)).toHaveAttribute("aria-label", "Color - 1: #333300")
  await expect(recent.nth(0)).toHaveAttribute("aria-pressed", "true")
  await expect(recent.nth(0)).toBeFocused()
  // handleSelection focuses physical slot0 but does not reset recent ItemNavigation's index.
  await expect(recent.nth(0)).toHaveAttribute("tabindex", "-1")
  await pressTo(page, "ArrowRight", recent.nth(0))
  await pressTo(page, "ArrowLeft", main.nth(14))
})

test("color-palette: default color preserves its raw string and clears the marker", async ({ page }) => {
  const root = control(page), main = swatches(root)
  await main.nth(3).click()
  await root.getByRole("button", { name: "Default Color", exact: true }).click()
  await expect(events(page)).toHaveText('["#003300","rgb(1, 2, 3)"]')
  await expect(root.locator('[aria-pressed="true"]')).toHaveCount(0)
  await expect(swatches(root, "recent").nth(0)).toHaveAttribute("aria-label", "Color - 1: rgb(1, 2, 3)")
})

test("color-palette: duplicate item identity, external selected changes and canceled click", async ({ page }) => {
  const identity = page.locator("#color-palette-demo #color-palette-identity"), main = swatches(identity)
  await expect(main).toHaveCount(3)
  await expect(main.nth(0)).toHaveAttribute("aria-pressed", "false")
  await expect(main.nth(1)).toHaveAttribute("aria-pressed", "true")
  await main.nth(0).click()
  await expect(main.nth(0)).toHaveAttribute("aria-pressed", "true")
  await expect(main.nth(1)).toHaveAttribute("aria-pressed", "false")
  await main.nth(2).click()
  await expect(events(page)).toHaveText('["red"]')
  await page.locator("#color-palette-demo #color-palette-external").click()
  await expect(swatches(control(page)).nth(7)).toHaveAttribute("aria-pressed", "true")
  await expect(swatches(control(page), "recent")).toHaveCount(0)
  await expect(events(page)).toHaveText('["red"]')
})

test("color-palette: mouse focus has no keyboard ring", async ({ page }) => {
  const target = swatches(control(page)).nth(0)
  await target.click()
  expect(await target.evaluate((node) => getComputedStyle(node, "::before").content)).toBe("none")
  await page.keyboard.press("ArrowRight")
  await expect(swatches(control(page)).nth(1)).toBeFocused()
  expect(await swatches(control(page)).nth(1).evaluate((node) => getComputedStyle(node, "::before").content)).not.toBe("none")
})

test("color-palette: sibling Fragments keep equal colors as separate selectable items", async ({ page }) => {
  const root = page.locator("#color-palette-demo #color-palette-fragments"), main = swatches(root)
  await expect(main).toHaveCount(4)
  await expect(root.locator('[aria-pressed="true"]')).toHaveCount(1)
  await expect(main.nth(0)).toHaveAttribute("aria-pressed", "false")
  await expect(main.nth(2)).toHaveAttribute("aria-pressed", "true")
  await main.nth(0).click()
  await expect(events(page)).toHaveText('["red"]') // Parent rerender also preserves the clicked identity.
  await expect(root.locator('[aria-pressed="true"]')).toHaveCount(1)
  await expect(main.nth(0)).toHaveAttribute("aria-pressed", "true")
  await expect(main.nth(2)).toHaveAttribute("aria-pressed", "false")
  await main.nth(2).click()
  await expect(events(page)).toHaveText('["red","red"]')
  await expect(root.locator('[aria-pressed="true"]')).toHaveCount(1)
  await expect(main.nth(0)).toHaveAttribute("aria-pressed", "false")
  await expect(main.nth(2)).toHaveAttribute("aria-pressed", "true")
})

test("color-palette: hidden colored host is absent from paint and layout", async ({ page }) => {
  const root = page.locator("#color-palette-demo #color-palette-hidden")
  const hosts = root.locator('[data-slot="color-palette-item"]'), main = swatches(root)
  await expect(hosts).toHaveCount(3)
  await expect(hosts.nth(1)).toHaveAttribute("hidden", "")
  await expect(hosts.nth(1)).toBeHidden()
  await expect(root.getByRole("button")).toHaveCount(2)
  await expect(main.nth(1)).toHaveAttribute("aria-pressed", "true")
  await expect(root.locator('[aria-pressed="true"]:visible')).toHaveCount(0)
  expect(await hosts.nth(1).evaluate((node) => ({ display: getComputedStyle(node).display, width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height }))).toEqual({ display: "none", width: 0, height: 0 })
})

test("color-palette: toggling hidden restores occupied space and the same selected identity", async ({ page }) => {
  const root = page.locator("#color-palette-demo #color-palette-hidden"), hosts = root.locator('[data-slot="color-palette-item"]'), main = swatches(root)
  const hiddenWidth = await root.evaluate((node) => node.getBoundingClientRect().width)
  const greenHiddenX = await hosts.nth(2).evaluate((node) => node.getBoundingClientRect().x)
  await page.locator("#color-palette-demo #color-palette-hidden-toggle").click()
  await expect(hosts.nth(1)).toBeVisible()
  await expect(root.getByRole("button")).toHaveCount(3)
  await expect(main.nth(1)).toHaveAttribute("aria-pressed", "true")
  await expect(root.locator('[aria-pressed="true"]:visible')).toHaveCount(1)
  expect(await root.evaluate((node) => node.getBoundingClientRect().width)).toBeGreaterThan(hiddenWidth)
  expect(await hosts.nth(2).evaluate((node) => node.getBoundingClientRect().x)).toBeGreaterThan(greenHiddenX)
  await page.locator("#color-palette-demo #color-palette-hidden-toggle").click()
  await expect(hosts.nth(1)).toBeHidden()
  expect(await root.evaluate((node) => node.getBoundingClientRect().width)).toBe(hiddenWidth)
  await expect(main.nth(1)).toHaveAttribute("aria-pressed", "true")
  await expect(events(page)).toHaveText("[]")
})

test("color-palette: hidden items keep native keyboard indices instead of being skipped", async ({ page }) => {
  const root = page.locator("#color-palette-demo #color-palette-hidden"), main = swatches(root)
  await focusSwatch(main.nth(0))
  await page.keyboard.press("ArrowRight")
  await expect(main.nth(1)).toHaveAttribute("tabindex", "0")
  await expect(main.nth(0)).toHaveAttribute("tabindex", "-1")
  await expect(main.nth(0)).toBeFocused()
  await pressTo(page, "ArrowRight", main.nth(0)) // Native _canNavigate is false at the retained visible focus.
  await page.locator("#color-palette-demo #color-palette-hidden-toggle").click()
  await expect(main.nth(1)).toBeVisible()
  await main.nth(1).focus()
  await expect(main.nth(1)).toBeFocused()
  await pressTo(page, "ArrowRight", main.nth(2))
  await expect(events(page)).toHaveText("[]")
})

test("color-palette: mounted sibling refs override direct names even when missing or empty", async ({ page }) => {
  const prefix = "Color Palette - Predefined Colors"
  for (const [id, name] of [["both", `${prefix} Referenced palette`], ["missing", prefix], ["empty", prefix],
    ["empty-ref", `${prefix} Direct palette`], ["whitespace-ref", prefix], ["root-aria", prefix]]) {
    await expect(page.locator(`#color-palette-demo #color-palette-name-${id}`).getByRole("group")).toHaveAttribute("aria-label", name)
  }
  await expect(page.locator("#color-palette-demo #color-palette-name-root-aria")).toHaveAttribute("aria-label", "Host label")
})

test("color-palette: reference tokens use literal spaces and retain raw text and trailing spacing", async ({ page }) => {
  await expect(page.locator("#color-palette-demo #color-palette-name-spaces").getByRole("group"))
    .toHaveAttribute("aria-label", "Color Palette - Predefined Colors  A  B   ")
  await expect(page.locator("#color-palette-demo #color-palette-name-tab").getByRole("group"))
    .toHaveAttribute("aria-label", "Color Palette - Predefined Colors Tab target")
})

test("color-palette: mounted ShadowRoot refs win locally and fall back to document on own commits", async ({ page }) => {
  const root = page.locator("#color-palette-demo #color-palette-name-shadow"), group = root.getByRole("group")
  await expect(group).toHaveAttribute("aria-label", "Color Palette - Predefined Colors Shadow label Document fallback")
  await root.evaluate((node) => { (node.getRootNode() as ShadowRoot).getElementById("color-palette-root-label")!.textContent = "Changed shadow" })
  await root.locator("[data-color-palette-area=main]").nth(1).dispatchEvent("click")
  await expect(group).toHaveAttribute("aria-label", "Color Palette - Predefined Colors Changed shadow Document fallback")
})

test("color-palette: direct host targets select one raw color and retain physical item identity", async ({ page }) => {
  const root = page.locator("#color-palette-demo #color-palette-identity"), main = swatches(root)
  await root.locator('[data-slot="color-palette-item"]').nth(0).dispatchEvent("click")
  await expect(events(page)).toHaveText('["red"]')
  await expect(main.nth(0)).toHaveAttribute("aria-pressed", "true")
  await expect(main.nth(1)).toHaveAttribute("aria-pressed", "false")
  await expect(root.locator('[aria-pressed="true"]')).toHaveCount(1)
})

test("color-palette: painted border clicks invoke caller and selection callbacks once", async ({ page }) => {
  const root = control(page), host = root.locator('[data-slot="color-palette-item"]').nth(7)
  await host.hover()
  const point = await host.evaluate((node) => {
    const rect = node.getBoundingClientRect(), border = parseFloat(getComputedStyle(node).borderLeftWidth)
    // Rounded inner hit areas can include the middle border; choose a measured point owned by the outer host.
    const x = rect.x + border / 4
    for (let offset = border / 4; border > 0 && offset < rect.height / 2; offset += border / 2) {
      const y = rect.y + offset
      if (document.elementFromPoint(x, y) === node) return { x, y, border }
    }
    return null
  })
  expect(point).not.toBeNull()
  if (!point) throw new Error("No painted host border point")
  expect(point.border).toBeGreaterThan(0)
  expect(await host.evaluate((node, point) => document.elementFromPoint(point.x, point.y) === node, point)).toBe(true)
  await page.mouse.move(point.x, point.y)
  await page.mouse.down()
  await expect(swatches(root).nth(7)).toHaveAttribute("tabindex", "0")
  await expect(events(page)).toHaveText("[]")
  await expect(page.locator("#color-palette-demo #color-palette-click-events")).toHaveText('{"palette":[],"item":[]}')
  await page.mouse.up()
  await expect(events(page)).toHaveText('["#333333"]')
  await expect(page.locator("#color-palette-demo #color-palette-click-events")).toHaveText('{"palette":["host"],"item":["7:host"]}')
  await expect(swatches(root).nth(7)).toHaveAttribute("aria-pressed", "true")
})

test("color-palette: empty item and recent inner clicks prevent the original event and caller bubbling", async ({ page }) => {
  const root = control(page)
  const empty = page.locator('#color-palette-demo #color-palette-empty-item [role="button"]')
  const dispatch = (node: Element) => {
    const event = new MouseEvent("click", { bubbles: true, cancelable: true })
    return { accepted: node.dispatchEvent(event), prevented: event.defaultPrevented }
  }
  expect(await empty.evaluate(dispatch)).toEqual({ accepted: false, prevented: true })
  const recent = root.locator('.fiori-color-palette__recent [role="button"]')
  await expect(recent).toHaveCount(5)
  for (let index = 0; index < 5; index++) expect(await recent.nth(index).evaluate(dispatch)).toEqual({ accepted: false, prevented: true })
  await expect(events(page)).toHaveText("[]")
  await expect(page.locator("#color-palette-demo #color-palette-empty-click-events")).toHaveText('{"item":0,"parent":0}')
  await expect(page.locator("#color-palette-demo #color-palette-click-events")).toHaveText('{"palette":[],"item":[]}')
  await swatches(root).nth(2).click()
  await expect(events(page)).toHaveText('["#333300"]')
  await expect(page.locator("#color-palette-demo #color-palette-click-events")).toHaveText('{"palette":["inner"],"item":["2:inner"]}')
})

test("color-palette: managed object refs retain the inner focus target and clear on removal", async ({ page }) => {
  const root = page.locator("#color-palette-demo #color-palette-ref-examples")
  const state = root.locator("#color-palette-ref-state"), main = root.locator("#color-palette-ref-control [data-color-palette-area=main]")
  await root.locator("#color-palette-ref-sample").click()
  await expect(state).toContainText('"object":"color-palette-ref-object-item"')
  await root.locator("#color-palette-ref-object-focus").click()
  await expect(main.nth(0)).toBeFocused()
  await pressTo(page, "ArrowRight", main.nth(1))
  await root.locator("#color-palette-ref-toggle").click()
  await expect(main).toHaveCount(0)
  await root.locator("#color-palette-ref-sample").click()
  await expect(state).toContainText('"object":null')
})

test("color-palette: stable callback refs retain React 19 cleanup through rerenders and remount", async ({ page }) => {
  const root = page.locator("#color-palette-demo #color-palette-ref-examples"), state = root.locator("#color-palette-ref-state")
  const main = root.locator("#color-palette-ref-control [data-color-palette-area=main]")
  const sample = async () => {
    await root.locator("#color-palette-ref-sample").click()
    await expect(state).toContainText('"mounts":')
    return JSON.parse((await state.textContent())!) as { object: string | null; callback: string | null; mounts: number; cleanups: number; nulls: number }
  }
  const before = await sample()
  expect(before.callback).toBe("color-palette-ref-callback-item")
  expect(before.mounts).toBeGreaterThan(0)
  await main.nth(0).click()
  await expect(main.nth(0)).toHaveAttribute("aria-pressed", "true")
  expect(await sample()).toEqual(before)
  await root.locator("#color-palette-ref-callback-focus").click()
  await expect(main.nth(1)).toBeFocused()
  await root.locator("#color-palette-ref-toggle").click()
  await expect(main).toHaveCount(0)
  expect(await sample()).toEqual({ ...before, object: null, callback: null, cleanups: before.cleanups + 1 })
  await root.locator("#color-palette-ref-toggle").click()
  await expect(main).toHaveCount(2)
  expect(await sample()).toEqual({ ...before, mounts: before.mounts + 1, cleanups: before.cleanups + 1 })
  await root.locator("#color-palette-ref-callback-focus").click()
  await expect(main.nth(1)).toBeFocused()
})

test("color-palette: a main selected declaration wins after the recent row commits its removal", async ({ page }) => {
  const demo = page.locator("#color-palette-demo #color-palette-reconcile-example")
  const root = demo.locator("#color-palette-reconcile-control"), main = swatches(root), recent = swatches(root, "recent")
  const events = demo.locator("#color-palette-reconcile-events")
  await main.nth(0).click()
  await expect(recent).toHaveCount(1)
  await recent.nth(0).click()
  await expect(recent.nth(0)).toHaveAttribute("aria-pressed", "true")
  await expect(main.nth(0)).toHaveAttribute("aria-pressed", "false")
  await expect(events).toHaveText('["red","red"]')
  await demo.locator("#color-palette-reconcile-recent").click()
  await expect(root.locator(".fiori-color-palette__recent")).toHaveCount(0)
  // A separate committed prop update mirrors native recentColorsElements reading the now-absent DOM row.
  await demo.locator("#color-palette-reconcile-selected").click()
  await expect(main.nth(1)).toHaveAttribute("aria-pressed", "true")
  await expect(main.nth(0)).toHaveAttribute("aria-pressed", "false")
  await expect(root.locator('[aria-pressed="true"]')).toHaveCount(1)
  await expect(events).toHaveText('["red","red"]')
})

test("color-palette: keyed reordering, filtering and hiding preserve stable caller refs and navigation", async ({ page }) => {
  const root = page.locator("#color-palette-demo #color-palette-ref-examples"), state = root.locator("#color-palette-ref-state")
  const main = root.locator("#color-palette-ref-control [data-color-palette-area=main]"), callback = root.locator("#color-palette-ref-callback-item")
  const sample = async () => {
    await root.locator("#color-palette-ref-sample").click()
    return JSON.parse((await state.textContent())!)
  }
  const before = await sample(), element = await callback.elementHandle()
  await root.locator("#color-palette-ref-reorder").click()
  await expect(main.nth(0)).toHaveAttribute("id", "color-palette-ref-callback-item")
  expect(await callback.evaluate((node, previous) => node === previous, element)).toBe(true)
  expect(await sample()).toEqual(before)
  await root.locator("#color-palette-ref-callback-focus").click()
  await expect(callback).toBeFocused()
  await pressTo(page, "ArrowRight", main.nth(1))
  await root.locator("#color-palette-ref-filter").click()
  await expect(main).toHaveCount(1)
  expect(await sample()).toEqual({ ...before, object: null })
  expect(await callback.evaluate((node, previous) => node === previous, element)).toBe(true)
  await focusSwatch(callback)
  await pressTo(page, "ArrowRight", callback)
  await root.locator("#color-palette-ref-hidden").click()
  await expect(callback.locator("..")).toBeHidden()
  expect(await sample()).toEqual({ ...before, object: null })
  await root.locator("#color-palette-ref-hidden").click()
  await expect(callback).toBeVisible()
  await root.locator("#color-palette-ref-filter").click()
  await expect(main).toHaveCount(2)
  expect(await sample()).toEqual(before)
  await root.locator("#color-palette-ref-reorder").click()
  await expect(main.nth(1)).toHaveAttribute("id", "color-palette-ref-callback-item")
  expect(await sample()).toEqual(before)
  expect(await callback.evaluate((node, previous) => node === previous, element)).toBe(true)
  await focusSwatch(callback)
  await pressTo(page, "ArrowLeft", main.nth(0))
})

test("color-palette: changing a caller callback ref cleans the prior ref once and retains the DOM", async ({ page }) => {
  const root = page.locator("#color-palette-demo #color-palette-ref-examples"), state = root.locator("#color-palette-ref-state")
  const callback = root.locator("#color-palette-ref-callback-item"), element = await callback.elementHandle()
  const sample = async () => { await root.locator("#color-palette-ref-sample").click(); return JSON.parse((await state.textContent())!) }
  const before = await sample()
  for (let changes = 1; changes <= 2; changes++) {
    await root.locator("#color-palette-ref-prop").click()
    expect(await sample()).toEqual({ ...before, mounts: before.mounts + changes, cleanups: before.cleanups + changes })
    expect(await callback.evaluate((node, previous) => node === previous, element)).toBe(true)
    await root.locator("#color-palette-ref-callback-focus").click()
    await expect(callback).toBeFocused()
  }
})

test("color-palette: replacing a keyed item cleans its ref once and attaches the new identity", async ({ page }) => {
  const root = page.locator("#color-palette-demo #color-palette-ref-examples"), state = root.locator("#color-palette-ref-state")
  const callback = root.locator("#color-palette-ref-callback-item"), element = await callback.elementHandle()
  const sample = async () => { await root.locator("#color-palette-ref-sample").click(); return JSON.parse((await state.textContent())!) }
  const before = await sample()
  await root.locator("#color-palette-ref-identity").click()
  expect(await sample()).toEqual({ ...before, mounts: before.mounts + 1, cleanups: before.cleanups + 1 })
  expect(await callback.evaluate((node, previous) => node === previous, element)).toBe(false)
  expect(await element!.evaluate((node) => node.isConnected)).toBe(false)
  await root.locator("#color-palette-ref-callback-focus").click()
  await expect(callback).toBeFocused()
})

test("color-palette: stopped caller clicks block ancestor selection for inner and direct host targets", async ({ page }) => {
  const demo = page.locator("#color-palette-demo #color-palette-propagation-example"), root = demo.locator("#color-palette-propagation-control")
  const main = swatches(root)
  await main.nth(1).click()
  await expect(demo.locator("#color-palette-propagation-calls")).toHaveText('{"click":1,"mousedown":1,"keydown":0,"keyup":0,"root":0}')
  await expect(demo.locator("#color-palette-propagation-events")).toHaveText("[]")
  await expect(root.locator('[aria-pressed="true"]')).toHaveCount(0)
  await main.nth(2).locator("..").dispatchEvent("click")
  await expect(demo.locator("#color-palette-propagation-calls")).toHaveText('{"click":2,"mousedown":1,"keydown":0,"keyup":0,"root":0}')
  await expect(demo.locator("#color-palette-propagation-events")).toHaveText("[]")
  await expect(root.locator('[aria-pressed="true"]')).toHaveCount(0)
})

test("color-palette: stopped caller key phases block ancestor navigation and selection", async ({ page }) => {
  const demo = page.locator("#color-palette-demo #color-palette-propagation-example"), root = demo.locator("#color-palette-propagation-control")
  const main = swatches(root)
  await main.nth(0).focus(); await expect(main.nth(0)).toBeFocused()
  for (const key of ["ArrowRight", "Enter", " "]) {
    await page.keyboard.press(key)
    await expect(main.nth(0)).toBeFocused()
  }
  await expect(demo.locator("#color-palette-propagation-calls")).toHaveText('{"click":0,"mousedown":0,"keydown":3,"keyup":3,"root":0}')
  await expect(demo.locator("#color-palette-propagation-events")).toHaveText("[]")
  await expect(main.nth(0)).toHaveAttribute("tabindex", "0")
  await expect(main.nth(1)).toHaveAttribute("tabindex", "-1")
  await expect(root.locator('[aria-pressed="true"]')).toHaveCount(0)
})

test("color-palette: stopped caller mousedown preserves ancestor navigation index", async ({ page }) => {
  const demo = page.locator("#color-palette-demo #color-palette-propagation-example"), root = demo.locator("#color-palette-propagation-control")
  const main = swatches(root)
  await main.nth(1).dispatchEvent("mousedown")
  await expect(main.nth(0)).toHaveAttribute("tabindex", "0")
  await expect(main.nth(1)).toHaveAttribute("tabindex", "-1")
  await main.nth(2).locator("..").dispatchEvent("mousedown")
  await expect(main.nth(0)).toHaveAttribute("tabindex", "0")
  await expect(main.nth(2)).toHaveAttribute("tabindex", "-1")
  await expect(demo.locator("#color-palette-propagation-calls")).toHaveText('{"click":0,"mousedown":2,"keydown":0,"keyup":0,"root":0}')
  await expect(demo.locator("#color-palette-propagation-events")).toHaveText("[]")
})

test("color-palette: caller keydown preventDefault retains arrow navigation and Enter selection", async ({ page }) => {
  const demo = page.locator("#color-palette-demo #color-palette-key-default-examples"), root = demo.locator("#color-palette-key-default-keydown"), main = swatches(root)
  await focusSwatch(main.nth(0))
  await pressTo(page, "ArrowRight", main.nth(1))
  await page.keyboard.press("Enter")
  await expect(main.nth(1)).toHaveAttribute("aria-pressed", "true")
  await expect(demo.locator("#color-palette-key-default-events")).toHaveText('{"keydown":["blue"],"keyup":[],"none":[]}')
})

test("color-palette: caller keyup preventDefault retains Space selection", async ({ page }) => {
  const demo = page.locator("#color-palette-demo #color-palette-key-default-examples"), main = swatches(demo.locator("#color-palette-key-default-keyup"))
  await focusSwatch(main.nth(2))
  await page.keyboard.down(" ")
  await expect(main.nth(2)).toHaveAttribute("aria-pressed", "false")
  await page.keyboard.up(" ")
  await expect(main.nth(2)).toHaveAttribute("aria-pressed", "true")
  await expect(demo.locator("#color-palette-key-default-events")).toHaveText('{"keydown":[],"keyup":["green"],"none":[]}')
})

test("color-palette: ordinary Enter selection leaves the original keydown default unprevented", async ({ page }) => {
  const demo = page.locator("#color-palette-demo #color-palette-key-default-examples"), main = swatches(demo.locator("#color-palette-key-default-none"))
  await focusSwatch(main.nth(0))
  await page.keyboard.press("Enter")
  await expect(main.nth(0)).toHaveAttribute("aria-pressed", "true")
  await expect(demo.locator("#color-palette-key-default-keys")).toHaveText('[{"key":"Enter","defaultPrevented":false}]')
  await expect(demo.locator("#color-palette-key-default-events")).toHaveText('{"keydown":[],"keyup":[],"none":["red"]}')
})

test("color-palette: hidden root uses the actual reset and native caller display cascade", async ({ page }) => {
  const root = page.locator("#color-palette-demo #color-palette-root-hidden")
  await expect(root).toBeHidden()
  await expect.poll(() => root.evaluate((node) => ({ display: getComputedStyle(node).display, width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height }))).toEqual({ display: "none", width: 0, height: 0 })
  const reset = await root.evaluate((host) => {
    const removed: { selector: string; layers: string[] }[] = []
    const walk = (rules: CSSRuleList, layers: string[] = []) => {
      for (const rule of rules) {
        if (rule instanceof CSSStyleRule && rule.selectorText.includes("[hidden]") && host.matches(rule.selectorText)
          && rule.style.getPropertyValue("display") === "none" && rule.style.getPropertyPriority("display") === "important") {
          removed.push({ selector: rule.selectorText, layers })
          rule.style.removeProperty("display")
        }
        if ("cssRules" in rule) walk((rule as CSSGroupingRule).cssRules,
          rule.constructor.name === "CSSLayerBlockRule" ? [...layers, (rule as CSSLayerBlockRule).name] : layers)
      }
    }
    for (const sheet of document.styleSheets) walk(sheet.cssRules)
    return removed
  })
  expect(reset.length).toBeGreaterThan(0)
  expect(reset.every((rule) => rule.layers.includes("base"))).toBe(true)
  await expect(root).toBeHidden()
  await root.evaluate((node) => { node.style.display = "inline-block" })
  await expect(root).toBeVisible()
  await root.evaluate((node) => { node.style.removeProperty("display") })
  await expect(root).toBeHidden()
})
