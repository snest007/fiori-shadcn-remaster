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

test.beforeEach(async ({ page }) => { await page.goto("/index.html#/all"); await page.waitForSelector("html[data-ready=true]") })

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

test("color-picker: handle-column clicks above and below Hue match native without changing value", async ({ page, context }, testInfo) => {
  const native = await context.newPage()
  const proof: { surface: string; side: string; host: { x: number; y: number; width: number; height: number }; handle: { x: number; y: number; width: number; height: number }; x: number; y: number; value: string }[] = []
  try {
    await native.goto("/ui5.html?only=color-picker-alpha"); await native.waitForSelector("html[data-ready=true]")
    const nativeRoot = native.locator('[data-fixture="color-picker-alpha"] ui5-color-picker')
    for (const [surface, root, host, handle] of [
      [page, picker(page), picker(page).locator('[data-slot="color-picker-hue-slider"]'), hue(picker(page))],
      [native, nativeRoot, nativeRoot.locator(".ui5-color-picker-hue-slider"), nativeRoot.locator('.ui5-color-picker-hue-slider [role="slider"]')],
    ] as const) {
      await host.scrollIntoViewIfNeeded(); await expect(handle).toHaveAttribute("aria-valuenow", "210")
      for (const side of ["above", "below"] as const) {
        const box = (await host.boundingBox())!, grip = (await handle.boundingBox())!
        expect(box.width).toBe(258); expect(grip.width).toBe(17)
        const x = grip.x + grip.width / 2, y = side === "above" ? box.y + 1 : box.y + box.height - 1
        expect(x).toBeGreaterThan(grip.x); expect(x).toBeLessThan(grip.x + grip.width)
        if (side === "above") expect(y).toBeLessThan(grip.y)
        else expect(y).toBeGreaterThan(grip.y + grip.height)
        await surface.mouse.click(x, y)
        await expect(handle).toHaveAttribute("aria-valuenow", "210"); await expect(handle).toBeFocused()
        proof.push({ surface: surface === page ? "React" : "UI5", side, host: box, handle: grip, x, y, value: (await handle.getAttribute("aria-valuenow"))! })
      }
      await testInfo.attach(`c2-handle-column-${surface === page ? "react" : "native"}.png`, { body: await root.screenshot(), contentType: "image/png" })
    }
    await testInfo.attach("c2-handle-column-differential.json", { body: JSON.stringify(proof, null, 2), contentType: "application/json" })
  } finally { await native.close() }
})

