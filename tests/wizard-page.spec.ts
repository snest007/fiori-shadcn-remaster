import { expect, test, type Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/block.html?name=wizard-page`)
  await page.waitForSelector("html[data-ready=true]")
})

const tab = (page: Page, n: number) => page.getByRole("list", { name: "Wizard Steps" }).getByRole("listitem").nth(n - 1)
const footer = (page: Page) => page.locator("footer")

async function fillAll(page: Page) {
  await page.locator("#wizard-page-category").click()
  await page.getByRole("option", { name: "Laptops" }).click()
  await page.getByRole("button", { name: "Step 2" }).click()
  await expect(page.locator("#wizard-page-name")).toBeFocused()
  await page.locator("#wizard-page-name").fill("ThinkBook 14")
  await page.locator("#wizard-page-date").fill("Mar 12, 2027")
  await page.locator("#wizard-page-date").press("Enter")
  await page.getByRole("button", { name: "Step 3" }).click()
  await page.getByRole("checkbox", { name: "Gift wrapping" }).click()
  await page.getByRole("button", { name: "Step 4" }).click()
  await page.locator("#wizard-page-price").fill("1299")
}

test("starts on step 1 with later steps disabled and only Cancel in the footer", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1, name: "Create Product" })).toBeVisible()
  await expect(tab(page, 1)).toHaveAttribute("aria-current", "step")
  for (const n of [2, 3, 4]) await expect(tab(page, n)).toHaveAttribute("aria-disabled", "true")
  await expect(page.getByRole("button", { name: "Step 2" })).toBeDisabled()
  await expect(footer(page).getByRole("button")).toHaveText(["Cancel"])
})

test("each step unlocks the next; Review appears when all steps are valid", async ({ page }) => {
  await page.locator("#wizard-page-category").click()
  await page.getByRole("option", { name: "Laptops" }).click()
  await page.getByRole("button", { name: "Step 2" }).click()
  await expect(tab(page, 2)).toHaveAttribute("aria-current", "step")
  await expect(page.getByRole("button", { name: "Step 3" })).toBeDisabled()
  await page.locator("#wizard-page-name").fill("ThinkBook 14")
  await page.getByRole("button", { name: "Step 3" }).click()
  await page.getByRole("button", { name: "Step 4" }).click()
  await expect(tab(page, 4)).toHaveAttribute("aria-current", "step")
  await expect(footer(page).getByRole("button", { name: "Review" })).toHaveCount(0)
  const price = page.locator("#wizard-page-price")
  await price.fill("abc")
  await price.blur()
  await expect(price).toHaveAttribute("aria-invalid", "true")
  await price.fill("1299")
  await expect(footer(page).getByRole("button", { name: "Review" })).toBeVisible()
  // Invalidating an earlier step hides Review and disables the steps after it.
  await tab(page, 2).click()
  await page.locator("#wizard-page-name").fill("")
  await expect(footer(page).getByRole("button", { name: "Review" })).toHaveCount(0)
  await expect(tab(page, 3)).toHaveAttribute("aria-disabled", "true")
})

test("review shows the entries, Edit returns to the step, Submit confirms", async ({ page }) => {
  await fillAll(page)
  await footer(page).getByRole("button", { name: "Review" }).click()
  await expect(page.getByRole("heading", { level: 1, name: "Review Product" })).toBeVisible()
  const info = page.getByRole("region", { name: "2. Product information" })
  await expect(info).toContainText("ThinkBook 14")
  await expect(info).toContainText("Mar 12, 2027")
  await expect(page.getByRole("region", { name: "3. Options" })).toContainText("Extended warranty, Gift wrapping")
  await expect(page.getByRole("region", { name: "4. Pricing" })).toContainText("1299.00 EUR")
  await expect(footer(page).getByRole("button")).toHaveText(["Submit", "Cancel"])

  await page.getByRole("link", { name: "Edit Product information" }).click()
  await expect(tab(page, 2)).toHaveAttribute("aria-current", "step")
  await expect(page.locator("#wizard-page-name")).toHaveValue("ThinkBook 14")
  await footer(page).getByRole("button", { name: "Review" }).click()
  await footer(page).getByRole("button", { name: "Submit" }).click()
  await expect(page.getByRole("note")).toContainText("Product ThinkBook 14 was created.")
  await expect(footer(page)).toHaveCount(0)
})

test("Cancel resets the wizard", async ({ page }) => {
  await page.locator("#wizard-page-category").click()
  await page.getByRole("option", { name: "Monitors" }).click()
  await page.getByRole("button", { name: "Step 2" }).click()
  await footer(page).getByRole("button", { name: "Cancel" }).click()
  await expect(tab(page, 1)).toHaveAttribute("aria-current", "step")
  await expect(tab(page, 2)).toHaveAttribute("aria-disabled", "true")
  await expect(page.locator("#wizard-page-category")).toHaveText("Select a category")
})
