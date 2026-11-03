import { expect, test, type Page } from "@playwright/test"

const list = (page: Page) => page.locator("#notification-list-demo")
const last = (page: Page) => page.locator("#notification-list-demo-last")
const item = (page: Page, text: string) => list(page).locator("[data-slot=notification-list-item]").filter({ hasText: text })
const group = (page: Page, text: string) => list(page).locator("[data-slot=notification-list-group-item]").filter({ hasText: text })
const growingDemo = (page: Page) => page.locator("#notification-list-growing-demo")
const growingGroup = (page: Page, name = "orders") => growingDemo(page).locator(`#notification-list-growing-${name}`)
const growingButton = (page: Page, name = "orders") => growingGroup(page, name).getByRole("button", { name: "Load more notifications", exact: true })
const growingItem = (page: Page, number: number, name = "orders") => growingGroup(page, name).locator(`[data-nav-key="${name}-${number}"]`)
const requests = (page: Page) => growingDemo(page).locator("#notification-list-growing-requests")

async function freezeClock(page: Page) {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") })
  await page.clock.pauseAt(new Date("2026-01-01T00:00:01Z"))
}

async function mockGrowingObservers(page: Page) {
  await page.addInitScript(() => {
    const observers: { callback: IntersectionObserverCallback; options?: IntersectionObserverInit; targets: Set<Element> }[] = []
    class Observer {
      record: typeof observers[number]
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        this.record = { callback, options, targets: new Set() }
        observers.push(this.record)
      }
      observe(target: Element) { this.record.targets.add(target) }
      unobserve(target: Element) { this.record.targets.delete(target) }
      disconnect() { this.record.targets.clear() }
      takeRecords() { return [] }
    }
    window.IntersectionObserver = Observer as unknown as typeof IntersectionObserver
    ;(window as any).__notificationObservers = observers
    ;(window as any).__notificationIntersect = (group: string, marker: string, isIntersecting: boolean) => {
      const target = document.querySelector(`#notification-list-growing-${group} .fiori-nli-group__${marker}-marker`)
      for (const observer of observers) {
        if (target && observer.targets.has(target)) observer.callback([{ target, isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver)
      }
    }
  })
  await page.reload()
  await page.waitForSelector("html[data-ready=true]")
  await freezeClock(page)
  await growingDemo(page).getByLabel("Load behavior").selectOption("noop")
  await growingDemo(page).getByLabel("Growing mode").selectOption("scroll")
}

async function intersect(page: Page, name: string, marker: string, visible: boolean) {
  await page.evaluate(({ name, marker, visible }) => (window as any).__notificationIntersect(name, marker, visible), { name, marker, visible })
}

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html`)
  await page.waitForSelector("html[data-ready=true]")
})

test("notification-list: arrows go through groups and visible items, Home/End stay in the group", async ({ page }) => {
  await group(page, "Orders").focus()
  await page.keyboard.press("ArrowDown")
  await expect(item(page, "Order #2565")).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(item(page, "Order #2566")).toBeFocused()
  await page.keyboard.press("End")
  await expect(item(page, "Cannot be closed")).toBeFocused()
  await page.keyboard.press("Home")
  await expect(item(page, "Order #2565")).toBeFocused()
  await page.keyboard.press("ArrowUp")
  await expect(group(page, "Orders")).toBeFocused()
  // The collapsed group's item is skipped.
  await item(page, "Cannot be closed").focus()
  await page.keyboard.press("ArrowDown")
  await expect(group(page, "Approvals")).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(group(page, "Approvals")).toBeFocused()
})

test("notification-list: Space, +/→ and -/← toggle a group", async ({ page }) => {
  const approvals = group(page, "Approvals")
  const header = approvals.getByRole("button", { name: "Approvals" })
  await approvals.focus()
  await expect(header).toHaveAttribute("aria-expanded", "false")
  await expect(item(page, "Purchase requisition")).toBeHidden()
  await page.keyboard.press("ArrowRight")
  await expect(header).toHaveAttribute("aria-expanded", "true")
  await expect(last(page)).toHaveText("Last action: expand:approvals")
  await expect(item(page, "Purchase requisition")).toBeVisible()
  await expect(approvals).toBeFocused()
  await page.keyboard.press("-")
  await expect(header).toHaveAttribute("aria-expanded", "false")
  await page.keyboard.press("+")
  await expect(header).toHaveAttribute("aria-expanded", "true")
  await page.keyboard.press("Space")
  await expect(header).toHaveAttribute("aria-expanded", "false")
  await expect(last(page)).toHaveText("Last action: collapse:approvals")
  await header.click()
  await expect(header).toHaveAttribute("aria-expanded", "true")
})

test("notification-list: Delete closes a closable item and focus moves on; other items stay", async ({ page }) => {
  await item(page, "Cannot be closed").focus()
  await page.keyboard.press("Delete")
  await expect(item(page, "Cannot be closed")).toHaveCount(1)
  await item(page, "Order #2565").focus()
  await page.keyboard.press("Delete")
  await expect(item(page, "Order #2565")).toHaveCount(0)
  await expect(item(page, "Order #2566")).toBeFocused()
})

test("notification-list: the close button closes; Enter, Space and click report the item", async ({ page }) => {
  await item(page, "Order #2566").getByRole("button", { name: "Close" }).click()
  await expect(item(page, "Order #2566")).toHaveCount(0)
  await item(page, "Order #2565").focus()
  await page.keyboard.press("Enter")
  await expect(last(page)).toHaveText("Last action: click:delayed")
  await item(page, "Cannot be closed").click()
  await expect(last(page)).toHaveText("Last action: click:open")
  await item(page, "Order #2565").focus()
  await page.keyboard.press("Space")
  await expect(last(page)).toHaveText("Last action: click:delayed")
})

test("notification-list: long text truncates with More / Less; Shift+Enter toggles without activating", async ({ page }) => {
  const long = item(page, "Order #2566")
  const description = long.locator(".fiori-nli__description")
  const clamped = (await description.boundingBox())!.height
  const more = long.getByRole("button", { name: "More button. Show the full texts" })
  await expect(more).toHaveText(/More/)
  await more.click()
  const less = long.getByRole("button", { name: "Less button. Show the texts with truncation" })
  await expect(less).toHaveAttribute("aria-expanded", "true")
  expect((await description.boundingBox())!.height).toBeGreaterThan(clamped)
  await expect(last(page)).toHaveText("Last action: none")
  await long.focus()
  await page.keyboard.press("Shift+Enter")
  await expect(more).toBeVisible()
  await expect(last(page)).toHaveText("Last action: none")
})

test("notification-list: actions button and Shift+F10 open the menu; F2 enters the item; arrows go to the same button", async ({ page }) => {
  const delayed = item(page, "Order #2565")
  const actions = delayed.getByRole("button", { name: "Actions" })
  await expect(actions).toHaveAttribute("aria-haspopup", "menu")
  await actions.click()
  await expect(page.getByRole("menuitem", { name: "Accept" })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(actions).toBeFocused()
  await delayed.focus()
  await page.keyboard.press("Shift+F10")
  await expect(page.getByRole("menuitem", { name: "Accept" })).toBeVisible()
  await page.keyboard.press("Escape")
  // The closing menu hands focus back to its button; wait for that before moving on.
  await expect(page.getByRole("menuitem", { name: "Accept" })).toHaveCount(0)
  await expect(actions).toBeFocused()
  await delayed.focus()
  await page.keyboard.press("F2")
  await expect(actions).toBeFocused()
  await page.keyboard.press("F2")
  await expect(delayed).toBeFocused()
  await delayed.getByRole("button", { name: "Close" }).focus()
  await page.keyboard.press("ArrowDown")
  await expect(item(page, "Order #2566").getByRole("button", { name: "Close" })).toBeFocused()
})

test("notification-list: announces read state, importance and states", async ({ page }) => {
  await expect(item(page, "Order #2565")).toHaveAccessibleName(/Unread/)
  await expect(item(page, "Order #2566")).toHaveAccessibleName(/Read/)
  await expect(item(page, "Order #2565")).toHaveAccessibleName(/Status Negative/)
  await expect(item(page, "Cannot be closed")).toHaveAccessibleName(/Important/)
  await expect(group(page, "Approvals")).toHaveAccessibleDescription("Notification Group Collapsed")
})

test("notification-list: Tab leaves the list from an item without content and re-entering returns to it", async ({ page }) => {
  await item(page, "Cannot be closed").focus()
  await page.keyboard.press("Tab")
  await expect(list(page).locator(":focus")).toHaveCount(0)
  await page.keyboard.press("Shift+Tab")
  await expect(item(page, "Cannot be closed")).toBeFocused()
})

for (const activation of ["click", "Enter", "Space"] as const) {
  test(`notification-list: growing ${activation} requests once, focuses the append and does not toggle or click an item`, async ({ page }) => {
    const more = growingButton(page)
    if (activation === "click") await more.click()
    else {
      await more.focus()
      await page.keyboard.down(activation)
      await expect(requests(page)).toHaveText(`Requests: orders=${activation === "Enter" ? 1 : 0}, approvals=0`)
      await page.keyboard.up(activation)
    }
    await expect(requests(page)).toHaveText("Requests: orders=1, approvals=0")
    await expect(growingItem(page, 3)).toBeFocused()
    await expect(growingGroup(page).getByRole("button", { name: "More orders", exact: true })).toHaveAttribute("aria-expanded", "true")
    await expect(growingDemo(page).locator("#notification-list-growing-action")).toHaveText("Last action: none")
  })
}

test("notification-list: More participates in arrows and two-step End within a group", async ({ page }) => {
  await growingGroup(page).focus()
  await growingButton(page).focus()
  await page.keyboard.press("Home")
  await expect(growingGroup(page)).toBeFocused()
  await growingButton(page).focus()
  await page.keyboard.press("End")
  await expect(growingItem(page, 2)).toBeFocused()
  await growingItem(page, 1).focus()
  await page.keyboard.press("End")
  await expect(growingItem(page, 2)).toBeFocused()
  await page.keyboard.press("End")
  await expect(growingButton(page)).toBeFocused()
  await page.keyboard.press("Home")
  await expect(growingItem(page, 1)).toBeFocused()
  await growingItem(page, 2).getByRole("button", { name: "Close", exact: true }).focus()
  await page.keyboard.press("ArrowDown")
  await expect(growingButton(page)).toBeFocused()
  await page.keyboard.press("ArrowUp")
  await expect(growingItem(page, 2)).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(growingButton(page)).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(growingGroup(page, "approvals")).toBeFocused()
})

test("notification-list: modified More activation and navigation keys keep native defaults without loading or toggling", async ({ page }) => {
  await growingDemo(page).getByLabel("Load behavior").selectOption("noop")
  for (const modifier of ["Shift", "Control", "Alt", "Meta"]) {
    for (const key of ["Enter", "Space", "ArrowUp", "Home", "End"]) {
      await growingButton(page).focus()
      await page.keyboard.press(`${modifier}+${key}`)
      await expect(requests(page)).toHaveText("Requests: orders=0, approvals=0")
      await expect(growingButton(page)).toBeFocused()
    }
  }
  await expect(growingDemo(page).locator("#notification-list-growing-action")).toHaveText("Last action: none")
})

test("notification-list: collapsed and loading groups omit children and More from arrows", async ({ page }) => {
  const orders = growingGroup(page)
  await orders.getByRole("button", { name: "More orders", exact: true }).click()
  await expect(growingButton(page)).toBeHidden()
  await orders.focus()
  await page.keyboard.press("ArrowDown")
  await expect(growingGroup(page, "approvals")).toBeFocused()
  await orders.getByRole("button", { name: "More orders", exact: true }).click()
  await growingDemo(page).getByRole("button", { name: "Start loading orders", exact: true }).click()
  await growingButton(page).focus()
  await page.keyboard.press("ArrowUp")
  await expect(growingItem(page, 2)).toBeFocused()
  await orders.focus()
  await page.keyboard.press("ArrowDown")
  await expect(growingGroup(page, "approvals")).toBeFocused()
  await growingDemo(page).getByRole("button", { name: "Finish loading orders", exact: true }).click()
  await orders.focus()
  await page.keyboard.press("ArrowDown")
  await expect(growingItem(page, 1)).toBeFocused()
})

test("notification-list: Tab from group More continues to the next group's content and Shift+Tab returns to its first item", async ({ page }) => {
  await growingButton(page).focus()
  await page.keyboard.press("Tab")
  await expect(growingItem(page, 1, "approvals").getByRole("button", { name: "Details button. Show the full texts" })).toBeFocused()
  await growingButton(page, "approvals").focus()
  await page.keyboard.press("Shift+Tab")
  await expect(growingItem(page, 1, "approvals")).toBeFocused()
})

test("notification-list: loading delays an inline spinner and leaves More enabled with custom texts", async ({ page }) => {
  await freezeClock(page)
  await growingDemo(page).getByLabel("Load behavior").selectOption("manual")
  await growingButton(page).click()
  await expect(growingGroup(page)).toHaveAttribute("aria-labelledby", /loading$/)
  await expect(growingGroup(page).getByRole("progressbar")).toHaveCount(0)
  await page.clock.runFor(999)
  await expect(growingGroup(page).getByRole("progressbar")).toHaveCount(0)
  await page.clock.runFor(1)
  const busy = growingButton(page).getByRole("progressbar", { name: "Fetching notifications" })
  await expect(busy).toBeVisible()
  await expect(growingGroup(page).locator(".fiori-nli-group__busy")).not.toHaveAttribute("data-busy")
  await growingButton(page).click()
  await expect(requests(page)).toHaveText("Requests: orders=2, approvals=0")
  await expect(growingItem(page, 1).getByRole("button", { name: "Details button. Show the full texts" })).toHaveText("Details")
})

test("notification-list: page keys clamp to real items and leave More uncancelled, matching UI5", async ({ page }) => {
  for (const reference of [false, true]) {
    await page.goto(reference ? "/ui5.html?only=notification-list-growing-button" : "/index.html?fixtures&only=notification-list-growing-button")
    await page.waitForSelector("html[data-ready=true]")
    const fixture = page.locator('[data-fixture="notification-list-growing-button"]')
    const child = fixture.locator(reference ? "ui5-li-notification .ui5-nli-root" : '[data-slot="notification-list-item"]')
    const more = fixture.getByRole("button", { name: "More", exact: true })
    await page.evaluate(() => {
      ;(window as any).__notificationPageKeyEvents = []
      window.addEventListener("keydown", (event) => {
        if (event.key === "PageUp" || event.key === "PageDown") (window as any).__notificationPageKeyEvents.push({ key: event.key, defaultPrevented: event.defaultPrevented })
      })
    })
    await child.focus()
    await expect(child).toBeFocused()
    await page.keyboard.press("PageDown")
    await expect(child).toBeFocused()
    await more.focus()
    await expect(more).toBeFocused()
    for (const key of ["PageUp", "PageDown", "Shift+PageUp", "Shift+PageDown"]) {
      await page.keyboard.press(key)
      await expect(more).toBeFocused()
      expect(await page.evaluate(() => (window as any).__notificationPageKeyEvents.at(-1).defaultPrevented)).toBe(false)
    }
  }
})

test("notification-list: page jumps count ten real items across group growing controls", async ({ page }) => {
  for (let number = 2; number <= 10; number++) {
    await growingDemo(page).getByRole("button", { name: "Append approvals", exact: true }).click()
    await expect(growingItem(page, number, "approvals")).toHaveCount(1)
  }
  await growingItem(page, 1).focus()
  await expect(growingItem(page, 1)).toBeFocused()
  await page.keyboard.press("PageDown")
  await expect(growingItem(page, 8, "approvals")).toBeFocused()
  await page.keyboard.press("PageUp")
  await expect(growingItem(page, 1)).toBeFocused()
  for (const key of ["Shift+PageUp", "Shift+PageDown", "Alt+PageUp", "Alt+PageDown", "Control+PageUp", "Control+PageDown", "Meta+PageUp", "Meta+PageDown"]) {
    await page.keyboard.press(key)
    await expect(growingItem(page, 1)).toBeFocused()
  }
})

test("notification-list: UI5 defaults keep the busy title separate from the group's hidden loading name", async ({ page }) => {
  for (const reference of [false, true]) {
    await page.goto(reference ? "/ui5.html?only=notification-list-growing-button-loading" : "/index.html?fixtures&only=notification-list-growing-button-loading")
    await page.waitForSelector("html[data-ready=true]")
    const fixture = page.locator('[data-fixture="notification-list-growing-button-loading"]')
    const root = fixture.locator(reference ? "ui5-li-notification-group .ui5-nli-group-root" : "[data-nli-group]")
    await expect(root).toHaveAccessibleName("Loading")
    await expect(fixture.getByRole("progressbar")).toHaveAccessibleName("Please wait")
  }
})

test("notification-list: keyboard More feedback matches UI5's actual compiled active-class behavior", async ({ page }) => {
  const colors: string[] = []
  for (const reference of [false, true]) {
    await page.goto(reference ? "/ui5.html?only=notification-list-growing-button" : "/index.html?fixtures&only=notification-list-growing-button")
    await page.waitForSelector("html[data-ready=true]")
    await page.mouse.move(0, 0)
    const more = page.locator('[data-fixture="notification-list-growing-button"]').getByRole("button", { name: "More", exact: true })
    await more.focus()
    await page.keyboard.down("Space")
    if (reference) await expect(more).toHaveClass(/ui5-growing-button-inner-active/)
    colors.push(await more.evaluate((button) => getComputedStyle(button).backgroundColor))
    await page.keyboard.up("Space")
  }
  expect(colors[0]).toBe(colors[1])
})

test("notification-list: keyboard events inside an inline busy indicator do not activate More", async ({ page }) => {
  await freezeClock(page)
  await growingDemo(page).getByLabel("Load behavior").selectOption("manual")
  await growingDemo(page).getByLabel("Loading delay").selectOption("0")
  await growingButton(page).click()
  await page.clock.runFor(1)
  const busy = growingButton(page).getByRole("progressbar")
  await busy.focus()
  for (const key of ["Enter", "Space", "ArrowUp"]) {
    await page.keyboard.press(key)
    await expect(busy).toBeFocused()
    await expect(requests(page)).toHaveText("Requests: orders=1, approvals=0")
  }
})

test("notification-list: group overlay clears child busy requests until their loading prop resets", async ({ page }) => {
  await freezeClock(page)
  await growingDemo(page).getByLabel("Growing mode").selectOption("none")
  await growingDemo(page).getByLabel("Loading delay").selectOption("0")
  await growingDemo(page).getByRole("button", { name: "Toggle child loading", exact: true }).click()
  await page.clock.runFor(1)
  await expect(growingGroup(page).locator('[role="progressbar"]')).toHaveCount(2)
  await growingDemo(page).getByRole("button", { name: "Start loading orders", exact: true }).click()
  await page.clock.runFor(1)
  await expect(growingGroup(page).getByRole("progressbar")).toHaveCount(1)
  await expect(growingGroup(page).locator(".fiori-nli-group__busy")).toHaveAttribute("data-busy", "")
  await expect(growingGroup(page).locator(".fiori-nli__busy[data-active]")).toHaveCount(0)
  await growingDemo(page).getByRole("button", { name: "Finish loading orders", exact: true }).click()
  await expect(growingGroup(page).getByRole("progressbar")).toHaveCount(0)
  await growingDemo(page).getByRole("button", { name: "Toggle child loading", exact: true }).click()
  await growingDemo(page).getByRole("button", { name: "Toggle child loading", exact: true }).click()
  await page.clock.runFor(1)
  await expect(growingGroup(page).locator('[role="progressbar"]')).toHaveCount(2)
})

test("notification-list: loading items make their controls inert before delay and action arrows focus the item row", async ({ page }) => {
  await freezeClock(page)
  await growingDemo(page).getByRole("button", { name: "Load last order only", exact: true }).click()
  const loadingItem = growingItem(page, 2)
  await expect(loadingItem).toHaveAttribute("data-loading", "")
  await expect(loadingItem).toHaveAccessibleName("Fetching notifications")
  await expect(loadingItem.locator(".fiori-nli__busy")).toHaveAttribute("inert", "")
  await expect(loadingItem.locator('[role="progressbar"]')).toHaveCount(0)
  await growingItem(page, 1).getByRole("button", { name: "Close", exact: true }).focus()
  await page.keyboard.press("ArrowDown")
  await expect(loadingItem).toBeFocused()
  await loadingItem.locator('[data-nli-action="close"]').evaluate((button: HTMLElement) => button.focus())
  await expect(loadingItem).toBeFocused()
  await page.clock.runFor(1000)
  await expect(loadingItem.locator('[role="progressbar"]')).toHaveCount(1)
  await loadingItem.locator('[role="progressbar"]').evaluate((busy: HTMLElement) => busy.focus())
  await expect(loadingItem).toBeFocused()
})

test("notification-list: one committed phase change hands group loading to a previously idle child, matching UI5", async ({ page }) => {
  const demo = page.locator("#notification-list-loading-handoff-demo")
  const group = demo.locator('[data-nli-group]')
  const child = demo.locator('[data-nav-key="handoff-child"]')
  await expect(group.locator(".fiori-nli-group__busy")).toHaveAttribute("data-busy", "")
  await expect(child).not.toHaveAttribute("data-loading", "")
  await demo.getByRole("button", { name: "Switch loading phase", exact: true }).click()
  await expect(demo.locator("output")).toHaveText("Loading phase: child")
  await expect(group).not.toHaveAttribute("data-loading", "")
  await expect(child).toHaveAttribute("data-loading", "")
  await expect(child).toHaveAccessibleName("Loading")
  await expect(child.locator(".fiori-nli__busy")).toHaveAttribute("data-active", "")
  await expect(child.locator(".fiori-nli__busy")).toHaveAttribute("inert", "")
  await expect(child.locator('[role="progressbar"]')).toBeVisible()
  await page.goto("/ui5.html?only=notification-list-growing-scroll-loading")
  await page.waitForSelector("html[data-ready=true]")
  const reference = page.locator('[data-fixture="notification-list-growing-scroll-loading"]')
  const referenceGroup = reference.locator("ui5-li-notification-group")
  const referenceChild = referenceGroup.locator("ui5-li-notification").first()
  await expect(reference.getByRole("progressbar")).toHaveCount(1)
  await referenceGroup.evaluate((group: any) => {
    // NotificationListGroupItem.js/onBeforeRendering clears children only while CURRENT
    // group.loading is true; NotificationListItemTemplate.js forwards CURRENT child.loading.
    group.loading = false
    group.items[0].loading = true
  })
  await expect(referenceGroup).not.toHaveAttribute("loading", "")
  await expect(referenceChild).toHaveAttribute("loading", "")
  const referenceBusy = referenceChild.locator("ui5-busy-indicator")
  await expect(referenceBusy).toHaveAttribute("active", "")
  await expect(referenceBusy).toHaveAttribute("inert", "")
  await expect(referenceBusy.locator('[role="progressbar"]')).toBeVisible()
})

test("notification-list: false child resets during group loading allow a fresh handoff and clear renewed busy-group requests", async ({ page }) => {
  await growingDemo(page).getByLabel("Growing mode").selectOption("none")
  await growingDemo(page).getByLabel("Loading delay").selectOption("0")
  const toggleChild = growingDemo(page).getByRole("button", { name: "Toggle child loading", exact: true })
  const groupBusy = growingGroup(page).locator(".fiori-nli-group__busy")
  const childBusy = growingGroup(page).locator(".fiori-nli__busy[data-active]")
  await toggleChild.click()
  await expect(childBusy).toHaveCount(2)
  await growingDemo(page).getByRole("button", { name: "Start loading orders", exact: true }).click()
  await expect(groupBusy).toHaveAttribute("data-busy", "")
  await expect(childBusy).toHaveCount(0)
  await toggleChild.click()
  await expect(growingItem(page, 1)).not.toHaveAttribute("data-loading", "")
  await toggleChild.click()
  await expect(childBusy).toHaveCount(0)
  await growingDemo(page).getByRole("button", { name: "Finish loading orders", exact: true }).click()
  await expect(groupBusy).not.toHaveAttribute("data-active", "")
  await expect(childBusy).toHaveCount(0)
  await growingDemo(page).getByRole("button", { name: "Start loading orders", exact: true }).click()
  await expect(groupBusy).toHaveAttribute("data-busy", "")
  await toggleChild.click()
  await expect(childBusy).toHaveCount(0)
  await growingDemo(page).getByRole("button", { name: "Finish orders and load children", exact: true }).click()
  await expect(groupBusy).not.toHaveAttribute("data-active", "")
  await expect(childBusy).toHaveCount(2)
  await expect(growingItem(page, 1)).toHaveAccessibleName("Fetching notifications")
  await expect(growingItem(page, 1).locator(".fiori-nli__busy")).toHaveAttribute("inert", "")
  await expect(growingItem(page, 1).locator('[role="progressbar"]')).toBeVisible()
})

test("notification-list: only the requesting group's first appended item focuses after loading completes", async ({ page }) => {
  await growingDemo(page).getByLabel("Load behavior").selectOption("manual")
  await growingButton(page).click()
  await growingDemo(page).getByRole("button", { name: "Append approvals", exact: true }).click()
  await expect(growingItem(page, 2, "approvals")).not.toBeFocused()
  await growingDemo(page).getByRole("button", { name: "Append orders", exact: true }).click()
  await expect(growingItem(page, 3)).not.toBeFocused()
  await growingDemo(page).getByRole("button", { name: "Append orders", exact: true }).click()
  await growingDemo(page).getByRole("button", { name: "Finish loading orders", exact: true }).click()
  await expect(growingItem(page, 3)).toBeFocused()
  await expect(growingItem(page, 4)).not.toBeFocused()
})

test("notification-list: no-op requests expire and unrelated future appends keep their existing focus", async ({ page }) => {
  await growingDemo(page).getByLabel("Load behavior").selectOption("noop")
  await growingButton(page).click()
  await expect(requests(page)).toHaveText("Requests: orders=1, approvals=0")
  const append = growingDemo(page).getByRole("button", { name: "Append orders", exact: true })
  await append.click()
  await expect(append).toBeFocused()
  await growingDemo(page).getByLabel("Load behavior").selectOption("manual")
  await growingButton(page).click()
  const finish = growingDemo(page).getByRole("button", { name: "Finish loading orders", exact: true })
  await finish.click()
  await expect(growingDemo(page).getByRole("button", { name: "Start loading orders", exact: true })).toBeFocused()
  await append.click()
  await expect(append).toBeFocused()
})

test("notification-list: scroll uses viewport threshold 1, start visibility at completion and 250ms debounce", async ({ page }) => {
  await mockGrowingObservers(page)
  const options = await page.evaluate(() => (window as any).__notificationObservers.filter((observer: any) => [...observer.targets].some((target: any) => target.closest("#notification-list-growing-orders"))).map((observer: any) => observer.options))
  expect(options).toEqual([{ root: null, rootMargin: "0px", threshold: 1 }, { root: null, rootMargin: "0px", threshold: 1 }])
  await intersect(page, "orders", "start", true)
  await intersect(page, "orders", "end", true)
  await page.clock.runFor(250)
  await expect(requests(page)).toHaveText("Requests: orders=0, approvals=0")
  await intersect(page, "orders", "start", false)
  await intersect(page, "orders", "end", false)
  await page.clock.runFor(250)
  await expect(requests(page)).toHaveText("Requests: orders=0, approvals=0")
  await intersect(page, "orders", "end", true)
  await page.clock.runFor(249)
  await expect(requests(page)).toHaveText("Requests: orders=0, approvals=0")
  await page.clock.runFor(1)
  await expect(requests(page)).toHaveText("Requests: orders=1, approvals=0")
  await intersect(page, "orders", "end", true)
  await intersect(page, "orders", "start", true)
  await page.clock.runFor(250)
  await expect(requests(page)).toHaveText("Requests: orders=1, approvals=0")
})

test("notification-list: concurrent scroll groups share UI5's debounce and retain independent requests", async ({ page }) => {
  await mockGrowingObservers(page)
  await intersect(page, "orders", "start", false)
  await intersect(page, "approvals", "start", false)
  await intersect(page, "orders", "end", true)
  await page.clock.runFor(100)
  await intersect(page, "approvals", "end", true)
  await page.clock.runFor(249)
  await expect(requests(page)).toHaveText("Requests: orders=0, approvals=0")
  await page.clock.runFor(1)
  await expect(requests(page)).toHaveText("Requests: orders=0, approvals=1")
  await growingDemo(page).getByLabel("Load behavior").selectOption("append")
  await intersect(page, "orders", "end", true)
  await page.clock.runFor(250)
  await expect(requests(page)).toHaveText("Requests: orders=1, approvals=1")
  await expect(growingItem(page, 3)).toBeFocused()
})

test("notification-list: scroll cleans up observers and pending callbacks on collapse, mode change and unmount", async ({ page }) => {
  await mockGrowingObservers(page)
  const schedule = async () => {
    await intersect(page, "orders", "start", false)
    await intersect(page, "orders", "end", true)
  }
  const orders = growingGroup(page)
  await schedule()
  await orders.getByRole("button", { name: "More orders", exact: true }).click()
  await page.clock.runFor(250)
  await expect(requests(page)).toHaveText("Requests: orders=0, approvals=0")
  await orders.getByRole("button", { name: "More orders", exact: true }).click()
  await schedule()
  await growingDemo(page).getByLabel("Growing mode").selectOption("button")
  await page.clock.runFor(250)
  await expect(requests(page)).toHaveText("Requests: orders=0, approvals=0")
  await growingDemo(page).getByLabel("Growing mode").selectOption("scroll")
  await schedule()
  await growingDemo(page).getByRole("button", { name: "Hide growing list", exact: true }).click()
  await page.clock.runFor(250)
  await expect(requests(page)).toHaveText("Requests: orders=0, approvals=0")
  const remaining = await page.evaluate(() => (window as any).__notificationObservers.flatMap((observer: any) => [...observer.targets]).filter((target: any) => target.className?.startsWith("fiori-nli-group__")))
  expect(remaining).toEqual([])
})

test("notification-list: native viewport scroll requests more only after the group start leaves view", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 240 })
  await growingDemo(page).getByLabel("Load behavior").selectOption("noop")
  await growingDemo(page).getByLabel("Growing mode").selectOption("scroll")
  await growingGroup(page).locator(".fiori-nli-group__end-marker").evaluate((marker) => marker.scrollIntoView({ block: "end" }))
  await expect(requests(page)).toHaveText("Requests: orders=1, approvals=0")
})

test("notification-list: More draws focus only for keyboard navigation", async ({ page }) => {
  await growingDemo(page).getByLabel("Load behavior").selectOption("noop")
  await growingButton(page).click()
  await expect(growingButton(page)).toBeFocused()
  expect(await growingButton(page).evaluate((button) => getComputedStyle(button).outlineStyle)).toBe("none")
  await growingItem(page, 2).focus()
  await page.keyboard.press("ArrowDown")
  await expect(growingButton(page)).toBeFocused()
  expect(await growingButton(page).evaluate((button) => getComputedStyle(button).outlineStyle)).not.toBe("none")
})
