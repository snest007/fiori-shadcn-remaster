import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/block.html?name=empty-states`)
  await page.waitForSelector("html[data-ready=true]")
})

test("shows the standard states, each with its illustration and text", async ({ page }) => {
  for (const [id, illustration, title] of [
    ["no-data", "NoData", "There's no data yet."],
    ["no-search-results", "NoSearchResults", "We could not find this."],
    ["no-filter-results", "NoFilterResults", "No results found"],
    ["unable-to-load", "UnableToLoad", "Unable to load data"],
    ["page-not-found", "PageNotFound", "Sorry, we can't find this page"],
    ["success", "SuccessScreen", "Nicely done!"],
  ]) {
    const card = page.locator(`#empty-states-${id}`)
    await expect(card.getByRole("img", { name: illustration })).toBeVisible()
    await expect(card.getByRole("heading", { level: 3 })).toHaveText(title)
  }
})

test("the page uses different sizes", async ({ page }) => {
  await expect(page.locator("#empty-states-no-data [data-slot=illustrated-message]")).toHaveAttribute("data-media", "scene")
  await expect(page.locator("#empty-states-unable-to-load [data-slot=illustrated-message]")).toHaveAttribute("data-media", "dialog")
  await expect(page.locator("#empty-states-success [data-slot=illustrated-message]")).toHaveAttribute("data-media", "spot")
  await expect(page.locator("#empty-states-inline [data-slot=illustrated-message]")).toHaveAttribute("data-media", "dot")
})

test("actions respond", async ({ page }) => {
  const load = page.locator("#empty-states-unable-to-load")
  await load.getByRole("button", { name: "Retry" }).click()
  await expect(load.getByRole("status")).toHaveText("Retried 1 time")
  const filter = page.locator("#empty-states-no-filter-results")
  await filter.getByRole("button", { name: "Clear Filters" }).click()
  await expect(filter.getByRole("status")).toHaveText("Filters cleared")
})

test("the size selector overrides the design of every state", async ({ page }) => {
  await page.getByRole("option", { name: "Spot" }).click()
  const all = page.locator("[data-slot=illustrated-message]")
  await expect(all).toHaveCount(7)
  for (let i = 0; i < 7; i++) await expect(all.nth(i)).toHaveAttribute("data-media", "spot")
})

for (const theme of ["sap_horizon", "sap_horizon_hcb"]) {
  test(`no axe violations (${theme})`, async ({ page }) => {
    await page.goto(`/block.html?name=empty-states&theme=${theme}`)
    await page.waitForSelector("html[data-ready=true]")
    const results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([])
  })
}
