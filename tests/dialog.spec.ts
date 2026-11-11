import { expect, test, type Locator, type Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
})

test("dialog: opens with focus inside, Escape closes and returns focus to the opener", async ({ page }) => {
  const opener = page.locator("#open-dialog")
  await opener.focus()
  await page.keyboard.press("Enter")
  const dialog = page.getByRole("dialog", { name: "Edit product" })
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute("aria-modal", "true")
  // Focus moves to the first focusable element.
  await expect(page.locator("#dialog-name")).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
})

test("dialog: focus is trapped inside", async ({ page }) => {
  await page.locator("#open-dialog").click()
  const dialog = page.getByRole("dialog", { name: "Edit product" })
  await expect(page.locator("#dialog-name")).toBeFocused()
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab")
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)
  }
  await page.keyboard.press("Shift+Tab")
  expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)
})

test("dialog: footer actions are end-aligned, emphasized action first", async ({ page }) => {
  await page.locator("#open-dialog").click()
  const dialog = page.getByRole("dialog", { name: "Edit product" })
  const footer = dialog.locator("[data-slot=dialog-footer]")
  const buttons = footer.getByRole("button")
  await expect(buttons).toHaveText(["Save", "Cancel"])
  await expect(buttons.first()).toHaveAttribute("data-variant", "emphasized")
  const f = (await footer.boundingBox())!
  const last = (await buttons.last().boundingBox())!
  const first = (await buttons.first().boundingBox())!
  expect(first.x).toBeLessThan(last.x)
  // Right edge: footer padding (1rem) + bar item margin (0.25rem) = 20px from the dialog's edge.
  expect(Math.round(f.x + f.width - (last.x + last.width))).toBe(20)
  await buttons.last().click()
  await expect(dialog).toHaveCount(0)
})

test("dialog: blocks the page with an overlay and is centered", async ({ page }) => {
  await page.locator("#open-dialog").click()
  const overlay = page.locator("[data-slot=dialog-overlay]")
  await expect(overlay).toBeVisible()
  const dialog = page.getByRole("dialog", { name: "Edit product" })
  const box = (await dialog.boundingBox())!
  const vp = page.viewportSize()!
  expect(Math.abs(box.x + box.width / 2 - vp.width / 2)).toBeLessThanOrEqual(1)
  expect(Math.abs(box.y + box.height / 2 - vp.height / 2)).toBeLessThanOrEqual(1)
  // Clicking the overlay does not interact with the page underneath.
  await page.mouse.click(5, vp.height - 5)
})

for (const [state, role] of [
  ["Negative", "alertdialog"],
  ["Critical", "alertdialog"],
  ["Positive", "dialog"],
  ["Information", "dialog"],
] as const) {
  test(`dialog: ${state} state has role=${role}, a state icon and a colored header line`, async ({ page }) => {
    await page.locator("[data-demo=state-dialog]").getByText(state, { exact: true }).click()
    const dialog = page.getByRole(role, { name: state })
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute("data-state-value", state.toLowerCase())
    const icon = dialog.locator("[data-slot=dialog-header] [data-slot=icon]")
    await expect(icon).toHaveAttribute("aria-hidden", "true")
    const iconName = { Negative: "error", Critical: "alert", Positive: "sys-enter-2", Information: "information" }[state]
    await expect(icon).toHaveAttribute("data-icon", iconName)
    const line = await dialog.locator(".fiori-popup__header").evaluate((h) => getComputedStyle(h, "::before").backgroundColor)
    const expected = await page.evaluate(
      (v) => {
        const probe = document.createElement("div")
        probe.style.backgroundColor = `var(${v})`
        document.body.append(probe)
        const c = getComputedStyle(probe).backgroundColor
        probe.remove()
        return c
      },
      { Negative: "--sapErrorBorderColor", Critical: "--sapWarningBorderColor", Positive: "--sapSuccessBorderColor", Information: "--sapInformationBorderColor" }[state]
    )
    expect(line).toBe(expected)
    await page.keyboard.press("Escape")
    await expect(dialog).toHaveCount(0)
  })
}

async function openMovable(page: Page, rtl = false) {
  const name = rtl ? "dialog-rtl" : "dialog-movable"
  await page.locator(`#dialog-demo #${name}-open`).click()
  const dialog = page.locator(`#${name}-content`)
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('[data-slot="dialog-movement-handle"]')).toHaveCount(1)
  return dialog
}

async function mouseDelta(page: Page, target: Locator, dx: number, dy: number) {
  const box = (await target.boundingBox())!
  const x = box.x + Math.min(5, box.width / 2), y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + dx, y + dy)
  await page.mouse.up()
}

async function expectBox(dialog: Locator, expected: Partial<{ x: number; y: number; width: number; height: number }>) {
  await expect.poll(async () => {
    const box = (await dialog.boundingBox())!
    return Object.fromEntries(Object.keys(expected).map((key) => [key, Math.round(box[key as keyof typeof box])]))
  }).toEqual(Object.fromEntries(Object.entries(expected).map(([key, value]) => [key, Math.round(value!)])))
}

