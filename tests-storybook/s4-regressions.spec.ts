import { expect, test, type Page } from "@playwright/test"
import { axeViolations, waitForStoryFinished } from "./accessibility"
import { attachAudit, classifyViolations } from "./known-issues"

// S4: the owner-approved third attempt requires a persistent regression of the
// actual controlled story callbacks, rather than a duplicated controller model.
const story = "navigation-variant-management--playground"
const canvas = (page: Page) => page.locator(`[data-fiori-story="${story}"]`)
const readArgs = async (page: Page) => JSON.parse(await canvas(page).getAttribute("data-fiori-args") ?? "{}")

test("S4 heading-level Controls keep the saved-view title and its application hierarchy accessible", async ({ page }, testInfo) => {
  await page.goto("/iframe.html?viewMode=docs&id=navigation-variant-management--docs")
  const primary = page.locator("[data-fiori-primary]")
  const control = page.locator("[data-fiori-controls]").getByRole("combobox", { name: "level", exact: true })
  await expect(primary.locator(".fiori-vm-title")).toHaveRole("heading")
  for (const level of ["H1", "H2", "H3", "H4", "H5", "H6", "Auto"]) {
    await control.selectOption(level)
    const expectedLevel = level === "Auto" ? 2 : Number(level.slice(1))
    await expect(primary.getByRole("heading", { name: "My view", exact: true, level: expectedLevel })).toBeVisible()
    const audit = await classifyViolations(page, await axeViolations(page, "sap_horizon", "[data-fiori-primary]"), {
      story, theme: "sap_horizon", primary: true, control: { prop: "level", choice: level },
    })
    await attachAudit(testInfo, "saved-view-heading-" + level, audit)
    expect(audit.unexpected).toEqual([])
  }
})

for (const newDefault of [true, false]) {
  test(`S4 deleting the modified Personal view loads the clean ${newDefault ? "new" : "current"} Public default`, async ({ page }, testInfo) => {
    await page.goto(`/iframe.html?viewMode=story&id=${story}&args=modified:true;defaultKey:${newDefault ? "standard" : "public"}`)
    const trigger = canvas(page).getByRole("button", { name: "Modified view My view.", exact: true })
    await expect(trigger).toBeVisible()
    await waitForStoryFinished(page)
    await expect(canvas(page).locator(".fiori-vm-modified")).toHaveText("*")
    await trigger.click()
    const list = page.locator(".fiori-vm-list")
    // Establish that the selected saved view really has an editable unsaved state.
    await expect(list.getByRole("button", { name: "Save", exact: true })).toBeVisible()
    await list.getByRole("button", { name: "Manage", exact: true }).click()
    const manage = page.getByRole("dialog", { name: "Manage Views", exact: true })
    await expect(manage).toBeVisible()
    const publicRow = manage.locator('[data-variant-key="public"]')
    if (newDefault) await publicRow.getByRole("radio", { name: "Default", exact: true }).check()
    await expect(publicRow.getByRole("radio", { name: "Default", exact: true })).toBeChecked()
    await manage.locator('[data-variant-key="personal"]').getByRole("button", { name: "Delete View", exact: true }).click()
    await expect(manage.locator('[data-variant-key="personal"]')).toHaveCount(0)
    await manage.getByRole("button", { name: "Save", exact: true }).click()
    await expect(manage).toHaveCount(0)
    await expect.poll(() => readArgs(page)).toMatchObject({ selectedKey: "public", defaultKey: "public", modified: false })
    await expect(canvas(page).locator(".fiori-vm-title")).toHaveText("Shared view")
    await expect(canvas(page).locator(".fiori-vm-trigger")).not.toHaveAttribute("data-modified", "")
    await expect(canvas(page).locator(".fiori-vm-modified")).toBeEmpty()
    const cleanTrigger = canvas(page).getByRole("button", { name: "View Shared view.", exact: true })
    await expect(cleanTrigger).toBeFocused()
    // SEL_VARIANT is the component's selected-view announcement/name. It must
    // lose SEL_VARIANT_MOD along with the visual star and controlled Save state.
    await expect(cleanTrigger).toHaveAccessibleName("View Shared view.")
    await expect(canvas(page).getByRole("button", { name: /^Modified view/ })).toHaveCount(0)
    await cleanTrigger.click()
    await expect(list.getByRole("option", { name: /Shared view/ })).toHaveAttribute("aria-selected", "true")
    await expect(list.getByRole("option", { name: /My view/ })).toHaveCount(0)
    await expect(list.getByRole("button", { name: "Save", exact: true })).toHaveCount(0)
    await expect(list.getByRole("button", { name: "Save As", exact: true })).toHaveAttribute("data-variant", "emphasized")
    await testInfo.attach("controlled-fallback-state.json", { body: JSON.stringify(await readArgs(page), null, 2), contentType: "application/json" })
  })
}

