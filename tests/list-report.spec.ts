import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/block.html?name=list-report`)
  await page.waitForSelector("html[data-ready=true]")
})

test("list-report: floorplan anatomy — variant title, filter bar in the header, table with count", async ({ page }) => {
  const lr = page.locator("#list-report")
  await expect(page.getByRole("main", { name: "Manage Products" })).toBeVisible()
  await expect(lr.getByRole("heading", { level: 1, name: "Standard" })).toBeVisible()
  const header = lr.locator("[data-slot=dynamic-page-header]")
  await expect(header.getByRole("search")).toBeVisible()
  await expect(header.getByRole("searchbox", { name: "Search" })).toBeVisible()
  await expect(lr.getByRole("heading", { name: "Products (12)" })).toBeVisible()
  await expect(lr.getByRole("grid", { name: "Products (12)" })).toBeVisible()
  // The title sits above the header, the header above the table.
  const title = (await lr.locator("[data-slot=dynamic-page-title]").boundingBox())!
  const hdr = (await header.boundingBox())!
  const table = (await lr.getByRole("grid").boundingBox())!
  expect(title.y + title.height).toBeLessThanOrEqual(hdr.y + 1)
  expect(hdr.y + hdr.height).toBeLessThan(table.y)
})

test("list-report: Go applies the filters and updates the count", async ({ page }) => {
  const lr = page.locator("#list-report")
  await lr.getByLabel("Supplier").fill("depot")
  await expect(lr.getByRole("heading", { name: "Products (12)" })).toBeVisible()
  await lr.getByRole("button", { name: "Go" }).click()
  await expect(lr.getByRole("heading", { name: "Products (3)" })).toBeVisible()
  await expect(lr.getByRole("button", { name: "Adapt Filters (1)" })).toBeVisible()
  await lr.getByRole("searchbox").fill("scissors")
  await lr.getByRole("searchbox").press("Enter")
  await expect(lr.getByRole("heading", { name: "Products (1)" })).toBeVisible()
})

test("list-report: header snaps on scroll and shows the filter summary in the title", async ({ page }) => {
  const lr = page.locator("#list-report")
  await page.setViewportSize({ width: 1280, height: 500 })
  await lr.getByLabel("Supplier").fill("o")
  await lr.locator(".fiori-dynamic-page__scroll").first().evaluate((e) => (e.scrollTop = 400))
  await expect(lr).toHaveAttribute("data-header-snapped", "")
  await expect(lr.locator("[data-slot=list-report-summary]")).toHaveText("1 filter active: Supplier")
  await expect(lr.getByRole("search")).toBeHidden()
})

test("list-report: selecting rows shows the footer with the mass action", async ({ page }) => {
  const lr = page.locator("#list-report")
  const footer = lr.locator("[data-slot=dynamic-page-footer]")
  await expect(lr).not.toHaveAttribute("data-show-footer")
  await lr.getByRole("row", { name: /Premium Scissors/ }).getByRole("checkbox").click()
  await lr.getByRole("row", { name: /Tea\/Coffee Mugs/ }).getByRole("checkbox").click()
  await expect(lr).toHaveAttribute("data-show-footer", "")
  await expect(footer.getByRole("button", { name: "Approve (2)" })).toBeVisible()
  await expect(lr.getByRole("button", { name: "Delete" })).toBeEnabled()
  await footer.getByRole("button", { name: "Cancel" }).click()
  await expect(lr).not.toHaveAttribute("data-show-footer")
})
