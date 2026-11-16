import { expect, test, type Locator, type Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto(`/index.html#/all`)
  await page.waitForSelector("html[data-ready=true]")
})

const demo = (page: Page) => page.locator("#list-demo-selection")
const item = (page: Page, name: string) => demo(page).getByRole("listitem").filter({ hasText: name })

test("list: roles, header label and selection announced on list items", async ({ page }) => {
  const list = demo(page).getByRole("list")
  await expect(list).toHaveAccessibleName(/Contains Multi-Selectable Items Fruits/)
  await expect(demo(page).getByRole("listitem")).toHaveCount(5)
  // role=listitem can't carry aria-selected; UI5 announces it through aria-describedby too.
  await expect(item(page, "Bananas")).toHaveAccessibleDescription("Selected")
  await expect(item(page, "Apples")).toHaveAccessibleDescription("Not Selected")
  await expect(item(page, "Bananas")).not.toHaveAttribute("aria-selected", /.*/)
})

test("list: one tab stop on the selected item; arrows, Home/End, PageUp/PageDown move focus without wrapping", async ({ page }) => {
  await page.getByRole("button", { name: "singleAuto" }).focus()
  await page.getByRole("button", { name: "multiple" }).focus()
  await page.keyboard.press("Tab")
  await expect(item(page, "Bananas")).toBeFocused()
  await page.keyboard.press("ArrowUp")
  await expect(item(page, "Apples")).toBeFocused()
  await page.keyboard.press("ArrowUp") // no wrap
  await expect(item(page, "Apples")).toBeFocused()
  await page.keyboard.press("End")
  await expect(item(page, "Elderberries")).toBeFocused()
  await page.keyboard.press("Home")
  await expect(item(page, "Apples")).toBeFocused()
  await page.keyboard.press("PageDown") // 10 items down, clamped to the last
  await expect(item(page, "Elderberries")).toBeFocused()
  await page.keyboard.press("PageUp")
  await expect(item(page, "Apples")).toBeFocused()
  await expect(demo(page).locator('[tabindex="0"][data-slot="list-item"]')).toHaveCount(1)
})

test("list: Tab leaves the list, Shift+Tab comes back to the last focused item", async ({ page }) => {
  await item(page, "Cherries").click()
  await page.keyboard.press("Tab") // growing mode: Tab from an item goes to the More button
  await expect(demo(page).getByRole("button", { name: "More" })).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(item(page, "Cherries")).toBeFocused()
  await page.keyboard.press("Shift+Tab") // leaves the list backwards
  await expect(page.locator(":focus")).not.toHaveAttribute("data-slot", "list-item")
  await expect(demo(page).locator(":focus")).toHaveCount(0)
})

test("list: multiple mode — Space, Enter, click and the check box toggle", async ({ page }) => {
  const apples = item(page, "Apples")
  await apples.click()
  await expect(apples).toHaveAccessibleDescription("Selected")
  await expect(page.locator("#list-demo-clicked")).toHaveText("Last clicked: Apples")
  await page.keyboard.press("Space")
  await expect(apples).toHaveAccessibleDescription("Not Selected")
  await page.keyboard.press("Enter")
  await expect(apples).toHaveAccessibleDescription("Selected")
  await item(page, "Cherries").locator(".fiori-checkbox").click()
  await expect(item(page, "Cherries")).toHaveAccessibleDescription("Selected")
  await expect(page.locator("#list-demo-clicked")).toHaveText("Last clicked: Apples") // the check box doesn't fire item-click
  await expect(demo(page).locator("footer")).toHaveText("Selected: Bananas, Apples, Cherries")
})

test("list: single modes select one item; SingleAuto selects on focus", async ({ page }) => {
  await page.getByRole("button", { name: "singleStart", exact: true }).click()
  await expect(demo(page).locator(".fiori-radio")).toHaveCount(5)
  await item(page, "Cherries").click()
  await expect(demo(page).locator("footer")).toHaveText("Selected: Cherries")
  await page.keyboard.press("Enter") // re-selecting keeps the selection
  await expect(demo(page).locator("footer")).toHaveText("Selected: Cherries")
  await page.getByRole("button", { name: "singleAuto" }).click()
  await item(page, "Cherries").focus()
  await page.keyboard.press("ArrowDown")
  await expect(demo(page).locator("footer")).toHaveText("Selected: Dates")
})

