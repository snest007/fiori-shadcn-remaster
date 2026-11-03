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

// Construct the same two-group data on the installed UI5 oracle and the growing demo.
// Remove prefix-matched sibling fixtures so Tab has an explicit, shared destination.
async function growingKeyboardOracle(page: Page, reference: boolean) {
  await page.goto(reference ? "/ui5.html?only=notification-list-growing-button" : "/index.html")
  await page.waitForSelector("html[data-ready=true]")
  if (reference) {
    await page.evaluate(() => {
      const fixture = document.querySelector('[data-fixture="notification-list-growing-button"]')!
      const list = fixture.querySelector("ui5-notification-list")!
      const template = list.querySelector("ui5-li-notification-group")!
      list.replaceChildren()
      ;(window as any).__notificationKeyboardLoads = 0
      for (const [name, count] of [["orders", 2], ["approvals", 1]] as const) {
        const group = template.cloneNode(false) as any
        group.titleText = `More ${name}`
        group.dataset.probeKey = name
        group.loadingDelay = 0
        group.addEventListener("load-more", () => { (window as any).__notificationKeyboardLoads++ })
        for (let number = 1; number <= count; number++) {
          const item = document.createElement("ui5-li-notification") as any
          item.titleText = `${name} notification ${number}`
          item.showClose = true
          item.loadingDelay = 0
          item.dataset.probeKey = `${name}-${number}`
          item.textContent = "And with very long description and long labels of the action buttons - Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
          group.append(item)
        }
        list.append(group)
      }
      for (const sibling of document.querySelectorAll("[data-fixture]")) if (sibling !== fixture) sibling.remove()
    })
    await page.waitForFunction(() => {
      const groups = [...document.querySelectorAll('[data-fixture="notification-list-growing-button"] ui5-li-notification-group')] as any[]
      return groups.length === 2 && groups.every((group) => group.getGrowingButton?.()) && groups[0].items.length === 2
    })
  } else {
    await growingDemo(page).getByLabel("Load behavior").selectOption("manual")
    await growingDemo(page).getByLabel("Loading delay").selectOption("0")
  }
  await page.evaluate((reference) => {
    const root = document.querySelector(reference ? '[data-fixture="notification-list-growing-button"]' : '#notification-list-growing-demo [data-slot="notification-list"]')!
    const after = document.createElement("button")
    after.id = "notification-list-keyboard-after"
    after.textContent = "After notifications"
    root.after(after)
    ;(window as any).__notificationKeyboardEvents = []
    ;(window as any).__notificationKeyboardBubbles = []
    for (const type of ["keydown", "keyup", "click"]) {
      window.addEventListener(type, (event) => { (window as any).__notificationKeyboardEvents.push(event) }, { capture: true })
      window.addEventListener(type, (event) => { (window as any).__notificationKeyboardBubbles.push(event) })
    }
  }, reference)
  const host = (name = "orders") => reference
    ? page.locator(`[data-fixture="notification-list-growing-button"] ui5-li-notification-group[data-probe-key="${name}"]`)
    : growingGroup(page, name)
  const group = (name = "orders") => reference ? host(name).locator(".ui5-nli-group-root") : host(name)
  const child = (number: number, name = "orders") => reference
    ? host(name).locator(`ui5-li-notification[data-probe-key="${name}-${number}"] .ui5-nli-root`)
    : growingItem(page, number, name)
  const more = (name = "orders") => host(name).getByRole("button", { name: reference ? "More" : "Load more notifications", exact: true })
  const setLoading = async (loading: boolean, name = "orders") => {
    if (reference) {
      await host(name).evaluate((group, loading) => { (group as any).loading = loading }, loading)
      await page.waitForFunction(({ loading, name }) => {
        const group = document.querySelector(`ui5-li-notification-group[data-probe-key="${name}"]`) as any
        const inner = group.shadowRoot.querySelector("[ui5-notification-group-list]")
        return inner.loading === loading && (!loading || inner.shadowRoot.querySelector(".ui5-list-growing-button-busy-indicator")?._isBusy)
      }, { loading, name })
    } else if (await host(name).evaluate((group) => group.hasAttribute("data-loading")) !== loading) {
      await growingDemo(page).getByRole("button", { name: `${loading ? "Start" : "Finish"} loading ${name}`, exact: true }).click()
      if (loading) await expect(host(name).locator(".fiori-nli-group__growing-busy")).toHaveAttribute("data-busy", "")
      else await expect(host(name)).not.toHaveAttribute("data-loading")
    }
  }
  const loads = () => page.evaluate((reference) => reference
    ? (window as any).__notificationKeyboardLoads as number
    : Number(document.querySelector("#notification-list-growing-requests")!.textContent!.match(/orders=(\d+)/)![1]), reference)
  const clearEvents = () => page.evaluate(() => {
    ;(window as any).__notificationKeyboardEvents = []
    ;(window as any).__notificationKeyboardBubbles = []
  })
  const events = () => page.evaluate(() => (window as any).__notificationKeyboardEvents
    .filter((event: KeyboardEvent) => !["Shift", "Control", "Alt", "Meta"].includes(event.key))
    .map((event: KeyboardEvent) => ({ type: event.type, key: event.key, prevented: event.defaultPrevented, bubbled: (window as any).__notificationKeyboardBubbles.includes(event) })))
  return { host, group, child, more, setLoading, loads, clearEvents, events, after: page.locator("#notification-list-keyboard-after") }
}

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