test("S4 unrelated Manage changes preserve the selected view's unsaved state", async ({ page }, testInfo) => {
  await page.goto(`/iframe.html?viewMode=story&id=${story}&args=modified:true`)
  const trigger = canvas(page).getByRole("button", { name: "Modified view My view.", exact: true })
  await expect(trigger).toBeVisible()
  await waitForStoryFinished(page)
  await trigger.click()
  await page.locator(".fiori-vm-list").getByRole("button", { name: "Manage", exact: true }).click()
  const manage = page.getByRole("dialog", { name: "Manage Views", exact: true })
  await expect(manage).toBeVisible()
  await manage.locator('[data-variant-key="public"]').getByRole("radio", { name: "Default", exact: true }).check()
  await expect(manage.locator('[data-variant-key="public"]').getByRole("radio", { name: "Default", exact: true })).toBeChecked()
  await manage.getByRole("button", { name: "Save", exact: true }).click()
  await expect(manage).toHaveCount(0)
  await expect.poll(() => readArgs(page)).toMatchObject({ selectedKey: "personal", defaultKey: "public", modified: true })
  await expect(trigger).toBeFocused()
  await expect(canvas(page).locator(".fiori-vm-modified")).toHaveText("*")
  await trigger.click()
  await expect(page.locator(".fiori-vm-list").getByRole("button", { name: "Save", exact: true })).toBeVisible()
  await testInfo.attach("controlled-surviving-view-state.json", { body: JSON.stringify(await readArgs(page), null, 2), contentType: "application/json" })
})

// S4: exercise exact production-story nodes. A marker must reject a changed
// structure/name and leave another node with the same axe rule unexpected.
const defectCases = [
  { story: "navigation-search--open", rule: "aria-allowed-role", mutation: "group" },
  { story: "navigation-search--deletable-suggestion", rule: "nested-interactive", mutation: "delete" },
  { story: "navigation-notification-list--growing-button-loading", rule: "nested-interactive", mutation: "growing" },
  { story: "navigation-side-navigation--flat", rule: "label-content-name-mismatch", mutation: "tag" },
  { story: "navigation-side-navigation--open", rule: "aria-required-children", mutation: "menu" },
  { story: "navigation-variant-management--empty-list", rule: "empty-heading", mutation: "heading" },
  { story: "floorplans-list-report--playground", rule: "landmark-banner-is-top-level", mutation: "banner" },
  { story: "floorplans-object-page--playground", rule: "landmark-unique", mutation: "region" },
] as const

for (const defect of defectCases) {
  test("S4 " + defect.mutation + " defect marker rejects changed or foreign owned nodes", async ({ page }, testInfo) => {
    await page.goto("/iframe.html?viewMode=story&id=" + defect.story)
    await expect(page.locator('#storybook-root [data-fiori-story="' + defect.story + '"] [data-slot]').first()).toBeAttached()
    await waitForStoryFinished(page)
    const context = { story: defect.story, theme: "sap_horizon" }
    const raw = (await axeViolations(page, context.theme)).filter(v => v.id === defect.rule)
    expect(raw.length).toBe(1)
    const initial = await classifyViolations(page, raw, context)
    expect(initial.unexpected).toEqual([])
    expect(initial.known.flatMap(v => v.nodes).length).toBeGreaterThan(0)
    // Story and rule are independently protected, even for identical DOM.
    expect((await classifyViolations(page, raw, { ...context, story: "actions-button--playground" })).known).toEqual([])
    expect((await classifyViolations(page, raw.map(v => ({ ...v, id: "s4-unapproved-rule" })), context)).known).toEqual([])
    await page.evaluate(mutation => {
      const button = () => { const node = document.createElement("button"); node.textContent = "Foreign action"; return node }
      if (mutation === "group") {
        const group = document.querySelector('[data-slot="search-item-group"]')!
        const foreign = document.createElement("li"); foreign.id = "s4-foreign-group"; foreign.setAttribute("role", "group"); foreign.textContent = "Foreign group"
        group.parentElement!.append(foreign)
      } else if (mutation === "delete") document.querySelector('[data-slot="search-item"]')!.append(button())
      else if (mutation === "growing") document.querySelector('[data-nli-growing]')!.append(button())
      else if (mutation === "tag") document.querySelector('.fiori-sn-item__tag [data-slot="tag"]')!.textContent = "Sale"
      else if (mutation === "menu") document.querySelector('[data-sn-overflow-menu]')!.append(button())
      else if (mutation === "heading") {
        const foreign = document.createElement("h2"); foreign.id = "s4-foreign-heading"; document.querySelector("#storybook-root")!.append(foreign)
      } else if (mutation === "banner") {
        const foreign = document.createElement("header"); foreign.id = "s4-foreign-banner"; foreign.setAttribute("role", "banner"); foreign.setAttribute("aria-label", "Foreign header")
        document.querySelector('.fiori-dynamic-page__root[role="main"]')!.append(foreign)
      } else {
        const foreign = document.createElement("section"); foreign.id = "s4-foreign-region"; foreign.setAttribute("aria-label", "General Information"); foreign.textContent = "Another region"
        document.querySelector("#storybook-root")!.append(foreign)
      }
    }, defect.mutation)
    const changed = (await axeViolations(page, context.theme)).filter(v => v.id === defect.rule)
    const audit = await classifyViolations(page, changed, context)
    await attachAudit(testInfo, "s4-" + defect.mutation + "-adversarial", audit)
    expect(audit.unexpected.flatMap(v => v.nodes).length).toBeGreaterThan(0)
    if (["group", "heading", "banner"].includes(defect.mutation)) {
      expect(audit.unexpected.flatMap(v => v.nodes).some(node => JSON.stringify(node.target).includes("s4-foreign"))).toBe(true)
    } else expect(audit.known).toEqual([])
  })
}

