import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/block.html?name=object-page`)
  await page.waitForSelector("html[data-ready=true]")
})

test("object-page block: floorplan anatomy — title, header facets, navigation bar, sections", async ({ page }) => {
  const op = page.locator("#object-page-block")
  await expect(page.getByRole("main", { name: "Sales Order" })).toBeVisible()
  await expect(op.getByRole("heading", { level: 1, name: "Sales Order 589946637" })).toBeVisible()
  await expect(op.getByRole("navigation", { name: "Navigation trail" })).toBeVisible()
  await expect(op.getByRole("group", { name: "Status" })).toContainText("Confirmed")
  await expect(op.getByRole("group", { name: "Net Value" })).toContainText("32,155.20")
  const tabs = op.getByRole("tablist", { name: "Page Sections" }).getByRole("tab")
  await expect(tabs).toHaveText(["General Information", "Items", "Notes"])
  await expect(op.getByRole("region", { name: "General Information" }).getByRole("term").first()).toHaveText("Order ID:")
  await expect(op.getByRole("grid", { name: "Items (4)" }).getByRole("row")).toHaveCount(5)
})

test("object-page block: anchor navigation scrolls to Items; scroll spy follows", async ({ page }) => {
  const op = page.locator("#object-page-block")
  const tab = (name: string) => op.getByRole("tablist", { name: "Page Sections" }).getByRole("tab", { name })
  await tab("Items").click()
  await expect(tab("Items")).toHaveAttribute("aria-selected", "true")
  await expect(op).toHaveAttribute("data-header-snapped", "")
  await expect(op.getByRole("grid", { name: "Items (4)" })).toBeInViewport()
  await op.locator(".fiori-dynamic-page__scroll").first().hover()
  await page.mouse.wheel(0, -5000)
  await expect(tab("General Information")).toHaveAttribute("aria-selected", "true")
})

test("object-page block: Edit shows inputs and the Save / Cancel footer; Save keeps, Cancel discards", async ({ page }) => {
  const op = page.locator("#object-page-block")
  const footer = op.locator("[data-slot=dynamic-page-footer]")
  await expect(op).not.toHaveAttribute("data-show-footer")
  await op.getByRole("button", { name: "Edit" }).click()
  await expect(op).toHaveAttribute("data-show-footer", "")
  await expect(op.getByRole("form", { name: "Order Details" })).toBeVisible()
  await op.getByLabel(/^Customer:?$/).fill("Robotech Inc.")
  await footer.getByRole("button", { name: "Save" }).click()
  await expect(op).not.toHaveAttribute("data-show-footer")
  await expect(op.locator("[data-slot=dynamic-page-title]").getByText("Robotech Inc.", { exact: true })).toBeVisible()
  await expect(op.getByRole("button", { name: "Edit" })).toBeVisible()

  await op.getByRole("button", { name: "Edit" }).click()
  await op.getByRole("textbox", { name: "Notes" }).fill("Changed")
  await footer.getByRole("button", { name: "Cancel" }).click()
  await expect(op.locator("[data-slot=object-page-block-notes]")).toHaveText(/Deliver to the Orlando factory/)
})
