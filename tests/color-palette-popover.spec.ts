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

test("color-palette-popover: a missing opener keeps requested open without painting or closing", async ({ page }) => {
  const root = demo(page).locator("#color-palette-popover-lifecycle-example"), popup = page.locator("#color-palette-popover-lifecycle-surface")
  await root.locator("#color-palette-popover-lifecycle-request").click()
  await expect(root.locator("#color-palette-popover-lifecycle-state")).toHaveText('{"open":true,"changes":[],"events":[]}')
  await expect(popup).toHaveCount(0)
  await root.locator("#color-palette-popover-lifecycle-presence").click()
  await expect(popup).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(popup).toBeHidden()
  await expect(root.locator("#color-palette-popover-lifecycle-state")).toHaveText('{"open":false,"changes":[false],"events":[]}')
})

test("color-palette-popover: an initially offviewport opener closes once per open request", async ({ page }) => {
  const root = demo(page).locator("#color-palette-popover-lifecycle-example"), popup = page.locator("#color-palette-popover-lifecycle-surface")
  await root.locator("#color-palette-popover-lifecycle-presence").click()
  await root.locator("#color-palette-popover-lifecycle-opener").evaluate((node) => Object.assign(node.style, { position: "fixed", left: "-1000px", top: "0" }))
  for (const changes of ["[false]", "[false,false]"]) {
    await root.locator("#color-palette-popover-lifecycle-request").click()
    await expect(root.locator("#color-palette-popover-lifecycle-state")).toHaveText(`{"open":false,"changes":${changes},"events":[]}`)
    await expect(popup).toHaveCount(0)
  }
})

test("color-palette-popover: clipping the actual opener closes without selecting", async ({ page }) => {
  const root = demo(page).locator("#color-palette-popover-lifecycle-example"), popup = page.locator("#color-palette-popover-lifecycle-surface")
  await root.locator("#color-palette-popover-lifecycle-presence").click()
  const clip = root.locator("#color-palette-popover-lifecycle-scroll")
  await clip.evaluate((node) => Object.assign(node.style, { width: "240px", height: "60px", overflow: "auto" }))
  await root.locator("#color-palette-popover-lifecycle-spacer").evaluate((node) => { node.style.height = "400px" })
  await root.locator("#color-palette-popover-lifecycle-opener").click()
  await expect(popup).toBeVisible()
  const stillInsideViewport = await clip.evaluate((node) => {
    node.scrollTop = 100
    const rect = node.querySelector("button")!.getBoundingClientRect()
    return rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth
  })
  expect(stillInsideViewport).toBe(true)
  await expect(popup).toBeHidden()
  await expect(root.locator("#color-palette-popover-lifecycle-state")).toHaveText('{"open":false,"changes":[false],"events":[]}')
})

for (const disappearance of ["hidden", "unmounted"] as const) test(`color-palette-popover: an ${disappearance} opener closes the surface`, async ({ page }) => {
  const root = demo(page).locator("#color-palette-popover-lifecycle-example"), popup = page.locator("#color-palette-popover-lifecycle-surface")
  await root.locator("#color-palette-popover-lifecycle-presence").click()
  const button = root.locator("#color-palette-popover-lifecycle-opener")
  await button.click(); await expect(popup).toBeVisible()
  if (disappearance === "hidden") await button.evaluate((node) => { node.setAttribute("hidden", "") })
  else await root.locator("#color-palette-popover-lifecycle-presence").dispatchEvent("click")
  await expect(popup).toBeHidden()
  await expect(root.locator("#color-palette-popover-lifecycle-state")).toHaveText('{"open":false,"changes":[false],"events":[]}')
})

