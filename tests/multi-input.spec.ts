import { expect, test, type Page } from "@playwright/test"

const input = (page: Page) => page.locator("#multi-input-countries")
const field = (page: Page) => page.locator('[data-slot="multi-input"]').filter({ has: input(page) })
const token = (page: Page, text: string) => field(page).locator('[role="option"]', { hasText: text })
const suggestions = (page: Page) => page.locator('[data-slot="multi-input-suggestions"]')
const tokensText = (page: Page) => page.getByTestId("multi-input-tokens")

test.describe("MultiInput (Fiori model)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/index.html`)
    await page.waitForSelector("html[data-ready=true]")
  })

  test("ARIA: roledescription, combobox for suggestions, token count", async ({ page }) => {
    await expect(input(page)).toHaveAttribute("aria-roledescription", "Multi Value Input")
    await expect(input(page)).toHaveAttribute("role", "combobox")
    await expect(input(page)).toHaveAttribute("aria-expanded", "false")
    const described = (await input(page).getAttribute("aria-describedby"))!.split(" ")
    const texts = await Promise.all(described.map((id) => page.locator(`[id="${id}"]`).textContent()))
    expect(texts).toContain("Contains 2 tokens")
    expect(texts).toContain("Value help available")
    await expect(field(page).getByRole("listbox")).toHaveCount(1)
    await expect(field(page).getByRole("button", { name: "Show Value Help" })).toBeVisible()
  })

  test("Enter turns the text into a token; leaving the field does too", async ({ page }) => {
    await input(page).click()
    await page.keyboard.type("Mexico")
    await page.keyboard.press("Enter")
    await expect(tokensText(page)).toHaveText("Germany, France, Mexico")
    await expect(input(page)).toHaveValue("")
    await page.keyboard.type("Peru")
    await page.keyboard.press("Tab")
    await expect(tokensText(page)).toHaveText("Germany, France, Mexico, Peru")
  })

  test("suggestions: typing opens and autocompletes, ↓/↑ walk, Enter chooses", async ({ page }) => {
    await input(page).click()
    await page.keyboard.type("a")
    await expect(suggestions(page)).toBeVisible()
    await expect(input(page)).toHaveAttribute("aria-expanded", "true")
    await expect(input(page)).toHaveValue("Argentina") // inline autocomplete
    await expect(suggestions(page).getByRole("option")).toHaveText(["Argentina", "Australia", "Austria"])
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    await expect(input(page)).toHaveValue("Australia")
    const active = await input(page).getAttribute("aria-activedescendant")
    await expect(page.locator(`[id="${active}"]`)).toHaveText("Australia")
    await expect(page.locator(`[id="${active}"]`)).toHaveAttribute("aria-selected", "true")
    await page.keyboard.press("ArrowUp")
    await page.keyboard.press("ArrowUp") // back to the typed text
    await expect(input(page)).toHaveValue("a")
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")
    await expect(suggestions(page)).toHaveCount(0)
    await expect(tokensText(page)).toHaveText("Germany, France, Argentina")
  })

  test("Escape closes the suggestions and restores the typed text", async ({ page }) => {
    await input(page).click()
    await page.keyboard.type("b")
    await page.keyboard.press("ArrowDown")
    await expect(input(page)).toHaveValue("Belgium")
    await page.keyboard.press("Escape")
    await expect(suggestions(page)).toHaveCount(0)
    await expect(input(page)).toHaveValue("b")
  })

  test("clicking a suggestion chooses it and keeps focus", async ({ page }) => {
    await input(page).click()
    await page.keyboard.type("j")
    await suggestions(page).getByRole("option", { name: "Japan" }).click()
    await expect(tokensText(page)).toHaveText("Germany, France, Japan")
    await expect(input(page)).toBeFocused()
  })

  test("Backspace in the empty field focuses the last token; again deletes it", async ({ page }) => {
    await input(page).click()
    await page.keyboard.press("Backspace")
    await expect(token(page, "France")).toBeFocused()
    await page.keyboard.press("Backspace")
    await expect(tokensText(page)).toHaveText("Germany")
    await expect(token(page, "Germany")).toBeFocused()
    await page.keyboard.press("Backspace")
    await expect(tokensText(page)).toHaveText("—")
    await expect(input(page)).toBeFocused()
  })

  test("← at the start and Home move into the tokens; → / End on the last token return", async ({ page }) => {
    await input(page).click()
    await page.keyboard.press("ArrowLeft")
    await expect(token(page, "France")).toBeFocused()
    await page.keyboard.press("ArrowLeft")
    await expect(token(page, "Germany")).toBeFocused()
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowRight")
    await expect(input(page)).toBeFocused()
    await page.keyboard.press("Home")
    await expect(token(page, "Germany")).toBeFocused()
    await page.keyboard.press("End")
    await expect(token(page, "France")).toBeFocused()
    await page.keyboard.press("End")
    await expect(input(page)).toBeFocused()
  })

  test("Ctrl+A in the tokens selects all; Delete removes them and focuses the input", async ({ page }) => {
    await input(page).click()
    await page.keyboard.press("Backspace")
    await expect(token(page, "France")).toBeFocused()
    await page.keyboard.press("ControlOrMeta+a")
    await expect(field(page).locator('[aria-selected="true"]')).toHaveCount(2)
    await page.keyboard.press("Delete")
    await expect(tokensText(page)).toHaveText("—")
    await expect(input(page)).toBeFocused()
  })

  test("F4, Alt+↓ and the icon fire value help", async ({ page }) => {
    await input(page).click()
    await page.keyboard.press("F4")
    await expect(page.getByTestId("multi-input-value-help-count")).toHaveText("1")
    await page.keyboard.press("Alt+ArrowDown")
    await expect(page.getByTestId("multi-input-value-help-count")).toHaveText("2")
    await field(page).getByRole("button", { name: "Show Value Help" }).click()
    await expect(page.getByTestId("multi-input-value-help-count")).toHaveText("3")
    await expect(input(page)).toBeFocused()
  })

  test("token delete icon removes the token", async ({ page }) => {
    await token(page, "Germany").locator(".fiori-token__icon").click()
    await expect(tokensText(page)).toHaveText("France")
  })

  test("unfocused, many tokens collapse to 'n more' which opens the list of all tokens", async ({ page }) => {
    await input(page).click()
    for (const t of ["Mexico", "Peru", "Chile", "Uruguay", "Paraguay"]) {
      await page.keyboard.type(t)
      await page.keyboard.press("Enter")
    }
    await expect(field(page).locator(".fiori-tokenizer__more")).toHaveCount(0) // focused: expanded
    await page.locator("body").click({ position: { x: 5, y: 5 } })
    const more = field(page).locator(".fiori-tokenizer__more")
    await expect(more).toBeVisible()
    await expect(more).toHaveText(/\d+ more/)
    await more.click()
    const list = page.locator(".fiori-tokenizer__list")
    await expect(list.locator("li")).toHaveCount(7)
    await list.locator("li").first().getByRole("button", { name: "Delete" }).click()
    await expect(tokensText(page)).toHaveText("France, Mexico, Peru, Chile, Uruguay, Paraguay")
  })

  test("read-only: tokens have no delete icon and Backspace doesn't delete", async ({ page }) => {
    const ro = page.locator("#multi-input-readonly")
    const roField = page.locator('[data-slot="multi-input"]').filter({ has: ro })
    await expect(roField.locator(".fiori-token__icon")).toHaveCount(0)
    await ro.focus()
    await page.keyboard.press("Backspace")
    await expect(roField.locator('[role="option"]').last()).toBeFocused()
    await page.keyboard.press("Backspace")
    await expect(roField.locator('[role="option"]')).toHaveCount(2)
  })
})
