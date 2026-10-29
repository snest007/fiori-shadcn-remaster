import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
})

test("interactive avatar is a button activated by click, Enter and Space", async ({ page }) => {
  const avatar = page.getByRole("button", { name: "John Doe" }).first()
  const count = page.locator("#avatar-pressed")
  await avatar.click()
  await expect(count).toHaveText("Pressed 1 times")
  await avatar.focus()
  await page.keyboard.press("Enter")
  await expect(count).toHaveText("Pressed 2 times")
  await page.keyboard.press("Space")
  await expect(count).toHaveText("Pressed 3 times")
})

test("non-interactive avatar is an image named 'Avatar <initials>'", async ({ page }) => {
  await expect(page.getByRole("img", { name: "Avatar XS" })).toBeVisible()
})

test("avatar group (type group) is one button", async ({ page }) => {
  const group = page.getByRole("button", { name: /Project team/ })
  const count = page.locator("#avatar-pressed")
  await group.focus()
  await page.keyboard.press("Enter")
  await expect(count).toHaveText("Pressed 1 times")
  // Its avatars are not separately focusable.
  await expect(group.locator("button")).toHaveCount(0)
})

test("individual group: each avatar is its own button", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Anna Bauer" })).toBeVisible()
})

test("individual group: one tab stop, arrow keys move between avatars", async ({ page }) => {
  const jd = page.getByRole("button", { name: "John Doe" }).nth(1)
  const ab = page.getByRole("button", { name: "Anna Bauer" })
  const ck = page.getByRole("button", { name: "Chen Kai" })
  await expect(jd).toHaveAttribute("tabindex", "0")
  await expect(ab).toHaveAttribute("tabindex", "-1")
  await jd.focus()
  await page.keyboard.press("ArrowRight")
  await expect(ab).toBeFocused()
  await page.keyboard.press("End")
  await expect(ck).toBeFocused()
  await page.keyboard.press("ArrowLeft")
  await expect(ab).toBeFocused()
  await page.keyboard.press("Home")
  await expect(jd).toBeFocused()
})
