import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
})

test("filter-bar: labelled fields, search, Go and Adapt Filters with the active count", async ({ page }) => {
  const fb = page.locator("#filter-bar-demo")
  await expect(fb).toHaveAttribute("role", "search")
  await expect(fb.getByLabel("Sales Order")).toBeVisible()
  await expect(fb.getByRole("searchbox", { name: "Search" })).toBeVisible()
  await expect(fb.getByRole("button", { name: "Adapt Filters" })).toHaveText("Adapt Filters")
  await fb.getByLabel("Sales Order").fill("500")
  await expect(fb.getByRole("button", { name: "Adapt Filters (1)" })).toBeVisible()
  await fb.getByRole("button", { name: "Go" }).click()
  await expect(page.locator("#filter-bar-demo-runs")).toHaveText("Searched 1 times")
  // Enter in a filter field or the search runs Go.
  await fb.getByLabel("Changed On").press("Enter")
  await fb.getByRole("searchbox").press("Enter")
  await expect(page.locator("#filter-bar-demo-runs")).toHaveText("Searched 3 times")
})

test("filter-bar: hide / show the filter bar; collapsed shows the filter summary", async ({ page }) => {
  const fb = page.locator("#filter-bar-demo")
  const toggle = fb.locator("[data-slot=filter-bar-toggle]")
  await expect(toggle).toHaveAttribute("aria-expanded", "true")
  await expect(toggle).toHaveAccessibleName("Hide Filter Bar")
  await toggle.click()
  await expect(fb.getByLabel("Sales Order")).toBeHidden()
  await expect(fb.locator("[data-slot=filter-bar-summary]")).toHaveText("No filters active")
  await toggle.click()
  await fb.getByLabel("Sales Order").fill("500")
  await fb.getByLabel("Changed On").fill("today")
  await toggle.click()
  await expect(fb.locator("[data-slot=filter-bar-summary]")).toHaveText("2 filters active: Sales Order, Changed On")
  await expect(toggle).toHaveAccessibleName("Show Filter Bar")
})

test("filter-bar: guideline layout — label above each field, equal columns, buttons at the row end", async ({ page }) => {
  const items = page.locator("#filter-bar-demo [data-slot=filter-bar-item]")
  const boxes = await items.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()))
  expect(new Set(boxes.map((b) => Math.round(b.width))).size).toBe(1)
  const label = (await items.first().locator("label").boundingBox())!
  const field = (await items.first().locator("[data-slot=select-trigger-wrapper]").boundingBox())!
  expect(label.y + label.height).toBeLessThanOrEqual(field.y + 1)
  // Go / Adapt Filters close the row at its end edge (on the fields' row when it fits, else wrapped).
  const adapt = (await page.locator("#filter-bar-demo").getByRole("button", { name: /Adapt Filters/ }).boundingBox())!
  const content = (await page.locator("#filter-bar-demo .fiori-filter-bar__content").boundingBox())!
  expect(Math.abs(adapt.x + adapt.width - (content.x + content.width))).toBeLessThanOrEqual(1)
  const go = (await page.locator("#filter-bar-demo").getByRole("button", { name: "Go" }).boundingBox())!
  expect(go.x).toBeLessThan(adapt.x)
})
