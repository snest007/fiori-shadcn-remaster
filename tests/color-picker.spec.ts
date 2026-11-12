import { expect, test, type Locator, type Page } from "@playwright/test"

const picker = (page: Page) => page.locator("#color-picker-demo #color-picker-control")
const output = (page: Page) => page.locator("#color-picker-demo #color-picker-value")
const dialog = (page: Page) => page.locator('[data-slot="color-palette-dialog"]')
const palette = (page: Page, suffix = "") => page.locator(`#color-picker-demo #color-picker-palette${suffix}`)
const events = (page: Page) => page.locator("#color-picker-demo #color-picker-palette-events")
const hue = (root: Locator) => root.getByRole("slider", { name: "Hue Slider Slider handle", exact: true })
const alpha = (root: Locator) => root.getByRole("slider", { name: "Alpha Slider Slider handle", exact: true })
async function commit(root: Locator, name: string, value: string) { const input = root.getByRole("textbox", { name, exact: true }); await input.fill(value); await input.press("Enter") }
async function pressValue(page: Page, key: string, slider: Locator, value: string) { await page.keyboard.press(key); await expect(slider).toHaveAttribute("aria-valuenow", value) }

test.beforeEach(async ({ page }) => { await page.goto("/index.html"); await page.waitForSelector("html[data-ready=true]") })

test("color-picker: HSL area and both slider drags change the controlled value", async ({ page }) => {
  const root = picker(page), area = root.locator(".fiori-color-picker__main")
  await area.scrollIntoViewIfNeeded()
  const box = (await area.boundingBox())!
  await page.mouse.move(box.x + box.width * .2, box.y + box.height * .2); await page.mouse.down(); await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5); await page.mouse.up()
  await expect(output(page)).toHaveText("rgba(64, 128, 191, 0.5)")
  await expect(area).toHaveAttribute("role", "presentation"); await expect(area).not.toHaveAttribute("tabindex")
  for (const [kind, value] of [["hue", "180"], ["alpha", "0.75"]] as const) {
    const scale = root.locator(`[data-slot="color-picker-${kind}-slider"]`)
    await scale.scrollIntoViewIfNeeded()
    const rect = (await scale.boundingBox())!
    const target = kind === "hue" ? hue(root) : alpha(root)
    await page.mouse.move(rect.x + rect.width * .25, rect.y + rect.height / 2); await page.mouse.down(); await page.mouse.move(rect.x + rect.width * (kind === "hue" ? .5 : .75), rect.y + rect.height / 2); await page.mouse.up()
    await expect(target).toHaveAttribute("aria-valuenow", value)
  }
  await expect(output(page)).toHaveText("rgba(64, 191, 191, 0.75)")
})

