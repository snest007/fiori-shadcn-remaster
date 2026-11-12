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
    const scale = root.locator(`.fiori-color-picker__slider--${kind} .fiori-color-picker__scale-inner`)
    await scale.scrollIntoViewIfNeeded()
    const rect = (await scale.boundingBox())!
    const target = kind === "hue" ? hue(root) : alpha(root)
    await page.mouse.move(rect.x + rect.width * .25, rect.y); await page.mouse.down(); await page.mouse.move(rect.x + rect.width * (kind === "hue" ? .5 : .75), rect.y); await page.mouse.up()
    await expect(target).toHaveAttribute("aria-valuenow", value)
  }
  await expect(output(page)).toHaveText("rgba(64, 191, 191, 0.75)")
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

test("color-picker: canceled dialog retains invalid Hex and HSL mode until runtime selection changes", async ({ page }) => {
  const root = palette(page), more = root.getByRole("button", { name: "More Colors...", exact: true })
  await more.click(); await dialog(page).getByRole("button", { name: "Change Color Mode" }).click()
  await commit(dialog(page), "Hexadecimal", "nothex")
  await dialog(page).getByRole("button", { name: "Cancel", exact: true }).click()
  await more.click(); await expect(dialog(page).getByRole("textbox", { name: "Hexadecimal" })).toHaveValue("nothex")
  await expect(dialog(page).getByRole("textbox", { name: "Saturation", exact: true })).toBeDisabled()
  await dialog(page).getByRole("button", { name: "Cancel", exact: true }).click()
  await root.locator('[data-color-palette-area="main"]').first().click()
  await more.click(); await expect(dialog(page).getByRole("textbox", { name: "Hexadecimal" })).toHaveValue("ff0000")
  await expect(dialog(page).getByRole("textbox", { name: "Saturation", exact: true })).toBeEnabled()
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
