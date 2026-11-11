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

test("color-palette-popover: forwards both naming props with native ref priority and a separate dialog label", async ({ page }) => {
  for (const name of ["Color Palette - Predefined Colors  Popup target ", "Color Palette - Predefined Colors", "Color Palette - Predefined Colors", "Color Palette - Predefined Colors Direct popup"]) {
    await open(page)
    await expect(surface(page)).toHaveAttribute("aria-label", "Color Palette")
    await expect(surface(page).getByRole("group")).toHaveAttribute("aria-label", name)
    await page.keyboard.press("Escape")
    await expect(surface(page)).toBeHidden()
    await demo(page).locator("#color-palette-popover-name-case").click()
  }
  await expect(events(page)).toHaveText("[]")
})

test("color-palette-popover: host click closes with one raw callback and restores selection on reopening", async ({ page }) => {
  await open(page)
  await surface(page).locator('[data-color-palette-area=main]').nth(2).locator("..").dispatchEvent("click")
  await expect(surface(page)).toBeHidden()
  await expect(opener(page)).toBeFocused()
  await expect(events(page)).toHaveText('["#333300"]')
  await open(page)
  await expect(main(page).nth(2)).toHaveAttribute("aria-pressed", "true")
  await expect(main(page).nth(2)).toBeFocused()
})

for (const close of ["selection", "Escape"] as const) test(`color-palette-popover: ${close} restores an actual ShadowRoot opener ref`, async ({ page }) => {
  const root = demo(page).locator("#color-palette-popover-shadow-example")
  const button = root.locator("#color-palette-popover-shadow-opener")
  const popup = page.locator("#color-palette-popover-shadow-surface")
  await button.click()
  await expect(popup).toBeVisible()
  await expect(popup.locator("[data-color-palette-area=main]").nth(0)).toBeFocused()
  if (close === "selection") await popup.locator("[data-color-palette-area=main]").nth(1).click()
  else await page.keyboard.press("Escape")
  await expect(popup).toBeHidden()
  await expect(button).toBeFocused()
  expect(await button.evaluate((node) => {
    let active = document.activeElement
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement
    return active === node
  })).toBe(true)
  await expect(root.locator("#color-palette-popover-shadow-events")).toHaveText(close === "selection" ? '["blue"]' : "[]")
})

async function preparePlacement(page: Page, direction: "ltr" | "rtl", placement: "Start" | "End" | "Left" | "Right") {
  const root = demo(page).locator("#color-palette-popover-placement-example"), button = root.locator("#color-palette-popover-placement-opener")
  await button.evaluate((node) => Object.assign(node.style, { position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }))
  if (direction === "rtl") await root.locator("#color-palette-popover-placement-direction").click()
  for (const value of ["Start", "End", "Left", "Right"]) {
    if (value === placement) break
    await root.locator("#color-palette-popover-placement-value").click()
  }
  await expect(root.locator("#color-palette-popover-placement-state")).toHaveText(`${direction}:${placement}`)
  await button.click()
  const popup = page.locator("#color-palette-popover-placement-surface")
  await expect(popup).toBeVisible()
  return { button, popup }
}

async function expectPlacement(button: Locator, popup: Locator, side: "left" | "right", direction: "ltr" | "rtl") {
  await expect(button).toHaveAttribute("dir", "ltr") // The owning popup inherits its wrapper, independently of the opener.
  await expect(popup).toHaveAttribute("data-side", side)
  await expect(popup).toHaveAttribute("dir", direction)
  const anchor = (await button.boundingBox())!, box = (await popup.boundingBox())!
  if (side === "left") expect(box.x + box.width).toBeLessThanOrEqual(anchor.x + 1)
  else expect(box.x).toBeGreaterThanOrEqual(anchor.x + anchor.width - 1)
}

for (const [direction, placement, side] of [["ltr", "Start", "left"], ["ltr", "End", "right"], ["rtl", "Start", "right"], ["rtl", "End", "left"]] as const) {
  test(`color-palette-popover: ${placement} uses inherited ${direction} placement with a portal`, async ({ page }) => {
    const { button, popup } = await preparePlacement(page, direction, placement)
    await expectPlacement(button, popup, side, direction)
    await page.keyboard.press("Escape")
    await expect(popup).toBeHidden()
    await expect(button).toBeFocused()
  })
}

test("color-palette-popover: Left and Right aliases remain physical in both directions", async ({ page }) => {
  for (const direction of ["ltr", "rtl"] as const) for (const placement of ["Left", "Right"] as const) {
    await page.goto("/index.html")
    await page.waitForSelector("html[data-ready=true]")
    const { button, popup } = await preparePlacement(page, direction, placement)
    await expectPlacement(button, popup, placement === "Left" ? "left" : "right", direction)
    await page.keyboard.press("Escape")
    await expect(popup).toBeHidden()
  }
})