test("color-picker: full-host pointer values and first-focus Escape match native hue and alpha", async ({ page, context }, testInfo) => {
  const native = await context.newPage()
  const proof: { kind: string; action: string; ours: string; native: string }[] = []
  try {
    await native.goto("/ui5.html?only=color-picker-alpha"); await native.waitForSelector("html[data-ready=true]")
    const root = picker(page)
    // Keep endpoint/outside coordinates integral and over an ordinary parent, not documentElement:
    // native SliderBase's window mouseout handler ends a drag when relatedTarget is documentElement.
    await root.evaluate((element) => { const x = element.getBoundingClientRect().x; element.style.marginLeft = `${Math.ceil(x) + 64 - x}px` })
    await native.evaluate(() => {
      const element = document.querySelector<HTMLElement>('[data-fixture="color-picker-alpha"] ui5-color-picker')!
      element.id = "color-picker-pointer-native"
      const frame = document.createElement("div"); frame.style.cssText = "padding:64px;min-height:900px;box-sizing:border-box"
      frame.append(element); document.body.style.margin = "0"; document.body.replaceChildren(frame)
    })
    const nativeRoot = native.locator("#color-picker-pointer-native")
    for (const kind of ["hue", "alpha"] as const) {
      const initial = kind === "hue" ? "210" : "0.25", maximum = kind === "hue" ? "360" : "1"
      if (kind === "alpha") {
        // Commit via the channel so neither alpha slider has owned focus before its first pointer interaction.
        await commit(root, "Alpha", initial)
        const input = nativeRoot.locator("ui5-input#alpha input")
        await input.fill(initial); await input.press("Enter"); await expect(input).toHaveValue(initial)
      }
      const oursHost = root.locator(`[data-slot="color-picker-${kind}-slider"]`)
      const nativeHost = nativeRoot.locator(`.ui5-color-picker-${kind}-slider`)
      const oursHandle = kind === "hue" ? hue(root) : alpha(root), nativeHandle = nativeHost.locator('[role="slider"]')
      const assertBoth = async (action: string, expected: string) => {
        await expect(oursHandle).toHaveAttribute("aria-valuenow", expected); await expect(nativeHandle).toHaveAttribute("aria-valuenow", expected)
        proof.push({ kind, action, ours: (await oursHandle.getAttribute("aria-valuenow"))!, native: (await nativeHandle.getAttribute("aria-valuenow"))! })
      }
      await assertBoth("before first pointer focus", initial)
      for (const [surface, host] of [[page, oursHost], [native, nativeHost]] as const) {
        await host.scrollIntoViewIfNeeded(); const box = (await host.boundingBox())!
        await surface.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
      }
      await assertBoth("host midpoint", kind === "hue" ? "180" : "0.5")
      await expect(oursHandle).toBeFocused(); await expect(nativeHandle).toBeFocused()
      await page.keyboard.press("Escape"); await native.keyboard.press("Escape")
      await assertBoth("Escape restores pointer-entry value", initial)
      for (const [action, fraction, expected] of [["left endpoint", 0, "0"], ["right endpoint", 1, maximum], ["clamp below host", -.1, "0"], ["clamp above host", 1.1, maximum]] as const) {
        for (const [surface, host] of [[page, oursHost], [native, nativeHost]] as const) {
          const box = (await host.boundingBox())!, y = box.y + box.height / 2
          await surface.mouse.move(box.x + box.width * .25, y); await surface.mouse.down()
          await surface.mouse.move(box.x + box.width * fraction, y); await surface.mouse.up()
        }
        await assertBoth(action, expected)
      }
    }
    await testInfo.attach("c2-pointer-differential.json", { body: JSON.stringify(proof, null, 2), contentType: "application/json" })
  } finally { await native.close() }
})

test("color-picker: slider keyboard matches UI5 steps, modifiers, bounds and Escape", async ({ page }) => {
  const root = picker(page), h = hue(root), a = alpha(root)
  await h.focus(); await expect(h).toBeFocused()
  await pressValue(page, "ArrowRight", h, "211"); await pressValue(page, "Control+ArrowRight", h, "247")
  await pressValue(page, "Meta+ArrowLeft", h, "211"); await pressValue(page, "PageUp", h, "247")
  await pressValue(page, "Shift+Equal", h, "248"); await pressValue(page, "-", h, "247")
  for (const key of ["Shift+ArrowRight", "Alt+ArrowRight", "F2"]) await pressValue(page, key, h, "247")
  await pressValue(page, "End", h, "360"); await pressValue(page, "Home", h, "0"); await pressValue(page, "Escape", h, "210")
  await a.focus(); await expect(a).toBeFocused()
  await pressValue(page, "ArrowUp", a, "0.51"); await pressValue(page, "PageDown", a, "0.41")
  await pressValue(page, "Control+ArrowUp", a, "0.51"); await pressValue(page, "End", a, "1"); await pressValue(page, "Home", a, "0"); await pressValue(page, "Escape", a, "0.5")
})

