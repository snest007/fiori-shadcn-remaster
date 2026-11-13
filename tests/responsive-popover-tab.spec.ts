import { expect, test, type Locator, type Page } from "@playwright/test"

const keys = ["Tab", "Shift+Tab", "Control+Tab", "Control+Shift+Tab", "Alt+Tab", "Alt+Shift+Tab", "Meta+Tab", "Meta+Shift+Tab"]
type Kind = "select" | "combobox" | "multi-combobox" | "multi-input"

async function deepFocus(locator: Locator) {
  await expect.poll(() => locator.evaluate((element) => {
    let active = document.activeElement
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement
    return active === element
  })).toBe(true)
}
async function render(holder: Locator, native: boolean) {
  if (native) await holder.evaluate(async (element: any) => element.phoneRenderFinished())
}
function keyInit(key: string) {
  return { key: "Tab", code: "Tab", bubbles: true, composed: true, cancelable: true,
    ctrlKey: key.includes("Control"), altKey: key.includes("Alt"), metaKey: key.includes("Meta"), shiftKey: key.includes("Shift") }
}
async function visit(page: Page, kind: Kind, native: boolean, phone: boolean) {
  await page.goto(`/${native ? "ui5" : "index"}.html?fixtures-phone&interactive&only=${kind}-phone${phone ? "" : "&device=desktop"}${kind === "multi-input" ? "&tab-active" : ""}`)
  await page.waitForSelector("html[data-ready=true]")
  const holder = page.locator(`#${kind}-phone-demo`)
  await render(holder, native)
  const source = kind === "select" ? holder.getByRole("combobox", { includeHidden: true }).first()
    : native ? holder.locator(`ui5-${kind} input`).first() : holder.locator(`#${kind}-phone-field`)
  const popup = native ? holder.locator(phone ? "ui5-dialog[open]" : "ui5-responsive-popover[open]").first()
    : page.locator(phone ? '[role="dialog"]' : kind === "select" ? '[data-slot="select-content"]' : kind === "multi-input" ? '[data-slot="multi-input-suggestions"]' : `[data-slot="${kind}-popover"]`)
  const view = native ? holder : popup
  const header = native ? holder.locator("ui5-responsive-popover ui5-input input").first() : popup.locator("input").first()
  if (phone) {
    await source.click()
  } else if (kind === "multi-input") {
    await source.fill("Ge")
  } else {
    await source.focus()
    await deepFocus(source)
    // Pointer-open without F4's initial row selection or deferred focus move;
    // the following test owns its explicit source/row/header focus transition.
    if (native) await holder.locator(`ui5-${kind} ui5-icon[name="slim-arrow-down"]`).first().click()
    else await holder.getByRole("button", { name: "Select Options", exact: true }).click()
  }
  await expect(popup).toBeVisible()
  await render(holder, native)
  if (phone) {
    await expect(popup).toHaveCSS("width", "375px")
    await expect(popup).toHaveCSS("height", "667px")
  } else {
    await expect(holder.locator("ui5-dialog[open]")).toHaveCount(0)
    if (!native) await expect(popup).not.toHaveClass(/fiori-responsive-popover--field/)
  }
  return { holder, source, popup, view, header }
}