test("list: growing button — ↓ on the last item, Enter loads more, ↑ goes back", async ({ page }) => {
  await item(page, "Elderberries").click()
  await page.keyboard.press("ArrowDown")
  const more = demo(page).getByRole("button", { name: "More" })
  await expect(more).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(demo(page).getByRole("listitem")).toHaveCount(9)
  await page.keyboard.press("ArrowUp")
  await expect(item(page, "Kiwis")).toBeFocused()
  await more.click()
  await expect(demo(page).getByRole("listitem")).toHaveCount(13)
})

test("list: delete mode — Delete key and delete button remove items; no data text", async ({ page }) => {
  const list = page.locator("#list-demo-delete")
  await expect(list.getByRole("list")).toHaveAccessibleName(/Contains Deletable Items/)
  await list.getByRole("listitem").filter({ hasText: "Inbox" }).click()
  await page.keyboard.press("Delete")
  await expect(list.getByRole("listitem").filter({ hasText: "Inbox" })).toHaveCount(0)
  await list.getByRole("listitem").filter({ hasText: "Drafts" }).getByRole("button", { name: "Delete" }).click()
  for (const x of ["Sent", "Spam"]) await list.getByRole("listitem").filter({ hasText: x }).getByRole("button", { name: "Delete" }).click()
  await expect(list.getByRole("listitem")).toHaveText("No folders")
})

test("list: custom items — Tab into content, F2 toggles, ↓ moves between content of adjacent items", async ({ page }) => {
  const list = page.locator("#list-demo-custom")
  const first = list.getByRole("listitem").first()
  await first.click({ position: { x: 10, y: 10 } })
  await page.keyboard.press("Tab")
  await expect(page.locator("#list-demo-custom-btn-a")).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(page.locator("#list-demo-custom-btn-b")).toBeFocused()
  await page.keyboard.press("F2")
  await expect(list.getByRole("listitem").nth(1)).toBeFocused()
  await page.keyboard.press("F2")
  await expect(page.locator("#list-demo-custom-btn-b")).toBeFocused()
  await page.keyboard.press("Tab") // last content element: leaves the list
  await expect(list.locator(":focus")).toHaveCount(0)
})

test("list: group headers take part in arrow navigation; disabled items are skipped", async ({ page }) => {
  const list = page.locator("#list-demo-rich")
  const headers = list.locator('[data-slot="list-item-group-header"]')
  await expect(headers).toHaveCount(2)
  await headers.first().focus()
  await page.keyboard.press("ArrowDown")
  await expect(list.getByRole("listitem").filter({ hasText: "John Doe" })).toBeFocused()
  await page.keyboard.press("End") // "Settings" item is disabled
  await expect(list.getByRole("listitem").filter({ hasText: "Mail" })).toBeFocused()
  await expect(list.getByRole("listitem").filter({ hasText: "Settings" }).last()).toHaveAttribute("aria-disabled", "true")
})

test("list: item focus ring only for keyboard focus", async ({ page }) => {
  const apples = item(page, "Apples")
  await apples.click()
  expect(await apples.evaluate((el) => getComputedStyle(el, "::after").content)).toBe("none")
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("ArrowUp")
  expect(await apples.evaluate((el) => getComputedStyle(el, "::after").content)).not.toBe("none")
})

test("list: dragTo accepts Before and the application reorders its items", async ({ page }) => {
  const list = page.locator("#list-demo #list-movable")
  const source = list.locator('[data-nav-key="Apples"]')
  await source.dragTo(list.locator('[data-nav-key="Cherries"]'), { targetPosition: { x: 40, y: 2 } })
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("Apples Before Cherries")
  await expect(list.getByRole("listitem").first().locator(".fiori-li__title")).toHaveText("Bananas")
  await expect(source).toBeFocused()
  await expect(source).not.toHaveAttribute("data-moving")
})

test("list: On is tried before its nearest edge and can be accepted without reordering", async ({ page }) => {
  const list = page.locator("#list-demo #list-movable")
  await page.locator("#list-demo #list-move-on").click()
  await list.locator('[data-nav-key="Apples"]').dragTo(list.locator('[data-nav-key="Bananas"]'))
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("Apples On Bananas")
  await expect(list.getByRole("listitem").first().locator(".fiori-li__title")).toHaveText("Apples")
})

