import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/all`)
  await page.waitForSelector("html[data-ready=true]")
})

test("form: display mode is a definition list inside a labelled region", async ({ page }) => {
  const form = page.locator("#form-demo")
  await expect(form.getByRole("region", { name: "Supplier" })).toBeVisible()
  await expect(form.locator("dl")).toHaveCount(2)
  await expect(form.locator("dl").first()).toHaveAccessibleName("Address")
  await expect(form.locator("dt").first()).toHaveText("Name:")
  await expect(form.locator("dd").first()).toHaveText("Red Point Stores")
  // Group titles are headings (H3 under the form's H2).
  await expect(form.getByRole("heading", { level: 2, name: "Supplier" })).toBeVisible()
  await expect(form.getByRole("heading", { level: 3, name: "Contact" })).toBeVisible()
})

test("form: edit mode uses form groups and labelled inputs", async ({ page }) => {
  await page.locator("#form-demo-toggle").click()
  const form = page.locator("#form-demo")
  await expect(form.locator("dl")).toHaveCount(0)
  await expect(form.getByRole("form", { name: "Address" })).toBeVisible()
  await form.getByLabel("City").fill("Berlin")
  await page.locator("#form-demo-toggle").click()
  await expect(form.locator("dd").nth(2)).toHaveText("Berlin")
})

test("form: responsive columns and label placement follow the form width", async ({ page }) => {
  const form = page.locator("#form-demo")
  const columns = form.locator(".fiori-form__column")
  const layout = async () => {
    const [a, b] = await columns.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()))
    const label = (await form.locator("dt").first().boundingBox())!
    const value = (await form.locator("dd").first().boundingBox())!
    return { sideBySide: Math.abs(a.y - b.y) < 1, labelBeside: label.x + label.width <= value.x + 1 }
  }
  // M range (≥ 600px): 2 columns ("M2"), label beside its field ("M4").
  await form.evaluate((e) => (e.style.width = "700px"))
  expect(await layout()).toEqual({ sideBySide: true, labelBeside: true })
  // S range: 1 column, label above ("S12").
  await form.evaluate((e) => (e.style.width = "500px"))
  expect(await layout()).toEqual({ sideBySide: false, labelBeside: false })
})

test("object-status: states are announced; active status is a button", async ({ page }) => {
  const demo = page.locator("#object-status-demo")
  await expect(demo.locator("[data-slot=object-status]").first()).toContainText("Status:")
  await expect(demo.locator("[data-slot=object-status]").first()).toContainText("Success")
  const active = page.locator("#object-status-demo-active").getByRole("button")
  await expect(active).toHaveText(/3 Issues/)
  await active.click()
  await active.press("Enter")
  await active.press("Space")
  await expect(page.locator("#object-status-demo-presses")).toHaveText("Pressed 3 times")
  await expect(demo.getByRole("link", { name: "Robotech (234242343)" })).toBeVisible()
})
