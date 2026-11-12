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
