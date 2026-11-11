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

for (const custom of [false, true]) {
  test(`${custom ? "custom" : "default"} overflow cancels shifted and interrupted Space without suppressing plain activation`, async ({ page }) => {
    const demo = page.locator("#avatar-demo")
    const group = demo.locator(custom ? "#avatar-overflow-custom" : "#avatar-overflow-individual")
    const overflow = group.getByRole("button", { name: custom ? "All" : "Activate for complete list." })
    const status = demo.locator(custom ? "#avatar-custom-events" : "#avatar-overflow-events")
    const initialStatus = custom ? "Custom 0; overflow 0; hidden " : "Overflow activated 0 times"
    await overflow.focus()
    await expect(overflow).toBeFocused()

    await page.keyboard.press("Shift+Space")
    await expect(status).toHaveText(initialStatus)
    await expect(demo.locator("#avatar-overflow-popover")).toBeHidden()

    await page.keyboard.down("Space")
    await page.keyboard.press("Escape")
    await expect(overflow).toBeFocused()
    await page.keyboard.up("Space")
    await expect(status).toHaveText(initialStatus)

    // Button.js retains cancellation when Shift is released while Space is still held.
    await page.keyboard.down("Space")
    await page.keyboard.press("Shift")
    await expect(overflow).toBeFocused()
    await page.keyboard.up("Space")
    await expect(status).toHaveText(initialStatus)

    for (const [index, key] of ["Space", "Enter"].entries()) {
      await page.keyboard.press(key)
      await expect(status).toHaveText(custom
        ? `Custom ${index + 1}; overflow ${index + 1}; hidden Anna Bauer, Chen Kai, Dora Evans, Ethan Ford, Fiona Gray`
        : `Overflow activated ${index + 1} times`)
      if (!custom) {
        const popover = demo.locator("#avatar-overflow-popover")
        await expect(popover).toBeVisible()
        await page.keyboard.press("Escape")
        await expect(popover).toBeHidden()
        await expect(overflow).toBeFocused()
      }
    }

    await page.goto(`/ui5.html?only=avatar-group-overflow-${custom ? "custom" : "individual-s"}`)
    await page.waitForSelector("html[data-ready=true]")
    const oracle = page.locator(`[data-fixture="avatar-group-overflow-${custom ? "custom" : "individual-s"}"] ui5-avatar-group`)
    await oracle.evaluate((element) => {
      element.setAttribute("data-avatar-test-clicks", "0")
      // A custom Button's ui5-click also bubbles; count the AvatarGroup event only.
      element.addEventListener("ui5-click", (event) => {
        if (event.target === element) element.setAttribute("data-avatar-test-clicks", `${Number(element.getAttribute("data-avatar-test-clicks")) + 1}`)
      })
    })
    const oracleButton = oracle.locator(custom ? 'ui5-button[slot="overflowButton"]' : ".ui5-avatar-group-overflow-btn").locator("button")
    await oracleButton.focus()
    await expect(oracleButton).toBeFocused()
    await page.keyboard.press("Shift+Space")
    await expect(oracle).toHaveAttribute("data-avatar-test-clicks", "0")
    await page.keyboard.down("Space")
    await page.keyboard.press("Escape")
    await page.keyboard.up("Space")
    await expect(oracle).toHaveAttribute("data-avatar-test-clicks", "0")
    await page.keyboard.down("Space")
    await page.keyboard.press("Shift")
    await page.keyboard.up("Space")
    await expect(oracle).toHaveAttribute("data-avatar-test-clicks", "0")
    await page.keyboard.press("Space")
    await expect(oracle).toHaveAttribute("data-avatar-test-clicks", "1")
    await page.keyboard.press("Enter")
    await expect(oracle).toHaveAttribute("data-avatar-test-clicks", "2")
  })

  test(`${custom ? "custom" : "default"} overflow retains UI5 Button native behavior for other modifiers`, async ({ page }) => {
    const combinations = ["Shift+Enter", "Control+Enter", "Control+Space", "Alt+Enter", "Alt+Space", "Meta+Enter", "Meta+Space"]
    await page.goto(`/ui5.html?only=avatar-group-overflow-${custom ? "custom" : "individual-s"}`)
    await page.waitForSelector("html[data-ready=true]")
    const oracle = page.locator(`[data-fixture="avatar-group-overflow-${custom ? "custom" : "individual-s"}"] ui5-avatar-group`)
    await oracle.evaluate((element) => {
      element.setAttribute("data-avatar-test-clicks", "0")
      element.addEventListener("ui5-click", (event) => {
        if (event.target === element) element.setAttribute("data-avatar-test-clicks", `${Number(element.getAttribute("data-avatar-test-clicks")) + 1}`)
      })
    })
    const oracleButton = oracle.locator(custom ? 'ui5-button[slot="overflowButton"]' : ".ui5-avatar-group-overflow-btn").locator("button")
    await oracleButton.focus()
    await expect(oracleButton).toBeFocused()
    const counts: number[] = []
    for (const key of combinations) {
      await page.keyboard.press(key)
      // Button.js leaves these combinations to the browser; read the real oracle
      // after the keyboard round trip instead of inventing activation for every modifier.
      counts.push(Number(await oracle.getAttribute("data-avatar-test-clicks")))
    }

    await page.goto("/index.html")
    await page.waitForSelector("html[data-ready=true]")
    const demo = page.locator("#avatar-demo")
    const overflow = demo.locator(custom ? "#avatar-overflow-custom" : "#avatar-overflow-individual")
      .getByRole("button", { name: custom ? "All" : "Activate for complete list." })
    const status = demo.locator(custom ? "#avatar-custom-events" : "#avatar-overflow-events")
    await overflow.focus()
    await expect(overflow).toBeFocused()
    for (const [index, key] of combinations.entries()) {
      await page.keyboard.press(key)
      const count = counts[index]
      await expect(status, key).toHaveText(custom
        ? `Custom ${count}; overflow ${count}; hidden ${count ? "Anna Bauer, Chen Kai, Dora Evans, Ethan Ford, Fiona Gray" : ""}`
        : `Overflow activated ${count} times`)
      const activated = count > (counts[index - 1] ?? 0)
      if (!custom && activated) {
        const popover = demo.locator("#avatar-overflow-popover")
        await expect(popover).toBeVisible()
        await page.keyboard.press("Escape")
        await expect(popover).toBeHidden()
        await expect(overflow).toBeFocused()
      }
    }
  })
}