for (const phone of [false, true]) test.describe(`D1a exact Tab predicates (${phone ? "phone" : "desktop"})`, () => {
  test.use(phone ? { viewport: { width: 375, height: 667 }, hasTouch: true } : { viewport: { width: 1280, height: 900 }, hasTouch: false })
  for (const native of [false, true]) {
    const label = native ? "UI5" : "React"
    for (const site of ["row", "select-all"] as const) test(`${label} MultiComboBox ${site} closes only for plain Tab and Shift+Tab across all 8 combinations`, async ({ page }) => {
      for (const key of keys) await test.step(key, async () => {
        const { holder, popup, view } = await visit(page, "multi-combobox", native, phone)
        const target = site === "row" ? view.getByRole("option", { name: /Germany/ })
          : view.getByRole("checkbox", { name: "Select All (0 of 4)", exact: true, includeHidden: true })
        await target.focus()
        await deepFocus(target)
        await target.press(key)
        await render(holder, native)
        if (key === "Tab" || key === "Shift+Tab") await expect(popup).toHaveCount(0)
        else { await expect(popup).toBeVisible(); await deepFocus(target) }
        await expect(holder.locator('[data-slot="phone-events"]')).toHaveText("[]")
        await expect(holder.locator('[data-slot="phone-selected"]')).toHaveText("")
      })
    })
    for (const kind of ["combobox", "multi-combobox"] as const) test(`${label} ${kind} ${phone ? "hidden source-input DOM probe" : "live source input"} retains its own Tab predicate across all 8 combinations`, async ({ page }) => {
      for (const key of keys) await test.step(key, async () => {
        const { holder, source, popup, header } = await visit(page, kind, native, phone)
        if (phone) {
          // A phone modal focuses its distinct embedded Input. Dispatch a DOM
          // keydown to the actual hidden owning input to isolate _keydown /
          // _onkeydown, without replacing any native method or moving modal focus.
          await header.focus()
          await deepFocus(header)
          await source.dispatchEvent("keydown", keyInit(key))
        } else {
          await source.focus()
          await deepFocus(source)
          await source.press(key)
        }
        await render(holder, native)
        const closes = kind === "multi-combobox" || key === "Tab" || key === "Shift+Tab"
        if (closes) await expect(popup).toHaveCount(0)
        else await expect(popup).toBeVisible()
        if (kind === "multi-combobox" || phone) await expect(holder.locator('[data-slot="phone-events"]')).toHaveText("[]")
      })
    })
    test(`${label} MultiInput ${phone ? "hidden source-input DOM probe" : "live source input"} accepts its active suggestion only on plain Tab across all 8 combinations`, async ({ page }) => {
      for (const key of keys) await test.step(key, async () => {
        const { holder, source, popup, header, view } = await visit(page, "multi-input", native, phone)
        if (phone) {
          await header.fill("Ge")
          await render(holder, native)
          await deepFocus(header)
          // InputSuggestionsTemplate.js has no owner key forwarding on its
          // phone Input. Probe the real source handler separately from that UI.
          await source.dispatchEvent("keydown", { key: "ArrowDown", code: "ArrowDown", bubbles: true, composed: true, cancelable: true })
        } else {
          await deepFocus(source)
          await source.press("ArrowDown")
        }
        await render(holder, native)
        await expect(source).toHaveValue("Germany")
        await expect(view.getByRole("option", { name: /Germany/ })).toHaveAttribute("aria-selected", "true")
        if (phone) await source.dispatchEvent("keydown", keyInit(key))
        else await source.press(key)
        await render(holder, native)
        if (key === "Tab") {
          await expect(popup).toHaveCount(0)
          // UI5 Input.acceptSuggestion emits change on acceptance; native
          // selection-change already reports the provisional arrow selection.
          await expect(holder.locator('[data-slot="phone-events"]')).toContainText(native ? "change:Germany" : "suggestion:Germany")
        } else {
          await expect(holder.locator('[data-slot="phone-events"]')).not.toContainText("suggestion:")
          // Shift+Tab can leave the desktop field through browser focus/blur;
          // acceptance, rather than that incidental close, is the callsite rule.
          if (phone) await expect(popup).toBeVisible()
          if (phone && native) await expect(holder.locator('[data-slot="phone-events"]')).not.toContainText("change:")
        }
      })
    })
    if (!phone) test(`${label} MultiInput focused source-input DOM probe separates Tab acceptance from subsequent browser blur across all 8 combinations`, async ({ page }) => {
      for (const key of keys) await test.step(key, async () => {
        const { holder, source, popup, view } = await visit(page, "multi-input", native, false)
        await deepFocus(source)
        await source.press("ArrowDown")
        await render(holder, native)
        await expect(source).toHaveValue("Germany")
        await expect(view.getByRole("option", { name: /Germany/ })).toHaveAttribute("aria-selected", "true")
        // Dispatch to the actual focused input so native browser focus/blur
        // cannot turn Shift+Tab into a normal change after _onkeydown ignored it.
        await source.dispatchEvent("keydown", keyInit(key))
        await render(holder, native)
        if (key === "Tab") {
          await expect(popup).toHaveCount(0)
          await expect(holder.locator('[data-slot="phone-events"]')).toContainText(native ? "change:Germany" : "suggestion:Germany")
        } else {
          await expect(popup).toBeVisible()
          await expect(holder.locator('[data-slot="phone-events"]')).not.toContainText(native ? "change:" : "suggestion:")
        }
      })
    })
    if (!phone) test(`${label} ComboBox keeps modified Tab open, still commits blur and closes on an ordinary outside click`, async ({ page }) => {
      const { holder, source, popup } = await visit(page, "combobox", native, false)
      await source.fill("Germany")
      await render(holder, native)
      await expect(source).toHaveValue("Germany")
      await deepFocus(source)
      await source.press("Alt+Tab")
      await render(holder, native)
      await expect(popup).toBeVisible()
      await page.mouse.click(900, 800)
      await expect(popup).toHaveCount(0)
      await expect(holder.locator('[data-slot="phone-events"]')).toContainText("change:Germany")
    })
    if (phone) {
      for (const kind of ["combobox", "multi-input"] as const) test(`${label} ${kind} live phone List row preserves its distinct Tab forwarding across all 8 combinations`, async ({ page }) => {
        for (const key of keys) await test.step(key, async () => {
          const { holder, popup, view, header } = await visit(page, kind, native, true)
          const row = view.getByRole("option", { name: /Germany/ })
          await row.focus()
          await deepFocus(row)
          await row.press(key)
          await render(holder, native)
          if (kind === "combobox" && key === "Tab") await expect(popup).toHaveCount(0)
          else await expect(popup).toBeVisible()
          if (kind === "combobox" && key === "Shift+Tab") await deepFocus(header)
          await expect(holder.locator('[data-slot="phone-events"]')).toHaveText("[]")
        })
      })
      for (const kind of ["combobox", "multi-combobox", "multi-input"] as const) test(`${label} ${kind} live phone embedded Input keeps its distinct Tab handler across all 8 combinations`, async ({ page }) => {
        for (const key of keys) await test.step(key, async () => {
          const { holder, popup, header } = await visit(page, kind, native, true)
          await header.fill("a")
          await render(holder, native)
          await header.focus()
          await deepFocus(header)
          await header.press(key)
          await render(holder, native)
          if (kind === "combobox" && key === "Tab") await expect(popup).toHaveCount(0)
          else await expect(popup).toBeVisible()
          await expect(holder.locator('[data-slot="phone-events"]')).not.toContainText("suggestion:")
          await expect(holder.locator('[data-slot="phone-selected"]')).toHaveText("")
        })
      })
      test(`${label} Select live phone row retains exact plain Tab and Shift+Tab across all 8 combinations`, async ({ page }) => {
        for (const key of keys) await test.step(key, async () => {
          const { holder, popup, view } = await visit(page, "select", native, true)
          const row = view.getByRole("option", { name: "Germany", exact: true })
          await deepFocus(row)
          await row.press(key)
          await render(holder, native)
          if (key === "Tab" || key === "Shift+Tab") await expect(popup).toHaveCount(0)
          else await expect(popup).toBeVisible()
          await expect(holder.locator('[data-slot="phone-events"]')).toHaveText("[]")
        })
      })
    }
  }
})