test("list: rejected drops and fixed items never emit move", async ({ page }) => {
  const list = page.locator("#list-demo #list-movable")
  await page.locator("#list-demo #list-move-allow").click()
  await list.locator('[data-nav-key="Apples"]').dragTo(list.locator('[data-nav-key="Bananas"]'))
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("")
  await page.locator("#list-demo #list-move-allow").click()
  const fixed = list.locator('[data-nav-key="Dates"]')
  await expect(fixed).toHaveAttribute("draggable", "false")
  await fixed.dragTo(list.locator('[data-nav-key="Bananas"]'))
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("")
  await fixed.focus()
  await page.keyboard.press("Control+ArrowUp")
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("")
})

test("list: Ctrl and Cmd arrows reorder the focused item while retaining focus", async ({ page }) => {
  const list = page.locator("#list-demo #list-movable")
  const source = list.locator('[data-nav-key="Bananas"]')
  await source.focus()
  await page.keyboard.press("Control+ArrowUp")
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("Bananas Before Apples")
  await expect(source).toBeFocused()
  await expect(list.getByRole("listitem").first().locator(".fiori-li__title")).toHaveText("Bananas")
  await page.keyboard.press("Meta+ArrowDown")
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("Bananas After Apples")
  await expect(source).toBeFocused()
  await expect(list.getByRole("listitem").nth(1).locator(".fiori-li__title")).toHaveText("Bananas")
})

test("list: disabled movable items retain native programmatic Ctrl/Cmd moves and disabled activation/navigation", async ({ page, browser }) => {
  // UI5 ListItemTemplate keeps draggable=this.movable; List._moveItem only requires movable, even when disabled.
  const nativePage = await browser.newPage()
  await nativePage.goto("/ui5.html?only=list-movable-disabled")
  await nativePage.waitForSelector("html[data-ready=true]")
  const nativeList = nativePage.locator('[data-fixture="list-movable-disabled"] ui5-list')
  const nativeSource = nativeList.locator('ui5-li[disabled]')
  const nativeRoot = nativeSource.locator("li")
  await nativeList.evaluate((list) => {
    list.setAttribute("data-clicked", "")
    list.addEventListener("item-click", () => list.setAttribute("data-clicked", "clicked"))
    list.addEventListener("move-over", (event) => event.preventDefault())
    list.addEventListener("move", (event) => {
      const { source, destination } = (event as CustomEvent).detail
      list.setAttribute("data-move", `${source.element.textContent.trim()} ${destination.placement} ${destination.element.textContent.trim()}`)
      list.insertBefore(source.element, destination.placement === "Before" ? destination.element : destination.element.nextSibling)
    })
  })
  await expect(nativeRoot).toHaveAttribute("draggable", "true")
  await expect(nativeRoot).toHaveAttribute("tabindex", "-1")
  const nativeEnabled = nativeList.locator("ui5-li").first()
  const nativeEnabledRoot = nativeEnabled.locator("li")
  await nativeEnabled.evaluate((element) => (element as HTMLElement).focus())
  await expect(nativeEnabledRoot).toHaveCSS("cursor", "grab")
  await nativeEnabledRoot.evaluate((element) => element.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, composed: true, dataTransfer: new DataTransfer() })))
  await expect(nativeEnabled).toHaveAttribute("data-moving", "")
  await expect(nativeEnabledRoot).not.toHaveAttribute("data-moving", /.*/)
  await expect(nativeEnabledRoot).toHaveCSS("cursor", "grab")
  await expect(nativeEnabled).toHaveCSS("opacity", "1")
  await expect(nativeEnabledRoot).toHaveCSS("opacity", "1")
  await expect.poll(() => nativeEnabledRoot.evaluate((element) => getComputedStyle(element, "::after").content)).toBe("none")
  await nativeEnabledRoot.dispatchEvent("dragend")
  await expect(nativeEnabled).not.toHaveAttribute("data-moving", /.*/)
  await nativePage.keyboard.press("ArrowDown")
  await expect(nativeList.locator("ui5-li").last().locator("li")).toBeFocused()
  await nativeSource.evaluate((element) => (element as HTMLElement).focus())
  await expect(nativeRoot).toBeFocused()
  await nativeRoot.dispatchEvent("click")
  await nativePage.keyboard.press("Enter")
  await expect(nativeList).toHaveAttribute("data-clicked", "")
  await nativePage.keyboard.press("Control+ArrowUp")
  await expect(nativeList).toHaveAttribute("data-move", "Bananas Before Apples")
  await expect(nativeRoot).toBeFocused()
  await nativePage.keyboard.press("Meta+ArrowDown")
  await expect(nativeList).toHaveAttribute("data-move", "Bananas After Apples")
  await expect(nativeRoot).toBeFocused()
  await nativePage.close()

  const list = page.locator("#list-demo #list-movable")
  const source = list.locator('[data-nav-key="Bananas"]')
  const log = page.locator("#list-demo #list-move-log")
  await page.locator("#list-demo #list-move-disable-bananas").click()
  await expect(source).toHaveAttribute("draggable", "true")
  await expect(source).toHaveAttribute("tabindex", "-1")
  await list.locator('[data-nav-key="Apples"]').focus()
  await page.keyboard.press("ArrowDown")
  await expect(list.locator('[data-nav-key="Cherries"]')).toBeFocused()
  await source.focus()
  await expect(source).toBeFocused()
  await source.dispatchEvent("click")
  await page.keyboard.press("Enter")
  await expect(log).toHaveAttribute("data-clicked", "")
  await page.keyboard.press("Control+ArrowUp")
  await expect(log).toHaveText("Bananas Before Apples")
  await expect(source).toBeFocused()
  await page.keyboard.press("Meta+ArrowDown")
  await expect(log).toHaveText("Bananas After Apples")
  await expect(source).toBeFocused()
  await expect(source).toHaveAttribute("aria-disabled", "true")
  await expect(source).toHaveAttribute("tabindex", "-1")
  await expect.poll(() => source.evaluate((element) => getComputedStyle(element, "::after").content)).toBe("none")
})

