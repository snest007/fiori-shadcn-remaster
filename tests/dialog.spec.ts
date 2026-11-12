import { expect, test, type Locator, type Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/dialog`)
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

async function expectCentered(page: Page, dialog: Locator) {
  await expect.poll(async () => {
    const box = (await dialog.boundingBox())!, viewport = page.viewportSize()!
    return [box.x, box.y]
  }).toEqual(await dialog.evaluate(node => [Math.round((innerWidth - (node as HTMLElement).offsetWidth) / 2), Math.round((innerHeight - (node as HTMLElement).offsetHeight) / 2)]))
}

async function openAutoSize(page: Page) {
  await page.locator("#dialog-demo #dialog-auto-open").click()
  const dialog = page.locator("#dialog-auto-content")
  await expect(dialog).toBeVisible()
  await expectCentered(page, dialog)
  return dialog
}

// Wait for a real surface ResizeObserver notification and UI5 ResizeHandler's animation-frame
// phase, so a position-preservation assertion cannot pass before a queued re-center runs.
async function settleSurfaceSize(dialog: Locator) {
  await dialog.evaluate(node => new Promise<void>(resolve => {
    const observer = new ResizeObserver(() => requestAnimationFrame(() => requestAnimationFrame(() => {
      observer.disconnect()
      resolve()
    })))
    observer.observe(node)
  }))
}

type NativeDialogProbe = HTMLElement & {
  open: boolean
  _draggedOrResized: boolean
  _resizeHandler: () => void
}

async function openNativeAutoSize(page: Page) {
  const nativePage = await page.context().newPage()
  await nativePage.goto(new URL("/ui5.html?only=dialog", page.url()).href)
  await nativePage.waitForSelector("html[data-ready=true]")
  await nativePage.evaluate(() => {
    const style = document.createElement("style")
    style.textContent = "#dialog-native-auto { width:24rem; }"
    document.head.append(style)
    const dialog = document.createElement("ui5-dialog") as NativeDialogProbe
    dialog.id = "dialog-native-auto"
    Object.assign(dialog, { headerText: "Native content-sized dialog", draggable: true, resizable: true })
    const content = document.createElement("div")
    content.id = "dialog-native-growth"
    content.style.height = "40px"
    content.textContent = "Product information"
    dialog.append(content)
    // Popup.js binds _resizeHandler in its constructor. Count the real installed handler
    // before opening, without replacing Dialog._resize or its _draggedOrResized behavior.
    const resize = dialog._resizeHandler
    dialog.dataset.resizeCount = "0"
    dialog._resizeHandler = () => {
      resize()
      dialog.dataset.resizeCount = String(Number(dialog.dataset.resizeCount) + 1)
    }
    document.body.append(dialog)
    dialog.open = true
  })
  const dialog = nativePage.locator("#dialog-native-auto")
  await expect(dialog).toBeVisible()
  await expect.poll(() => dialog.getAttribute("data-resize-count")).not.toBe("0")
  await expectCentered(nativePage, dialog)
  return { page: nativePage, dialog }
}

async function growNative(dialog: Locator, height: number) {
  const count = Number(await dialog.getAttribute("data-resize-count"))
  await dialog.locator("#dialog-native-growth").evaluate((node, next) => { node.style.height = `${next}px` }, height)
  await expect.poll(async () => Number(await dialog.getAttribute("data-resize-count"))).toBeGreaterThan(count)
}

test("dialog: touch Windows capability matches installed UI5 for NT 6.2, 6.3, 8.0 and 10.0", async ({ browser, page }) => {
  for (const [version, enabled] of [["6.2", false], ["6.3", false], ["8.0", true], ["10.0", true]] as const) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, hasTouch: true,
      userAgent: `Mozilla/5.0 (Windows NT ${version}; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36` })
    try {
      await context.addInitScript(() => Object.defineProperty(navigator, "platform", { get: () => "Win32" }))
      const devicePage = await context.newPage()
      await devicePage.goto(new URL("/ui5.html?only=dialog-draggable", page.url()).href)
      await devicePage.waitForSelector("html[data-ready=true]")
      const native = await devicePage.locator("ui5-dialog[draggable]").first().evaluate(node => {
        const dialog = node as HTMLElement & { onDesktop: boolean; _movable: boolean }
        return { desktop: dialog.onDesktop, movable: dialog._movable, handle: !!dialog.shadowRoot!.querySelector(".ui5-popup-drag-resize-handler") }
      })
      expect(native).toEqual({ desktop: enabled, movable: enabled, handle: enabled })
      await devicePage.goto(page.url())
      await devicePage.waitForSelector("html[data-ready=true]")
      await devicePage.locator("#dialog-demo #dialog-movable-open").click()
      const dialog = devicePage.locator("#dialog-movable-content")
      await expect(dialog).toBeVisible()
      await expect(dialog.locator('[data-slot="dialog-movement-handle"], [data-slot="dialog-resize-handle"]')).toHaveCount(native.movable ? 2 : 0)
      const initial = (await dialog.boundingBox())!
      await mouseDelta(devicePage, dialog.locator('[data-slot="dialog-header"]'), 16, 16)
      await expectBox(dialog, { ...initial, x: initial.x + (native.movable ? 16 : 0), y: initial.y + (native.movable ? 16 : 0) })
    } finally { await context.close() }
  }
})

for (const keyboardMove of [false, true]) {
  test(`dialog: auto size re-centers after content growth and shrink${keyboardMove ? " even after keyboard movement" : ""}, as UI5`, async ({ page }) => {
    const dialog = await openAutoSize(page)
    const native = await openNativeAutoSize(page)
    try {
      if (keyboardMove) {
        for (const [surface, selector] of [[dialog, '[data-slot="dialog-movement-handle"]'], [native.dialog, ".ui5-popup-drag-resize-handler"]] as const) {
          const initial = (await surface.boundingBox())!, handle = surface.locator(selector)
          await handle.focus(); await expect(handle).toBeFocused(); await handle.press("ArrowDown")
          await expectBox(surface, { y: initial.y + 16 })
        }
      }
      const initial = (await dialog.boundingBox())!
      await growNative(native.dialog, 200)
      await expectCentered(native.page, native.dialog)
      expect(await native.dialog.evaluate(node => (node as NativeDialogProbe)._draggedOrResized)).toBe(false)
      await dialog.locator("#dialog-auto-toggle").click()
      await expect.poll(async () => (await dialog.boundingBox())!.height).toBeGreaterThan(initial.height)
      await expectCentered(page, dialog)
      await growNative(native.dialog, 40)
      await expectCentered(native.page, native.dialog)
      await dialog.locator("#dialog-auto-toggle").click()
      await expectBox(dialog, { height: initial.height })
      await expectCentered(page, dialog)
    } finally { await native.page.close() }
  })
}

test("dialog: pointer dragging freezes auto size and suppresses surface-size re-centering, as UI5", async ({ page }) => {
  const dialog = await openAutoSize(page), native = await openNativeAutoSize(page)
  try {
    for (const [surface, header] of [[dialog, '[data-slot="dialog-header"]'], [native.dialog, ".ui5-popup-header-root"]] as const) {
      const initial = (await surface.boundingBox())!
      await mouseDelta(surface.page(), surface.locator(header), 32, 32)
      await expectBox(surface, { ...initial, x: initial.x + 32, y: initial.y + 32 })
      await surface.evaluate(node => { node.style.maxHeight = "96px" })
      await settleSurfaceSize(surface)
      await expectBox(surface, { x: initial.x + 32, y: initial.y + 32, height: 96 })
    }
    expect(await native.dialog.evaluate(node => (node as NativeDialogProbe)._draggedOrResized)).toBe(true)
    await dialog.locator("#dialog-auto-close").click()
    await expect(dialog).toHaveCount(0)
    const reopened = await openAutoSize(page), initial = (await reopened.boundingBox())!
    await reopened.locator("#dialog-auto-toggle").click()
    await settleSurfaceSize(reopened)
    await expectBox(reopened, initial)
  } finally { await native.page.close() }
})

for (const pointer of [false, true]) {
  test(`dialog: ${pointer ? "pointer" : "keyboard"} resize flag survives reopen while auto dimensions are restored, as UI5`, async ({ page }) => {
    const dialog = await openAutoSize(page), native = await openNativeAutoSize(page)
    try {
      for (const [surface, keyHandle, mouseHandle] of [[dialog, '[data-slot="dialog-movement-handle"]', '[data-slot="dialog-resize-handle"]'], [native.dialog, ".ui5-popup-drag-resize-handler", ".ui5-popup-resize-handle"]] as const) {
        const initial = (await surface.boundingBox())!
        if (pointer) await mouseDelta(surface.page(), surface.locator(mouseHandle), 32, 32)
        else { const handle = surface.locator(keyHandle); await handle.focus(); await expect(handle).toBeFocused(); await handle.press("Shift+ArrowDown") }
        await expectBox(surface, { x: initial.x, y: initial.y, height: initial.height + (pointer ? 32 : 16) })
        await surface.evaluate(node => { node.style.maxHeight = "96px" })
        await settleSurfaceSize(surface)
        await expectBox(surface, { x: initial.x, y: initial.y, height: 96 })
      }
      await native.dialog.evaluate(node => { (node as NativeDialogProbe).open = false })
      await expect(native.dialog).not.toBeVisible()
      await native.dialog.evaluate(node => { node.style.maxHeight = ""; (node as NativeDialogProbe).open = true })
      await expect(native.dialog).toBeVisible(); await expectCentered(native.page, native.dialog)
      expect(await native.dialog.evaluate(node => (node as NativeDialogProbe)._draggedOrResized)).toBe(true)
      const nativeInitial = (await native.dialog.boundingBox())!
      await growNative(native.dialog, 200)
      await expectBox(native.dialog, { x: nativeInitial.x, y: nativeInitial.y })
      await dialog.locator("#dialog-auto-close").click()
      await expect(dialog).toHaveCount(0)
      const reopened = await openAutoSize(page), initial = (await reopened.boundingBox())!
      await reopened.locator("#dialog-auto-toggle").click()
      await expect.poll(async () => (await reopened.boundingBox())!.height).toBeGreaterThan(initial.height)
      await settleSurfaceSize(reopened)
      await expectBox(reopened, { x: initial.x, y: initial.y })
    } finally { await native.page.close() }
  })
}

test("dialog: custom movement texts replace the handle, descriptions, role and resize tooltip", async ({ page }) => {
  const dialog = await openAutoSize(page), handle = dialog.getByRole("img", { name: "Move or resize window" })
  await expect(handle).toHaveAttribute("aria-roledescription", "Window control")
  await expect(dialog.locator('[data-slot="dialog-resize-handle"]')).toHaveAttribute("title", "Resize this window")
  expect(await handle.evaluate(node => document.getElementById(node.getAttribute("aria-describedby")!)!.textContent)).toBe("Move with arrows; resize with Shift and arrows.")
  const descriptions = await dialog.evaluate(node => node.getAttribute("aria-describedby")!.split(" ").map(id => document.getElementById(id)!.textContent))
  expect(descriptions).toContain("The final control moves and resizes this window.")
  expect(descriptions).toContain("Change the content to see when the dialog re-centers.")
})

test("dialog: Ctrl, Alt and Meta arrows do not move or resize, including Shift combinations, as UI5", async ({ page }) => {
  const dialog = await openMovable(page), native = await openNativeAutoSize(page)
  try {
    for (const [surface, selector] of [[dialog, '[data-slot="dialog-movement-handle"]'], [native.dialog, ".ui5-popup-drag-resize-handler"]] as const) {
      const initial = (await surface.boundingBox())!, handle = surface.locator(selector)
      await handle.focus(); await expect(handle).toBeFocused()
      for (const key of ["Control+ArrowDown", "Alt+ArrowDown", "Meta+ArrowDown", "Control+Shift+ArrowRight", "Alt+Shift+ArrowRight", "Meta+Shift+ArrowRight"]) {
        await handle.press(key)
        await expectBox(surface, initial)
        await expect(handle).toBeFocused()
      }
    }
    expect(await native.dialog.evaluate(node => (node as NativeDialogProbe)._draggedOrResized)).toBe(false)
  } finally { await native.page.close() }
})

test("dialog: the surface size observer disconnects on close and is renewed on reopen", async ({ page }) => {
  await page.addInitScript(() => {
    const records: { targets: Element[]; disconnected: boolean }[] = []
    ;(window as typeof window & { dialogResizeRecords: typeof records }).dialogResizeRecords = records
    const NativeObserver = window.ResizeObserver
    window.ResizeObserver = class extends NativeObserver {
      constructor(callback: ResizeObserverCallback) {
        super(callback)
        const record = { targets: [] as Element[], disconnected: false }
        records.push(record)
        const observe = this.observe.bind(this), disconnect = this.disconnect.bind(this)
        this.observe = (target, options) => { record.targets.push(target); observe(target, options) }
        this.disconnect = () => { record.disconnected = true; disconnect() }
      }
    }
  })
  await page.reload(); await page.waitForSelector("html[data-ready=true]")
  const counts = () => page.evaluate(() => {
    const records = (window as typeof window & { dialogResizeRecords: { targets: Element[]; disconnected: boolean }[] }).dialogResizeRecords
      .filter(record => record.targets.some(target => target.id === "dialog-auto-content"))
    return { total: records.length, active: records.filter(record => !record.disconnected).length }
  })
  const dialog = await openAutoSize(page)
  await expect.poll(counts).toEqual({ total: 1, active: 1 })
  await dialog.locator("#dialog-auto-close").click(); await expect(dialog).toHaveCount(0)
  await expect.poll(counts).toEqual({ total: 1, active: 0 })
  await openAutoSize(page)
  await expect.poll(counts).toEqual({ total: 2, active: 1 })
})
