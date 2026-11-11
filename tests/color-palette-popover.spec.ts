import { expect, test, type Locator, type Page } from "@playwright/test"

const demo = (page: Page) => page.locator("#color-palette-popover-demo")
const opener = (page: Page) => demo(page).locator("#color-palette-popover-opener")
const surface = (page: Page) => page.locator("#color-palette-popover-surface")
const main = (page: Page) => surface(page).locator("[data-color-palette-area=main]")
const recent = (page: Page) => surface(page).locator("[data-color-palette-area=recent]")
const events = (page: Page) => demo(page).locator("#color-palette-popover-events")
const defaultButton = (page: Page) => surface(page).getByRole("button", { name: "Default Color", exact: true })
async function open(page: Page) {
  await opener(page).click()
  await expect(surface(page)).toBeVisible()
}
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

test("color-palette-popover: initial focus, no late theft, Escape and opener restoration", async ({ page }) => {
  await opener(page).focus(); await page.keyboard.press("Enter")
  await expect(defaultButton(page)).toBeFocused()
  await pressTo(page, "ArrowDown", main(page).nth(0))
  await pressTo(page, "ArrowRight", main(page).nth(1))
  await page.keyboard.press("Escape")
  await expect(surface(page)).toBeHidden()
  await expect(opener(page)).toBeFocused()
  await expect(events(page)).toHaveText("[]")
  await demo(page).locator("#color-palette-popover-default-toggle").click()
  // Escape preserves the delegate's current roving tab stop; hiding the default does not reset it.
  await open(page); await expect(main(page).nth(1)).toBeFocused()
  await pressTo(page, "ArrowRight", main(page).nth(2))
})

test("color-palette-popover: selection closes and reopens at selected item with retained history", async ({ page }) => {
  await open(page)
  await main(page).nth(7).click()
  await expect(surface(page)).toBeHidden(); await expect(opener(page)).toBeFocused()
  await expect(events(page)).toHaveText('["#333333"]')
  await open(page)
  await expect(main(page).nth(7)).toBeFocused()
  await expect(main(page).nth(7)).toHaveAttribute("aria-pressed", "true")
  await expect(recent(page).nth(0)).toHaveAttribute("aria-label", "Color - 1: #333333")
})

test("color-palette-popover: Home/End row and auxiliary navigation including incomplete rows", async ({ page }) => {
  await open(page)
  await focusSwatch(main(page).nth(7)); await pressTo(page, "Home", main(page).nth(5))
  await pressTo(page, "Home", defaultButton(page))
  await pressTo(page, "End", main(page).nth(14))
  await pressTo(page, "End", defaultButton(page))
  await focusSwatch(main(page).nth(7)); await pressTo(page, "End", main(page).nth(9))
  await pressTo(page, "End", defaultButton(page))
  await page.keyboard.press("Escape"); await expect(surface(page)).toBeHidden()
  await demo(page).locator("#color-palette-popover-count").click()
  await open(page); await expect(main(page)).toHaveCount(12)
  await focusSwatch(main(page).nth(10)); await pressTo(page, "End", main(page).nth(11))
  await pressTo(page, "End", defaultButton(page))
})

test("color-palette-popover: forward Tab commits main without changing marker or reopen hint", async ({ page }) => {
  await open(page); await main(page).nth(7).click(); await expect(surface(page)).toBeHidden()
  await open(page); await expect(main(page).nth(7)).toBeFocused()
  await pressTo(page, "ArrowRight", main(page).nth(8))
  await page.keyboard.press("Tab")
  await expect(surface(page)).toBeHidden(); await expect(opener(page)).toBeFocused()
  await expect(events(page)).toHaveText('["#333333","#800000"]')
  await open(page)
  await expect(main(page).nth(7)).toBeFocused()
  await expect(main(page).nth(7)).toHaveAttribute("aria-pressed", "true")
  await expect(main(page).nth(8)).toHaveAttribute("aria-pressed", "false")
})

test("color-palette-popover: default Tab commits raw color and recent fallback focus", async ({ page }) => {
  await open(page); await expect(defaultButton(page)).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(surface(page)).toBeHidden(); await expect(opener(page)).toBeFocused()
  await expect(events(page)).toHaveText('["rgb(1, 2, 3)"]')
  await open(page); await expect(recent(page).nth(0)).toBeFocused()
  await expect(surface(page).locator('[aria-pressed="true"]')).toHaveCount(0)
})

test("color-palette-popover: recent Tab and Shift+Tab traverse without committing", async ({ page }) => {
  await open(page); await main(page).nth(2).click(); await expect(surface(page)).toBeHidden()
  await open(page); await focusSwatch(recent(page).nth(0))
  await page.keyboard.press("Tab")
  await expect(surface(page)).toBeVisible(); await expect(defaultButton(page)).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(surface(page)).toBeVisible(); await expect(recent(page).nth(0)).toBeFocused()
  await expect(events(page)).toHaveText('["#333300"]')
})

test("color-palette-popover: recent Home/End and Up/Down reset reopen hint", async ({ page }) => {
  for (const index of [0, 2, 4]) { await open(page); await main(page).nth(index).click(); await expect(surface(page)).toBeHidden() }
  await open(page)
  await focusSwatch(recent(page).nth(1)); await pressTo(page, "Home", recent(page).nth(0))
  await pressTo(page, "End", recent(page).nth(2))
  await pressTo(page, "ArrowDown", defaultButton(page))
  await page.keyboard.press("Escape"); await expect(surface(page)).toBeHidden()
  await open(page); await expect(recent(page).nth(0)).toBeFocused()
})

test("color-palette-popover: outside pointer dismisses without selection", async ({ page }) => {
  await open(page)
  await demo(page).locator("#color-palette-popover-default-toggle").click()
  await expect(surface(page)).toBeHidden(); await expect(opener(page)).toBeFocused()
  await expect(events(page)).toHaveText("[]")
})