test("color-palette-popover: closed commits reconcile removed recent selection before a new main declaration", async ({ page }) => {
  const root = demo(page).locator("#color-palette-popover-closed-example"), popup = page.locator("#color-palette-popover-closed-surface")
  const button = root.locator("#color-palette-popover-closed-opener"), palette = root.locator('[data-slot="color-palette"]')
  await button.click(); await expect(popup).toBeVisible()
  let main = popup.locator("[data-color-palette-area=main]")
  await main.nth(0).click(); await expect(popup).toBeHidden()
  await button.click(); await expect(popup).toBeVisible()
  await popup.locator("[data-color-palette-area=recent]").nth(0).click(); await expect(popup).toBeHidden()
  await expect(palette).toBeHidden()
  await expect(palette.locator("[data-color-palette-area=recent]").nth(0)).toHaveAttribute("aria-pressed", "true")
  await root.locator("#color-palette-popover-closed-recent").click()
  await expect(palette.locator(".fiori-color-palette__recent")).toHaveCount(0)
  await root.locator("#color-palette-popover-closed-selected").click()
  await expect(palette.locator("[data-color-palette-area=main]").nth(1)).toHaveAttribute("aria-pressed", "true")
  await expect(root.locator("#color-palette-popover-closed-events")).toHaveText('["red","red"]')
  await button.click(); await expect(popup).toBeVisible()
  main = popup.locator("[data-color-palette-area=main]")
  await expect(main.nth(1)).toHaveAttribute("aria-pressed", "true")
  await expect(main.nth(0)).toHaveAttribute("aria-pressed", "false")
  await expect(root.locator("#color-palette-popover-closed-events")).toHaveText('["red","red"]')
  await page.keyboard.press("Escape"); await expect(popup).toBeHidden()
})

for (const mode of ["null", "missing ID"] as const) test(`color-palette-popover: clearing an active opener to ${mode} retains the old observer without closing`, async ({ page }) => {
  const root = demo(page).locator("#color-palette-popover-lifecycle-example"), popup = page.locator("#color-palette-popover-lifecycle-surface")
  await root.locator("#color-palette-popover-lifecycle-presence").click()
  const button = root.locator("#color-palette-popover-lifecycle-opener")
  await button.click(); await expect(popup).toBeVisible()
  const original = (await popup.boundingBox())!
  const immediate = await popup.evaluate(async (node, missingId) => {
    const clear = document.getElementById("color-palette-popover-lifecycle-clear")!
    clear.click(); if (missingId) clear.click()
    await Promise.resolve() // Sample the own commit before the registry's next real timer/scroll task.
    return { box: node.getBoundingClientRect().toJSON(), missing: node.hasAttribute("data-missing-opener"), origin: node.hasAttribute("data-missing-opener-origin") }
  }, mode === "missing ID")
  expect(immediate.missing).toBe(true); expect(immediate.origin).toBe(false)
  expect(immediate.box.x).toBeCloseTo(original.x, 4); expect(immediate.box.y).toBeCloseTo(original.y, 4)
  await expect(popup).toBeVisible()
  await expect(popup).toHaveAttribute("data-missing-opener", "")
  await expect(root.locator("#color-palette-popover-lifecycle-state")).toHaveText('{"open":true,"changes":[],"events":[]}')
  await root.locator("#color-palette-popover-lifecycle-count").dispatchEvent("click")
  await expect(popup.locator("[data-color-palette-area=main]")).toHaveCount(7)
  await expect(popup).toHaveAttribute("data-missing-opener-origin", "")
  const box = (await popup.boundingBox())!
  expect(Math.abs(box.x)).toBeLessThanOrEqual(1); expect(Math.abs(box.y)).toBeLessThanOrEqual(1)
  await button.evaluate((node) => { node.setAttribute("hidden", "") })
  await expect(popup).toBeHidden()
  await expect(root.locator("#color-palette-popover-lifecycle-state")).toHaveText('{"open":false,"changes":[false],"events":[]}')
})

