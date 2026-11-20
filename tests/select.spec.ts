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
  const dialog = page.getByRole("dialog", { name: "Select: Select", exact: true })
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
  const dialog = page.getByRole("dialog", { name: "Select: Select", exact: true })
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

test.describe("select: phone accessibility ownership", () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true })
  for (const [suffix, name] of [["name", "Shipping country"], ["name-ref", "Shipping country"], ["label", "Shipping country"], ["unnamed", "All Items"], ["name-ref-rtl", "Shipping country"]]) {
    test(`select: phone ${suffix} names dialog and list separately and follows live label updates`, async ({ page, browser }) => {
      const reference = await browser.newPage({ viewport: { width: 375, height: 667 }, hasTouch: true })
      try {
        for (const [current, native] of [[page, false], [reference, true]] as const) {
          await current.goto(`/${native ? "ui5" : "index"}.html?fixtures-phone&only=select-a11y-phone-${suffix}&interactive`)
          await current.waitForSelector("html[data-ready=true]")
          const holder = current.locator("#select-a11y-phone-demo")
          await holder.getByRole("combobox").click()
          const dialog = current.getByRole("dialog", { name: `Select: ${name}`, exact: true })
          await expect(dialog).toBeVisible()
          await expect(current.getByRole("listbox", { name, exact: true })).toHaveCount(1)
          await expect(current.getByRole("heading", { name: "All Items", exact: true })).toHaveCount(1)
          expect(await current.getByRole("heading", { name: "All Items", exact: true }).ariaSnapshot()).toContain("[level=2]")
          await current.keyboard.press("Escape")
          await expect(dialog).toHaveCount(0)
          if (suffix !== "unnamed") {
            await holder.locator("#select-a11y-phone-update-name").click()
            await expect(holder.getByRole("combobox")).toHaveAccessibleName("Billing country")
            await holder.getByRole("combobox").click()
            await expect(current.getByRole("dialog", { name: "Select: Billing country", exact: true })).toBeVisible()
            await expect(current.getByRole("listbox", { name: "Billing country", exact: true })).toHaveCount(1)
          }
        }
      } finally { await reference.close() }
    })
  }
  test("select: phone custom host preserves owned ARIA, refs, callbacks and Enter selection", async ({ page, browser }) => {
    const reference = await browser.newPage({ viewport: { width: 375, height: 667 }, hasTouch: true })
    try {
      for (const [current, native] of [[page, false], [reference, true]] as const) {
        await current.goto(`/${native ? "ui5" : "index"}.html?fixtures-phone&only=select-a11y-phone-custom&interactive`)
        await current.waitForSelector("html[data-ready=true]")
        const holder = current.locator("#select-a11y-phone-demo")
        await holder.getByRole("combobox").click()
        const dialog = current.getByRole("dialog", { name: "Select: Shipping country", exact: true })
        const selected = current.getByRole("option", { name: "Germany", exact: true })
        await expect(selected).toHaveAttribute("aria-selected", "true")
        await expect(selected).toHaveAttribute("tabindex", "0")
        await expect(selected).toBeFocused()
        const disabled = current.getByRole("option", { name: "Australia", exact: true })
        if (native) await expect(holder.locator("ui5-option[disabled]")).toHaveJSProperty("disabled", true)
        else await expect(disabled).toHaveAttribute("aria-disabled", "true")
        await expect(disabled).toHaveAttribute("tabindex", "-1")
        if (!native) {
          await expect(selected).toHaveAttribute("id", "select-a11y-phone-Germany")
          await expect(selected).toHaveAttribute("data-child-ref", "retained")
          await expect(selected).toHaveAttribute("data-value", "Germany")
          await expect(selected).not.toHaveAttribute("aria-checked")
        }
        await current.keyboard.press("Home")
        const first = current.getByRole("option", { name: "Argentina", exact: true })
        await expect(first).toBeFocused()
        await current.keyboard.press("Enter")
        await expect(dialog).toHaveCount(0)
        await expect(holder.getByRole("combobox")).toContainText("Argentina")
        await expect(holder.locator('[data-slot="select-a11y-phone-events"]')).toHaveText('["change:Argentina"]')
        await holder.getByRole("combobox").click()
        await current.getByRole("option", { name: "Germany", exact: true }).click()
        await expect(holder.locator('[data-slot="select-a11y-phone-events"]')).toHaveText(native ? '["change:Argentina","change:Germany"]' : '["change:Argentina","child:Germany","outer:Germany","change:Germany"]')
        await holder.getByRole("combobox").focus()
        await current.keyboard.press("Home")
        await expect(holder.getByRole("combobox")).toContainText("Argentina")
        await expect(holder.locator('[data-slot="select-a11y-phone-events"]')).toHaveText(native ? '["change:Argentina","change:Germany","change:Argentina"]' : '["change:Argentina","child:Germany","outer:Germany","change:Germany","change:Argentina"]')
      }
    } finally { await reference.close() }
  })
})