test("color-picker: hex and RGB/HSL channels round-trip and normalize", async ({ page }) => {
  const root = picker(page)
  await commit(root, "Hexadecimal", "#f80"); await expect(root.getByRole("textbox", { name: "Hexadecimal" })).toHaveValue("ff8800")
  await expect(output(page)).toHaveText("rgba(255, 136, 0, 0.5)")
  await commit(root, "Red", "-5"); await expect(root.getByRole("textbox", { name: "Red", exact: true })).toHaveValue("0")
  await commit(root, "Green", "300"); await expect(root.getByRole("textbox", { name: "Green", exact: true })).toHaveValue("255")
  await commit(root, "Blue", "17.9"); await expect(root.getByRole("textbox", { name: "Blue", exact: true })).toHaveValue("17")
  await root.getByRole("button", { name: "Change Color Mode" }).click()
  await expect(root.getByRole("textbox", { name: "Saturation", exact: true })).toBeVisible()
  await commit(root, "Hue", "400"); await expect(root.getByRole("textbox", { name: "Hue", exact: true })).toHaveValue("360")
  await commit(root, "Saturation", "200"); await expect(root.getByRole("textbox", { name: "Saturation", exact: true })).toHaveValue("100")
  await commit(root, "Light", "50"); await expect(output(page)).toHaveText("rgba(255, 0, 0, 0.5)")
  await expect(root.getByRole("status")).toContainText("Color mode changed to HSL")
})

test("color-picker: alpha emits live values and normalizes on commit", async ({ page }) => {
  const root = picker(page), input = root.getByRole("textbox", { name: "Alpha", exact: true })
  await input.fill("0.37"); await expect(output(page)).toHaveText("rgba(51, 102, 153, 0.37)")
  await input.press("Tab"); await expect(input).toHaveValue("0.37")
  await input.fill("3"); await expect(output(page)).toHaveText("rgba(51, 102, 153, 3)")
  await input.press("Enter"); await expect(output(page)).toHaveText("rgba(51, 102, 153, 1)"); await expect(input).toHaveValue("1")
  await input.fill("-1"); await expect(output(page)).toHaveText("rgba(51, 102, 153, -1)")
  await input.press("Tab"); await expect(output(page)).toHaveText("rgba(51, 102, 153, 0)")
  await input.fill("bad"); await expect(output(page)).toHaveText("rgba(51, 102, 153, 1)")
  await input.press("Tab"); await expect(input).toHaveValue("1")
})

test("color-picker: invalid hex disables sliders/channels, area recovers, simplified keeps Hex", async ({ page }) => {
  const root = picker(page), before = await output(page).textContent()
  await commit(root, "Hexadecimal", "NOTHEX")
  await expect(root.getByRole("textbox", { name: "Hexadecimal" })).toHaveValue("nothex")
  await expect(root.getByRole("textbox", { name: "Hexadecimal" })).toHaveAttribute("aria-invalid", "true")
  await expect(hue(root)).toHaveAttribute("aria-disabled", "true"); await expect(root.getByRole("textbox", { name: "Red", exact: true })).toBeDisabled()
  await expect(output(page)).toHaveText(before!)
  await commit(root, "Hexadecimal", "#GGGGGG"); await expect(root.getByRole("textbox", { name: "Hexadecimal" })).toHaveValue("#GGGGGG")
  // The focused negative Input's value-state surface covers the nearby mode button; Tab uses its native focus path.
  const toggle = root.getByRole("button", { name: "Change Color Mode" })
  await root.getByRole("textbox", { name: "Hexadecimal" }).press("Tab"); await expect(toggle).toBeFocused(); await toggle.press("Enter")
  await expect(root.getByRole("textbox", { name: "Hexadecimal" })).toHaveValue("gggggg")
  await root.locator(".fiori-color-picker__main").click({ position: { x: 128, y: 128 } })
  await expect(root.getByRole("textbox", { name: "Hexadecimal" })).not.toHaveAttribute("aria-invalid")
  await expect(hue(root)).not.toHaveAttribute("aria-disabled")
  const simplified = page.locator("#color-picker-demo #color-picker-simplified-control")
  await expect(simplified.getByRole("slider")).toHaveCount(1); await expect(simplified.getByRole("textbox")).toHaveCount(1)
  await expect(simplified.getByRole("textbox", { name: "Hexadecimal" })).toBeVisible()
})

