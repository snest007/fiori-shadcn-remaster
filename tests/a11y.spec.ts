import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

for (const theme of ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]) {
  test(`docs page has no axe violations (${theme})`, async ({ page }) => {
    await page.goto(`/index.html?theme=${theme}`)
    await page.waitForSelector("html[data-ready=true]")
    const results = await new AxeBuilder({ page })
      // Disabled controls are exempt from contrast rules; SAP's own disabled opacity is 0.4.
      .disableRules(["color-contrast"])
      .analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s) — ${v.help}`)).toEqual([])
  })
}

test("text contrast meets WCAG AA in Morning Horizon", async ({ page }) => {
  await page.goto(`/index.html?theme=sap_horizon`)
  await page.waitForSelector("html[data-ready=true]")
  const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).exclude("[disabled]").exclude("[data-disabled]").analyze()
  expect(results.violations.flatMap((v) => v.nodes.map((n) => n.target.join(" ")))).toEqual([])
})

// The Select's popup list (other listboxes on the page, e.g. SegmentedButton, don't count).
const selectList = (page: import("@playwright/test").Page) => page.locator('[role="listbox"][data-slot="select-content"]')

test.describe("Select keyboard (Fiori model)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/index.html`)
    await page.waitForSelector("html[data-ready=true]")
    await page.locator("#country").focus()
  })

  test("arrow keys change the value without opening", async ({ page }) => {
    const trigger = page.locator("#country")
    await expect(trigger).toHaveText("Germany")
    await page.keyboard.press("ArrowDown")
    await expect(trigger).toHaveText("France")
    await expect(selectList(page)).toHaveCount(0)
    await page.keyboard.press("ArrowDown")
    await expect(trigger).toHaveText("China")
    await page.keyboard.press("ArrowDown") // next is disabled → stays
    await expect(trigger).toHaveText("China")
    await page.keyboard.press("Home")
    await expect(trigger).toHaveText("Germany")
    await page.keyboard.press("End")
    await expect(trigger).toHaveText("China")
    await page.keyboard.press("ArrowUp")
    await expect(trigger).toHaveText("France")
  })

  for (const combo of ["F4", "Alt+ArrowDown", "Enter", "Space"]) {
    test(`${combo} opens the list, Escape closes it`, async ({ page }) => {
      await page.keyboard.press(combo)
      await expect(selectList(page)).toBeVisible()
      await page.keyboard.press("Escape")
      await expect(selectList(page)).toHaveCount(0)
      await expect(page.locator("#country")).toBeFocused()
    })
  }

  test("choosing an option with the keyboard", async ({ page }) => {
    await page.keyboard.press("F4")
    await expect(page.getByRole("option", { name: "Germany" })).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(page.getByRole("option", { name: "France" })).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(page.locator("#country")).toHaveText("France")
  })
})

test("input value state message shows on focus and is announced", async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
  const input = page.locator("#name")
  await input.fill("ab")
  const message = page.getByText("Enter at least 3 characters.")
  await expect(message).toBeVisible()
  await expect(input).toHaveAttribute("aria-invalid", "true")
  const describedBy = await input.getAttribute("aria-describedby")
  expect(await message.getAttribute("id")).toBe(describedBy)
  await page.locator("body").click({ position: { x: 5, y: 5 } })
  await expect(message).toBeHidden()
})

test("button focus ring only appears for keyboard focus", async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
  const save = page.getByRole("button", { name: "Save" })
  await save.click()
  expect(await save.evaluate((el) => getComputedStyle(el, "::after").content)).toBe("none")
  await page.keyboard.press("Shift+Tab")
  await page.keyboard.press("Tab")
  await expect(save).toBeFocused()
  expect(await save.evaluate((el) => getComputedStyle(el, "::after").content)).not.toBe("none")
})
