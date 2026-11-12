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
  await expect.poll(() => surface(page).evaluate((node) => node.contains(document.activeElement))).toBe(true)
}
async function focusSwatch(target: Locator) {
  // Native Popover.isClicked uses coordinates even for synthetic mousedown; hit the actual painted swatch.
  await target.evaluate((node) => {
    const rect = node.getBoundingClientRect()
    node.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, composed: true, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 }))
  })
  await expect(target).toHaveAttribute("tabindex", "0")
  await target.focus()
  await expect(target).toBeFocused()
}
async function pressTo(page: Page, key: string, target: Locator) {
  await page.keyboard.press(key)
  await expect(target).toBeFocused()
}

test.beforeEach(async ({ page }) => {
  await page.goto("/index.html#/color-palette-popover")
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
    await page.goto(`/index.html?case=${direction}-${placement}#/color-palette-popover`)
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

for (const retained of [false, true]) {
  const mode = retained ? "retained palette" : "ordinary palette"
  async function openDialog(page: Page) {
    const root = demo(page).locator("#color-palette-popover-layers-example")
    if (retained) await root.locator("#color-palette-popover-layers-retained").check()
    await root.locator("#color-palette-popover-layers-dialog-opener").click()
    const dialog = page.locator("#color-palette-popover-layers-dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.locator("#color-palette-popover-layers-opener")).toBeFocused()
    return { dialog, button: dialog.locator("#color-palette-popover-layers-opener"), popup: page.locator("#color-palette-popover-layers-palette") }
  }
  test(`color-palette-popover: ${mode} Escape closes the palette then its parent Dialog`, async ({ page }) => {
    const { dialog, button, popup } = await openDialog(page)
    await button.click(); await expect(popup).toBeVisible()
    await expect(popup.locator("[data-color-palette-area=main]").nth(0)).toBeFocused()
    await page.keyboard.press("Escape"); await expect(popup).toHaveCount(0); await expect(button).toBeFocused(); await expect(dialog).toBeVisible()
    await page.keyboard.press("Escape"); await expect(dialog).toBeHidden()
    await expect(demo(page).locator("#color-palette-popover-layers-dialog-opener")).toBeFocused()
  })
  test(`color-palette-popover: ${mode} selection releases its layer for Select, ComboBox and Popover inside Dialog`, async ({ page }) => {
    const { dialog, button, popup } = await openDialog(page)
    await button.click(); await expect(popup).toBeVisible()
    await popup.locator("[data-color-palette-area=main]").nth(1).click()
    await expect(popup).toHaveCount(0); await expect(button).toBeFocused()
    await expect(dialog.locator("#color-palette-popover-layers-state")).toContainText('"events":["blue"]')
    await button.click(); await expect(popup).toBeVisible(); await expect(popup.locator("[data-color-palette-area=main]").nth(1)).toBeFocused()
    await page.keyboard.press("Escape"); await expect(popup).toHaveCount(0); await expect(button).toBeFocused()
    const select = dialog.locator("#color-palette-popover-layers-select")
    await select.focus(); await page.keyboard.press("Alt+ArrowDown")
    const list = page.getByTestId("color-palette-popover-layers-select-list")
    await expect(list).toBeVisible(); await expect(list.getByRole("option", { name: "Germany" })).toBeFocused()
    await page.keyboard.press("Escape"); await expect(list).toBeHidden(); await expect(select).toBeFocused(); await expect(dialog).toBeVisible()
    const combo = dialog.locator("#color-palette-popover-layers-combo")
    await combo.focus(); await expect(combo).toBeFocused(); await page.keyboard.press("F4")
    const comboList = page.getByRole("listbox", { name: "Available Options" })
    await expect(comboList).toBeVisible()
    await page.keyboard.press("Escape"); await expect(comboList).toBeHidden(); await expect(combo).toBeFocused(); await expect(dialog).toBeVisible()
    const trigger = dialog.locator("#color-palette-popover-layers-popover-opener"), other = page.locator("#color-palette-popover-layers-popover")
    await trigger.click(); await expect(other).toBeVisible(); await expect(other.locator("input")).toBeFocused()
    await page.keyboard.press("Escape"); await expect(other).toBeHidden(); await expect(trigger).toBeFocused(); await expect(dialog).toBeVisible()
    await page.keyboard.press("Escape"); await expect(dialog).toBeHidden()
  })
  test(`color-palette-popover: ${mode} unmount releases its layer and cancellation belongs to Content`, async ({ page }) => {
    const { dialog, button, popup } = await openDialog(page)
    await dialog.locator("#color-palette-popover-layers-cancel-escape").check()
    await button.click(); await expect(popup).toBeVisible(); await expect(popup.locator("[data-color-palette-area=main]").nth(0)).toBeFocused()
    await page.keyboard.press("Escape"); await expect(popup).toBeVisible(); await expect(dialog).toBeVisible()
    // Programmatic unmount isolates component cleanup from outside-pointer dismissal.
    await dialog.locator("#color-palette-popover-layers-unmount").dispatchEvent("click")
    await expect(popup).toHaveCount(0); await expect(button).toBeFocused()
    const trigger = dialog.locator("#color-palette-popover-layers-popover-opener"), other = page.locator("#color-palette-popover-layers-popover")
    await trigger.click(); await expect(other).toBeVisible(); await expect(other.locator("input")).toBeFocused()
    await page.keyboard.press("Escape"); await expect(other).toBeHidden(); await expect(trigger).toBeFocused(); await expect(dialog).toBeVisible()
    await page.keyboard.press("Escape"); await expect(dialog).toBeHidden()
  })
}

test("color-palette-popover: closed forceMount requests install no Escape or outside interaction layer", async ({ page }) => {
  const root = demo(page).locator("#color-palette-popover-force-shadow-example"), input = root.locator("#color-palette-popover-force-shadow-escape-input")
  await expect(root.locator("#color-palette-popover-force-shadow-surface")).toHaveCount(0)
  await input.focus(); await expect(input).toBeFocused(); await page.keyboard.press("Escape")
  await expect(input).toHaveValue("restored"); await expect(root.locator("#color-palette-popover-force-shadow-escape-state")).toHaveText("false")
  await root.locator("#color-palette-popover-force-shadow-outside").click()
  await expect(root.locator("#color-palette-popover-force-shadow-state")).toHaveText('{"open":false,"changes":[],"outside":[]}')
})

test("color-palette-popover: opener composed-path hits stay open and caller outside prevention is honored", async ({ page }) => {
  const root = demo(page).locator("#color-palette-popover-force-shadow-example"), popup = root.locator("#color-palette-popover-force-shadow-surface")
  const label = root.locator("#color-palette-popover-force-shadow-label"), button = root.locator("#color-palette-popover-force-shadow-opener")
  await label.click(); await expect(popup).toBeVisible(); await expect(popup.locator("[data-color-palette-area=main]").nth(0)).toBeFocused()
  await label.click(); await expect(popup).toBeVisible(); await expect(root.locator("#color-palette-popover-force-shadow-state")).toHaveText('{"open":true,"changes":[],"outside":[]}')
  await root.locator("#color-palette-popover-force-shadow-outside").click(); await expect(popup).toBeVisible()
  await expect(root.locator("#color-palette-popover-force-shadow-state")).toContainText('"phase":"pointerdown","defaultPrevented":true')
  await page.keyboard.press("Escape"); await expect(popup).toHaveCount(0); await expect(button).toBeFocused()
})


test("color-palette-popover: content refs and autofocus callbacks follow each released surface lifecycle", async ({ page }) => {
  const root = demo(page).locator("#color-palette-popover-force-example"), button = root.locator("#color-palette-popover-force-opener")
  const popup = root.locator("#color-palette-popover-force-surface"), state = root.locator("#color-palette-popover-force-state")
  await root.locator("#color-palette-popover-force-mount").click()
  await expect(popup).toHaveCount(0)
  await expect(root.locator('[data-slot="color-palette"]')).toHaveCount(1)
  await button.click(); await expect(popup).toBeVisible(); await expect(popup.locator("[data-color-palette-area=main]").nth(0)).toBeFocused()
  await expect(popup).toHaveAttribute("role", "region"); await expect(popup).toHaveAttribute("aria-description", "Retained content API")
  await expect(root.locator("#color-palette-popover-force-content-ref")).toHaveText("color-palette-popover-force-surface")
  await popup.locator("[data-color-palette-area=main]").nth(1).click()
  await expect(popup).toHaveCount(0); await expect(button).toBeFocused(); await expect(state).toContainText('"autoFocus":["open","close"]')
  await root.locator("#color-palette-popover-force-sample").click()
  await expect(root.locator("#color-palette-popover-force-content-ref")).toHaveText("none")
  await button.click(); await expect(popup).toBeVisible(); await expect(popup.locator("[data-color-palette-area=main]").nth(1)).toBeFocused()
  await page.keyboard.press("Escape"); await expect(popup).toHaveCount(0); await expect(button).toBeFocused()
  await expect(state).toContainText('"autoFocus":["open","close","open","close"]')
})

test("color-palette-popover: shared positioning flips at a viewport edge and limits the scrolling content", async ({ page }) => {
  await opener(page).evaluate((node) => Object.assign(node.style, { position: "fixed", left: "1120px", top: "790px", width: "140px", height: "36px" }))
  await open(page); await expect(surface(page)).toHaveAttribute("data-side", "top")
  const geometry = await surface(page).evaluate((node) => ({ box: node.getBoundingClientRect().toJSON(), margin: parseFloat(getComputedStyle(node).getPropertyValue("--fiori-popup-viewport-margin")) }))
  expect(geometry.box.right).toBeLessThanOrEqual(1280 - geometry.margin)
  expect(geometry.box.bottom).toBeLessThanOrEqual(790)
  await surface(page).evaluate((node) => { node.style.height = "1200px" })
  await expect.poll(() => surface(page).evaluate((node) => node.getBoundingClientRect().height)).toBeLessThanOrEqual(790 - geometry.margin)
  const content = surface(page).locator(".fiori-color-palette-popover__content")
  await expect.poll(() => content.evaluate((node) => node.clientHeight)).toBeLessThanOrEqual(790 - geometry.margin)
  await page.keyboard.press("Escape"); await expect(surface(page)).toHaveCount(0)
})


for (const mode of ["empty", "empty-value", "hidden", "hidden-before-visible"] as const) {
  test(`color-palette-popover: ${mode} without a visible tab stop initially focuses the shared dialog surface`, async ({ page }) => {
    const root = demo(page).locator("#color-palette-popover-empty-example"), popup = page.locator("#color-palette-popover-empty-surface")
    const button = root.locator("#color-palette-popover-empty-opener"), state = root.locator("#color-palette-popover-empty-state")
    await root.locator("#color-palette-popover-empty-mode").selectOption(mode)
    await button.click(); await expect(popup).toBeVisible(); await expect(state).toContainText('"autoFocus":["open"]')
    await expect(popup).toHaveAttribute("role", "dialog"); await expect(popup).toHaveAttribute("tabindex", "-1"); await expect(popup).toBeFocused()
    await expect(state).toContainText('"surface":"color-palette-popover-empty-surface"')
    if (mode === "hidden-before-visible") {
      // Native initial focus requires a visible nonnegative tab stop; the hidden first item still owns index zero.
      await expect(popup.locator("[data-color-palette-area=main]").nth(1)).toBeVisible()
      await expect(popup.locator("[data-color-palette-area=main]").nth(1)).toHaveAttribute("tabindex", "-1")
    }
    await page.keyboard.press("Escape"); await expect(popup).toHaveCount(0); await expect(button).toBeFocused()
    await expect(state).toContainText('"autoFocus":["open","close"]')
  })
}

test("color-palette-popover: caller cancellation preserves opener focus even when no visible target exists", async ({ page }) => {
  const root = demo(page).locator("#color-palette-popover-empty-example"), popup = page.locator("#color-palette-popover-empty-surface")
  const button = root.locator("#color-palette-popover-empty-opener"), state = root.locator("#color-palette-popover-empty-state")
  await root.locator("#color-palette-popover-empty-cancel-focus").check()
  await button.click(); await expect(popup).toBeVisible(); await expect(state).toContainText('"autoFocus":["open"]')
  await expect(button).toBeFocused(); await expect(state).toContainText('"surface":"color-palette-popover-empty-surface"')
  await page.keyboard.press("Escape"); await expect(popup).toHaveCount(0); await expect(button).toBeFocused()
})