test("color-picker: More Colors retains canceled draft, applies and focuses recent color", async ({ page }) => {
  const root = palette(page), more = root.getByRole("button", { name: "More Colors...", exact: true })
  await more.click(); await expect(dialog(page)).toBeVisible(); await expect(hue(dialog(page))).toBeFocused()
  // Declarative selected blue is not UI5's runtime selected-item hint: first opening still uses white.
  await expect(dialog(page).getByRole("textbox", { name: "Hexadecimal" })).toHaveValue("ffffff")
  await commit(dialog(page), "Hexadecimal", "123456")
  await dialog(page).getByRole("button", { name: "Cancel", exact: true }).click()
  await expect(dialog(page)).toHaveCount(0); await expect(more).toBeFocused(); await expect(events(page)).toHaveText("[]")
  await more.click(); await expect(dialog(page).getByRole("textbox", { name: "Hexadecimal" })).toHaveValue("123456")
  await dialog(page).getByRole("button", { name: "OK", exact: true }).click()
  await expect(dialog(page)).toHaveCount(0); await expect(events(page)).toHaveText('["rgba(18, 52, 86, 1)"]')
  const recent = root.locator('[data-color-palette-area="recent"]').first()
  await expect(recent).toBeFocused(); await expect(recent).toHaveAttribute("aria-pressed", "true")
  await more.click(); await expect(dialog(page).getByRole("textbox", { name: "Hexadecimal" })).toHaveValue("123456")
  await page.keyboard.press("Shift+Escape"); await expect(dialog(page)).toBeVisible()
  await page.keyboard.press("Escape"); await expect(dialog(page)).toHaveCount(0); await expect(more).toBeFocused()
})

test("color-picker: canceled dialog retains invalid Hex and HSL while runtime selection replaces only the color", async ({ page }) => {
  const root = palette(page), more = root.getByRole("button", { name: "More Colors...", exact: true })
  await more.click(); await dialog(page).getByRole("button", { name: "Change Color Mode" }).click()
  await commit(dialog(page), "Hexadecimal", "nothex")
  await dialog(page).getByRole("button", { name: "Cancel", exact: true }).click()
  await more.click(); await expect(dialog(page).getByRole("textbox", { name: "Hexadecimal" })).toHaveValue("nothex")
  await expect(dialog(page).getByRole("textbox", { name: "Saturation", exact: true })).toBeDisabled()
  await dialog(page).getByRole("button", { name: "Cancel", exact: true }).click()
  await root.locator('[data-color-palette-area="main"]').first().click()
  await more.click(); await expect(dialog(page).getByRole("textbox", { name: "Hexadecimal" })).toHaveValue("ff0000")
  await expect(dialog(page).getByRole("textbox", { name: "Hexadecimal" })).toHaveAttribute("aria-invalid", "true")
  await expect(dialog(page).getByRole("textbox", { name: "Saturation", exact: true })).toBeDisabled()
  await commit(dialog(page), "Hexadecimal", "00ff00"); await expect(dialog(page).getByRole("textbox", { name: "Saturation", exact: true })).toBeEnabled()
})