test("list: Ctrl Home/End try farthest accepted destinations, including rejected-target fallback", async ({ page }) => {
  const list = page.locator("#list-demo #list-movable")
  const source = list.locator('[data-nav-key="Cherries"]')
  await page.locator("#list-demo #list-move-reject-apples").click()
  await source.focus()
  await page.keyboard.press("Control+Home")
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("Cherries Before Bananas")
  await expect(source).toBeFocused()
  await page.keyboard.press("Control+End")
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("Cherries After Dates")
  await expect(source).toBeFocused()
  await expect(list.getByRole("listitem").last().locator(".fiori-li__title")).toHaveText("Cherries")
})

test("list: accepted keyboard moves require caller data updates; boundary and rejected requests do nothing", async ({ page }) => {
  const list = page.locator("#list-demo #list-movable")
  const source = list.locator('[data-nav-key="Apples"]')
  await page.locator("#list-demo #list-move-reorder").click()
  await source.focus()
  await page.keyboard.press("Control+ArrowUp")
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("")
  await page.keyboard.press("Control+ArrowDown")
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("Apples After Bananas")
  await expect(list.getByRole("listitem").first().locator(".fiori-li__title")).toHaveText("Apples")
  await page.locator("#list-demo #list-move-allow").click()
  await source.focus()
  await page.keyboard.press("Control+End")
  await expect(source).toBeFocused()
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("Apples After Bananas")
})

test("list: an accepted drag paints the On indicator and drag leave removes it", async ({ page }) => {
  const list = page.locator("#list-demo #list-movable")
  await page.locator("#list-demo #list-move-on").click()
  const source = list.locator('[data-nav-key="Apples"]')
  const target = list.locator('[data-nav-key="Bananas"]')
  await expect(source).toHaveCSS("cursor", "grab")
  await source.evaluate((element) => element.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() })))
  await expect(source).toHaveAttribute("data-moving", "")
  await expect(source).toHaveCSS("cursor", "grab")
  await expect(source).toHaveCSS("opacity", "1")
  await target.evaluate((element) => {
    const box = element.getBoundingClientRect()
    element.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, clientY: box.top + box.height / 2 }))
  })
  const indicator = list.locator('[data-slot="drop-indicator"]')
  await expect(indicator).toHaveAttribute("data-placement", "On")
  await expect(indicator.locator(".fiori-drop-indicator__rect")).toBeVisible()
  await target.dispatchEvent("dragleave", { relatedTarget: null })
  await expect(indicator).toHaveCount(0)
  await source.dispatchEvent("dragend")
  await expect(source).not.toHaveAttribute("data-moving")
  await expect(source).toHaveCSS("cursor", "grab")
})