for (const trigger of ["idle", "document scroll", "popup scroll"] as const) test(`color-palette-popover: missing opener repositions on native registry ${trigger} without a resize`, async ({ page }) => {
  const root = demo(page).locator("#color-palette-popover-lifecycle-example"), popup = page.locator("#color-palette-popover-lifecycle-surface")
  await root.locator("#color-palette-popover-lifecycle-presence").click()
  await root.locator("#color-palette-popover-lifecycle-opener").click(); await expect(popup).toBeVisible()
  if (trigger === "popup scroll") {
    const viewport = popup.locator(".fiori-popup__root")
    await viewport.evaluate((node) => { node.style.height = "32px"; node.style.flex = "none"; node.style.overflow = "auto" })
    await expect.poll(() => viewport.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true)
  }
  const before = (await popup.boundingBox())!
  const immediate = await popup.evaluate(async (node) => {
    document.getElementById("color-palette-popover-lifecycle-clear")!.click()
    await Promise.resolve()
    return { box: node.getBoundingClientRect().toJSON(), origin: node.hasAttribute("data-missing-opener-origin") }
  })
  expect(immediate.origin).toBe(false)
  expect(immediate.box.x).toBeCloseTo(before.x, 4); expect(immediate.box.y).toBeCloseTo(before.y, 4)
  if (trigger === "document scroll") await page.evaluate(() => window.scrollBy(0, 20))
  else if (trigger === "popup scroll") {
    const viewport = popup.locator(".fiori-popup__root")
    await viewport.evaluate((node) => { node.scrollTop = 8 })
    await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0)
  }
  await expect(popup).toHaveAttribute("data-missing-opener-origin", "")
  const origin = (await popup.boundingBox())!
  expect(Math.abs(origin.x)).toBeLessThanOrEqual(1); expect(Math.abs(origin.y)).toBeLessThanOrEqual(1)
  expect(origin.width).toBe(before.width); expect(origin.height).toBe(before.height)
  await expect(popup.locator("[data-color-palette-area=main]")).toHaveCount(2)
  await expect(root.locator("#color-palette-popover-lifecycle-state")).toHaveText('{"open":true,"changes":[],"events":[]}')
})

test("color-palette-popover: moved and scrolled live opener retains its latest painted position until clear recomputes", async ({ page }) => {
  const root = demo(page).locator("#color-palette-popover-lifecycle-example"), popup = page.locator("#color-palette-popover-lifecycle-surface")
  await root.locator("#color-palette-popover-lifecycle-presence").click()
  await root.locator("#color-palette-popover-lifecycle-opener").click(); await expect(popup).toBeVisible()
  const initial = (await popup.boundingBox())!
  await root.locator("#color-palette-popover-lifecycle-opener").evaluate((node) => { node.style.transform = "translateY(20px)" })
  await page.evaluate(() => window.scrollBy(0, 40))
  await expect.poll(async () => Math.abs((await popup.boundingBox())!.y - (initial.y - 20))).toBeLessThanOrEqual(1)
  const moved = (await popup.boundingBox())!
  const immediate = await popup.evaluate(async (node) => {
    document.getElementById("color-palette-popover-lifecycle-clear")!.click(); await Promise.resolve()
    return { box: node.getBoundingClientRect().toJSON(), origin: node.hasAttribute("data-missing-opener-origin") }
  })
  expect(immediate.origin).toBe(false)
  expect(immediate.box.x).toBeCloseTo(moved.x, 4); expect(immediate.box.y).toBeCloseTo(moved.y, 4)
  await expect(popup).toHaveAttribute("data-missing-opener-origin", "")
  await expect(root.locator("#color-palette-popover-lifecycle-state")).toHaveText('{"open":true,"changes":[],"events":[]}')
})