test("color-picker: canceled state survives outer popover lifetime and runtime replacement like native", async ({ page, context }, testInfo) => {
  const native = await context.newPage()
  const proof: { stage: string; ours: { hex: string; invalid: string | null; hsl: boolean; disabled: boolean }; native: { hex: string; invalid: string | null; hsl: boolean; disabled: boolean } }[] = []
  try {
    await native.goto("/ui5.html?only=color-picker-alpha"); await native.waitForSelector("html[data-ready=true]")
    await native.evaluate(async () => {
      await customElements.whenDefined("ui5-color-palette-popover")
      const frame = document.createElement("div"), opener = document.createElement("button")
      opener.id = "color-picker-lifetime-native-opener"; opener.textContent = "Open color palette"
      const popup = document.createElement("ui5-color-palette-popover") as HTMLElement & { showMoreColors: boolean; showRecentColors: boolean; opener: HTMLElement; open: boolean }
      popup.id = "color-picker-lifetime-native-popup"; popup.showMoreColors = true; popup.showRecentColors = true; popup.opener = opener
      for (const color of ["red", "blue"]) { const item = document.createElement("ui5-color-palette-item"); item.setAttribute("value", color); popup.append(item) }
      opener.onclick = () => { popup.open = !popup.open }
      frame.append(opener, popup); document.body.replaceChildren(frame)
    })
    const opener = page.locator("#color-picker-demo #color-picker-popover-opener"), popup = page.locator("#color-picker-palette-popover")
    const nativeOpener = native.locator("#color-picker-lifetime-native-opener"), nativePopup = native.locator("#color-picker-lifetime-native-popup")
    const nativePalette = nativePopup.locator("ui5-color-palette"), nativeDialog = nativePalette.locator("ui5-dialog"), nativePicker = nativeDialog.locator("ui5-color-picker")
    const more = () => popup.getByRole("button", { name: "More Colors...", exact: true }), nativeMore = nativePalette.locator(".ui5-cp-more-colors")
    const state = async (root: Locator) => ({
      hex: await root.getByRole("textbox", { name: "Hexadecimal", exact: true }).inputValue(),
      invalid: await root.getByRole("textbox", { name: "Hexadecimal", exact: true }).getAttribute("aria-invalid"),
      hsl: await root.getByRole("textbox", { name: "Saturation", exact: true }).count() === 1,
      disabled: await root.getByRole("textbox", { name: "Saturation", exact: true }).isDisabled(),
    })
    const assertBoth = async (stage: string, hex: string, invalid: boolean) => {
      for (const root of [dialog(page), nativePicker]) {
        const field = root.getByRole("textbox", { name: "Hexadecimal", exact: true }), saturation = root.getByRole("textbox", { name: "Saturation", exact: true })
        await expect(field).toHaveValue(hex)
        if (invalid) { await expect(field).toHaveAttribute("aria-invalid", "true"); await expect(saturation).toBeDisabled() }
        else { await expect(field).not.toHaveAttribute("aria-invalid"); await expect(saturation).toBeEnabled() }
      }
      const ours = await state(dialog(page)), reference = await state(nativePicker)
      expect(ours).toEqual(reference); proof.push({ stage, ours, native: reference })
    }
    const openMore = async () => { await more().click(); await nativeMore.click(); await expect(dialog(page)).toBeVisible(); await expect(nativeDialog).toBeVisible() }
    const cancelBoth = async () => {
      await dialog(page).getByRole("button", { name: "Cancel", exact: true }).click(); await nativeDialog.getByRole("button", { name: "Cancel", exact: true }).click()
      await expect(dialog(page)).toHaveCount(0); await expect(nativeDialog).not.toBeVisible(); await expect(more()).toBeFocused()
    }
    await opener.click(); await nativeOpener.click(); await expect(popup).toBeVisible(); await expect(nativePalette).toBeVisible(); await openMore()
    for (const retained of [nativePalette, nativeDialog, nativePicker]) await retained.evaluate((element) => element.setAttribute("data-c2-retained-instance", "true"))
    await dialog(page).getByRole("button", { name: "Change Color Mode", exact: true }).click(); await nativePicker.getByRole("button", { name: "Change Color Mode", exact: true }).click()
    await commit(dialog(page), "Hexadecimal", "nothex"); await commit(nativePicker, "Hexadecimal", "nothex")
    await assertBoth("invalid HSL before Cancel", "nothex", true); await cancelBoth()
    await opener.click(); await nativeOpener.click(); await expect(popup).toHaveCount(0); await expect(nativePalette).not.toBeVisible(); await expect(opener).toBeFocused()
    for (const retained of [nativePalette, nativeDialog, nativePicker]) await expect(retained).toHaveAttribute("data-c2-retained-instance", "true")
    await opener.click(); await nativeOpener.click(); await expect(popup).toBeVisible(); await expect(nativePalette).toBeVisible(); await openMore()
    for (const retained of [nativePalette, nativeDialog, nativePicker]) await expect(retained).toHaveAttribute("data-c2-retained-instance", "true")
    await assertBoth("outer close/reopen retains canceled state", "nothex", true); await cancelBoth()
    await popup.locator('[data-color-palette-area="main"]').first().click(); await nativePopup.locator("ui5-color-palette-item").first().getByRole("button").click()
    await expect(popup).toHaveCount(0); await expect(nativePalette).not.toBeVisible(); await expect(events(page)).toHaveText('["red"]')
    await opener.click(); await nativeOpener.click(); await expect(popup).toBeVisible(); await expect(nativePalette).toBeVisible(); await openMore()
    // Native onBeforeRendering replaces external RGB but retains its negative marker and HSL mode.
    await assertBoth("runtime selected red replaces only the color", "ff0000", true)
    await commit(dialog(page), "Hexadecimal", "ff0000"); await commit(nativePicker, "Hexadecimal", "ff0000")
    await assertBoth("valid red Hex clears the marker", "ff0000", false)
    await commit(dialog(page), "Hexadecimal", "nothex"); await commit(nativePicker, "Hexadecimal", "nothex")
    await assertBoth("invalid Hex with retained red RGB", "nothex", true); await cancelBoth()
    await popup.locator('[data-color-palette-area="main"]').first().click(); await nativePopup.locator("ui5-color-palette-item").first().getByRole("button").click()
    await expect(popup).toHaveCount(0); await expect(nativePalette).not.toBeVisible(); await expect(events(page)).toHaveText('["red","red"]')
    await opener.click(); await nativeOpener.click(); await expect(popup).toBeVisible(); await expect(nativePalette).toBeVisible(); await openMore()
    // CSS spelling changes from emitted rgba(...) to the selected "red", while native RGB equality preserves raw HEX.
    await assertBoth("same RGB runtime replacement retains invalid Hex", "nothex", true)
    await commit(dialog(page), "Hexadecimal", "00ff00"); await commit(nativePicker, "Hexadecimal", "00ff00")
    await assertBoth("valid Hex recovers the retained marker", "00ff00", false); await cancelBoth()
    await opener.click(); await nativeOpener.click(); await expect(popup).toHaveCount(0); await expect(nativePalette).not.toBeVisible()
    // Sibling inline palettes must remain independent of the popover's retained picker context.
    await palette(page, "-no-recents").getByRole("button", { name: "More Colors...", exact: true }).click()
    await expect(dialog(page).getByRole("textbox", { name: "Hexadecimal", exact: true })).toHaveValue("ffffff")
    await expect(dialog(page).getByRole("textbox", { name: "Red", exact: true })).toBeEnabled()
    await expect(dialog(page).getByRole("textbox", { name: "Saturation", exact: true })).toHaveCount(0)
    await dialog(page).getByRole("button", { name: "Cancel", exact: true }).click()
    await testInfo.attach("c2-outer-lifetime-differential.json", { body: JSON.stringify(proof, null, 2), contentType: "application/json" })
  } finally { await native.close() }
})