async function requestDelayedScroll(page: Page) {
  await mockGrowingObservers(page)
  await growingDemo(page).getByLabel("Load behavior").selectOption("manual")
  await intersect(page, "orders", "start", false)
  await intersect(page, "orders", "end", true)
  await page.clock.runFor(250)
  await expect(requests(page)).toHaveText("Requests: orders=1, approvals=0")
  await expect(growingGroup(page)).toHaveAttribute("data-loading", "")
  await page.clock.runFor(1000)
  const busy = growingGroup(page).locator(".fiori-nli-group__busy")
  const content = busy.locator(":scope > .fiori-busy-indicator__root > .fiori-busy-indicator__content")
  await expect(busy).toHaveAttribute("data-busy", "")
  await expect(busy.locator(':scope > .fiori-busy-indicator__root > [role="progressbar"]')).toBeVisible()
  await expect(content).toHaveAttribute("inert", "")
  return { busy, content }
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

test("notification-list: busy More retains UI5's numeric enabled-item index and root-first arrow routing", async ({ page }) => {
  for (const reference of [true, false]) {
    const oracle = await growingKeyboardOracle(page, reference)
    for (const prior of ["header", "child"] as const) {
      for (const key of ["Home", "End", "ArrowDown", "ArrowRight", "ArrowLeft", "ArrowUp", "PageUp", "PageDown"]) {
        await oracle.setLoading(false)
        const previous = prior === "header" ? oracle.group() : oracle.child(1)
        await previous.focus()
        await expect(previous).toBeFocused()
        await oracle.setLoading(true)
        await oracle.more().focus()
        await expect(oracle.more()).toBeFocused()
        await oracle.clearEvents()
        await page.keyboard.press(key)
        const destination = key === "ArrowUp" ? oracle.child(2)
          : key === "Home" ? (prior === "header" ? oracle.group() : oracle.group("approvals"))
          : key === "End" ? (prior === "header" ? oracle.group() : oracle.child(1, "approvals"))
          : key === "ArrowDown" || key === "ArrowRight" ? oracle.group()
          : oracle.more()
        await expect(destination).toBeFocused()
        expect((await oracle.events())[0].prevented).toBe(!key.startsWith("Page"))
      }
    }
    await oracle.setLoading(false)
    for (const key of ["ArrowDown", "ArrowRight"]) {
      await oracle.setLoading(false, "approvals")
      await oracle.child(1, "approvals").focus()
      await expect(oracle.child(1, "approvals")).toBeFocused()
      await oracle.setLoading(true, "approvals")
      await oracle.more("approvals").focus()
      await page.keyboard.press(key)
      await expect(oracle.group()).toBeFocused()
    }
  }
})

test("notification-list: More Tab exits the list with native cancellation and bubbling, even while busy", async ({ page }) => {
  for (const reference of [true, false]) {
    const oracle = await growingKeyboardOracle(page, reference)
    for (const loading of [false, true]) {
      await oracle.setLoading(loading)
      await oracle.more().focus()
      await oracle.clearEvents()
      await page.keyboard.press("Tab")
      await expect(oracle.after).toBeFocused()
      expect(await oracle.events()).toEqual([
        { type: "keydown", key: "Tab", prevented: false, bubbled: true },
        { type: "keyup", key: "Tab", prevented: false, bubbled: true },
      ])
      await oracle.more().focus()
      await oracle.clearEvents()
      await page.keyboard.press("Shift+Tab")
      await expect(oracle.child(1)).toBeFocused()
      expect(await oracle.events()).toEqual([
        { type: "keydown", key: "Tab", prevented: true, bubbled: true },
        { type: "keyup", key: "Tab", prevented: false, bubbled: true },
      ])
    }
  }
})

test("notification-list: More activation phases, Escape, F2 and modifiers preserve native event routing", async ({ page }) => {
  for (const reference of [true, false]) {
    const oracle = await growingKeyboardOracle(page, reference)
    for (const loading of [false, true]) {
      for (const key of ["Click", "Enter", "Space", "SpaceEscape", "Escape", "F2"]) {
        await oracle.setLoading(loading)
        await oracle.more().focus()
        await expect(oracle.more()).toBeFocused()
        const before = await oracle.loads()
        await oracle.clearEvents()
        if (key === "Click") {
          await oracle.more().click()
          expect(await oracle.loads()).toBe(before + 1)
          expect(await oracle.events()).toEqual([{ type: "click", key: undefined, prevented: false, bubbled: true }])
        } else if (key === "Enter" || key.startsWith("Space")) {
          const activation = key === "Enter" ? "Enter" : "Space"
          await page.keyboard.down(activation)
          expect(await oracle.loads()).toBe(before + (activation === "Enter" ? 1 : 0))
          expect((await oracle.events())[0]).toEqual({ type: "keydown", key: activation === "Enter" ? "Enter" : " ", prevented: activation === "Space", bubbled: activation === "Enter" })
          if (key === "SpaceEscape") await page.keyboard.press("Escape")
          await page.keyboard.up(activation)
          expect(await oracle.loads()).toBe(before + 1)
          expect((await oracle.events()).at(-1)).toEqual({ type: "keyup", key: activation === "Enter" ? "Enter" : " ", prevented: false, bubbled: true })
        } else {
          await page.keyboard.press(key)
          expect(await oracle.loads()).toBe(before)
          expect(await oracle.events()).toEqual([
            { type: "keydown", key, prevented: false, bubbled: true },
            { type: "keyup", key, prevented: false, bubbled: true },
          ])
        }
        await expect(oracle.more()).toBeFocused()
      }
      for (const modifier of ["Shift", "Control", "Alt", "Meta"]) {
        for (const key of ["Enter", "Space", "ArrowUp", "Home", "End", "F2"]) {
          await oracle.setLoading(loading)
          await oracle.more().focus()
          const before = await oracle.loads()
          await oracle.clearEvents()
          await page.keyboard.press(`${modifier}+${key}`)
          await expect(oracle.more()).toBeFocused()
          expect(await oracle.loads()).toBe(before)
          expect(await oracle.events()).toEqual([
            { type: "keydown", key: key === "Space" ? " " : key, prevented: false, bubbled: true },
            { type: "keyup", key: key === "Space" ? " " : key, prevented: false, bubbled: true },
          ])
        }
      }
    }
  }
})

test("notification-list: inline spinner Tab and blocked keys retain native focus and event routing", async ({ page }) => {
  for (const reference of [true, false]) {
    const oracle = await growingKeyboardOracle(page, reference)
    await oracle.setLoading(true)
    const spinner = oracle.more().getByRole("progressbar")
    for (const key of ["Enter", "Space", "Escape", "F2"]) {
      await spinner.focus()
      await expect(spinner).toBeFocused()
      await oracle.clearEvents()
      await page.keyboard.press(key)
      await expect(spinner).toBeFocused()
      expect(await oracle.loads()).toBe(0)
      expect(await oracle.events()).toEqual([
        { type: "keydown", key: key === "Space" ? " " : key, prevented: false, bubbled: false },
        { type: "keyup", key: key === "Space" ? " " : key, prevented: false, bubbled: false },
      ])
    }
    await spinner.focus()
    await page.keyboard.press("Tab")
    const after = oracle.host().locator(reference ? ".ui5-list-focusarea" : ".fiori-nli-group__list > .fiori-list__focusarea").last()
    await expect(after).toBeFocused()
    await spinner.focus()
    await oracle.clearEvents()
    await page.keyboard.press("Shift+Tab")
    await expect(oracle.more()).toBeFocused()
    expect(await oracle.events()).toEqual([
      { type: "keydown", key: "Tab", prevented: false, bubbled: false },
      { type: "keyup", key: "Tab", prevented: false, bubbled: true },
    ])
  }
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

test("notification-list: a local child request survives busy group state until the owning group renders, matching UI5", async ({ page }) => {
  const demo = page.locator("#notification-list-local-loading-demo")
  const owner = demo.locator('[data-nli-group]')
  const child = demo.locator('[data-nav-key="local-loading-child"]')
  const busy = child.locator(".fiori-nli__busy")
  await demo.getByRole("button", { name: "Start busy group", exact: true }).click()
  await expect(owner.locator(".fiori-nli-group__growing-busy")).toHaveAttribute("data-busy", "")
  const start = child.getByRole("button", { name: "Start local child loading", exact: true })
  await start.focus()
  await expect(start).toBeFocused()
  await expect(child).toHaveAttribute("tabindex", "0")
  await start.click()
  await expect(owner).toHaveAttribute("data-loading", "")
  await expect(child).toHaveAttribute("data-loading", "")
  await expect(busy).toHaveAttribute("inert", "")
  await expect(busy.locator('[role="progressbar"]')).toBeVisible()
  await expect(demo.locator('[role="progressbar"]')).toHaveCount(2)
  const more = owner.getByRole("button", { name: "More", exact: true })
  await more.focus()
  await expect(more).toBeFocused()
  await expect(busy).toHaveAttribute("data-active", "")
  await expect(busy.locator('[role="progressbar"]')).toBeVisible()
  await demo.getByRole("button", { name: "Render owning group", exact: true }).click()
  await expect(owner).toHaveAccessibleName("Loading")
  await expect(owner).toHaveAttribute("data-loading", "")
  await expect(child).not.toHaveAttribute("data-loading")
  await expect(busy).not.toHaveAttribute("data-active")
  await expect(busy).not.toHaveAttribute("inert")
  await expect(demo.locator("#notification-list-local-child-state")).toHaveText("Child request: loading")
  await child.getByRole("button", { name: "Reset local child loading", exact: true }).click()
  await expect(demo.locator("#notification-list-local-child-state")).toHaveText("Child request: idle")
  await child.getByRole("button", { name: "Start local child loading", exact: true }).click()
  await expect(busy).toHaveAttribute("inert", "")
  await expect(busy.locator('[role="progressbar"]')).toBeVisible()

  const oracle = await growingKeyboardOracle(page, true)
  await oracle.setLoading(true)
  await oracle.host().evaluate((group: any) => {
    ;(window as any).__notificationOwnedRenders = 0
    const before = group.onBeforeRendering.bind(group)
    group.onBeforeRendering = () => { (window as any).__notificationOwnedRenders++; before() }
    group.items[0].loading = true
  })
  const referenceChild = oracle.host().locator('ui5-li-notification[data-probe-key="orders-1"]')
  const referenceBusy = referenceChild.locator(".ui5-nli-loading")
  await expect(referenceChild).toHaveAttribute("loading", "")
  await expect(referenceBusy).toHaveAttribute("active", "")
  await expect(referenceBusy).toHaveAttribute("inert", "")
  await expect(referenceBusy.locator('[role="progressbar"]')).toBeVisible()
  expect(await page.evaluate(() => (window as any).__notificationOwnedRenders)).toBe(0)
  await oracle.more().focus()
  await expect(oracle.more()).toBeFocused()
  await expect(referenceBusy).toHaveAttribute("active", "")
  await expect(referenceBusy.locator('[role="progressbar"]')).toBeVisible()
  expect(await page.evaluate(() => (window as any).__notificationOwnedRenders)).toBe(0)
  await oracle.host().evaluate((group: any) => { group.titleText = "Rerendered busy group" })
  await expect(referenceChild).not.toHaveAttribute("loading")
  await expect(referenceBusy).not.toHaveAttribute("active")
  await expect(referenceBusy).not.toHaveAttribute("inert")
  expect(await page.evaluate(() => (window as any).__notificationOwnedRenders)).toBe(1)
  await oracle.host().evaluate((group: any) => { group.items[0].loading = false; group.items[0].loading = true })
  await expect(referenceBusy.locator('[role="progressbar"]')).toBeVisible()
  expect(await page.evaluate(() => (window as any).__notificationOwnedRenders)).toBe(1)
})

test("notification-list: the local-child-loading fixture exposes both inline and child busy areas", async ({ page }) => {
  for (const reference of [false, true]) {
    await page.goto(reference ? "/ui5.html?only=notification-list-growing-button-local-child-loading" : "/index.html?fixtures&only=notification-list-growing-button-local-child-loading")
    await page.waitForSelector("html[data-ready=true]")
    const fixture = page.locator('[data-fixture="notification-list-growing-button-local-child-loading"]')
    await expect(fixture.locator('[role="progressbar"]')).toHaveCount(2)
    const child = fixture.locator(reference ? "ui5-li-notification" : '[data-slot="notification-list-item"]')
    await expect(child.locator(reference ? ".ui5-nli-loading" : ".fiori-nli__busy")).toHaveAttribute("inert", "")
  }
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

test("notification-list: scroll append focuses its first new item after the delayed overlay releases inert content", async ({ page }) => {
  const { busy, content } = await requestDelayedScroll(page)
  await growingDemo(page).getByRole("button", { name: "Append approvals", exact: true }).click()
  await expect(growingItem(page, 2, "approvals")).not.toBeFocused()
  await growingDemo(page).getByRole("button", { name: "Append orders", exact: true }).click()
  await expect(growingItem(page, 3)).toHaveCount(1)
  await expect(growingItem(page, 3)).not.toBeFocused()
  await growingDemo(page).getByRole("button", { name: "Append orders", exact: true }).click()
  await expect(growingItem(page, 4)).toHaveCount(1)
  await growingDemo(page).getByRole("button", { name: "Finish loading orders", exact: true }).click()
  await expect(busy).not.toHaveAttribute("data-busy", "")
  await expect(content).not.toHaveAttribute("inert", "")
  await expect(growingItem(page, 3)).toBeFocused()
  await expect(growingItem(page, 4)).not.toBeFocused()
  await expect(growingItem(page, 2, "approvals")).not.toBeFocused()
})

for (const cancellation of ["collapse", "none", "unmount"] as const) {
  test(`notification-list: ${cancellation} cancels delayed scroll append focus before loading completion`, async ({ page }) => {
    await requestDelayedScroll(page)
    await growingDemo(page).getByRole("button", { name: "Append orders", exact: true }).click()
    await expect(growingItem(page, 3)).toHaveCount(1)
    if (cancellation === "collapse") {
      await growingGroup(page).getByRole("button", { name: "More orders", exact: true }).click()
      await expect(growingGroup(page)).toHaveAttribute("data-collapsed", "")
    } else if (cancellation === "none") {
      await growingDemo(page).getByLabel("Growing mode").selectOption("none")
      await expect(growingGroup(page)).toHaveAttribute("data-growing", "none")
    } else {
      await growingDemo(page).getByRole("button", { name: "Hide growing list", exact: true }).click()
      await expect(growingGroup(page)).toHaveCount(0)
    }
    await growingDemo(page).getByRole("button", { name: "Finish loading orders", exact: true }).click()
    if (cancellation === "collapse") {
      await growingGroup(page).getByRole("button", { name: "More orders", exact: true }).click()
      await expect(growingGroup(page)).not.toHaveAttribute("data-collapsed", "")
    } else if (cancellation === "none") {
      await growingDemo(page).getByLabel("Growing mode").selectOption("scroll")
      await expect(growingGroup(page)).toHaveAttribute("data-growing", "scroll")
    } else {
      await growingDemo(page).getByRole("button", { name: "Show growing list", exact: true }).click()
      await expect(growingGroup(page)).toHaveCount(1)
    }
    await expect(growingItem(page, 3)).toBeVisible()
    await expect(growingItem(page, 3)).not.toBeFocused()
  })
}

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