test("color-picker: exact one-eighth Alpha host fraction uses native modulo snapping", async ({ page, context }, testInfo) => {
  const native = await context.newPage()
  const proof: { surface: string; width: number; fraction: number; value: string }[] = []
  try {
    await native.goto("/ui5.html?only=color-picker-alpha"); await native.waitForSelector("html[data-ready=true]")
    const nativeRoot = native.locator('[data-fixture="color-picker-alpha"] ui5-color-picker')
    for (const [surface, root, host, handle] of [
      [page, picker(page), picker(page).locator('[data-slot="color-picker-alpha-slider"]'), alpha(picker(page))],
      [native, nativeRoot, nativeRoot.locator(".ui5-color-picker-alpha-slider"), nativeRoot.locator('.ui5-color-picker-alpha-slider [role="slider"]')],
    ] as const) {
      // 16rem content plus the two 1px borders gives an exact 256px host at this root font size.
      // Align the host to integral coordinates so Chromium dispatches an exact 0.125 pointer fraction.
      await surface.evaluate(() => { document.documentElement.style.fontSize = "15.875px" })
      await host.scrollIntoViewIfNeeded()
      await host.evaluate((element) => { const x = element.getBoundingClientRect().x; element.style.transform = `translateX(${Math.ceil(x) - x}px)` })
      const box = (await host.boundingBox())!
      expect(box.width).toBe(256); expect(Number.isInteger(box.x), JSON.stringify({ surface: surface === page ? "React" : "UI5", box })).toBe(true)
      const x = box.x + box.width * .125
      expect((x - box.x) / box.width).toBe(.125)
      await surface.mouse.click(x, box.y + box.height / 2)
      await expect(handle).toHaveAttribute("aria-valuenow", "0.12")
      await expect(root.getByRole("textbox", { name: "Alpha", exact: true })).toHaveValue("0.12")
      proof.push({ surface: surface === page ? "React" : "UI5", width: box.width, fraction: (x - box.x) / box.width, value: (await handle.getAttribute("aria-valuenow"))! })
      await testInfo.attach(`c2-alpha-snapping-${surface === page ? "react" : "native"}.png`, { body: await root.screenshot(), contentType: "image/png" })
    }
    await testInfo.attach("c2-alpha-snapping-differential.json", { body: JSON.stringify(proof, null, 2), contentType: "application/json" })
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

// Chromium emits native change for Shift+Enter; other modifiers retain the draft until normal focusout.
for (const [key, commitsOnEnter] of [["Shift+Enter", true], ["Control+Enter", false], ["Alt+Enter", false], ["Meta+Enter", false], ["Control+Shift+Enter", false]] as const) {
  test(`color-picker: Hex native change matches ${key} for valid, invalid and recovered input`, async ({ page, context }, testInfo) => {
    const native = await context.newPage()
    const proof: { stage: string; surface: string; hex: string; rgba: string; invalid: string | null; hueDisabled: string | null; channelDisabled: boolean; focused: boolean; nativeChanges: number }[] = []
    try {
      await native.goto("/ui5.html?only=color-picker-alpha"); await native.waitForSelector("html[data-ready=true]")
      const nativeRoot = native.locator('[data-fixture="color-picker-alpha"] ui5-color-picker')
      const surfaces = [[page, picker(page), false], [native, nativeRoot, true]] as const
      for (const [, root] of surfaces) await root.getByRole("textbox", { name: "Hexadecimal", exact: true }).evaluate((input) => {
        input.setAttribute("data-c2-native-changes", "0")
        input.addEventListener("change", () => input.setAttribute("data-c2-native-changes", String(Number(input.getAttribute("data-c2-native-changes")) + 1)))
      })
      const assertBoth = async (stage: string, expectedHex: string, rgba: string, invalid: boolean, focused = true) => {
        for (const [surface, root, isNative] of surfaces) {
          const field = root.getByRole("textbox", { name: "Hexadecimal", exact: true }), red = root.getByRole("textbox", { name: "Red", exact: true })
          await expect(field).toHaveValue(expectedHex)
          if (focused) await expect(field).toBeFocused()
          else await expect(field).not.toBeFocused()
          if (isNative) await expect(root).toHaveJSProperty("value", rgba)
          else await expect(output(surface)).toHaveText(rgba)
          const message = root.locator(isNative ? ".ui5-color-picker-hex-input .ui5-valuestatemessage-popover" : ".fiori-color-picker__hex .fiori-value-state-message")
          if (invalid) {
            await expect(field).toHaveAttribute("aria-invalid", "true"); await expect(hue(root)).toHaveAttribute("aria-disabled", "true"); await expect(red).toBeDisabled()
            if (focused) { await expect(message).toBeVisible(); await expect(message).toContainText("Invalid entry") }
            else await expect(message).toBeHidden()
          } else {
            await expect(field).not.toHaveAttribute("aria-invalid"); await expect(hue(root)).not.toHaveAttribute("aria-disabled"); await expect(red).toBeEnabled(); await expect(message).toBeHidden()
          }
          proof.push({ stage, surface: isNative ? "UI5" : "React", hex: await field.inputValue(), rgba: isNative ? await root.evaluate((element) => (element as HTMLElement & { value: string }).value) : (await output(surface).textContent())!, invalid: await field.getAttribute("aria-invalid"), hueDisabled: await hue(root).getAttribute("aria-disabled"), channelDisabled: await red.isDisabled(), focused: await field.evaluate((element) => element.getRootNode() instanceof ShadowRoot ? (element.getRootNode() as ShadowRoot).activeElement === element : document.activeElement === element), nativeChanges: Number(await field.getAttribute("data-c2-native-changes")) })
        }
      }
      for (const [, root] of surfaces) { const field = root.getByRole("textbox", { name: "Hexadecimal", exact: true }); await field.fill("#123456"); await expect(field).toHaveValue("#123456"); await field.press(key) }
      await assertBoth("valid modified Enter", commitsOnEnter ? "123456" : "#123456", commitsOnEnter ? "rgba(18, 52, 86, 0.5)" : "rgba(51, 102, 153, 0.5)", false)
      for (const [, root] of surfaces) await root.getByRole("textbox", { name: "Hexadecimal", exact: true }).press(key)
      await assertBoth("unchanged repeated modified Enter", commitsOnEnter ? "123456" : "#123456", commitsOnEnter ? "rgba(18, 52, 86, 0.5)" : "rgba(51, 102, 153, 0.5)", false)
      for (const [, root] of surfaces) await root.getByRole("textbox", { name: "Hexadecimal", exact: true }).press("Tab")
      await assertBoth("normal blur confirms valid draft", "123456", "rgba(18, 52, 86, 0.5)", false, false)
      for (const [, root] of surfaces) { const field = root.getByRole("textbox", { name: "Hexadecimal", exact: true }); await field.fill("nothex"); await field.press(key) }
      await assertBoth("invalid modified Enter retains RGBA", "nothex", "rgba(18, 52, 86, 0.5)", commitsOnEnter)
      for (const [, root] of surfaces) await root.getByRole("textbox", { name: "Hexadecimal", exact: true }).press("Tab")
      await assertBoth("normal blur validates invalid draft", "nothex", "rgba(18, 52, 86, 0.5)", true, false)
      for (const [, root] of surfaces) { const field = root.getByRole("textbox", { name: "Hexadecimal", exact: true }); await field.fill("#F80"); await field.press(key) }
      await assertBoth("shorthand modified Enter", commitsOnEnter ? "ff8800" : "#F80", commitsOnEnter ? "rgba(255, 136, 0, 0.5)" : "rgba(18, 52, 86, 0.5)", !commitsOnEnter)
      for (const [, root] of surfaces) await root.getByRole("textbox", { name: "Hexadecimal", exact: true }).press("Tab")
      await assertBoth("normal blur recovers shorthand", "ff8800", "rgba(255, 136, 0, 0.5)", false, false)
      for (const stage of [...new Set(proof.map((row) => row.stage))]) {
        const rows = proof.filter((row) => row.stage === stage).map(({ surface: _surface, nativeChanges: _nativeChanges, ...state }) => state)
        expect(rows[0]).toEqual(rows[1])
      }
      await testInfo.attach(`c2-hex-${key.toLowerCase().replaceAll("+", "-")}-differential.json`, { body: JSON.stringify(proof, null, 2), contentType: "application/json" })
    } finally { await native.close() }
  })
}

// Input.js _handleChange commits RGB/HSL and Alpha on the browser's native change event, not every Enter key.
for (const [key, commitsOnEnter] of [["Enter", true], ["Shift+Enter", true], ["Control+Enter", false], ["Alt+Enter", false], ["Meta+Enter", false], ["Control+Shift+Enter", false]] as const) {
  test(`color-picker: RGB and Alpha native change match ${key} before and after Tab`, async ({ page, context }, testInfo) => {
    const native = await context.newPage()
    const proof: { name: string; stage: string; surface: string; raw: string; rgba: string; focused: boolean }[] = []
    try {
      await native.goto("/ui5.html?only=color-picker-alpha"); await native.waitForSelector("html[data-ready=true]")
      const nativeRoot = native.locator('[data-fixture="color-picker-alpha"] ui5-color-picker')
      const surfaces = [[page, picker(page), false], [native, nativeRoot, true]] as const
      for (const [name, draft, normalized] of [["Red", "300", "255"], ["Alpha", "3", "1"], ["Alpha", "0.37", "0.37"]] as const) {
        const assertBoth = async (stage: string, raw: string, rgba: string, focused: boolean) => {
          for (const [surface, root, isNative] of surfaces) {
            const field = root.getByRole("textbox", { name, exact: true })
            await expect(field).toHaveValue(raw)
            if (focused) await expect(field).toBeFocused()
            else await expect(field).not.toBeFocused()
            if (isNative) await expect(root).toHaveJSProperty("value", rgba)
            else await expect(output(surface)).toHaveText(rgba)
            proof.push({ name, stage, surface: isNative ? "UI5" : "React", raw: await field.inputValue(), rgba: isNative ? await root.evaluate((element) => (element as HTMLElement & { value: string }).value) : (await output(surface).textContent())!, focused: await field.evaluate((element) => element.getRootNode() instanceof ShadowRoot ? (element.getRootNode() as ShadowRoot).activeElement === element : document.activeElement === element) })
          }
        }
        const draftRgba = name === "Red" ? "rgba(51, 102, 153, 0.5)" : `rgba(255, 102, 153, ${draft})`
        const confirmedRgba = name === "Red" ? "rgba(255, 102, 153, 0.5)" : `rgba(255, 102, 153, ${normalized})`
        for (const [, root] of surfaces) await root.getByRole("textbox", { name, exact: true }).fill(draft)
        await assertBoth("filled draft", draft, draftRgba, true)
        for (const [, root] of surfaces) await root.getByRole("textbox", { name, exact: true }).press(key)
        await assertBoth("Enter before Tab", commitsOnEnter ? normalized : draft, commitsOnEnter ? confirmedRgba : draftRgba, true)
        // Alpha renders its float after the bubbled channel handler confirms integer text in Input.js.
        if (name === "Alpha" && draft === "0.37") await expect(nativeRoot.locator("ui5-input#alpha")).toHaveJSProperty("previousValue", commitsOnEnter ? "0" : "1")
        for (const [, root] of surfaces) await root.getByRole("textbox", { name, exact: true }).press(key)
        await assertBoth("repeated Enter before Tab", commitsOnEnter ? normalized : draft, commitsOnEnter ? confirmedRgba : draftRgba, true)
        for (const [, root] of surfaces) await root.getByRole("textbox", { name, exact: true }).press("Tab")
        await assertBoth("normal blur confirms draft", normalized, confirmedRgba, false)
        for (const [, root] of surfaces) { const field = root.getByRole("textbox", { name, exact: true }); await field.focus(); await expect(field).toBeFocused(); await field.press(key) }
        await assertBoth("unchanged refocused Enter", normalized, confirmedRgba, true)
      }
      for (let i = 0; i < proof.length; i += 2) {
        const { surface: _ours, ...ours } = proof[i], { surface: _native, ...reference } = proof[i + 1]
        expect(ours).toEqual(reference)
      }
      await testInfo.attach(`c2-channels-${key.toLowerCase().replaceAll("+", "-")}-differential.json`, { body: JSON.stringify(proof, null, 2), contentType: "application/json" })
    } finally { await native.close() }
  })
}

for (const key of ["Escape", "Shift+Escape", "Control+Escape", "Alt+Escape", "Meta+Escape", "Control+Shift+Escape"] as const) {
  test(`color-picker: ${key} matches native draft cancellation before Tab`, async ({ page, context }, testInfo) => {
    const native = await context.newPage(), proof: { name: string; stage: string; surface: string; raw: string; rgba: string }[] = []
    try {
      await native.goto("/ui5.html?only=color-picker-alpha"); await native.waitForSelector("html[data-ready=true]")
      const nativeRoot = native.locator('[data-fixture="color-picker-alpha"] ui5-color-picker'), surfaces = [[page, picker(page), false], [native, nativeRoot, true]] as const
      const color = { r: 51, g: 102, b: 153, a: .5 }, rgba = () => `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
      const assertBoth = async (name: string, stage: string, raw: string, expectedColor: string) => {
        for (const [surface, root, isNative] of surfaces) {
          const field = root.getByRole("textbox", { name, exact: true })
          await expect(field).toHaveValue(raw)
          if (isNative) await expect(root).toHaveJSProperty("value", expectedColor)
          else await expect(output(surface)).toHaveText(expectedColor)
          proof.push({ name, stage, surface: isNative ? "UI5" : "React", raw: await field.inputValue(), rgba: isNative ? await root.evaluate((element) => (element as HTMLElement & { value: string }).value) : (await output(surface).textContent())! })
        }
      }
      for (const [name, draft] of [["Hexadecimal", "#123456"], ["Red", "300"], ["Alpha", "3"]] as const) {
        const initial = name === "Hexadecimal" ? "336699" : name === "Red" ? String(color.r) : String(color.a)
        for (const [, root] of surfaces) { const field = root.getByRole("textbox", { name, exact: true }); await field.fill(draft); await field.press(key); await expect(field).toBeFocused() }
        await assertBoth(name, "Escape", key === "Escape" ? initial : draft, name === "Alpha" && key !== "Escape" ? `rgba(${color.r}, ${color.g}, ${color.b}, 3)` : rgba())
        if (key !== "Escape") { if (name === "Hexadecimal") Object.assign(color, { r: 18, g: 52, b: 86 }); else if (name === "Red") color.r = 255; else color.a = 1 }
        for (const [, root] of surfaces) { const field = root.getByRole("textbox", { name, exact: true }); await field.press("Tab"); await expect(field).not.toBeFocused() }
        await assertBoth(name, "Tab after Escape", key === "Escape" ? initial : name === "Hexadecimal" ? "123456" : name === "Red" ? "255" : "1", rgba())
      }
      for (let i = 0; i < proof.length; i += 2) { const { surface: _ours, ...ours } = proof[i], { surface: _native, ...reference } = proof[i + 1]; expect(ours).toEqual(reference) }
      await testInfo.attach(`c2-${key.toLowerCase().replaceAll("+", "-")}-cancellation.json`, { body: JSON.stringify(proof, null, 2), contentType: "application/json" })
    } finally { await native.close() }
  })
}

test("color-picker: input Escape cancels the draft and still closes the native More Colors dialog", async ({ page, context }, testInfo) => {
  const native = await context.newPage(), proof = []
  try {
    await native.goto("/ui5.html?only=color-picker-alpha"); await native.waitForSelector("html[data-ready=true]")
    await native.evaluate(async () => {
      await customElements.whenDefined("ui5-color-palette")
      const control = document.createElement("ui5-color-palette") as HTMLElement & { showMoreColors: boolean }
      control.id = "color-picker-escape-native-palette"; control.showMoreColors = true
      for (const color of ["red", "blue"]) { const item = document.createElement("ui5-color-palette-item"); item.setAttribute("value", color); control.append(item) }
      document.body.replaceChildren(control)
    })
    const nativePalette = native.locator("#color-picker-escape-native-palette"), nativeDialog = nativePalette.locator("ui5-dialog"), nativePicker = nativeDialog.locator("ui5-color-picker")
    const more = palette(page).getByRole("button", { name: "More Colors...", exact: true }), nativeMore = nativePalette.getByRole("button", { name: "More Colors...", exact: true })
    const openBoth = async () => { await more.click(); await nativeMore.click(); await expect(dialog(page)).toBeVisible(); await expect(nativeDialog).toBeVisible(); await expect(hue(dialog(page))).toBeFocused(); await expect(hue(nativePicker)).toBeFocused() }
    await openBoth()
    for (const [root, isNative] of [[dialog(page), false], [nativePicker, true]] as const) {
      const field = root.getByRole("textbox", { name: "Hexadecimal", exact: true })
      await field.fill("#123456"); await field.press("Shift+Escape"); await expect(field).toHaveValue("#123456"); await expect(field).toBeFocused()
      await expect(isNative ? nativeDialog : dialog(page)).toBeVisible()
      await field.press("Escape")
    }
    await expect(dialog(page)).toHaveCount(0); await expect(nativeDialog).not.toBeVisible(); await expect(more).toBeFocused(); await expect(nativeMore).toBeFocused()
    await openBoth()
    for (const [root, isNative] of [[dialog(page), false], [nativePicker, true]] as const) {
      const field = root.getByRole("textbox", { name: "Hexadecimal", exact: true })
      await expect(field).toHaveValue("ffffff"); await expect(field).not.toHaveAttribute("aria-invalid"); await expect(root.getByRole("textbox", { name: "Red", exact: true })).toHaveValue("255")
      proof.push({ surface: isNative ? "UI5" : "React", hex: await field.inputValue(), red: await root.getByRole("textbox", { name: "Red", exact: true }).inputValue(), invalid: await field.getAttribute("aria-invalid") })
    }
    expect(proof[0].hex).toBe(proof[1].hex)
    await testInfo.attach("c2-dialog-escape-cancellation.json", { body: JSON.stringify(proof, null, 2), contentType: "application/json" })
  } finally { await native.close() }
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

test("color-picker: reopening invalid HSL draft settles on Hue after native dialog open delegation", async ({ page, context }, testInfo) => {
  const native = await context.newPage()
  try {
    await native.goto("/ui5.html?only=color-picker-alpha"); await native.waitForSelector("html[data-ready=true]")
    await native.evaluate(async () => {
      await customElements.whenDefined("ui5-color-palette")
      const control = document.createElement("ui5-color-palette") as HTMLElement & { showMoreColors: boolean }
      control.id = "color-picker-focus-native-palette"; control.showMoreColors = true
      for (const color of ["red", "blue"]) { const item = document.createElement("ui5-color-palette-item"); item.setAttribute("value", color); control.append(item) }
      document.body.replaceChildren(control)
    })
    const nativePalette = native.locator("#color-picker-focus-native-palette"), nativeDialog = nativePalette.locator("ui5-dialog"), nativePicker = nativeDialog.locator("ui5-color-picker")
    const more = palette(page).getByRole("button", { name: "More Colors...", exact: true }), nativeMore = nativePalette.getByRole("button", { name: "More Colors...", exact: true })
    // Popup.js applies traversal before ui5-open; ColorPalette's open callback then delegates asynchronously to Hue.
    await nativeDialog.evaluate((element) => element.addEventListener("ui5-open", () => { element.setAttribute("data-c2-open-count", String(Number(element.getAttribute("data-c2-open-count") ?? 0) + 1)) }))
    let opens = 0
    const openBoth = async () => {
      await more.click(); await nativeMore.click(); await expect(dialog(page)).toBeVisible(); await expect(nativeDialog).toBeVisible()
      await expect(nativeDialog).toHaveAttribute("data-c2-open-count", String(++opens))
      await expect(hue(nativePicker)).toBeFocused(); await expect(hue(dialog(page))).toBeFocused()
    }
    const message = (root: Locator, isNative: boolean) => root.locator(isNative ? ".ui5-color-picker-hex-input .ui5-valuestatemessage-popover" : ".fiori-color-picker__hex .fiori-value-state-message")
    await openBoth(); await expect(hue(dialog(page))).toBeFocused(); await expect(hue(nativePicker)).toBeFocused()
    for (const [root, isNative] of [[dialog(page), false], [nativePicker, true]] as const) {
      await root.getByRole("button", { name: "Change Color Mode", exact: true }).click()
      await expect(root.getByRole("textbox", { name: "Saturation", exact: true })).toBeVisible()
      await commit(root, "Hexadecimal", "nothex")
      await expect(root.getByRole("textbox", { name: "Hexadecimal", exact: true })).toHaveAttribute("aria-invalid", "true")
      await expect(message(root, isNative)).toBeVisible(); await expect(message(root, isNative)).toContainText("Invalid entry")
    }
    await dialog(page).getByRole("button", { name: "Cancel", exact: true }).click(); await nativeDialog.getByRole("button", { name: "Cancel", exact: true }).click()
    await expect(dialog(page)).toHaveCount(0); await expect(nativeDialog).not.toBeVisible(); await expect(more).toBeFocused(); await expect(nativeMore).toBeFocused()
    await openBoth()
    await testInfo.attach("c2-reopen-native-focus-chain.json", { body: JSON.stringify(await native.evaluate(() => {
      const chain = []; let element: Element | null = document.activeElement
      while (element) { chain.push({ tag: element.localName, id: element.id, className: element.className, tabIndex: (element as HTMLElement).tabIndex, ariaLabel: element.getAttribute("aria-label") }); element = element.shadowRoot?.activeElement ?? null }
      return chain
    }), null, 2), contentType: "application/json" })
    const proof = []
    for (const [root, isNative] of [[dialog(page), false], [nativePicker, true]] as const) {
      const hex = root.getByRole("textbox", { name: "Hexadecimal", exact: true }), error = message(root, isNative)
      await expect(hex).toHaveValue("nothex"); await expect(hex).toHaveAttribute("aria-invalid", "true")
      await expect(hue(root)).toHaveAttribute("tabindex", "-1"); await expect(hue(root)).toHaveAttribute("aria-disabled", "true")
      await expect(root.getByRole("textbox", { name: "Saturation", exact: true })).toBeDisabled()
      await expect(hue(root)).toBeFocused(); await expect(hex).not.toBeFocused(); await expect(error).toBeHidden()
      proof.push({ surface: isNative ? "UI5" : "React", hex: await hex.inputValue(), invalid: await hex.getAttribute("aria-invalid"), hueTabIndex: await hue(root).getAttribute("tabindex"), hueFocused: await hue(root).evaluate((element) => element.getRootNode() instanceof ShadowRoot ? (element.getRootNode() as ShadowRoot).activeElement === element : document.activeElement === element), hexFocused: false, errorVisible: await error.isVisible(), errorText: await error.innerText() })
    }
    await testInfo.attach("c2-reopen-focus-differential.json", { body: JSON.stringify(proof, null, 2), contentType: "application/json" })
    await testInfo.attach("c2-reopen-focus-react.png", { body: await dialog(page).screenshot(), contentType: "image/png" })
    // Native Input renders its error in the popup top layer; the full page retains that surface in the evidence.
    await testInfo.attach("c2-reopen-focus-native.png", { body: await native.screenshot(), contentType: "image/png" })
    for (const [root, isNative] of [[dialog(page), false], [nativePicker, true]] as const) {
      await expect(hue(root)).toBeFocused(); await expect(root.getByRole("textbox", { name: "Hexadecimal", exact: true })).not.toBeFocused()
      await expect(message(root, isNative)).toBeHidden()
    }
  } finally { await native.close() }
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


test("color-picker: RTL mirrors horizontal keyboard navigation", async ({ page }) => {
  await page.goto("/index.html?dir=rtl#/all")
  await page.waitForSelector("html[data-ready=true]")
  const root = page.locator("#color-picker-demo #color-picker-control")
  const handle = root.getByRole("slider", { name: "Hue Slider Slider handle", exact: true })
  await handle.focus()
  await expect(handle).toBeFocused()
  await page.keyboard.press("ArrowLeft")
  await expect(handle).toHaveAttribute("aria-valuenow", "211")
  await page.keyboard.press("ArrowRight")
  await expect(handle).toHaveAttribute("aria-valuenow", "210")
})