test("color-picker: More Colors navigation and applying without recents preserves existing selection", async ({ page }) => {
  const root = palette(page, "-no-recents"), more = root.getByRole("button", { name: "More Colors...", exact: true }), main = root.locator('[data-color-palette-area="main"]')
  await more.focus(); await expect(more).toBeFocused(); await page.keyboard.press("ArrowLeft"); await expect(main.last()).toBeFocused()
  await page.keyboard.press("ArrowRight"); await expect(more).toBeFocused()
  await more.click(); await commit(dialog(page), "Hexadecimal", "123456"); await dialog(page).getByRole("button", { name: "OK", exact: true }).click()
  await expect(dialog(page)).toHaveCount(0); await expect(main.last()).toHaveAttribute("aria-pressed", "true")
})

test("color-picker: popover keeps its shared layer while dialog opens, cancels and applies", async ({ page }) => {
  const opener = page.locator("#color-picker-demo #color-picker-popover-opener"), popup = page.locator("#color-picker-palette-popover")
  await opener.click(); await expect(popup).toBeVisible()
  await popup.getByRole("button", { name: "More Colors...", exact: true }).click(); await expect(dialog(page)).toBeVisible(); await expect(popup).toBeVisible()
  await dialog(page).getByRole("button", { name: "Cancel", exact: true }).click(); await expect(dialog(page)).toHaveCount(0); await expect(popup).toBeVisible()
  await popup.getByRole("button", { name: "More Colors...", exact: true }).click(); await commit(dialog(page), "Hexadecimal", "abcdef")
  await dialog(page).getByRole("button", { name: "OK", exact: true }).click(); await expect(dialog(page)).toHaveCount(0); await expect(popup).toHaveCount(0)
  await expect(events(page)).toHaveText('["rgba(171, 205, 239, 1)"]'); await expect(opener).toBeFocused()
  await opener.click(); await expect(popup.locator('[data-color-palette-area="recent"]').first()).toHaveAttribute("aria-pressed", "true")
  await page.keyboard.press("Escape"); await expect(popup).toHaveCount(0)
})