test("S4 overflow portal region marker rejects foreign content and other story/rule contexts", async ({ page }, testInfo) => {
  const story = "navigation-side-navigation--open"
  await page.goto("/iframe.html?viewMode=story&id=" + story)
  await expect(page.getByRole("menu", { name: "Additional Navigation Items", exact: true })).toBeVisible()
  await waitForStoryFinished(page)
  const context = { story, theme: "sap_horizon" }
  const raw = (await axeViolations(page, context.theme)).filter(v => v.id === "region")
  expect(raw).toHaveLength(1)
  const initial = await classifyViolations(page, raw, context)
  expect(initial.unexpected).toEqual([])
  expect(initial.known.flatMap(v => v.nodes)).toHaveLength(1)
  expect((await classifyViolations(page, raw, { ...context, story: "actions-button--playground" })).known).toEqual([])
  expect((await classifyViolations(page, raw.map(v => ({ ...v, id: "s4-unapproved-rule" })), context)).known).toEqual([])
  await page.evaluate(() => {
    const foreign = document.createElement("p")
    foreign.id = "s4-foreign-menu-region"
    foreign.textContent = "Content outside the navigation menu"
    document.body.append(foreign)
  })
  const audit = await classifyViolations(page, (await axeViolations(page, context.theme)).filter(v => v.id === "region"), context)
  await attachAudit(testInfo, "s4-foreign-menu-region", audit)
  expect(audit.known.flatMap(v => v.nodes)).toHaveLength(1)
  expect(audit.unexpected.flatMap(v => v.nodes).some(node => JSON.stringify(node.target).includes("s4-foreign-menu-region"))).toBe(true)
})

test("S4 empty-title marker rejects an extra empty element inside the owned heading", async ({ page }, testInfo) => {
  const story = "navigation-variant-management--empty-list"
  await page.goto("/iframe.html?viewMode=story&id=" + story)
  // The empty title has zero width; its attached heading remains axe-visible.
  await expect(page.locator(".fiori-vm-title")).toBeAttached()
  await waitForStoryFinished(page)
  await page.locator(".fiori-vm-title").evaluate(node => node.append(document.createElement("span")))
  const audit = await classifyViolations(page, (await axeViolations(page, "sap_horizon")).filter(v => v.id === "empty-heading"), { story, theme: "sap_horizon" })
  await attachAudit(testInfo, "s4-extra-empty-title-element", audit)
  expect(audit.known).toEqual([])
  expect(audit.unexpected.flatMap(v => v.nodes)).toHaveLength(1)
})

test("S4 Tabs Open play leaves the real overflow list visible without console errors", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", error => errors.push(error.message))
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()) })
  await page.goto("/iframe.html?viewMode=story&id=navigation-tabs--open")
  const canvas = page.locator('[data-fiori-story="navigation-tabs--open"]')
  await expect(canvas.getByRole("button", { name: "More", exact: true })).toBeVisible()
  await waitForStoryFinished(page)
  await expect(canvas.getByRole("button", { name: "More", exact: true })).toHaveAttribute("aria-expanded", "true")
  const overflow = page.getByRole("list", { name: "Hidden tabs", exact: true })
  await expect(overflow).toBeVisible()
  await expect(overflow.getByRole("listitem").first()).toBeVisible()
  expect(errors).toEqual([])
})
