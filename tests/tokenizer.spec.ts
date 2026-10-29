import { expect, test, type Page } from "@playwright/test"

const tokenizer = (page: Page) => page.locator("#tokenizer-demo")
const token = (page: Page, text: string) => tokenizer(page).getByRole("option", { name: text, exact: true })
// Collapsed ("n more") tokens are display:none, so getByRole would skip them.
const tokens = (page: Page) => tokenizer(page).locator('[role="option"]')
const visibleTokens = (page: Page) => tokenizer(page).locator('[role="option"]:visible')
const more = (page: Page) => tokenizer(page).locator(".fiori-tokenizer__more")

test.describe("Tokenizer (Fiori model)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/index.html`)
    await page.waitForSelector("html[data-ready=true]")
  })

  test("ARIA: listbox of options with one tab stop", async ({ page }) => {
    await expect(tokenizer(page).getByRole("listbox", { name: "Countries" })).toBeVisible()
    await expect(tokens(page)).toHaveCount(7)
    await expect(token(page, "Argentina")).toHaveAttribute("tabindex", "0")
    await expect(token(page, "Bulgaria")).toHaveAttribute("tabindex", "-1")
    await expect(token(page, "Argentina")).toHaveAttribute("aria-selected", "false")
    await expect(token(page, "Argentina")).toHaveAttribute("aria-description", "Token Deletable")
  })

  test("collapses into 'n more' when not focused, expands on focus", async ({ page }) => {
    await expect(more(page)).toBeVisible()
    const hidden = 7 - (await visibleTokens(page).count())
    expect(hidden).toBeGreaterThan(0)
    await expect(more(page)).toHaveText(`${hidden} more`)
    await token(page, "Argentina").focus()
    await expect(more(page)).toHaveCount(0)
    await expect(visibleTokens(page)).toHaveCount(7)
    await page.locator("body").click({ position: { x: 5, y: 5 } })
    await expect(more(page)).toBeVisible()
  })

  test("arrow keys, Home and End move the focus", async ({ page }) => {
    await token(page, "Argentina").focus()
    await page.keyboard.press("ArrowRight")
    await expect(token(page, "Bulgaria")).toBeFocused()
    await expect(token(page, "Bulgaria")).toHaveAttribute("tabindex", "0")
    await page.keyboard.press("ArrowDown")
    await expect(token(page, "Canada")).toBeFocused()
    await page.keyboard.press("ArrowLeft")
    await page.keyboard.press("ArrowUp")
    await expect(token(page, "Argentina")).toBeFocused()
    await page.keyboard.press("ArrowLeft") // first: stays
    await expect(token(page, "Argentina")).toBeFocused()
    await page.keyboard.press("End")
    await expect(token(page, "Greece")).toBeFocused()
    await page.keyboard.press("Home")
    await expect(token(page, "Argentina")).toBeFocused()
  })

  test("Space toggles, Shift+arrow extends, Ctrl+A toggles all, Escape deselects", async ({ page }) => {
    await token(page, "Argentina").focus()
    await page.keyboard.press("Space")
    await expect(token(page, "Argentina")).toHaveAttribute("aria-selected", "true")
    await expect(page.getByTestId("tokenizer-selected")).toHaveText("Argentina")
    await page.keyboard.press("Space")
    await expect(token(page, "Argentina")).toHaveAttribute("aria-selected", "false")
    await page.keyboard.press("Shift+ArrowRight")
    await expect(page.getByTestId("tokenizer-selected")).toHaveText("Argentina, Bulgaria")
    await expect(token(page, "Bulgaria")).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(page.getByTestId("tokenizer-selected")).toHaveText("—")
    await page.keyboard.press("ControlOrMeta+a")
    await expect(tokenizer(page).locator('[aria-selected="true"]')).toHaveCount(7)
    await page.keyboard.press("ControlOrMeta+a")
    await expect(tokenizer(page).locator('[aria-selected="true"]')).toHaveCount(0)
  })

  test("click selects a single token; Ctrl+click adds; Shift+click selects a range", async ({ page }) => {
    await token(page, "Argentina").click()
    await expect(page.getByTestId("tokenizer-selected")).toHaveText("Argentina")
    await token(page, "Canada").click({ modifiers: ["ControlOrMeta"] })
    await expect(page.getByTestId("tokenizer-selected")).toHaveText("Argentina, Canada")
    await token(page, "Denmark").click({ modifiers: ["Shift"] })
    await expect(page.getByTestId("tokenizer-selected")).toHaveText("Argentina, Bulgaria, Canada, Denmark")
  })

  test("Backspace deletes the focused token and focuses the previous one; Delete the next", async ({ page }) => {
    await token(page, "Argentina").focus()
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowRight") // Canada
    await page.keyboard.press("Backspace")
    await expect(token(page, "Canada")).toHaveCount(0)
    await expect(token(page, "Bulgaria")).toBeFocused()
    await page.keyboard.press("Delete")
    await expect(token(page, "Bulgaria")).toHaveCount(0)
    await expect(token(page, "Denmark")).toBeFocused()
    await expect(page.getByTestId("tokenizer-count")).toHaveText("5")
  })

  test("Delete removes all selected tokens and focuses the next unselected one", async ({ page }) => {
    await token(page, "Argentina").focus()
    await page.keyboard.press("Shift+ArrowRight")
    await page.keyboard.press("Shift+ArrowRight") // Argentina..Canada selected, focus on Canada
    await page.keyboard.press("Delete")
    await expect(page.getByTestId("tokenizer-count")).toHaveText("4")
    await expect(token(page, "Denmark")).toBeFocused()
  })

  test("the delete icon removes the token without selecting it", async ({ page }) => {
    await token(page, "Argentina").focus()
    await token(page, "Bulgaria").locator(".fiori-token__icon").click()
    await expect(token(page, "Bulgaria")).toHaveCount(0)
    await expect(page.getByTestId("tokenizer-selected")).toHaveText("—")
  })

  test("'n more' opens the list of all tokens; its delete buttons remove tokens", async ({ page }) => {
    await more(page).click()
    const list = page.locator(".fiori-tokenizer__list")
    await expect(list).toBeVisible()
    await expect(list.locator("li")).toHaveCount(7)
    await expect(list.locator("li").first()).toBeFocused()
    await list.locator("li").nth(1).getByRole("button", { name: "Delete" }).click()
    await expect(list.locator("li")).toHaveCount(6)
    await expect(page.getByTestId("tokenizer-count")).toHaveText("6")
    await page.keyboard.press("Escape")
    await expect(list).toHaveCount(0)
  })

  test("Ctrl+I on a token opens the list; Escape returns to the token", async ({ page }) => {
    await token(page, "Argentina").focus()
    await page.keyboard.press("ControlOrMeta+i")
    const list = page.locator(".fiori-tokenizer__list")
    await expect(list).toBeVisible()
    await expect(list.locator("li").first()).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(list.locator("li").nth(1)).toBeFocused()
    await page.keyboard.press("Delete")
    await expect(page.getByTestId("tokenizer-count")).toHaveText("6")
    await page.keyboard.press("Escape")
    await expect(list).toHaveCount(0)
    await expect(token(page, "Argentina")).toBeFocused()
  })

  test("a standalone token toggles on click and Space", async ({ page }) => {
    const t = page.locator("#tokenizer-demo-single").getByRole("option", { name: "Standalone" })
    await t.click()
    await expect(t).toHaveAttribute("aria-selected", "true")
    await t.press("Space")
    await expect(t).toHaveAttribute("aria-selected", "false")
    await expect(page.locator("#tokenizer-demo-single").getByRole("option", { name: "Read only" }).locator(".fiori-token__icon")).toHaveCount(0)
  })
})
