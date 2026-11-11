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
  await page.goto("/index.html")
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