test("group root retains its distinct UI5 Space path when Escape interrupts a held Space", async ({ page }) => {
  const group = page.locator("#avatar-demo #avatar-overflow-group")
  await group.focus()
  await expect(group).toBeFocused()
  await page.keyboard.down("Space")
  await page.keyboard.press("Escape")
  await page.keyboard.up("Space")
  // AvatarGroup.js _onkeydown/_onkeyup has no Button.js cancellation state.
  await expect(page.locator("#avatar-demo #avatar-group-events")).toHaveText("Group activated 1 times")
  await expect(page.locator("#avatar-demo #avatar-overflow-events")).toHaveText("Overflow activated 0 times")

  await page.goto("/ui5.html?only=avatar-group-overflow-group-s")
  await page.waitForSelector("html[data-ready=true]")
  const oracle = page.locator('[data-fixture="avatar-group-overflow-group-s"] ui5-avatar-group')
  await oracle.evaluate((element) => {
    element.setAttribute("data-avatar-test-clicks", "0")
    element.addEventListener("ui5-click", (event) => {
      if (event.target === element) element.setAttribute("data-avatar-test-clicks", `${Number(element.getAttribute("data-avatar-test-clicks")) + 1}`)
    })
  })
  const oracleRoot = oracle.locator(".ui5-avatar-group-items")
  await oracleRoot.focus()
  await expect(oracleRoot).toBeFocused()
  await page.keyboard.down("Space")
  await page.keyboard.press("Escape")
  await page.keyboard.up("Space")
  await expect(oracle).toHaveAttribute("data-avatar-test-clicks", "1")
})

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