test("list: native originalEvent identity survives pointer and keyboard move callbacks", async ({ page }) => {
  const list = page.locator("#list-demo #list-movable")
  const source = list.locator('[data-nav-key="Bananas"]')
  await source.focus()
  await page.keyboard.press("Control+ArrowUp")
  const log = page.locator("#list-demo #list-move-log")
  await expect(log).toHaveAttribute("data-native-over", "true")
  await expect(log).toHaveAttribute("data-native-move", "true")
  await source.dragTo(list.locator('[data-nav-key="Cherries"]'), { targetPosition: { x: 40, y: 2 } })
  await expect(log).toHaveText("Bananas Before Cherries")
  await expect(log).toHaveAttribute("data-native-over", "true")
  await expect(log).toHaveAttribute("data-native-move", "true")
})

test("list: draggable child content is not registered as a movable list item", async ({ page }) => {
  const list = page.locator("#list-demo #list-movable")
  await list.locator("#list-movable-nested-source").dragTo(list.locator('[data-nav-key="Bananas"]'))
  await expect(page.locator("#list-demo #list-move-log")).toHaveText("")
})

test("list: an accepted Table source drop focuses the previously unfocused native row", async ({ page }) => {
  const source = page.locator('#table-demo #table-movable [data-row-key="P0002"]')
  const list = page.locator("#list-demo #list-movable")
  const target = list.locator('[data-nav-key="Bananas"]')
  await expect(source).not.toHaveAttribute("tabindex", /.*/)
  await expect(source).not.toBeFocused()
  await source.evaluate((element) => element.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() })))
  await target.evaluate((element) => {
    const box = element.getBoundingClientRect()
    element.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, clientY: box.top + 2 }))
  })
  await target.dispatchEvent("drop")
  const log = page.locator("#list-demo #list-move-log")
  await expect(log).toHaveText("P0002 Before Bananas")
  await expect(log).toHaveAttribute("data-native-over", "true")
  await expect(log).toHaveAttribute("data-native-move", "true")
  await expect(source).toHaveAttribute("tabindex", "-1")
  await expect(source).toBeFocused()
  await expect(list.locator('[data-slot="list-item"]')).toHaveCount(4)
  await source.dispatchEvent("dragend")
})

test("list: natural active drags retain native rich foreground and selected text shadow behavior", async ({ page, browser }) => {
  // ListItem._onmousedown activates; _ondragstart retains active. ListItem.css keeps foreground and clears selected text shadow while moving.
  const nativePage = await browser.newPage()
  await nativePage.goto("/ui5.html?only=list-movable-rich")
  await nativePage.waitForSelector("html[data-ready=true]")
  await page.goto("/index.html?fixtures&only=list-movable-rich")
  await page.waitForSelector("html[data-ready=true]")
  const nativeSource = nativePage.locator('[data-fixture="list-movable-rich"] ui5-li')
  const reactSource = page.locator('[data-fixture="list-movable-rich"] [data-slot="list-item"]')
  const snapshot = (source: Locator, native: boolean) => source.evaluate((element, isNative) => {
    const scope = isNative ? element.shadowRoot! : element
    const prefix = isNative ? ".ui5-li-" : ".fiori-li__"
    const foreground = Object.fromEntries(["icon", "title", "desc", "additional-text"].map((part) => [part, getComputedStyle(scope.querySelector(prefix + part)!).color]))
    const nativeLi = isNative ? scope.querySelector("li")! : element
    return { foreground, textShadow: getComputedStyle(scope.querySelector(prefix + "additional-text")!).textShadow, background: getComputedStyle(element).backgroundColor, opacity: getComputedStyle(element).opacity, cursor: getComputedStyle(nativeLi).cursor }
  }, native)
  const states = []
  for (const { targetPage, source, native } of [{ targetPage: nativePage, source: nativeSource, native: true }, { targetPage: page, source: reactSource, native: false }]) {
    const focusRoot = native ? source.locator("li") : source
    await focusRoot.focus()
    await expect(focusRoot).toBeFocused()
    const box = (await focusRoot.boundingBox())!
    await targetPage.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await targetPage.mouse.down()
    await expect(source).toHaveAttribute(native ? "active" : "data-active", "")
    const pressed = await snapshot(source, native)
    await targetPage.mouse.move(box.x + box.width / 2 + 24, box.y + box.height / 2, { steps: 4 })
    await expect(source).toHaveAttribute("data-moving", "")
    await expect(source).toHaveAttribute(native ? "active" : "data-active", "")
    if (native) await expect(focusRoot).not.toHaveAttribute("data-moving", /.*/)
    const moving = await snapshot(source, native)
    await targetPage.mouse.up()
    await expect(source).not.toHaveAttribute("data-moving", /.*/)
    states.push({ pressed, moving })
  }
  expect(states[0].moving.foreground).toEqual(states[0].pressed.foreground)
  expect(states[0].moving.textShadow).toBe("none")
  expect(states[0].moving.background).not.toBe(states[0].pressed.background)
  expect(states[1]).toEqual(states[0])
  await test.info().attach("native-active-moving-styles", { body: JSON.stringify(states, null, 2), contentType: "application/json" })
  await nativePage.close()
})


