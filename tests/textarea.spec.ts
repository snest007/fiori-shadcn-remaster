import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.describe("TextArea", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/index.html#/textarea`)
    await page.waitForSelector("html[data-ready=true]")
  })

  test("counter counts down, then over the limit, and is linked to the field", async ({ page }) => {
    const ta = page.locator("#ta-notes")
    const counter = page.locator("[data-slot=textarea]:has(#ta-notes) .fiori-textarea__counter")
    await expect(counter).toHaveText("40 characters left")
    await ta.fill("Hello")
    await expect(counter).toHaveText("35 characters left")
    await ta.fill("x".repeat(45)) // counterMode lets the limit be exceeded
    await expect(counter).toHaveText("5 characters over limit")
    await expect(ta).toHaveAttribute("aria-invalid", "true")
    expect(await ta.getAttribute("aria-describedby")).toContain(await counter.getAttribute("id"))
  })

  test("auto counter is visible only while focused", async ({ page }) => {
    const counter = page.locator("[data-slot=textarea]:has(#ta-auto) .fiori-textarea__counter")
    await expect(counter).toHaveCSS("visibility", "hidden")
    await page.locator("#ta-auto").focus()
    await expect(counter).toHaveCSS("visibility", "visible")
    await expect(counter).toHaveText("20 characters left")
  })

  test("growing grows with the content up to growingMaxRows", async ({ page }) => {
    const ta = page.locator("#ta-growing")
    const h0 = (await ta.boundingBox())!.height
    await ta.fill("1\n2\n3\n4")
    const h4 = (await ta.boundingBox())!.height
    expect(h4).toBeGreaterThan(h0)
    await ta.fill("1\n2\n3\n4\n5\n6\n7\n8\n9")
    const h9 = (await ta.boundingBox())!.height
    await ta.fill("1\n2\n3\n4\n5")
    const h5 = (await ta.boundingBox())!.height
    expect(h9).toBe(h5) // capped at 5 rows
    expect(h5).toBeGreaterThan(h4)
  })

  test("Escape restores the value from focus", async ({ page }) => {
    const ta = page.locator("#ta-notes")
    await ta.fill("first")
    await page.locator("body").click({ position: { x: 5, y: 5 } })
    await ta.focus()
    await page.keyboard.type(" second")
    await expect(ta).toHaveValue("first second")
    await page.keyboard.press("Escape")
    await expect(ta).toHaveValue("first")
  })
})


test("textarea: sap_horizon pointer origin and canceled pointer preserve keyboard reentry", async ({ page }) => {
  await page.goto("/index.html?fixtures&only=textarea-value&theme=sap_horizon")
  await page.waitForSelector("html[data-ready=true]")
  const cell = page.locator('[data-fixture="textarea-value"]')
  const target = cell.locator('textarea').first()
  const owner = cell.locator('[data-slot="textarea"] .fiori-textarea__wrapper').first()
  const painted = () => owner.evaluate((node) => {
    const css = getComputedStyle(node, "::after")
    return !["none", "normal"].includes(css.content) && css.display !== "none" && css.borderTopStyle !== "none" && Number.parseFloat(css.borderTopWidth) > 0
  })
  await target.click()
  await expect(target).toBeFocused()
  expect(await painted()).toBe(false)
  await cell.evaluate((node) => {
    const before = document.createElement("button"); before.id = "textarea-e4-before"; before.textContent = "Before field"
    node.before(before); before.focus()
  })
  const before = page.locator("#textarea-e4-before")
  await expect(before).toBeFocused()
  // A canceled pointer action changes modality without moving focus. The next
  // real Tab must independently restore keyboard origin before field reentry.
  await before.hover()
  await page.mouse.down(); await page.mouse.up()
  await page.keyboard.press("Tab")
  await expect(target).toBeFocused()
  expect(await painted()).toBe(true)
})

test("textarea: sap_horizon_hcb pointer origin and canceled pointer preserve keyboard reentry", async ({ page }) => {
  await page.goto("/index.html?fixtures&only=textarea-value&theme=sap_horizon_hcb")
  await page.waitForSelector("html[data-ready=true]")
  const cell = page.locator('[data-fixture="textarea-value"]')
  const target = cell.locator('textarea').first()
  const owner = cell.locator('[data-slot="textarea"] .fiori-textarea__wrapper').first()
  const painted = () => owner.evaluate((node) => {
    const css = getComputedStyle(node, "::after")
    return !["none", "normal"].includes(css.content) && css.display !== "none" && css.borderTopStyle !== "none" && Number.parseFloat(css.borderTopWidth) > 0
  })
  await target.click()
  await expect(target).toBeFocused()
  expect(await painted()).toBe(false)
  await cell.evaluate((node) => {
    const before = document.createElement("button"); before.id = "textarea-e4-before"; before.textContent = "Before field"
    node.before(before); before.focus()
  })
  const before = page.locator("#textarea-e4-before")
  await expect(before).toBeFocused()
  // A canceled pointer action changes modality without moving focus. The next
  // real Tab must independently restore keyboard origin before field reentry.
  await before.hover()
  await page.mouse.down(); await page.mouse.up()
  await page.keyboard.press("Tab")
  await expect(target).toBeFocused()
  expect(await painted()).toBe(true)
})


for (const theme of ["sap_horizon", "sap_horizon_hcb"]) for (const state of ["negative", "critical"]) for (const surface of ["", "-application"]) {
  test(`TextArea ${state} counter has text contrast on ${surface || "content"} ${theme}`, async ({ page }) => {
    const id = `textarea-counter-${state}${surface}`
    await page.goto(`/index.html?fixtures&only=${id}&theme=${theme}`)
    await page.waitForSelector("html[data-ready=true]")
    const cell = page.locator(`[data-fixture="${id}"]`)
    const field = cell.getByRole("textbox", { name: "Description" })
    const counter = cell.locator('.fiori-textarea__counter')
    await expect(counter).toBeVisible()
    expect((await field.getAttribute("aria-describedby"))?.split(" ")).toContain(await counter.getAttribute("id"))
    const result = await new AxeBuilder({ page }).include(`[data-fixture="${id}"]`).withRules(["color-contrast"]).analyze()
    expect(result.violations).toEqual([])
  })
}
