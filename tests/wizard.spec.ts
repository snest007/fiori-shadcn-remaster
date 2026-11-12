import { expect, test, type Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/wizard`)
  await page.waitForSelector("html[data-ready=true]")
})

const demo = (page: Page) => page.locator("#wizard-demo")
const tab = (page: Page, n: number) => demo(page).getByRole("listitem").nth(n - 1)
const stepValue = (page: Page) => page.getByTestId("wizard-demo-step")

test("header: tabs with aria-current, posinset and active/inactive labels", async ({ page }) => {
  await expect(demo(page).getByRole("region", { name: "Create product" })).toBeVisible()
  await expect(demo(page).getByRole("list", { name: "Wizard Steps" })).toBeVisible()
  await expect(tab(page, 1)).toHaveAttribute("aria-current", "step")
  await expect(tab(page, 1)).toHaveAttribute("aria-label", "Step 1 Product type Active")
  await expect(tab(page, 2)).toHaveAttribute("aria-label", "Step 2 Product information Inactive Optional")
  await expect(tab(page, 2)).toHaveAttribute("aria-posinset", "2")
  await expect(tab(page, 2)).toHaveAttribute("aria-setsize", "4")
  // Future steps are disabled: no tab stop, content hidden.
  await expect(tab(page, 2)).not.toHaveAttribute("tabindex", /.*/)
  await expect(demo(page).getByRole("region", { name: "Step 2 Product information" })).toBeHidden()
})

test("validation gates the next step; enabling it selects and focuses into it", async ({ page }) => {
  await demo(page).getByRole("button", { name: "Step 2" }).click()
  await expect(stepValue(page)).toHaveText("info")
  await expect(tab(page, 2)).toHaveAttribute("aria-current", "step")
  await expect(page.locator("#wizard-demo-name")).toBeFocused()
  const next = demo(page).getByRole("button", { name: "Step 3" })
  await expect(next).toBeDisabled()
  await page.locator("#wizard-demo-name").fill("Laptop")
  await expect(next).toBeEnabled()
  await next.click()
  await expect(stepValue(page)).toHaveText("options")
  await expect(tab(page, 3)).toHaveAttribute("aria-current", "step")
})

test("keyboard: arrows move between enabled tabs, Enter / Space select", async ({ page }) => {
  await demo(page).getByRole("button", { name: "Step 2" }).click()
  await page.locator("#wizard-demo-name").fill("Laptop")
  await demo(page).getByRole("button", { name: "Step 3" }).click()
  await tab(page, 3).focus()
  await page.keyboard.press("ArrowRight") // step 4 is disabled → stays
  await expect(tab(page, 3)).toBeFocused()
  await page.keyboard.press("ArrowLeft")
  await expect(tab(page, 2)).toBeFocused()
  await page.keyboard.press("Home")
  await expect(tab(page, 1)).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(stepValue(page)).toHaveText("type")
  await expect(tab(page, 1)).toHaveAttribute("aria-current", "step")
  await tab(page, 1).focus()
  await page.keyboard.press("End")
  await expect(tab(page, 3)).toBeFocused()
  await page.keyboard.press("Space")
  await expect(stepValue(page)).toHaveText("options")
})

test("selecting a tab scrolls its step to the top; scrolling selects the step in view", async ({ page }) => {
  await demo(page).getByRole("button", { name: "Step 2" }).click()
  await page.locator("#wizard-demo-name").fill("Laptop")
  await demo(page).getByRole("button", { name: "Step 3" }).click()
  const content = demo(page).locator(".fiori-wiz__content")
  const top = (name: string) =>
    demo(page).getByRole("region", { name }).evaluate((el) => el.getBoundingClientRect().top - el.parentElement!.getBoundingClientRect().top)
  await expect.poll(() => top("Step 3 Options")).toBe(0)
  await tab(page, 1).click()
  await expect(stepValue(page)).toHaveText("type")
  await expect.poll(() => content.evaluate((el) => el.scrollTop)).toBe(0)
  const changes = Number(await page.getByTestId("wizard-demo-changes").textContent())
  await content.evaluate((el) => el.scrollTo({ top: el.scrollHeight }))
  await expect(stepValue(page)).toHaveText("options")
  await expect(page.getByTestId("wizard-demo-changes")).not.toHaveText(String(changes))
})