test("color-palette-popover: forceMount has one closed owner, stable caller refs and actual focus transitions", async ({ page }) => {
  const root = demo(page).locator("#color-palette-popover-force-example"), popup = root.locator("#color-palette-popover-force-surface")
  const mount = root.locator("#color-palette-popover-force-mount"), button = root.locator("#color-palette-popover-force-opener"), state = root.locator("#color-palette-popover-force-state")
  const sample = async () => { await root.locator("#color-palette-popover-force-sample").click(); return JSON.parse((await state.textContent())!) }
  await mount.click()
  await expect(popup).toBeHidden(); await expect(mount).toBeFocused()
  await expect(root.locator('[data-slot="color-palette"]')).toHaveCount(1)
  const before = await sample()
  expect(before).toEqual({ object: "color-palette-popover-force-object", callback: "color-palette-popover-force-callback", mounts: 1, cleanups: 0, events: [], autoFocus: [] })
  const content = await popup.elementHandle()
  await expect(root.locator("#color-palette-popover-force-content-ref")).toHaveText("color-palette-popover-force-surface")
  await expect(popup).toHaveAttribute("role", "region")
  await expect(popup).toHaveAttribute("aria-description", "Retained content API")
  await button.click(); await expect(popup).toBeVisible()
  await expect(popup.locator("[data-color-palette-area=main]").nth(0)).toBeFocused()
  await button.locator("#color-palette-popover-force-opener-label").click()
  await expect(popup).toBeVisible()
  await expect(state).toContainText('"autoFocus":["open"]')
  await popup.locator("[data-color-palette-area=main]").nth(1).click()
  await expect(popup).toBeHidden(); await expect(button).toBeFocused()
  await expect(root.locator('[data-slot="color-palette"]')).toHaveCount(1)
  expect(await sample()).toEqual({ ...before, events: ["blue"], autoFocus: ["open", "close"] })
  await button.click(); await expect(popup).toBeVisible()
  await expect(popup.locator("[data-color-palette-area=main]").nth(1)).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(popup).toBeHidden(); await expect(button).toBeFocused()
  expect(await sample()).toEqual({ ...before, events: ["blue"], autoFocus: ["open", "close", "open", "close"] })
  expect(await popup.evaluate((node, original) => node === original, content)).toBe(true)
  await expect(root.locator("#color-palette-popover-force-content-ref")).toHaveText("color-palette-popover-force-surface")
  await mount.click(); await expect(popup).toHaveCount(0)
  expect(await sample()).toEqual({ ...before, object: null, callback: null, cleanups: 1, events: ["blue"], autoFocus: ["open", "close", "open", "close"] })
})

test("color-palette-popover: retained ShadowRoot opener clicks stay open and genuine outside callbacks can prevent dismissal", async ({ page }) => {
  const root = demo(page).locator("#color-palette-popover-force-shadow-example"), popup = root.locator("#color-palette-popover-force-shadow-surface")
  const label = root.locator("#color-palette-popover-force-shadow-label"), button = root.locator("#color-palette-popover-force-shadow-opener"), state = root.locator("#color-palette-popover-force-shadow-state")
  await expect(popup).toBeHidden()
  await label.click(); await expect(popup).toBeVisible()
  await expect(popup.locator("[data-color-palette-area=main]").nth(0)).toBeFocused()
  await label.click(); await expect(popup).toBeVisible()
  await expect(state).toHaveText('{"open":true,"changes":[],"outside":[]}')
  await root.locator("#color-palette-popover-force-shadow-outside").click()
  await expect(popup).toBeVisible()
  await expect(state).toHaveText('{"open":true,"changes":[],"outside":[{"phase":"pointerdown","defaultPrevented":true},{"phase":"interact","defaultPrevented":true}]}')
  await page.keyboard.press("Escape"); await expect(popup).toBeHidden(); await expect(button).toBeFocused()
  await root.locator("#color-palette-popover-force-shadow-guard").click()
  await label.click(); await expect(popup).toBeVisible()
  await root.locator("#color-palette-popover-force-shadow-outside").click()
  await expect(popup).toBeHidden()
  await expect(state).toHaveText('{"open":false,"changes":[false,false],"outside":[{"phase":"pointerdown","defaultPrevented":true},{"phase":"interact","defaultPrevented":true},{"phase":"pointerdown","defaultPrevented":false},{"phase":"interact","defaultPrevented":false}]}')
})