test("dialog: mouse dragging uses header delta, excludes buttons and title, and stops on mouseup", async ({ page }) => {
  const dialog = await openMovable(page)
  const initial = (await dialog.boundingBox())!
  await mouseDelta(page, dialog.locator('[data-slot="dialog-header"]'), 48, 32)
  const moved = { x: initial.x + 48, y: initial.y + 32, width: initial.width, height: initial.height }
  await expectBox(dialog, moved)
  await page.mouse.move(900, 600)
  await expectBox(dialog, moved)
  await mouseDelta(page, dialog.locator("#dialog-movable-header-action"), 24, 24)
  await expectBox(dialog, moved)
  await mouseDelta(page, dialog.locator('[data-slot="dialog-title"]'), 24, 24)
  await expectBox(dialog, moved)
  expect(await dialog.locator('[data-slot="dialog-header"]').evaluate((node) => getComputedStyle(node).cursor)).toBe("move")
  expect(await dialog.locator('[data-slot="dialog-title"]').evaluate((node) => getComputedStyle(node).cursor)).toBe("auto")
})

test("dialog: UI5 mouse dragging may leave the viewport; reopening re-centers", async ({ page }) => {
  const dialog = await openMovable(page)
  const initial = (await dialog.boundingBox())!
  // Dialog.js _onDragMouseMove is unclamped; _dragWithEvent clamps keyboard movement instead.
  await mouseDelta(page, dialog.locator('[data-slot="dialog-header"]'), -initial.x - 32, 32)
  await expectBox(dialog, { x: -32, y: initial.y + 32 })
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  const reopened = await openMovable(page)
  await expectBox(reopened, initial)
})

test("dialog: mouse resizing grows, clamps at UI5 minimum and viewport, and restores on reopen", async ({ page }) => {
  const dialog = await openMovable(page)
  const initial = (await dialog.boundingBox())!
  const handle = dialog.locator('[data-slot="dialog-resize-handle"]')
  await expect(handle.locator('[data-slot="icon"]')).toHaveAttribute("data-icon", "resize-corner")
  await expect(handle).toHaveAttribute("title", "Drag handle to resize (shift+arrow)")
  await mouseDelta(page, handle, 64, 48)
  await expectBox(dialog, { ...initial, width: initial.width + 64, height: initial.height + 48 })
  const minimum = await dialog.evaluate((node) => ({
    width: Number.parseFloat(getComputedStyle(node).minWidth),
    height: Number.parseInt(getComputedStyle(node.querySelector('[data-slot="dialog-body"]')!).minHeight)
      + (node.querySelector('[data-slot="dialog-header"]') as HTMLElement).offsetHeight
      + (node.querySelector('[data-slot="dialog-footer"]') as HTMLElement).offsetHeight,
  }))
  await mouseDelta(page, handle, -2000, -2000)
  await expectBox(dialog, { ...initial, ...minimum })
  await mouseDelta(page, handle, 2000, 2000)
  await expect.poll(async () => {
    const box = (await dialog.boundingBox())!, vp = page.viewportSize()!
    return box.x + box.width <= vp.width && box.y + box.height <= vp.height
  }).toBe(true)
  const maximized = (await dialog.boundingBox())!
  await page.mouse.move(0, 0)
  await expectBox(dialog, maximized)
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expectBox(await openMovable(page), initial)
})

test("dialog: keyboard handle follows UI5 tab order, descriptions and 16px physical arrow steps", async ({ page }) => {
  const dialog = await openMovable(page)
  const first = dialog.locator("#dialog-movable-header-action")
  await expect(first).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  const handle = dialog.getByRole("img", { name: "Drag and Resize Dialog" })
  await expect(handle).toBeFocused()
  await expect(handle).toHaveAttribute("aria-roledescription", "Handle")
  const descriptions = await dialog.evaluate((node) => node.getAttribute("aria-describedby")!.split(" ").map((id) => document.getElementById(id)!.textContent))
  expect(descriptions).toContain("Tab to the end of dialog to reach drag and resize handle.")
  expect(descriptions).toContain("Drag the header or the corner. Tab to the last handle to move with arrows and resize with Shift+arrows.")
  expect(await handle.evaluate((node) => document.getElementById(node.getAttribute("aria-describedby")!)!.textContent)).toBe("Use arrow keys to move, Shift+arrow keys to resize")
  const ring = await dialog.locator(".fiori-popup__root").evaluate((node) => ({ style: getComputedStyle(node, "::before").borderTopStyle, radius: getComputedStyle(node, "::before").borderEndEndRadius }))
  expect(ring.style).not.toBe("none")
  expect(ring.radius).toBe("28px")
  let box = (await dialog.boundingBox())!
  for (const [key, field, delta] of [["ArrowRight", "x", 16], ["ArrowDown", "y", 16], ["ArrowLeft", "x", -16], ["ArrowUp", "y", -16]] as const) {
    await page.keyboard.press(key)
    box = { ...box, [field]: box[field] + delta }
    await expectBox(dialog, box)
    await expect(handle).toBeFocused()
  }
  for (const [key, field, delta] of [["Shift+ArrowRight", "width", 16], ["Shift+ArrowDown", "height", 16], ["Shift+ArrowLeft", "width", -16], ["Shift+ArrowUp", "height", -16]] as const) {
    await page.keyboard.press(key)
    box = { ...box, [field]: box[field] + delta }
    await expectBox(dialog, box)
  }
  await page.keyboard.press("Control+ArrowRight")
  await expectBox(dialog, box)
  await page.keyboard.press("Tab")
  await expect(first).toBeFocused()
})