for (const channel of ["name", "name-ref", "description", "description-ref", "role", "growing"]) test(`List ${channel} reaches the native owning element`, async ({ page, browser }) => {
  const id = `list-a11y-${channel}`
  await page.goto(`/index.html?fixtures&only=${id}`)
  await page.waitForSelector("html[data-ready=true]")
  const reference = await browser.newPage()
  try {
    await reference.goto(`/ui5.html?only=${id}`)
    await reference.waitForSelector("html[data-ready=true]")
    const ours = page.locator(`[data-fixture="${id}"]`), native = reference.locator(`[data-fixture="${id}"]`)
    for (const holder of [ours, native]) {
      if (channel === "role") await expect(holder.getByRole("listbox", { name: "List" })).toHaveCount(1)
      else if (channel === "growing") {
        await expect(holder.getByRole("button", { name: "Load produce" })).toHaveAccessibleDescription("Fetch additional fruit")
      } else if (channel.startsWith("name")) await expect(holder.getByRole("list")).toHaveAccessibleName("Produce")
      else await expect(holder.getByRole("list")).toHaveAccessibleDescription("Fresh fruit")
    }
  } finally { await reference.close() }
})

test("List description refs track changed targets on the native ul description channel", async ({ page, browser }) => {
  const id = "list-a11y-description-ref"
  const reference = await browser.newPage()
  try {
    for (const [index, current] of [page, reference].entries()) {
      await current.goto(`/${index ? "ui5" : "index"}.html?fixtures&only=${id}`)
      await current.waitForSelector("html[data-ready=true]")
      const holder = current.locator(`[data-fixture="${id}"]`)
      const list = holder.getByRole("list")
      await expect(list).toHaveAttribute("aria-description", "Fresh fruit")
      await expect(list).not.toHaveAttribute("aria-describedby")
      await holder.locator('span[id^="list-a11y-description-ref-target"]').evaluate((target) => { target.textContent = "Seasonal produce" })
      await expect(list).toHaveAccessibleDescription("Seasonal produce")
      await expect(list).toHaveAttribute("aria-description", "Seasonal produce")
    }
  } finally { await reference.close() }
})