test("color-palette-popover: closed retained content leaves independent Escape handling and callbacks untouched", async ({ page }) => {
  const root = demo(page).locator("#color-palette-popover-force-shadow-example"), input = root.locator("#color-palette-popover-force-shadow-escape-input")
  await expect(root.locator("#color-palette-popover-force-shadow-surface")).toBeHidden()
  await input.focus(); await expect(input).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(input).toHaveValue("restored")
  await expect(root.locator("#color-palette-popover-force-shadow-escape-state")).toHaveText("false")
  await expect(root.locator("#color-palette-popover-force-shadow-state")).toHaveText('{"open":false,"changes":[],"outside":[]}')
})

const boundary = (page: Page) => demo(page).locator("#color-palette-popover-boundary-example")
const boundarySurface = (page: Page) => page.locator("#color-palette-popover-boundary-surface")
async function prepareBoundary(page: Page, retained: boolean, portal = false) {
  const root = boundary(page)
  if (retained) await root.locator("#color-palette-popover-boundary-retained").check()
  if (portal) await root.locator("#color-palette-popover-boundary-portal").check()
  return { root, popup: boundarySurface(page), button: root.locator("#color-palette-popover-boundary-opener") }
}
for (const retained of [false, true]) {
  const mode = retained ? "retained" : "normal"
  test(`color-palette-popover: ${mode} ordinary focus stays open and iframe tick preserves frame focus`, async ({ page }) => {
    const { root, popup, button } = await prepareBoundary(page, retained)
    await button.click(); await expect(popup).toBeVisible()
    await root.locator("#color-palette-popover-boundary-outside").focus()
    await expect(root.locator("#color-palette-popover-boundary-outside")).toBeFocused()
    await expect(popup).toBeVisible()
    await expect(root.locator("#color-palette-popover-boundary-state")).toContainText('"outside:focus:false","outside:interact:false"')
    const frame = page.frameLocator("#color-palette-popover-boundary-frame").locator("#frame-focus")
    await frame.focus(); await expect(frame).toBeFocused()
    await expect(popup).toBeHidden(); await expect(frame).toBeFocused()
  })
  test(`color-palette-popover: ${mode} canceled open autofocus still restores deep prior focus`, async ({ page }) => {
    const { root, popup, button } = await prepareBoundary(page, retained, true)
    await root.locator("#color-palette-popover-boundary-cancel-open-focus").check()
    const prior = root.locator("#color-palette-popover-boundary-prior")
    await prior.focus(); await expect(prior).toBeFocused()
    await button.evaluate((node) => (node as HTMLElement).click())
    await expect(popup).toBeVisible(); await expect(prior).toBeFocused()
    await root.locator("#color-palette-popover-boundary-outside").focus(); await expect(popup).toBeVisible()
    await page.keyboard.press("Escape"); await expect(popup).toBeHidden(); await expect(prior).toBeFocused()
  })
  test(`color-palette-popover: ${mode} canceled outside focus callback remains observable without dismissal`, async ({ page }) => {
    const { root, popup, button } = await prepareBoundary(page, retained)
    await root.locator("#color-palette-popover-boundary-cancel-outside-focus").check()
    await button.click(); await expect(popup).toBeVisible()
    await root.locator("#color-palette-popover-boundary-outside").focus()
    await expect(root.locator("#color-palette-popover-boundary-state")).toContainText('"outside:focus:true","outside:interact:true"')
    await expect(popup).toBeVisible()
    await page.keyboard.press("Escape"); await expect(popup).toBeHidden()
  })
  test(`color-palette-popover: ${mode} Escape follows Item propagation and Content cancellation`, async ({ page }) => {
    for (const handler of ["none", "itemPrevent", "itemStop", "contentPrevent", "contentStop", "marked"]) {
      await page.goto("/index.html"); await page.waitForSelector("html[data-ready=true]")
      const { root, popup, button } = await prepareBoundary(page, retained)
      await root.locator("#color-palette-popover-boundary-escape").selectOption(handler)
      await button.click(); await expect(popup).toBeVisible()
      const item = popup.locator("#color-palette-popover-boundary-item-0")
      await item.focus(); await expect(item).toBeFocused()
      await page.keyboard.press("Escape")
      const closes = handler === "none" || handler === "itemPrevent"
      if (closes) await expect(popup).toBeHidden()
      else await expect(popup).toBeVisible()
      const state = root.locator("#color-palette-popover-boundary-state")
      await expect(state).toContainText('"item:false"')
      if (handler === "itemStop" || handler === "marked") await expect(state).not.toContainText('"escape:')
      else await expect(state).toContainText(`"escape:${handler === "itemPrevent"}:color-palette-popover-boundary-item-0"`)
    }
  })
  test(`color-palette-popover: ${mode} modifier Escape does not consume the open palette`, async ({ page }) => {
    const { root, popup, button } = await prepareBoundary(page, retained)
    await button.click(); await expect(popup).toBeVisible()
    const item = popup.locator("#color-palette-popover-boundary-item-0")
    await item.focus(); await expect(item).toBeFocused()
    for (const key of ["Shift+Escape", "Alt+Escape", "Control+Escape", "Meta+Escape"]) {
      await page.keyboard.press(key); await expect(popup).toBeVisible()
    }
    await expect(root.locator("#color-palette-popover-boundary-state")).not.toContainText('"escape:')
    await page.keyboard.press("Escape"); await expect(popup).toBeHidden()
  })
  test(`color-palette-popover: ${mode} only the newest palette closes on bubble Escape`, async ({ page }) => {
    const { root, popup, button } = await prepareBoundary(page, retained, true)
    await button.click(); await expect(popup).toBeVisible()
    await root.locator("#color-palette-popover-boundary-second-opener").evaluate((node) => (node as HTMLElement).click())
    const second = page.locator("#color-palette-popover-boundary-second")
    await expect(second).toBeVisible(); await expect(second.locator("[data-color-palette-area=main]").nth(0)).toBeFocused()
    await page.keyboard.press("Escape"); await expect(second).toBeHidden(); await expect(popup).toBeVisible()
    await page.keyboard.press("Escape"); await expect(popup).toBeHidden()
  })
  for (const foreign of ["dialog", "popover"] as const) for (const newer of ["foreign", "palette"] as const) {
    test(`color-palette-popover: ${mode} ${newer} is topmost with existing ${foreign}`, async ({ page }) => {
      const { root, popup, button } = await prepareBoundary(page, retained, true)
      const foreignOpener = root.locator(`#color-palette-popover-boundary-${foreign}-opener`)
      const foreignSurface = page.locator(`#color-palette-popover-boundary-${foreign}`)
      if (newer === "foreign") {
        await button.click(); await expect(popup).toBeVisible()
        await foreignOpener.evaluate((node) => (node as HTMLElement).click()); await expect(foreignSurface).toBeVisible()
        await page.keyboard.press("Escape"); await expect(foreignSurface).toBeHidden(); await expect(popup).toBeVisible()
      } else {
        await foreignOpener.click(); await expect(foreignSurface).toBeVisible()
        await button.evaluate((node) => (node as HTMLElement).click()); await expect(popup).toBeVisible()
        await expect(popup.getByRole("button", { name: "Default Color", exact: true })).toBeFocused()
        await page.keyboard.press("Escape"); await expect(popup).toBeHidden(); await expect(foreignSurface).toBeVisible()
      }
    })
  }
  for (const placement of ["Bottom", "Top", "Start", "End"] as const) {
    test(`color-palette-popover: ${mode} constrained ${placement} uses native more-room fallback and root limits`, async ({ page }) => {
      await page.setViewportSize({ width: 400, height: 420 })
      const { root, popup, button } = await prepareBoundary(page, retained)
      await root.locator("#color-palette-popover-boundary-geometry").check()
      await root.locator("#color-palette-popover-boundary-placement").selectOption(placement)
      const top = placement === "Top" ? 260 : placement === "Bottom" ? 100 : 170
      await button.evaluate((node, top) => Object.assign(node.style, { position: "fixed", left: "150px", top: `${top}px`, width: "100px", height: "36px" }), top)
      await button.click(); await expect(popup).toBeVisible()
      await expect(popup).toHaveAttribute("data-side", placement.toLowerCase().replace("start", "left").replace("end", "right"))
      const sizes = await popup.evaluate((node) => {
        const root = node.querySelector<HTMLElement>(".fiori-popup__root")!, content = node.querySelector<HTMLElement>(".fiori-color-palette-popover__content")!
        return { rect: node.getBoundingClientRect().toJSON(), root: root.getBoundingClientRect().toJSON(), width: parseFloat(node.style.getPropertyValue("--radix-popover-content-available-width")), height: parseFloat(node.style.getPropertyValue("--radix-popover-content-available-height")), scrollWidth: content.scrollWidth, clientWidth: content.clientWidth }
      })
      if (placement === "Bottom") { expect(sizes.rect.y).toBe(136); expect(sizes.height).toBe(274); expect(sizes.root.height).toBeLessThanOrEqual(274) }
      if (placement === "Top") { expect(sizes.rect.y).toBe(0); expect(sizes.height).toBe(250); expect(sizes.root.height).toBeLessThanOrEqual(250) }
      if (placement === "Start" || placement === "End") { expect(sizes.width).toBe(140); expect(sizes.root.width).toBeLessThanOrEqual(140); expect(sizes.scrollWidth).toBeGreaterThan(sizes.clientWidth) }
    })
  }
  test(`color-palette-popover: ${mode} caller boundary and edge padding publish compatible available size`, async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 420 })
    const { root, popup, button } = await prepareBoundary(page, retained)
    await root.locator("#color-palette-popover-boundary-geometry").check()
    await root.locator("#color-palette-popover-boundary-collision-box").evaluate((node) => Object.assign(node.style, { position: "fixed", left: "100px", top: "50px", width: "300px", height: "250px" }))
    await root.locator("#color-palette-popover-boundary-collision").check()
    await button.evaluate((node) => Object.assign(node.style, { position: "fixed", left: "180px", top: "80px", width: "120px", height: "36px" }))
    await button.click(); await expect(popup).toBeVisible(); await expect(popup).toHaveAttribute("data-side", "bottom")
    const size = await popup.evaluate((node) => ({ height: node.style.getPropertyValue("--radix-popover-content-available-height"), width: node.style.getPropertyValue("--radix-popover-content-available-width"), rect: node.getBoundingClientRect().toJSON() }))
    expect(size.height).toBe("166px"); expect(size.width).toBe("284px"); expect(size.rect.y).toBe(116); expect(size.rect.x).toBe(114)
  })
  test(`color-palette-popover: ${mode} an external target over the painted rectangle counts as inside`, async ({ page }) => {
    const { popup, button } = await prepareBoundary(page, retained)
    await button.click(); await expect(popup).toBeVisible()
    await popup.evaluate((node) => {
      const rect = node.getBoundingClientRect(), cover = document.createElement("div")
      cover.id = "color-palette-popover-boundary-external-cover"; cover.popover = "manual"; cover.textContent = "External rectangle target"
      Object.assign(cover.style, { position: "fixed", inset: "auto", margin: "0", border: "0", padding: "0", left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px`, background: "white" })
      document.body.append(cover); cover.showPopover()
    })
    await page.locator("#color-palette-popover-boundary-external-cover").click(); await expect(popup).toBeVisible()
    await page.locator("#color-palette-popover-boundary-external-cover").evaluate((node) => { (node as HTMLElement).hidePopover(); node.remove() })
    await page.keyboard.press("Escape"); await expect(popup).toBeHidden()
  })
}