test("resizing a focused avatar or overflow releases focus to body, matching UI5", async ({ page }) => {
  const group = page.locator("#avatar-demo #avatar-overflow-individual")
  // DOM width changes exercise ResizeObserver without a button stealing keyboard focus.
  await group.locator("..").evaluate((host) => { (host as HTMLElement).style.width = "24rem" })
  const last = group.getByRole("button", { name: "Fiona Gray" })
  await expect(last).toBeVisible()
  await last.focus()
  await expect(last).toBeFocused()
  await group.locator("..").evaluate((host) => { (host as HTMLElement).style.width = "9rem" })
  const overflow = group.getByRole("button", { name: "Activate for complete list." })
  await expect(last).toBeHidden()
  await expect(page.locator("body")).toBeFocused()
  await expect(group.locator("[tabindex='0']")).toHaveCount(2)
  await overflow.focus()
  await expect(overflow).toBeFocused()
  await group.locator("..").evaluate((host) => { (host as HTMLElement).style.width = "24rem" })
  await expect(overflow).toBeHidden()
  await expect(page.locator("body")).toBeFocused()
  await expect(group.locator("[tabindex='0']")).toHaveCount(1)

  await page.goto("/ui5.html?only=avatar-group-overflow-individual-s")
  await page.waitForSelector("html[data-ready=true]")
  const oracle = page.locator('[data-fixture="avatar-group-overflow-individual-s"] ui5-avatar-group')
  await oracle.evaluate((element) => { element.style.width = "24rem" })
  const oracleLast = oracle.locator("ui5-avatar").last().locator(".ui5-avatar-root")
  await expect(oracleLast).toBeVisible()
  await oracleLast.focus()
  await expect(oracleLast).toBeFocused()
  await oracle.evaluate((element) => { element.style.width = "9rem" })
  await expect(oracleLast).toBeHidden()
  await expect(page.locator("body")).toBeFocused()
  const oracleOverflow = oracle.locator(".ui5-avatar-group-overflow-btn").locator("button")
  // AvatarGroupTemplate unhides overflow asynchronously after _setHiddenItems hides avatars.
  await expect(oracleOverflow).toBeVisible()
  await oracleOverflow.focus()
  await expect(oracleOverflow).toBeFocused()
  await oracle.evaluate((element) => { element.style.width = "24rem" })
  await expect(oracleOverflow).toBeHidden()
  await expect(page.locator("body")).toBeFocused()
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
  await page.goto("/ui5.html?only=avatar-group-overflow-group-l")
  await page.waitForSelector("html[data-ready=true]")
  const large = page.locator('[data-fixture="avatar-group-overflow-group-l"] ui5-avatar-group')
  await expect.poll(() => large.evaluate((group: any) => group.hiddenItems.length)).toBe(2)
  const oracle = await large.evaluate((group: any) => {
    const button = group.shadowRoot.querySelector(".ui5-avatar-group-overflow-btn")
    return { text: button.textContent, design: button.design, width: button.offsetWidth, size: group.firstAvatarSize }
  })
  expect(oracle).toEqual({ text: "+2", design: "Default", width: 80, size: "L" })
  await page.goto("/ui5.html?only=avatar-group-overflow-cap")
  await page.waitForSelector("html[data-ready=true]")
  const capped = page.locator('[data-fixture="avatar-group-overflow-cap"] ui5-avatar-group')
  await expect.poll(() => capped.evaluate((group: any) => group.shadowRoot.querySelector(".ui5-avatar-group-overflow-btn").textContent)).toBe("+99")
  await page.goto("/ui5.html?only=avatar-group-overflow-custom-fitting")
  await page.waitForSelector("html[data-ready=true]")
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

const avatarModifiers = ["Shift", "Control", "Alt", "Meta"] as const

test("group activation ignores modified Enter and Space, matching UI5 Keys", async ({ page }) => {
  const group = page.locator("#avatar-overflow-group")
  const events = page.locator("#avatar-group-events")
  await group.focus()
  await expect(group).toBeFocused()
  for (const modifier of avatarModifiers) {
    for (const key of ["Enter", "Space"]) {
      await page.keyboard.press(`${modifier}+${key}`)
      await page.evaluate(() => 0)
      await expect(events).toHaveText("Group activated 0 times")
    }
  }
  await page.keyboard.press("Enter")
  await expect(events).toHaveText("Group activated 1 times")
  await page.keyboard.press("Space")
  await expect(events).toHaveText("Group activated 2 times")

  await page.goto("/ui5.html?only=avatar-group")
  await page.waitForSelector("html[data-ready=true]")
  const oracle = page.locator('[data-fixture="avatar-group"] ui5-avatar-group')
  await oracle.evaluate((element) => {
    element.setAttribute("data-avatar-test-clicks", "0")
    element.addEventListener("ui5-click", () => element.setAttribute("data-avatar-test-clicks", `${Number(element.getAttribute("data-avatar-test-clicks")) + 1}`))
  })
  const oracleFocus = oracle.locator(".ui5-avatar-group-items")
  await oracleFocus.focus()
  await expect(oracleFocus).toBeFocused()
  for (const modifier of avatarModifiers) {
    for (const key of ["Enter", "Space"]) {
      await page.keyboard.press(`${modifier}+${key}`)
      await page.evaluate(() => 0)
      await expect(oracle).toHaveAttribute("data-avatar-test-clicks", "0")
    }
  }
  await page.keyboard.press("Enter")
  await expect(oracle).toHaveAttribute("data-avatar-test-clicks", "1")
  await page.keyboard.press("Space")
  await expect(oracle).toHaveAttribute("data-avatar-test-clicks", "2")
})

test("individual avatars reject modified activation and navigation, matching UI5 Avatar and ItemNavigation", async ({ page }) => {
  const group = page.locator("#avatar-overflow-individual")
  await group.locator("..").evaluate((host) => { (host as HTMLElement).style.width = "24rem" })
  await expect(group).toHaveAttribute("aria-label", "Individual avatars. 6 displayed, 0 hidden. Press ARROW keys to move.")
  const first = group.getByRole("button", { name: "John Doe" })
  const last = group.getByRole("button", { name: "Fiona Gray" })
  await first.focus()
  await expect(first).toBeFocused()
  await page.keyboard.press("Shift+ArrowRight")
  await expect(first).toBeFocused()
  for (const modifier of avatarModifiers) {
    for (const key of ["Enter", "Space"]) {
      await page.keyboard.press(`${modifier}+${key}`)
      await page.evaluate(() => 0)
      await expect(page.locator("#avatar-group-events")).toHaveText("Group activated 0 times")
    }
    for (const key of ["ArrowRight", "ArrowDown", "End", "PageDown"]) {
      await first.dispatchEvent("keydown", { key, shiftKey: modifier === "Shift", ctrlKey: modifier === "Control", altKey: modifier === "Alt", metaKey: modifier === "Meta" })
      await expect(first).toBeFocused()
    }
  }
  await page.keyboard.press("End")
  await expect(last).toBeFocused()
  for (const modifier of avatarModifiers) {
    for (const key of ["ArrowLeft", "ArrowUp", "Home", "PageUp"]) {
      await last.dispatchEvent("keydown", { key, shiftKey: modifier === "Shift", ctrlKey: modifier === "Control", altKey: modifier === "Alt", metaKey: modifier === "Meta" })
      await expect(last).toBeFocused()
    }
  }
  await page.keyboard.press("Home")
  await expect(first).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.locator("#avatar-group-events")).toHaveText("Group activated 1 times")
  await page.keyboard.press("Space")
  await expect(page.locator("#avatar-group-events")).toHaveText("Group activated 2 times")

  await page.goto("/ui5.html?only=avatar-group-individual")
  await page.waitForSelector("html[data-ready=true]")
  const oracle = page.locator('[data-fixture="avatar-group-individual"] ui5-avatar-group')
  await oracle.evaluate((element) => {
    element.setAttribute("data-avatar-test-clicks", "0")
    element.addEventListener("ui5-click", () => element.setAttribute("data-avatar-test-clicks", `${Number(element.getAttribute("data-avatar-test-clicks")) + 1}`))
  })
  const oracleFirst = oracle.locator("ui5-avatar").first().locator(".ui5-avatar-root")
  const oracleLast = oracle.locator("ui5-avatar").last().locator(".ui5-avatar-root")
  await oracleFirst.focus()
  await expect(oracleFirst).toBeFocused()
  await page.keyboard.press("Shift+ArrowRight")
  await expect(oracleFirst).toBeFocused()
  for (const modifier of avatarModifiers) {
    for (const key of ["Enter", "Space"]) {
      await page.keyboard.press(`${modifier}+${key}`)
      await page.evaluate(() => 0)
      await expect(oracle).toHaveAttribute("data-avatar-test-clicks", "0")
    }
    for (const key of ["ArrowRight", "ArrowDown", "End", "PageDown"]) {
      await oracleFirst.dispatchEvent("keydown", { key, shiftKey: modifier === "Shift", ctrlKey: modifier === "Control", altKey: modifier === "Alt", metaKey: modifier === "Meta" })
      await expect(oracleFirst).toBeFocused()
    }
  }
  await page.keyboard.press("End")
  await expect(oracleLast).toBeFocused()
  for (const modifier of avatarModifiers) {
    for (const key of ["ArrowLeft", "ArrowUp", "Home", "PageUp"]) {
      await oracleLast.dispatchEvent("keydown", { key, shiftKey: modifier === "Shift", ctrlKey: modifier === "Control", altKey: modifier === "Alt", metaKey: modifier === "Meta" })
      await expect(oracleLast).toBeFocused()
    }
  }
  await page.keyboard.press("Home")
  await expect(oracleFirst).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(oracle).toHaveAttribute("data-avatar-test-clicks", "1")
  await page.keyboard.press("Space")
  await expect(oracle).toHaveAttribute("data-avatar-test-clicks", "2")
})

test("ultra-narrow groups retain the first avatar through sequential width reservation, matching UI5", async ({ page }) => {
  await page.goto("/index.html?fixtures&only=avatar-group-overflow-ultra-narrow-56")
  await page.waitForSelector("html[data-ready=true]")
  const host = page.locator('[data-fixture="avatar-group-overflow-ultra-narrow-56"] [data-slot="avatar-group"]')
  for (const width of [56, 64, 72, 80, 120, 56]) {
    await host.evaluate((element, width) => { (element as HTMLElement).style.width = `${width}px` }, width)
    const shown = width === 120 ? 2 : 1
    await expect(host.locator('[data-slot="avatar"]:visible')).toHaveCount(shown)
    await expect(host.locator('[data-slot="avatar"][hidden]')).toHaveCount(4 - shown)
    await expect(host.locator("[data-text]")).toHaveAttribute("data-text", `+${4 - shown}`)
  }

  await page.goto("/ui5.html?only=avatar-group-overflow-ultra-narrow-56")
  await page.waitForSelector("html[data-ready=true]")
  const oracle = page.locator('[data-fixture="avatar-group-overflow-ultra-narrow-56"] ui5-avatar-group')
  for (const width of [56, 64, 72, 80, 120, 56]) {
    await oracle.evaluate((element, width) => { element.style.width = `${width}px` }, width)
    const shown = width === 120 ? 2 : 1
    await expect.poll(() => oracle.evaluate((element: any) => element.hiddenItems.length)).toBe(4 - shown)
    await expect(oracle.locator('ui5-avatar:not([hidden])')).toHaveCount(shown)
    await expect(oracle.locator(".ui5-avatar-group-overflow-btn")).toHaveText(`+${4 - shown}`)
  }
})
