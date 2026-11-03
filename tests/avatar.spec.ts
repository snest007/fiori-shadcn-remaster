import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
})

test("interactive avatar is a button activated by click, Enter and Space", async ({ page }) => {
  const avatar = page.locator("#avatar-demo").getByRole("button", { name: "John Doe" }).first()
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
  await expect(page.locator("#avatar-demo").getByRole("img", { name: "Avatar XS" })).toBeVisible()
})

test("avatar group (type group) is one button", async ({ page }) => {
  const group = page.locator("#avatar-demo").getByRole("button", { name: /Project team/ })
  const count = page.locator("#avatar-pressed")
  await group.focus()
  await page.keyboard.press("Enter")
  await expect(count).toHaveText("Pressed 1 times")
  // Its avatars are not separately focusable.
  await expect(group.locator("button")).toHaveCount(0)
})

test("individual group: each avatar is its own button", async ({ page }) => {
  await expect(page.locator("#avatar-individual").getByRole("button", { name: "Anna Bauer" })).toBeVisible()
})

test("individual group: one tab stop, arrow keys move between avatars", async ({ page }) => {
  const jd = page.locator("#avatar-individual").getByRole("button", { name: "John Doe" })
  const ab = page.locator("#avatar-individual").getByRole("button", { name: "Anna Bauer" })
  const ck = page.locator("#avatar-individual").getByRole("button", { name: "Chen Kai" })
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


test("overflow reserves its width, hides the trailing items and responds to resize", async ({ page }) => {
  const group = page.locator("#avatar-overflow-individual")
  const overflow = group.locator("[data-avatar-group-overflow]")
  await expect(overflow.locator("[data-text]")).toHaveAttribute("data-text", "+5")
  await expect(group).toHaveAttribute("aria-label", "Individual avatars. 1 displayed, 5 hidden. Press ARROW keys to move.")
  await expect(group.locator(":scope > [data-slot=avatar]:not([hidden])")).toHaveCount(1)
  await expect(group.locator(":scope > [data-slot=avatar][hidden]")).toHaveCount(5)
  await page.locator("#avatar-resize").click()
  await expect(overflow).toBeHidden()
  await expect(group.locator(":scope > [data-slot=avatar]:not([hidden])")).toHaveCount(6)
  await page.locator("#avatar-resize").click()
  await expect(overflow.locator("[data-text]")).toHaveAttribute("data-text", "+5")
  await expect(group.locator(":scope > [data-slot=avatar]:not([hidden])")).toHaveCount(1)
})

for (const action of ["click", "Enter", "Space"] as const) {
  test(`overflow ${action} sends the original hidden items and opens the caller Popover`, async ({ page }) => {
    const group = page.locator("#avatar-overflow-individual")
    const overflow = group.getByRole("button", { name: "Activate for complete list." })
    await expect(overflow.locator("[data-text]")).toHaveAttribute("data-text", "+5")
    if (action === "click") await overflow.click()
    else {
      await overflow.focus()
      await expect(overflow).toBeFocused()
      await page.keyboard.press(action)
    }
    await expect(page.locator("#avatar-overflow-events")).toHaveText("Overflow activated 1 times")
    await expect(page.locator("#avatar-overflow-detail")).toHaveText("Overflow: button")
    const popover = page.locator("#avatar-overflow-popover")
    await expect(popover).toBeVisible()
    await expect(popover.locator("li")).toHaveCount(5)
    await expect(popover.locator("li > span")).toHaveText(["Anna Bauer", "Chen Kai", "Dora Evans", "Ethan Ford", "Fiona Gray"])
    await page.keyboard.press("Escape")
    await expect(popover).toBeHidden()
    await expect(overflow).toBeFocused()
  })
}

test("individual avatars rove while overflow remains a separate Tab stop", async ({ page }) => {
  const group = page.locator("#avatar-overflow-individual")
  const first = group.getByRole("button", { name: "John Doe" })
  const overflow = group.getByRole("button", { name: "Activate for complete list." })
  await expect(overflow.locator("[data-text]")).toHaveAttribute("data-text", "+5")
  await expect(first).toHaveAttribute("tabindex", "0")
  await expect(overflow).toHaveAttribute("tabindex", "0")
  await first.focus()
  await page.keyboard.press("ArrowRight")
  await expect(first).toBeFocused()
  await page.keyboard.press("End")
  await expect(first).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(overflow).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(first).toBeFocused()
  await expect(group.locator("[tabindex='0']")).toHaveCount(2)
})

test("resizing moves focus from a hidden avatar to overflow and restores one tab stop when widened", async ({ page }) => {
  const group = page.locator("#avatar-overflow-individual")
  // DOM width changes exercise ResizeObserver without a button stealing keyboard focus.
  await group.locator("..").evaluate((host) => { (host as HTMLElement).style.width = "24rem" })
  const last = group.getByRole("button", { name: "Fiona Gray" })
  await expect(last).toBeVisible()
  await last.focus()
  await expect(last).toBeFocused()
  await group.locator("..").evaluate((host) => { (host as HTMLElement).style.width = "9rem" })
  const overflow = group.getByRole("button", { name: "Activate for complete list." })
  await expect(overflow).toBeFocused()
  await expect(group.locator("[tabindex='0']")).toHaveCount(2)
  await group.locator("..").evaluate((host) => { (host as HTMLElement).style.width = "24rem" })
  await expect(overflow).toBeHidden()
  await expect(last).toBeFocused()
  await expect(group.locator("[tabindex='0']")).toHaveCount(1)
})

test("group overflow is part of the single group button and reports group activation", async ({ page }) => {
  const group = page.locator("#avatar-overflow-group")
  await expect(group.locator("[data-avatar-group-overflow] [data-text]")).toHaveAttribute("data-text", "+3")
  await expect(group.locator("button")).toHaveCount(0)
  await group.focus()
  await page.keyboard.press("Enter")
  await expect(page.locator("#avatar-overflow-detail")).toHaveText("Avatar: div")
  await expect(page.locator("#avatar-group-events")).toHaveText("Group activated 1 times")
  await expect(page.locator("#avatar-overflow-events")).toHaveText("Overflow activated 0 times")
  await page.keyboard.press("Space")
  await expect(page.locator("#avatar-overflow-detail")).toHaveText("Avatar: div")
  await expect(page.locator("#avatar-group-events")).toHaveText("Group activated 2 times")
  await expect(page.locator("#avatar-overflow-events")).toHaveText("Overflow activated 0 times")
})

test("custom overflow preserves its click handler and receives Tab keyboard activation", async ({ page }) => {
  const group = page.locator("#avatar-overflow-custom")
  const first = group.getByRole("button", { name: "John Doe" })
  const custom = group.getByRole("button", { name: "All" })
  const status = page.locator("#avatar-custom-events")
  await expect(group).toHaveAttribute("aria-label", "Team members. 1 visible and 5 remaining. Use direction keys.")
  await first.focus()
  await page.keyboard.press("Tab")
  await expect(custom).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(status).toHaveText("Custom 1; overflow 1; hidden Anna Bauer, Chen Kai, Dora Evans, Ethan Ford, Fiona Gray")
  await page.keyboard.press("Space")
  await expect(status).toHaveText("Custom 2; overflow 2; hidden Anna Bauer, Chen Kai, Dora Evans, Ethan Ford, Fiona Gray")
  await custom.click()
  await expect(status).toHaveText("Custom 3; overflow 3; hidden Anna Bauer, Chen Kai, Dora Evans, Ethan Ford, Fiona Gray")
  await group.locator("..").evaluate((host) => { (host as HTMLElement).style.width = "24rem" })
  await expect(group).toHaveAttribute("aria-label", "Team members. 6 visible and 0 remaining. Use direction keys.")
  await expect(custom).toBeVisible()
  await custom.click()
  await expect(status).toHaveText("Custom 4; overflow 4; hidden ")
})

test("UI5 oracle uses a neutral first-avatar-sized overflow, caps +N at 99, and retains custom slots", async ({ page }) => {
  await page.goto("/ui5.html?only=avatar")
  await page.waitForSelector("html[data-ready=true]")
  const large = page.locator('[data-fixture="avatar-group-overflow-group-l"] ui5-avatar-group')
  await expect.poll(() => large.evaluate((group: any) => group.hiddenItems.length)).toBe(2)
  const oracle = await large.evaluate((group: any) => {
    const button = group.shadowRoot.querySelector(".ui5-avatar-group-overflow-btn")
    return { text: button.textContent, design: button.design, width: button.offsetWidth, size: group.firstAvatarSize }
  })
  expect(oracle).toEqual({ text: "+2", design: "Default", width: 80, size: "L" })
  const capped = page.locator('[data-fixture="avatar-group-overflow-cap"] ui5-avatar-group')
  await expect.poll(() => capped.evaluate((group: any) => group.shadowRoot.querySelector(".ui5-avatar-group-overflow-btn").textContent)).toBe("+99")
  const custom = page.locator('[data-fixture="avatar-group-overflow-custom-fitting"] ui5-avatar-group')
  await expect.poll(() => custom.evaluate((group: any) => group.hiddenItems.length)).toBe(0)
  await expect(custom.locator('ui5-button[slot="overflowButton"]')).toBeVisible()
})


test("individual avatar event identifies the avatar without invoking overflow", async ({ page }) => {
  const first = page.locator("#avatar-overflow-individual").getByRole("button", { name: "John Doe" })
  await first.click()
  await expect(page.locator("#avatar-overflow-detail")).toHaveText("Avatar: avatar")
  await expect(page.locator("#avatar-group-events")).toHaveText("Group activated 1 times")
  await expect(page.locator("#avatar-overflow-events")).toHaveText("Overflow activated 0 times")
})

test("custom group overflow remains visible decoration within one group Tab stop", async ({ page }) => {
  const group = page.locator("#avatar-custom-group")
  await expect(group).toHaveAttribute("aria-label", "All team members")
  await expect(group.getByRole("button", { name: "All" })).toHaveCount(0)
  await expect(group.locator("[data-avatar-group-overflow]")).toBeVisible()
  await group.focus()
  await page.keyboard.press("Enter")
  await expect(page.locator("#avatar-group-events")).toHaveText("Group activated 1 times")
  await expect(page.locator("#avatar-custom-events")).toHaveText("Custom 0; overflow 0; hidden ")
})
