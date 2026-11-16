import { expect, test } from "@playwright/test"

test("Select opens on completed primary click and preserves keyboard opening", async ({ page }) => {
  await page.goto("/index.html?fixtures&only=select")
  await page.waitForSelector("html[data-ready=true]")
  const trigger = page.locator('[data-fixture="select"] [data-slot="select-trigger"]')
  await trigger.hover()
  try {
    await page.mouse.down()
    await expect(trigger).toHaveAttribute("aria-expanded", "false")
    await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0)
  } finally {
    await page.mouse.up()
  }
  await expect(trigger).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByRole("option", { name: "Germany", exact: true })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(trigger).toHaveAttribute("aria-expanded", "false")
  await expect(trigger).toBeFocused()
  await page.keyboard.press("Space")
  await expect(trigger).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByRole("option", { name: "Germany", exact: true })).toBeFocused()
})


test("Select desktop popup owns a named modal dialog and removes the hidden trigger from tab order", async ({ page }) => {
  await page.goto("/index.html?fixtures&only=select")
  await page.waitForSelector("html[data-ready=true]")
  const trigger = page.locator('[data-fixture="select"] [data-slot="select-trigger"]')
  await trigger.focus()
  await expect(trigger).toBeFocused()
  await page.keyboard.press("F4")
  const dialog = page.getByRole("dialog", { name: "Select Select", exact: true })
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute("aria-modal", "true")
  await expect(dialog.getByRole("listbox")).toHaveCount(1)
  await expect(trigger).toHaveAttribute("tabindex", "-1")
  await expect(dialog.getByRole("option", { name: "Germany", exact: true })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await expect(trigger).not.toHaveAttribute("tabindex", "-1")
})


for (const channel of ["name", "name-ref", "description", "description-ref"]) test(`Select ${channel} reaches the same native combobox as UI5`, async ({ page, browser }) => {
  const id = `select-a11y-${channel}`
  await page.goto(`/index.html?fixtures&only=${id}`)
  await page.waitForSelector("html[data-ready=true]")
  const reference = await browser.newPage()
  try {
    await reference.goto("/ui5.html")
    await reference.waitForSelector("html[data-ready=true]")
    const ours = page.locator(`[data-fixture="${id}"]`).getByRole("combobox"), ui5 = reference.locator(`[data-fixture="${id}"]`).getByRole("combobox")
    for (const target of [ours, ui5]) {
      if (channel.startsWith("name")) await expect(target).toHaveAccessibleName("Country")
      else await expect(target).toHaveAccessibleDescription("Choose an office location")
      await expect(target).toHaveAttribute("aria-roledescription", "Listbox")
    }
  } finally { await reference.close() }
})

test("Select group summary and selection announcements preserve UI5 text and politeness", async ({ page, browser }) => {
  await page.goto("/index.html?fixtures&only=select-a11y-groups")
  await page.waitForSelector("html[data-ready=true]")
  const trigger = page.locator('[data-fixture="select-a11y-groups"]').getByRole("combobox")
  await expect(trigger).toHaveAccessibleDescription("3 results are available in 2 groups")
  const reference = await browser.newPage()
  try {
    await reference.goto("/ui5.html")
    await reference.waitForSelector("html[data-ready=true]")
    await expect(reference.locator('[data-fixture="select-a11y-groups"]').getByRole("combobox")).toHaveAccessibleDescription("3 results are available in 2 groups")
  } finally { await reference.close() }
  await trigger.focus()
  await expect(trigger).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(trigger).toHaveText("France")
  const live = page.locator('[data-slot="select-announcement"]')
  await expect(live).toHaveAttribute("aria-live", "polite")
  await expect(live).toHaveText("France")
  await page.keyboard.press("F4")
  const dialog = page.getByRole("dialog", { name: "Select Select", exact: true })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('[data-slot="select-announcement"]')).toHaveText("France List item 2 of 3")
})

test("Select lets callers override role, group and position texts", async ({ page }) => {
  await page.goto("/index.html#/select")
  await page.waitForSelector("html[data-ready=true]")
  const trigger = page.locator('#select-a11y-demo').getByRole("combobox")
  await expect(trigger).toHaveAttribute("aria-roledescription", "Country selector")
  await expect(trigger).toHaveAccessibleDescription("3 choices in 2 sections")
  await trigger.focus()
  await expect(trigger).toBeFocused()
  await page.keyboard.press("F4")
  await expect(page.locator('[data-slot="select-announcement"]')).toHaveText("Germany Choice 1 from 3")
})

for (const channel of ["name", "name-ref", "description", "description-ref"]) test(`Select RTL ${channel} keeps its native owning semantics`, async ({ page, browser }) => {
  const id = `select-a11y-${channel}-rtl`
  const reference = await browser.newPage()
  try {
    for (const [index, current] of [page, reference].entries()) {
      await current.goto(`/${index ? "ui5" : "index"}.html?fixtures&only=${id}`)
      await current.waitForSelector("html[data-ready=true]")
      const trigger = current.locator(`[data-fixture="${id}"]`).getByRole("combobox")
      if (channel.startsWith("name")) await expect(trigger).toHaveAccessibleName("Country")
      else await expect(trigger).toHaveAccessibleDescription("Choose an office location")
      await expect(trigger).toHaveCSS("direction", "rtl")
      await expect(trigger).toHaveAttribute("aria-roledescription", "Listbox")
    }
  } finally { await reference.close() }
})

test("Select RTL grouped options preserve UI5 vertical focus, selection and focus return", async ({ page, browser }) => {
  const id = "select-a11y-groups-rtl"
  const reference = await browser.newPage()
  try {
    for (const [index, current] of [page, reference].entries()) {
      await current.goto(`/${index ? "ui5" : "index"}.html?fixtures&only=${id}`)
      await current.waitForSelector("html[data-ready=true]")
      const trigger = current.locator(`[data-fixture="${id}"]`).getByRole("combobox")
      await expect(trigger).toHaveAccessibleDescription("3 results are available in 2 groups")
      await trigger.focus()
      await expect(trigger).toBeFocused()
      await current.keyboard.press("ArrowDown")
      await expect(trigger).toHaveText("France")
      await current.keyboard.press("F4")
      await expect(current.getByRole("option", { name: "France", exact: true })).toBeFocused()
      await current.keyboard.press("ArrowDown")
      await expect(current.getByRole("option", { name: "China", exact: true })).toBeFocused()
      await current.keyboard.press("Enter")
      await expect(trigger).toHaveText("China")
      await expect(trigger).toBeFocused()
    }
  } finally { await reference.close() }
})