test("dialog: keyboard move clamps both viewport edges; window resize re-centers", async ({ page }) => {
  const dialog = await openMovable(page)
  const handle = dialog.locator('[data-slot="dialog-movement-handle"]')
  await handle.focus()
  await expect(handle).toBeFocused()
  const initial = (await dialog.boundingBox())!, vp = page.viewportSize()!
  for (let i = 0; i < 90; i++) {
    await handle.press("ArrowLeft")
    await expectBox(dialog, { x: Math.max(0, initial.x - (i + 1) * 16) })
    await expect(handle).toBeFocused()
  }
  await expectBox(dialog, { x: 0 })
  for (let i = 0; i < 90; i++) {
    await handle.press("ArrowDown")
    await expectBox(dialog, { y: Math.min(vp.height - initial.height, initial.y + (i + 1) * 16) })
    await expect(handle).toBeFocused()
  }
  const box = (await dialog.boundingBox())!
  await expectBox(dialog, { y: vp.height - box.height })
  await page.setViewportSize({ width: 1000, height: 700 })
  await expect.poll(async () => {
    const resized = (await dialog.boundingBox())!
    return [Math.round(resized.x + resized.width / 2), Math.round(resized.y + resized.height / 2)]
  }).toEqual([500, 350])
})

test("dialog: RTL corner resizing anchors the right edge; keyboard arrows keep physical directions", async ({ page }) => {
  const dialog = await openMovable(page, true)
  const box = (await dialog.boundingBox())!, handle = dialog.locator('[data-slot="dialog-resize-handle"]')
  expect(await page.locator("#dialog-demo > [dir=rtl]").getAttribute("dir")).toBe("rtl")
  const corner = (await handle.boundingBox())!
  expect(corner.x).toBe(box.x - 8)
  expect(await handle.locator("svg").evaluate((node) => getComputedStyle(node).scale)).toBe("-1 1")
  await mouseDelta(page, handle, -64, 32)
  await expectBox(dialog, { x: box.x - 64, y: box.y, width: box.width + 64, height: box.height + 32 })
  const keyboardHandle = dialog.locator('[data-slot="dialog-movement-handle"]')
  await keyboardHandle.focus()
  await expect(keyboardHandle).toBeFocused()
  await keyboardHandle.press("Shift+ArrowLeft")
  await expectBox(dialog, { x: box.x - 64, width: box.width + 48 })
  await keyboardHandle.press("ArrowRight")
  await expectBox(dialog, { x: box.x - 48 })
})

test("dialog: UI5 disables movement handles on touch phones; narrow desktop still moves", async ({ browser, page }) => {
  // UI5 Device.isDesktop checks touch/device capability; a touch context at phone width reproduces it.
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
  const mobilePage = await phone.newPage()
  await mobilePage.goto(page.url())
  await mobilePage.waitForSelector("html[data-ready=true]")
  await mobilePage.locator("#dialog-demo #dialog-movable-open").click()
  const dialog = mobilePage.locator("#dialog-movable-content")
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('[data-slot="dialog-resize-handle"], [data-slot="dialog-movement-handle"]')).toHaveCount(0)
  const initial = (await dialog.boundingBox())!
  await mouseDelta(mobilePage, dialog.locator('[data-slot="dialog-header"]'), 16, 16)
  await expectBox(dialog, initial)
  await phone.close()
  await page.setViewportSize({ width: 390, height: 844 })
  const desktop = await openMovable(page)
  const box = (await desktop.boundingBox())!
  const centered = { x: Math.round((390 - box.width) / 2), y: Math.round((844 - box.height) / 2) }
  await expectBox(desktop, centered)
  await mouseDelta(page, desktop.locator('[data-slot="dialog-header"]'), 16, 16)
  // _onDragMouseMove floors each resulting position.
  await expectBox(desktop, { x: Math.floor(centered.x + 16), y: Math.floor(centered.y + 16) })
  await page.keyboard.press("Escape")
  await expect(desktop).toHaveCount(0)
  await expectBox(await openMovable(page), centered)
})