test("List custom focus description matches UI5 content and controls and clears on blur", async ({ page, browser }) => {
  await page.goto("/index.html?fixtures&only=list-custom")
  await page.waitForSelector("html[data-ready=true]")
  const ours = page.locator('[data-fixture="list-custom"]').getByRole("listitem").first()
  const reference = await browser.newPage()
  try {
    await reference.goto("/ui5.html?only=list-custom")
    await reference.waitForSelector("html[data-ready=true]")
    const native = reference.locator('[data-fixture="list-custom"]').getByRole("listitem").first()
    await expect(ours).toHaveAccessibleName("Is Active")
    await expect(native).toHaveAccessibleName("Is Active")
    await ours.focus()
    await expect(ours).toBeFocused()
    await native.focus()
    await expect(native).toBeFocused()
    const expected = "List Item Custom item Button Edit . Includes element Is Active"
    await expect(ours).toHaveAccessibleName(expected)
    // UI5 CustomAnnouncement.js uses ariaLabelledByElements; Playwright's DOM
    // name algorithm omits element-reference ARIA. Verify Chromium's real AX name.
    const session = await reference.context().newCDPSession(reference)
    try {
      await session.send("Accessibility.enable")
      await native.evaluate((element) => { (window as any).__listA11yItem = element })
      const { result } = await session.send("Runtime.evaluate", { expression: "window.__listA11yItem" })
      await expect.poll(async () => {
        const { nodes } = await session.send("Accessibility.getPartialAXTree", { objectId: result.objectId! })
        return nodes[0].name?.value
      }).toBe(expected)
      await test.info().attach("list-custom-raw-ax", { body: JSON.stringify(await session.send("Accessibility.getFullAXTree")), contentType: "application/json" })
      await expect.poll(() => native.evaluate((element) => element.ariaLabelledByElements?.every((target) => target.isConnected && !!target.textContent))).toBe(true)
      await reference.locator('[data-fixture="list-custom"] ui5-li-custom').first().getByRole("button", { name: "Edit" }).focus()
      await expect.poll(async () => {
        const { nodes } = await session.send("Accessibility.getPartialAXTree", { objectId: result.objectId! })
        return nodes[0].name?.value
      }).toBe(expected)
      await reference.locator('[data-fixture="list-custom"]').evaluate((cell) => { const next = document.createElement("button"); next.textContent = "After list"; cell.after(next); next.focus() })
      await expect(reference.getByRole("button", { name: "After list" })).toBeFocused()
      await expect.poll(async () => {
        const { nodes } = await session.send("Accessibility.getPartialAXTree", { objectId: result.objectId! })
        return nodes[0].name?.value
      }).toBe("Is Active")
    } finally { await session.detach() }
    await ours.getByRole("button", { name: "Edit" }).focus()
    await ours.evaluate((element) => { const next = document.createElement("button"); next.textContent = "After list"; element.closest('[data-fixture]')?.after(next); next.focus() })
    await expect(ours).toHaveAccessibleName("Is Active")
  } finally { await reference.close() }
})

test("List selection changes announce politely with the same selected/not-selected text", async ({ page }) => {
  const apples = item(page, "Apples")
  const live = page.locator('[data-slot="list-announcement"][data-owner="list-demo-selection"]')
  await apples.focus()
  await expect(apples).toBeFocused()
  await page.keyboard.press("Space")
  await expect(apples).toHaveAccessibleDescription("Selected")
  await expect(live).toHaveAttribute("aria-live", "polite")
  await expect(live).toHaveText("Selected")
  await page.keyboard.press("Space")
  await expect(apples).toHaveAccessibleDescription("Not Selected")
  await expect(live).toHaveText("Not Selected")
})

for (const role of ["list", "listbox", "menu", "tree"] as const) test(`List ${role} inherits the UI5 item role`, async ({ page, browser }) => {
  const id = `list-a11y-root-${role}`
  await page.goto(`/index.html?fixtures&only=${id}`)
  await page.waitForSelector("html[data-ready=true]")
  const reference = await browser.newPage()
  try {
    await reference.goto(`/ui5.html?only=${id}`)
    await reference.waitForSelector("html[data-ready=true]")
    for (const holder of [page.locator(`[data-fixture="${id}"]`), reference.locator(`[data-fixture="${id}"]`)]) {
      await expect(holder.getByRole(role, { name: "List", exact: true })).toHaveCount(1)
      await expect(holder.getByRole(role === "list" ? "listitem" : role === "listbox" ? "option" : role === "menu" ? "menuitem" : "treeitem")).toHaveAccessibleName("Apples Inactive")
    }
  } finally { await reference.close() }
})

for (const mode of ["multiple", "single-start"] as const) test(`List ${mode} selection control keeps its UI5 role, state, label and keyboard activation`, async ({ page, browser }) => {
  const id = `list-mode-${mode}`
  const reference = await browser.newPage()
  try {
    await page.goto(`/index.html?fixtures&only=${id}`)
    await reference.goto(`/ui5.html?only=${id}`)
    for (const current of [page, reference]) {
      await current.waitForSelector("html[data-ready=true]")
      const control = current.locator(`[data-fixture="${id}"]`).getByRole(mode === "multiple" ? "checkbox" : "radio").first()
      await expect(control).toHaveAccessibleName(mode === "multiple" ? "Multiple Selection Mode" : "Item Selection.")
      await expect(control).toHaveAttribute("tabindex", "-1")
      await expect(control).toHaveAttribute("aria-checked", "false")
      await control.focus()
      await expect(control).toBeFocused()
      await current.keyboard.press("Enter")
      await expect(control).toHaveAttribute("aria-checked", "true")
      if (mode === "multiple") {
        await current.keyboard.press("Space")
        await expect(control).toHaveAttribute("aria-checked", "false")
      }
    }
  } finally { await reference.close() }
})

for (const id of ["list-custom", "list-groups", "list-types", "list-a11y-group-header-name", "list-a11y-standard-name", "list-a11y-custom-name"]) test(`List ${id} preserves UI5 descriptions and custom content semantics`, async ({ page, browser }) => {
  const reference = await browser.newPage()
  try {
    await page.goto(`/index.html?fixtures&only=${id}`)
    await reference.goto(`/ui5.html?only=${id}`)
    for (const current of [page, reference]) {
      await current.waitForSelector("html[data-ready=true]")
      const holder = current.locator(`[data-fixture="${id}"]`)
      if (id === "list-custom" || id === "list-types") await expect(holder.getByRole("list", { name: "List", exact: true })).toHaveAccessibleDescription("List with interactive items. To move to the content, press F2.")
      if (id === "list-groups") {
        await expect(holder.getByRole("list", { name: "List", exact: true })).toHaveAccessibleDescription("contains 2 sub groups with 3 items")
        const childList = holder.getByRole("list", { name: "Fruits", exact: true })
        await expect(childList).toHaveAttribute("aria-owns", /.+/)
        await expect.poll(() => childList.evaluate((element) => (() => {
          const id = element.getAttribute("aria-owns")!
          const find = (root: ParentNode): boolean => [...root.querySelectorAll("*")].some((candidate) => candidate.id === id && candidate.isConnected || !!candidate.shadowRoot && find(candidate.shadowRoot))
          return find(document)
        })())).toBe(true)
      }
      if (id === "list-a11y-group-header-name") await expect(holder.getByRole("listitem", { name: "Fruit group Produce categories", exact: true })).toHaveAttribute("aria-roledescription", "Group Header")
      if (id === "list-a11y-standard-name") await expect(holder.getByRole("listitem")).toHaveAccessibleName("Produce row Is Active")
      if (id === "list-a11y-custom-name") {
        const custom = holder.getByRole("option")
        await expect(custom).toHaveAccessibleName("Produce row Is Active")
        await expect(custom).toHaveAttribute("aria-posinset", "2")
        await expect(custom).toHaveAttribute("aria-setsize", "7")
        await expect(custom).toHaveAttribute("aria-selected", "true")
        await expect(custom).toHaveAttribute("tabindex", "0")
        await expect(custom).toHaveAccessibleDescription("Selected")
      }
    }
  } finally { await reference.close() }
})

test("List RTL preserves vertical roving focus and selection announcements", async ({ page }) => {
  await page.goto("/index.html?fixtures&only=list-a11y-selection-rtl")
  await page.waitForSelector("html[data-ready=true]")
  const rows = page.locator('[data-fixture="list-a11y-selection-rtl"]').getByRole("listitem")
  await rows.first().focus()
  await expect(rows.first()).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(rows.nth(1)).toBeFocused()
  await page.keyboard.press("Space")
  await expect(rows.nth(1)).toHaveAccessibleDescription("Selected")
  await expect(page.locator('[data-slot="list-announcement"]')).toHaveText("Selected")
})

test("List texts overrides keep owned selection, group and focus descriptions", async ({ page }) => {
  const list = page.locator("#list-demo #list-text-overrides")
  await expect(list.getByRole("list", { name: "Produce choices Produce", exact: true })).toHaveAccessibleDescription("Grouped produce. Edit from a row. 1 categories, 2 produce rows")
  const apple = list.getByRole("listitem", { name: "Apples Available", exact: true })
  await apple.focus()
  await expect(apple).toBeFocused()
  await page.keyboard.press("Space")
  await expect(apple).toHaveAccessibleDescription("Produce selected")
  await expect(list.getByRole("checkbox").first()).toHaveAccessibleName("Select produce")
  await expect(page.locator('[data-slot="list-announcement"][data-owner="list-text-overrides"]')).toHaveText("Produce selected")
})
